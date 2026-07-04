-- Give tour packages a distinct hero image (the large banner on the booking
-- page) separate from the card thumbnail, mirroring destinations. `image` stays
-- the card image; `hero_image` is new. The app falls back to the card image
-- when `hero_image` is empty, so existing packages keep rendering unchanged.
-- Additive + idempotent: safe to run against the live database.
alter table public.tour_packages
  add column if not exists hero_image text not null default '';
