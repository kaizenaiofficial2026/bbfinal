import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * The brand logo for email headers.
 *
 * Embedded as an INLINE ATTACHMENT (cid:) rather than a hosted <img src>, so the
 * mark renders even when the mail is sent from a machine whose site URL isn't
 * publicly reachable (local dev, preview deploys) — a hosted URL would show a
 * broken image in those cases.
 *
 * If the file can't be read at runtime (some serverless bundles omit `public/`),
 * we fall back to the hosted copy instead of dropping the logo entirely.
 */

export const LOGO_CID = "bb-logo";

/** Natural size is 154×75; halved for a crisp header on retina mail clients. */
export const LOGO_WIDTH = 116;
export const LOGO_HEIGHT = 56;

export const LOGO_PUBLIC_PATH = "/assets/images/brand/logo.png";

const LOGO_FILE = path.join(process.cwd(), "public", LOGO_PUBLIC_PATH);

// `undefined` = not looked up yet, `null` = looked up and unavailable.
let cached: Buffer | null | undefined;

function readLogo(): Buffer | null {
  if (cached === undefined) {
    try {
      cached = readFileSync(LOGO_FILE);
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** Nodemailer attachment for the inline logo, or null when unavailable. */
export function logoAttachment() {
  const content = readLogo();
  if (!content) return null;
  return {
    filename: "beyond-borders.png",
    content,
    cid: LOGO_CID,
    contentType: "image/png",
    // Inline, so mail clients render it in place instead of listing it as a
    // downloadable attachment.
    contentDisposition: "inline" as const,
  };
}

/** `src` for the header image: the inline attachment, else the hosted file. */
export function logoSrc(): string {
  return readLogo()
    ? `cid:${LOGO_CID}`
    : `${env.siteUrl}${LOGO_PUBLIC_PATH}`;
}
