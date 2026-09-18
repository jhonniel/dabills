-- Shared subscription plans with seat capacity
create type public.subscription_plan_status as enum ('active', 'archived');

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  logo_url text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PHP',
  billing_frequency public.billing_frequency not null default 'monthly',
  custom_interval_days integer check (custom_interval_days is null or custom_interval_days > 0),
  max_capacity integer not null check (max_capacity > 0),
  status public.subscription_plan_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_subscription_plans_status
  on public.subscription_plans (status);

alter table public.subscriptions
  add column if not exists plan_id uuid references public.subscription_plans (id) on delete set null;

create index if not exists idx_subscriptions_plan_id
  on public.subscriptions (plan_id);

alter table public.subscription_plans enable row level security;

-- Admins manage all plans
drop policy if exists "Admins manage subscription plans" on public.subscription_plans;
create policy "Admins manage subscription plans"
  on public.subscription_plans
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Users can read plans they hold a seat on
drop policy if exists "Users read seated subscription plans" on public.subscription_plans;
create policy "Users read seated subscription plans"
  on public.subscription_plans
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.subscriptions s
      where s.plan_id = subscription_plans.id
        and s.user_id = auth.uid()
    )
  );

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();
