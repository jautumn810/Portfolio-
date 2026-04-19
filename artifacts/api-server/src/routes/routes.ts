import { Router, type IRouter } from "express";
import { OptimizeRouteBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// Calculate distance between two lat/lng points (Haversine formula)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /routes/optimize
router.post("/routes/optimize", requireAuth, async (req, res): Promise<void> => {
  const parsed = OptimizeRouteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { originCity, originState, originLat, originLng, destCity, destState, destLat, destLng, avoidTolls } = parsed.data;

  const distance = haversineDistance(originLat, originLng, destLat, destLng);
  const roadDistance = distance * 1.22; // Road factor
  const duration = roadDistance / 55; // avg 55 mph
  const fuelCost = (roadDistance / 6.5) * 4.10; // 6.5 mpg, $4.10/gal diesel
  const tollCost = avoidTolls ? 0 : roadDistance * 0.08;

  // Generate intermediate waypoints
  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  const waypoints = [
    {
      city: originCity,
      state: originState,
      lat: originLat,
      lng: originLng,
      type: "origin" as const,
    },
    {
      city: "Rest Area",
      state: originState,
      lat: originLat + (destLat - originLat) * 0.25,
      lng: originLng + (destLng - originLng) * 0.25,
      type: "rest_stop" as const,
    },
    {
      city: "Fuel Stop",
      state: originState,
      lat: midLat - (destLat - originLat) * 0.05,
      lng: midLng - (destLng - originLng) * 0.05,
      type: "fuel_stop" as const,
    },
    {
      city: "Rest Area",
      state: destState,
      lat: originLat + (destLat - originLat) * 0.75,
      lng: originLng + (destLng - originLng) * 0.75,
      type: "rest_stop" as const,
    },
    {
      city: destCity,
      state: destState,
      lat: destLat,
      lng: destLng,
      type: "destination" as const,
    },
  ];

  const alternativeRoutes = [
    {
      name: "Fastest Route (I-80)",
      distance: Math.round(roadDistance),
      duration: Math.round(duration * 10) / 10,
      fuelCost: Math.round(fuelCost),
      tollCost: Math.round(tollCost),
    },
    {
      name: "Scenic Route (US-30)",
      distance: Math.round(roadDistance * 1.08),
      duration: Math.round(duration * 1.15 * 10) / 10,
      fuelCost: Math.round(fuelCost * 1.08),
      tollCost: 0,
    },
    {
      name: "Toll-Free Route",
      distance: Math.round(roadDistance * 1.15),
      duration: Math.round(duration * 1.2 * 10) / 10,
      fuelCost: Math.round(fuelCost * 1.15),
      tollCost: 0,
    },
  ];

  req.log.info({ origin: `${originCity}, ${originState}`, dest: `${destCity}, ${destState}`, distance: Math.round(roadDistance) }, "Route optimized");

  res.json({
    distance: Math.round(roadDistance),
    duration: Math.round(duration * 10) / 10,
    fuelCost: Math.round(fuelCost),
    tollCost: Math.round(tollCost),
    waypoints,
    alternativeRoutes,
  });
});

export default router;
