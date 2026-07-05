import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export type ApiAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

// Hashing both sides to a fixed 32-byte digest lets us compare in constant time
// (timingSafeEqual requires equal lengths) without leaking the key's length.
function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Authorise a request to the support API via a shared secret bearer token.
 *
 * Fails CLOSED: if SUPPORT_API_KEY isn't configured the API is treated as
 * disabled (503). A missing/malformed header or wrong key is 401. The comparison
 * is constant-time to prevent timing attacks.
 */
export function authorizeSupportApi(request: Request): ApiAuthResult {
  const expected = env.supportApiKey;
  if (!expected) {
    return { ok: false, status: 503, error: "Support API is not configured." };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing or malformed Authorization header.",
    };
  }

  if (!timingSafeEqual(digest(token), digest(expected))) {
    return { ok: false, status: 401, error: "Invalid API key." };
  }

  return { ok: true };
}
