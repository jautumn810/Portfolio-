import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetUserParams, UpdateUserBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { emitEvent } from "../lib/socket";

const router: IRouter = Router();

// GET /users
router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
  res.json(safeUsers);
});

// GET /drivers — all drivers with their locations
router.get("/drivers", requireAuth, async (req, res): Promise<void> => {
  const drivers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "driver"));
  const safeDrivers = drivers.map(({ passwordHash: _, ...u }) => u);
  res.json(safeDrivers);
});

// GET /users/:id
router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// PATCH /users/:id — only own profile or admin
router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const targetId = params.data.id;
  const isAdmin = req.user!.role === "admin";
  if (!isAdmin && req.user!.id !== targetId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, targetId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;

  // Broadcast live location update for drivers
  if (
    user.role === "driver" &&
    parsed.data.currentLat != null &&
    parsed.data.currentLng != null
  ) {
    emitEvent("driver:location", {
      id: user.id,
      name: user.name,
      lat: user.currentLat,
      lng: user.currentLng,
    });
  }

  res.json(safeUser);
});

export default router;
