import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { loadsTable } from "./loads";
import { trucksTable } from "./trucks";

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id").notNull().references(() => loadsTable.id),
  bidderId: integer("bidder_id").notNull().references(() => usersTable.id),
  truckId: integer("truck_id").references(() => trucksTable.id),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected | withdrawn
  note: text("note"),
  estimatedPickup: timestamp("estimated_pickup", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;
