import { describe, expect, it } from "vitest";
import { customInquirySchema } from "@/lib/validation/custom-inquiry";

const guest = {
  firstName: "Asha",
  lastName: "Perera",
  countryCity: "Sri Lanka, Colombo",
  passportNumber: "N1234567",
  email: "asha@example.com",
  mobile: "+94 77 123 4567",
  company: "",
};

function hotel(overrides: Record<string, unknown> = {}) {
  return {
    inquiryType: "hotel",
    ...guest,
    hotel: "Cinnamon Grand",
    roomCategory: "Deluxe",
    roomType: "Double",
    mealPlan: "Half Board",
    numberOfRooms: 1,
    arrival: "2026-07-01",
    departure: "2026-07-10",
    adults: 2,
    children: 0,
    extraBed: "No",
    ...overrides,
  };
}

function airticket(overrides: Record<string, unknown> = {}) {
  return {
    inquiryType: "airticket",
    ...guest,
    airline: "SriLankan",
    route: "CMB-DXB",
    wayType: "Both way",
    arrival: "2026-07-01",
    departure: "2026-07-10",
    flightClass: "Economy",
    pax: 1,
    extraBaggage: "No",
    ...overrides,
  };
}

describe("custom inquiry date validation", () => {
  it("accepts a hotel stay with departure after arrival", () => {
    expect(customInquirySchema.safeParse(hotel()).success).toBe(true);
  });

  it("accepts a same-day arrival and departure", () => {
    expect(
      customInquirySchema.safeParse(
        hotel({ arrival: "2026-07-05", departure: "2026-07-05" }),
      ).success,
    ).toBe(true);
  });

  it("rejects a hotel departure before arrival, flagging the departure field", () => {
    const result = customInquirySchema.safeParse(
      hotel({ arrival: "2026-07-10", departure: "2026-07-01" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("departure")),
      ).toBe(true);
    }
  });

  it("allows a one-way air ticket with no return date", () => {
    expect(
      customInquirySchema.safeParse(
        airticket({ wayType: "One way", departure: "" }),
      ).success,
    ).toBe(true);
  });

  it("requires a return date for a round trip", () => {
    const result = customInquirySchema.safeParse(
      airticket({ wayType: "Both way", departure: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("departure")),
      ).toBe(true);
    }
  });

  it("rejects an air ticket whose return precedes departure", () => {
    expect(
      customInquirySchema.safeParse(
        airticket({ arrival: "2026-07-10", departure: "2026-07-01" }),
      ).success,
    ).toBe(false);
  });

  it("rejects an inquiry missing country/city or passport (now required)", () => {
    expect(
      customInquirySchema.safeParse(hotel({ countryCity: "" })).success,
    ).toBe(false);
    expect(
      customInquirySchema.safeParse(hotel({ passportNumber: "" })).success,
    ).toBe(false);
  });
});
