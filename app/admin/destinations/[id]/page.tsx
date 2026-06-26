import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDestination } from "@/lib/data/destinations";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";
import { deleteDestinationAction } from "../../actions";
import DestinationForm from "../DestinationForm";

type DestinationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditDestinationPage({
  params,
  searchParams,
}: DestinationPageProps) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const destination = await getAdminDestination(id);

  if (!destination) notFound();

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/destinations">
        ← All destinations
      </Link>
      <div>
        <span className="section-kicker">Destinations</span>
        <h1>Edit {destination.title}</h1>
      </div>
      {error ? (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      ) : null}
      <DestinationForm destination={destination} />

      <form action={deleteDestinationAction} className="admin-danger-zone">
        <input type="hidden" name="id" value={destination.id} />
        <div>
          <strong>Delete this destination</strong>
          <p className="form-hint">
            Permanently removes this destination from the site. This can&apos;t
            be undone.
          </p>
        </div>
        <DeleteButton
          label="Delete destination"
          confirmText={`Permanently delete “${destination.title}”? This can't be undone.`}
        />
      </form>
    </div>
  );
}
