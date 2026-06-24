import Link from "next/link";
import {
  changeAdminPasswordAction,
  sendAdminPasswordOtpAction,
} from "../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type SettingsPageProps = {
  searchParams: Promise<{ error?: string; sent?: string; changed?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const user = await requireAdmin();
  const { error, sent, changed } = await searchParams;
  const email = user.email ?? "";

  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Settings</span>
        <h1>Change password</h1>
      </div>

      <section className="admin-card admin-stack">
        {changed ? (
          <p className="admin-note-success" role="status">
            Your password has been updated.
          </p>
        ) : null}
        {sent ? (
          <p className="admin-note-success" role="status">
            We emailed a 6-digit code to {email}. Enter it below — it expires in
            15 minutes.
          </p>
        ) : null}
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}

        <p className="form-hint">
          Changing your password needs a one-time code. Send the code to your
          email, then enter your current password, a new password, and the code.
        </p>

        <form action={sendAdminPasswordOtpAction}>
          <SubmitButton pendingLabel="Sending…" className="btn btn-line">
            Send verification code
          </SubmitButton>
        </form>

        <form className="admin-form" action={changeAdminPasswordAction}>
          <label>
            Current password
            <input
              name="oldPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <div className="admin-grid-2">
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </div>
          <label>
            Verification code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
            />
          </label>
          <SubmitButton pendingLabel="Updating…">Change password</SubmitButton>
        </form>

        <p className="admin-muted">
          <Link className="admin-back" href="/admin/forgot-password">
            Forgot your password?
          </Link>
        </p>
      </section>
    </div>
  );
}
