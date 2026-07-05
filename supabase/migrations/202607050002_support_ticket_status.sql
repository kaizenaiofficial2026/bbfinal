-- Constrain support ticket status to the allowed lifecycle: open (default),
-- in_progress, closed. The API already validates this, so the constraint is
-- defense-in-depth at the DB. Idempotent (guarded), and existing rows default to
-- 'open' so it applies cleanly.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'support_tickets_status_check'
  ) then
    alter table public.support_tickets
      add constraint support_tickets_status_check
      check (status in ('open', 'in_progress', 'closed'));
  end if;
end $$;
