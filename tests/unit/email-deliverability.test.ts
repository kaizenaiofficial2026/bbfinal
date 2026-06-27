import { describe, it, expect } from "vitest";
import { isReservedEmailDomain } from "@/lib/validation/email-deliverability";

// Guards the outbound-send filter: addresses on reserved/non-routable domains
// must be recognised so the app never hands them to SMTP (they NXDOMAIN-bounce
// back to reservations@). See lib/email/send.tsx.
describe("isReservedEmailDomain", () => {
  it("flags the e2e harness domain that caused the bounce flood", () => {
    expect(isReservedEmailDomain("qa-cust-123@beyondborders.test")).toBe(true);
  });

  it("flags every RFC 2606 / 6761 reserved TLD and doc domain", () => {
    for (const addr of [
      "x@anything.test",
      "x@foo.example",
      "x@bar.invalid",
      "x@host.localhost",
      "x@example.com",
      "x@test.com",
    ]) {
      expect(isReservedEmailDomain(addr), addr).toBe(true);
    }
  });

  it("is case- and whitespace-insensitive", () => {
    expect(isReservedEmailDomain("  QA@BeyondBorders.TEST ")).toBe(true);
  });

  it("passes real, routable recipient domains through", () => {
    for (const addr of [
      "reservations@beyondborders.lk",
      "customer@gmail.com",
      "lasantha@bellagiocolombo.com",
    ]) {
      expect(isReservedEmailDomain(addr), addr).toBe(false);
    }
  });

  it("does not throw on malformed input", () => {
    expect(isReservedEmailDomain("not-an-email")).toBe(false);
    expect(isReservedEmailDomain("@nodomain.test")).toBe(false); // no local part → not a real recipient
    expect(isReservedEmailDomain("trailing@")).toBe(false);
    expect(isReservedEmailDomain("")).toBe(false);
  });
});
