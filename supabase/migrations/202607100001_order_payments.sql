-- Orders: one payment can now cover several bookings (a shopping-cart purchase).
-- Previously the model was strictly 1 booking : 1 payment (payments.booking_id, a
-- required 1:1 FK). To let a customer buy multiple packages and pay for them in a
-- single MPGS transaction, a payment (the "order") gains many bookings via a new
-- bookings.payment_id, and the human-friendly BB-ORD reference moves onto the
-- payment. Existing single-package data is backfilled so nothing breaks.

-- A booking belongs to the payment (order) that covers it. ON DELETE SET NULL so
-- deleting an order's payment record never destroys the booking history.
alter table public.bookings
  add column if not exists payment_id uuid references public.payments(id) on delete set null;
create index if not exists bookings_payment_id_idx on public.bookings(payment_id);

-- The order/payment carries the BB-ORD-#### reference for the whole purchase.
alter table public.payments
  add column if not exists reference text;

-- Backfill the existing 1:1 rows: link each booking to its payment and copy the
-- booking's reference up onto the payment as the order reference.
update public.bookings b
  set payment_id = p.id
  from public.payments p
  where p.booking_id = b.id and b.payment_id is null;

update public.payments p
  set reference = b.reference
  from public.bookings b
  where p.booking_id = b.id and p.reference is null;

-- Cart payments are created BEFORE their bookings exist (the bookings reference the
-- payment), so the legacy 1:1 booking_id must become optional. It is retained
-- (nullable) only for backward compatibility; bookings.payment_id is now the source
-- of truth for which bookings a payment covers.
alter table public.payments
  alter column booking_id drop not null;
