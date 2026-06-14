import { signInAction } from "../actions";

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
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
        {error ? <p className="form-note">{error}</p> : null}
      </form>
    </main>
  );
}
