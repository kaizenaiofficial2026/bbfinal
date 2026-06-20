import { requireAdmin } from "@/lib/admin/auth";
import { listCustomInquiries } from "@/lib/data/custom-inquiries";

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
        <p className="form-note">No custom inquiries yet.</p>
      ) : (
        inquiries.map((inquiry) => {
          const details = (inquiry.details ?? {}) as Record<string, unknown>;
          return (
            <article className="admin-card admin-detail" key={inquiry.id}>
              <p>
                <strong>Type</strong>
                {TYPE_LABELS[inquiry.inquiry_type] ?? inquiry.inquiry_type}
              </p>
              <p>
                <strong>Name</strong>
                {inquiry.first_name} {inquiry.last_name}
              </p>
              <p>
                <strong>Email</strong>
                {inquiry.email}
              </p>
              <p>
                <strong>Mobile</strong>
                {inquiry.mobile}
              </p>
              <p>
                <strong>Country &amp; City</strong>
                {inquiry.country_city || "—"}
              </p>
              <p>
                <strong>Passport</strong>
                {inquiry.passport_number || "—"}
              </p>
              {Object.entries(details).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}</strong>
                  {String(value)}
                </p>
              ))}
              <p>
                <strong>Status</strong>
                {inquiry.status}
              </p>
              <p>
                <strong>Submitted</strong>
                {new Date(inquiry.created_at).toLocaleString()}
              </p>
            </article>
          );
        })
      )}
    </div>
  );
}
