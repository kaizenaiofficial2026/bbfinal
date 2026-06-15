import { notFound } from "next/navigation";
import {
  generatePayLinkAction,
  updateBookingStatusAction,
} from "../../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { getBooking } from "@/lib/data/bookings";
import { listPaymentsForBooking } from "@/lib/data/payments";
import { env } from "@/lib/env";

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
      <span className="section-kicker">Booking</span>
      <h1>{booking.reference}</h1>
      <section className="admin-card admin-detail">
        <p><strong>Traveller</strong>{booking.traveller_name}</p>
        <p><strong>Email</strong>{booking.email}</p>
        <p><strong>Phone</strong>{booking.phone || "Not provided"}</p>
        <p><strong>Package</strong>{booking.tour_packages?.title || "Package"}</p>
        <p><strong>Dates</strong>{booking.travel_dates}</p>
        <p><strong>Travellers</strong>{booking.travellers}</p>
        <p><strong>Notes</strong>{booking.notes || "None"}</p>
        <p><strong>Quoted amount</strong>{booking.quoted_amount ? `${booking.currency} ${booking.quoted_amount}` : "Not quoted"}</p>
      </section>
      <form className="admin-card admin-inline-form" action={updateBookingStatusAction}>
        <input type="hidden" name="id" value={booking.id} />
        <label>Status
          <select name="status" defaultValue={booking.status}>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit">Update status</button>
      </form>
      <form className="admin-card admin-inline-form" action={generatePayLinkAction}>
        <input type="hidden" name="bookingId" value={booking.id} />
        <label>Quoted amount
          <input name="amount" type="number" min="1" step="0.01" defaultValue={booking.quoted_amount ?? ""} required />
        </label>
        <label>Currency
          <input name="currency" maxLength={3} defaultValue={booking.currency || env.mpgsCurrency} required />
        </label>
        <button className="btn btn-primary" type="submit">Generate pay link</button>
      </form>
      <section className="admin-card">
        <h2>Payments</h2>
        <div className="admin-table">
          {payments.map((payment) => (
            <div key={payment.id}>
              <span>{payment.mpgs_order_id}</span>
              <span>{payment.currency} {payment.amount}</span>
              <strong>{payment.status}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
