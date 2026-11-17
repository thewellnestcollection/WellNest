// artifacts/api-server/src/routes/finder.ts

import { Router, type IRouter } from "express";
import { db, propertiesTable, finderSubmissionsTable } from "@workspace/db";
import { inArray, gte, and, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

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

router.post("/submit", async (req, res): Promise<void> => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const {
    email, firstName, experience, location, style, guests,
    budgetMin, budgetMax, mustHaves, matchedCategories, consentGiven, consentAt,
  } = parsed.data;

  try {
    const [submission] = await db
      .insert(finderSubmissionsTable)
      .values({
        email,
        firstName: firstName ?? null,
        experience,
        location,
        style,
        guests,
        budgetMin: budgetMin ?? null,
        budgetMax: budgetMax ?? null,
        mustHaves,
        matchedCategories,
        consentGiven,
        consentAt: consentAt ? new Date(consentAt) : new Date(),
      })
      .returning({ id: finderSubmissionsTable.id });

    const conditions: SQL[] = [
      inArray(propertiesTable.category, matchedCategories),
    ];

    if (budgetMax !== undefined) {
      conditions.push(sql`${propertiesTable.nightlyPrice}::numeric <= ${budgetMax}`);
    }
    if (budgetMin !== undefined) {
      conditions.push(sql`${propertiesTable.nightlyPrice}::numeric >= ${budgetMin}`);
    }
    if (guests > 1) {
      conditions.push(gte(propertiesTable.guests, guests));
    }

    const matchedProperties = await db
      .select()
      .from(propertiesTable)
      .where(and(...conditions))
      .orderBy(
        sql`${propertiesTable.featured} DESC NULLS LAST`,
        propertiesTable.name
      )
      .limit(12);

    const result = matchedProperties.map((p) => ({
      ...p,
      nightlyPrice: parseFloat(p.nightlyPrice),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    res.json({
      submissionId: submission.id,
      properties: result,
    });
  } catch (err) {
    console.error("[finder/submit] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
