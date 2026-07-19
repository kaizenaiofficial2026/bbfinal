import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared, hoisted state the mocked Supabase client reads/writes.
const h = vi.hoisted(() => ({
  packages: [] as {
    id: string;
    title: string;
    price_amount: number | null;
    currency: string;
    status: string;
  }[],
  paymentInsert: null as Record<string, unknown> | null,
  bookingsInsert: null as Record<string, unknown>[] | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

vi.mock("@/lib/data/reference-numbers", () => ({
  nextOrderReference: async () => "BB-ORD-1000",
}));

vi.mock("@/lib/payments/tokens", () => ({
  createPayToken: () => "TOKEN123",
  createMpgsOrderId: (ref: string) => `${ref}-999`,
  createPayTokenExpiry: () => "2099-01-01T00:00:00Z",
}));

vi.mock("@/lib/supabase/service", () => ({
  canUseSupabaseService: () => true,
  createSupabaseServiceClient: () => ({
    from: (table: string) => {
      if (table === "tour_packages") {
        return {
          select: () => ({
            in: async () => ({ data: h.packages, error: null }),
          }),
        };
      }
      if (table === "payments") {
        return {
          insert: (row: Record<string, unknown>) => {
            h.paymentInsert = row;
            return {
              select: () => ({
                single: async () => ({ data: { id: "pay-1" }, error: null }),
              }),
            };
          },
        };
      }
      // bookings
      return {
        insert: (rows: Record<string, unknown>[]) => {
          h.bookingsInsert = rows;
          return { select: async () => ({ data: rows, error: null }) };
        },
      };
    },
  }),
}));

import { createOrder } from "@/lib/data/orders";

const customer = {
  userId: "user-1",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "0770000000",
};

const PKG = (id: string, price: number | null, currency = "USD", status = "published") => ({
  id,
  title: `Package ${id}`,
  price_amount: price,
  currency,
  status,
});

beforeEach(() => {
  h.packages = [];
  h.paymentInsert = null;
  h.bookingsInsert = null;
});

describe("createOrder", () => {
  it("creates one payment covering N bookings, each line priced × its travellers", async () => {
    h.packages = [PKG("a", 2999), PKG("b", 999)];
    const result = await createOrder({
      customer,
      items: [
        { tourPackageId: "a", travelDates: "2027-01-01 to 2027-01-05", travellers: 2 },
        { tourPackageId: "b", travelDates: "2027-02-01 to 2027-02-03", travellers: 1 },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token).toBe("TOKEN123");
    expect(result.reference).toBe("BB-ORD-1000");
    // Travellers is the line quantity: 2999×2 + 999×1.
    expect(result.total).toBe(6997);
    expect(result.itemCount).toBe(2);

    // One payment, amount = sum of line totals, order reference set, booking_id NOT set.
    expect(h.paymentInsert).toMatchObject({
      amount: 6997,
      currency: "USD",
      reference: "BB-ORD-1000",
      pay_token: "TOKEN123",
      status: "initiated",
    });
    expect(h.paymentInsert).not.toHaveProperty("booking_id");

    // Two bookings, each linked to the payment, suffixed references.
    expect(h.bookingsInsert).toHaveLength(2);
    expect(h.bookingsInsert!.map((b) => b.reference)).toEqual([
      "BB-ORD-1000-1",
      "BB-ORD-1000-2",
    ]);
    for (const b of h.bookingsInsert!) {
      expect(b.payment_id).toBe("pay-1");
      expect(b.status).toBe("awaiting_payment");
    }
    // Each booking's quote is its LINE total, so the lines sum to the payment.
    expect(h.bookingsInsert![0].quoted_amount).toBe(5998);
    expect(h.bookingsInsert![1].quoted_amount).toBe(999);
  });

  it("a single-item order keeps the plain reference (no suffix)", async () => {
    h.packages = [PKG("a", 500)];
    const result = await createOrder({
      customer,
      items: [{ tourPackageId: "a", travelDates: "2027-03-01 to 2027-03-04", travellers: 2 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.total).toBe(1000);
    expect(h.bookingsInsert).toHaveLength(1);
    expect(h.bookingsInsert![0].reference).toBe("BB-ORD-1000");
  });

  it("clamps a bogus traveller count so it can't zero out or explode the total", async () => {
    h.packages = [PKG("a", 100)];

    const zero = await createOrder({
      customer,
      items: [{ tourPackageId: "a", travelDates: "d", travellers: 0 }],
    });
    expect(zero.ok && zero.total).toBe(100); // 0 → 1 traveller

    const huge = await createOrder({
      customer,
      items: [{ tourPackageId: "a", travelDates: "d", travellers: 5000 }],
    });
    expect(huge.ok && huge.total).toBe(5000); // 5000 → 50 travellers

    const nan = await createOrder({
      customer,
      items: [{ tourPackageId: "a", travelDates: "d", travellers: Number.NaN }],
    });
    expect(nan.ok && nan.total).toBe(100); // NaN → 1 traveller
    expect(h.bookingsInsert![0].travellers).toBe(1); // stored clamped, not raw
  });

  it("rejects a mixed-currency cart (can't combine in one MPGS charge)", async () => {
    h.packages = [PKG("a", 100, "USD"), PKG("b", 200, "LKR")];
    const result = await createOrder({
      customer,
      items: [
        { tourPackageId: "a", travelDates: "d1", travellers: 1 },
        { tourPackageId: "b", travelDates: "d2", travellers: 1 },
      ],
    });
    expect(result).toEqual({ ok: false, reason: "mixed-currency" });
    expect(h.paymentInsert).toBeNull();
  });

  it("rejects an unavailable / unpriced package", async () => {
    h.packages = [PKG("a", null)]; // no price
    const noPrice = await createOrder({
      customer,
      items: [{ tourPackageId: "a", travelDates: "d", travellers: 1 }],
    });
    expect(noPrice).toEqual({ ok: false, reason: "not-available" });

    h.packages = [PKG("b", 100, "USD", "draft")]; // not published
    const draft = await createOrder({
      customer,
      items: [{ tourPackageId: "b", travelDates: "d", travellers: 1 }],
    });
    expect(draft).toEqual({ ok: false, reason: "not-available" });
  });

  it("rejects an empty order", async () => {
    const result = await createOrder({ customer, items: [] });
    expect(result).toEqual({ ok: false, reason: "empty" });
  });
});
