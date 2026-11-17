import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const finderSubmissionsTable = pgTable("finder_submissions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  experience: text("experience"),
  location: text("location"),
  style: text("style"),
  guests: integer("guests"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  mustHaves: text("must_haves").array(),
  matchedCategories: text("matched_categories").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  consentGiven: boolean("consent_given").notNull().default(false),
  consentAt: timestamp("consent_at", { withTimezone: true }),
});
