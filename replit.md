# The WellNest Collection

## Overview

A premium, editorial-style UK property showcase website with a "Property of the Month" concept. One curated property is selected per category per month, browseable via month/year tabs. Includes a password-protected admin panel. Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/wellnest) at path `/`
- **API framework**: Express 5 (artifacts/api-server) at path `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Fonts**: Playfair Display (serif headings), DM Sans (body)
- **Color**: Cream background (#F2EDE8 approx, HSL 30 30% 94%) matching the logo

## Key Features

- **Homepage**: "Property of the Month" hero, monthly picks grid (one per category), month/year tab navigation (18 months back, future-proof for multiple years), prev/next arrows
- **Collection page**: All properties with category + search filtering
- **Property detail page**: Image gallery, name, location, price, facilities, contact email
- **Admin panel** (`/admin`): Password-protected dashboard to add/edit/delete monthly picks, with month/year assignment and category selection
- **Admin password**: `wellnest2024` (set via `ADMIN_PASSWORD` environment variable in production)

## Categories (7 total)

- Farm
- Treehouse
- Cabin/Hut
- Cottage
- Pub with Rooms
- Boat
- Estate/Manor

## Database Schema

- `properties` table: id, name, category, location, nightly_price, guests, facilities (jsonb), contact_email, images (jsonb), featured, pick_month (integer), pick_year (integer), created_at, updated_at

## Key API Endpoints

- `GET /api/properties/monthly?month=4&year=2026` — Returns one property per category for a given month/year
- `GET /api/properties` — Lists all properties (with optional category/search filters)
- `GET /api/properties/categories` — Returns category stats
- `GET /api/properties/:id` — Property detail
- `POST /api/admin/login` — Admin login
- `GET/POST/PATCH/DELETE /api/admin/properties` — CRUD (admin-only)

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `SESSION_SECRET` — Secret for express-session (already set)
- `ADMIN_PASSWORD` — Admin panel password (default: wellnest2024)
- `DATABASE_URL` — PostgreSQL connection string (already set)

## Sample Data

21 properties seeded across 3 months:
- April 2026: 7 picks (one per category)
- March 2026: 7 picks
- February 2026: 7 picks

## Future Expansion Points

- Direct enquiry forms on property detail pages
- Map view using Leaflet or Google Maps
- User accounts with saved properties
- Direct booking links integration
