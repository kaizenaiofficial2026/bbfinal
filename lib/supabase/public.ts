import { createClient } from "@supabase/supabase-js";
import { env, hasSupabasePublicEnv } from "@/lib/env";

export function createSupabasePublicClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: {
      persistSession: false,
    },
  });
}
