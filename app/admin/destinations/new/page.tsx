import { requireAdmin } from "@/lib/admin/auth";
import DestinationForm from "../DestinationForm";

export default async function NewDestinationPage() {
  await requireAdmin();

  return (
    <div className="admin-stack">
      <span className="section-kicker">Destinations</span>
      <h1>Create destination</h1>
      <DestinationForm />
    </div>
  );
}
