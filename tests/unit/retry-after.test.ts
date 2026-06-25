import { describe, expect, it } from "vitest";
import { toRetryMinutes } from "@/lib/security/retry-after";

describe("toRetryMinutes", () => {
  it("rounds up to whole minutes", () => {
    expect(toRetryMinutes(1)).toBe(1);
    expect(toRetryMinutes(59)).toBe(1);
    expect(toRetryMinutes(60)).toBe(1);
    expect(toRetryMinutes(61)).toBe(2);
    expect(toRetryMinutes(600)).toBe(10);
  });

  it("never returns less than one minute", () => {
    expect(toRetryMinutes(0)).toBe(1);
    expect(toRetryMinutes(undefined)).toBe(1);
    expect(toRetryMinutes(-5)).toBe(1);
  });
});
