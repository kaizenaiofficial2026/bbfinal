import "server-only";

import { cookies } from "next/headers";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";

/**
 * Single-active-admin session control + interactive login handoff.
 *
 * There is exactly one admin account, so two people signing in share the same
 * Supabase user — the user_id can't tell two sessions apart. We therefore give
 * each browser a random session id (the `admin_sid` httpOnly cookie) and track
 * which session currently "holds" the admin, plus any pending login request,
 * inside that single admin user's `user_metadata.admin_session`. This needs no
 * extra table/RPC (we can't run migrations here) and is naturally single-row.
 *
 * Everything fails OPEN: if the service role is unavailable or any call errors,
 * the legitimate admin is never locked out — the handoff is a best-effort
 * coordination layer, not a hard gate.
 */

export const ADMIN_SID_COOKIE = "admin_sid";

// An active session is considered live for this long after its last heartbeat.
// Kept short so an abandoned tab frees the seat within ~a minute and the next
// admin can claim it directly (no handoff needed).
const ACTIVE_TTL_MS = 60_000;
// Refresh the active session's expiry only when it drops below this — limits how
// often the heartbeat (which runs on every admin request + poll) writes.
const HEARTBEAT_REFRESH_BELOW_MS = 35_000;
// A pending login request waits this long for the active admin to respond.
const REQUEST_TTL_MS = 120_000;

type RequestStatus = "pending" | "approved" | "denied";

type ActiveHolder = { sid: string; email: string; expiresAt: number };
type LoginRequest = {
  id: string;
  sid: string;
  email: string;
  status: RequestStatus;
  createdAt: number;
  expiresAt: number;
};

export type AdminSessionState = {
  active: ActiveHolder | null;
  request: LoginRequest | null;
};

const EMPTY_STATE: AdminSessionState = { active: null, request: null };

function nowMs() {
  return Date.now();
}

function isLive(holder: { expiresAt: number } | null): boolean {
  return Boolean(holder && holder.expiresAt > nowMs());
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeActive(raw: unknown): ActiveHolder | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.sid) return null;
  return { sid: str(r.sid), email: str(r.email), expiresAt: num(r.expiresAt) };
}

function normalizeRequest(raw: unknown): LoginRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!r.id || !r.sid) return null;
  const status = str(r.status);
  return {
    id: str(r.id),
    sid: str(r.sid),
    email: str(r.email),
    status:
      status === "approved" || status === "denied" ? status : "pending",
    createdAt: num(r.createdAt),
    expiresAt: num(r.expiresAt),
  };
}

function normalizeState(raw: unknown): AdminSessionState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_STATE };
  const r = raw as Record<string, unknown>;
  return {
    active: normalizeActive(r.active),
    request: normalizeRequest(r.request),
  };
}

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type Loaded = {
  service: ServiceClient;
  meta: Record<string, unknown>;
  state: AdminSessionState;
};

async function load(userId: string): Promise<Loaded | null> {
  if (!canUseSupabaseService()) return null;
  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error || !data?.user) return null;
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    return { service, meta, state: normalizeState(meta.admin_session) };
  } catch (error) {
    console.error("[admin-session] load failed", error);
    return null;
  }
}

async function save(
  loaded: Loaded,
  userId: string,
  next: AdminSessionState,
): Promise<void> {
  try {
    const { error } = await loaded.service.auth.admin.updateUserById(userId, {
      user_metadata: { ...loaded.meta, admin_session: next },
    });
    if (error) console.error("[admin-session] save failed", error);
  } catch (error) {
    console.error("[admin-session] save failed", error);
  }
}

function makeActive(sid: string, email: string): ActiveHolder {
  return { sid, email, expiresAt: nowMs() + ACTIVE_TTL_MS };
}

// ── Cookie helpers ──────────────────────────────────────────────────────────

export async function getAdminSessionId(): Promise<string> {
  const store = await cookies();
  return store.get(ADMIN_SID_COOKIE)?.value ?? "";
}

/** Only callable from a Server Action or Route Handler (writes a cookie). */
export async function setAdminSessionId(sid: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SID_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // a day; the in-DB TTL is the real liveness control
  });
}

export async function clearAdminSessionId(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SID_COOKIE);
}

export function newAdminSessionId(): string {
  return crypto.randomUUID();
}

// ── Login: claim the seat, or contest it (creating a pending request) ─────────

export type LoginAttempt =
  | { active: true }
  | { active: false; contested: true; requestId: string };

export async function attemptAdminLogin(
  userId: string,
  sid: string,
  email: string,
): Promise<LoginAttempt> {
  const loaded = await load(userId);
  if (!loaded) return { active: true }; // fail open

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;

  // Seat is free (or already ours) → take it directly, clearing any stale request.
  if (!liveActive || liveActive.sid === sid) {
    await save(loaded, userId, { active: makeActive(sid, email), request: null });
    return { active: true };
  }

  // Someone else holds it → register a pending request for the active admin.
  const requestId = crypto.randomUUID();
  await save(loaded, userId, {
    active: loaded.state.active,
    request: {
      id: requestId,
      sid,
      email,
      status: "pending",
      createdAt: nowMs(),
      expiresAt: nowMs() + REQUEST_TTL_MS,
    },
  });
  return { active: false, contested: true, requestId };
}

// ── Heartbeat: am I still the holder? (used by requireAdmin) ─────────────────

export async function heartbeatAdminSession(
  userId: string,
  sid: string,
  email: string,
): Promise<boolean> {
  if (!sid) return false;
  const loaded = await load(userId);
  if (!loaded) return true; // fail open

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;

  if (liveActive && liveActive.sid === sid) {
    if (liveActive.expiresAt - nowMs() < HEARTBEAT_REFRESH_BELOW_MS) {
      await save(loaded, userId, {
        active: makeActive(sid, email),
        request: loaded.state.request,
      });
    }
    return true;
  }

  if (!liveActive) {
    // No live holder (previous admin's tab went idle) → reclaim the seat.
    await save(loaded, userId, { active: makeActive(sid, email), request: null });
    return true;
  }

  return false; // a different, live session holds the seat → superseded
}

// ── Active admin's presence poll (sees incoming requests; detects kick-out) ──

export type AdminPresence = {
  active: boolean;
  pending: { id: string; email: string; createdAt: number } | null;
};

export async function getAdminPresence(
  userId: string,
  sid: string,
  email: string,
): Promise<AdminPresence> {
  if (!sid) return { active: false, pending: null };
  const loaded = await load(userId);
  if (!loaded) return { active: true, pending: null }; // fail open

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;
  const isHolder = Boolean(liveActive && liveActive.sid === sid);

  if (!isHolder) {
    return { active: false, pending: null };
  }

  // Keep the seat warm while actively polling.
  if (liveActive && liveActive.expiresAt - nowMs() < HEARTBEAT_REFRESH_BELOW_MS) {
    await save(loaded, userId, {
      active: makeActive(sid, email),
      request: loaded.state.request,
    });
  }

  const req = loaded.state.request;
  const pending =
    req &&
    req.status === "pending" &&
    req.expiresAt > nowMs() &&
    req.sid !== sid
      ? { id: req.id, email: req.email, createdAt: req.createdAt }
      : null;

  return { active: true, pending };
}

// ── Active admin decides allow / deny ────────────────────────────────────────

export async function decideAdminLogin(
  userId: string,
  sid: string,
  requestId: string,
  decision: "approve" | "deny",
): Promise<"approved" | "denied" | "invalid"> {
  const loaded = await load(userId);
  if (!loaded) return "invalid";

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;
  if (!liveActive || liveActive.sid !== sid) return "invalid"; // only the holder decides

  const req = loaded.state.request;
  if (!req || req.id !== requestId || req.status !== "pending" || req.expiresAt <= nowMs()) {
    return "invalid";
  }

  if (decision === "approve") {
    // Hand the seat to the requester; the current admin is now superseded.
    await save(loaded, userId, {
      active: makeActive(req.sid, req.email),
      request: { ...req, status: "approved" },
    });
    return "approved";
  }

  await save(loaded, userId, {
    active: makeActive(sid, liveActive.email),
    request: { ...req, status: "denied" },
  });
  return "denied";
}

// ── Waiting admin's status poll (self-heals if its request was clobbered) ────

export type RequestPoll = {
  status: "pending" | "approved" | "denied" | "expired";
  requestId?: string;
};

export async function pollAdminLoginRequest(
  userId: string,
  sid: string,
  requestId: string,
  email: string,
): Promise<RequestPoll> {
  if (!sid) return { status: "denied" };
  const loaded = await load(userId);
  if (!loaded) return { status: "approved" }; // fail open → let them in

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;

  // Already the holder (approved + handed over) → we're in.
  if (liveActive && liveActive.sid === sid) return { status: "approved" };

  const req = loaded.state.request;
  if (req && req.id === requestId && req.sid === sid) {
    if (req.status === "denied") return { status: "denied" };
    if (req.status === "approved") return { status: "approved" };
    if (req.expiresAt <= nowMs()) return { status: "expired" };
    return { status: "pending" };
  }

  // Our request is gone (e.g. clobbered by a concurrent heartbeat write).
  if (!liveActive) {
    // Seat is free now → just take it.
    await save(loaded, userId, { active: makeActive(sid, email), request: null });
    return { status: "approved" };
  }

  // Seat still held by someone else → re-register a fresh pending request.
  const newId = crypto.randomUUID();
  await save(loaded, userId, {
    active: loaded.state.active,
    request: {
      id: newId,
      sid,
      email,
      status: "pending",
      createdAt: nowMs(),
      expiresAt: nowMs() + REQUEST_TTL_MS,
    },
  });
  return { status: "pending", requestId: newId };
}

// ── Release the seat (logout / abandon) ──────────────────────────────────────

export async function releaseAdminSession(
  userId: string,
  sid: string,
): Promise<void> {
  if (!sid) return;
  const loaded = await load(userId);
  if (!loaded) return;

  let next = loaded.state;
  if (loaded.state.active && loaded.state.active.sid === sid) {
    next = { ...next, active: null };
  }
  if (loaded.state.request && loaded.state.request.sid === sid) {
    next = { ...next, request: { ...loaded.state.request, status: "denied" } };
  }
  if (next !== loaded.state) {
    await save(loaded, userId, next);
  }
}
