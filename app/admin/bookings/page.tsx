import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listBookings } from "@/lib/data/bookings";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const bookings = await listBookings();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Bookings</span>
      <h1>Booking requests</h1>
      <div className="admin-card admin-table">
        {bookings.map((booking) => (
          <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
            <span>{booking.reference}</span>
            <span>{booking.traveller_name}</span>
            <strong>{booking.status}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
