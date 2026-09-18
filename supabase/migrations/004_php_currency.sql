-- Default currency: Philippine Peso
alter table public.subscriptions
  alter column currency set default 'PHP';

alter table public.billing_cycles
  alter column currency set default 'PHP';

alter table public.payments
  alter column currency set default 'PHP';

alter table public.plans
  alter column currency set default 'PHP';

update public.plans set currency = 'PHP', price_monthly = 0, price_yearly = 0 where slug = 'starter';
update public.plans set currency = 'PHP', price_monthly = 249, price_yearly = 2490 where slug = 'personal';
update public.plans set currency = 'PHP', price_monthly = 799, price_yearly = 7990 where slug = 'family';
update public.plans set currency = 'PHP', price_monthly = 2499, price_yearly = 24990 where slug = 'business';
update public.plans set currency = 'PHP', price_monthly = 0, price_yearly = 0 where slug = 'enterprise';
