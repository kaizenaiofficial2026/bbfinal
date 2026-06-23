import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listBookings } from "@/lib/data/bookings";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { formatDate } from "@/lib/admin/format";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const bookings = await listBookings();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Bookings</span>
      <h1>Booking requests</h1>
      {bookings.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">No booking requests yet.</p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Reference</span>
            <span>Traveller</span>
            <span>Status</span>
          </div>
          {bookings.map((booking) => (
            <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
              <span>
                {booking.reference}
                <small className="admin-muted-block">
                  {formatDate(booking.created_at)}
                </small>
              </span>
              <span>{booking.traveller_name}</span>
              <StatusBadge status={booking.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
