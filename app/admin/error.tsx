"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Admin error boundary. Server actions (saves, status updates, uploads) throw on
 * failure; without this, a routine error (duplicate slug, oversized image,
 * transient DB error) drops the admin onto the raw Next.js error overlay. This
 * keeps them inside the admin shell with a recoverable "Try again".
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Something went wrong</span>
        <h1>We hit a snag</h1>
      </div>
      <div className="admin-card admin-stack">
        <p className="admin-alert" role="alert">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="admin-actions-row">
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-line" href="/admin">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
