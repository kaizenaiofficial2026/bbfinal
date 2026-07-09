import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin/auth";
import DestinationForm from "../DestinationForm";

export default async function NewDestinationPage() {
  await requireSuperAdmin();

  return (
    <div className="admin-stack">
      <Link className="admin-back" href="/admin/destinations">
        ← All destinations
      </Link>
      <div>
        <span className="section-kicker">Destinations</span>
        <h1>Create destination</h1>
      </div>
      <DestinationForm />
    </div>
  );
}
