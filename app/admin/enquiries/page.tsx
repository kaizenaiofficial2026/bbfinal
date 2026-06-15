import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listEnquiries } from "@/lib/data/enquiries";

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const enquiries = await listEnquiries();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Enquiries</span>
      <h1>Customer enquiries</h1>
      <div className="admin-card admin-table">
        {enquiries.map((enquiry) => (
          <Link href={`/admin/enquiries/${enquiry.id}`} key={enquiry.id}>
            <span>{enquiry.name}</span>
            <span>{enquiry.package_label || "Custom journey"}</span>
            <strong>{enquiry.status}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
