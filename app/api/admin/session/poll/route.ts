import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { getAdminPresence, getAdminSessionId } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * Presence poll for the ACTIVE admin's browser. Returns whether this session
 * still holds the admin seat and any pending login request awaiting a decision.
 * Only an authenticated admin gets meaningful data.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ authed: false, active: false, pending: null });
  }

  const sid = await getAdminSessionId();
  const presence = await getAdminPresence(user.id, sid, user.email ?? "");

  return NextResponse.json({ authed: true, ...presence });
}
