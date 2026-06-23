import Link from "next/link";
import { notFound } from "next/navigation";
import { updateBookingStatusAction } from "../../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { getBooking } from "@/lib/data/bookings";
import { listPaymentsForBooking } from "@/lib/data/payments";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";

type BookingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  const payments = await listPaymentsForBooking(booking.id);

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/bookings">
        ← All bookings
      </Link>
      <div className="admin-head">
        <div>
          <span className="section-kicker">Booking</span>
          <h1>{booking.reference}</h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <section className="admin-card admin-detail">
        <p><strong>Traveller</strong><span>{booking.traveller_name}</span></p>
        <p><strong>Email</strong><span>{booking.email}</span></p>
        <p><strong>Phone</strong><span>{booking.phone || "Not provided"}</span></p>
        <p><strong>Package</strong><span>{booking.tour_packages?.title || "Package"}</span></p>
        <p><strong>Dates</strong><span>{booking.travel_dates}</span></p>
        <p><strong>Travellers</strong><span>{booking.travellers}</span></p>
        <p><strong>Notes</strong><span>{booking.notes || "None"}</span></p>
        <p>
          <strong>Quoted amount</strong>
          <span>{formatCurrency(booking.quoted_amount, booking.currency)}</span>
        </p>
        <p><strong>Received</strong><span>{formatDateTime(booking.created_at)}</span></p>
      </section>

      <form
        className="admin-card admin-inline-form"
        action={updateBookingStatusAction}
      >
        <input type="hidden" name="id" value={booking.id} />
        <label>
          Status
          <select name="status" defaultValue={booking.status}>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
      </form>

      <section className="admin-card admin-stack">
        <h2>Payments</h2>
        {payments.length === 0 ? (
          <p className="form-hint">No payments recorded yet.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Order</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {payments.map((payment) => (
              <div key={payment.id}>
                <span>{payment.mpgs_order_id}</span>
                <span className="admin-muted">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>
                <StatusBadge status={payment.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
