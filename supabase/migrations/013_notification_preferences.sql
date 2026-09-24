-- Detailed notification preferences (shared across devices; not cookie-local)
alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{
    "emailEnabled": true,
    "inAppEnabled": true,
    "reminder5d": true,
    "reminder3d": true,
    "reminder1d": true,
    "dueToday": true,
    "overdue": true,
    "paymentEvents": true
  }'::jsonb;
