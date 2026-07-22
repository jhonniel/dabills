-- DaBills Phase 1: Initial schema
-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'paused', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_frequency as enum (
    'weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly', 'custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.bill_status as enum (
    'upcoming', 'pending', 'overdue', 'pending_verification', 'paid', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending', 'pending_verification', 'approved', 'rejected', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'reminder_5d', 'reminder_3d', 'reminder_1d', 'due_today', 'overdue',
    'payment_received', 'payment_approved', 'payment_rejected',
    'subscription_renewed', 'system'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_tier as enum (
    'starter', 'personal', 'family', 'business', 'enterprise'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.email_status as enum ('queued', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Plans
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug public.plan_tier not null unique,
  name text not null,
  description text,
  price_monthly numeric(12, 2) not null default 0,
  price_yearly numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,
  max_subscriptions integer,
  max_members integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  plan_id uuid references public.plans (id) on delete set null,
  timezone text not null default 'UTC',
  notification_email boolean not null default true,
  notification_in_app boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Invite codes
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  max_uses integer,
  uses_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invite_codes_max_uses_check check (max_uses is null or max_uses > 0),
  constraint invite_codes_uses_count_check check (uses_count >= 0)
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  logo_url text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  billing_frequency public.billing_frequency not null default 'monthly',
  custom_interval_days integer check (custom_interval_days is null or custom_interval_days > 0),
  start_date date not null,
  renewal_date date not null,
  next_billing_date date not null,
  auto_renewal boolean not null default true,
  reminder_days integer[] not null default '{5,3,1}',
  status public.subscription_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Billing cycles
create table if not exists public.billing_cycles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  due_date date not null,
  status public.bill_status not null default 'upcoming',
  paid_at timestamptz,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  billing_cycle_id uuid not null references public.billing_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status public.payment_status not null default 'pending',
  reference_number text,
  merchant text,
  paid_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Payment receipts
create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size integer not null check (file_size > 0),
  ocr_provider text,
  ocr_raw jsonb,
  extracted_amount numeric(12, 2),
  extracted_reference text,
  extracted_date date,
  extracted_merchant text,
  confidence numeric(5, 2),
  amount_match boolean,
  created_at timestamptz not null default timezone('utc', now())
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  href text,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Activity logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Email logs
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  to_email text not null,
  subject text not null,
  template text not null,
  status public.email_status not null default 'queued',
  provider_id text,
  error text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_invite_codes_code on public.invite_codes (code);
create index if not exists idx_invite_codes_active on public.invite_codes (is_active);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);
create index if not exists idx_subscriptions_next_billing on public.subscriptions (next_billing_date);
create index if not exists idx_billing_cycles_user_id on public.billing_cycles (user_id);
create index if not exists idx_billing_cycles_due_date on public.billing_cycles (due_date);
create index if not exists idx_billing_cycles_status on public.billing_cycles (status);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payment_receipts_payment_id on public.payment_receipts (payment_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id, is_read);
create index if not exists idx_activity_logs_user_id on public.activity_logs (user_id);
create index if not exists idx_email_logs_user_id on public.email_logs (user_id);

-- Triggers
drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_invite_codes_updated_at on public.invite_codes;
create trigger set_invite_codes_updated_at before update on public.invite_codes
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_billing_cycles_updated_at on public.billing_cycles;
create trigger set_billing_cycles_updated_at before update on public.billing_cycles
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Validate and consume invite code (atomic)
create or replace function public.validate_and_consume_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.invite_codes%rowtype;
begin
  select * into invite_row
  from public.invite_codes
  where upper(code) = upper(trim(invite_code))
  for update;

  if not found then
    return false;
  end if;

  if invite_row.is_active is false then
    return false;
  end if;

  if invite_row.expires_at is not null and invite_row.expires_at < timezone('utc', now()) then
    return false;
  end if;

  if invite_row.max_uses is not null and invite_row.uses_count >= invite_row.max_uses then
    return false;
  end if;

  update public.invite_codes
  set uses_count = uses_count + 1,
      updated_at = timezone('utc', now())
  where id = invite_row.id;

  return true;
end;
$$;

-- Seed plans
insert into public.plans (slug, name, description, price_monthly, price_yearly, features, max_subscriptions, max_members, sort_order)
values
  ('starter', 'Starter', 'Essential tracking for personal subscriptions.', 0, 0,
   '["Up to 10 subscriptions","Upcoming bill reminders","Basic dashboard","Email reminders"]'::jsonb, 10, 1, 1),
  ('personal', 'Personal', 'Full visibility for individuals who want control.', 9, 90,
   '["Unlimited subscriptions","OCR receipt validation","Payment history","Analytics charts","Priority reminders"]'::jsonb, null, 1, 2),
  ('family', 'Family', 'Shared billing oversight for households.', 19, 190,
   '["Everything in Personal","Up to 5 members","Shared categories","Household analytics"]'::jsonb, null, 5, 3),
  ('business', 'Business', 'SaaS spend control for growing teams.', 49, 490,
   '["Everything in Family","Up to 25 members","Admin approvals","Audit logs","Export reports"]'::jsonb, null, 25, 4),
  ('enterprise', 'Enterprise', 'Custom controls, security, and scale.', 0, 0,
   '["Unlimited members","SSO-ready architecture","Custom SLAs","Dedicated support","Advanced security"]'::jsonb, null, null, 5)
on conflict (slug) do nothing;

-- Seed categories
insert into public.categories (slug, name, icon, color, sort_order) values
  ('streaming', 'Streaming', 'Tv', '#EF4444', 1),
  ('internet', 'Internet', 'Wifi', '#3B82F6', 2),
  ('insurance', 'Insurance', 'Shield', '#10B981', 3),
  ('utilities', 'Utilities', 'Zap', '#F59E0B', 4),
  ('software', 'Software', 'Code2', '#06B6D4', 5),
  ('gaming', 'Gaming', 'Gamepad2', '#8B5CF6', 6),
  ('education', 'Education', 'GraduationCap', '#EC4899', 7),
  ('cloud', 'Cloud', 'Cloud', '#0EA5E9', 8),
  ('business', 'Business', 'Briefcase', '#64748B', 9),
  ('health', 'Health', 'HeartPulse', '#F43F5E', 10),
  ('gym', 'Gym', 'Dumbbell', '#22C55E', 11),
  ('loans', 'Loans', 'Landmark', '#A855F7', 12),
  ('savings', 'Savings', 'PiggyBank', '#14B8A6', 13),
  ('others', 'Others', 'MoreHorizontal', '#94A3B8', 14)
on conflict (slug) do nothing;

-- Seed a demo invite code (change/disable in production)
insert into public.invite_codes (code, max_uses, note, is_active)
values ('DABILLS-DEMO', 100, 'Phase 1 demo invite code', true)
on conflict (code) do nothing;

-- Storage bucket for receipts (Phase 4)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;
