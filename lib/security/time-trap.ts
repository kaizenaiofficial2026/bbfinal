/**
 * Anti-spam time-trap: a form stamps `startedAt` (client clock) at mount; a
 * genuine human takes at least ~2.5s to fill and submit, a bot is instant.
 *
 * `startedAt` is the visitor's device clock, while Date.now() here is the server
 * clock. A NEGATIVE elapsed means the device clock runs AHEAD of the server's —
 * that's clock skew, not a bot, so we let it through. Without this guard, anyone
 * whose laptop clock is fast got "please wait a moment" on every submit forever.
 * Only a small, non-negative elapsed indicates a genuine instant (bot) submission.
 */
export function passedTimeTrap(startedAt?: number): boolean {
  if (!startedAt) {
    return true;
  }
  const elapsed = Date.now() - startedAt;
  if (elapsed < 0) {
    return true;
  }
  return elapsed >= 2500;
}
