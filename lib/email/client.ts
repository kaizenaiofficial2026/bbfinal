import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

let cached: Transporter | null = null;

/**
 * Build (and memoize) the Zoho SMTP transport.
 *
 * Returns null when SMTP credentials are not configured, so callers can cleanly
 * skip sending instead of throwing — the same fail-soft contract the rest of the
 * app relies on. Port 465 uses implicit TLS (secure); 587 upgrades via STARTTLS.
 */
export function getMailTransport(): Transporter | null {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) {
    return null;
  }

  if (!cached) {
    cached = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
    });
  }

  return cached;
}
