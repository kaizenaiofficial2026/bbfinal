-- Customer accounts + admin verification gate.
--
-- Adds end-user (customer) accounts, distinct from staff `profiles`. A customer
-- self-registers (verified = false) and can only book once an admin approves
-- them. Bookings gain a `user_id` so a booking belongs to the customer who made
-- it, and customers can read their own bookings/payments via RLS.

create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  verified boolean not null default false,
  verified_at timestamptz
);

create index customers_verified_idx on public.customers(verified, created_at desc);

create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

-- Mirrors public.is_admin(): true when the current auth user is an approved
-- customer. Used by RLS to gate customer-initiated reads.
create or replace function public.is_verified_customer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customers
    where customers.id = auth.uid()
    and customers.verified = true
  );
$$;

-- Link bookings to the customer who created them. Nullable: existing rows and
-- any future service-created bookings may have none.
alter table public.bookings
  add column user_id uuid references auth.users(id);

create index bookings_user_idx on public.bookings(user_id, created_at desc);

-- RLS: customers --------------------------------------------------------------

create policy "Customers read own profile"
  on public.customers for select
  using (id = auth.uid() or public.is_admin());

-- A customer creates only their own row at signup. The service client (used by
-- registerAction) bypasses RLS, but this keeps direct inserts safe too.
create policy "Customers insert self"
  on public.customers for insert
  with check (id = auth.uid());

-- Admins approve/manage customers (flipping `verified`).
create policy "Admins manage customers"
  on public.customers for all
  using (public.is_admin())
  with check (public.is_admin());

-- RLS: customer-owned bookings & payments (reads for the account dashboard) ----

create policy "Customers read own bookings"
  on public.bookings for select
  using (user_id = auth.uid());

create policy "Customers read own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
      and b.user_id = auth.uid()
    )
  );
