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
  description: text("description"),
  featured: boolean("featured").notNull().default(false),
  pickMonth: integer("pick_month"),
  pickYear: integer("pick_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;

export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(newsletterSubscribersTable).omit({ id: true, createdAt: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;

// WellNest Finder — quiz submissions with email gate
export const finderSubmissionsTable = pgTable("finder_submissions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  experience: text("experience").notNull(),       // e.g. "rest", "adventure", "romance", "family", "solo"
  location: text("location").notNull(),            // e.g. "countryside", "coast", "woodland", "village", "remote"
  style: text("style").notNull(),                  // e.g. "rustic", "modern", "historic", "eco"
  guests: integer("guests").notNull(),             // number of guests
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  mustHaves: jsonb("must_haves").$type<string[]>().notNull().default([]),
  matchedCategories: jsonb("matched_categories").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinderSubmissionSchema = createInsertSchema(finderSubmissionsTable).omit({ id: true, createdAt: true });
export type InsertFinderSubmission = z.infer<typeof insertFinderSubmissionSchema>;
export type FinderSubmission = typeof finderSubmissionsTable.$inferSelect;

// Offer alerts — offer details scraped/parsed from hotel newsletters
export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => propertiesTable.id),
  propertyName: text("property_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountPercent: integer("discount_percent"),
  discountCode: text("discount_code"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  sourceEmail: text("source_email"),
  rawContent: text("raw_content"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;

// Offer alert subscribers — people who want to receive the weekly deal digest
export const offerAlertSubscribersTable = pgTable("offer_alert_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]), // [] = all categories
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferAlertSubscriberSchema = createInsertSchema(offerAlertSubscribersTable).omit({ id: true, createdAt: true });
export type InsertOfferAlertSubscriber = z.infer<typeof insertOfferAlertSubscriberSchema>;
export type OfferAlertSubscriber = typeof offerAlertSubscribersTable.$inferSelect;
