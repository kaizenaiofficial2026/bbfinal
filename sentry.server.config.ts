import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error reporting.
 *
 * ERRORS ONLY — `tracesSampleRate: 0` disables performance tracing. This exists
 * because failures used to die silently in Vercel's runtime logs: a swallowed
 * invoice email meant a customer was charged with no receipt and nobody knew.
 * Tracing would add cost and noise without helping that.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // No-op when the DSN is absent (e.g. local dev), so nothing breaks untracked.
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  // Don't ship local noise to the dashboard.
  debug: false,
});
