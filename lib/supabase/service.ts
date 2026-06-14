import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env, requireServerEnv } from "@/lib/env";

export function createSupabaseServiceClient() {
  return createClient(
    requireServerEnv("supabaseUrl"),
    requireServerEnv("supabaseServiceRoleKey"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-application-name": "beyond-borders-next",
        },
      },
    },
  );
}

export function canUseSupabaseService() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
