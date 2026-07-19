import Image from "next/image";
import Link from "next/link";
import { signInAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    kicked?: string;
    reason?: string;
    reset?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error, kicked, reason, reset } = await searchParams;

  return (
    <main className="admin-login">
      {kicked ? (
        <aside className="admin-login-popup admin-card" role="alert">
          <span className="section-kicker">Session ended</span>
          <h2>You were signed out</h2>
          <p>
            {reason === "idle"
              ? "Your session ended after a period of inactivity. Sign in again to continue."
              : "Another admin signed in and took over the panel. Sign in again to request access."}
          </p>
        </aside>
      ) : null}
      <form className="admin-card admin-login-card" action={signInAction}>
        <Image
          className="admin-login-logo"
          src="/assets/images/brand/logo.png"
          alt="Beyond Borders"
          width={150}
          height={73}
          priority
          unoptimized
        />
        <span className="section-kicker">Staff access</span>
        <h1>Admin login</h1>
        {reset ? (
          <p className="admin-note-success" role="status">
            Your password has been updated. Please sign in.
          </p>
        ) : null}
        {error ? (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        ) : null}
        <Label variant="bare">
          Email
          <Input variant="bare" name="email" type="email" autoComplete="email" required />
        </Label>
        <Label variant="bare">
          Password
          <PasswordInput
            variant="bare"
            name="password"
            autoComplete="current-password"
            required
          />
        </Label>
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
        <p className="admin-muted">
          <Link className="admin-back" href="/admin/forgot-password">
            Forgot password?
          </Link>
        </p>
      </form>
    </main>
  );
}
