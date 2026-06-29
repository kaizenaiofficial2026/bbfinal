import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listCustomInquiries } from "@/lib/data/custom-inquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

export default async function AdminCustomInquiriesPage() {
  await requireAdmin();
  const inquiries = await listCustomInquiries();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Custom inquiries</span>
      <h1>Custom inquiries</h1>
      {inquiries.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">No custom inquiries yet.</p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
          </div>
          {inquiries.map((inquiry) => (
            <Link
              href={`/admin/custom-inquiries/${inquiry.id}`}
              key={inquiry.id}
            >
              <span>
                {inquiry.first_name} {inquiry.last_name}
              </span>
              <span>{inquiry.email}</span>
              <StatusBadge status={inquiry.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
