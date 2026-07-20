import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { listCustomInquiries } from "@/lib/data/custom-inquiries";
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

type CustomInquiriesPageProps = {
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function AdminCustomInquiriesPage({
  searchParams,
}: CustomInquiriesPageProps) {
  const [, params] = await Promise.all([requireSuperAdmin(), searchParams]);
  const status = parseEnquiryStatus(params.status);
  const sort = parseListSort(params.sort);

  const all = await listCustomInquiries();
  const inquiries = sortByCreatedAt(filterByStatus(all, status), sort);

  return (
    <div className="admin-stack">
      <span className="section-kicker">Custom enquiries</span>
      <h1>Custom enquiries</h1>

      <StatusFilterBar
        basePath="/admin/custom-inquiries"
        status={status}
        sort={sort}
        counts={statusCounts(all)}
      />

      {inquiries.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">
            {status === "all"
              ? "No custom enquiries yet."
              : `No ${status} custom enquiries.`}
          </p>
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
                {inquiry.reference ? (
                  <small className="admin-muted-block">
                    {inquiry.reference}
                  </small>
                ) : null}
                <small className="admin-muted-block">
                  {formatDate(inquiry.created_at)}
                </small>
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
