import { signOutAction } from "./actions";
import Image from "next/image";
import Link from "next/link";
import ScrollUnlock from "./ScrollUnlock";
import { AdminNav } from "./_components/AdminNav";
import AdminPresence from "./_components/AdminPresence";
import AdminTopbar from "./_components/AdminTopbar";
import { ToastProvider } from "@/components/Toast";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <AdminNav />
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
              <button className="admin-link-button" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <section className="admin-main">{children}</section>
      </main>
    </ToastProvider>
  );
}
