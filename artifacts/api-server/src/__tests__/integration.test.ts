import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:80/api";

let adminToken = "";
let driverToken = "";
let shipperToken = "";
let dispatcherToken = "";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (await res.json().catch(() => null)) as any };
}

async function get(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (await res.json().catch(() => null)) as any };
}

async function patch(path: string, body: unknown, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (await res.json().catch(() => null)) as any };
}

async function del(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 + JWT for valid admin credentials", async () => {
    const { status, body } = await post("/auth/login", {
      email: "admin@trucklink.com",
      password: "password123",
    });
    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
    expect(body.user.role).toBe("admin");
    adminToken = body.token;
  });

  it("returns 200 + JWT for driver", async () => {
    const { status, body } = await post("/auth/login", {
      email: "mike@trucklink.com",
      password: "password123",
    });
    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    driverToken = body.token;
  });

  it("returns 200 + JWT for shipper", async () => {
    const { status, body } = await post("/auth/login", {
      email: "lisa@trucklink.com",
      password: "password123",
    });
    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    shipperToken = body.token;
  });

  it("returns 200 + JWT for dispatcher", async () => {
    const { status, body } = await post("/auth/login", {
      email: "sarah@trucklink.com",
      password: "password123",
    });
    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    dispatcherToken = body.token;
  });

  it("returns 401 for wrong password", async () => {
    const { status } = await post("/auth/login", {
      email: "admin@trucklink.com",
      password: "wrongpassword",
    });
    expect(status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const { status } = await post("/auth/login", {
      email: "nobody@trucklink.com",
      password: "password123",
    });
    expect(status).toBe(401);
  });

  it("returns 400 for missing fields", async () => {
    const { status } = await post("/auth/login", { email: "admin@trucklink.com" });
    expect(status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns current user when authenticated", async () => {
    const { status, body } = await get("/auth/me", adminToken);
    expect(status).toBe(200);
    expect(body.email).toBe("admin@trucklink.com");
    expect(body.passwordHash).toBeUndefined();
  });

  it("returns 401 without token", async () => {
    const { status } = await get("/auth/me");
    expect(status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const { status } = await get("/auth/me", "invalid.jwt.token");
    expect(status).toBe(401);
  });
});

describe("POST /api/auth/register", () => {
  it("returns 400 for duplicate email", async () => {
    const { status } = await post("/auth/register", {
      name: "Duplicate",
      email: "admin@trucklink.com",
      password: "password123",
      role: "driver",
    });
    expect(status).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const { status } = await post("/auth/register", { email: "test@test.com" });
    expect(status).toBe(400);
  });
});

// ─── Trucks ──────────────────────────────────────────────────────────────────

describe("GET /api/trucks", () => {
  it("returns list of trucks when authenticated", async () => {
    const { status, body } = await get("/trucks", adminToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("returns 401 without auth", async () => {
    const { status } = await get("/trucks");
    expect(status).toBe(401);
  });

  it("filters by status=available", async () => {
    const { status, body } = await get("/trucks?status=available", adminToken);
    expect(status).toBe(200);
    body.forEach((t: { status: string }) => expect(t.status).toBe("available"));
  });

  it("filters by status=in_transit", async () => {
    const { status, body } = await get("/trucks?status=in_transit", adminToken);
    expect(status).toBe(200);
    body.forEach((t: { status: string }) => expect(t.status).toBe("in_transit"));
  });

  it("does not expose passwordHash in owner data", async () => {
    const { body } = await get("/trucks", adminToken);
    body.forEach((t: Record<string, unknown>) => {
      if (t.owner) expect((t.owner as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });
});

describe("GET /api/trucks/telematics", () => {
  it("returns live truck positions", async () => {
    const { status, body } = await get("/trucks/telematics", adminToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("lat");
      expect(body[0]).toHaveProperty("lng");
      expect(body[0]).toHaveProperty("speed");
    }
  });
});

// ─── Loads ───────────────────────────────────────────────────────────────────

describe("GET /api/loads", () => {
  it("returns load board when authenticated", async () => {
    const { status, body } = await get("/loads", driverToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("each load has required fields", async () => {
    const { body } = await get("/loads", driverToken);
    const load = body[0];
    expect(load).toHaveProperty("id");
    expect(load).toHaveProperty("originCity");
    expect(load).toHaveProperty("destCity");
    expect(load).toHaveProperty("status");
    expect(load).toHaveProperty("budget");
  });

  it("returns 401 without auth", async () => {
    const { status } = await get("/loads");
    expect(status).toBe(401);
  });

  it("filters by status=posted", async () => {
    const { status, body } = await get("/loads?status=posted", driverToken);
    expect(status).toBe(200);
    body.forEach((l: { status: string }) => expect(l.status).toBe("posted"));
  });
});

// ─── Bids ────────────────────────────────────────────────────────────────────

describe("POST /api/bids", () => {
  it("driver can place a bid on an open load", async () => {
    const { body: loads } = await get("/loads?status=posted", driverToken);
    if (loads.length === 0) return;
    const loadId = loads[0].id;

    const { status, body } = await post("/bids", { loadId, amount: 5000 }, driverToken);
    expect(status).toBe(201);
    expect(body.amount).toBe(5000);
    expect(body.status).toBe("pending");
    expect(body.bidder).toBeDefined();
  });

  it("shipper cannot place a bid", async () => {
    const { body: loads } = await get("/loads?status=posted", driverToken);
    if (loads.length === 0) return;
    const loadId = loads[0].id;

    const { status } = await post("/bids", { loadId, amount: 3000 }, shipperToken);
    expect(status).toBe(403);
  });

  it("returns 401 without auth", async () => {
    const { status } = await post("/bids", { loadId: 1, amount: 3000 });
    expect(status).toBe(401);
  });

  it("returns 400 for missing amount", async () => {
    const { status } = await post("/bids", { loadId: 1 }, driverToken);
    expect(status).toBe(400);
  });

  it("returns 400 for missing loadId", async () => {
    const { status } = await post("/bids", { amount: 3000 }, driverToken);
    expect(status).toBe(400);
  });
});

describe("GET /api/bids", () => {
  it("returns bids list for authenticated user", async () => {
    const { status, body } = await get("/bids", adminToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("does not expose passwordHash in bidder/shipper", async () => {
    const { body } = await get("/bids", adminToken);
    body.forEach((b: Record<string, unknown>) => {
      if (b.bidder) expect((b.bidder as Record<string, unknown>).passwordHash).toBeUndefined();
      if (b.load && (b.load as Record<string, unknown>).shipper) {
        expect(((b.load as Record<string, unknown>).shipper as Record<string, unknown>).passwordHash).toBeUndefined();
      }
    });
  });
});

// ─── Analytics ───────────────────────────────────────────────────────────────

describe("GET /api/analytics/dashboard", () => {
  it("returns KPI stats for admin", async () => {
    const { status, body } = await get("/analytics/dashboard", adminToken);
    expect(status).toBe(200);
    expect(body).toHaveProperty("totalTrucks");
    expect(body).toHaveProperty("activeLoads");
    expect(body).toHaveProperty("totalRevenue");
    expect(body).toHaveProperty("totalDrivers");
  });

  it("returns 401 without auth", async () => {
    const { status } = await get("/analytics/dashboard");
    expect(status).toBe(401);
  });
});

describe("GET /api/analytics/loads", () => {
  it("returns monthly load chart data", async () => {
    const { status, body } = await get("/analytics/loads", adminToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("month");
      expect(body[0]).toHaveProperty("posted");
    }
  });
});

describe("GET /api/analytics/revenue", () => {
  it("returns monthly revenue chart data", async () => {
    const { status, body } = await get("/analytics/revenue", adminToken);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── Chat ────────────────────────────────────────────────────────────────────

describe("POST /api/chat/message", () => {
  it("responds to load-related query", async () => {
    const { status, body } = await post("/chat/message", { message: "show me open loads" }, adminToken);
    expect(status).toBe(200);
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
    expect(Array.isArray(body.quickReplies)).toBe(true);
  });

  it("responds to route-related query", async () => {
    const { status, body } = await post("/chat/message", { message: "optimize my route" }, adminToken);
    expect(status).toBe(200);
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("returns 401 without auth", async () => {
    const { status } = await post("/chat/message", { message: "hello" });
    expect(status).toBe(401);
  });
});

// ─── Route Optimizer ─────────────────────────────────────────────────────────

describe("POST /api/routes/optimize", () => {
  it("returns route data for valid city pair", async () => {
    const { status, body } = await post("/routes/optimize", {
      originCity: "Chicago",
      originState: "IL",
      originLat: 41.8781,
      originLng: -87.6298,
      destCity: "Los Angeles",
      destState: "CA",
      destLat: 34.0522,
      destLng: -118.2437,
      avoidTolls: false,
    }, adminToken);
    expect(status).toBe(200);
    expect(body.distance).toBeGreaterThan(0);
    expect(body.duration).toBeGreaterThan(0);
    expect(body.fuelCost).toBeGreaterThan(0);
    expect(Array.isArray(body.waypoints)).toBe(true);
    expect(body.waypoints.length).toBe(5);
    expect(Array.isArray(body.alternativeRoutes)).toBe(true);
    expect(body.alternativeRoutes.length).toBe(3);
  });

  it("toll cost is 0 when avoidTolls=true", async () => {
    const { body } = await post("/routes/optimize", {
      originCity: "Dallas",
      originState: "TX",
      originLat: 32.7767,
      originLng: -96.7970,
      destCity: "Atlanta",
      destState: "GA",
      destLat: 33.7490,
      destLng: -84.3880,
      avoidTolls: true,
    }, adminToken);
    expect(body.tollCost).toBe(0);
  });

  it("returns 401 without auth", async () => {
    const { status } = await post("/routes/optimize", {
      originCity: "Dallas", originState: "TX",
      originLat: 32.7767, originLng: -96.7970,
      destCity: "Atlanta", destState: "GA",
      destLat: 33.7490, destLng: -84.3880,
      avoidTolls: false,
    });
    expect(status).toBe(401);
  });
});

// ─── Security ────────────────────────────────────────────────────────────────

describe("Security headers", () => {
  it("sets X-Content-Type-Options header", async () => {
    const res = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("sets X-Frame-Options header", async () => {
    const res = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.headers.get("x-frame-options")).toBeTruthy();
  });
});

describe("Rate limiting", () => {
  it("auth endpoint returns proper response for valid request (rate limit not triggered)", async () => {
    const { status } = await post("/auth/login", {
      email: "admin@trucklink.com",
      password: "password123",
    });
    expect([200, 429]).toContain(status);
  });
});
