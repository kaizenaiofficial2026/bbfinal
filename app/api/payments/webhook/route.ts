import { NextResponse } from "next/server";
import { getPaymentByOrderId } from "@/lib/data/payments";
import { verifyWebhook } from "@/lib/payments/mpgs";
import { reconcilePayment } from "@/lib/payments/reconcile";

export async function POST(request: Request) {
  const body = await request.text();
  const signature =
    request.headers.get("x-notification-signature") ??
    request.headers.get("x-mpgs-signature");

  if (!verifyWebhook(body, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const orderId = String(payload.order?.id ?? payload.orderId ?? "");
  const payment = await getPaymentByOrderId(orderId);

  if (!payment?.bookings) {
    return NextResponse.json({ ok: true });
  }

  await reconcilePayment(payment);

  return NextResponse.json({ ok: true });
}
