import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `env` snapshots process.env at module load, so each case sets the allowlist
 * first and re-imports to get a fresh read.
 */
async function loadAuth(superAdminEmails: string) {
  vi.resetModules();
  vi.stubEnv("SUPER_ADMIN_EMAILS", superAdminEmails);
  return import("@/lib/admin/auth");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("readAdminTier", () => {
  it("reads an explicit tier stamp", async () => {
    const { readAdminTier } = await loadAuth("boss@bb.lk");
    expect(readAdminTier({ admin_tier: "second" })).toBe("second");
    expect(readAdminTier({ admin_tier: "super" })).toBe("super");
  });

  it("returns null when there is no usable stamp", async () => {
    const { readAdminTier } = await loadAuth("boss@bb.lk");
    expect(readAdminTier(null)).toBeNull();
    expect(readAdminTier(undefined)).toBeNull();
    expect(readAdminTier({})).toBeNull();
    // Anything that isn't one of the two known tiers must not be trusted.
    expect(readAdminTier({ admin_tier: "administrator" })).toBeNull();
    expect(readAdminTier({ admin_tier: true })).toBeNull();
  });
});

describe("resolveIsSuperAdmin", () => {
  it("falls back to the env allowlist when no tier is stamped", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("boss@bb.lk");
    expect(resolveIsSuperAdmin({ email: "boss@bb.lk" })).toBe(true);
    expect(resolveIsSuperAdmin({ email: "helper@bb.lk" })).toBe(false);
  });

  it("keeps the single-tier default: empty allowlist means every admin is super", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("");
    expect(resolveIsSuperAdmin({ email: "anyone@bb.lk" })).toBe(true);
  });

  /**
   * The escalation guard. With no SUPER_ADMIN_EMAILS configured the env path
   * treats EVERY admin as super, so a panel-created admin must be pinned to
   * second-level by its stamp or it would silently gain full access.
   */
  it("honours a 'second' stamp even when the env path would say super", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("");
    expect(
      resolveIsSuperAdmin({
        email: "created@bb.lk",
        appMetadata: { admin_tier: "second" },
      }),
    ).toBe(false);
  });

  it("lets the stamp win over the allowlist in both directions", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("boss@bb.lk");
    // Listed as super, but stamped second → second.
    expect(
      resolveIsSuperAdmin({
        email: "boss@bb.lk",
        appMetadata: { admin_tier: "second" },
      }),
    ).toBe(false);
    // Not listed, but stamped super → super.
    expect(
      resolveIsSuperAdmin({
        email: "helper@bb.lk",
        appMetadata: { admin_tier: "super" },
      }),
    ).toBe(true);
  });

  it("treats a missing email with no stamp as not super", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("boss@bb.lk");
    expect(resolveIsSuperAdmin({ email: null })).toBe(false);
    expect(resolveIsSuperAdmin({ email: "" })).toBe(false);
  });

  it("matches the allowlist case-insensitively", async () => {
    const { resolveIsSuperAdmin } = await loadAuth("boss@bb.lk");
    expect(resolveIsSuperAdmin({ email: "BOSS@BB.LK" })).toBe(true);
  });
});
