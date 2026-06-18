import { createServer } from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { initSocket, emitEvent } from "./lib/socket";
import { db, trucksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening (http+socket.io)");
});

// One-time fix: update broken Volvo VNL 760 image URL
(async () => {
  try {
    const BROKEN = "https://rockwoodtruckcentre.com/wp-content/uploads/2025/08/WhatsApp-Image-2025-08-08-at-11.34.20-AM.jpeg";
    const FIXED  = "https://orion.soarr.com/photos/16454262/300x/2023-volvo-vnl+760.1.jpg";
    await db.update(trucksTable).set({ imageUrl: FIXED }).where(eq(trucksTable.imageUrl, BROKEN));
    logger.info("Volvo VNL 760 image URL patched");
  } catch (err) {
    logger.error({ err }, "Image URL patch failed (non-fatal)");
  }
})();

// Simulate truck movement for in-transit trucks every 5 seconds
const TRUCK_TICK_MS = 5000;
setInterval(async () => {
  try {
    const moving = await db
      .select()
      .from(trucksTable)
      .where(eq(trucksTable.status, "in_transit"));

    const updates = moving.map((truck) => {
      const lat = (truck.currentLat ?? 39.5) + (Math.random() - 0.5) * 0.05;
      const lng = (truck.currentLng ?? -98.0) + (Math.random() - 0.5) * 0.08;
      const speed = 55 + Math.random() * 15;
      return { id: truck.id, lat, lng, speed: Math.round(speed) };
    });

    if (updates.length === 0) return;

    await Promise.all(
      updates.map((u) =>
        db
          .update(trucksTable)
          .set({ currentLat: u.lat, currentLng: u.lng })
          .where(eq(trucksTable.id, u.id)),
      ),
    );

    emitEvent("trucks:positions", updates);
  } catch (err) {
    logger.error({ err }, "Truck simulator tick failed");
  }
}, TRUCK_TICK_MS);
