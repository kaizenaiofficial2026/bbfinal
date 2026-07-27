import { after, NextResponse } from "next/server";
import { getPaymentByOrderId } from "@/lib/data/payments";
import { verifyWebhook } from "@/lib/payments/mpgs";
import { reconcilePayment } from "@/lib/payments/reconcile";

type WebhookPayload = {
  order?: {
    id?: unknown;
  };
  orderId?: unknown;
};

function getOrderId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const webhook = payload as WebhookPayload;
  const value = webhook.order?.id ?? webhook.orderId;

  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const orderId = String(value).trim();
  return orderId.length > 0 ? orderId : null;
}

export async function POST(request: Request) {
  const receivedSecret = request.headers.get("x-notification-secret");

  if (!verifyWebhook(receivedSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const orderId = getOrderId(payload);
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const notificationId = request.headers.get("x-notification-id");
  const notificationAttempt = request.headers.get("x-notification-attempt");

  after(async () => {
    let paymentId: string | undefined;

    try {
      const payment = await getPaymentByOrderId(orderId);
      if (!payment?.bookings) {
        return;
      }

      paymentId = payment.id;
      await reconcilePayment(payment, { checkCaptured: true });
    } catch {
      // The gateway has already received its acknowledgement, so this task must
      // contain every failure. The scheduled pending-payment reconciler remains
      // the durable fallback. Never log the notification body or secret.
      console.error("[payment webhook] deferred reconciliation failed", {
        orderId,
        paymentId,
        notificationId,
        notificationAttempt,
      });
    }
  });

  return NextResponse.json({ ok: true });
}
