import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listBookings } from "@/lib/data/bookings";
import { listEnquiries } from "@/lib/data/enquiries";
import { listAdminDestinations } from "@/lib/data/destinations";
import { listAdminPackages } from "@/lib/data/packages";

export default async function AdminPage() {
  await requireAdmin();
  const [packages, destinations, enquiries, bookings] = await Promise.all([
    listAdminPackages(),
    listAdminDestinations(),
    listEnquiries(),
    listBookings(),
  ]);

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Dashboard</span>
          <h1>Operations overview</h1>
        </div>
      </div>
      <div className="admin-metrics">
        <Link href="/admin/packages">Packages <strong>{packages.length}</strong></Link>
        <Link href="/admin/destinations">Destinations <strong>{destinations.length}</strong></Link>
        <Link href="/admin/enquiries">New enquiries <strong>{enquiries.filter((item) => item.status === "new").length}</strong></Link>
        <Link href="/admin/bookings">Bookings <strong>{bookings.length}</strong></Link>
      </div>
      <section className="admin-card">
        <h2>Recent enquiries</h2>
        <div className="admin-table">
          {enquiries.slice(0, 5).map((enquiry) => (
            <Link href={`/admin/enquiries/${enquiry.id}`} key={enquiry.id}>
              <span>{enquiry.name}</span>
              <span>{enquiry.email}</span>
              <strong>{enquiry.status}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="admin-card">
        <h2>Recent bookings</h2>
        <div className="admin-table">
          {bookings.slice(0, 5).map((booking) => (
            <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
              <span>{booking.reference}</span>
              <span>{booking.traveller_name}</span>
              <strong>{booking.status}</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
