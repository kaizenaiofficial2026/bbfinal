import Link from "next/link";
import { resetAdminPasswordAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminResetPasswordPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function AdminResetPasswordPage({
  searchParams,
}: AdminResetPasswordPageProps) {
  const { error, sent } = await searchParams;

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
            We&apos;ve sent a 6-digit code to {ADMIN_SECURITY_INBOX}. Enter it
            below to set a new password.
          </p>
        ) : null}
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}
        <Label variant="bare">
          Reset code
          <Input
            variant="bare"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
          />
        </Label>
        <Label variant="bare">
          New password
          <PasswordInput
            variant="bare"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Label>
        <Label variant="bare">
          Confirm password
          <PasswordInput
            variant="bare"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Label>
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
