import { describe, expect, it } from "vitest";
import { scopedRateKey } from "@/lib/security/request";

describe("scopedRateKey", () => {
  it("is deterministic for the same ip + scope", () => {
    expect(scopedRateKey("iphash", "a@b.com")).toBe(
      scopedRateKey("iphash", "a@b.com"),
    );
  });

  it("gives each account its own bucket on a shared IP", () => {
    // The whole point of the fix: two users behind one office/CGNAT IP must not
    // share a rate-limit window.
    expect(scopedRateKey("iphash", "a@b.com")).not.toBe(
      scopedRateKey("iphash", "c@d.com"),
    );
  });

  it("normalises case + surrounding space in the scope", () => {
    expect(scopedRateKey("iphash", " A@B.com ")).toBe(
      scopedRateKey("iphash", "a@b.com"),
    );
  });

  it("falls back to the bare IP bucket when the scope is empty", () => {
    expect(scopedRateKey("iphash", "")).toBe("iphash");
    expect(scopedRateKey("iphash", "   ")).toBe("iphash");
  });
});
