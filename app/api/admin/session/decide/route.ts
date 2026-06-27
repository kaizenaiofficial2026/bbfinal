import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { decideAdminLogin, getAdminSessionId } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * The active admin allows or denies a pending login request. Only the current
 * seat holder can decide (enforced in decideAdminLogin). On "approve" the seat
 * is handed to the requester and this admin becomes superseded.
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    requestId?: unknown;
    decision?: unknown;
  };
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const decision = body.decision === "approve" ? "approve" : "deny";

  if (!requestId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sid = await getAdminSessionId();
  const status = await decideAdminLogin(user.id, sid, requestId, decision);

  return NextResponse.json({ ok: status !== "invalid", status });
}
