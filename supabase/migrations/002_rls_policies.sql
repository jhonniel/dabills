-- DaBills Phase 1: Row Level Security policies

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.plans enable row level security;
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_cycles enable row level security;
alter table public.payments enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.email_logs enable row level security;

-- Helper: is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Plans (public read)
create policy "Anyone can read active plans"
  on public.plans for select
  using (is_active = true or public.is_admin());

create policy "Admins manage plans"
  on public.plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- Categories (public read)
create policy "Anyone can read categories"
  on public.categories for select
  using (true);

create policy "Admins manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- Invite codes: authenticated users can validate via RPC; admins manage
create policy "Admins manage invite codes"
  on public.invite_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Allow anonymous/authenticated to check invite existence via limited select
-- Prefer validate_and_consume_invite RPC for registration.
create policy "Service role manages invites via RPC"
  on public.invite_codes for select
  using (public.is_admin());

-- Subscriptions
create policy "Users manage own subscriptions"
  on public.subscriptions for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Billing cycles
create policy "Users manage own billing cycles"
  on public.billing_cycles for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Payments
create policy "Users manage own payments"
  on public.payments for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Payment receipts
create policy "Users manage own receipts"
  on public.payment_receipts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Notifications
create policy "Users manage own notifications"
  on public.notifications for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Activity logs
create policy "Users can view own activity"
  on public.activity_logs for select
  using (auth.uid() = user_id or auth.uid() = actor_id or public.is_admin());

create policy "Authenticated users can insert activity"
  on public.activity_logs for insert
  with check (auth.uid() = actor_id or public.is_admin());

create policy "Admins manage activity logs"
  on public.activity_logs for all
  using (public.is_admin())
  with check (public.is_admin());

-- Email logs (admin only)
create policy "Admins manage email logs"
  on public.email_logs for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can view own email logs"
  on public.email_logs for select
  using (auth.uid() = user_id);

-- Storage policies for receipts
create policy "Users can upload own receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Users can delete own receipts"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- Grant execute on invite RPC to anon/authenticated for registration
grant execute on function public.validate_and_consume_invite(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
