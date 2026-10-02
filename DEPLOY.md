# WellNest — Deployment Guide

## Stack
- **Frontend**: Vercel (React + Vite SPA)
- **API**: Railway (Express.js)
- **Database**: Supabase (PostgreSQL)

---

## 1. Supabase — set up the database

1. Create a new project at supabase.com
2. Go to **Settings → Database → Connection string** → copy the URI (use "Transaction" mode, port 6543)
3. Keep it handy — you'll need it for Railway and the `db push` step below

### Push the schema
After cloning the repo locally and running `pnpm install`:
```bash
DATABASE_URL="postgresql://..." pnpm --filter @workspace/db push
```
This creates all tables: `properties`, `newsletter_subscribers`, `finder_submissions`, `offers`, `offer_alert_subscribers`.

---

## 2. Railway — deploy the API

1. Create a new project at railway.app → **New Service → GitHub Repo**
2. Select the `WellNest` repo, root directory `/` (Railway reads `railway.json`)
3. Set these environment variables in Railway:
   - `DATABASE_URL` — your Supabase connection string (use the **direct** connection, port 5432)
   - `PORT` — Railway sets this automatically; leave it
   - `SESSION_SECRET` — any long random string (e.g. output of `openssl rand -hex 32`)
   - `ADMIN_PASSWORD` — password for the admin dashboard

4. Deploy. Once live, note the Railway domain (e.g. `https://wellnest-api.up.railway.app`)

---

## 3. Update vercel.json with your Railway URL

Open `vercel.json` and replace the Railway URL in the rewrites if needed:
```json
{ "source": "/api/:path*", "destination": "https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/:path*" }
```

---

## 4. Vercel — deploy the frontend

1. Push the repo to GitHub (thewellnestcollection/WellNest)
2. Go to vercel.com → **New Project → Import Git Repository**
3. Pick the repo — Vercel reads `vercel.json` automatically
4. No extra environment variables needed for the frontend
5. Set a custom domain: `wellnestcollection.com`

---

## Features deployed

### Seasonal picks (Home page)
- Season tabs replace month tabs: ❄ Winter · ✿ Spring · ☀ Summer · 🍂 Autumn
- Groups picks within a season by month
- Calls `/api/properties/available-seasons` and `/api/properties/seasonal`

### WellNest Finder (`/finder`)
- 6-question quiz: experience → location → style → guests → budget → must-haves
- Email gate before showing results (grows your list)
- Matches to property categories, saves submission to `finder_submissions` table
- Returns up to 6 matched properties from the current/recent seasonal picks

### Offer alerts (schema ready — UI coming next)
- `offers` table: stores parsed deal details (discount %, code, valid dates)
- `offer_alert_subscribers` table: email signups with category preferences
- Next step: add subscribe UI and a weekly digest email via Resend/SendGrid

---

## Admin dashboard
Visit `https://wellnestcollection.com/admin` to:
- Add/edit/remove properties
- Assign picks to seasons (pickMonth + pickYear fields)
- View newsletter subscribers

Login with the `ADMIN_PASSWORD` you set in Railway.
