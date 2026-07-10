import { listAdmins, requireSuperAdmin } from "@/lib/admin/auth";
import { setAdminActiveAction } from "../actions";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { SetAdminPasswordForm } from "./SetAdminPasswordForm";

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
        className={admin.active ? "btn btn-line" : "btn btn-primary"}
      >
        {admin.active ? "Deactivate" : "Activate"}
      </SubmitButton>
    </form>
  );
}

export default async function AdminStaffPage() {
  // Super-admin only. A second-level admin never sees this section (nav hides it)
  // and is redirected to /admin if they hit the URL directly.
  const actor = await requireSuperAdmin();
  const admins = await listAdmins();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Admins</span>
      <h1>Admin accounts</h1>

      <section className="admin-card admin-stack">
        <p className="form-hint">
          Deactivating a second-level admin immediately blocks their login and
          signs out any active session. Super admins can’t be deactivated.
        </p>

        {admins.length === 0 ? (
          <p className="form-hint">No admin accounts found.</p>
        ) : (
          admins.map((admin) => {
            const isSelf = admin.id === actor.id;
            const canToggle = !admin.isSuper && !isSelf;
            return (
              <article className="admin-applicant" key={admin.id}>
                <div className="admin-applicant-head">
                  <div>
                    <strong>{admin.fullName || admin.email || "Admin"}</strong>
                    <span className="admin-muted-block">
                      {admin.email ?? "—"} ·{" "}
                      {admin.isSuper ? "Super admin" : "Second-level admin"}
                      {isSelf ? " · you" : ""}
                    </span>
                  </div>
                  <StatusBadge status={admin.active ? "active" : "inactive"} />
                </div>

                <div className="admin-actions-row">
                  {canToggle ? (
                    <AdminActiveToggle admin={admin} />
                  ) : (
                    <p className="form-hint">
                      {admin.isSuper
                        ? "Super admin — cannot be managed here."
                        : "This is your account."}
                    </p>
                  )}
                </div>

                {canToggle ? (
                  <SetAdminPasswordForm adminId={admin.id} />
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
