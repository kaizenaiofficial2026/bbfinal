/**
 * Immutable identifiers for the legal text presented at checkout.
 *
 * Change the matching version whenever either document's substance changes.
 * The create-session endpoint stores these server-owned values with the
 * gateway audit record; client-supplied version strings are never trusted.
 */
export const CHECKOUT_TERMS_VERSION = "2026-07-27";
export const CHECKOUT_PRIVACY_VERSION = "2026-07-27";

