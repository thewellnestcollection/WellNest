/**
 * artifacts/api-server/src/routes/finder.ts
 *
 * POST /api/finder/submit
 *   - Saves the submission to finder_submissions
 *   - Queries properties whose category matches one of matchedCategories
 *     and whose nightly_price falls within budget (if provided)
 *   - Returns { properties: Property[], submissionId: number }
 *
 * To register in index.ts, add:
 *   import finderRouter from "./routes/finder.js";
 *   app.use("/api/finder", finderRouter);
 */

import { Router } from "express";
import { db } from "../db.js"; // adjust import path if yours differs
import { properties, finderSubmissions } from "../db/schema.js"; // adjust if yours differs
import { inArray, gte, lte, and, or, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// ── Validation schema ────────────────────────────────────────────────────────

const submitSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  experience: z.string(),
  location: z.string(),
  style: z.string(),
  guests: z.number().int().min(1).max(50),
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  mustHaves: z.array(z.string()),
  matchedCategories: z.array(z.string()),
  consentGiven: z.boolean(),
  consentAt: z.string().datetime().optional(),
});

// ── POST /api/finder/submit ───────────────────────────────────────────────────

router.post("/submit", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  }

  const {
    email,
    firstName,
    experience,
    location,
    style,
    guests,
    budgetMin,
    budgetMax,
    mustHaves,
    matchedCategories,
    consentGiven,
    consentAt,
  } = parsed.data;

  try {
    // 1. Save submission
    const [submission] = await db
      .insert(finderSubmissions)
      .values({
        email,
        first_name: firstName ?? null,
        experience,
        location,
        style,
        guests,
        budget_min: budgetMin ?? null,
        budget_max: budgetMax ?? null,
        must_haves: mustHaves,
        matched_categories: matchedCategories,
        consent_given: consentGiven,
        consent_at: consentAt ? new Date(consentAt) : new Date(),
      })
      .returning({ id: finderSubmissions.id });

    // 2. Query matching properties
    //    - category must be in matchedCategories
    //    - nightly_price within budget range (if provided)
    //    - guests capacity must be >= requested guests
    const conditions = [
      inArray(properties.category, matchedCategories),
    ];

    if (budgetMax !== undefined) {
      conditions.push(lte(properties.nightly_price, budgetMax));
    }
    if (budgetMin !== undefined) {
      conditions.push(gte(properties.nightly_price, budgetMin));
    }
    if (guests > 1) {
      conditions.push(gte(properties.guests, guests));
    }

    const matchedProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(
        // Featured properties first, then by name
        sql`${properties.featured} DESC`,
        properties.name
      )
      .limit(12);

    return res.json({
      submissionId: submission.id,
      properties: matchedProperties,
    });
  } catch (err) {
    console.error("[finder/submit] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
