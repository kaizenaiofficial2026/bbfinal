import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/lib/validation/booking";
import { enquirySchema } from "@/lib/validation/enquiry";

describe("public form validation", () => {
  it("accepts a valid enquiry", () => {
    const result = enquirySchema.safeParse({
      name: "Asha Perera",
      email: "asha@example.com",
      phone: "+94 77 123 4567",
      country: "Sri Lanka",
      message: "We would like a private Sri Lanka journey in August.",
      packageLabel: "Custom journey",
      source: "contact-form",
      startedAt: Date.now() - 5000,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an enquiry missing required fields (phone, country, package)", () => {
    const result = enquirySchema.safeParse({
      name: "Asha Perera",
      email: "asha@example.com",
      message: "We would like a private Sri Lanka journey in August.",
      source: "contact-form",
      startedAt: Date.now() - 5000,
    });

    expect(result.success).toBe(false);
  });

  // The honeypot is enforced in the server action against the raw FormData, not
  // in the schema — see tests/unit/honeypot.test.ts. Keeping it out of the
  // schema is what stops a trap hit from reaching the visitor as a field error.
  it("ignores unknown fields such as the honeypot", () => {
    const result = enquirySchema.safeParse({
      name: "Asha Perera",
      email: "asha@example.com",
      phone: "+94 77 123 4567",
      country: "Sri Lanka",
      message: "We would like a private Sri Lanka journey in August.",
      packageLabel: "Custom journey",
      source: "contact-form",
      referralCode: "Filled by bot",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid booking request", () => {
    const result = bookingSchema.safeParse({
      tourPackageId: "11111111-1111-4111-8111-111111111111",
      packageTitle: "Glamour of Sri Lanka",
      travellerName: "Asha Perera",
      email: "asha@example.com",
      travelDates: "August 2026",
      travellers: "2",
    });

    expect(result.success).toBe(true);
  });
});
