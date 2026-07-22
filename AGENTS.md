# DaBills

## Phase status
- Phase 1 (Foundation): complete
- Phase 2 (User Dashboard): complete
- Phase 3 (Recurring Billing Engine): complete
- Phase 4 (Payments & OCR): complete
- Phase 5 (Notifications): complete
- Phase 6+: pending

## Local notes
- Notification settings: `/dashboard/settings/notifications`
- Process reminders: Settings → “Process due reminders” or `/api/cron/process-reminders`
- Without `RESEND_API_KEY`, emails are mock-logged locally
- Copy `.env.example` → `.env.local` before wiring Supabase / Resend
