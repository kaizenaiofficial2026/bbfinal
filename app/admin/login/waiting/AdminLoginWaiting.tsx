"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/admin/actions";
import SubmitButton from "@/components/SubmitButton";

const POLL_MS = 2500;

/**
 * The contesting admin's waiting screen. Polls the login-request status until
 * the active admin allows (→ go to /admin), denies, or it times out. Self-heals
 * if the request id is swapped server-side (clobber recovery).
 */
export function AdminLoginWaiting({ requestId }: { requestId: string }) {
  const router = useRouter();
  const reqRef = useRef(requestId);
  const [state, setState] = useState<"waiting" | "denied" | "expired">(
    "waiting",
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/admin/login/status?req=${encodeURIComponent(reqRef.current)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          status?: string;
          requestId?: string;
        };
        if (cancelled) return;
        if (data.requestId) reqRef.current = data.requestId;
        if (data.status === "approved") {
          if (timer) clearInterval(timer);
          router.replace("/admin");
          return;
        }
        if (data.status === "denied") {
          if (timer) clearInterval(timer);
          setState("denied");
          return;
        }
        if (data.status === "expired") {
          if (timer) clearInterval(timer);
          setState("expired");
          return;
        }
      } catch {
        // transient — keep polling
      }
    }

    void poll();
    timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [router]);

  if (state === "denied" || state === "expired") {
    return (
      <div className="admin-card admin-login-card" role="alert">
        <span className="section-kicker">Access not granted</span>
        <h1>{state === "denied" ? "Another admin is active" : "No response"}</h1>
        <p className="form-hint">
          {state === "denied"
            ? "The admin currently using the panel chose to keep their session, so you can't sign in right now. Please try again later."
            : "The active admin didn't respond in time. Please try again later."}
        </p>
        <form action={signOutAction}>
          <SubmitButton className="btn btn-primary">Back to login</SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-card admin-login-card" aria-live="polite">
      <span className="section-kicker">Staff access</span>
      <h1>Waiting for approval…</h1>
      <p className="form-hint">
        Another admin is currently using the panel. We&apos;ve alerted them —
        please wait while they decide whether to let you in.
      </p>
      <span className="admin-waiting-spinner" aria-hidden="true" />
      <form action={signOutAction}>
        <SubmitButton className="btn btn-line">Cancel</SubmitButton>
      </form>
    </div>
  );
}
