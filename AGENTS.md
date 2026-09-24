# DaBills

## Phase status
- Phase 1–7: complete
- Production docs: `docs/DEPLOYMENT.md`, `docs/DATABASE.md`, `docs/SECURITY.md`

## Local notes
- Admin portal: `/admin` (demo mode grants admin automatically without Supabase)
- With Supabase: `npm run db:seed` → admin `admin@dabills.app` / `DaBillsAdmin1!`, user `jordan@example.com` / `DaBillsUser1!`
- Copy `.env.example` → `.env.local` before wiring services
- Health: `GET /api/health`
- After schema changes, apply migrations 001–012 in order
