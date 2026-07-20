-- Server-side cart, so a customer's basket follows them across browsers and
-- devices instead of living in one browser's localStorage.
--
-- One row per customer (the cart IS the customer), items held as JSONB: a cart
-- line is a draft, not a record — travel dates and notes are free text and the
-- package may be re-priced or unpublished before checkout. `createOrder` already
-- re-resolves every package by id and re-prices server-side, so nothing here is
-- trusted as pricing input.

create table if not exists public.carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

-- A customer sees and edits only their own cart. Admins are deliberately NOT
-- granted access: a cart is a private draft, and no admin screen reads it.
create policy "Customers read own cart"
  on public.carts for select
  using (user_id = auth.uid());

create policy "Customers insert own cart"
  on public.carts for insert
  with check (user_id = auth.uid());

create policy "Customers update own cart"
  on public.carts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Customers delete own cart"
  on public.carts for delete
  using (user_id = auth.uid());

-- Keep updated_at honest so "last written wins" merges are decidable.
create or replace function public.touch_carts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.touch_carts_updated_at();
