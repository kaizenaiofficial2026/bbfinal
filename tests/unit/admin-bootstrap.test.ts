import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,
  profile: null as Record<string, unknown> | null,
  profileUpsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  canUseSupabaseServer: () => true,
  createSupabaseServerClient: async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({ data: mocks.profile, error: null })),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);

    return {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: mocks.user } })),
      },
      from: vi.fn(() => query),
    };
  },
}));

vi.mock("@/lib/supabase/service", () => ({
  canUseSupabaseService: () => true,
  createSupabaseServiceClient: () => ({
    from: vi.fn(() => ({
      upsert: mocks.profileUpsert,
    })),
  }),
}));

vi.mock("@/lib/admin/session", () => ({
  getAdminSessionId: vi.fn(),
  heartbeatAdminSession: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ADMIN_ALLOWED_EMAILS", "staff@beyondborders.lk");
  vi.stubEnv("SUPER_ADMIN_EMAILS", "staff@beyondborders.lk");
  mocks.profile = null;
  mocks.profileUpsert.mockReset();
  mocks.profileUpsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function authUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "d5c9762d-b674-4aeb-a345-db04162c1eb0",
    email: "staff@beyondborders.lk",
    app_metadata: {},
    user_metadata: { full_name: "QA Staff" },
    ...overrides,
  };
}

describe("admin profile bootstrap", () => {
  it("does not grant admin access from an allowlisted email alone", async () => {
    mocks.user = authUser();
    const { getAdminUser } = await import("@/lib/admin/auth");

    await expect(getAdminUser()).resolves.toBeNull();
    expect(mocks.profileUpsert).not.toHaveBeenCalled();
  });

  it("does not trust a tier placed in user-editable metadata", async () => {
    mocks.user = authUser({
      user_metadata: {
        full_name: "QA Staff",
        admin_tier: "super",
      },
    });
    const { getAdminUser } = await import("@/lib/admin/auth");

    await expect(getAdminUser()).resolves.toBeNull();
    expect(mocks.profileUpsert).not.toHaveBeenCalled();
  });

  it("bootstraps only a service-role-stamped account", async () => {
    mocks.user = authUser({
      app_metadata: { admin_tier: "second" },
    });
    const { getAdminUser } = await import("@/lib/admin/auth");

    const user = await getAdminUser();

    expect(user?.id).toBe(mocks.user?.id);
    expect(user?.app_metadata.admin_tier).toBe("second");
    expect(mocks.profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mocks.user?.id,
        role: "admin",
        tier: "second",
        active: true,
      }),
      { onConflict: "id" },
    );
  });
});
