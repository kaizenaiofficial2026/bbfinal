-- Soft-delete for customer accounts.
--
-- "Delete account" used to remove the auth user, which cascaded the customers
-- row away — so a deleted customer left no trace an admin could review. Deleting
-- now ARCHIVES the row (deleted_at set, login disabled) so it can be listed
-- under a "Deleted" filter and restored, with a separate permanent purge kept
-- for when the record really must go.

alter table public.customers
  add column if not exists deleted_at timestamptz;

-- The admin list filters on this constantly; deleted rows are the rare case.
create index if not exists customers_deleted_at_idx
  on public.customers (deleted_at)
  where deleted_at is not null;
