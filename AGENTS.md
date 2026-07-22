# DaBills

## Phase status
- Phase 1 (Foundation): complete
- Phase 2 (User Dashboard): complete
- Phase 3 (Recurring Billing Engine): complete
- Phase 4+: pending

## Local notes
- Demo invite code after migrations: `DABILLS-DEMO`
- Without Supabase, dashboard/billing run in demo mode
- Cron endpoints: `/api/cron/generate-bills`, `/api/cron/refresh-bill-statuses`, `/api/cron/schedule-reminders`
- Copy `.env.example` → `.env.local` before wiring Supabase
