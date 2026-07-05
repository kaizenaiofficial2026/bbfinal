import { NextResponse } from "next/server";
import { authorizeSupportApi } from "@/lib/api/support-auth";
import { supportTicketStatusSchema } from "@/lib/validation/support";
import {
  getSupportTicketService,
  updateSupportTicketStatusService,
  type SupportTicketRow,
} from "@/lib/data/support-tickets";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authorizeSupportApi(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE },
    );
  }

  const { id } = await params;

  try {
    const row = await getSupportTicketService(id);
    if (!row) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { ticket: toApiTicket(row) },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("[api/support-tickets/:id] failed", error);
    return NextResponse.json(
      { error: "Failed to load ticket." },
      { status: 500, headers: NO_STORE },
    );
  }
}

// Update a ticket's status. Only the allowed lifecycle values are accepted.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authorizeSupportApi(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE },
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = supportTicketStatusSchema.safeParse(
    (body as { status?: unknown })?.status,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'status must be one of: "open", "in_progress", "closed".' },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const row = await updateSupportTicketStatusService(id, parsed.data);
    if (!row) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { ticket: toApiTicket(row) },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("[api/support-tickets/:id] PATCH failed", error);
    return NextResponse.json(
      { error: "Failed to update ticket." },
      { status: 500, headers: NO_STORE },
    );
  }
}
