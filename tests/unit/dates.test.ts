import { describe, expect, it } from "vitest";
import {
  combineTravelDates,
  isPastDate,
  isValidRange,
  todayIso,
} from "@/lib/validation/dates";

describe("date helpers", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayIso(new Date(2026, 5, 9))).toBe("2026-06-09");
    expect(todayIso(new Date(2026, 11, 25))).toBe("2026-12-25");
  });

  it("detects past dates relative to a reference day", () => {
    expect(isPastDate("2026-06-01", "2026-06-25")).toBe(true);
    // Today itself is not "past".
    expect(isPastDate("2026-06-25", "2026-06-25")).toBe(false);
    expect(isPastDate("2026-07-01", "2026-06-25")).toBe(false);
    expect(isPastDate("", "2026-06-25")).toBe(false);
  });

  it("validates a start→end range", () => {
    expect(isValidRange("2026-07-01", "2026-07-10")).toBe(true);
    // Same day is a valid (single-day) range.
    expect(isValidRange("2026-07-10", "2026-07-10")).toBe(true);
    expect(isValidRange("2026-07-10", "2026-07-01")).toBe(false);
    expect(isValidRange("", "2026-07-01")).toBe(false);
    expect(isValidRange("2026-07-01", "")).toBe(false);
  });

  it("combines a range into a travel-dates string", () => {
    expect(combineTravelDates("2026-07-01", "2026-07-10")).toBe(
      "2026-07-01 to 2026-07-10",
    );
    expect(combineTravelDates("2026-07-01", "")).toBe("2026-07-01");
    expect(combineTravelDates("", "")).toBe("");
  });
});
