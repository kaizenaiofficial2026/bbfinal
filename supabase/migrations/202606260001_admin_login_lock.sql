create table if not exists public.admin_login_lock (
  id boolean primary key default true check (id),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.admin_login_lock enable row level security;

revoke all on public.admin_login_lock from anon, authenticated;
grant all on public.admin_login_lock to service_role;

create index if not exists admin_login_lock_expires_idx
  on public.admin_login_lock(expires_at);

create or replace function public.acquire_admin_login_lock(
  p_user_id uuid,
  p_email text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  acquired boolean;
begin
  insert into public.admin_login_lock as active_lock (
    id,
    user_id,
    email,
    acquired_at,
    expires_at
  )
  values (
    true,
    p_user_id,
    lower(p_email),
    now(),
    p_expires_at
  )
  on conflict (id) do update
    set user_id = excluded.user_id,
        email = excluded.email,
        acquired_at = now(),
        expires_at = excluded.expires_at
    where active_lock.user_id = excluded.user_id
       or active_lock.expires_at <= now()
  returning true into acquired;

  return coalesce(acquired, false);
end;
$$;

revoke execute on function public.acquire_admin_login_lock(uuid, text, timestamptz)
  from public;
grant execute on function public.acquire_admin_login_lock(uuid, text, timestamptz)
  to service_role;
