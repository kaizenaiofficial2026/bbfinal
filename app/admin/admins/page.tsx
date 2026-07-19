import { listAdmins, requireSuperAdmin } from "@/lib/admin/auth";
import { setAdminActiveAction } from "../actions";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { SetAdminPasswordForm } from "./SetAdminPasswordForm";
import { CreateAdminForm } from "./CreateAdminForm";

type AdminRow = {
  id: string;
  active: boolean;
};

function AdminActiveToggle({ admin }: { admin: AdminRow }) {
  return (
    <form action={setAdminActiveAction}>
      <input type="hidden" name="adminId" value={admin.id} />
      <input type="hidden" name="active" value={(!admin.active).toString()} />
      <SubmitButton
        pendingLabel="Saving…"
        className={admin.active ? "btn btn-line btn-sm" : "btn btn-primary btn-sm"}
      >
        {admin.active ? "Deactivate" : "Activate"}
      </SubmitButton>
    </form>
  );
}

/** Up to two initials for the avatar chip, falling back to the email. */
function initials(name: string | null, email: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || source[0] || "?").toUpperCase();
}

export default async function AdminStaffPage() {
  // Super-admin only. A second-level admin never sees this section (nav hides it)
  // and is redirected to /admin if they hit the URL directly.
  const actor = await requireSuperAdmin();
  const admins = await listAdmins();

  const supers = admins.filter((a) => a.isSuper).length;
  const seconds = admins.length - supers;

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Admins</span>
          <h1>Admin accounts</h1>
        </div>
        <p className="admin-roster-summary">
          <strong>{supers}</strong> super ·{" "}
          <strong>{seconds}</strong> second-level
        </p>
      </div>

      <section className="admin-card admin-stack">
        <div className="admin-card-head">
          <h2>Create a second-level admin</h2>
        </div>
        <p className="form-hint">
          They can sign in immediately and will see Dashboard, Bookings,
          Customers, Support panel and Settings. Packages, Destinations,
          Enquiries and this Admins screen stay super-admin only.
        </p>
        <CreateAdminForm />
      </section>

      <section className="admin-card admin-stack">
        <div className="admin-card-head">
          <h2>Existing admins</h2>
          <span className="admin-count">{admins.length}</span>
        </div>
        <p className="form-hint">
          Deactivating a second-level admin immediately blocks their login and
          signs out any active session. Super admins can’t be deactivated.
        </p>

        {admins.length === 0 ? (
          <p className="form-hint">No admin accounts found.</p>
        ) : (
          <ul className="admin-roster">
            {admins.map((admin) => {
              const isSelf = admin.id === actor.id;
              const canToggle = !admin.isSuper && !isSelf;
              const name = admin.fullName || admin.email || "Admin";
              return (
                <li
                  className={`admin-roster-row${admin.isSuper ? " is-super" : ""}`}
                  key={admin.id}
                >
                  <span className="admin-avatar" aria-hidden="true">
                    {initials(admin.fullName, admin.email)}
                  </span>

                  <div className="admin-roster-identity">
                    <strong>
                      {name}
                      {isSelf ? <span className="admin-chip-you">You</span> : null}
                    </strong>
                    <span className="admin-roster-email">{admin.email ?? "—"}</span>
                  </div>

                  <div className="admin-roster-tags">
                    <span
                      className={`admin-tier-chip${
                        admin.isSuper ? " is-super" : ""
                      }`}
                    >
                      {admin.isSuper ? "Super admin" : "Second-level"}
                    </span>
                    <StatusBadge status={admin.active ? "active" : "inactive"} />
                  </div>

                  <div className="admin-roster-actions">
                    {canToggle ? (
                      <AdminActiveToggle admin={admin} />
                    ) : (
                      <span className="admin-roster-locked">
                        {admin.isSuper ? "Protected" : "Your account"}
                      </span>
                    )}
                  </div>

                  {/* Password reset is opt-in: collapsed by default so the roster
                      stays scannable instead of repeating a form on every row. */}
                  {canToggle ? (
                    <details className="admin-roster-reset">
                      <summary>Reset password</summary>
                      <SetAdminPasswordForm adminId={admin.id} />
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
