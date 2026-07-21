import Link from "next/link";
import { requireAdminContext } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deleteCustomerAction,
  purgeCustomerAction,
  restoreCustomerAction,
  setCustomerActiveAction,
  verifyCustomerAction,
} from "../actions";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { formatDate } from "@/lib/admin/format";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  /** Set when the account has been archived by an admin. */
  deleted_at: string | null;
};

// The filter pills. "deactivated" cuts across verification state (any customer
// can have their login disabled), and "deleted" lists archived accounts, which
// every other view excludes.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "New applications" },
  { key: "verified", label: "Verified" },
  { key: "deactivated", label: "Deactivated" },
  { key: "deleted", label: "Deleted" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function parseFilter(value: string | undefined): FilterKey {
  return (FILTERS.find((f) => f.key === value)?.key ?? "all") as FilterKey;
}

function ActiveToggle({ customer }: { customer: CustomerRow }) {
  return (
    <form action={setCustomerActiveAction}>
      <input type="hidden" name="customerId" value={customer.id} />
      <input type="hidden" name="active" value={(!customer.active).toString()} />
      <SubmitButton
        pendingLabel="Saving…"
        className={customer.active ? "btn btn-line" : "btn btn-primary"}
      >
        {customer.active ? "Deactivate login" : "Activate login"}
      </SubmitButton>
    </form>
  );
}

function DeleteCustomerForm({ customer }: { customer: CustomerRow }) {
  return (
    <form action={deleteCustomerAction}>
      <input type="hidden" name="customerId" value={customer.id} />
      <DeleteButton
        label="Delete account"
        confirmText={`Delete ${customer.full_name}'s account? Their login is disabled immediately and the account moves to the Deleted filter, where you can restore it or remove it permanently. Their bookings are kept.`}
      />
    </form>
  );
}

/** Actions available only on an archived account. */
function RestoreCustomerForm({ customer }: { customer: CustomerRow }) {
  return (
    <form action={restoreCustomerAction}>
      <input type="hidden" name="customerId" value={customer.id} />
      <SubmitButton pendingLabel="Restoring…">Restore account</SubmitButton>
    </form>
  );
}

function PurgeCustomerForm({ customer }: { customer: CustomerRow }) {
  return (
    <form action={purgeCustomerAction}>
      <input type="hidden" name="customerId" value={customer.id} />
      <DeleteButton
        label="Delete permanently"
        confirmText={`Permanently delete ${customer.full_name}'s account? Their login and profile are removed for good and their bookings are unlinked (kept as records). This CANNOT be undone.`}
      />
    </form>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <p>
      <strong>{label}</strong>
      <span>{value || "—"}</span>
    </p>
  );
}

/** Full application card with the verify action — used for unverified customers. */
function ApplicantCard({
  customer,
  isSuperAdmin,
}: {
  customer: CustomerRow;
  isSuperAdmin: boolean;
}) {
  return (
    <article className="admin-applicant" key={customer.id}>
      <div className="admin-applicant-head">
        <div>
          <strong>{customer.full_name}</strong>
          <span className="admin-muted-block">
            Registered {formatDate(customer.created_at)}
          </span>
        </div>
        <StatusBadge status={customer.active ? "active" : "inactive"} />
      </div>

      <div className="admin-detail admin-applicant-grid">
        <Detail label="Email" value={customer.email} />
        <Detail label="Mobile" value={customer.phone} />
        <Detail
          label="Country & city"
          value={[customer.city, customer.country].filter(Boolean).join(", ")}
        />
        <Detail
          label="Date of birth"
          value={
            customer.date_of_birth ? formatDate(customer.date_of_birth) : null
          }
        />
        <Detail label="Passport no." value={customer.passport_number} />
        <Detail
          label="Passport expiry"
          value={
            customer.passport_expiry ? formatDate(customer.passport_expiry) : null
          }
        />
      </div>

      <div className="admin-actions-row">
        <form action={verifyCustomerAction}>
          <input type="hidden" name="customerId" value={customer.id} />
          <SubmitButton pendingLabel="Verifying…">
            Verify (allow purchases)
          </SubmitButton>
        </form>
        <ActiveToggle customer={customer} />
        {isSuperAdmin ? <DeleteCustomerForm customer={customer} /> : null}
      </div>
    </article>
  );
}

/** Compact card for customers past the application stage. */
function CustomerCard({
  customer,
  isSuperAdmin,
}: {
  customer: CustomerRow;
  isSuperAdmin: boolean;
}) {
  return (
    <article className="admin-applicant" key={customer.id}>
      <div className="admin-applicant-head">
        <div>
          <strong>{customer.full_name}</strong>
          <span className="admin-muted-block">
            {customer.email}
            {customer.phone ? ` · ${customer.phone}` : ""}
          </span>
        </div>
        <div className="admin-applicant-badges">
          <StatusBadge status={customer.verified ? "verified" : "pending"} />
          <StatusBadge status={customer.active ? "active" : "inactive"} />
        </div>
      </div>
      <div className="admin-actions-row">
        <ActiveToggle customer={customer} />
        {isSuperAdmin ? <DeleteCustomerForm customer={customer} /> : null}
      </div>
    </article>
  );
}

type CustomersPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const [{ isSuperAdmin }, { filter: rawFilter }] = await Promise.all([
    requireAdminContext(),
    searchParams,
  ]);
  const filter = parseFilter(rawFilter);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, phone, country, city, date_of_birth, passport_number, passport_expiry, verified, active, created_at, deleted_at",
    )
    .order("verified", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as CustomerRow[];
  // Archived accounts appear ONLY under "Deleted" — they'd otherwise show up as
  // deactivated customers and read like live accounts.
  const live = rows.filter((c) => !c.deleted_at);
  const deleted = rows.filter((c) => c.deleted_at);
  const pending = live.filter((c) => !c.verified);
  const verified = live.filter((c) => c.verified);
  const deactivated = live.filter((c) => !c.active);

  const counts: Record<FilterKey, number> = {
    all: live.length,
    pending: pending.length,
    verified: verified.length,
    deactivated: deactivated.length,
    deleted: deleted.length,
  };

  return (
    <div className="admin-stack">
      <span className="section-kicker">Customers</span>
      <h1>Customer accounts</h1>

      <nav className="admin-filter-pills" aria-label="Filter customers">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/users" : `/admin/users?filter=${f.key}`}
            className={
              filter === f.key
                ? "admin-filter-pill is-active"
                : "admin-filter-pill"
            }
            aria-current={filter === f.key ? "page" : undefined}
          >
            {f.label}
            <span className="admin-count">{counts[f.key]}</span>
          </Link>
        ))}
      </nav>

      {filter === "all" || filter === "pending" ? (
        <section className="admin-card admin-stack">
          <h2>New applications ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="form-hint">No customers awaiting verification.</p>
          ) : (
            pending.map((customer) => (
              <ApplicantCard
                customer={customer}
                isSuperAdmin={isSuperAdmin}
                key={customer.id}
              />
            ))
          )}
        </section>
      ) : null}

      {filter === "all" || filter === "verified" ? (
        <section className="admin-card admin-stack">
          <h2>Verified customers ({verified.length})</h2>
          {verified.length === 0 ? (
            <p className="form-hint">No verified customers yet.</p>
          ) : (
            verified.map((customer) => (
              <CustomerCard
                customer={customer}
                isSuperAdmin={isSuperAdmin}
                key={customer.id}
              />
            ))
          )}
        </section>
      ) : null}

      {filter === "deactivated" ? (
        <section className="admin-card admin-stack">
          <h2>Deactivated customers ({deactivated.length})</h2>
          <p className="form-hint">
            Logins that are currently disabled, whatever their verification
            state. Reactivate to let the customer sign in again.
          </p>
          {deactivated.length === 0 ? (
            <p className="form-hint">No deactivated customers.</p>
          ) : (
            deactivated.map((customer) => (
              <CustomerCard
                customer={customer}
                isSuperAdmin={isSuperAdmin}
                key={customer.id}
              />
            ))
          )}
        </section>
      ) : null}

      {filter === "deleted" ? (
        <section className="admin-card admin-stack">
          <h2>Deleted customers ({deleted.length})</h2>
          <p className="form-hint">
            Archived accounts. They can&apos;t sign in and are hidden from every
            other view, but their bookings are kept. Restore one to bring the
            account back, or delete it permanently to remove it for good.
          </p>
          {deleted.length === 0 ? (
            <p className="form-hint">No deleted customers.</p>
          ) : (
            deleted.map((customer) => (
              <article className="admin-applicant" key={customer.id}>
                <div className="admin-applicant-head">
                  <div>
                    <strong>{customer.full_name}</strong>
                    <span className="admin-muted-block">
                      {customer.email}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </span>
                    <span className="admin-muted-block">
                      Deleted {formatDate(customer.deleted_at)}
                    </span>
                  </div>
                  <StatusBadge status="inactive" />
                </div>
                <div className="admin-actions-row">
                  <RestoreCustomerForm customer={customer} />
                  {isSuperAdmin ? (
                    <PurgeCustomerForm customer={customer} />
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
