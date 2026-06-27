"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { adminKickedSignOutAction } from "@/app/admin/actions";

const POLL_MS = 3000;

type Pending = { id: string; email: string; createdAt: number };

/**
 * Mounted in the admin shell for the ACTIVE admin. Polls the session endpoint to
 * (a) surface an incoming login request with Allow / Deny, and (b) detect being
 * superseded (another admin allowed in) and sign this browser out. Disabled on
 * the /admin/login routes — the waiting screen there runs its own poller and a
 * waiting admin is legitimately "not the holder", which must not read as a kick.
 */
export default function AdminPresence() {
  const pathname = usePathname();
  const onLoginRoutes = pathname?.startsWith("/admin/login") ?? false;

  const [pending, setPending] = useState<Pending | null>(null);
  const [phase, setPhase] = useState<"active" | "kicked" | "handing">("active");
  const busyRef = useRef(false);

  useEffect(() => {
    if (onLoginRoutes) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      if (cancelled || busyRef.current) return;
      try {
        const res = await fetch("/api/admin/session/poll", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          authed?: boolean;
          active?: boolean;
          pending?: Pending | null;
        };
        if (cancelled || !data.authed) return;
        if (data.active === false) {
          if (timer) clearInterval(timer);
          setPhase("kicked");
          await adminKickedSignOutAction();
          window.location.href = "/admin/login?kicked=1";
          return;
        }
        setPending(data.pending ?? null);
      } catch {
        // transient network error — ignore and retry on the next tick
      }
    }

    void poll();
    timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [onLoginRoutes]);

  async function decide(decision: "approve" | "deny") {
    if (!pending || busyRef.current) return;
    busyRef.current = true;
    const requestId = pending.id;
    try {
      const res = await fetch("/api/admin/session/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (decision === "approve" && data.ok) {
        setPhase("handing");
        setPending(null);
        await adminKickedSignOutAction();
        window.location.href = "/admin/login?kicked=1";
        return;
      }
      setPending(null); // denied (or failed) → close and keep working
    } catch {
      setPending(null);
    } finally {
      busyRef.current = false;
    }
  }

  if (onLoginRoutes) return null;

  if (phase === "kicked" || phase === "handing") {
    return (
      <div className="admin-presence-overlay" role="alertdialog" aria-modal="true">
        <div className="admin-presence-card">
          <span className="section-kicker">Session ended</span>
          <h2>{phase === "handing" ? "Access handed over" : "Signed out"}</h2>
          <p>
            {phase === "handing"
              ? "You let another admin in. Signing you out…"
              : "Another admin signed in and took over the panel. Signing you out…"}
          </p>
        </div>
      </div>
    );
  }

  if (!pending) return null;

  return (
    <div
      className="admin-presence-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="adminPresenceTitle"
    >
      <div className="admin-presence-card">
        <span className="section-kicker">Login request</span>
        <h2 id="adminPresenceTitle">Someone is trying to sign in</h2>
        <p>
          Another person is trying to access the admin panel
          {pending.email ? ` as ${pending.email}` : ""}. Only one admin can be
          active at a time — do you want to let them in?
        </p>
        <div className="admin-actions-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => decide("approve")}
          >
            Allow them in (sign me out)
          </button>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => decide("deny")}
          >
            Keep my session
          </button>
        </div>
      </div>
    </div>
  );
}
