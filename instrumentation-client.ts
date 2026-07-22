import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side error reporting.
 *
 * NOTE: the Sentry ingest host must be present in the CSP `connect-src`
 * (see next.config.ts) or the browser silently blocks every event and the
 * dashboard just looks empty.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  // Session Replay is off: this site handles passport numbers and card entry,
  // and replay would record customer PII into a third-party service.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
