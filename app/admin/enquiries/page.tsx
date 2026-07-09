import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { listEnquiries } from "@/lib/data/enquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

export default async function AdminEnquiriesPage() {
  await requireSuperAdmin();
  const enquiries = await listEnquiries();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Enquiries</span>
      <h1>Customer enquiries</h1>
      {enquiries.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">No enquiries yet.</p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Journey</span>
            <span>Status</span>
          </div>
          {enquiries.map((enquiry) => (
            <Link href={`/admin/enquiries/${enquiry.id}`} key={enquiry.id}>
              <span>{enquiry.name}</span>
              <span>{enquiry.package_label || "Custom journey"}</span>
              <StatusBadge status={enquiry.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
