import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, requireServerEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireServerEnv("supabaseUrl"),
    requireServerEnv("supabaseAnonKey"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; Server Actions and route handlers can.
          }
        },
      },
    },
  );
}

export function canUseSupabaseServer() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
