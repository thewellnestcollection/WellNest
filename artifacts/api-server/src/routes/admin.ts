import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminMeResponse,
  CreatePropertyBody,
  UpdatePropertyBody,
  UpdatePropertyParams,
  DeletePropertyParams,
  AdminListPropertiesResponse,
  UpdatePropertyResponse,
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
  res.json(AdminLoginResponse.parse({ success: true, message: "Logged in" }));
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
    .orderBy(propertiesTable.pickYear, propertiesTable.pickMonth, propertiesTable.category);

  const result = properties.map((p) => ({
    ...p,
    nightlyPrice: parseFloat(p.nightlyPrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  res.json(AdminListPropertiesResponse.parse(result));
});

router.post("/admin/properties", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

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
      images: parsed.data.images,
      featured: parsed.data.featured ?? false,
      pickMonth: parsed.data.pickMonth,
      pickYear: parsed.data.pickYear,
    })
    .returning();

  res.status(201).json({
    ...property,
    nightlyPrice: parseFloat(property.nightlyPrice),
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

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.nightlyPrice !== undefined) updateData.nightlyPrice = String(parsed.data.nightlyPrice);
  if (parsed.data.guests !== undefined) updateData.guests = parsed.data.guests;
  if (parsed.data.facilities !== undefined) updateData.facilities = parsed.data.facilities;
  if (parsed.data.contactEmail !== undefined) updateData.contactEmail = parsed.data.contactEmail;
  if (parsed.data.images !== undefined) updateData.images = parsed.data.images;
  if (parsed.data.featured !== undefined) updateData.featured = parsed.data.featured;
  if (parsed.data.pickMonth !== undefined) updateData.pickMonth = parsed.data.pickMonth;
  if (parsed.data.pickYear !== undefined) updateData.pickYear = parsed.data.pickYear;

  const [property] = await db
    .update(propertiesTable)
    .set(updateData)
    .where(eq(propertiesTable.id, params.data.id))
    .returning();

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json(
    UpdatePropertyResponse.parse({
      ...property,
      nightlyPrice: parseFloat(property.nightlyPrice),
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    })
  );
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

export default router;
