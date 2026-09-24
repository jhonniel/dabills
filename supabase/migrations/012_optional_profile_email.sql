-- Allow admin-created profiles without an email until a claim link is sent
alter table public.profiles
  alter column email drop not null;
