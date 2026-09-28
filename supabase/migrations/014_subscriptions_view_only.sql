-- Users may hold many subscriptions. Only admins assign, update, or remove them.
-- Account holders can still read their own rows (dashboard, billing, reminders).

drop policy if exists "Users manage own subscriptions" on public.subscriptions;

drop policy if exists "Users view own subscriptions" on public.subscriptions;
create policy "Users view own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins manage subscriptions" on public.subscriptions;
create policy "Admins manage subscriptions"
  on public.subscriptions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
