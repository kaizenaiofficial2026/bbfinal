import { requireAdmin } from "@/lib/admin/auth";
import { listSupportTickets } from "@/lib/data/support-tickets";
import SupportTickets from "./SupportTickets";

export default async function AdminSupportPage() {
  await requireAdmin();
  const rows = await listSupportTickets();
  const tickets = rows.map((ticket) => ({
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    image: ticket.image_url ?? undefined,
    status: ticket.status,
    createdAt: ticket.created_at,
  }));

  return (
    <div className="admin-stack">
      <div>
        <span className="section-kicker">Support panel</span>
        <h1>Support panel</h1>
      </div>

      <SupportTickets tickets={tickets} />
    </div>
  );
}
