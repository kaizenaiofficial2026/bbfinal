import { notFound } from "next/navigation";
import { updateEnquiryStatusAction } from "../../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { getEnquiry } from "@/lib/data/enquiries";

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
      <span className="section-kicker">Enquiry</span>
      <h1>{enquiry.name}</h1>
      <section className="admin-card admin-detail">
        <p><strong>Email</strong>{enquiry.email}</p>
        <p><strong>Phone</strong>{enquiry.phone || "Not provided"}</p>
        <p><strong>Journey</strong>{enquiry.package_label || "Custom journey"}</p>
        <p><strong>Message</strong>{enquiry.message}</p>
      </section>
      <form className="admin-card admin-inline-form" action={updateEnquiryStatusAction}>
        <input type="hidden" name="id" value={enquiry.id} />
        <label>Status
          <select name="status" defaultValue={enquiry.status}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit">Update status</button>
      </form>
    </div>
  );
}
