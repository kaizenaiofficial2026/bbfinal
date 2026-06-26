import "server-only";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";

export async function getRequestIpHash() {
  const headerStore = await headers();
  // Prefer the platform-set single client IP (e.g. x-real-ip on Vercel) over the
  // left-most x-forwarded-for entry, which a client can prepend to rotate its
  // rate-limit key.
  const realIp = headerStore.get("x-real-ip")?.trim();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const ip = realIp || forwardedFor.split(",")[0]?.trim();

  // No platform IP at all (shouldn't happen on Vercel). FAIL OPEN with a unique
  // per-request bucket rather than collapsing every header-less request into one
  // shared "unknown" bucket — that made the limiter effectively global and
  // locked innocent users out for hours.
  if (!ip) {
    return createHash("sha256").update(randomBytes(16)).digest("hex");
  }

  return createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local"}`)
    .digest("hex");
}

/**
 * Combine the IP hash with a per-account scope (e.g. the email being signed
 * into). Users behind a SHARED public IP — office Wi-Fi, mobile/CGNAT — then get
 * their OWN sliding window per account instead of a single collective one, so
 * one person's attempts can't lock everyone else out. Brute-forcing a single
 * account is still throttled. Empty scope falls back to the bare IP bucket.
 */
export function scopedRateKey(ipHash: string, scope: string) {
  const trimmed = scope.trim().toLowerCase();
  if (!trimmed) return ipHash;
  return createHash("sha256").update(`${ipHash}:${trimmed}`).digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function generateBookingReference() {
  return `BB-${randomBytes(3).toString("hex").toUpperCase()}`;
}

// Short, human-friendly reference for a custom inquiry. Used only inside the
// notification SMS (not persisted), so the team has an order number to quote.
export function generateInquiryReference() {
  return `BB-INQ-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function isExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}
