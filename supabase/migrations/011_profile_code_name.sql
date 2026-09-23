-- Code name alias on user profiles (admin-managed)
alter table public.profiles
  add column if not exists code_name text;

create unique index if not exists idx_profiles_code_name_unique
  on public.profiles (lower(code_name))
  where code_name is not null and length(trim(code_name)) > 0;

create index if not exists idx_profiles_code_name
  on public.profiles (code_name);

comment on column public.profiles.code_name is
  'Admin-assigned code name / alias for the user profile';
