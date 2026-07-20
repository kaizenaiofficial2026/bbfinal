import Link from "next/link";
import {
  ENQUIRY_STATUS_PILLS,
  listHref,
  type EnquiryStatusKey,
  type ListSort,
} from "@/lib/admin/list-view";

/**
 * The pill row + date-order toggle used by the enquiry list screens. All state
 * lives in the URL: each pill keeps the current sort, the toggle keeps the
 * current status filter.
 */
export function StatusFilterBar({
  basePath,
  status,
  sort,
  counts,
}: {
  basePath: string;
  status: EnquiryStatusKey;
  sort: ListSort;
  counts: Record<EnquiryStatusKey, number>;
}) {
  return (
    <div className="admin-filter-pills">
      {ENQUIRY_STATUS_PILLS.map((pill) => (
        <Link
          key={pill.key}
          href={listHref(basePath, pill.key, sort)}
          className={
            status === pill.key
              ? "admin-filter-pill is-active"
              : "admin-filter-pill"
          }
          aria-current={status === pill.key ? "page" : undefined}
        >
          {pill.label}
          <span className="admin-count">{counts[pill.key]}</span>
        </Link>
      ))}

      <Link
        href={listHref(basePath, status, sort === "desc" ? "asc" : "desc")}
        className="admin-filter-pill admin-sort-toggle"
        aria-label={`Sorted ${
          sort === "desc" ? "newest first" : "oldest first"
        } — click to reverse`}
      >
        {sort === "desc" ? "Newest first ↓" : "Oldest first ↑"}
      </Link>
    </div>
  );
}
