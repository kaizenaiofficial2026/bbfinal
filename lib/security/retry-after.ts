/**
 * Convert a retry-after delay (seconds) into whole minutes for user-facing
 * "try again in N minutes" copy. Always at least 1 so we never say "0 minutes".
 */
export function toRetryMinutes(seconds?: number): number {
  if (!seconds || seconds <= 0) return 1;
  return Math.max(1, Math.ceil(seconds / 60));
}
