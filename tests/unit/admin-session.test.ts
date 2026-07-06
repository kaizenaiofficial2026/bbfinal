import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the single admin user's user_metadata. load()/save()
// in session.ts read and write this through the service client.
const store: Record<string, Record<string, unknown>> = {};

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  canUseSupabaseService: () => true,
  createSupabaseServiceClient: () => ({
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: { user: { id, user_metadata: store[id] ?? {} } },
          error: null,
        }),
        updateUserById: async (
          id: string,
          attrs: { user_metadata: Record<string, unknown> },
        ) => {
          store[id] = attrs.user_metadata;
          return { data: { user: { id, user_metadata: attrs.user_metadata } }, error: null };
        },
      },
    },
  }),
}));

import {
  attemptAdminLogin,
  decideAdminLogin,
  getAdminPresence,
  pollAdminLoginRequest,
  releaseAdminSession,
} from "@/lib/admin/session";

const USER = "admin-1";
const A = { sid: "sid-a", email: "a@bb.lk" };
const B = { sid: "sid-b", email: "b@bb.lk" };
const C = { sid: "sid-c", email: "c@bb.lk" };

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe("admin single-active-session handoff — concurrent contenders", () => {
  it("keeps both contenders' requests alive instead of clobbering (the loop bug)", async () => {
    // A takes the seat.
    expect(await attemptAdminLogin(USER, A.sid, A.email)).toEqual({ active: true });

    // B and C both contest at (about) the same time.
    const rb = await attemptAdminLogin(USER, B.sid, B.email);
    const rc = await attemptAdminLogin(USER, C.sid, C.email);
    expect(rb).toMatchObject({ active: false, contested: true });
    expect(rc).toMatchObject({ active: false, contested: true });
    const bId = (rb as { requestId: string }).requestId;
    const cId = (rc as { requestId: string }).requestId;

    // Both requests coexist in the queue — C did NOT overwrite B.
    const queued = (store[USER].admin_session as { requests: unknown[] }).requests;
    expect(queued).toHaveLength(2);

    // Each contender polls repeatedly; neither poll wipes the other's request
    // (this is exactly what used to ping-pong forever).
    for (let i = 0; i < 5; i++) {
      const pb = await pollAdminLoginRequest(USER, B.sid, bId, B.email);
      const pc = await pollAdminLoginRequest(USER, C.sid, cId, C.email);
      expect(pb.status).toBe("pending");
      expect(pc.status).toBe("pending");
    }
    expect(
      (store[USER].admin_session as { requests: unknown[] }).requests,
    ).toHaveLength(2);
  });

  it("lets the active admin approve a contender — and it actually takes", async () => {
    await attemptAdminLogin(USER, A.sid, A.email);
    const rb = await attemptAdminLogin(USER, B.sid, B.email);
    await attemptAdminLogin(USER, C.sid, C.email);
    const bId = (rb as { requestId: string }).requestId;

    // A sees a pending request and approves B's id. Previously this returned
    // "invalid" because the id had been clobbered; now it succeeds.
    const presence = await getAdminPresence(USER, A.sid, A.email);
    expect(presence.active).toBe(true);
    expect(presence.pending).not.toBeNull();

    const decision = await decideAdminLogin(USER, A.sid, bId, "approve");
    expect(decision).toBe("approved");

    // B is now the holder.
    expect(await pollAdminLoginRequest(USER, B.sid, bId, B.email)).toMatchObject({
      status: "approved",
    });

    // C is still waiting — now contesting the NEW holder B, who can decide.
    const presenceB = await getAdminPresence(USER, B.sid, B.email);
    expect(presenceB.active).toBe(true);
    expect(presenceB.pending?.email).toBe(C.email);
  });

  it("denies only the targeted contender; the other stays pending", async () => {
    await attemptAdminLogin(USER, A.sid, A.email);
    const rb = await attemptAdminLogin(USER, B.sid, B.email);
    const rc = await attemptAdminLogin(USER, C.sid, C.email);
    const bId = (rb as { requestId: string }).requestId;
    const cId = (rc as { requestId: string }).requestId;

    expect(await decideAdminLogin(USER, A.sid, bId, "deny")).toBe("denied");

    // B learns it was denied; A keeps the seat; C is untouched.
    expect(await pollAdminLoginRequest(USER, B.sid, bId, B.email)).toMatchObject({
      status: "denied",
    });
    const presence = await getAdminPresence(USER, A.sid, A.email);
    expect(presence.active).toBe(true);
    expect(presence.pending?.email).toBe(C.email);
    expect(await pollAdminLoginRequest(USER, C.sid, cId, C.email)).toMatchObject({
      status: "pending",
    });
  });

  it("cancelling one contender leaves the other cleanly approvable", async () => {
    await attemptAdminLogin(USER, A.sid, A.email);
    const rb = await attemptAdminLogin(USER, B.sid, B.email);
    const rc = await attemptAdminLogin(USER, C.sid, C.email);
    const bId = (rb as { requestId: string }).requestId;
    const cId = (rc as { requestId: string }).requestId;

    // B cancels (abandons the waiting screen).
    await releaseAdminSession(USER, B.sid);
    expect(await pollAdminLoginRequest(USER, B.sid, bId, B.email)).toMatchObject({
      status: "pending", // re-registers on its own poll, but that's B's choice
    });

    // C can still be approved by A.
    expect(await decideAdminLogin(USER, A.sid, cId, "approve")).toBe("approved");
    expect(await pollAdminLoginRequest(USER, C.sid, cId, C.email)).toMatchObject({
      status: "approved",
    });
  });

  it("self-heals a lost update: a dropped request re-registers without clobbering", async () => {
    await attemptAdminLogin(USER, A.sid, A.email);
    const rb = await attemptAdminLogin(USER, B.sid, B.email);
    const rc = await attemptAdminLogin(USER, C.sid, C.email);
    const bId = (rb as { requestId: string }).requestId;
    const cId = (rc as { requestId: string }).requestId;

    // Simulate a concurrent write that lost B's request (only C survives) — the
    // classic read-modify-write race on the shared metadata row.
    const meta = store[USER].admin_session as { active: unknown; requests: unknown[] };
    meta.requests = meta.requests.filter(
      (r) => (r as { sid: string }).sid === C.sid,
    );
    expect(meta.requests).toHaveLength(1);

    // B's next poll finds its request gone and re-registers by APPENDING — it
    // must not wipe C. Both end up queued again (this is what broke the loop).
    const pb = await pollAdminLoginRequest(USER, B.sid, bId, B.email);
    expect(pb.status).toBe("pending");
    const requests = (store[USER].admin_session as { requests: { sid: string }[] })
      .requests;
    expect(requests.map((r) => r.sid).sort()).toEqual([C.sid, B.sid].sort());

    // And C is still approvable with its original id.
    expect(await decideAdminLogin(USER, A.sid, cId, "approve")).toBe("approved");
  });

  it("a freed seat is reclaimed directly, no handoff needed", async () => {
    await attemptAdminLogin(USER, A.sid, A.email);
    await releaseAdminSession(USER, A.sid); // A signs out
    // B now logs in and should get the seat straight away.
    expect(await attemptAdminLogin(USER, B.sid, B.email)).toEqual({ active: true });
  });
});
