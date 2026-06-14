import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDestination } from "@/lib/data/destinations";
import DestinationForm from "../DestinationForm";

type DestinationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDestinationPage({ params }: DestinationPageProps) {
  await requireAdmin();
  const { id } = await params;
  const destination = await getAdminDestination(id);

  if (!destination) notFound();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Destinations</span>
      <h1>Edit {destination.title}</h1>
      <DestinationForm destination={destination} />
    </div>
  );
}
