/**
 * Pure date helpers shared by the booking + custom-inquiry forms (client),
 * their server schemas, and unit tests. Inputs are ISO date strings
 * ("YYYY-MM-DD") from native <input type="date"> controls, which order
 * correctly under plain string comparison.
 */

/** Today as an ISO "YYYY-MM-DD" string (local time). */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** True when `value` is a non-empty ISO date strictly before `today`. */
export function isPastDate(value: string, today: string = todayIso()): boolean {
  if (!value) return false;
  return value < today;
}

/** True when both dates are present and `end` is the same day or after `start`. */
export function isValidRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  return end >= start;
}

/** Label for a chosen range, stored as the booking's `travel_dates` string. */
export function combineTravelDates(start: string, end: string): string {
  if (start && end) return `${start} to ${end}`;
  return start || end || "";
}
