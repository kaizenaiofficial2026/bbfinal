import Link from "next/link";

/**
 * Admin-area 404. Renders inside the admin shell (sidebar + topbar) so an
 * unknown /admin/* URL stays on-brand instead of falling through to the public
 * global not-found. Mirrors app/admin/error.tsx.
 */
export default function AdminNotFound() {
  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Error 404</span>
        <h1>We couldn&apos;t find that page</h1>
      </div>
      <div className="admin-card admin-stack">
        <p className="form-hint">
          That admin page doesn&apos;t exist or may have been moved. Use the menu
          to find what you need, or head back to the dashboard.
        </p>
        <div className="admin-actions-row">
          <Link className="btn btn-primary" href="/admin">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
