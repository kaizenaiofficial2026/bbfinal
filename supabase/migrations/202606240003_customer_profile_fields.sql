-- Expanded customer registration profile + a login active/inactive flag.
--
-- Registration now collects first/last name, country & city, date of birth, and
-- passport details. `full_name` is kept (set to "first last" at signup) so all
-- existing displays/emails keep working. `active` lets staff enable/disable a
-- customer's login independently of `verified` (which gates purchasing): a new
-- customer is active=true (can sign in to see their pending status) and
-- verified=false (cannot purchase until approved).

alter table public.customers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists date_of_birth date,
  add column if not exists passport_number text,
  add column if not exists passport_expiry date,
  add column if not exists active boolean not null default true;

create index if not exists customers_active_idx on public.customers(active);
