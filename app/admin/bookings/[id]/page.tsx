import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getBooking } from "@/lib/data/bookings";
import { getPaymentById } from "@/lib/data/payments";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { ReceiptExportButtons } from "@/app/admin/_components/ReceiptExportButtons";
import { buildReceipt, isReceiptAvailable } from "@/lib/receipts/receipt-model";
import {
  derivedBookingStatus,
  formatCurrency,
  formatDateTime,
} from "@/lib/admin/format";

type BookingPageProps = {
  params: Promise<{ id: string }>;
};

/** A labelled line in the billing block (caption above value). */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="order-field">
      <span className="order-field-label">{label}</span>
      <span className="order-field-value">{value}</span>
    </div>
  );
}

export default async function BookingPage({ params }: BookingPageProps) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  // This booking belongs to an order (a payment covering one or more bookings).
  const payment = booking.payment_id
    ? await getPaymentById(booking.payment_id)
    : null;
  const orderBookings = payment?.bookings ?? [];
  const isMultiOrder = orderBookings.length > 1;
  // For a multi-package order, headline the shared order reference (matching the
  // bookings list); a single booking keeps its own reference.
  const headingRef =
    isMultiOrder && payment?.reference ? payment.reference : booking.reference;

  // Line items: every package in the order, or just this booking for legacy
  // rows with no linked payment.
  const items = orderBookings.length > 0 ? orderBookings : [booking];
  const orderTotal = payment
    ? payment.amount
    : items.reduce((sum, item) => sum + (item.quoted_amount ?? 0), 0);
  const orderCurrency = payment?.currency ?? booking.currency;
  const isPaid = derivedBookingStatus(booking.status) === "paid";

  // A receipt is only offered once the money is actually captured.
  const receipt =
    payment && isReceiptAvailable(booking, payment)
      ? buildReceipt({ booking, payment })
      : null;

  return (
    <div className="admin-stack order-page">
      <Link className="admin-back" href="/admin/bookings">
        ← All bookings
      </Link>

      <article className="order-card">
        <header className="order-card-head">
          <div>
            <span className="section-kicker">
              {isMultiOrder ? "Order" : "Booking"}
            </span>
            <h1>{headingRef}</h1>
          </div>
          <StatusBadge status={derivedBookingStatus(booking.status)} />
        </header>

        <div className="order-card-body">
          <section className="order-section">
            <h2>Billing details</h2>
            <p className="order-customer">{booking.traveller_name}</p>
            <div className="order-fields">
              <Field label="Email" value={booking.email} />
              <Field label="Phone" value={booking.phone || "Not provided"} />
              {payment ? (
                <Field
                  label="Payment via"
                  value={payment.mpgs_order_id ?? headingRef}
                />
              ) : null}
              <Field label="Received" value={formatDateTime(booking.created_at)} />
            </div>
          </section>

          <section className="order-section">
            <div className="order-items-head">
              <span>Package</span>
              <span>Qty</span>
              <span>Total</span>
            </div>

            {items.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="order-item-main">
                  <strong>{item.tour_packages?.title ?? "Package"}</strong>
                  <span className="order-item-meta">{item.travel_dates}</span>
                  {isMultiOrder ? (
                    <span className="order-item-meta">{item.reference}</span>
                  ) : null}
                  {item.notes ? (
                    <span className="order-item-notes">{item.notes}</span>
                  ) : null}
                </div>
                <span className="order-item-qty">{item.travellers}</span>
                <span className="order-item-amount">
                  {formatCurrency(item.quoted_amount, item.currency)}
                </span>
              </div>
            ))}

            <div className="order-total">
              {/* Only call it "paid" when it actually is — an unpaid order that
                  merely has a payment row is still money owed. */}
              <span>{isPaid ? "Total paid" : "Order total"}</span>
              <strong>{formatCurrency(orderTotal, orderCurrency)}</strong>
            </div>
          </section>

          <section className="order-section order-payment">
            <div className="order-payment-row">
              <span className="order-field-label">Payment status</span>
              {payment ? (
                <StatusBadge status={payment.status} />
              ) : (
                <span className="order-field-value">No payment recorded</span>
              )}
            </div>
            <p className="form-hint">
              Booking status is set automatically — it shows <strong>Paid</strong>{" "}
              only once a payment is confirmed, otherwise{" "}
              <strong>Awaiting payment</strong>. It can&apos;t be changed by hand.
            </p>
          </section>
        </div>

        {receipt ? (
          <footer className="order-card-foot">
            <ReceiptExportButtons receipt={receipt} />
          </footer>
        ) : null}
      </article>
    </div>
  );
}
