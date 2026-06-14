import "server-only";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";

export async function getRequestIpHash() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || headerStore.get("x-real-ip");

  if (!ip) {
    return null;
  }

  return createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local"}`)
    .digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function generateBookingReference() {
  return `BB-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function isExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}
