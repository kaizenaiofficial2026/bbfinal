import { NextResponse } from "next/server";
import { authorizeSupportApi } from "@/lib/api/support-auth";
import {
  listSupportTicketsService,
  type SupportTicketRow,
} from "@/lib/data/support-tickets";

// Authenticated, read-only. Always dynamic + no-store so the dashboard sees live
// data and responses are never cached at the edge.
export const dynamic = "force-dynamic";

// The public API contract (camelCase) — decoupled from the DB column names.
function toApiTicket(row: SupportTicketRow) {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: Request) {
  const auth = authorizeSupportApi(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE },
    );
  }

  try {
    const rows = await listSupportTicketsService();
    return NextResponse.json(
      { tickets: rows.map(toApiTicket) },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("[api/support-tickets] list failed", error);
    return NextResponse.json(
      { error: "Failed to load tickets." },
      { status: 500, headers: NO_STORE },
    );
  }
}
