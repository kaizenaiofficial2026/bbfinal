import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listStalePendingPayments, orderReference } from "@/lib/data/payments";
import { reconcilePayment } from "@/lib/payments/reconcile";
import { env } from "@/lib/env";

/**
 * Scheduled safety net for payments that were captured but never finalised.
 *
 * A payment normally reconciles twice over: the MPGS webhook, and the customer
 * returning to /pay/[token]/result. If the webhook misfires and the customer
 * closes the tab, neither happens — the card is charged, the order sits
 * `pending`, no receipt goes out, and nothing retries. This job re-checks stale
 * pending payments against the gateway and finalises any that actually captured.
 *
 * Safe to run repeatedly: `reconcilePayment` is idempotent (a guarded status
 * transition), so an already-captured order is a no-op and never re-sends a
 * receipt.
 *
 * Scheduled from vercel.json. Vercel sends `Authorization: Bearer $CRON_SECRET`
 * when CRON_SECRET is set; we FAIL CLOSED if it isn't, so a misconfiguration
 * can't leave this endpoint open to the internet.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!env.paymentsEnabled) {
    return NextResponse.json({ ok: true, skipped: "payments disabled" });
  }

  let pending;
  try {
    pending = await listStalePendingPayments({
      olderThanMinutes: 15,
      limit: 25,
    });
  } catch (error) {
    console.error("[reconcile-pending] could not list payments", error);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  let captured = 0;
  let stillPending = 0;
  let failed = 0;

  for (const payment of pending) {
    if (!payment.bookings?.length) continue;
    try {
      const result = await reconcilePayment(payment);
      if (result.captured) {
        captured += 1;
        // Loud on purpose: this is money that would otherwise have been lost.
        console.warn("[reconcile-pending] recovered a captured payment", {
          reference: orderReference(payment),
          paymentId: payment.id,
        });
      } else {
        stillPending += 1;
      }
    } catch (error) {
      // One bad order must not stop the rest of the batch.
      failed += 1;
      console.error("[reconcile-pending] failed for one payment", {
        reference: orderReference(payment),
        paymentId: payment.id,
        error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: pending.length,
    captured,
    stillPending,
    failed,
  });
}
