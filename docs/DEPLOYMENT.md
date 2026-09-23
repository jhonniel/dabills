# Deployment guide

Production checklist for deploying DaBills to Vercel + Supabase.

## 1. Supabase

1. Create a Supabase project.
2. In the SQL editor, run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_security_hardening.sql`
3. Create a private Storage bucket named `receipts` (migration 002/003 expect it). Migration `009` also creates a public `payment-qr` bucket for payment-method QR images.
4. Copy Project URL, anon key, and service role key into Vercel env vars.
5. Promote at least one user to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## 2. Vercel project

1. Import the Git repository into Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Set environment variables (see [Environment variables](#3-environment-variables)).
4. Deploy. Cron jobs from `vercel.json` are registered automatically on Pro plans.
5. Confirm `/api/health` returns `status: "ok"` and `phase: 7`.

### Cron auth

Each cron route expects:

```http
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron injects this when `CRON_SECRET` is set in the project env.

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for
**Production** (and Preview if you use preview deploys). Copy values from your
local `.env.local` — `.env.local` is never deployed.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase → API → `service_role` (server-only) |
| `CRON_SECRET` | Yes (prod) | Strong random secret for cron routes |
| `RESEND_API_KEY` | Optional | Without it, emails mock-log |
| `RESEND_FROM_EMAIL` | Optional | Verified sender domain in Resend |
| `OCR_PROVIDER` | Optional | `ocrspace` (default), `google-vision`, or `mock` |
| `OCR_SPACE_API_KEY` | For ocrspace | Free key from [ocr.space/ocrapi](https://ocr.space/ocrapi) |
| `GOOGLE_VISION_API_KEY` | If google-vision | Vision API key |

After saving env vars, **Redeploy** (Deployments → … → Redeploy).  
`NEXT_PUBLIC_*` values are baked in at build time.

Confirm with `/api/health` — `checks.supabaseConfigured` should be `true`.

## 4. Post-deploy smoke test

1. Open the marketing site and register with a fresh invite (or `DABILLS-DEMO` only in local demo mode).
2. Create a subscription → confirm a billing cycle appears.
3. Upload a receipt on `/dashboard/billing/[id]/pay`.
4. Approve the payment from `/admin/payments` (admin user).
5. Trigger or wait for cron: generate bills, refresh statuses, process reminders.
6. Hit `/api/health` and confirm checks look correct.

## 5. Local production build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

## Demo mode

If Supabase env vars are missing or still placeholders, the app runs in **demo mode** (cookie-backed stores). Do not use demo mode in production — always configure real Supabase credentials.
