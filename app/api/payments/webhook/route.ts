import { NextResponse } from "next/server";
import { getPaymentByOrderId } from "@/lib/data/payments";
import { verifyWebhook } from "@/lib/payments/mpgs";
import { reconcilePayment } from "@/lib/payments/reconcile";

export async function POST(request: Request) {
  const body = await request.text();
  const receivedSecret = request.headers.get("x-notification-secret");

  if (!verifyWebhook(receivedSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: { order?: { id?: string | number }; orderId?: string | number };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const orderId = String(payload.order?.id ?? payload.orderId ?? "");
  const payment = await getPaymentByOrderId(orderId);

  if (!payment?.bookings) {
    return NextResponse.json({ ok: true });
  }

  await reconcilePayment(payment);

  return NextResponse.json({ ok: true });
}
