import { signOutAction } from "./actions";
import Image from "next/image";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import Logo from "@/components/Logo";
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
  const adminEmail = ctx?.user.email ?? null;
  const roleLabel = isSuperAdmin ? "Super admin" : "Second-level admin";

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
            <p className="admin-credit">
              made with <span aria-hidden="true">❤️</span>
              <span className="visually-hidden">love</span> by <Logo />
            </p>
          </div>
        </aside>
        <section className="admin-main">
          {adminEmail ? (
            <div className="admin-identity" aria-label="Signed in admin">
              <span className="admin-identity-email">{adminEmail}</span>
              <span className="admin-identity-role">{roleLabel}</span>
            </div>
          ) : null}
          {children}
        </section>
      </main>
    </ToastProvider>
  );
}
