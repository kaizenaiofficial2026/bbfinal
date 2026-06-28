import { describe, expect, it } from "vitest";
import { makeIpRateLimiter } from "@/lib/security/ip-rate-limit";

describe("makeIpRateLimiter", () => {
  it("allows up to max per window, then blocks", () => {
    const limited = makeIpRateLimiter({ windowMs: 1000, max: 3 });
    expect(limited("a", 1000)).toBe(false);
    expect(limited("a", 1000)).toBe(false);
    expect(limited("a", 1000)).toBe(false);
    expect(limited("a", 1000)).toBe(true); // 4th -> blocked
  });

  it("resets once the window elapses", () => {
    const limited = makeIpRateLimiter({ windowMs: 1000, max: 1 });
    expect(limited("a", 1000)).toBe(false);
    expect(limited("a", 1000)).toBe(true);
    expect(limited("a", 2001)).toBe(false); // new window
  });

  it("tracks distinct keys independently", () => {
    const limited = makeIpRateLimiter({ windowMs: 1000, max: 1 });
    expect(limited("a", 1000)).toBe(false);
    expect(limited("b", 1000)).toBe(false);
    expect(limited("a", 1000)).toBe(true);
  });

  it("stays bounded: evicts oldest keys past the cap under a distinct-key flood", () => {
    const limited = makeIpRateLimiter({ windowMs: 100_000, max: 1 });
    // The earliest key hits its limit and would be blocked...
    expect(limited("victim", 1000)).toBe(false);
    expect(limited("victim", 1000)).toBe(true);
    // ...but a flood of >5000 distinct fresh keys (same window) forces eviction
    // of the oldest entries, so the victim's state is dropped and it is allowed
    // afresh — proving the map is hard-capped rather than growing unbounded.
    for (let i = 0; i < 6000; i++) limited(`flood-${i}`, 1000);
    expect(limited("victim", 1000)).toBe(false);
  });
});
