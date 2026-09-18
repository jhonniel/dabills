-- Platform / ops expenses managed by admins (one-time or recurring)

create type public.admin_expense_status as enum ('active', 'archived');

create table if not exists public.admin_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PHP',
  is_recurring boolean not null default false,
  billing_frequency public.billing_frequency,
  custom_interval_days integer check (
    custom_interval_days is null or custom_interval_days > 0
  ),
  expense_date date not null,
  next_recurrence_date date,
  status public.admin_expense_status not null default 'active',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint admin_expenses_recurring_check check (
    (
      is_recurring = false
      and billing_frequency is null
      and custom_interval_days is null
      and next_recurrence_date is null
    )
    or (
      is_recurring = true
      and billing_frequency is not null
      and next_recurrence_date is not null
    )
  ),
  constraint admin_expenses_custom_interval_check check (
    billing_frequency is distinct from 'custom'
    or custom_interval_days is not null
  )
);

create index if not exists idx_admin_expenses_status
  on public.admin_expenses (status);

create index if not exists idx_admin_expenses_next_recurrence
  on public.admin_expenses (next_recurrence_date)
  where is_recurring = true and status = 'active';

alter table public.admin_expenses enable row level security;

drop policy if exists "Admins manage admin expenses" on public.admin_expenses;
create policy "Admins manage admin expenses"
  on public.admin_expenses
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_admin_expenses_updated_at on public.admin_expenses;
create trigger set_admin_expenses_updated_at
  before update on public.admin_expenses
  for each row execute function public.set_updated_at();
