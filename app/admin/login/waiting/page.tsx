import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";
import { AdminLoginWaiting } from "./AdminLoginWaiting";

export const dynamic = "force-dynamic";

type AdminLoginWaitingPageProps = {
  searchParams: Promise<{ req?: string }>;
};

export default async function AdminLoginWaitingPage({
  searchParams,
}: AdminLoginWaitingPageProps) {
  const { req } = await searchParams;
  const user = await getAdminUser();

  // The waiting screen is only valid for a just-signed-in admin awaiting a
  // decision. Without a session or a request id, send them back to login.
  if (!user || !req) {
    redirect("/admin/login");
  }

  return (
    <main className="admin-login">
      <AdminLoginWaiting requestId={req} />
    </main>
  );
}
