-- Payment destinations configured by admins (where users send money)
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  account_name text not null,
  account_number text not null,
  instructions text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payment_methods_active
  on public.payment_methods (is_active, sort_order);

alter table public.payment_methods enable row level security;

-- Authenticated users can read active methods (to settle bills)
drop policy if exists "Users read active payment methods" on public.payment_methods;
create policy "Users read active payment methods"
  on public.payment_methods
  for select
  to authenticated
  using (is_active = true or public.is_admin());

-- Admins manage all methods
drop policy if exists "Admins manage payment methods" on public.payment_methods;
create policy "Admins manage payment methods"
  on public.payment_methods
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();
