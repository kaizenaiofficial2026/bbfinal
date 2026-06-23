"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/custom-inquiries", label: "Custom inquiries" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/** Sidebar navigation with active-section highlighting. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {LINKS.map((link) => {
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
