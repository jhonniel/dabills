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
| `011_profile_code_name.sql` | `profiles.code_name` admin-linked alias + unique index |

## Seed accounts (local)

```bash
npm run db:seed
```

Creates / resets:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@dabills.app` | `DaBillsAdmin1!` |
| User | `jordan@example.com` | `DaBillsUser1!` |

Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Apply migration `007` first if role updates fail.

1. Admin configures pay-to methods at `/admin/payment-setup` (optional QR image per method).
2. User settles a bill, sees those methods (and QR if uploaded), uploads a receipt.
3. OCR reads **amount** and **transfer reference** only. Match → payment `approved`, bill `paid`.
4. Receipt is **compressed** (JPEG, max 1600px) then stored in Supabase Storage (`receipts` bucket).
5. Missing amount/reference → `pending_verification` for `/admin/payments` review.

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
