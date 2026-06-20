-- Admins generate pay links from /admin/bookings/[id], which inserts a row into
-- public.payments under the admin's own (RLS-enforced) session. The initial
-- migration only granted admins SELECT and UPDATE on payments, so the insert
-- failed with "new row violates row-level security policy for table payments".
-- Grant admins INSERT as well. Machine-driven payment writes (create-session,
-- reconcile) continue to use the service-role client and are unaffected.

create policy "Admins insert payments"
  on public.payments for insert
  with check (public.is_admin());
