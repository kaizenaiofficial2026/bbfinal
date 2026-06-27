import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { getAdminSessionId, pollAdminLoginRequest } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * Status poll for a WAITING admin's browser (the one contesting the seat). Maps
 * the pending login request to pending / approved / denied / expired. Self-heals
 * if the request was clobbered (see pollAdminLoginRequest), possibly returning a
 * new requestId the waiting screen should switch to.
 */
export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ status: "denied", authed: false });
  }

  const requestId = request.nextUrl.searchParams.get("req") ?? "";
  if (!requestId) {
    return NextResponse.json({ status: "denied", authed: true });
  }

  const sid = await getAdminSessionId();
  const result = await pollAdminLoginRequest(
    user.id,
    sid,
    requestId,
    user.email ?? "",
  );

  return NextResponse.json({ authed: true, ...result });
}
