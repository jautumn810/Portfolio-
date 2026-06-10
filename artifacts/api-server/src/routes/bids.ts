import { Router, type IRouter } from "express";
import { db, bidsTable, usersTable, loadsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListBidsQueryParams,
  CreateBidBody,
  UpdateBidBody,
  UpdateBidParams,
  DeleteBidParams,
  GetLoadBidsParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { emitEvent } from "../lib/socket";

const router: IRouter = Router();

async function enrichBid(bid: typeof bidsTable.$inferSelect) {
  const [bidder] = await db.select().from(usersTable).where(eq(usersTable.id, bid.bidderId));
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, bid.loadId));
  const [loadShipper] = await db.select().from(usersTable).where(eq(usersTable.id, load?.shipperId ?? 0));

  const { passwordHash: _1, ...safeBidder } = bidder || { passwordHash: "" };
  const { passwordHash: _2, ...safeShipper } = loadShipper || { passwordHash: "" };

  return {
    ...bid,
    bidder: safeBidder,
    load: load ? { ...load, shipper: safeShipper } : null,
  };
}

// GET /loads/:id/bids
router.get("/loads/:id/bids", requireAuth, async (req, res): Promise<void> => {
  const params = GetLoadBidsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid load ID" });
    return;
  }

  const bids = await db.select().from(bidsTable).where(eq(bidsTable.loadId, params.data.id)).orderBy(bidsTable.createdAt);
  const enriched = await Promise.all(bids.map(enrichBid));
  res.json(enriched);
});

// GET /bids
router.get("/bids", requireAuth, async (req, res): Promise<void> => {
  const query = ListBidsQueryParams.safeParse(req.query);

  let dbQuery = db.select().from(bidsTable).$dynamic();

  if (query.success) {
    const conditions = [];
    if (query.data.bidderId) conditions.push(eq(bidsTable.bidderId, query.data.bidderId));
    if (query.data.loadId) conditions.push(eq(bidsTable.loadId, query.data.loadId));
    if (query.data.status) conditions.push(eq(bidsTable.status, query.data.status));
    if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
  }

  const bids = await dbQuery.orderBy(bidsTable.createdAt);
  const enriched = await Promise.all(bids.map(enrichBid));
  res.json(enriched);
});

// POST /bids — only carriers and drivers can bid
router.post("/bids", requireAuth, async (req, res): Promise<void> => {
  const role = req.user!.role;
  if (role !== "carrier" && role !== "driver" && role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  // Verify the load exists and is open for bidding
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, parsed.data.loadId));
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }
  if (load.status !== "posted" && load.status !== "bidding") {
    res.status(409).json({ error: "Load is not open for bidding" });
    return;
  }

  const [bid] = await db.insert(bidsTable).values({
    ...parsed.data,
    bidderId: req.user!.id,
    estimatedPickup: parsed.data.estimatedPickup ? new Date(parsed.data.estimatedPickup) : null,
  }).returning();

  // Update bid count on load
  const allBids = await db.select().from(bidsTable).where(eq(bidsTable.loadId, parsed.data.loadId));
  await db
    .update(loadsTable)
    .set({ bidCount: allBids.length })
    .where(eq(loadsTable.id, parsed.data.loadId));

  // Transition load status to bidding
  await db.update(loadsTable).set({ status: "bidding" }).where(
    and(eq(loadsTable.id, parsed.data.loadId), eq(loadsTable.status, "posted"))
  );

  const enriched = await enrichBid(bid);
  req.log.info({ bidId: bid.id }, "Bid created");
  emitEvent("bid:created", enriched);
  emitEvent("load:updated", { id: parsed.data.loadId });
  res.status(201).json(enriched);
});

// PATCH /bids/:id — only the load's shipper or admin may accept/reject
router.patch("/bids/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid bid ID" });
    return;
  }

  const parsed = UpdateBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [existing] = await db.select().from(bidsTable).where(eq(bidsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }

  // Only the shipper of the load (or admin/dispatcher) can accept/reject bids
  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, existing.loadId));
  const role = req.user!.role;
  const isLoadOwner = load?.shipperId === req.user!.id;
  if (!isLoadOwner && role !== "admin" && role !== "dispatcher") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [bid] = await db.update(bidsTable).set(parsed.data).where(eq(bidsTable.id, params.data.id)).returning();

  if (parsed.data.status === "accepted") {
    await db.update(loadsTable).set({
      assignedDriverId: bid.bidderId,
      assignedTruckId: bid.truckId ?? undefined,
      status: "assigned",
      finalPrice: bid.amount,
    }).where(eq(loadsTable.id, bid.loadId));

    // Reject all other bids for this load, then re-accept the winner
    await db.update(bidsTable).set({ status: "rejected" }).where(eq(bidsTable.loadId, bid.loadId));
    await db.update(bidsTable).set({ status: "accepted" }).where(eq(bidsTable.id, bid.id));
  }

  const enriched = await enrichBid(bid);
  req.log.info({ bidId: bid.id, status: parsed.data.status }, "Bid updated");
  emitEvent("bid:updated", enriched);
  emitEvent("load:updated", { id: bid.loadId });
  res.json(enriched);
});

// DELETE /bids/:id — only the bidder or admin can withdraw
router.delete("/bids/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid bid ID" });
    return;
  }

  const [existing] = await db.select().from(bidsTable).where(eq(bidsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }

  const isBidder = existing.bidderId === req.user!.id;
  if (!isBidder && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Prevent withdrawing an already-accepted bid
  if (existing.status === "accepted") {
    res.status(409).json({ error: "Cannot withdraw an accepted bid" });
    return;
  }

  await db.delete(bidsTable).where(eq(bidsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
