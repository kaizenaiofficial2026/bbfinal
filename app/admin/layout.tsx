import Link from "next/link";
import { signOutAction } from "./actions";
import ScrollUnlock from "./ScrollUnlock";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="admin-shell">
      <ScrollUnlock />
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          Beyond Borders Admin
        </Link>
        <nav className="admin-nav">
          <Link href="/admin/packages">Packages</Link>
          <Link href="/admin/destinations">Destinations</Link>
          <Link href="/admin/enquiries">Enquiries</Link>
          <Link href="/admin/custom-inquiries">Custom inquiries</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <Link href="/admin/users">Customers</Link>
          <Link href="/admin/settings">Settings</Link>
        </nav>
        <form action={signOutAction}>
          <button className="admin-link-button" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <section className="admin-main">{children}</section>
    </main>
  );
}
