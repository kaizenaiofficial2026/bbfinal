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
  const [kickReason, setKickReason] = useState<"taken" | "idle">("taken");
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
          reason?: "taken" | "idle";
          pending?: Pending | null;
        };
        if (cancelled || !data.authed) return;
        if (data.active === false) {
          if (timer) clearInterval(timer);
          const reason = data.reason === "idle" ? "idle" : "taken";
          setKickReason(reason);
          setPhase("kicked");
          await adminKickedSignOutAction();
          window.location.href = `/admin/login?kicked=1&reason=${reason}`;
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
          <span className="admin-waiting-spinner" aria-hidden="true" />
          <span className="section-kicker">Session ended</span>
          <h2>{phase === "handing" ? "Access handed over" : "Signed out"}</h2>
          <p>
            {phase === "handing"
              ? "You let another admin in. Signing you out…"
              : kickReason === "idle"
                ? "Your session ended after a period of inactivity. Signing you out…"
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
        <span className="admin-presence-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </span>
        <span className="section-kicker">Login request</span>
        <h2 id="adminPresenceTitle">Someone is trying to sign in</h2>
        <p>
          Another person wants to access the admin panel. Only one admin can be
          active at a time — do you want to let them in?
        </p>
        {pending.email ? (
          <span className="admin-presence-email">{pending.email}</span>
        ) : null}
        <div className="admin-decision">
          <button
            type="button"
            className="admin-decision-btn admin-decision-allow"
            onClick={() => decide("approve")}
          >
            <span className="admin-decision-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </span>
            <span className="admin-decision-text">
              <span className="admin-decision-title">Allow them in</span>
              <span className="admin-decision-sub">
                You’ll be signed out of this device
              </span>
            </span>
          </button>
          <button
            type="button"
            className="admin-decision-btn admin-decision-keep"
            onClick={() => decide("deny")}
          >
            <span className="admin-decision-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="admin-decision-text">
              <span className="admin-decision-title">Keep my session</span>
              <span className="admin-decision-sub">They’ll stay locked out</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
