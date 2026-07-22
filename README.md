# DaBills

Modern subscription and recurring billing management — track Netflix, Spotify, utilities, SaaS, gym memberships, and more in one premium dashboard.

> **Phase 7 — Polish & Production** is complete. The app is ready for Vercel + Supabase deployment.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Three Fiber |
| Backend | Next.js Server Actions + API Routes |
| Database / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend |
| OCR | Swappable providers (`OCR.space` / Google Vision / mock) |
| Hosting | Vercel + Supabase |

## Features

- Futuristic landing page with 3D hero, animated stats, and infinite subscription carousel
- Dark-first theme system (dark / light / system)
- Invite-code-only registration
- Premium dashboard with charts, subscription CRUD, and billing cycle views
- Recurring billing engine + Vercel Cron jobs
- Receipt upload, OCR validation, and payment approval workflow
- In-app notifications + Reminder / payment emails
- Admin portal (users, invites, payments, categories, analytics, logs)
- Security hardening: RLS, rate limits, CSP headers, origin checks
- Error / not-found boundaries, loading skeletons, a11y polish

## Getting started

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Configure environment

See `.env.example` and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Minimum for local demo: leave Supabase placeholders and use invite code **`DABILLS-DEMO`**.

For a real backend, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (production)

Optional: Resend + OCR keys.

### 3. Apply database migrations

Run in order (Supabase SQL editor or CLI):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_security_hardening.sql`

Details: [docs/DATABASE.md](docs/DATABASE.md).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # start production server
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Supabase production setup |
| [docs/DATABASE.md](docs/DATABASE.md) | Migrations, storage, admin bootstrap |
| [docs/SECURITY.md](docs/SECURITY.md) | RLS, rate limits, headers, secrets |

## Project structure

```text
src/
  app/                 # App Router (marketing, auth, dashboard, admin, api)
  components/          # UI, layout, landing, feature panels
  features/            # Server actions + queries per domain
  lib/                 # Env, billing, security, supabase clients
  services/            # OCR + email providers
  emails/templates/    # HTML email templates
  validators/          # Zod schemas
  types/               # Shared TypeScript types
supabase/migrations/   # SQL schema + RLS + hardening
docs/                  # Deployment, database, security guides
```

## Authentication

Registration requires a valid invite code (active, not expired, under usage limit). Consumption is atomic via `validate_and_consume_invite()`.

Without Supabase credentials, the UI runs in **demo mode**; use `DABILLS-DEMO`. Demo mode grants admin at `/admin` automatically.

## Health check

`GET /api/health` returns service status, config checks, and `phase: 7`.

## Roadmap

| Phase | Focus | Status |
| --- | --- | --- |
| 1 | Foundation | Done |
| 2 | User dashboard + subscription CRUD | Done |
| 3 | Recurring billing engine | Done |
| 4 | Payments + OCR | Done |
| 5 | Notifications + email reminders | Done |
| 6 | Admin portal | Done |
| 7 | Polish, security, deployment docs | Done |

## License

Private — all rights reserved.
