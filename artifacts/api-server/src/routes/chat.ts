import { Router, type IRouter } from "express";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// Smart trucking chatbot responses
const responses: Record<string, { message: string; quickReplies: string[] }> = {
  default: {
    message: "I'm your TruckLink AI assistant. I can help with load matching, route planning, bidding strategies, and fleet management. What can I help you with?",
    quickReplies: ["Show available loads", "Optimize my route", "Fleet status", "Bidding help"],
  },
  load: {
    message: "I found several loads matching your current location and truck specs. The highest-value load is Chicago to Los Angeles at $4,200 for 42,000 lbs dry van freight. Pickup available tomorrow morning.",
    quickReplies: ["Show all matches", "Sort by payout", "Filter by distance", "Place bid"],
  },
  route: {
    message: "For your Chicago to LA route, I recommend I-80 West via US-30. Estimated 32 hours drive time, 2,015 miles. There are 3 rest stops and 2 fuel stations along your optimized path. Estimated fuel cost: $485.",
    quickReplies: ["Show alternatives", "Avoid tolls", "Add fuel stops", "Calculate ETA"],
  },
  bid: {
    message: "Based on current market rates and this load's specs, a competitive bid would be $3,800-$4,100. The load has 3 bids already, average $3,650. I recommend bidding $3,950 to stay competitive while maximizing your margin.",
    quickReplies: ["Place bid now", "See other bids", "Market analysis", "Skip load"],
  },
  fleet: {
    message: "Fleet status: 6 trucks active, 4 in transit, 2 available, 1 in maintenance. Your top driver Mike Johnson is currently on a Dallas to Atlanta run — ETA 14 hours. Revenue this week: $28,400.",
    quickReplies: ["See live map", "Driver details", "Maintenance alerts", "Revenue report"],
  },
  fuel: {
    message: "Current diesel prices near your route: Pilot Flying J on I-80 at $4.12/gal, Love's at mile 342 at $4.08/gal, Flying J at $4.15/gal. Best fueling point is mile 342 — saves approximately $18 on your trip.",
    quickReplies: ["Navigate to station", "Price alerts", "Fuel budget", "Card discounts"],
  },
};

function getResponse(message: string): { message: string; quickReplies: string[] } {
  const lower = message.toLowerCase();

  if (lower.includes("load") || lower.includes("freight") || lower.includes("cargo") || lower.includes("match")) {
    return responses.load;
  }
  if (lower.includes("route") || lower.includes("navigate") || lower.includes("direction") || lower.includes("map")) {
    return responses.route;
  }
  if (lower.includes("bid") || lower.includes("price") || lower.includes("offer") || lower.includes("rate")) {
    return responses.bid;
  }
  if (lower.includes("fleet") || lower.includes("truck") || lower.includes("driver") || lower.includes("status")) {
    return responses.fleet;
  }
  if (lower.includes("fuel") || lower.includes("gas") || lower.includes("diesel") || lower.includes("fill")) {
    return responses.fuel;
  }

  return responses.default;
}

// POST /chat/message
router.post("/chat/message", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Simulate AI processing delay
  const response = getResponse(parsed.data.message);

  req.log.info({ userId: req.user!.id }, "Chat message processed");

  res.json({
    ...response,
    timestamp: new Date().toISOString(),
  });
});

export default router;
