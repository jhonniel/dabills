-- DaBills Phase 7: Security hardening extras
-- Run after 001 + 002. Safe to re-run.

-- Ensure receipts bucket is private
update storage.buckets
set public = false
where id = 'receipts';

-- Restrict invite RPC to authenticated + anon (already granted in 002)
-- Add comment documentation for operators
comment on function public.validate_and_consume_invite(text) is
  'Atomically validates and consumes an invite code during registration.';

comment on function public.is_admin() is
  'Returns true when the current auth.uid() profile role is admin.';

-- Helpful index for payment approval queues
create index if not exists idx_payments_status_created
  on public.payments (status, created_at desc);

create index if not exists idx_notifications_created
  on public.notifications (user_id, created_at desc);

-- Prevent role escalation by non-admins on profile updates
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
