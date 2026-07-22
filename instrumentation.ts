import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Loads the right Sentry config per runtime, and
 * `onRequestError` is what actually captures failures thrown inside Server
 * Components, route handlers and Server Actions — without it, those are the
 * errors that would still vanish.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
