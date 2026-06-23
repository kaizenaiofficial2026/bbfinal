import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPackage } from "@/lib/data/packages";
import PackageForm from "../PackageForm";

type PackagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPackagePage({ params }: PackagePageProps) {
  await requireAdmin();
  const { id } = await params;
  const tourPackage = await getAdminPackage(id);

  if (!tourPackage) notFound();

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/packages">
        ← All packages
      </Link>
      <div>
        <span className="section-kicker">Packages</span>
        <h1>Edit {tourPackage.title}</h1>
      </div>
      <PackageForm tourPackage={tourPackage} />
    </div>
  );
}
