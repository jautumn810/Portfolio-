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
    res.status(400).json({ error: params.error.message });
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

// POST /bids
router.post("/bids", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bid] = await db.insert(bidsTable).values({
    ...parsed.data,
    bidderId: req.user!.id,
    estimatedPickup: parsed.data.estimatedPickup ? new Date(parsed.data.estimatedPickup) : null,
  }).returning();

  // Update bid count on load
  await db
    .update(loadsTable)
    .set({ bidCount: (await db.select().from(bidsTable).where(eq(bidsTable.loadId, parsed.data.loadId))).length })
    .where(eq(loadsTable.id, parsed.data.loadId));

  // Update load status to bidding
  await db.update(loadsTable).set({ status: "bidding" }).where(
    and(eq(loadsTable.id, parsed.data.loadId), eq(loadsTable.status, "posted"))
  );

  const enriched = await enrichBid(bid);
  req.log.info({ bidId: bid.id }, "Bid created");
  res.status(201).json(enriched);
});

// PATCH /bids/:id
router.patch("/bids/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bid] = await db.update(bidsTable).set(parsed.data).where(eq(bidsTable.id, params.data.id)).returning();
  if (!bid) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }

  // If bid accepted, assign driver to load
  if (parsed.data.status === "accepted") {
    await db.update(loadsTable).set({
      assignedDriverId: bid.bidderId,
      assignedTruckId: bid.truckId ?? undefined,
      status: "assigned",
      finalPrice: bid.amount,
    }).where(eq(loadsTable.id, bid.loadId));

    // Reject all other bids for this load
    await db.update(bidsTable).set({ status: "rejected" }).where(
      and(eq(bidsTable.loadId, bid.loadId))
    );
    // Re-accept the winning bid
    await db.update(bidsTable).set({ status: "accepted" }).where(eq(bidsTable.id, bid.id));
  }

  const enriched = await enrichBid(bid);
  req.log.info({ bidId: bid.id, status: parsed.data.status }, "Bid updated");
  res.json(enriched);
});

// DELETE /bids/:id
router.delete("/bids/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bid] = await db.delete(bidsTable).where(eq(bidsTable.id, params.data.id)).returning();
  if (!bid) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
