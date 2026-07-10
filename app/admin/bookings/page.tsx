import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { groupAdminOrders, listBookings } from "@/lib/data/bookings";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { derivedBookingStatus, formatDate } from "@/lib/admin/format";

export default async function AdminBookingsPage() {
  await requireAdmin();
  // A cart purchase covers several bookings under one payment — group them so a
  // multi-package order shows as a single row instead of N separate ones.
  const orders = groupAdminOrders(await listBookings());

  return (
    <div className="admin-stack">
      <span className="section-kicker">Bookings</span>
      <h1>Booking requests</h1>
      {orders.length === 0 ? (
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
          {orders.map((order) => (
            <Link href={`/admin/bookings/${order.bookingId}`} key={order.key}>
              <span>
                {order.reference}
                {order.itemCount > 1 ? (
                  <small className="admin-muted-block">
                    {order.itemCount} packages · {order.titles.join(", ")}
                  </small>
                ) : null}
                <small className="admin-muted-block">
                  {formatDate(order.createdAt)}
                </small>
              </span>
              <span>{order.travellerName}</span>
              <StatusBadge status={derivedBookingStatus(order.status)} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
