import Link from "next/link";
import { requireAdminContext } from "@/lib/admin/auth";
import { groupAdminOrders, listBookings } from "@/lib/data/bookings";
import { listEnquiries } from "@/lib/data/enquiries";
import { listAdminDestinations } from "@/lib/data/destinations";
import { listAdminPackages } from "@/lib/data/packages";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { AnalyticsPanel } from "@/app/admin/_components/AnalyticsPanel";

export default async function AdminPage() {
  const { isSuperAdmin } = await requireAdminContext();

  // Second-level admins can't manage packages/destinations/enquiries, so their
  // dashboard omits those metrics and the recent-enquiries feed.
  const [packages, destinations, enquiries, bookings] = await Promise.all([
    isSuperAdmin ? listAdminPackages() : Promise.resolve([]),
    isSuperAdmin ? listAdminDestinations() : Promise.resolve([]),
    isSuperAdmin ? listEnquiries() : Promise.resolve([]),
    listBookings(),
  ]);

  const newEnquiries = enquiries.filter((item) => item.status === "new").length;
  // Group bookings into orders so a multi-package cart purchase counts (and shows)
  // as one order rather than several separate rows.
  const orders = groupAdminOrders(bookings);

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
        {isSuperAdmin ? (
          <>
            <Link href="/admin/packages">
              Packages <strong>{packages.length}</strong>
            </Link>
            <Link href="/admin/destinations">
              Destinations <strong>{destinations.length}</strong>
            </Link>
            <Link href="/admin/enquiries">
              New enquiries <strong>{newEnquiries}</strong>
            </Link>
          </>
        ) : null}
        <Link href="/admin/bookings">
          Bookings <strong>{orders.length}</strong>
        </Link>
      </div>

      <section className="admin-card admin-stack">
        <div className="admin-card-head">
          <h2>Recent bookings</h2>
          <Link className="admin-back" href="/admin/bookings">
            View all →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="form-hint">No bookings yet.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Reference</span>
              <span>Traveller</span>
              <span>Status</span>
            </div>
            {orders.slice(0, 5).map((order) => (
              <Link href={`/admin/bookings/${order.bookingId}`} key={order.key}>
                <span>
                  {order.reference}
                  {order.itemCount > 1 ? (
                    <small className="admin-muted-block">
                      {order.itemCount} packages
                    </small>
                  ) : null}
                </span>
                <span className="admin-muted">{order.travellerName}</span>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {isSuperAdmin ? (
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
      ) : null}
    </div>
  );
}
