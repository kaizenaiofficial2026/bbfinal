import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { listAdminDestinations } from "@/lib/data/destinations";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

export default async function AdminDestinationsPage() {
  await requireSuperAdmin();
  const destinations = await listAdminDestinations();

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Destinations</span>
          <h1>Destination content</h1>
        </div>
        <Link className="btn btn-primary" href="/admin/destinations/new">
          Create destination
        </Link>
      </div>
      {destinations.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">
            No destinations yet — create your first destination.
          </p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Title</span>
            <span>Tagline</span>
            <span>Status</span>
          </div>
          {destinations.map((destination) => (
            <Link
              href={`/admin/destinations/${destination.id}`}
              key={destination.id}
            >
              <span>{destination.title}</span>
              <span className="admin-muted">{destination.tagline}</span>
              <StatusBadge status={destination.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
