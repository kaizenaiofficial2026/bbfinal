import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the friendly label and positive tone for active/verified", () => {
    const { container } = render(<StatusBadge status="active" />);
    const badge = container.querySelector(".admin-badge") as HTMLElement;
    expect(badge).toHaveTextContent("Active");
    expect(badge.className).toContain("admin-badge--positive");
  });

  it("renders a danger tone for inactive/cancelled", () => {
    const { container } = render(<StatusBadge status="inactive" />);
    const badge = container.querySelector(".admin-badge") as HTMLElement;
    expect(badge).toHaveTextContent("Inactive");
    expect(badge.className).toContain("admin-badge--danger");
  });

  it("falls back to a neutral tone for unknown statuses", () => {
    const { container } = render(<StatusBadge status="brand_new" />);
    const badge = container.querySelector(".admin-badge") as HTMLElement;
    expect(badge).toHaveTextContent("Brand new");
    expect(badge.className).toContain("admin-badge--neutral");
  });
});
