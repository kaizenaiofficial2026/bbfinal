import { NextResponse } from "next/server";
import { getPaymentByToken, orderReference } from "@/lib/data/payments";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/payments/mpgs";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash, isExpired } from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  CHECKOUT_PRIVACY_VERSION,
  CHECKOUT_TERMS_VERSION,
} from "@/lib/payments/consent";
import { isCanaryPaymentToken } from "@/lib/payments/availability";

const SESSION_REUSE_MS = 20 * 60_000;
const SESSION_CREATION_LOCK_MS = 90_000;

function ageMs(timestamp: string) {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? Math.max(0, Date.now() - value) : Infinity;
}

function sessionAgeMs(payment: {
  updated_at: string;
  gateway_result?: unknown;
}) {
  const audit = payment.gateway_result;
  const sessionCreatedAt =
    audit && typeof audit === "object" && !Array.isArray(audit)
      ? (audit as { sessionCreatedAt?: unknown }).sessionCreatedAt
      : undefined;
  return ageMs(
    typeof sessionCreatedAt === "string"
      ? sessionCreatedAt
      : payment.updated_at,
  );
}

function retryResponse() {
  return NextResponse.json(
    { error: "A payment session is already being prepared. Please try again." },
    { status: 409, headers: { "Retry-After": "3" } },
  );
}

export async function POST(request: Request) {
  // Same-origin only: this endpoint mutates payment state, so reject cross-site
  // callers (CSRF / abuse hardening). A missing Origin (non-browser) is allowed.
  const origin = request.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).origin === new URL(request.url).origin;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  // Throttle session creation per IP — caps abuse/amplification toward MPGS.
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit("create-session", ipHash, {
    max: 20,
    windowMinutes: 10,
  });
  if (!rate.allowed) {
    const minutes = toRetryMinutes(rate.retryAfterSeconds);
    return NextResponse.json(
      {
        error: `Too many payment attempts. Please wait about ${minutes} minute(s) and try again.`,
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rate.retryAfterSeconds
          ? { "Retry-After": String(rate.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  let input: {
    token?: unknown;
    acceptedTerms?: unknown;
    acceptedPrivacy?: unknown;
  };
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    input = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (input.acceptedTerms !== true || input.acceptedPrivacy !== true) {
    return NextResponse.json(
      { error: "Please accept the terms and privacy policy before paying." },
      { status: 400 },
    );
  }

  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!token || token.length > 256) {
    return NextResponse.json({ error: "Invalid payment link." }, { status: 400 });
  }

  const isCanary = isCanaryPaymentToken(token);
  if (!env.paymentsEnabled && !isCanary) {
    return NextResponse.json(
      { error: "Payments are disabled." },
      { status: 503 },
    );
  }

  const payment = await getPaymentByToken(String(token ?? ""));

  if (!payment?.bookings?.length) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (isExpired(payment.pay_token_expires_at)) {
    return NextResponse.json({ error: "Payment link expired." }, { status: 410 });
  }

  const alreadyPaid =
    payment.status === "captured" ||
    payment.status === "refunded" ||
    payment.bookings.every((b) => b.status === "paid");
  if (alreadyPaid) {
    return NextResponse.json({ error: "Payment already completed." }, { status: 409 });
  }

  // A live MID is provisioned for a specific presentment currency. Do not let a
  // stale/mistyped package currency reach MPGS and fail after the customer has
  // already committed to paying.
  const expectedCurrency = env.mpgsCurrency.trim().toUpperCase();
  const paymentCurrency = String(payment.currency ?? "").trim().toUpperCase();
  if (
    !/^[A-Z]{3}$/.test(expectedCurrency) ||
    paymentCurrency !== expectedCurrency
  ) {
    console.error("[create-session] payment currency is not enabled", {
      paymentId: payment.id,
      expectedCurrency,
      paymentCurrency,
    });
    return NextResponse.json(
      { error: "This order cannot currently be paid online. Please contact us." },
      { status: 409 },
    );
  }

  // Reuse a recently-created session. This makes browser retries and a second
  // tab idempotent instead of producing competing Hosted Checkout sessions.
  if (
    payment.status === "pending" &&
    payment.mpgs_session_id &&
    sessionAgeMs(payment) < SESSION_REUSE_MS
  ) {
    return NextResponse.json({ sessionId: payment.mpgs_session_id });
  }

  // `pending` + no session is the short-lived optimistic lock used by another
  // request while it talks to MPGS. A crashed lock becomes reclaimable.
  if (
    payment.status === "pending" &&
    !payment.mpgs_session_id &&
    ageMs(payment.updated_at) < SESSION_CREATION_LOCK_MS
  ) {
    return retryResponse();
  }

  const supabase = createSupabaseServiceClient();
  const previousStatus = payment.status;
  const previousSessionId = payment.mpgs_session_id;
  const { data: claimed, error: claimError } = await supabase
    .from("payments")
    .update({ status: "pending", mpgs_session_id: null })
    .eq("id", payment.id)
    .eq("updated_at", payment.updated_at)
    .in("status", ["initiated", "pending", "failed"])
    .select("id, updated_at")
    .maybeSingle();

  if (claimError) {
    console.error("[create-session] could not claim payment", {
      paymentId: payment.id,
      error: claimError,
    });
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 500 },
    );
  }
  if (!claimed) {
    return retryResponse();
  }

  let session;
  try {
    session = await createCheckoutSession(
      {
        orderId: payment.mpgs_order_id,
        amount: payment.amount,
        currency: paymentCurrency,
        description: `Beyond Borders order ${orderReference(payment)}`,
        returnUrl: `${env.siteUrl}/pay/${payment.pay_token}/result`,
      },
      {
        allowWhenPaymentsDisabled: isCanary,
      },
    );
  } catch (caught) {
    // Release only the lock this request owns. A newer request or webhook may
    // already have moved the row; optimistic locking keeps those writes intact.
    const { error: releaseError } = await supabase
      .from("payments")
      .update({
        status: previousStatus,
        mpgs_session_id: previousSessionId,
      })
      .eq("id", payment.id)
      .eq("updated_at", claimed.updated_at);
    console.error("[create-session] gateway request failed", {
      paymentId: payment.id,
      errorName: caught instanceof Error ? caught.name : "UnknownError",
      releaseFailed: Boolean(releaseError),
    });
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }

  const acceptedAt = new Date().toISOString();
  const { data: persisted, error: persistError } = await supabase
    .from("payments")
    .update({
      mpgs_session_id: session.id,
      status: "pending",
      gateway_result: {
        phase: "checkout_session",
        sessionCreatedAt: acceptedAt,
        session: session.raw,
        consent: {
          acceptedAt,
          termsVersion: CHECKOUT_TERMS_VERSION,
          privacyVersion: CHECKOUT_PRIVACY_VERSION,
        },
      },
    })
    .eq("id", payment.id)
    .eq("updated_at", claimed.updated_at)
    .neq("status", "captured")
    .select("id")
    .maybeSingle();

  if (persistError || !persisted) {
    console.error("[create-session] could not persist gateway session", {
      paymentId: payment.id,
      error: persistError,
    });
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: persistError ? 500 : 409 },
    );
  }

  return NextResponse.json({ sessionId: session.id });
}
