import { describe, expect, it } from "vitest";
import {
  destinationAdminSchema,
  lines,
  packageAdminSchema,
} from "@/lib/validation/admin";

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
      expect(result.data.currency).toBe("LKR");
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
