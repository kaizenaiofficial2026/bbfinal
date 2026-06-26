import Link from "next/link";
import { requestAdminResetAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";

type AdminForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminForgotPasswordPage({
  searchParams,
}: AdminForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <main className="admin-login">
      <form
        className="admin-card admin-login-card"
        action={requestAdminResetAction}
      >
        <span className="section-kicker">Staff access</span>
        <h1>Reset password</h1>
        <p className="form-hint">
          Enter your staff email and we&apos;ll send the 6-digit reset code to{" "}
          {ADMIN_SECURITY_INBOX}.
        </p>
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <SubmitButton pendingLabel="Sending…">Send reset code</SubmitButton>
        <p className="admin-muted admin-login-back-row">
          <Link className="admin-back" href="/admin/login">
            ← Back to login
          </Link>
        </p>
      </form>
    </main>
  );
}
