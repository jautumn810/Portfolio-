import bcrypt from "bcryptjs";
import { db, usersTable, trucksTable, loadsTable, bidsTable } from "@workspace/db";

const PASSWORD_HASH = await bcrypt.hash("password123", 12);

const USERS = [
  { email: "admin@trucklink.com", name: "Alex Admin", role: "admin", company: "TruckLink Inc.", phone: "(555) 001-0001", rating: 5.0, totalLoads: 0 },
  { email: "sarah@trucklink.com", name: "Sarah Mitchell", role: "dispatcher", company: "Central Dispatch Co.", phone: "(555) 100-2001", rating: 4.9, totalLoads: 148 },
  { email: "mike@trucklink.com", name: "Mike Rodriguez", role: "driver", company: null, phone: "(555) 200-3001", rating: 4.7, totalLoads: 89 },
  { email: "james@trucklink.com", name: "James Wilson", role: "carrier", company: "Wilson Fleet LLC", phone: "(555) 300-4001", rating: 4.8, totalLoads: 210 },
  { email: "lisa@trucklink.com", name: "Lisa Chen", role: "shipper", company: "Chen Imports Corp.", phone: "(555) 400-5001", rating: 4.6, totalLoads: 75 },
  { email: "tom@trucklink.com", name: "Tom Bradley", role: "driver", company: null, phone: "(555) 200-3002", rating: 4.5, totalLoads: 62 },
  { email: "diana@trucklink.com", name: "Diana Foster", role: "dispatcher", company: "Midwest Dispatch", phone: "(555) 100-2002", rating: 4.8, totalLoads: 120 },
  { email: "carlos@trucklink.com", name: "Carlos Mendez", role: "driver", company: null, phone: "(555) 200-3003", rating: 4.6, totalLoads: 45 },
  { email: "anna@trucklink.com", name: "Anna Kowalski", role: "shipper", company: "AK Electronics", phone: "(555) 400-5002", rating: 4.7, totalLoads: 38 },
  { email: "bob@trucklink.com", name: "Bob Turner", role: "carrier", company: "Turner Trucking Inc.", phone: "(555) 300-4002", rating: 4.4, totalLoads: 155 },
];

async function main() {
  console.log("🚛 Seeding TruckLink database...");

  // Clear existing data
  await db.delete(bidsTable);
  await db.delete(loadsTable);
  await db.delete(trucksTable);
  await db.delete(usersTable);

  // Insert users
  const users = await db.insert(usersTable).values(
    USERS.map((u) => ({ ...u, passwordHash: PASSWORD_HASH }))
  ).returning();

  const byRole = (role: string) => users.filter((u) => u.role === role);
  const carriers = byRole("carrier");
  const drivers = byRole("driver");
  const shippers = byRole("shipper");
  const dispatchers = byRole("dispatcher");

  console.log(`✅ Created ${users.length} users`);

  // Create trucks
  const truckData = [
    // Red Volvo FH16 — hero truck
    {
      ownerId: carriers[0].id,
      make: "Volvo", model: "FH16", year: 2024, licensePlate: "TRK-VOLVO1", vin: "4V4NC9EH1EN123456",
      truckType: "flatbed", status: "in_transit", maxWeight: 48000, maxLength: 53,
      color: "Crimson Red", imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800",
      currentLat: 41.8827, currentLng: -87.6233, currentCity: "Chicago", currentState: "IL",
      mileage: 245000, fuelLevel: 0.72,
    },
    // Volvo VNL 860
    {
      ownerId: carriers[0].id,
      make: "Volvo", model: "VNL 860", year: 2023, licensePlate: "TRK-VOLVO2", vin: "4V4NC9EH1EN234567",
      truckType: "dry_van", status: "available", maxWeight: 45000, maxLength: 53,
      color: "Pearl White",
      currentLat: 33.4484, currentLng: -112.074, currentCity: "Phoenix", currentState: "AZ",
      mileage: 188000, fuelLevel: 0.89,
    },
    // Peterbilt 579
    {
      ownerId: carriers[1].id,
      make: "Peterbilt", model: "579", year: 2023, licensePlate: "TRK-PETE1", vin: "1XP5DB9X5LD678901",
      truckType: "reefer", status: "in_transit", maxWeight: 44000, maxLength: 53,
      color: "Midnight Black",
      currentLat: 29.7604, currentLng: -95.3698, currentCity: "Houston", currentState: "TX",
      mileage: 312000, fuelLevel: 0.55,
    },
    // Kenworth T680
    {
      ownerId: drivers[0].id,
      make: "Kenworth", model: "T680", year: 2022, licensePlate: "TRK-KENWRTH", vin: "2EXHG11X5TV789012",
      truckType: "dry_van", status: "available", maxWeight: 47000, maxLength: 53,
      color: "Glacier Blue",
      currentLat: 39.7392, currentLng: -104.9903, currentCity: "Denver", currentState: "CO",
      mileage: 405000, fuelLevel: 0.63,
    },
    // Freightliner Cascadia
    {
      ownerId: drivers[1].id,
      make: "Freightliner", model: "Cascadia", year: 2024, licensePlate: "TRK-FREIGHT1", vin: "3AKJGLD50FSGA0123",
      truckType: "tanker", status: "maintenance", maxWeight: 50000, maxLength: 48,
      color: "Safety Orange",
      currentLat: 36.1627, currentLng: -86.7816, currentCity: "Nashville", currentState: "TN",
      mileage: 178000, fuelLevel: 0.30,
    },
    // International LT
    {
      ownerId: carriers[0].id,
      make: "International", model: "LT Series", year: 2021, licensePlate: "TRK-INTL1", vin: "3HSDJSPR4MN012345",
      truckType: "flatbed", status: "available", maxWeight: 46000, maxLength: 48,
      color: "Forest Green",
      currentLat: 39.0997, currentLng: -94.5786, currentCity: "Kansas City", currentState: "MO",
      mileage: 520000, fuelLevel: 0.82,
    },
    // Mack Anthem
    {
      ownerId: carriers[1].id,
      make: "Mack", model: "Anthem", year: 2022, licensePlate: "TRK-MACK1", vin: "1M2AN07Y9CM000001",
      truckType: "step_deck", status: "in_transit", maxWeight: 43000, maxLength: 48,
      color: "Steel Grey",
      currentLat: 33.749, currentLng: -84.388, currentCity: "Atlanta", currentState: "GA",
      mileage: 290000, fuelLevel: 0.45,
    },
    // Western Star 5700
    {
      ownerId: drivers[2].id,
      make: "Western Star", model: "5700XE", year: 2023, licensePlate: "TRK-WEST1", vin: "5KKHBLJP8LPCA0001",
      truckType: "lowboy", status: "available", maxWeight: 80000, maxLength: 53,
      color: "Chrome Silver",
      currentLat: 47.6062, currentLng: -122.3321, currentCity: "Seattle", currentState: "WA",
      mileage: 95000, fuelLevel: 0.92,
    },
    // Peterbilt 389 (classic)
    {
      ownerId: carriers[0].id,
      make: "Peterbilt", model: "389", year: 2020, licensePlate: "TRK-PETE2", vin: "1XPFDB9X5LD000099",
      truckType: "auto_carrier", status: "available", maxWeight: 26000, maxLength: 75,
      color: "Burgundy",
      currentLat: 34.0522, currentLng: -118.2437, currentCity: "Los Angeles", currentState: "CA",
      mileage: 615000, fuelLevel: 0.68,
    },
    // Volvo VNL 760 — 2nd Volvo
    {
      ownerId: carriers[1].id,
      make: "Volvo", model: "VNL 760", year: 2022, licensePlate: "TRK-VOLVO3", vin: "4V4NC9EH1EN345678",
      truckType: "reefer", status: "available", maxWeight: 44000, maxLength: 53,
      color: "Arctic White",
      currentLat: 25.7617, currentLng: -80.1918, currentCity: "Miami", currentState: "FL",
      mileage: 210000, fuelLevel: 0.77,
    },
  ];

  const trucks = await db.insert(trucksTable).values(truckData).returning();
  console.log(`✅ Created ${trucks.length} trucks`);

  // Create loads
  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const loadsData = [
    {
      shipperId: shippers[0].id, title: "Industrial Equipment Chicago to LA",
      freightType: "oversized", status: "bidding",
      originCity: "Chicago", originState: "IL", originLat: 41.8827, originLng: -87.6233,
      destCity: "Los Angeles", destState: "CA", destLat: 34.0522, destLng: -118.2437,
      weight: 42000, length: 48, budget: 8500, distance: 2015,
      pickupDate: addDays(2), deliveryDate: addDays(7),
      specialInstructions: "Fragile machinery, requires flatbed and securement chains",
      bidCount: 3,
    },
    {
      shipperId: shippers[1].id, title: "Fresh Produce Miami to New York",
      freightType: "refrigerated", status: "in_transit",
      assignedDriverId: drivers[0].id, assignedTruckId: trucks[2].id,
      originCity: "Miami", originState: "FL", originLat: 25.7617, originLng: -80.1918,
      destCity: "New York", destState: "NY", destLat: 40.7128, destLng: -74.006,
      weight: 36000, length: 53, budget: 6200, finalPrice: 6000, distance: 1281,
      pickupDate: addDays(-1), deliveryDate: addDays(2),
      bidCount: 5,
    },
    {
      shipperId: shippers[0].id, title: "Auto Parts Houston to Atlanta",
      freightType: "automotive", status: "posted",
      originCity: "Houston", originState: "TX", originLat: 29.7604, originLng: -95.3698,
      destCity: "Atlanta", destState: "GA", destLat: 33.749, destLng: -84.388,
      weight: 28000, length: 40, budget: 4200, distance: 789,
      pickupDate: addDays(3), deliveryDate: addDays(5),
      bidCount: 0,
    },
    {
      shipperId: shippers[1].id, title: "Electronics Dallas to Denver",
      freightType: "electronics", status: "bidding",
      originCity: "Dallas", originState: "TX", originLat: 32.7767, originLng: -96.797,
      destCity: "Denver", destState: "CO", destLat: 39.7392, destLng: -104.9903,
      weight: 18000, length: 35, budget: 3800, distance: 920,
      pickupDate: addDays(1), deliveryDate: addDays(3),
      specialInstructions: "High-value electronics, GPS tracking required",
      bidCount: 2,
    },
    {
      shipperId: shippers[0].id, title: "Furniture Phoenix to Seattle",
      freightType: "furniture", status: "assigned",
      assignedDriverId: drivers[1].id, assignedTruckId: trucks[3].id,
      originCity: "Phoenix", originState: "AZ", originLat: 33.4484, originLng: -112.074,
      destCity: "Seattle", destState: "WA", destLat: 47.6062, destLng: -122.3321,
      weight: 22000, length: 48, budget: 5500, distance: 1425,
      pickupDate: addDays(4), deliveryDate: addDays(7),
      bidCount: 4,
    },
    {
      shipperId: shippers[1].id, title: "Chemical Tanker Kansas City to Nashville",
      freightType: "hazmat", status: "posted",
      originCity: "Kansas City", originState: "MO", originLat: 39.0997, originLng: -94.5786,
      destCity: "Nashville", destState: "TN", destLat: 36.1627, destLng: -86.7816,
      weight: 40000, length: 48, budget: 7200, distance: 552,
      pickupDate: addDays(5), deliveryDate: addDays(6),
      specialInstructions: "Hazmat Class 3 — certified driver and truck required",
      bidCount: 1,
    },
    {
      shipperId: shippers[0].id, title: "Livestock Transport Denver to Chicago",
      freightType: "livestock", status: "delivered",
      originCity: "Denver", originState: "CO", originLat: 39.7392, originLng: -104.9903,
      destCity: "Chicago", destState: "IL", destLat: 41.8827, destLng: -87.6233,
      weight: 32000, length: 53, budget: 5000, finalPrice: 4800, distance: 998,
      pickupDate: addDays(-10), deliveryDate: addDays(-7),
      bidCount: 6,
    },
    {
      shipperId: shippers[1].id, title: "General Freight Atlanta to Miami",
      freightType: "general", status: "posted",
      originCity: "Atlanta", originState: "GA", originLat: 33.749, originLng: -84.388,
      destCity: "Miami", destState: "FL", destLat: 25.7617, destLng: -80.1918,
      weight: 24000, length: 45, budget: 3200, distance: 665,
      pickupDate: addDays(2), deliveryDate: addDays(4),
      bidCount: 0,
    },
    {
      shipperId: shippers[0].id, title: "Volvo Auto Parts Seattle to Los Angeles",
      freightType: "automotive", status: "bidding",
      originCity: "Seattle", originState: "WA", originLat: 47.6062, originLng: -122.3321,
      destCity: "Los Angeles", destState: "CA", destLat: 34.0522, destLng: -118.2437,
      weight: 26000, length: 48, budget: 4600, distance: 1135,
      pickupDate: addDays(6), deliveryDate: addDays(8),
      bidCount: 2,
    },
    {
      shipperId: shippers[1].id, title: "Steel Beams New York to Chicago",
      freightType: "oversized", status: "posted",
      originCity: "New York", originState: "NY", originLat: 40.7128, originLng: -74.006,
      destCity: "Chicago", destState: "IL", destLat: 41.8827, destLng: -87.6233,
      weight: 45000, length: 53, budget: 9500, distance: 789,
      pickupDate: addDays(7), deliveryDate: addDays(9),
      specialInstructions: "Steel requires flatbed with ratchet straps",
      bidCount: 0,
    },
    {
      shipperId: shippers[0].id, title: "Frozen Food Houston to Dallas",
      freightType: "refrigerated", status: "delivered",
      originCity: "Houston", originState: "TX", originLat: 29.7604, originLng: -95.3698,
      destCity: "Dallas", destState: "TX", destLat: 32.7767, destLng: -96.797,
      weight: 30000, length: 53, budget: 2800, finalPrice: 2700, distance: 239,
      pickupDate: addDays(-5), deliveryDate: addDays(-4),
      bidCount: 3,
    },
    {
      shipperId: shippers[1].id, title: "Consumer Goods Los Angeles to Phoenix",
      freightType: "general", status: "in_transit",
      assignedDriverId: drivers[2].id, assignedTruckId: trucks[0].id,
      originCity: "Los Angeles", originState: "CA", originLat: 34.0522, originLng: -118.2437,
      destCity: "Phoenix", destState: "AZ", destLat: 33.4484, destLng: -112.074,
      weight: 20000, length: 40, budget: 2400, distance: 373,
      pickupDate: addDays(-2), deliveryDate: addDays(1),
      bidCount: 4,
    },
  ];

  const loads = await db.insert(loadsTable).values(loadsData as typeof loadsData[number][]).returning();
  console.log(`✅ Created ${loads.length} loads`);

  // Create bids for loads with bidCount > 0
  const biddingLoads = loads.filter((l) => l.bidCount > 0);
  const bidders = [...drivers, ...carriers];
  const bidsToInsert = [];

  for (const load of biddingLoads) {
    const numBids = Math.min(load.bidCount, 3);
    for (let i = 0; i < numBids; i++) {
      const bidder = bidders[i % bidders.length];
      if (bidder.id === load.shipperId) continue;
      const variance = (Math.random() - 0.5) * 0.2;
      const amount = Math.round(load.budget * (1 + variance));
      const status = load.status === "delivered" ? "accepted" : load.status === "assigned" ? (i === 0 ? "accepted" : "rejected") : "pending";
      bidsToInsert.push({
        loadId: load.id,
        bidderId: bidder.id,
        amount,
        status,
        note: i === 0 ? "Available and ready to haul. Clean record, 10+ years experience." : null,
      });
    }
  }

  if (bidsToInsert.length > 0) {
    await db.insert(bidsTable).values(bidsToInsert);
  }
  console.log(`✅ Created ${bidsToInsert.length} bids`);

  console.log("\n✅ Seed complete! Demo accounts:");
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email}  (password: password123)`));
}

main().catch((e) => { console.error(e); process.exit(1); }).then(() => process.exit(0));
