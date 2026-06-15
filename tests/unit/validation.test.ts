import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/lib/validation/booking";
import { enquirySchema } from "@/lib/validation/enquiry";

describe("public form validation", () => {
  it("accepts a valid enquiry", () => {
    const result = enquirySchema.safeParse({
      name: "Asha Perera",
      email: "asha@example.com",
      message: "We would like a private Sri Lanka journey in August.",
      packageLabel: "Custom journey",
      source: "contact-form",
      company: "",
      startedAt: Date.now() - 5000,
    });

    expect(result.success).toBe(true);
  });

  it("rejects honeypot-filled enquiries", () => {
    const result = enquirySchema.safeParse({
      name: "Bot",
      email: "bot@example.com",
      message: "This should not pass validation.",
      company: "Filled by bot",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid booking request", () => {
    const result = bookingSchema.safeParse({
      tourPackageId: "11111111-1111-4111-8111-111111111111",
      packageTitle: "Glamour of Sri Lanka",
      travellerName: "Asha Perera",
      email: "asha@example.com",
      travelDates: "August 2026",
      travellers: "2",
      company: "",
    });

    expect(result.success).toBe(true);
  });
});
