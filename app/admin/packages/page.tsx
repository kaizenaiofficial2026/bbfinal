import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { listAdminPackages } from "@/lib/data/packages";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

export default async function AdminPackagesPage() {
  await requireSuperAdmin();
  const packages = await listAdminPackages();

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Packages</span>
          <h1>Tour packages</h1>
        </div>
        <Link className="btn btn-primary" href="/admin/packages/new">
          Create package
        </Link>
      </div>
      {packages.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">
            No packages yet — create your first package.
          </p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Title</span>
            <span>Duration</span>
            <span>Status</span>
          </div>
          {packages.map((tourPackage) => (
            <Link
              href={`/admin/packages/${tourPackage.id}`}
              key={tourPackage.id}
            >
              <span>{tourPackage.title}</span>
              <span className="admin-muted">{tourPackage.duration}</span>
              <StatusBadge status={tourPackage.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
