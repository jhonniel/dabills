# DaBills

## Phase status
- Phase 1 (Foundation): complete
- Phase 2 (User Dashboard): complete
- Phase 3 (Recurring Billing Engine): complete
- Phase 4 (Payments & OCR): complete
- Phase 5+: pending

## Local notes
- Demo invite code after migrations: `DABILLS-DEMO`
- Without Supabase/OCR keys, payments use mock OCR + demo storage
- Settle flow: `/dashboard/billing/[id]/pay`
- Payment history: `/dashboard/payments`
- Copy `.env.example` → `.env.local` before wiring Supabase
