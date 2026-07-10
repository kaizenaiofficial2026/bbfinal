"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

// `superOnly` sections are hidden from (and blocked for) second-level admins.
const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/packages", label: "Packages", superOnly: true },
  { href: "/admin/destinations", label: "Destinations", superOnly: true },
  { href: "/admin/enquiries", label: "Enquiries", superOnly: true },
  { href: "/admin/custom-inquiries", label: "Custom enquiries", superOnly: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Customers" },
  { href: "/admin/admins", label: "Admins", superOnly: true },
  { href: "/admin/support", label: "Support panel" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * Inline pending indicator. `useLinkStatus` flips to pending the instant its
 * parent <Link> is clicked, so the user gets immediate feedback while the next
 * screen streams in — covering the gap before <loading> / the route renders.
 */
function NavPending() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className="admin-nav-spinner" aria-label="Loading" role="status" />
  ) : null;
}

/** Sidebar navigation with active-section highlighting + per-link loading. */
export function AdminNav({ isSuperAdmin = true }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isSuperAdmin
    ? LINKS
    : LINKS.filter((link) => !("superOnly" in link && link.superOnly));

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {links.map((link) => {
        // Dashboard ("/admin") matches exactly; section links also match their
        // detail/edit children (e.g. /admin/bookings/123).
        const active =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span>{link.label}</span>
            <NavPending />
          </Link>
        );
      })}
    </nav>
  );
}
