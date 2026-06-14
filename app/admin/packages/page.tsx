import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminPackages } from "@/lib/data/packages";

export default async function AdminPackagesPage() {
  await requireAdmin();
  const packages = await listAdminPackages();

  return (
    <div className="admin-stack">
      <div className="admin-head">
        <div>
          <span className="section-kicker">Packages</span>
          <h1>Tour packages</h1>
        </div>
        <Link className="btn btn-primary" href="/admin/packages/new">Create package</Link>
      </div>
      <div className="admin-card admin-table">
        {packages.map((tourPackage) => (
          <Link href={`/admin/packages/${tourPackage.id}`} key={tourPackage.id}>
            <span>{tourPackage.title}</span>
            <span>{tourPackage.duration}</span>
            <strong>{tourPackage.status}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
