import { requireAdmin } from "@/lib/admin/auth";
import { listCustomInquiries } from "@/lib/data/custom-inquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { formatDateTime } from "@/lib/admin/format";

const TYPE_LABELS: Record<string, string> = {
  package: "Package",
  hotel: "Hotel",
  airticket: "Air ticket",
  transport: "Transport",
};

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
        inquiries.map((inquiry) => {
          const details = (inquiry.details ?? {}) as Record<string, unknown>;
          return (
            <article className="admin-card admin-stack" key={inquiry.id}>
              <div className="admin-card-head">
                <h2>
                  {TYPE_LABELS[inquiry.inquiry_type] ?? inquiry.inquiry_type} ·{" "}
                  {inquiry.first_name} {inquiry.last_name}
                </h2>
                <StatusBadge status={inquiry.status} />
              </div>
              <div className="admin-detail">
                <p><strong>Email</strong><span>{inquiry.email}</span></p>
                <p><strong>Mobile</strong><span>{inquiry.mobile}</span></p>
                <p>
                  <strong>Country &amp; City</strong>
                  <span>{inquiry.country_city || "—"}</span>
                </p>
                <p>
                  <strong>Passport</strong>
                  <span>{inquiry.passport_number || "—"}</span>
                </p>
                {Object.entries(details).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}</strong>
                    <span>
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </p>
                ))}
                <p>
                  <strong>Submitted</strong>
                  <span>{formatDateTime(inquiry.created_at)}</span>
                </p>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
