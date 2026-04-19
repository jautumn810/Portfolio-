import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { trucksTable } from "./trucks";

export const loadsTable = pgTable("loads", {
  id: serial("id").primaryKey(),
  shipperId: integer("shipper_id").notNull().references(() => usersTable.id),
  assignedDriverId: integer("assigned_driver_id").references(() => usersTable.id),
  assignedTruckId: integer("assigned_truck_id").references(() => trucksTable.id),
  title: text("title").notNull(),
  description: text("description"),
  freightType: text("freight_type").notNull().default("general"), // general | refrigerated | hazmat | oversized | automotive | livestock | electronics | furniture
  status: text("status").notNull().default("posted"), // posted | bidding | assigned | in_transit | delivered | cancelled
  originCity: text("origin_city").notNull(),
  originState: text("origin_state").notNull(),
  originLat: real("origin_lat").notNull(),
  originLng: real("origin_lng").notNull(),
  destCity: text("dest_city").notNull(),
  destState: text("dest_state").notNull(),
  destLat: real("dest_lat").notNull(),
  destLng: real("dest_lng").notNull(),
  weight: real("weight").notNull(),
  length: real("length"),
  budget: real("budget").notNull(),
  finalPrice: real("final_price"),
  pickupDate: timestamp("pickup_date", { withTimezone: true }).notNull(),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
  distance: real("distance"),
  specialInstructions: text("special_instructions"),
  bidCount: integer("bid_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoadSchema = createInsertSchema(loadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoad = z.infer<typeof insertLoadSchema>;
export type Load = typeof loadsTable.$inferSelect;
