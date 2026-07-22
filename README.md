# DaBills

Modern subscription and recurring billing management — track Netflix, Spotify, utilities, SaaS, gym memberships, and more in one premium dashboard.

> **Phase 2 — User Dashboard** is complete. Later phases add billing engine, OCR payments, notifications, admin portal, and production hardening.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Three Fiber |
| Backend | Next.js Server Actions + API Routes |
| Database / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend |
| OCR | Swappable providers (`OCR.space` / Google Vision ready) |
| Hosting | Vercel + Supabase |

## Features (Phase 1–2)

- Futuristic landing page with 3D hero, animated stats, and infinite subscription carousel
- Dark-first theme system (dark / light / system)
- Invite-code-only registration
- Supabase Auth (login / register / session middleware)
- Full database schema + RLS policies
- Enterprise folder structure (features, services, validators, emails)
- Swappable OCR provider architecture
- Resend email client + invite template
- Premium dashboard overview with animated counters and charts
- Subscription CRUD with categories, search, filter, and sort
- Monthly/yearly expense normalization and analytics
- Demo mode (cookie-backed) when Supabase is not configured

## Getting started

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Configure environment

Fill in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional until Phase 5)
- `OCR_PROVIDER` / `OCR_SPACE_API_KEY` (optional until Phase 4)

### 3. Apply database migrations

In the Supabase SQL editor (or via Supabase CLI), run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

This seeds:

- Plans (Starter → Enterprise)
- Categories (Streaming, Internet, …)
- Demo invite code: **`DABILLS-DEMO`**

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

## Project structure

```text
src/
  app/                 # App Router routes (marketing, auth, dashboard, api)
  components/          # UI, layout, landing, auth, providers
  features/            # Feature server actions (auth, invites)
  lib/                 # Utils, constants, env, supabase clients
  services/            # OCR + email providers
  emails/templates/    # HTML email templates
  validators/          # Zod schemas
  types/               # Shared TypeScript types
  hooks/               # Shared React hooks
supabase/migrations/   # SQL schema + RLS
```

## Authentication

Registration requires a valid invite code that is:

- Active
- Not expired
- Under its usage limit

Validation and consumption are atomic via `validate_and_consume_invite()`.

Without Supabase credentials, the UI still loads; invite validation falls back to `DABILLS-DEMO` for local preview.

## Roadmap

| Phase | Focus |
| --- | --- |
| 1 | Foundation |
| 2 | User dashboard + subscription CRUD + charts (this release) |
| 3 | Recurring billing engine |
| 4 | Payments + OCR |
| 5 | Notifications + email reminders |
| 6 | Admin portal |
| 7 | Polish, security hardening, deployment docs |

## License

Private — all rights reserved.
