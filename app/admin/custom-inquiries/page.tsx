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
          // New combined inquiries store details grouped by section
          // ({ Hotel: { ... } }); older single-type ones are flat ({ Hotel: "…" }).
          const isCombined = Object.values(details).some(
            (value) => value !== null && typeof value === "object",
          );
          return (
            <article className="admin-card admin-stack" key={inquiry.id}>
              <div className="admin-card-head">
                <h2>
                  {isCombined
                    ? "Custom inquiry"
                    : (TYPE_LABELS[inquiry.inquiry_type] ??
                      inquiry.inquiry_type)}{" "}
                  · {inquiry.first_name} {inquiry.last_name}
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
                <p>
                  <strong>Submitted</strong>
                  <span>{formatDateTime(inquiry.created_at)}</span>
                </p>
              </div>
              {Object.entries(details).map(([key, value]) =>
                value !== null && typeof value === "object" ? (
                  <div className="admin-detail-group" key={key}>
                    <h3 className="admin-detail-group-title">{key}</h3>
                    <div className="admin-detail">
                      {Object.entries(value as Record<string, unknown>).map(
                        ([subKey, subValue]) => (
                          <p key={subKey}>
                            <strong>{subKey}</strong>
                            <span>{String(subValue)}</span>
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="admin-detail" key={key}>
                    <p>
                      <strong>{key}</strong>
                      <span>{String(value)}</span>
                    </p>
                  </div>
                ),
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
