# The WellNest Collection

## Overview

A premium, editorial-style UK property showcase website with a backend admin panel. Built as a pnpm workspace monorepo using TypeScript.

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

## Key Features

- **Homepage**: Hero section, category filters (8 categories), featured property grid
- **Collection page**: All properties with category + search filtering
- **Property detail page**: Image gallery, name, location, price, facilities, contact email
- **Admin panel** (`/admin`): Password-protected dashboard to add/edit/delete properties, set featured status
- **Admin password**: `wellnest2024` (set via `ADMIN_PASSWORD` environment variable in production)

## Categories

- Farmhouse stays
- Wild swimming spots with somewhere to stay
- Treehouses
- Shepherd huts / glamping
- Scottish Highlands stays
- Coastal retreats
- Unique spots
- Hidden Gems

## Database Schema

- `properties` table: id, name, category, location, nightly_price, guests, facilities (jsonb), contact_email, images (jsonb), featured, created_at, updated_at

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `SESSION_SECRET` — Secret for express-session (already set)
- `ADMIN_PASSWORD` — Admin panel password (default: wellnest2024)
- `DATABASE_URL` — PostgreSQL connection string (already set)

## Future Expansion Points

- Direct enquiry forms on property detail pages
- Map view using Leaflet or Google Maps
- Featured collections / curated editorial picks
- User accounts with saved properties
- Direct booking links integration
