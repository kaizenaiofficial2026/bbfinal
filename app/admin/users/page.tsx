import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyCustomerAction } from "../actions";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { formatDate } from "@/lib/admin/format";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, verified, created_at")
    .order("verified", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const pending = rows.filter((customer) => !customer.verified);
  const verified = rows.filter((customer) => customer.verified);

  return (
    <div className="admin-stack">
      <span className="section-kicker">Customers</span>
      <h1>Customer accounts</h1>

      <section className="admin-card admin-stack">
        <h2>Awaiting verification ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="form-hint">No customers awaiting verification.</p>
        ) : (
          pending.map((customer) => (
            <form
              className="admin-inline-form"
              action={verifyCustomerAction}
              key={customer.id}
            >
              <input type="hidden" name="customerId" value={customer.id} />
              <div>
                <strong>{customer.full_name}</strong>
                <span className="admin-muted-block">
                  {customer.email}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                  {` · Registered ${formatDate(customer.created_at)}`}
                </span>
              </div>
              <SubmitButton pendingLabel="Verifying…">Verify</SubmitButton>
            </form>
          ))
        )}
      </section>

      <section className="admin-card admin-stack">
        <h2>Verified ({verified.length})</h2>
        {verified.length === 0 ? (
          <p className="form-hint">No verified customers yet.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Name</span>
              <span>Email</span>
              <span>Status</span>
            </div>
            {verified.map((customer) => (
              <div key={customer.id}>
                <span>{customer.full_name}</span>
                <span className="admin-muted">{customer.email}</span>
                <StatusBadge status="verified" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
