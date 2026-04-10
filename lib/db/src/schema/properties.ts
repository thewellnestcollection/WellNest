import { pgTable, text, serial, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }).notNull(),
  guests: integer("guests").notNull(),
  facilities: jsonb("facilities").$type<string[]>().notNull().default([]),
  contactEmail: text("contact_email").notNull(),
  websiteUrl: text("website_url"),
  instagramHandle: text("instagram_handle"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  pickMonth: integer("pick_month"),
  pickYear: integer("pick_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
