-- Make deactivation actually revoke database access.
--
-- `is_admin()` backs every admin RLS policy, but it only ever checked
-- `role = 'admin'`. The `active` column (added in 202607100003) was enforced
-- solely in the application layer, so "deactivating" an admin removed the UI
-- while leaving their PostgREST access intact: with their existing JWT they
-- could still read every customer, passport and booking straight from the API.
--
-- `profiles.active` is NOT NULL DEFAULT true, so adding the predicate cannot
-- lock out a normal admin.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
      and profiles.active
  );
$function$;
