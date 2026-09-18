-- QR image URL for payment destinations (shown when users settle bills)
alter table public.payment_methods
  add column if not exists qr_image_url text;

-- Public bucket so settle UI can display QR without signed URLs
insert into storage.buckets (id, name, public)
values ('payment-qr', 'payment-qr', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins upload payment QR" on storage.objects;
create policy "Admins upload payment QR"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Admins update payment QR" on storage.objects;
create policy "Admins update payment QR"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'payment-qr' and public.is_admin())
  with check (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Admins delete payment QR" on storage.objects;
create policy "Admins delete payment QR"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Public read payment QR" on storage.objects;
create policy "Public read payment QR"
  on storage.objects for select
  to public
  using (bucket_id = 'payment-qr');
