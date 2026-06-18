import { Router, type IRouter } from "express";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type ChatResponse = { message: string; quickReplies: string[] };

// Multiple variants per topic — randomly selected so the bot never repeats itself
const responseVariants: Record<string, ChatResponse[]> = {
  load: [
    {
      message: "I found several loads matching your specs. Top pick: Chicago → Los Angeles, $4,200 for 42,000 lbs dry van. Pickup available tomorrow morning. Want me to sort by payout or distance?",
      quickReplies: ["Show highest payout", "Filter by distance", "See all open loads", "Help me bid"],
    },
    {
      message: "There are 4 loads near you right now. Best match: Dallas → Atlanta, $2,950 for 38,000 lbs flatbed. The shipper has a 4.8 rating and quick payment history. Interested?",
      quickReplies: ["Show load details", "Filter by freight type", "Nearby loads only", "Compare loads"],
    },
    {
      message: "Load board update: 12 open loads in your region. Highest value is a refrigerated run — Denver → Seattle, $5,100 for 40,000 lbs reefer freight. Pickup window: 6am–10am tomorrow.",
      quickReplies: ["Show reefer loads", "Show flatbed loads", "Filter by pickup date", "Place a bid"],
    },
    {
      message: "I'm scanning the board for you. Right now: 3 high-priority loads flagged as urgent — shippers are offering a 10% bonus for same-day pickup. Chicago area has the most activity today.",
      quickReplies: ["Show urgent loads", "Chicago area loads", "Sort by bonus pay", "Set load alerts"],
    },
  ],
  route: [
    {
      message: "For Chicago → LA I recommend I-80 West. That's about 2,015 miles, 32 hours drive time, estimated fuel cost $485. There are 3 Pilot Flying J stops along the way. Want to avoid tolls?",
      quickReplies: ["Avoid tolls", "Add rest stops", "Fuel stop locations", "Calculate ETA"],
    },
    {
      message: "Optimal route found: US-30 scenic alternative adds 2 hours but saves $64 in tolls. Current traffic shows a 45-minute delay near Denver — I'd suggest departing after 7pm to avoid it.",
      quickReplies: ["Avoid the delay", "Show toll-free route", "Weather on route", "Departure time tips"],
    },
    {
      message: "I calculated 3 route options for you. Fastest: I-70 at 28 hours. Cheapest fuel: US-40 at $412. Toll-free: US-30 at 31 hours, $0 tolls. Which matters most to you?",
      quickReplies: ["I want fastest", "I want cheapest", "No tolls please", "Show all 3 routes"],
    },
    {
      message: "Route analysis complete. Your current load requires a Hazmat-approved corridor — I've filtered out restricted roads. Recommended: I-80 with a permitted fuel stop at mile 682.",
      quickReplies: ["Show permitted route", "HazMat regulations", "Fuel at mile 682", "Alternative corridors"],
    },
  ],
  bid: [
    {
      message: "Market rates right now: average bid on this load type is $3,650. To win it, bid $3,950–$4,100. There are already 3 bids. My recommendation: go in at $3,975 — competitive without leaving money on the table.",
      quickReplies: ["Place bid at $3,975", "See competing bids", "Counter-offer tips", "Skip this load"],
    },
    {
      message: "Bidding intel: this shipper accepted bids within 2 hours on their last 5 loads. They favor drivers with 4.5+ ratings. Your rating qualifies. A bid of $4,050 has an 82% win probability based on current offers.",
      quickReplies: ["Place bid now", "Shipper history", "My win rate", "Negotiate higher"],
    },
    {
      message: "I analyzed 30 days of bids for this lane. Winning bids average $0.92/mile. Your target: $3,820–$4,080 for this run. Pro tip — bidding in the first 30 minutes increases win rate by 34%.",
      quickReplies: ["Bid now (time-sensitive)", "Per-mile breakdown", "Set bid alerts", "View lane history"],
    },
    {
      message: "You have 2 active bids pending right now. Load #1847 (Chicago→Dallas) has 6 competing bids, yours is currently 2nd highest. Load #1902 (Denver→Phoenix) — you're the only bidder. Want to adjust?",
      quickReplies: ["Adjust Chicago bid", "Denver load status", "Withdraw a bid", "New bid opportunity"],
    },
  ],
  fleet: [
    {
      message: "Fleet snapshot: 6 trucks active, 4 in transit, 2 available for dispatch. Mike Johnson is on I-80 westbound — ETA 14 hours to LA. Revenue this week: $28,400. One maintenance alert on Truck #7.",
      quickReplies: ["See live map", "Driver details", "Maintenance alerts", "Revenue report"],
    },
    {
      message: "Your top earner this month: Truck #3 (2022 Kenworth T680) — 3 completed loads, $14,200 revenue. Fuel efficiency is 7.1 mpg, above your fleet average of 6.5 mpg. Consider assigning it to the next high-value load.",
      quickReplies: ["Assign Truck #3", "Full fleet ranking", "Fuel efficiency report", "Dispatch now"],
    },
    {
      message: "Driver performance update: Sarah completed 8 loads this month with a 4.9 shipper rating — your best driver. 2 drivers haven't logged activity in 48 hours. Want me to send them available load alerts?",
      quickReplies: ["Alert inactive drivers", "Top driver details", "Assign new loads", "Driver scoreboard"],
    },
    {
      message: "Maintenance alert: Truck #7 is due for a DOT inspection in 12 days. Truck #2 has a low tire pressure warning (front left, 94 PSI). I recommend scheduling both for service before the next dispatch.",
      quickReplies: ["Schedule maintenance", "Full inspection report", "Override and dispatch", "Alert mechanic"],
    },
  ],
  fuel: [
    {
      message: "Diesel near your route: Pilot Flying J on I-80 at $4.12/gal, Love's at mile 342 at $4.08/gal (best deal), Flying J at $4.15/gal. Stopping at mile 342 saves ~$18 on this trip.",
      quickReplies: ["Navigate to Love's", "Price alerts", "Fuel card discounts", "Full trip fuel plan"],
    },
    {
      message: "Fuel cost forecast for your Chicago→LA run: $487 at current prices. If you wait until tomorrow, the DOE projection shows prices dropping $0.04/gal — saving you ~$9. Top tip: use your Loves or Pilot fleet card for an extra 3¢/gal off.",
      quickReplies: ["Fuel card savings", "Price forecast", "Cheapest stops on route", "Budget breakdown"],
    },
    {
      message: "I found 5 fuel stops on your route with DEF fluid available — essential for your 2022+ trucks. Best combined diesel+DEF price: TA Travel Center at mile 519, $4.06/gal diesel + $2.89/gal DEF.",
      quickReplies: ["Navigate to TA Center", "DEF locations only", "Diesel-only stops", "Add to route"],
    },
    {
      message: "Your fleet burned 1,240 gallons last week at an average of $4.09/gal — total fuel spend: $5,076. Compare that to the industry average of $5,430 for your route volume. You're running 6.5% under average. Great efficiency!",
      quickReplies: ["Week-over-week trend", "Efficiency by truck", "Reduce fuel costs", "Fuel budget report"],
    },
  ],
  default: [
    {
      message: "I'm your TruckLink AI dispatcher. I can help with load matching, route planning, bid strategy, fleet management, and fuel optimization. What can I help you with today?",
      quickReplies: ["Find me a load", "Plan my route", "Bidding help", "Fleet status"],
    },
    {
      message: "Got it! I specialize in trucking operations — loads, routes, bids, fleet, and fuel. Try asking something like 'find loads near Dallas' or 'what's my fleet status today.'",
      quickReplies: ["Loads near me", "Route optimizer", "My active bids", "Fleet overview"],
    },
    {
      message: "I didn't quite catch that, driver. I'm best with trucking questions — load matching, route optimization, bidding intel, fleet monitoring, or fuel prices. What do you need?",
      quickReplies: ["Show open loads", "Optimize a route", "Help with bids", "Fuel prices"],
    },
  ],
};

// Track last-used variant index per topic to avoid back-to-back repeats
const lastUsedIndex: Record<string, number> = {};

function getResponse(message: string): ChatResponse {
  const lower = message.toLowerCase();

  let topic = "default";
  if (lower.includes("load") || lower.includes("freight") || lower.includes("cargo") || lower.includes("match") || lower.includes("board")) {
    topic = "load";
  } else if (lower.includes("route") || lower.includes("navigate") || lower.includes("direction") || lower.includes("map") || lower.includes("eta") || lower.includes("miles") || lower.includes("drive")) {
    topic = "route";
  } else if (lower.includes("bid") || lower.includes("price") || lower.includes("offer") || lower.includes("rate") || lower.includes("market") || lower.includes("win")) {
    topic = "bid";
  } else if (lower.includes("fleet") || lower.includes("truck") || lower.includes("driver") || lower.includes("status") || lower.includes("dispatch") || lower.includes("assign")) {
    topic = "fleet";
  } else if (lower.includes("fuel") || lower.includes("gas") || lower.includes("diesel") || lower.includes("fill") || lower.includes("mpg") || lower.includes("station")) {
    topic = "fuel";
  }

  const variants = responseVariants[topic];
  const prev = lastUsedIndex[topic] ?? -1;

  // Pick a random index that's different from the last one used
  let idx: number;
  if (variants.length === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * variants.length);
    } while (idx === prev);
  }

  lastUsedIndex[topic] = idx;
  return variants[idx];
}

// POST /chat/message
router.post("/chat/message", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const response = getResponse(parsed.data.message);

  req.log.info({ userId: req.user!.id }, "Chat message processed");

  res.json({
    ...response,
    timestamp: new Date().toISOString(),
  });
});

export default router;
