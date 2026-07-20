import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { listEnquiries } from "@/lib/data/enquiries";
import {
  filterByStatus,
  parseEnquiryStatus,
  parseListSort,
  sortByCreatedAt,
  statusCounts,
} from "@/lib/admin/list-view";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { StatusFilterBar } from "@/app/admin/_components/StatusFilterBar";
import { formatDate } from "@/lib/admin/format";

type EnquiriesPageProps = {
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function AdminEnquiriesPage({
  searchParams,
}: EnquiriesPageProps) {
  const [, params] = await Promise.all([requireSuperAdmin(), searchParams]);
  const status = parseEnquiryStatus(params.status);
  const sort = parseListSort(params.sort);

  const all = await listEnquiries();
  const enquiries = sortByCreatedAt(filterByStatus(all, status), sort);

  return (
    <div className="admin-stack">
      <span className="section-kicker">Enquiries</span>
      <h1>Customer enquiries</h1>

      <StatusFilterBar
        basePath="/admin/enquiries"
        status={status}
        sort={sort}
        counts={statusCounts(all)}
      />

      {enquiries.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">
            {status === "all" ? "No enquiries yet." : `No ${status} enquiries.`}
          </p>
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
              <span>
                {enquiry.name}
                <small className="admin-muted-block">
                  {formatDate(enquiry.created_at)}
                </small>
              </span>
              <span>{enquiry.package_label || "Custom journey"}</span>
              <StatusBadge status={enquiry.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
