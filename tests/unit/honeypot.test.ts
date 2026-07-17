import { describe, expect, it } from "vitest";
import { HONEYPOT_FIELD, trippedHoneypot } from "@/lib/security/honeypot";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("spam honeypot", () => {
  it("passes a form that leaves the trap empty", () => {
    expect(trippedHoneypot(form({ [HONEYPOT_FIELD]: "" }))).toBe(false);
  });

  it("passes a form that omits the trap entirely", () => {
    expect(trippedHoneypot(form({ name: "Asha" }))).toBe(false);
  });

  it("treats whitespace as empty", () => {
    expect(trippedHoneypot(form({ [HONEYPOT_FIELD]: "   " }))).toBe(false);
  });

  it("catches a form with the trap filled", () => {
    expect(trippedHoneypot(form({ [HONEYPOT_FIELD]: "Filled by bot" }))).toBe(
      true,
    );
  });

  // The trap was named "company", which Chrome autofilled from the visitor's
  // saved address profile and blocked real registrations. Any name matching
  // autofill's heuristics reintroduces that bug.
  it("uses a field name browser autofill has no heuristic for", () => {
    expect(HONEYPOT_FIELD).not.toMatch(
      /company|organization|address|name|tel|phone|email|country|city/i,
    );
  });

  it("ignores a filled 'company' field, which is now a real user value", () => {
    expect(trippedHoneypot(form({ company: "Beyond Borders" }))).toBe(false);
  });
});
