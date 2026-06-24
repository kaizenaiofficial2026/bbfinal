import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";

// First-party pageview collector. The client beacons { path, referrer } here on
// each public route change; we store one row (with a salted IP hash, no raw IP)
// in page_views. Always responds 204 — tracking must never surface errors to
// the visitor, and a missing table just no-ops.
const NO_CONTENT = new NextResponse(null, { status: 204 });

const BOT_RE = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i;

export async function POST(request: NextRequest) {
  try {
    if (!canUseSupabaseService()) {
      return NO_CONTENT;
    }

    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
      referrer?: unknown;
    } | null;

    const path = typeof body?.path === "string" ? body.path : "";
    // Only first-party, on-site, non-internal page paths.
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.length > 512 ||
      path.startsWith("/admin") ||
      path.startsWith("/api")
    ) {
      return NO_CONTENT;
    }

    // Same-origin guard: ignore cross-site or scripted posts.
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const host = new URL(origin).host;
        const siteHost = new URL(env.siteUrl).host;
        if (host !== siteHost && !host.startsWith("localhost")) {
          return NO_CONTENT;
        }
      } catch {
        return NO_CONTENT;
      }
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    if (BOT_RE.test(userAgent)) {
      return NO_CONTENT;
    }

    const ip =
      request.headers.get("x-real-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    // Salted hash of IP+UA — counts unique visitors without storing the IP.
    const visitorHash = createHash("sha256")
      .update(`${ip}:${userAgent}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local"}`)
      .digest("hex");

    const referrer =
      typeof body?.referrer === "string" && body.referrer
        ? body.referrer.slice(0, 300)
        : null;
    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("x-country") ??
      null;

    const supabase = createSupabaseServiceClient();
    await supabase.from("page_views").insert({
      path: path.slice(0, 512),
      visitor_hash: visitorHash,
      referrer,
      country,
    });

    return NO_CONTENT;
  } catch {
    return NO_CONTENT;
  }
}
