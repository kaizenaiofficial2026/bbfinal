-- Enforce one customer row per email (case-insensitive). The app upserts
-- `customers` on `id`, and the admin-approval flow reads `customers.email` as the
-- contact identifier, so duplicates weaken that audit trail.
--
-- CAUTION: this index creation FAILS if duplicate emails already exist. Before
-- applying, check and resolve duplicates first:
--   select lower(email), count(*) from public.customers
--   group by 1 having count(*) > 1;

create unique index if not exists customers_email_lower_key
  on public.customers (lower(email));
