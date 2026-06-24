-- First-party web analytics. The client tracker (components/PageviewTracker)
-- beacons each public pageview to /api/track, which inserts one row here using
-- the service role. Only a salted hash of the visitor's IP is stored (no raw
-- IP / no cookies). Written + read exclusively by the service role; RLS is
-- ENABLED with NO policies so anon/authenticated roles have zero access. The
-- admin dashboard reads aggregates through the SECURITY DEFINER functions below
-- (the app fails soft if this migration hasn't been applied yet).

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null,
  visitor_hash text,
  referrer text,
  country text
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);

alter table public.page_views enable row level security;

-- Aggregates. SECURITY DEFINER so they read the RLS-protected table; STABLE so
-- they can be planned efficiently. search_path pinned for safety.
create or replace function public.analytics_summary(window_days int)
returns table(views bigint, visitors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint as views,
         count(distinct visitor_hash)::bigint as visitors
  from public.page_views
  where created_at >= now() - make_interval(days => window_days);
$$;

create or replace function public.analytics_top_pages(window_days int, max_rows int)
returns table(path text, views bigint)
language sql
stable
security definer
set search_path = public
as $$
  select path, count(*)::bigint as views
  from public.page_views
  where created_at >= now() - make_interval(days => window_days)
  group by path
  order by views desc
  limit max_rows;
$$;

create or replace function public.analytics_daily(window_days int)
returns table(day date, views bigint, visitors bigint)
language sql
stable
security definer
set search_path = public
as $$
  select date_trunc('day', created_at)::date as day,
         count(*)::bigint as views,
         count(distinct visitor_hash)::bigint as visitors
  from public.page_views
  where created_at >= now() - make_interval(days => window_days)
  group by 1
  order by 1;
$$;

grant execute on function public.analytics_summary(int) to service_role;
grant execute on function public.analytics_top_pages(int, int) to service_role;
grant execute on function public.analytics_daily(int) to service_role;

-- Housekeeping: prune old rows periodically, e.g. from a scheduled job:
--   delete from public.page_views where created_at < now() - interval '180 days';
