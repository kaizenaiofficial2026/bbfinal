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
    // Hotel
    hotel: "Cinnamon Grand",
    hotelRoomCategory: "Deluxe",
    hotelRoomType: "Double",
    hotelMealPlan: "Half Board",
    hotelRooms: 1,
    hotelArrival: "2030-07-01",
    hotelDeparture: "2030-07-10",
    hotelAdults: 2,
    hotelChildren: 0,
    hotelExtraBed: "No",
    // Air ticket — trip type + segments JSON (as the trip builder posts).
    airline: "SriLankan",
    airTripType: "Round trip",
    airSegments: JSON.stringify([
      { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2030-07-01", returnDate: "2030-07-10" },
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
        combined({ hotelArrival: "2030-07-05", hotelDeparture: "2030-07-05" }),
      ).success,
    ).toBe(true);
  });

  it("rejects a hotel departure before arrival, flagging hotelDeparture", () => {
    const result = customInquirySchema.safeParse(
      combined({ hotelArrival: "2030-07-10", hotelDeparture: "2030-07-01" }),
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
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2030-07-01" },
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
          { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2030-07-01", returnDate: "" },
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
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2030-07-10", returnDate: "2030-07-01" },
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
            { from: "London (LHR)", to: "Dubai (DXB)", date: "2030-07-01" },
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2030-07-05" },
          ]),
        }),
      ).success,
    ).toBe(true);

    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "Multi-city",
          airSegments: JSON.stringify([
            { from: "London (LHR)", to: "Colombo (CMB)", date: "2030-07-01" },
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

  it("rejects a partially-filled section (all-or-nothing)", () => {
    // A started hotel section missing its name, or a started transport section
    // missing the car type, must be rejected even though other sections are ok.
    expect(
      customInquirySchema.safeParse(combined({ hotel: "" })).success,
    ).toBe(false);
    expect(
      customInquirySchema.safeParse(combined({ carType: "" })).success,
    ).toBe(false);
  });

  // Server-side parity with the client's date / same-place checks (guards a
  // tampered or JS-disabled POST).
  it("rejects a past hotel arrival date", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ hotelArrival: "2000-01-01", hotelDeparture: "2000-01-05" }),
      ).success,
    ).toBe(false);
  });

  it("rejects a non-ISO hotel date", () => {
    expect(
      customInquirySchema.safeParse(combined({ hotelArrival: "not-a-date" }))
        .success,
    ).toBe(false);
  });

  it("rejects a past flight date", () => {
    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "One way",
          airSegments: JSON.stringify([
            { from: "Dubai (DXB)", to: "Colombo (CMB)", date: "2000-01-01" },
          ]),
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects a flight with the same origin and destination", () => {
    expect(
      customInquirySchema.safeParse(
        combined({
          airTripType: "One way",
          airSegments: JSON.stringify([
            { from: "Colombo (CMB)", to: "Colombo (CMB)", date: "2030-07-01" },
          ]),
        }),
      ).success,
    ).toBe(false);
  });
});

// Sections that, when blanked out, are treated as "not chosen".
const EMPTY_HOTEL = {
  hotel: "", hotelRoomCategory: "", hotelRoomType: "", hotelMealPlan: "",
  hotelRooms: "", hotelArrival: "", hotelDeparture: "", hotelAdults: "",
  hotelChildren: "", hotelExtraBed: "",
};
const EMPTY_AIR = {
  airline: "", airTripType: "One way",
  airSegments: JSON.stringify([{ from: "", to: "", date: "" }]),
  airClass: "", airAdults: "", airChildren: "", airExtraBaggage: "",
};
const EMPTY_TRANSPORT = {
  carType: "", hireType: "", transportVehicles: "", transportDays: "",
  transportPax: "", transportExtraBaggage: "",
};

describe("optional service sections (pick 1–3)", () => {
  it("accepts an inquiry with only the hotel section filled", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ ...EMPTY_AIR, ...EMPTY_TRANSPORT }),
      ).success,
    ).toBe(true);
  });

  it("accepts an inquiry with only the air ticket section filled", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ ...EMPTY_HOTEL, ...EMPTY_TRANSPORT }),
      ).success,
    ).toBe(true);
  });

  it("accepts an inquiry with only the transport section filled", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ ...EMPTY_HOTEL, ...EMPTY_AIR }),
      ).success,
    ).toBe(true);
  });

  it("rejects an inquiry with no service section at all", () => {
    const result = customInquirySchema.safeParse(
      combined({ ...EMPTY_HOTEL, ...EMPTY_AIR, ...EMPTY_TRANSPORT }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("sections")),
      ).toBe(true);
    }
  });

  it("still requires guest details even when a service is filled", () => {
    expect(
      customInquirySchema.safeParse(
        combined({ ...EMPTY_AIR, ...EMPTY_TRANSPORT, email: "" }),
      ).success,
    ).toBe(false);
  });
});
