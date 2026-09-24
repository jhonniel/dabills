# Database migrations

Apply SQL files in `supabase/migrations/` **in numeric order** against your Supabase project.

| File | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Tables, enums, seed plans/categories, demo invite `DABILLS-DEMO` |
| `002_rls_policies.sql` | Row Level Security, helper RPCs (`is_admin`, `validate_and_consume_invite`), storage policies |
| `003_security_hardening.sql` | Role-change protection and hardening |
| `004_php_currency.sql` | Default currency PHP + plan prices in pesos |
| `005_payment_methods.sql` | Admin payment destinations (GCash/Maya/Bank) + RLS |
| `006_subscription_plans.sql` | Shared subscription plans with `max_capacity` + `subscriptions.plan_id` |
| `007_service_role_set_role.sql` | Allow service role to set `profiles.role` (for seeders) |
| `008_admin_expenses.sql` | Admin platform expenses (one-time / recurring + next date) |
| `009_payment_method_qr.sql` | `payment_methods.qr_image_url` + public `payment-qr` storage bucket |
| `010_account_status.sql` | `profiles.account_status` + claim/activation flow support |
| `011_profile_code_name.sql` | `profiles.code_name` admin-linked alias + unique index |
| `012_optional_profile_email.sql` | Allow `profiles.email` null until a claim link is sent |
| `013_notification_preferences.sql` | `profiles.notification_preferences` jsonb (shared across devices) |

## Seed accounts (local)

```bash
npm run db:seed
```

Creates / resets:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dabills.app` | `DaBillsAdmin1!` |
| User | `jordan@example.com` | `DaBillsUser1!` |

Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

**Important:** Apply migrations **001 → 013 in order**. Skipping `010` (account_status) while applying `011` (code_name) breaks admin user create/claim updates. If create account shows an unexpected error page, run `010` and `012` in the Supabase SQL editor, then retry. Apply `013` so notification preferences sync across admins/devices (not browser cookies).

When Supabase env vars are set, **all app data is read/written from the database**. Cookie-backed demo stores are only used when Supabase is not configured (local preview without credentials).

1. Admin configures pay-to methods at `/admin/payment-setup` (optional QR image per method).
2. Admin can create a user with **name only** (email optional). Email is required when sending/copying a **claim link**.
3. Claim link opens `/activate` — recipient sets a password (**no invite code**).
4. User settles a bill, sees those methods (and QR if uploaded), uploads a receipt.
5. OCR reads **amount** and **transfer reference** only. Match → payment `approved`, bill `paid`.
6. Receipt is **compressed** (JPEG, max 1600px) then stored in Supabase Storage (`receipts` bucket).
7. Missing amount/reference → `pending_verification` for `/admin/payments` review.

## Shared subscription plans

1. Admin creates a plan at `/admin/subscriptions/plans` (name, amount, billing cycle, **max capacity**).
2. Admin assigns a user seat at `/admin/subscriptions/assign` (pick plan + user).
3. Assignment is rejected when active/paused seats `>= max_capacity`.
4. Each seat creates a normal `subscriptions` row (with `plan_id`) and billing cycles for that user.

## Admin expenses

1. Admins track ops costs at `/admin/expenses`.
2. Expenses can be **one-time** or **recurring** (weekly → yearly / custom).
3. Recurring items store a **next recurrence date** (auto-calculated from expense date + frequency if left blank).

## How to apply

### Supabase SQL editor

1. Open **SQL** → New query.
2. Paste each file contents and run.
3. Confirm no errors before moving to the next file.

### Supabase CLI (optional)

```bash
supabase db push
# or link + migrate against remote
```

## Storage

Ensure a Storage bucket named `receipts` exists and is **private**. Policies in `002` / `003` restrict access to authenticated owners and admins.

Migration `009` creates a **public** `payment-qr` bucket for payment-method QR images shown on the settle screen.

## Admin bootstrap

After the first user registers:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Only admins can change `profiles.role` after `003_security_hardening.sql` is applied.

## Regenerating TypeScript types

```bash
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

Or use the local script hint in `package.json` (`npm run db:types`).
