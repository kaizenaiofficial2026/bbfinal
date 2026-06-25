import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

type RateLimitOptions = { max: number; windowMinutes: number };

/**
 * Generic DB-backed sliding-window rate limiter, keyed by action + IP hash.
 *
 * FAIL-OPEN by design: any error — most importantly the `rate_limit_events`
 * table not existing yet because the migration hasn't been applied — is logged
 * and the request is ALLOWED, so a limiter problem can never lock real users
 * out. Once the migration is applied the limit takes effect automatically.
 *
 * Counts attempts in the window, records this one, and reports whether the
 * caller is within the limit. Writes use the service role (RLS-exempt); the
 * table has RLS enabled with no policies so no other role can touch it.
 */
export async function checkAndRecordRateLimit(
  action: string,
  ipHash: string,
  { max, windowMinutes }: RateLimitOptions,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const supabase = createSupabaseServiceClient();
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const since = new Date(now - windowMs).toISOString();
    const { count, error } = await supabase
      .from("rate_limit_events")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (error) {
      throw error;
    }

    if ((count ?? 0) >= max) {
      // Sliding window: capacity returns when the OLDEST counted attempt ages
      // out of the window. Tell the caller how long that is so the UI can show
      // an accurate "try again in N minutes".
      let retryAfterSeconds = Math.ceil(windowMs / 1000);
      const { data: oldest } = await supabase
        .from("rate_limit_events")
        .select("created_at")
        .eq("action", action)
        .eq("ip_hash", ipHash)
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (oldest?.created_at) {
        const freeAt = new Date(oldest.created_at).getTime() + windowMs;
        retryAfterSeconds = Math.max(1, Math.ceil((freeAt - now) / 1000));
      }
      return { allowed: false, retryAfterSeconds };
    }

    await supabase.from("rate_limit_events").insert({ action, ip_hash: ipHash });
    return { allowed: true };
  } catch (error) {
    console.error("[rate-limit] check failed — allowing request", error);
    return { allowed: true };
  }
}
