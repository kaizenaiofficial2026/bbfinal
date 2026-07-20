import { describe, expect, it } from "vitest";
import {
  filterByStatus,
  listHref,
  parseEnquiryStatus,
  parseListSort,
  sortByCreatedAt,
  statusCounts,
} from "@/lib/admin/list-view";

const rows = [
  { id: "a", status: "new", created_at: "2026-07-10T10:00:00Z" },
  { id: "b", status: "contacted", created_at: "2026-07-15T10:00:00Z" },
  { id: "c", status: "closed", created_at: "2026-07-19T10:00:00Z" },
  { id: "d", status: "new", created_at: "2026-07-01T10:00:00Z" },
];

describe("admin list view helpers", () => {
  it("parses status and sort with safe fallbacks", () => {
    expect(parseEnquiryStatus("contacted")).toBe("contacted");
    expect(parseEnquiryStatus("junk")).toBe("all");
    expect(parseEnquiryStatus(undefined)).toBe("all");
    expect(parseListSort("asc")).toBe("asc");
    expect(parseListSort("junk")).toBe("desc");
  });

  it("sorts by created_at both ways without mutating the input", () => {
    expect(sortByCreatedAt(rows, "desc").map((r) => r.id)).toEqual([
      "c",
      "b",
      "a",
      "d",
    ]);
    expect(sortByCreatedAt(rows, "asc").map((r) => r.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("filters by exact status; 'all' passes everything", () => {
    expect(filterByStatus(rows, "new").map((r) => r.id)).toEqual(["a", "d"]);
    expect(filterByStatus(rows, "closed").map((r) => r.id)).toEqual(["c"]);
    expect(filterByStatus(rows, "all")).toHaveLength(4);
  });

  it("counts per pill over the unfiltered list", () => {
    expect(statusCounts(rows)).toEqual({ all: 4, new: 2, contacted: 1, closed: 1 });
  });

  it("builds URLs with defaults implicit and both controls preserved", () => {
    expect(listHref("/admin/enquiries", "all", "desc")).toBe("/admin/enquiries");
    expect(listHref("/admin/enquiries", "new", "desc")).toBe(
      "/admin/enquiries?status=new",
    );
    expect(listHref("/admin/enquiries", "all", "asc")).toBe(
      "/admin/enquiries?sort=asc",
    );
    expect(listHref("/admin/enquiries", "closed", "asc")).toBe(
      "/admin/enquiries?status=closed&sort=asc",
    );
  });
});
