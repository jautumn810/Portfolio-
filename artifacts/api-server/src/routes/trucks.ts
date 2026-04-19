import { Router, type IRouter } from "express";
import { db, trucksTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListTrucksQueryParams,
  CreateTruckBody,
  GetTruckParams,
  UpdateTruckBody,
  DeleteTruckParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichTruck(truck: typeof trucksTable.$inferSelect) {
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, truck.ownerId));
  const { passwordHash: _, ...safeOwner } = owner || { passwordHash: "" };
  return { ...truck, owner: safeOwner };
}

// GET /trucks
router.get("/trucks", requireAuth, async (req, res): Promise<void> => {
  const query = ListTrucksQueryParams.safeParse(req.query);

  let dbQuery = db.select().from(trucksTable).$dynamic();

  if (query.success) {
    const conditions = [];
    if (query.data.status) conditions.push(eq(trucksTable.status, query.data.status));
    if (query.data.ownerId) conditions.push(eq(trucksTable.ownerId, query.data.ownerId));
    if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
  }

  const trucks = await dbQuery.orderBy(trucksTable.createdAt);
  const enriched = await Promise.all(trucks.map(enrichTruck));
  res.json(enriched);
});

// GET /trucks/telematics — must be before :id route
router.get("/trucks/telematics", requireAuth, async (req, res): Promise<void> => {
  const trucks = await db.select().from(trucksTable).where(eq(trucksTable.status, "in_transit"));

  const telematics = trucks.map((t) => ({
    truckId: t.id,
    lat: t.currentLat ?? 39.5 + Math.random() * 10,
    lng: t.currentLng ?? -98.0 + Math.random() * 20,
    speed: t.status === "in_transit" ? 55 + Math.random() * 20 : 0,
    heading: Math.random() * 360,
    fuelLevel: t.fuelLevel ?? 0.65 + Math.random() * 0.3,
    engineTemp: 185 + Math.random() * 30,
    status: t.status,
    lastUpdated: new Date().toISOString(),
  }));

  res.json(telematics);
});

// POST /trucks
router.post("/trucks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [truck] = await db.insert(trucksTable).values({
    ...parsed.data,
    ownerId: req.user!.id,
  }).returning();

  const enriched = await enrichTruck(truck);
  req.log.info({ truckId: truck.id }, "Truck created");
  res.status(201).json(enriched);
});

// GET /trucks/:id
router.get("/trucks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTruckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, params.data.id));
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }

  const enriched = await enrichTruck(truck);
  res.json(enriched);
});

// PATCH /trucks/:id
router.patch("/trucks/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [truck] = await db.update(trucksTable).set(parsed.data).where(eq(trucksTable.id, id)).returning();
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }

  const enriched = await enrichTruck(truck);
  res.json(enriched);
});

// DELETE /trucks/:id
router.delete("/trucks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTruckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [truck] = await db.delete(trucksTable).where(eq(trucksTable.id, params.data.id)).returning();
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
