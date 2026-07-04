-- Persist the BB-INQ-<n> reference on each custom inquiry so it appears in the
-- staff email and the admin panel (not just the SMS). Nullable: rows created
-- before this migration have no reference and render as "—". Additive +
-- idempotent. The app also degrades gracefully if this hasn't been applied yet
-- (it retries the insert without the reference), so it never blocks a lead.
alter table public.custom_inquiries
  add column if not exists reference text;
