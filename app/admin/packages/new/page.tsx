import { requireAdmin } from "@/lib/admin/auth";
import PackageForm from "../PackageForm";

export default async function NewPackagePage() {
  await requireAdmin();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Packages</span>
      <h1>Create package</h1>
      <PackageForm />
    </div>
  );
}
