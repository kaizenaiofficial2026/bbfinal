-- Generic rate-limit ledger for auth + payment endpoints (register, login,
-- create-session). Written and read exclusively by the service role, which
-- bypasses RLS; RLS is ENABLED with NO policies, so anon and authenticated
-- roles have zero access. The application limiter (lib/data/rate-limit.ts)
-- counts rows per (action, ip_hash) within a sliding window and fails open if
-- this table is absent, so applying this migration is what activates limiting.

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup
  on public.rate_limit_events (action, ip_hash, created_at desc);

alter table public.rate_limit_events enable row level security;

-- Optional housekeeping: this table grows unbounded. Periodically prune old
-- rows, e.g. from a scheduled job:
--   delete from public.rate_limit_events where created_at < now() - interval '1 day';
