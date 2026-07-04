-- Sequential, human-friendly reference numbers for orders and custom inquiries.
-- Orders (paid bookings) are numbered BB-ORD-<n> and inquiries BB-INQ-<n>, each
-- drawing from its own independent counter. Postgres sequences give atomic,
-- race-free increments (unlike counting rows). Exposed via SECURITY DEFINER
-- functions the service role calls (next_order_number / next_inquiry_number).
--
-- The app falls back to a random reference if these aren't present yet, so it
-- keeps working before this migration is applied.
create sequence if not exists public.order_number_seq start with 1000;
create sequence if not exists public.inquiry_number_seq start with 1000;

create or replace function public.next_order_number()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.order_number_seq');
$$;

create or replace function public.next_inquiry_number()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.inquiry_number_seq');
$$;

revoke execute on function public.next_order_number() from public;
revoke execute on function public.next_inquiry_number() from public;
grant execute on function public.next_order_number() to service_role;
grant execute on function public.next_inquiry_number() to service_role;
