import { describe, expect, it } from "vitest";
import {
  filterAdminOrders,
  sortAdminOrders,
  type AdminOrder,
} from "@/lib/data/bookings";

const order = (key: string, createdAt: string, status: string): AdminOrder => ({
  key,
  reference: `BB-${key}`,
  bookingId: key,
  travellerName: "T",
  createdAt,
  status,
  itemCount: 1,
  amount: 100,
  currency: "USD",
  titles: ["P"],
});

const a = order("a", "2026-07-10T10:00:00Z", "awaiting_payment");
const b = order("b", "2026-07-15T10:00:00Z", "paid");
const c = order("c", "2026-07-19T10:00:00Z", "pending");

describe("sortAdminOrders", () => {
  it("sorts descending (newest first) and ascending (oldest first)", () => {
    expect(sortAdminOrders([a, c, b], "desc").map((o) => o.key)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(sortAdminOrders([c, a, b], "asc").map((o) => o.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [b, a];
    sortAdminOrders(input, "asc");
    expect(input.map((o) => o.key)).toEqual(["b", "a"]);
  });
});

describe("filterAdminOrders", () => {
  it("keeps everything for 'all'", () => {
    expect(filterAdminOrders([a, b, c], "all")).toHaveLength(3);
  });

  it("keeps only paid orders for 'paid'", () => {
    expect(filterAdminOrders([a, b, c], "paid").map((o) => o.key)).toEqual([
      "b",
    ]);
  });

  // Anything that isn't paid is presented as awaiting payment in the panel
  // (mirrors derivedBookingStatus), so 'awaiting' must catch every non-paid
  // status — not just the literal awaiting_payment.
  it("treats every non-paid status as awaiting", () => {
    expect(filterAdminOrders([a, b, c], "awaiting").map((o) => o.key)).toEqual([
      "a",
      "c",
    ]);
  });
});
