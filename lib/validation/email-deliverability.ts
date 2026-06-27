import "server-only";

import { promises as dns } from "node:dns";

// Throwaway / disposable inboxes are designed to stop working — reject them on
// the lead-capture forms so we don't collect leads we can never reach.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "grr.la",
  "sharklasers.com", "10minutemail.com", "10minutemail.net", "tempmail.com",
  "temp-mail.org", "tempmail.net", "tempmailo.com", "throwawaymail.com",
  "yopmail.com", "yopmail.net", "getnada.com", "nada.email", "dispostable.com",
  "maildrop.cc", "mailnesia.com", "trashmail.com", "trashmail.de", "fakeinbox.com",
  "spamgourmet.com", "mintemail.com", "mohmal.com", "emailondeck.com",
  "mailcatch.com", "tempr.email", "discard.email", "anonbox.net", "mailsac.com",
  "inboxkitten.com", "spam4.me", "moakt.com", "luxusmail.org",
]);

// RFC 2606 / 6761 reserved TLDs and documentation domains that never accept
// real mail (this is what `test@test.com` / `x@example.com` resolve into).
const RESERVED_TLDS = new Set(["test", "example", "invalid", "localhost"]);
const RESERVED_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "test.com",
]);

/**
 * Synchronous check (no DNS) for an address whose domain provably cannot receive
 * real mail: a reserved TLD (`*.test`, `*.example`, `*.invalid`, `*.localhost`)
 * or a documentation domain. Used on the *outbound send* path so the app never
 * hands such an address to SMTP — those always NXDOMAIN-bounce back to the
 * From/Return-Path inbox. The e2e/integration harness seeds `@beyondborders.test`
 * users directly via the service role (bypassing the form-level deliverability
 * check), so without this guard a test run against live SMTP floods reservations@.
 */
export function isReservedEmailDomain(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;
  const domain = normalized.slice(at + 1);
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  return RESERVED_TLDS.has(tld) || RESERVED_DOMAINS.has(domain);
}

export type DeliverabilityResult = { ok: true } | { ok: false; reason: string };

const TYPO = "We couldn't find a mail server for that email's domain — please check for a typo.";

/**
 * Best-effort check that an email address points at a domain that can actually
 * receive mail: blocks disposable/reserved domains, then verifies the domain
 * publishes an MX record (or, per RFC 5321 §5.1, falls back to an A/AAAA record).
 *
 * Server-only (uses node:dns). Designed to FAIL OPEN on transient DNS errors so
 * a temporary network blip never blocks a legitimate visitor — it only rejects
 * when a domain provably cannot receive mail.
 */
export async function checkEmailDeliverable(
  email: string,
): Promise<DeliverabilityResult> {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) {
    return { ok: false, reason: "Please enter a valid email address." };
  }

  const domain = normalized.slice(at + 1);
  const tld = domain.slice(domain.lastIndexOf(".") + 1);

  if (RESERVED_TLDS.has(tld) || RESERVED_DOMAINS.has(domain)) {
    return { ok: false, reason: "Please enter a real email address we can reach." };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: "Please use a permanent email address — disposable inboxes aren't accepted.",
    };
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0 && mx.some((record) => record.exchange)) {
      return { ok: true };
    }
    // No MX records → fall through to the A/AAAA fallback below.
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "NXDOMAIN") {
      return { ok: false, reason: TYPO };
    }
    if (code !== "ENODATA") {
      // Transient (ETIMEOUT / ESERVFAIL / etc.) — don't block a real visitor.
      return { ok: true };
    }
  }

  // A domain with no MX but a resolvable A/AAAA record still accepts mail.
  try {
    await dns.lookup(domain);
    return { ok: true };
  } catch {
    return { ok: false, reason: TYPO };
  }
}
