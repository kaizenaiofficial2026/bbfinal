import { NextResponse } from "next/server";
import { getPaymentByToken, orderReference } from "@/lib/data/payments";
import { env } from "@/lib/env";
import { createCheckoutSession } from "@/lib/payments/mpgs";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash, isExpired } from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!env.paymentsEnabled) {
    return NextResponse.json({ error: "Payments are disabled." }, { status: 503 });
  }

  // Same-origin only: this endpoint mutates payment state, so reject cross-site
  // callers (CSRF / abuse hardening). A missing Origin (non-browser) is allowed.
  const origin = request.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === request.headers.get("host");
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

  const { token } = await request.json();
  const payment = await getPaymentByToken(String(token ?? ""));

  if (!payment?.bookings?.length) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (isExpired(payment.pay_token_expires_at)) {
    return NextResponse.json({ error: "Payment link expired." }, { status: 410 });
  }

  const alreadyPaid =
    payment.status === "captured" ||
    payment.bookings.every((b) => b.status === "paid");
  if (alreadyPaid) {
    return NextResponse.json({ error: "Payment already completed." }, { status: 409 });
  }

  // Surface a real reason if the gateway rejects the session (e.g. an
  // unsupported currency) instead of letting it become an unhandled 500 — that
  // crashes the client's response.json() into a misleading "string did not
  // match the expected pattern" error.
  let session;
  try {
    session = await createCheckoutSession({
      orderId: payment.mpgs_order_id,
      amount: payment.amount,
      currency: payment.currency,
      description: `Beyond Borders order ${orderReference(payment)}`,
      returnUrl: `${env.siteUrl}/pay/${payment.pay_token}/result`,
    });
  } catch (caught) {
    console.error("[create-session] gateway error", caught);
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "We couldn't start the payment. Please contact us.",
      },
      { status: 502 },
    );
  }

  const supabase = createSupabaseServiceClient();
  await supabase
    .from("payments")
    .update({
      mpgs_session_id: session.id,
      status: "pending",
      gateway_result: session.raw,
    })
    .eq("id", payment.id);

  return NextResponse.json({ sessionId: session.id });
}
