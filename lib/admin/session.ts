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
  // A QUEUE of contesting login requests, one per waiting session (keyed by sid).
  // Previously a single slot, which two simultaneous contenders would clobber in
  // an endless loop — each overwriting the other's request every poll, so the
  // active admin's "Allow" always targeted a since-replaced id and never took.
  requests: LoginRequest[];
};

const EMPTY_STATE: AdminSessionState = { active: null, requests: [] };

// Cap the queue so a burst of attempts can't bloat user_metadata.
const MAX_REQUESTS = 12;

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

function normalizeRequests(raw: unknown): LoginRequest[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: LoginRequest[] = [];
  for (const item of list) {
    const req = normalizeRequest(item);
    if (req) out.push(req);
  }
  return out;
}

function normalizeState(raw: unknown): AdminSessionState {
  if (!raw || typeof raw !== "object") return { active: null, requests: [] };
  const r = raw as Record<string, unknown>;
  // Prefer the queue; fall back to a legacy single `request` for any in-flight
  // state written before this shape (harmless, self-heals on the next write).
  const requests = Array.isArray(r.requests)
    ? normalizeRequests(r.requests)
    : (() => {
        const legacy = normalizeRequest(r.request);
        return legacy ? [legacy] : [];
      })();
  return { active: normalizeActive(r.active), requests };
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

// Drop expired requests, keep at most one entry per session (the latest), sort
// oldest-first, and cap the total. Keeping non-pending (denied) entries lets a
// waiter still read its outcome; they age out via expiresAt.
function pruneRequests(requests: LoginRequest[]): LoginRequest[] {
  const now = nowMs();
  const bySid = new Map<string, LoginRequest>();
  for (const req of requests) {
    if (req.expiresAt <= now) continue;
    const existing = bySid.get(req.sid);
    if (!existing || req.createdAt >= existing.createdAt) {
      bySid.set(req.sid, req);
    }
  }
  return Array.from(bySid.values())
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_REQUESTS);
}

// Replace (or add) this session's request in the queue without touching others.
function upsertRequest(
  requests: LoginRequest[],
  req: LoginRequest,
): LoginRequest[] {
  return pruneRequests([...requests.filter((r) => r.sid !== req.sid), req]);
}

// The oldest still-pending request not owned by the current holder — i.e. the
// next one the active admin is asked to decide on.
function nextPending(
  requests: LoginRequest[],
  holderSid: string,
): LoginRequest | null {
  const now = nowMs();
  for (const req of requests) {
    if (req.status === "pending" && req.expiresAt > now && req.sid !== holderSid) {
      return req;
    }
  }
  return null;
}

function makeRequest(sid: string, email: string): LoginRequest {
  const now = nowMs();
  return {
    id: crypto.randomUUID(),
    sid,
    email,
    status: "pending",
    createdAt: now,
    expiresAt: now + REQUEST_TTL_MS,
  };
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

  // Seat is free (or already ours) → take it directly, clearing the queue.
  if (!liveActive || liveActive.sid === sid) {
    await save(loaded, userId, { active: makeActive(sid, email), requests: [] });
    return { active: true };
  }

  // Someone else holds it → add THIS session's request to the queue (coexisting
  // with any other contenders, never overwriting them).
  const req = makeRequest(sid, email);
  await save(loaded, userId, {
    active: loaded.state.active,
    requests: upsertRequest(loaded.state.requests, req),
  });
  return { active: false, contested: true, requestId: req.id };
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
        requests: pruneRequests(loaded.state.requests),
      });
    }
    return true;
  }

  if (!liveActive) {
    // No live holder (previous admin's tab went idle) → reclaim the seat.
    await save(loaded, userId, { active: makeActive(sid, email), requests: [] });
    return true;
  }

  return false; // a different, live session holds the seat → superseded
}

// ── Active admin's presence poll (sees incoming requests; detects kick-out) ──

export type AdminPresence = {
  active: boolean;
  // Why the seat was lost: "taken" = another live session holds it; "idle" =
  // our lease expired with no live holder (inactivity). Drives the login message.
  reason?: "taken" | "idle";
  pending: { id: string; email: string; createdAt: number } | null;
};

export async function getAdminPresence(
  userId: string,
  sid: string,
  email: string,
): Promise<AdminPresence> {
  if (!sid) return { active: false, reason: "idle", pending: null };
  const loaded = await load(userId);
  if (!loaded) return { active: true, pending: null }; // fail open

  const liveActive = isLive(loaded.state.active) ? loaded.state.active : null;
  const isHolder = Boolean(liveActive && liveActive.sid === sid);

  if (!isHolder) {
    // A live seat is never force-taken from an active holder (a new login only
    // claims a FREE seat, or goes through the separate contest/handover flow).
    // So if our poll finds we're no longer the holder, our own lease lapsed —
    // i.e. inactivity — even if another admin has since claimed the freed seat.
    return { active: false, reason: "idle", pending: null };
  }

  // Keep the seat warm while actively polling.
  if (liveActive && liveActive.expiresAt - nowMs() < HEARTBEAT_REFRESH_BELOW_MS) {
    await save(loaded, userId, {
      active: makeActive(sid, email),
      requests: pruneRequests(loaded.state.requests),
    });
  }

  const req = nextPending(loaded.state.requests, sid);
  const pending = req
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

  const requests = pruneRequests(loaded.state.requests);
  const req = requests.find(
    (r) => r.id === requestId && r.status === "pending" && r.expiresAt > nowMs(),
  );
  if (!req) return "invalid";

  if (decision === "approve") {
    // Hand the seat to this requester; the current admin is now superseded. Any
    // OTHER contenders stay queued and now contest the new holder.
    await save(loaded, userId, {
      active: makeActive(req.sid, req.email),
      requests: requests.filter((r) => r.sid !== req.sid),
    });
    return "approved";
  }

  // Deny only this one (so its waiter sees the outcome); keep other contenders.
  await save(loaded, userId, {
    active: makeActive(sid, liveActive.email),
    requests: requests.map((r) =>
      r.id === req.id ? { ...r, status: "denied" as const } : r,
    ),
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

  // Our request is keyed by session, so find it by sid (tolerating an id that
  // drifted). Because contenders no longer overwrite each other, this stays put.
  const req =
    loaded.state.requests.find((r) => r.sid === sid && r.id === requestId) ??
    loaded.state.requests.find((r) => r.sid === sid);
  if (req) {
    if (req.status === "denied") return { status: "denied" };
    if (req.status === "approved") return { status: "approved" };
    if (req.expiresAt <= nowMs()) return { status: "expired" };
    // Tell the client to adopt the current id if it changed.
    return req.id === requestId
      ? { status: "pending" }
      : { status: "pending", requestId: req.id };
  }

  // Our request is gone entirely.
  if (!liveActive) {
    // Seat is free now → just take it.
    await save(loaded, userId, { active: makeActive(sid, email), requests: [] });
    return { status: "approved" };
  }

  // Seat still held by someone else → re-register (appending, not clobbering).
  const fresh = makeRequest(sid, email);
  await save(loaded, userId, {
    active: loaded.state.active,
    requests: upsertRequest(loaded.state.requests, fresh),
  });
  return { status: "pending", requestId: fresh.id };
}

// ── Release the seat (logout / abandon) ──────────────────────────────────────

export async function releaseAdminSession(
  userId: string,
  sid: string,
): Promise<void> {
  if (!sid) return;
  const loaded = await load(userId);
  if (!loaded) return;

  let changed = false;
  let active = loaded.state.active;
  if (active && active.sid === sid) {
    active = null;
    changed = true;
  }
  const requests = loaded.state.requests.filter((r) => r.sid !== sid);
  if (requests.length !== loaded.state.requests.length) {
    changed = true;
  }
  if (changed) {
    await save(loaded, userId, { active, requests });
  }
}
