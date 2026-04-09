import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
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
