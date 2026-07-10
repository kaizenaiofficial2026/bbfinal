-- Security hardening — addresses Supabase database-linter (advisor) findings.
--
-- Context: several SECURITY DEFINER functions in the public schema are auto-exposed
-- as PostgREST RPCs and were callable by the anon/authenticated roles, and the media
-- storage bucket had a broad public SELECT policy that allowed listing every file.
-- All the functions below are only ever invoked from the service-role client
-- (lib/data/analytics.ts, lib/data/reference-numbers.ts), so removing anon/
-- authenticated access does not affect the app.
--
-- Deliberately NOT changed: public.is_admin() and public.is_verified_customer()
-- remain executable — they are referenced inside RLS policy expressions, so the
-- querying role must retain EXECUTE or policy evaluation would fail.

-- 1. Analytics RPCs — prevent anonymous callers from reading page-view analytics.
revoke all on function public.analytics_summary(integer) from public, anon, authenticated;
grant execute on function public.analytics_summary(integer) to service_role;

revoke all on function public.analytics_daily(integer) from public, anon, authenticated;
grant execute on function public.analytics_daily(integer) to service_role;

revoke all on function public.analytics_top_pages(integer, integer) from public, anon, authenticated;
grant execute on function public.analytics_top_pages(integer, integer) to service_role;

-- 2. Sequence generators — prevent anonymous callers from burning order/inquiry numbers.
revoke all on function public.next_order_number() from public, anon, authenticated;
grant execute on function public.next_order_number() to service_role;

revoke all on function public.next_inquiry_number() from public, anon, authenticated;
grant execute on function public.next_inquiry_number() to service_role;

-- 3. Maintenance helper — should never be reachable over the API at all.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- 4. Pin the updated-at trigger function's search_path (it only calls now()).
alter function public.set_updated_at() set search_path = '';

-- 5. Remove the broad public SELECT on the media bucket. The bucket is public, so
--    object URLs keep serving reads without it; "Admins manage media" keeps admin
--    list/upload/delete. This stops anonymous clients from listing every filename.
drop policy if exists "Public media reads" on storage.objects;
