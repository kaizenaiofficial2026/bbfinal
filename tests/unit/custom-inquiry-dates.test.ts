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

// A fully-filled combined inquiry (every section is mandatory).
function combined(overrides: Record<string, unknown> = {}) {
  return {
    ...guest,
    // Package
    package: "Glamour of Sri Lanka - USD 499",
    // Hotel
    hotel: "Cinnamon Grand",
    hotelRoomCategory: "Deluxe",
    hotelRoomType: "Double",
    hotelMealPlan: "Half Board",
    hotelRooms: 1,
    hotelArrival: "2026-07-01",
    hotelDeparture: "2026-07-10",
    hotelAdults: 2,
    hotelChildren: 0,
    hotelExtraBed: "No",
    // Air ticket — trip type + segments JSON (as the trip builder posts).
    airline: "SriLankan",
    airTripType: "Round trip",
    airSegments: JSON.stringify([
      { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2026-07-01", returnDate: "2026-07-10" },
    ]),
    airClass: "Economy",
    airAdults: 1,
    airChildren: 0,
    airExtraBaggage: "No",
    // Transport
    carType: "Normal Car",
    hireType: "Drop",
    transportVehicles: 1,
    transportDays: 3,
    transportPax: 2,
    transportExtraBaggage: "No",
    ...overrides,
  };
}

describe("combined custom inquiry validation", () => {
  it("accepts a fully-filled inquiry", () => {
    expect(customInquirySchema.safeParse(combined()).success).toBe(true);
  });

  it("accepts a same-day hotel arrival and departure", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ hotelArrival: "2026-07-05", hotelDeparture: "2026-07-05" }),
      ).success,
    ).toBe(true);
  });

  it("rejects a hotel departure before arrival, flagging hotelDeparture", () => {
    const result = customInquirySchema.safeParse(
      combined({ hotelArrival: "2026-07-10", hotelDeparture: "2026-07-01" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.path.includes("hotelDeparture"),
        ),
      ).toBe(true);
    }
  });

  it("allows a one-way air ticket with no return date", () => {
    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "One way",
          airSegments: JSON.stringify([
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2026-07-01" },
          ]),
        }),
      ).success,
    ).toBe(true);
  });

  it("requires a return date for a round trip, flagging airSegments", () => {
    const result = customInquirySchema.safeParse(
      combined({
        airTripType: "Round trip",
        airSegments: JSON.stringify([
          { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2026-07-01", returnDate: "" },
        ]),
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("airSegments")),
      ).toBe(true);
    }
  });

  it("rejects an air ticket whose return precedes departure", () => {
    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "Round trip",
          airSegments: JSON.stringify([
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2026-07-10", returnDate: "2026-07-01" },
          ]),
        }),
      ).success,
    ).toBe(false);
  });

  it("accepts a valid multi-city trip and rejects one with a single leg", () => {
    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "Multi-city",
          airSegments: JSON.stringify([
            { from: "London (LHR)", to: "Dubai (DXB)", date: "2026-07-01" },
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2026-07-05" },
          ]),
        }),
      ).success,
    ).toBe(true);

    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "Multi-city",
          airSegments: JSON.stringify([
            { from: "London (LHR)", to: "Colombo (CMB)", date: "2026-07-01" },
          ]),
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects an inquiry missing country/city or passport", () => {
    expect(
      customInquirySchema.safeParse(combined({ countryCity: "" })).success,
    ).toBe(false);
    expect(
      customInquirySchema.safeParse(combined({ passportNumber: "" })).success,
    ).toBe(false);
  });

  it("rejects an inquiry with an unfilled section (e.g. no hotel)", () => {
    expect(
      customInquirySchema.safeParse(combined({ hotel: "" })).success,
    ).toBe(false);
    expect(
      customInquirySchema.safeParse(combined({ carType: "" })).success,
    ).toBe(false);
  });
});
