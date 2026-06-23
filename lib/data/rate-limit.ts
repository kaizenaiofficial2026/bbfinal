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
): Promise<{ allowed: boolean }> {
  try {
    const supabase = createSupabaseServiceClient();
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
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
      return { allowed: false };
    }

    await supabase.from("rate_limit_events").insert({ action, ip_hash: ipHash });
    return { allowed: true };
  } catch (error) {
    console.error("[rate-limit] check failed — allowing request", error);
    return { allowed: true };
  }
}
