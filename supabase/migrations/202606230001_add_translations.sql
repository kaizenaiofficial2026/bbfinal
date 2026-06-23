-- The localized-content layer (lib/data/destinations.ts, lib/data/packages.ts)
-- reads a `translations` jsonb column on each of these tables, and the seed
-- scripts write it — but no prior migration created it (it was added manually in
-- the Supabase dashboard). Without this, a clean `supabase db reset` / CI rebuild
-- produces a schema where every published package/destination query and both
-- i18n seed scripts fail. Additive and idempotent, so it is safe to run against
-- the existing (manually patched) database as well.

alter table public.destinations
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.tour_packages
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.itinerary_items
  add column if not exists translations jsonb not null default '{}'::jsonb;
