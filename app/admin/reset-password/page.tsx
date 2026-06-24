import Link from "next/link";
import { resetAdminPasswordAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type AdminResetPasswordPageProps = {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
};

export default async function AdminResetPasswordPage({
  searchParams,
}: AdminResetPasswordPageProps) {
  const { email = "", error, sent } = await searchParams;

  return (
    <main className="admin-login">
      <form
        className="admin-card admin-login-card"
        action={resetAdminPasswordAction}
      >
        <span className="section-kicker">Staff access</span>
        <h1>Set a new password</h1>
        {sent ? (
          <p className="admin-note-success" role="status">
            If that email belongs to a staff account, we&apos;ve sent a 6-digit
            code. Enter it below.
          </p>
        ) : null}
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}
        <input type="hidden" name="email" value={email} />
        <label>
          Email
          <input type="email" value={email} disabled />
        </label>
        <label>
          Reset code
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
          />
        </label>
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
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
        <p className="admin-muted">
          <Link className="admin-back" href="/admin/forgot-password">
            Request a new code
          </Link>
        </p>
      </form>
    </main>
  );
}
