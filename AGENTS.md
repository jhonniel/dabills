# DaBills

## Phase status
- Phase 1–7: complete
- Production docs: `docs/DEPLOYMENT.md`, `docs/DATABASE.md`, `docs/SECURITY.md`

## Local notes
- Admin portal: `/admin` (demo mode grants admin automatically without Supabase)
- With Supabase: set `profiles.role = 'admin'` for access
- Copy `.env.example` → `.env.local` before wiring services
- Health: `GET /api/health`
- After schema changes, apply `003_security_hardening.sql` as well as 001–002
