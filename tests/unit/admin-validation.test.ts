import { describe, expect, it } from "vitest";
import {
  createAdminSchema,
  destinationAdminSchema,
  lines,
  packageAdminSchema,
} from "@/lib/validation/admin";

describe("createAdminSchema (super admin creating a second-level admin)", () => {
  const valid = {
    fullName: "Nimal Silva",
    email: "nimal@beyondborders.lk",
    password: "staffpass123",
    confirm: "staffpass123",
  };

  it("accepts a complete, valid new admin", () => {
    expect(createAdminSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a mismatched password confirmation", () => {
    const result = createAdminSchema.safeParse({
      ...valid,
      confirm: "different123",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0]?.message).toBe("Passwords do not match.");
  });

  it("rejects a short password", () => {
    const result = createAdminSchema.safeParse({
      ...valid,
      password: "short",
      confirm: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email and a blank name", () => {
    expect(
      createAdminSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
    expect(createAdminSchema.safeParse({ ...valid, fullName: "" }).success).toBe(
      false,
    );
  });

  // The form must never carry a tier: the action always creates second-level, so
  // a crafted request can't ask for super.
  it("ignores any tier supplied by the client", () => {
    const result = createAdminSchema.safeParse({ ...valid, tier: "super" });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("tier");
  });

  // These messages are shown to the super admin verbatim.
  it("phrases every failure for a human", () => {
    const result = createAdminSchema.safeParse({
      fullName: "",
      email: "nope",
      password: "x",
      confirm: "y",
    });
    expect(result.success).toBe(false);
    for (const issue of result.error!.issues) {
      expect(issue.message).not.toMatch(/too big|too small|expected string/i);
    }
  });
});

describe("admin validation", () => {
  it("accepts a valid package and defaults currency/status", () => {
    const result = packageAdminSchema.safeParse({
      slug: "glamour-of-sri-lanka",
      title: "Glamour of Sri Lanka",
      tier: "Luxury",
      hotels: "5-star",
      destinations: "Colombo",
      duration: "4 days / 3 nights",
      summary: "Colombo at its most polished.",
      inclusions: "Airport transfer\nDaily breakfast",
      itinerary: "Day 1 | Arrive | Settle in",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
      expect(result.data.status).toBe("draft");
    }
  });

  it("rejects a package with a too-short summary", () => {
    const result = packageAdminSchema.safeParse({
      slug: "x",
      title: "Test",
      tier: "Luxury",
      hotels: "5-star",
      destinations: "Colombo",
      duration: "4 days",
      summary: "short",
      inclusions: "Transfer",
      itinerary: "Day 1 | Arrive | Settle",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a destination and parses highlights into lines", () => {
    const parsed = destinationAdminSchema.parse({
      slug: "colombo",
      title: "Colombo",
      tagline: "Capital of Sri Lanka",
      keyAttraction: "Galle Face Green",
      summary: "Colombo is the island's lively first chapter.",
      bestFor: "City arrivals",
      highlights: "Walk Galle Face\nExplore Pettah",
    });

    expect(lines(parsed.highlights)).toEqual(["Walk Galle Face", "Explore Pettah"]);
  });

  it("strips blank lines when splitting", () => {
    expect(lines("  one  \n\n  two \n   ")).toEqual(["one", "two"]);
  });
});
