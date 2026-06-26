import Image from "next/image";
import Link from "next/link";
import { signInAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    locked?: string;
    reset?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error, locked, reset } = await searchParams;

  return (
    <main className="admin-login">
      {locked ? (
        <aside className="admin-login-popup admin-card" role="alert">
          <span className="section-kicker">Admin in use</span>
          <h2>Another admin is logged in</h2>
          <p>Please ask them to log out before signing in.</p>
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
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
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
