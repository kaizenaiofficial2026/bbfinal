import { describe, expect, it } from "vitest";
import {
  buildReceipt,
  isReceiptAvailable,
} from "@/lib/receipts/receipt-model";
import {
  BRAND_LOGO_SRC,
  layoutReceipt,
  PAGE_WIDTH,
} from "@/lib/receipts/receipt-layout";

const booking = {
  id: "b1",
  reference: "BB-ORD-1001",
  traveller_name: "Lasantha Chathuranga",
  email: "lasantha@example.com",
  phone: "+94 772353788",
  travel_dates: "2026-07-09 to 2026-07-30",
  travellers: 2,
  quoted_amount: 2999,
  currency: "USD",
  status: "paid",
  tour_packages: { title: "Hill Country Tour" },
};

const payment = {
  reference: "BB-ORD-1001",
  mpgs_order_id: "BB-ORD-1001-999",
  amount: 2999,
  currency: "USD",
  status: "captured",
  updated_at: "2026-07-06T13:14:00Z",
  created_at: "2026-07-06T13:00:00Z",
};

describe("isReceiptAvailable", () => {
  it("allows a receipt only when the booking is paid AND the payment captured", () => {
    expect(isReceiptAvailable(booking, payment)).toBe(true);
  });

  it("refuses when the money has not been captured", () => {
    expect(
      isReceiptAvailable(booking, { ...payment, status: "initiated" }),
    ).toBe(false);
    expect(isReceiptAvailable(booking, null)).toBe(false);
    expect(isReceiptAvailable(booking, undefined)).toBe(false);
  });

  it("refuses when the booking is not paid", () => {
    expect(
      isReceiptAvailable({ status: "awaiting_payment" }, payment),
    ).toBe(false);
  });
});

describe("buildReceipt", () => {
  it("builds a single-package receipt with formatted money and dates", () => {
    const receipt = buildReceipt({ booking, payment });

    expect(receipt.reference).toBe("BB-ORD-1001");
    expect(receipt.customer).toEqual({
      name: "Lasantha Chathuranga",
      email: "lasantha@example.com",
      phone: "+94 772353788",
      // No customer record passed in, so no document on the receipt.
      passportNumber: null,
    });
    expect(receipt.items).toHaveLength(1);
    expect(receipt.items[0]).toMatchObject({
      title: "Hill Country Tour",
      travellers: 2,
      dates: "2026-07-09 to 2026-07-30",
      // A single-item order doesn't repeat the reference on the line.
      reference: null,
    });
    expect(receipt.items[0].amount).toContain("2,999");
    expect(receipt.total).toContain("2,999");
    expect(receipt.paidAt).toMatch(/06 Jul 2026/);
    // The human label, never the raw enum — matching every other admin surface.
    expect(receipt.payment.status).toBe("Captured");
  });

  it("lists every booking of a multi-package order, each with its reference", () => {
    const second = {
      ...booking,
      id: "b2",
      reference: "BB-ORD-1001-2",
      quoted_amount: 200,
      travellers: 1,
      tour_packages: { title: "The Heart of City" },
    };
    const receipt = buildReceipt({
      booking,
      payment: {
        ...payment,
        amount: 3199,
        bookings: [{ ...booking, reference: "BB-ORD-1001-1" }, second],
      },
    });

    expect(receipt.items.map((i) => i.title)).toEqual([
      "Hill Country Tour",
      "The Heart of City",
    ]);
    expect(receipt.items.map((i) => i.reference)).toEqual([
      "BB-ORD-1001-1",
      "BB-ORD-1001-2",
    ]);
    // The total is the payment's amount, not a re-sum of the lines.
    expect(receipt.total).toContain("3,199");
  });

  it("falls back to the booking when the payment carries no bookings", () => {
    const receipt = buildReceipt({ booking, payment: { ...payment, bookings: [] } });
    expect(receipt.items).toHaveLength(1);
    expect(receipt.items[0].title).toBe("Hill Country Tour");
  });

  it("produces a filesystem-safe download name", () => {
    expect(buildReceipt({ booking, payment }).fileBase).toBe(
      "BB-ORD-1001-receipt",
    );
    const messy = buildReceipt({
      booking,
      payment: { ...payment, reference: "BB ORD/1001" },
    });
    expect(messy.fileBase).toBe("BB-ORD-1001-receipt");
    expect(messy.fileBase).not.toMatch(/[/\\ ]/);
  });

  it("carries the customer's NIC/passport onto the receipt", () => {
    const receipt = buildReceipt({
      booking,
      payment,
      customer: { passportNumber: "N1234567" },
    });
    expect(receipt.customer.passportNumber).toBe("N1234567");

    const { ops } = layoutReceipt(receipt);
    const strings = ops.filter((o) => o.kind === "text").map((o) => o.text);
    expect(strings).toContain("NIC / PASSPORT NO");
    expect(strings).toContain("N1234567");
  });

  it("omits the document line entirely when there is none on file", () => {
    // A legacy/guest booking has no customer record — the receipt must not
    // print an empty "NIC/Passport No" row.
    const { ops } = layoutReceipt(buildReceipt({ booking, payment }));
    const strings = ops.filter((o) => o.kind === "text").map((o) => o.text);
    expect(strings).not.toContain("NIC / PASSPORT NO");
  });

  it("shows a placeholder when the traveller gave no phone", () => {
    const receipt = buildReceipt({
      booking: { ...booking, phone: null },
      payment,
    });
    expect(receipt.customer.phone).toBe("Not provided");
  });
});

describe("layoutReceipt", () => {
  it("emits drawable ops on a compact page", () => {
    const { ops, width, height } = layoutReceipt(
      buildReceipt({ booking, payment }),
    );

    expect(width).toBe(PAGE_WIDTH);
    // A tight card, not a sparse A4 sheet.
    expect(height).toBeLessThan(700);
    expect(ops.length).toBeGreaterThan(10);
    // Every op must be renderable by both backends.
    for (const op of ops) {
      expect(["text", "line", "rect", "image"]).toContain(op.kind);
      if (op.kind === "text") {
        expect(typeof op.text).toBe("string");
        expect(op.size).toBeGreaterThan(0);
      }
    }
  });

  it("centres the card: equal page margin left and right", () => {
    const { ops, width } = layoutReceipt(buildReceipt({ booking, payment }));
    // The card is the first rect after the full-page surface.
    const rects = ops.filter((o) => o.kind === "rect");
    const page = rects[0];
    const card = rects[1];

    expect(page.x).toBe(0);
    expect(page.width).toBe(width);
    const leftGap = card.x;
    const rightGap = width - (card.x + card.width);
    expect(leftGap).toBe(rightGap);
    expect(leftGap).toBeGreaterThan(0);
  });

  it("wraps the card fully around its content (no clipped tail)", () => {
    const { ops, height } = layoutReceipt(buildReceipt({ booking, payment }));
    const card = ops.filter((o) => o.kind === "rect")[1];
    const lastContentY = Math.max(
      ...ops.filter((o) => o.kind === "text").map((o) => o.y),
    );

    expect(lastContentY).toBeLessThan(card.y + card.height);
    expect(card.y + card.height).toBeLessThanOrEqual(height);
    // Equal margin above the card and below it.
    expect(card.y).toBe(height - (card.y + card.height));
  });

  it("puts the receipt's real values into the drawn text", () => {
    const { ops } = layoutReceipt(buildReceipt({ booking, payment }));
    const strings = ops.filter((o) => o.kind === "text").map((o) => o.text);

    expect(strings).toContain("BB-ORD-1001");
    expect(strings).toContain("Lasantha Chathuranga");
    expect(strings).toContain("Hill Country Tour");
    expect(strings.some((s) => s.includes("2,999"))).toBe(true);
  });

  it("heads the card with the brand logo, not a text wordmark", () => {
    const { ops } = layoutReceipt(buildReceipt({ booking, payment }));
    const images = ops.filter((o) => o.kind === "image");
    const strings = ops.filter((o) => o.kind === "text").map((o) => o.text);

    expect(images).toHaveLength(1);
    expect(images[0].src).toBe(BRAND_LOGO_SRC);
    expect(images[0].width).toBeGreaterThan(0);
    expect(images[0].height).toBeGreaterThan(0);
    // The old caps wordmark must not linger alongside the logo.
    expect(strings).not.toContain("BEYOND BORDERS");
    expect(strings).not.toContain("Beyond Borders");
  });

  it("grows the card for an order with many packages", () => {
    const single = layoutReceipt(buildReceipt({ booking, payment }));
    const many = layoutReceipt(
      buildReceipt({
        booking,
        payment: {
          ...payment,
          bookings: Array.from({ length: 14 }, (_, i) => ({
            ...booking,
            id: `b${i}`,
            reference: `BB-ORD-1001-${i + 1}`,
          })),
        },
      }),
    );
    expect(many.height).toBeGreaterThan(single.height);
    // Width never changes — the card only grows downward.
    expect(many.width).toBe(single.width);
  });

  /**
   * Regression: jsPDF swaps the format dimensions to satisfy the orientation, so
   * a hard-coded "portrait" transposed the page for a short (wider-than-tall)
   * receipt and clipped the card's right edge. The PDF page must always match
   * the layout exactly, in both aspect ratios.
   */
  it("renders a PDF page the same size as the layout", async () => {
    const { renderReceiptPdf } = await import("@/lib/receipts/render");

    const cases = [
      buildReceipt({ booking, payment }), // short: wider than tall
      buildReceipt({
        booking,
        payment: {
          ...payment,
          bookings: Array.from({ length: 12 }, (_, i) => ({
            ...booking,
            id: `b${i}`,
            reference: `BB-ORD-1001-${i + 1}`,
          })),
        },
      }), // long: taller than wide
    ];

    for (const receipt of cases) {
      const { width, height } = layoutReceipt(receipt);
      const blob = await renderReceiptPdf(receipt);
      const pdf = Buffer.from(await blob.arrayBuffer()).toString("latin1");
      const box = pdf.match(/MediaBox\s*\[([^\]]+)\]/);

      expect(box, "PDF should declare a MediaBox").not.toBeNull();
      const [, , w, h] = box![1].trim().split(/\s+/).map(Number);
      expect(Math.round(w)).toBe(Math.round(width));
      expect(Math.round(h)).toBe(Math.round(height));
    }
  });

  it("keeps every op inside the page width", () => {
    const { ops, width } = layoutReceipt(buildReceipt({ booking, payment }));
    for (const op of ops) {
      expect(op.x).toBeGreaterThanOrEqual(0);
      expect(op.x).toBeLessThanOrEqual(width);
    }
  });
});
