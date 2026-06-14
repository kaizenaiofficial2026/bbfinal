import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminDestinations } from "@/lib/data/destinations";

export default async function AdminDestinationsPage() {
  await requireAdmin();
  const destinations = await listAdminDestinations();

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Destinations</span>
          <h1>Destination content</h1>
        </div>
        <Link className="btn btn-primary" href="/admin/destinations/new">Create destination</Link>
      </div>
      <div className="admin-card admin-table">
        {destinations.map((destination) => (
          <Link href={`/admin/destinations/${destination.id}`} key={destination.id}>
            <span>{destination.title}</span>
            <span>{destination.tagline}</span>
            <strong>{destination.status}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
