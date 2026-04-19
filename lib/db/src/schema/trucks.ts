import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const trucksTable = pgTable("trucks", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  vin: text("vin"),
  truckType: text("truck_type").notNull().default("dry_van"), // flatbed | dry_van | reefer | tanker | step_deck | lowboy | conestoga | auto_carrier
  status: text("status").notNull().default("available"), // available | in_transit | maintenance | inactive
  maxWeight: real("max_weight").notNull(),
  maxLength: real("max_length").notNull(),
  color: text("color"),
  imageUrl: text("image_url"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  currentCity: text("current_city"),
  currentState: text("current_state"),
  mileage: integer("mileage").notNull().default(0),
  fuelLevel: real("fuel_level"),
  lastServiceDate: text("last_service_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTruckSchema = createInsertSchema(trucksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucksTable.$inferSelect;
