# Database migrations

Apply SQL files in `supabase/migrations/` **in numeric order** against your Supabase project.

| File | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Tables, enums, seed plans/categories, demo invite `DABILLS-DEMO` |
| `002_rls_policies.sql` | Row Level Security, helper RPCs (`is_admin`, `validate_and_consume_invite`), storage policies |
| `003_security_hardening.sql` | Private receipts bucket, indexes, profile role-escalation trigger |

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
