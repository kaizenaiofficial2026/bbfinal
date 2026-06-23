import { signInAction } from "../actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="admin-login">
      <form className="admin-card admin-login-card" action={signInAction}>
        <span className="section-kicker">Staff access</span>
        <h1>Admin login</h1>
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
      </form>
    </main>
  );
}
