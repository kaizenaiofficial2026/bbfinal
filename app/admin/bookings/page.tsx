import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  filterAdminOrders,
  groupAdminOrders,
  listBookings,
  sortAdminOrders,
} from "@/lib/data/bookings";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { derivedBookingStatus, formatDate } from "@/lib/admin/format";

const STATUS_PILLS = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting payment" },
  { key: "paid", label: "Paid" },
] as const;

type StatusKey = (typeof STATUS_PILLS)[number]["key"];
type SortKey = "asc" | "desc";

function parseStatus(value: string | undefined): StatusKey {
  return (STATUS_PILLS.find((p) => p.key === value)?.key ?? "all") as StatusKey;
}

function parseSort(value: string | undefined): SortKey {
  return value === "asc" ? "asc" : "desc";
}

/** Build a bookings URL keeping both controls in sync (defaults stay implicit). */
function bookingsHref(status: StatusKey, sort: SortKey): string {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (sort !== "desc") params.set("sort", sort);
  const query = params.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

type BookingsPageProps = {
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function AdminBookingsPage({
  searchParams,
}: BookingsPageProps) {
  const [, params] = await Promise.all([requireAdmin(), searchParams]);
  const status = parseStatus(params.status);
  const sort = parseSort(params.sort);

  // A cart purchase covers several bookings under one payment — group them so a
  // multi-package order shows as a single row instead of N separate ones.
  const allOrders = groupAdminOrders(await listBookings());

  const counts: Record<StatusKey, number> = {
    all: allOrders.length,
    awaiting: filterAdminOrders(allOrders, "awaiting").length,
    paid: filterAdminOrders(allOrders, "paid").length,
  };

  const orders = sortAdminOrders(filterAdminOrders(allOrders, status), sort);

  return (
    <div className="admin-stack">
      <span className="section-kicker">Bookings</span>
      <h1>Booking requests</h1>

      <div className="admin-filter-pills">
        {STATUS_PILLS.map((pill) => (
          <Link
            key={pill.key}
            href={bookingsHref(pill.key, sort)}
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

        {/* One toggle instead of two pills: it always shows the CURRENT order
            and clicking flips it, keeping the active status filter. */}
        <Link
          href={bookingsHref(status, sort === "desc" ? "asc" : "desc")}
          className="admin-filter-pill admin-sort-toggle"
          aria-label={`Sorted ${
            sort === "desc" ? "newest first" : "oldest first"
          } — click to reverse`}
        >
          {sort === "desc" ? "Newest first ↓" : "Oldest first ↑"}
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="admin-card">
          <p className="form-hint">
            {status === "all"
              ? "No booking requests yet."
              : status === "paid"
                ? "No paid bookings yet."
                : "No bookings awaiting payment."}
          </p>
        </div>
      ) : (
        <div className="admin-card admin-table">
          <div className="admin-table-head">
            <span>Reference</span>
            <span>Traveller</span>
            <span>Status</span>
          </div>
          {orders.map((order) => (
            <Link href={`/admin/bookings/${order.bookingId}`} key={order.key}>
              <span>
                {order.reference}
                {order.itemCount > 1 ? (
                  <small className="admin-muted-block">
                    {order.itemCount} packages · {order.titles.join(", ")}
                  </small>
                ) : null}
                <small className="admin-muted-block">
                  {formatDate(order.createdAt)}
                </small>
              </span>
              <span>{order.travellerName}</span>
              <StatusBadge status={derivedBookingStatus(order.status)} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
