import { describe, expect, it } from "vitest";
import { canToggleAdminActive } from "@/lib/admin/auth";

// Locks the anti-lockout rule: a super admin may only (de)activate a
// second-level admin — never a super admin and never themselves.
describe("canToggleAdminActive", () => {
  const actingUserId = "super-1";

  it("allows toggling a second-level admin", () => {
    expect(
      canToggleAdminActive({
        actingUserId,
        target: { id: "second-1", isSuper: false },
      }),
    ).toBe(true);
  });

  it("refuses to toggle a super admin", () => {
    expect(
      canToggleAdminActive({
        actingUserId,
        target: { id: "super-2", isSuper: true },
      }),
    ).toBe(false);
  });

  it("refuses to toggle yourself", () => {
    expect(
      canToggleAdminActive({
        actingUserId,
        target: { id: actingUserId, isSuper: false },
      }),
    ).toBe(false);
  });
});
