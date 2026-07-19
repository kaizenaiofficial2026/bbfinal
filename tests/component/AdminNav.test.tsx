import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

import { AdminNav } from "@/app/admin/_components/AdminNav";

/** Sections a second-level admin must never be offered. */
const SUPER_ONLY = [
  /packages/i,
  /destinations/i,
  /^enquiries$/i,
  /custom enquiries/i,
  /admins/i,
];

/** Sections both tiers get. */
const SHARED = [/dashboard/i, /bookings/i, /customers/i, /support panel/i, /settings/i];

describe("AdminNav tiering", () => {
  it("offers every section to a super admin", () => {
    render(<AdminNav isSuperAdmin />);

    for (const name of [...SHARED, ...SUPER_ONLY]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("hides super-only sections from a second-level admin", () => {
    render(<AdminNav isSuperAdmin={false} />);

    for (const name of SUPER_ONLY) {
      expect(screen.queryByRole("link", { name })).toBeNull();
    }
    for (const name of SHARED) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  // Hiding the link is presentation only — the pages themselves are guarded by
  // requireSuperAdmin, which is what actually stops a typed-in URL.
  it("never links to the admins screen for a second-level admin", () => {
    const { container } = render(<AdminNav isSuperAdmin={false} />);
    expect(container.querySelector('a[href="/admin/admins"]')).toBeNull();
  });
});
