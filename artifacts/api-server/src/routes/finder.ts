import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, finderSubmissionsTable, propertiesTable } from "@workspace/db";
import { eq, or, and, gte, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

const FinderSubmitBody = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  experience: z.enum(["rest", "adventure", "romance", "family", "solo"]),
  location: z.enum(["countryside", "coast", "woodland", "village", "remote"]),
  style: z.enum(["rustic", "modern", "historic", "eco"]),
  guests: z.number().int().min(1).max(20),
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  mustHaves: z.array(z.string()).default([]),
  matchedCategories: z.array(z.string()).default([]),
});

// POST /api/finder/submit — save quiz answers and return matching properties
router.post("/finder/submit", async (req, res): Promise<void> => {
  const body = FinderSubmitBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { email, firstName, experience, location, style, guests, budgetMin, budgetMax, mustHaves, matchedCategories } = body.data;

  // Save submission (upsert by email — last quiz wins)
  try {
    await db.insert(finderSubmissionsTable).values({
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
    });
  } catch (_e) {
    // Non-fatal — still return results
  }

  // Fetch current seasonal picks that match the categories
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get the last 3 months of picks so there's always something to show
  const monthFilters: Array<{ month: number; year: number }> = [];
  for (let i = 0; i < 3; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y -= 1; }
    monthFilters.push({ month: m, year: y });
  }

  const orConds = monthFilters.map((f) =>
    and(eq(propertiesTable.pickMonth, f.month), eq(propertiesTable.pickYear, f.year))
  );

  let dbQuery = db
    .select()
    .from(propertiesTable)
    .where(sql`(${orConds.map((c) => sql`(${c})`).reduce((a, b) => sql`${a} OR ${b}`)})`)
    .$dynamic();

  const allPicks = await dbQuery.orderBy(propertiesTable.pickYear, propertiesTable.pickMonth, propertiesTable.category);

  // Filter to matched categories, fall back to all if empty match
  let matched = matchedCategories.length > 0
    ? allPicks.filter((p) => matchedCategories.includes(p.category))
    : allPicks;

  if (matched.length === 0) matched = allPicks;

  // Apply budget filter if provided
  if (budgetMax) {
    const budgetFiltered = matched.filter((p) => parseFloat(p.nightlyPrice) <= budgetMax);
    if (budgetFiltered.length > 0) matched = budgetFiltered;
  }

  const result = matched.slice(0, 6).map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json({ properties: result });
});

export default router;
