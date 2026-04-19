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

// POST /loads
router.post("/loads", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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
    res.status(400).json({ error: params.error.message });
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

// PATCH /loads/:id
router.patch("/loads/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateLoadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [load] = await db.update(loadsTable).set(parsed.data).where(eq(loadsTable.id, id)).returning();
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  const enriched = await enrichLoad(load);
  res.json(enriched);
});

// DELETE /loads/:id
router.delete("/loads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteLoadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [load] = await db.delete(loadsTable).where(eq(loadsTable.id, params.data.id)).returning();
  if (!load) {
    res.status(404).json({ error: "Load not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
