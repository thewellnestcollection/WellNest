import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, propertiesTable, newsletterSubscribersTable, finderSubmissionsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminMeResponse,
  CreatePropertyBody,
  UpdatePropertyBody,
  UpdatePropertyParams,
  DeletePropertyParams,
} from "@workspace/api-zod";
import type { Request, Response } from "express";

declare module "express-session" {
  interface SessionData {
    adminAuthenticated?: boolean;
  }
}

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "wellnest2024";

function requireAdmin(req: Request, res: Response): boolean {
  if (!req.session?.adminAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  req.session.adminAuthenticated = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed" });
      return;
    }
    res.json(AdminLoginResponse.parse({ success: true, message: "Logged in" }));
  });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const authenticated = req.session?.adminAuthenticated === true;
  res.json(AdminMeResponse.parse({ authenticated }));
});

router.get("/admin/properties", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const properties = await db
    .select()
    .from(propertiesTable)
    .orderBy(propertiesTable.pickYear, propertiesTable.pickSeason, propertiesTable.category);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    latitude: p.latitude != null ? parseFloat(p.latitude) : null,
    longitude: p.longitude != null ? parseFloat(p.longitude) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(result);
});

router.post("/admin/properties", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = req.body as any;

  const [property] = await db
    .insert(propertiesTable)
    .values({
      name: parsed.data.name,
      category: parsed.data.category,
      location: parsed.data.location,
      nightlyPrice: String(parsed.data.nightlyPrice),
      guests: parsed.data.guests,
      facilities: parsed.data.facilities,
      contactEmail: parsed.data.contactEmail,
      websiteUrl: parsed.data.websiteUrl ?? null,
      instagramHandle: parsed.data.instagramHandle ?? null,
      images: parsed.data.images,
      description: parsed.data.description ?? null,
      featured: parsed.data.featured ?? false,
      pickSeason: body.pickSeason ?? null,
      pickYear: parsed.data.pickYear,
      latitude: body.latitude != null ? String(body.latitude) : null,
      longitude: body.longitude != null ? String(body.longitude) : null,
    })
    .returning();

  res.status(201).json({
    ...property,
    nightlyPrice: parseFloat(property.nightlyPrice),
    latitude: property.latitude != null ? parseFloat(property.latitude) : null,
    longitude: property.longitude != null ? parseFloat(property.longitude) : null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  });
});

router.patch("/admin/properties/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePropertyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = req.body as any;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.nightlyPrice !== undefined) updateData.nightlyPrice = String(parsed.data.nightlyPrice);
  if (parsed.data.guests !== undefined) updateData.guests = parsed.data.guests;
  if (parsed.data.facilities !== undefined) updateData.facilities = parsed.data.facilities;
  if (parsed.data.contactEmail !== undefined) updateData.contactEmail = parsed.data.contactEmail;
  if (parsed.data.websiteUrl !== undefined) updateData.websiteUrl = parsed.data.websiteUrl;
  if (parsed.data.instagramHandle !== undefined) updateData.instagramHandle = parsed.data.instagramHandle;
  if (parsed.data.images !== undefined) updateData.images = parsed.data.images;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.featured !== undefined) updateData.featured = parsed.data.featured;
  if (body.pickSeason !== undefined) updateData.pickSeason = body.pickSeason;
  if (parsed.data.pickYear !== undefined) updateData.pickYear = parsed.data.pickYear;
  if (body.latitude !== undefined) updateData.latitude = body.latitude != null ? String(body.latitude) : null;
  if (body.longitude !== undefined) updateData.longitude = body.longitude != null ? String(body.longitude) : null;

  const [property] = await db
    .update(propertiesTable)
    .set(updateData)
    .where(eq(propertiesTable.id, params.data.id))
    .returning();

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json({
    ...property,
    nightlyPrice: parseFloat(property.nightlyPrice),
    latitude: property.latitude != null ? parseFloat(property.latitude) : null,
    longitude: property.longitude != null ? parseFloat(property.longitude) : null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  });
});

router.delete("/admin/properties/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePropertyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [property] = await db
    .delete(propertiesTable)
    .where(eq(propertiesTable.id, params.data.id))
    .returning();

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/admin/newsletter-subscribers", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const subscribers = await db
    .select()
    .from(newsletterSubscribersTable)
    .orderBy(desc(newsletterSubscribersTable.createdAt));
  res.json(subscribers);
});

router.get("/admin/finder-submissions", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const submissions = await db
    .select()
    .from(finderSubmissionsTable)
    .orderBy(desc(finderSubmissionsTable.createdAt));
  const result = submissions.map((s) => ({
    ...s,
    createdAt: s.createdAt?.toISOString() ?? null,
    consentAt: s.consentAt?.toISOString() ?? null,
    mustHaves: s.mustHaves ?? [],
    matchedCategories: s.matchedCategories ?? [],
  }));
  res.json(result);
});

router.delete("/admin/newsletter-subscribers/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db
    .delete(newsletterSubscribersTable)
    .where(eq(newsletterSubscribersTable.id, id))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Subscriber not found" }); return; }
  res.sendStatus(204);
});

router.delete("/admin/finder-submissions/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db
    .delete(finderSubmissionsTable)
    .where(eq(finderSubmissionsTable.id, id))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Submission not found" }); return; }
  res.sendStatus(204);
});

export default router;
