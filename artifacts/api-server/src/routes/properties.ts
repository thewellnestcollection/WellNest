import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import {
  ListPropertiesQueryParams,
  GetPropertyParams,
  ListPropertiesResponse,
  GetPropertyResponse,
  GetPropertyCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
    latitude: p.latitude != null ? parseFloat(p.latitude) : null,
    longitude: p.longitude != null ? parseFloat(p.longitude) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(ListPropertiesResponse.parse(result));
});

// GET /api/properties/seasonal?season=autumn&year=2026
router.get("/properties/seasonal", async (req, res): Promise<void> => {
  const rawSeason = String(req.query.season || "");
  const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;

  // Normalise to title case to match DB values e.g. 'Autumn'
  const season = rawSeason.charAt(0).toUpperCase() + rawSeason.slice(1).toLowerCase();

  if (!["Winter", "Spring", "Summer", "Autumn"].includes(season) || !year || isNaN(year)) {
    res.status(400).json({ error: "season (winter|spring|summer|autumn) and year are required" });
    return;
  }

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(
      and(
        eq(propertiesTable.pickSeason, season),
        eq(propertiesTable.pickYear, year)
      )
    )
    .orderBy(propertiesTable.category);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(result);
});

// GET /api/properties/available-seasons
router.get("/properties/available-seasons", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ season: propertiesTable.pickSeason, year: propertiesTable.pickYear })
    .from(propertiesTable)
    .orderBy(propertiesTable.pickYear, propertiesTable.pickSeason);

  const seasonOrder: Record<string, number> = { Spring: 1, Summer: 2, Autumn: 3, Winter: 4 };

  const seasons = rows
    .filter((r) => r.season && r.year)
    .map((r) => ({
      season: r.season!.toLowerCase(),
      year: r.year!,
      label: `${r.season} ${r.year}`,
      sortKey: r.year! * 10 + (seasonOrder[r.season!] ?? 0),
    }))
    .sort((a, b) => a.sortKey - b.sortKey);

  res.json({ seasons });
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
      latitude: property.latitude != null ? parseFloat(property.latitude) : null,
      longitude: property.longitude != null ? parseFloat(property.longitude) : null,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    })
  );
});

export default router;
