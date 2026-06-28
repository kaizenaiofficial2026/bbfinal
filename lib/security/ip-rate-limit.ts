import type { NextRequest } from "next/server";

// Lightweight per-instance, per-IP fixed-window limiter for public, high-volume
// GET endpoints (typeaheads fire a request per keystroke). The window is
// generous — it only trips on abusive bursts, never on normal typing — and is
// defence-in-depth on top of in-process memoisation and Vercel's platform
// protections. State is per warm instance (not global), which is sufficient to
// blunt single-client amplification without a DB round-trip on every keystroke.
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

const MAX_KEYS = 5000;

export function makeIpRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}) {
  const hits = new Map<string, { count: number; reset: number }>();
  return function limited(ip: string, now: number): boolean {
    const entry = hits.get(ip);
    if (!entry || now > entry.reset) {
      hits.set(ip, { count: 1, reset: now + windowMs });
      // Hard-cap the map so a flood of distinct keys (e.g. spoofed
      // x-forwarded-for) can't grow it without bound: prune expired entries,
      // then evict oldest-first (Map preserves insertion order) until at cap.
      if (hits.size > MAX_KEYS) {
        for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
        while (hits.size > MAX_KEYS) {
          const oldest = hits.keys().next().value;
          if (oldest === undefined) break;
          hits.delete(oldest);
        }
      }
      return false;
    }
    entry.count += 1;
    return entry.count > max;
  };
}
