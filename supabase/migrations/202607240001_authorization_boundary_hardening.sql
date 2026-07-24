-- Enforce staff authorization at the database boundary. Application route and
-- Server Action guards remain defense in depth.

alter table public.profiles
  add column if not exists tier text not null default 'second'
  check (tier in ('super', 'second'));

-- Accounts created by the admin panel already carry this service-role-only
-- app_metadata stamp. Environment-configured super admins are synced by the
-- application after their existing admin profile is authenticated.
update public.profiles as profile
set tier = auth_user.raw_app_meta_data ->> 'admin_tier'
from auth.users as auth_user
where auth_user.id = profile.id
  and auth_user.raw_app_meta_data ->> 'admin_tier' in ('super', 'second');

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active = true
      and tier = 'super'
  );
$$;

-- Customer records, including approval state, are created only by trusted
-- server code using the service role. Direct authenticated inserts are denied.
drop policy if exists "Customers insert self" on public.customers;

-- Super-admin content and operational tables.
drop policy if exists "Published destinations are public" on public.destinations;
create policy "Published destinations are public"
  on public.destinations for select
  using (status = 'published' or public.is_super_admin());

drop policy if exists "Admins manage destinations" on public.destinations;
drop policy if exists "Super admins manage destinations" on public.destinations;
create policy "Super admins manage destinations"
  on public.destinations for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Published packages are public" on public.tour_packages;
create policy "Published packages are public"
  on public.tour_packages for select
  using (status = 'published' or public.is_super_admin());

drop policy if exists "Admins manage packages" on public.tour_packages;
drop policy if exists "Super admins manage packages" on public.tour_packages;
create policy "Super admins manage packages"
  on public.tour_packages for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Published itinerary items are public" on public.itinerary_items;
drop policy if exists "Published itinerary is public" on public.itinerary_items;
create policy "Published itinerary items are public"
  on public.itinerary_items for select
  using (
    public.is_super_admin()
    or exists (
      select 1
      from public.tour_packages
      where tour_packages.id = itinerary_items.tour_package_id
        and tour_packages.status = 'published'
    )
  );

drop policy if exists "Admins manage itinerary" on public.itinerary_items;
drop policy if exists "Super admins manage itinerary" on public.itinerary_items;
create policy "Super admins manage itinerary"
  on public.itinerary_items for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Admins read enquiries" on public.enquiries;
drop policy if exists "Admins update enquiries" on public.enquiries;
drop policy if exists "Super admins read enquiries" on public.enquiries;
drop policy if exists "Super admins update enquiries" on public.enquiries;
create policy "Super admins read enquiries"
  on public.enquiries for select
  using (public.is_super_admin());
create policy "Super admins update enquiries"
  on public.enquiries for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Admins read custom inquiries" on public.custom_inquiries;
drop policy if exists "Admins update custom inquiries" on public.custom_inquiries;
drop policy if exists "Super admins read custom inquiries" on public.custom_inquiries;
drop policy if exists "Super admins update custom inquiries" on public.custom_inquiries;
create policy "Super admins read custom inquiries"
  on public.custom_inquiries for select
  using (public.is_super_admin());
create policy "Super admins update custom inquiries"
  on public.custom_inquiries for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Staff-directory visibility and mutation are super-admin only. Every user can
-- still read their own row so authentication can resolve their active tier.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Super admins manage profiles" on public.profiles;
create policy "Super admins manage profiles"
  on public.profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Second-level admins may attach files to support tickets, while the rest of
-- the media bucket remains restricted to super admins.
drop policy if exists "Admins manage media" on storage.objects;
create policy "Admins manage media"
  on storage.objects for all
  using (
    bucket_id = 'media'
    and (
      public.is_super_admin()
      or (
        public.is_admin()
        and (storage.foldername(name))[1] = 'support'
      )
    )
  )
  with check (
    bucket_id = 'media'
    and (
      public.is_super_admin()
      or (
        public.is_admin()
        and (storage.foldername(name))[1] = 'support'
      )
    )
  );

comment on column public.profiles.tier is
  'Database-enforced admin tier: super has privileged content and staff access; second is operational support.';
