import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPackage } from "@/lib/data/packages";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { deletePackageAction } from "../../actions";
import PackageForm from "../PackageForm";

type PackagePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditPackagePage({
  params,
  searchParams,
}: PackagePageProps) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
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
      {error ? (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      ) : null}
      <PackageForm tourPackage={tourPackage} />

      <form action={deletePackageAction} className="admin-danger-zone">
        <input type="hidden" name="id" value={tourPackage.id} />
        <div>
          <strong>Delete this package</strong>
          <p className="form-hint">
            Permanently removes the package and its itinerary. A package with
            bookings can&apos;t be deleted — set it to Draft instead.
          </p>
        </div>
        <DeleteButton
          label="Delete package"
          confirmText={`Permanently delete “${tourPackage.title}” and its itinerary? This can't be undone.`}
        />
      </form>
    </div>
  );
}
