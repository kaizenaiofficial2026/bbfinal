import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { getEnquiry } from "@/lib/data/enquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { formatDateTime } from "@/lib/admin/format";
import { EnquiryStatusForm } from "./EnquiryStatusForm";

type EnquiryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EnquiryPage({ params }: EnquiryPageProps) {
  await requireSuperAdmin();
  const { id } = await params;
  const enquiry = await getEnquiry(id);

  if (!enquiry) notFound();

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/enquiries">
        ← All enquiries
      </Link>
      <div className="admin-head">
        <div>
          <span className="section-kicker">Enquiry</span>
          <h1>{enquiry.name}</h1>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      <section className="admin-card admin-detail">
        <p><strong>Email</strong><span>{enquiry.email}</span></p>
        <p><strong>Phone</strong><span>{enquiry.phone || "Not provided"}</span></p>
        <p>
          <strong>Journey</strong>
          <span>{enquiry.package_label || "Custom journey"}</span>
        </p>
        <p><strong>Message</strong><span>{enquiry.message}</span></p>
        <p><strong>Received</strong><span>{formatDateTime(enquiry.created_at)}</span></p>
      </section>

      <EnquiryStatusForm id={enquiry.id} status={enquiry.status} />
    </div>
  );
}
