-- One-time password-reset codes for the customer + admin "forgot password"
-- flow. A short numeric code is emailed to the user; only its salted SHA-256
-- hash is stored here. Written and read exclusively by the service role (which
-- bypasses RLS); RLS is ENABLED with NO policies, so anon and authenticated
-- roles have zero access. Rows are single-use (consumed_at) and short-lived
-- (expires_at), with a per-row attempt counter to throttle guessing.

create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null default 'customer',
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  consumed_at timestamptz
);

-- Latest active code per email is looked up on every verify.
create index if not exists password_reset_codes_lookup
  on public.password_reset_codes (email, created_at desc);

alter table public.password_reset_codes enable row level security;

-- Housekeeping: this table only needs live rows. Prune expired/consumed codes
-- periodically, e.g. from a scheduled job:
--   delete from public.password_reset_codes
--   where consumed_at is not null or expires_at < now() - interval '1 day';
