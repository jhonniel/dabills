-- Allow service role JWT and privileged DB roles to set profiles.role (seeders).
-- Interactive users still require is_admin().
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.jwt() ->> 'role', '') = 'service_role'
       or coalesce(auth.role(), '') = 'service_role'
       or current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    if not public.is_admin() then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end;
$$;
