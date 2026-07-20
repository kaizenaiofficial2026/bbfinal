/**
 * URL-driven list controls shared by the admin enquiry screens: a status pill
 * row + a created_at sort toggle, both kept in searchParams so views are
 * shareable and refresh-safe. Pure functions — the pages apply them after
 * fetching.
 */

export type ListSort = "asc" | "desc";

export const ENQUIRY_STATUS_PILLS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
] as const;

export type EnquiryStatusKey = (typeof ENQUIRY_STATUS_PILLS)[number]["key"];

export function parseEnquiryStatus(value: string | undefined): EnquiryStatusKey {
  return (ENQUIRY_STATUS_PILLS.find((p) => p.key === value)?.key ??
    "all") as EnquiryStatusKey;
}

export function parseListSort(value: string | undefined): ListSort {
  return value === "asc" ? "asc" : "desc";
}

export function sortByCreatedAt<T extends { created_at: string }>(
  rows: T[],
  direction: ListSort,
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) => sign * (Date.parse(a.created_at) - Date.parse(b.created_at)),
  );
}

export function filterByStatus<T extends { status: string }>(
  rows: T[],
  status: EnquiryStatusKey,
): T[] {
  if (status === "all") return rows;
  return rows.filter((row) => row.status === status);
}

/** Counts for the pill row, computed once over the unfiltered list. */
export function statusCounts<T extends { status: string }>(
  rows: T[],
): Record<EnquiryStatusKey, number> {
  return {
    all: rows.length,
    new: filterByStatus(rows, "new").length,
    contacted: filterByStatus(rows, "contacted").length,
    closed: filterByStatus(rows, "closed").length,
  };
}

/** List URL with both controls encoded; defaults (all, desc) stay implicit. */
export function listHref(
  basePath: string,
  status: EnquiryStatusKey,
  sort: ListSort,
): string {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (sort !== "desc") params.set("sort", sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
