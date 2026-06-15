create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.content_status as enum ('draft', 'published');
create type public.enquiry_status as enum ('new', 'contacted', 'closed');
create type public.booking_status as enum ('new', 'confirmed', 'awaiting_payment', 'paid', 'cancelled');
create type public.payment_status as enum ('initiated', 'pending', 'captured', 'failed', 'refunded');
create type public.staff_role as enum ('admin');

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  tagline text not null,
  key_attraction text not null default '',
  summary text not null,
  best_for text not null default '',
  highlights text[] not null default '{}',
  hero_image text not null default '',
  card_image text not null default '',
  status public.content_status not null default 'draft',
  sort_order integer not null default 0
);

create table public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  tier text not null,
  hotels text not null,
  destinations_summary text not null,
  duration text not null,
  image text not null default '',
  summary text not null,
  inclusions text[] not null default '{}',
  price_amount numeric(12,2),
  currency text not null default 'LKR',
  deposit_amount numeric(12,2),
  status public.content_status not null default 'draft',
  sort_order integer not null default 0
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tour_package_id uuid not null references public.tour_packages(id) on delete cascade,
  day_label text not null,
  title text not null,
  description text not null,
  sort_order integer not null default 0
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  package_label text,
  message text not null,
  status public.enquiry_status not null default 'new',
  source text not null default 'contact-form',
  ip_hash text
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reference text not null unique,
  tour_package_id uuid not null references public.tour_packages(id),
  traveller_name text not null,
  email text not null,
  phone text,
  travel_dates text not null,
  travellers integer not null check (travellers > 0),
  notes text,
  status public.booking_status not null default 'new',
  quoted_amount numeric(12,2),
  currency text not null default 'LKR',
  ip_hash text
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  mpgs_order_id text not null unique,
  mpgs_session_id text,
  mpgs_transaction_id text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'LKR',
  status public.payment_status not null default 'initiated',
  pay_token text not null unique,
  pay_token_expires_at timestamptz not null,
  gateway_result jsonb
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role public.staff_role not null default 'admin',
  full_name text
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb
);

create index destinations_public_idx on public.destinations(status, sort_order, title);
create index tour_packages_public_idx on public.tour_packages(status, sort_order, title);
create index itinerary_items_package_idx on public.itinerary_items(tour_package_id, sort_order);
create index enquiries_created_idx on public.enquiries(created_at desc);
create index enquiries_ip_created_idx on public.enquiries(ip_hash, created_at desc);
create index bookings_created_idx on public.bookings(created_at desc);
create index bookings_ip_created_idx on public.bookings(ip_hash, created_at desc);
create index payments_token_idx on public.payments(pay_token);
create index payments_booking_idx on public.payments(booking_id);

create trigger destinations_updated_at before update on public.destinations
  for each row execute function public.set_updated_at();
create trigger tour_packages_updated_at before update on public.tour_packages
  for each row execute function public.set_updated_at();
create trigger itinerary_items_updated_at before update on public.itinerary_items
  for each row execute function public.set_updated_at();
create trigger enquiries_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.destinations enable row level security;
alter table public.tour_packages enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.enquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  );
$$;

create policy "Published destinations are public"
  on public.destinations for select
  using (status = 'published' or public.is_admin());
create policy "Admins manage destinations"
  on public.destinations for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Published packages are public"
  on public.tour_packages for select
  using (status = 'published' or public.is_admin());
create policy "Admins manage packages"
  on public.tour_packages for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Published itinerary items are public"
  on public.itinerary_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.tour_packages
      where tour_packages.id = itinerary_items.tour_package_id
      and tour_packages.status = 'published'
    )
  );
create policy "Admins manage itinerary"
  on public.itinerary_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read enquiries"
  on public.enquiries for select
  using (public.is_admin());
create policy "Admins update enquiries"
  on public.enquiries for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read bookings"
  on public.bookings for select
  using (public.is_admin());
create policy "Admins update bookings"
  on public.bookings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read payments"
  on public.payments for select
  using (public.is_admin());
create policy "Admins update payments"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Settings are public"
  on public.site_settings for select
  using (true);
create policy "Admins manage settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public media reads"
  on storage.objects for select
  using (bucket_id = 'media');
create policy "Admins manage media"
  on storage.objects for all
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
