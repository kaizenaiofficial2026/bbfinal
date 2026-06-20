-- Custom inquiries: multi-type booking inquiries (Package / Hotel / Air ticket /
-- Transport) submitted from the public /custom-quote form. Common guest details
-- are columns; the type-specific fields live in `details` jsonb so one table
-- serves all four inquiry types. Anonymous submissions are written via the
-- service client (RLS bypass), mirroring enquiries/bookings; staff read/update
-- under RLS.

create type public.custom_inquiry_type as enum (
  'package',
  'hotel',
  'airticket',
  'transport'
);

create table public.custom_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  inquiry_type public.custom_inquiry_type not null,
  first_name text not null,
  last_name text not null,
  country_city text,
  passport_number text,
  email text not null,
  mobile text not null,
  details jsonb not null default '{}'::jsonb,
  status public.enquiry_status not null default 'new',
  ip_hash text
);

create index custom_inquiries_created_idx on public.custom_inquiries(created_at desc);
create index custom_inquiries_ip_created_idx
  on public.custom_inquiries(ip_hash, created_at desc);

create trigger custom_inquiries_updated_at before update on public.custom_inquiries
  for each row execute function public.set_updated_at();

alter table public.custom_inquiries enable row level security;

create policy "Admins read custom inquiries"
  on public.custom_inquiries for select
  using (public.is_admin());
create policy "Admins update custom inquiries"
  on public.custom_inquiries for update
  using (public.is_admin())
  with check (public.is_admin());
