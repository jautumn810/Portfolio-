import { Router, type IRouter } from "express";
import { db, loadsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListLoadsQueryParams,
  CreateLoadBody,
  GetLoadParams,
  UpdateLoadBody,
  DeleteLoadParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichLoad(load: typeof loadsTable.$inferSelect) {
  const [shipper] = await db.select().from(usersTable).where(eq(usersTable.id, load.shipperId));
  const { passwordHash: _, ...safeShipper } = shipper || { passwordHash: "" };
  return { ...load, shipper: safeShipper };
}

// GET /loads
router.get("/loads", requireAuth, async (req, res): Promise<void> => {
  const query = ListLoadsQueryParams.safeParse(req.query);

  let dbQuery = db.select().from(loadsTable).$dynamic();

  if (query.success) {
    const conditions = [];
    if (query.data.status) conditions.push(eq(loadsTable.status, query.data.status));
    if (query.data.shipperId) conditions.push(eq(loadsTable.shipperId, query.data.shipperId));
    if (query.data.assignedDriverId) conditions.push(eq(loadsTable.assignedDriverId, query.data.assignedDriverId));
    if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
  }

  const loads = await dbQuery.orderBy(loadsTable.createdAt);
  const enriched = await Promise.all(loads.map(enrichLoad));
  res.json(enriched);
});

// POST /loads — only shippers and admins
router.post("/loads", requireAuth, async (req, res): Promise<void> => {
  const role = req.user!.role;
  if (role !== "shipper" && role !== "admin" && role !== "dispatcher") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [load] = await db.insert(loadsTable).values({
    ...parsed.data,
    shipperId: req.user!.id,
    pickupDate: new Date(parsed.data.pickupDate),
    deliveryDate: new Date(parsed.data.deliveryDate),
  }).returning();

  const enriched = await enrichLoad(load);
  req.log.info({ loadId: load.id }, "Load created");
  res.status(201).json(enriched);
});

// GET /loads/:id
router.get("/loads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetLoadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid load ID" });
    return;
  }

  const [load] = await db.select().from(loadsTable).where(eq(loadsTable.id, params.data.id));
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  const enriched = await enrichLoad(load);
  res.json(enriched);
});

// PATCH /loads/:id — only load's shipper, dispatcher, or admin
router.patch("/loads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetLoadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid load ID" });
    return;
  }

  const [existing] = await db.select().from(loadsTable).where(eq(loadsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  const role = req.user!.role;
  const isOwner = existing.shipperId === req.user!.id;
  if (!isOwner && role !== "admin" && role !== "dispatcher") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [load] = await db
    .update(loadsTable)
    .set(parsed.data)
    .where(eq(loadsTable.id, params.data.id))
    .returning();

  const enriched = await enrichLoad(load);
  res.json(enriched);
});

// DELETE /loads/:id — only load's shipper or admin
router.delete("/loads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteLoadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid load ID" });
    return;
  }

  const [existing] = await db.select().from(loadsTable).where(eq(loadsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  const isOwner = existing.shipperId === req.user!.id;
  if (!isOwner && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(loadsTable).where(eq(loadsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
