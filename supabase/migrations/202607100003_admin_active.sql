-- Admin activation: let a super-admin deactivate a second-level admin.
-- Mirrors customers.active. A deactivated admin (active=false) is denied by
-- getAdminUser(), which blocks login and kicks any live session. Existing admins
-- default to active. Super admins are never deactivated (enforced in the app).
alter table public.profiles
  add column if not exists active boolean not null default true;
