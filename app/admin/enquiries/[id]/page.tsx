import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEnquiryStatusAction } from "../../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { getEnquiry } from "@/lib/data/enquiries";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { formatDateTime } from "@/lib/admin/format";

type EnquiryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EnquiryPage({ params }: EnquiryPageProps) {
  await requireAdmin();
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

      <form
        className="admin-card admin-inline-form"
        action={updateEnquiryStatusAction}
      >
        <input type="hidden" name="id" value={enquiry.id} />
        <label>
          Status
          <select name="status" defaultValue={enquiry.status}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
      </form>
    </div>
  );
}
