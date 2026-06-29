import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getCustomInquiry } from "@/lib/data/custom-inquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { formatDateTime } from "@/lib/admin/format";
import { CustomInquiryStatusForm } from "./CustomInquiryStatusForm";

type CustomInquiryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomInquiryPage({
  params,
}: CustomInquiryPageProps) {
  await requireAdmin();
  const { id } = await params;
  const inquiry = await getCustomInquiry(id);

  if (!inquiry) notFound();

  const details = (inquiry.details ?? {}) as Record<string, unknown>;

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/custom-inquiries">
        ← All custom inquiries
      </Link>
      <div className="admin-head">
        <div>
          <span className="section-kicker">Custom inquiry</span>
          <h1>
            {inquiry.first_name} {inquiry.last_name}
          </h1>
        </div>
        <StatusBadge status={inquiry.status} />
      </div>

      <section className="admin-card admin-detail">
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
      </section>

      {Object.entries(details).map(([key, value]) =>
        value !== null && typeof value === "object" ? (
          <section className="admin-card admin-detail-group" key={key}>
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
          </section>
        ) : (
          <section className="admin-card admin-detail" key={key}>
            <p>
              <strong>{key}</strong>
              <span>{String(value)}</span>
            </p>
          </section>
        ),
      )}

      <CustomInquiryStatusForm id={inquiry.id} status={inquiry.status} />
    </div>
  );
}
