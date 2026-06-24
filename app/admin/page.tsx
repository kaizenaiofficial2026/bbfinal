import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listBookings } from "@/lib/data/bookings";
import { listEnquiries } from "@/lib/data/enquiries";
import { listAdminDestinations } from "@/lib/data/destinations";
import { listAdminPackages } from "@/lib/data/packages";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { AnalyticsPanel } from "@/app/admin/_components/AnalyticsPanel";

export default async function AdminPage() {
  await requireAdmin();
  const [packages, destinations, enquiries, bookings] = await Promise.all([
    listAdminPackages(),
    listAdminDestinations(),
    listEnquiries(),
    listBookings(),
  ]);

  const newEnquiries = enquiries.filter((item) => item.status === "new").length;

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Dashboard</span>
          <h1>Operations overview</h1>
        </div>
      </div>

      <AnalyticsPanel />

      <div className="admin-metrics">
        <Link href="/admin/packages">
          Packages <strong>{packages.length}</strong>
        </Link>
        <Link href="/admin/destinations">
          Destinations <strong>{destinations.length}</strong>
        </Link>
        <Link href="/admin/enquiries">
          New enquiries <strong>{newEnquiries}</strong>
        </Link>
        <Link href="/admin/bookings">
          Bookings <strong>{bookings.length}</strong>
        </Link>
      </div>

      <section className="admin-card admin-stack">
        <div className="admin-card-head">
          <h2>Recent enquiries</h2>
          <Link className="admin-back" href="/admin/enquiries">
            View all →
          </Link>
        </div>
        {enquiries.length === 0 ? (
          <p className="form-hint">No enquiries yet.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Name</span>
              <span>Email</span>
              <span>Status</span>
            </div>
            {enquiries.slice(0, 5).map((enquiry) => (
              <Link href={`/admin/enquiries/${enquiry.id}`} key={enquiry.id}>
                <span>{enquiry.name}</span>
                <span className="admin-muted">{enquiry.email}</span>
                <StatusBadge status={enquiry.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card admin-stack">
        <div className="admin-card-head">
          <h2>Recent bookings</h2>
          <Link className="admin-back" href="/admin/bookings">
            View all →
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="form-hint">No bookings yet.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Reference</span>
              <span>Traveller</span>
              <span>Status</span>
            </div>
            {bookings.slice(0, 5).map((booking) => (
              <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
                <span>{booking.reference}</span>
                <span className="admin-muted">{booking.traveller_name}</span>
                <StatusBadge status={booking.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
