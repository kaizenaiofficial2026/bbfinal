import { signOutAction } from "./actions";
import Image from "next/image";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import ScrollUnlock from "./ScrollUnlock";
import { AdminNav } from "./_components/AdminNav";
import AdminPresence from "./_components/AdminPresence";
import AdminTopbar from "./_components/AdminTopbar";
import { ToastProvider } from "@/components/Toast";
import { getAdminContext } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the tier so the nav only shows areas this admin may use. Second-level
  // admins never see Packages / Destinations / Enquiries / Custom enquiries.
  const ctx = await getAdminContext();
  const isSuperAdmin = ctx?.isSuperAdmin ?? true;

  return (
    <ToastProvider>
      <AdminPresence />
      <main className="admin-shell">
        <ScrollUnlock />
        <AdminTopbar />
        <aside className="admin-sidebar" id="adminSidebar">
          <Link
            className="admin-brand"
            href="/admin"
            aria-label="Beyond Borders admin home"
          >
            <Image
              className="admin-logo"
              src="/assets/images/brand/logo.png"
              alt="Beyond Borders"
              width={154}
              height={75}
              priority
              unoptimized
            />
          </Link>
          <AdminNav isSuperAdmin={isSuperAdmin} />
          <div className="admin-sidebar-footer">
            <a
              className="admin-view-site"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View site ↗
            </a>
            <form action={signOutAction}>
              <SubmitButton className="admin-link-button">Sign out</SubmitButton>
            </form>
          </div>
        </aside>
        <section className="admin-main">{children}</section>
      </main>
    </ToastProvider>
  );
}
