import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import PackageForm from "../PackageForm";

export default async function NewPackagePage() {
  await requireAdmin();

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/packages">
        ← All packages
      </Link>
      <div>
        <span className="section-kicker">Packages</span>
        <h1>Create package</h1>
      </div>
      <PackageForm />
    </div>
  );
}
