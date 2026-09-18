-- Account lifecycle for admin-provisioned users (activate later via email link)

create type public.account_status as enum ('pending', 'active', 'disabled');

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active';

create index if not exists idx_profiles_account_status
  on public.profiles (account_status);

-- New signups default to active; admin-created users set pending after insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_status text;
  resolved public.account_status := 'active';
begin
  meta_status := coalesce(new.raw_user_meta_data->>'account_status', 'active');
  if meta_status in ('pending', 'active', 'disabled') then
    resolved := meta_status::public.account_status;
  end if;

  insert into public.profiles (id, email, full_name, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    resolved
  );
  return new;
end;
$$;
