/**
 * The data behind a payment receipt, built once and rendered to both PDF and
 * JPEG (see receipt-layout.ts). Pure and free of Supabase/React types so it can
 * be unit tested and shared between the server page and the client exporter.
 */

import { formatCurrency, formatDateTime, statusLabel } from "@/lib/admin/format";

export type ReceiptItem = {
  title: string;
  reference: string | null;
  dates: string;
  travellers: number;
  /** Line total (per-traveller price × travellers), pre-formatted. */
  amount: string;
};

export type Receipt = {
  brand: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
  };
  /** Order reference — the receipt number. */
  reference: string;
  paidAt: string;
  customer: { name: string; email: string; phone: string };
  items: ReceiptItem[];
  total: string;
  payment: { reference: string; status: string; method: string };
  /** Filename stem for the downloads, e.g. "BB-ORD-1001-receipt". */
  fileBase: string;
};

const BRAND = {
  name: "Beyond Borders",
  tagline: "Private Sri Lanka journeys, planned by Beyond Borders.",
  email: "reservations@beyondborders.lk",
  phone: "+94 11 242 5087",
};

type BookingLike = {
  id: string;
  reference: string;
  traveller_name: string;
  email: string;
  phone: string | null;
  travel_dates: string;
  travellers: number;
  quoted_amount: number | null;
  currency: string;
  status: string;
  tour_packages?: { title: string } | null;
};

type PaymentLike = {
  reference?: string | null;
  mpgs_order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  updated_at?: string | null;
  created_at?: string | null;
  bookings?: BookingLike[];
};

/**
 * A receipt only exists once money is actually captured. Booking status is
 * derived from payment (never set by hand), so both signals agree — but check
 * the payment too so a receipt can never be produced without a captured charge.
 */
export function isReceiptAvailable(
  booking: Pick<BookingLike, "status">,
  payment: Pick<PaymentLike, "status"> | null | undefined,
): boolean {
  return booking.status === "paid" && payment?.status === "captured";
}

/** Slug-safe filename stem (no spaces or path separators). */
function toFileBase(reference: string): string {
  const safe = reference.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return `${safe || "receipt"}-receipt`;
}

export function buildReceipt(input: {
  booking: BookingLike;
  payment: PaymentLike;
}): Receipt {
  const { booking, payment } = input;

  // A payment can cover several bookings (cart checkout); fall back to the one
  // booking being viewed for legacy rows with no linked order.
  const orderBookings =
    payment.bookings && payment.bookings.length > 0
      ? payment.bookings
      : [booking];

  const reference =
    payment.reference ?? booking.reference ?? payment.mpgs_order_id ?? "—";

  return {
    brand: BRAND,
    reference,
    // Captured payments are stamped by the reconcile step, so updated_at is when
    // the money actually landed.
    paidAt: formatDateTime(payment.updated_at ?? payment.created_at ?? null),
    customer: {
      name: booking.traveller_name,
      email: booking.email,
      phone: booking.phone || "Not provided",
    },
    items: orderBookings.map((item) => ({
      title: item.tour_packages?.title ?? "Package",
      reference: orderBookings.length > 1 ? item.reference : null,
      dates: item.travel_dates,
      travellers: item.travellers,
      amount: formatCurrency(item.quoted_amount, item.currency),
    })),
    total: formatCurrency(payment.amount, payment.currency),
    payment: {
      reference: payment.mpgs_order_id ?? reference,
      // The human label ("Captured"), matching every other admin surface —
      // never the raw enum value.
      status: statusLabel(payment.status),
      method: "Card payment",
    },
    fileBase: toFileBase(reference),
  };
}
