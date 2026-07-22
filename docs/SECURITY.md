# Security

DaBills Phase 7 security baseline.

## Application

- **Origin check** on mutating server actions (`assertSameOrigin`)
- **In-memory rate limits** on auth, invite validation, payments, and sensitive admin actions
- **Zod validation** on all user inputs
- **Plain-text sanitization** on payment notes / rejection reasons
- **HTML escaping** in email templates
- **Security headers** via `next.config.ts` (CSP, frame options, nosniff, referrer policy)
- **`poweredByHeader: false`**
- Cron routes require `Authorization: Bearer $CRON_SECRET`

## Database (RLS)

- Users only read/write their own subscriptions, bills, payments, notifications
- Admin helpers (`is_admin()`) gate elevated policies
- Invite consumption is atomic via `validate_and_consume_invite`
- Profile role changes blocked for non-admins (`protect_profile_role` trigger in `003`)
- Receipts storage bucket is private

## Secrets

Never commit:

- `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- OCR / Resend API keys

Use Vercel project env vars for production. Rotate `CRON_SECRET` if leaked.

## Rate limiting note

Default limiter is process memory (`src/lib/security/rate-limit.ts`). Fine for single-region soft abuse protection. For multi-instance / multi-region, replace with Redis or Upstash.

## Reporting

Treat this as a private app. For production incidents, rotate keys and review Supabase Auth + Storage audit logs.
