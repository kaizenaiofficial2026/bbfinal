import Link from "next/link";
import AdminPasswordWizard from "./AdminPasswordWizard";
import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";

type SettingsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const user = await requireAdmin();
  const { error } = await searchParams;
  const email = user.email ?? "";

  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Settings</span>
        <h1>Change password</h1>
      </div>

      <section className="admin-card admin-stack">
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}

        <p className="form-hint">
          Signed in as {email}. Changing your password needs a one-time code
          sent to {ADMIN_SECURITY_INBOX}.
        </p>

        <AdminPasswordWizard />

        <p className="admin-muted">
          <Link className="admin-back" href="/admin/forgot-password">
            Forgot your password?
          </Link>
        </p>
      </section>
    </div>
  );
}
