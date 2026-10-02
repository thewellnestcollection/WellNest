import { Router, type IRouter } from "express";
import { eq, ilike, sql, and, inArray } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import {
  ListPropertiesQueryParams,
  GetPropertyParams,
  ListPropertiesResponse,
  GetPropertyResponse,
  GetPropertyCategoriesResponse,
  GetMonthlyPicksQueryParams,
  GetMonthlyPicksResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Season helpers
type Season = "winter" | "spring" | "summer" | "autumn";

function getSeasonMonths(season: Season): number[] {
  switch (season) {
    case "winter": return [12, 1, 2];
    case "spring": return [3, 4, 5];
    case "summer": return [6, 7, 8];
    case "autumn": return [9, 10, 11];
  }
}

function getSeasonYearFilter(season: Season, year: number): Array<{ month: number; year: number }> {
  // winter 2025/26 => Dec 2025 + Jan 2026 + Feb 2026  (year param = 2026)
  if (season === "winter") {
    return [
      { month: 12, year: year - 1 },
      { month: 1, year },
      { month: 2, year },
    ];
  }
  return getSeasonMonths(season).map((month) => ({ month, year }));
}

router.get("/properties", async (req, res): Promise<void> => {
  const query = ListPropertiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(propertiesTable).$dynamic();

  if (query.data.category) {
    dbQuery = dbQuery.where(eq(propertiesTable.category, query.data.category));
  } else if (query.data.search) {
    dbQuery = dbQuery.where(
      ilike(propertiesTable.name, `%${query.data.search}%`)
    );
  }

  const properties = await dbQuery.orderBy(propertiesTable.createdAt);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(ListPropertiesResponse.parse(result));
});

router.get("/properties/monthly", async (req, res): Promise<void> => {
  const query = GetMonthlyPicksQueryParams.safeParse({
    month: req.query.month ? parseInt(String(req.query.month), 10) : undefined,
    year: req.query.year ? parseInt(String(req.query.year), 10) : undefined,
  });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(
      and(
        eq(propertiesTable.pickMonth, query.data.month),
        eq(propertiesTable.pickYear, query.data.year)
      )
    )
    .orderBy(propertiesTable.category);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(GetMonthlyPicksResponse.parse(result));
});

// New: seasonal picks endpoint
// GET /api/properties/seasonal?season=winter&year=2026
router.get("/properties/seasonal", async (req, res): Promise<void> => {
  const season = String(req.query.season || "").toLowerCase() as Season;
  const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;

  if (!["winter", "spring", "summer", "autumn"].includes(season) || !year || isNaN(year)) {
    res.status(400).json({ error: "season (winter|spring|summer|autumn) and year are required" });
    return;
  }

  const filters = getSeasonYearFilter(season, year);

  // Build OR conditions: (month=12 AND year=2025) OR (month=1 AND year=2026) ...
  const orConditions = filters.map((f) =>
    and(eq(propertiesTable.pickMonth, f.month), eq(propertiesTable.pickYear, f.year))
  );

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(sql`(${orConditions.map((c) => sql`(${c})`).reduce((a, b) => sql`${a} OR ${b}`)})`)
    .orderBy(propertiesTable.pickYear, propertiesTable.pickMonth, propertiesTable.category);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(result);
});

// New: available seasons endpoint
// GET /api/properties/available-seasons
router.get("/properties/available-seasons", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ month: propertiesTable.pickMonth, year: propertiesTable.pickYear })
    .from(propertiesTable)
    .orderBy(propertiesTable.pickYear, propertiesTable.pickMonth);

  const seasonSet = new Map<string, { season: string; year: number; label: string; sortKey: number }>();

  for (const row of rows) {
    if (!row.month || !row.year) continue;

    let season: Season;
    let seasonYear: number;
    let label: string;

    const m = row.month;
    const y = row.year;

    if (m >= 3 && m <= 5) { season = "spring"; seasonYear = y; label = `Spring ${y}`; }
    else if (m >= 6 && m <= 8) { season = "summer"; seasonYear = y; label = `Summer ${y}`; }
    else if (m >= 9 && m <= 11) { season = "autumn"; seasonYear = y; label = `Autumn ${y}`; }
    else {
      // Dec = winter of y/y+1; Jan+Feb = winter of y-1/y
      season = "winter";
      seasonYear = m === 12 ? y + 1 : y;
      label = `Winter ${seasonYear - 1}/${String(seasonYear).slice(2)}`;
    }

    const key = `${season}-${seasonYear}`;
    if (!seasonSet.has(key)) {
      const sortKey = seasonYear * 10 + ["winter", "spring", "summer", "autumn"].indexOf(season);
      seasonSet.set(key, { season, year: seasonYear, label, sortKey });
    }
  }

  const seasons = Array.from(seasonSet.values()).sort((a, b) => a.sortKey - b.sortKey);
  res.json({ seasons });
});

router.get("/properties/available-months", async (req, res): Promise<void> => {
  const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
  if (!year || isNaN(year)) {
    res.status(400).json({ error: "year is required" });
    return;
  }

  const rows = await db
    .selectDistinct({ month: propertiesTable.pickMonth })
    .from(propertiesTable)
    .where(eq(propertiesTable.pickYear, year))
    .orderBy(propertiesTable.pickMonth);

  const months = rows
    .map((r) => r.month)
    .filter((m): m is number => m !== null);

  res.json({ year, months });
});

router.get("/properties/categories", async (_req, res): Promise<void> => {
  const stats = await db
    .select({
      category: propertiesTable.category,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(propertiesTable)
    .groupBy(propertiesTable.category)
    .orderBy(propertiesTable.category);

  res.json(GetPropertyCategoriesResponse.parse(stats));
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPropertyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [property] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, params.data.id));

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json(
    GetPropertyResponse.parse({
      ...property,
      nightlyPrice: parseFloat(property.nightlyPrice),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    })
  );
});

export default router;
