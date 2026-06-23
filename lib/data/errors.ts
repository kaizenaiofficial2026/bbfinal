import "server-only";

/**
 * Log the real database error server-side and throw a generic, client-safe
 * message. Keeps raw Postgres / Supabase detail (column names, constraint names,
 * RLS hints, enum-cast failures) out of any response, error overlay, or digest.
 *
 * Use right after a Supabase error check: `if (error) dbError(error);`.
 */
export function dbError(error: unknown): never {
  console.error("[db error]", error);
  throw new Error("A database error occurred. Please try again.");
}
