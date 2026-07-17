/**
 * Anti-spam honeypot: a concealed field that humans never see and bots fill.
 *
 * The name must stay something browser autofill has NO heuristic for. This was
 * previously `company`, which Chrome maps to the "organization" field of a saved
 * address profile and fills automatically — `autocomplete="off"` is ignored on
 * address fields — so real visitors were silently marked as bots and blocked.
 * Anything matching /company|organization|address|name|tel|email/ will do it
 * again; keep this neutral.
 */
export const HONEYPOT_FIELD = "referralCode";

/** True when the honeypot caught something — i.e. treat the submission as spam. */
export function trippedHoneypot(formData: FormData): boolean {
  return String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "";
}
