import "server-only";

import { orderReference, type PaymentWithBookings } from "@/lib/data/payments";
import { sendInvoiceEmails } from "@/lib/email/send";
import { sendPaymentSms } from "@/lib/sms/send";
import { retrieveOrder } from "@/lib/payments/mpgs";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ReconcileResult = {
  captured: boolean;
  alreadyFinalized: boolean;
};

/**
 * Confirm a payment against MPGS and apply the outcome exactly once.
 *
 * Idempotent and concurrency-safe so it can be called from both the webhook
 * and the customer return page without sending duplicate receipts:
 *  - a fast path returns early when the payment is already captured;
 *  - the status update is guarded with `.neq("status", "captured")`, so only
 *    the single call that actually transitions the row sends the receipt email,
 *    even if the webhook and the return page race each other.
 */
export async function reconcilePayment(
  payment: PaymentWithBookings,
): Promise<ReconcileResult> {
  const bookings = payment.bookings ?? [];
  if (bookings.length === 0) {
    return { captured: false, alreadyFinalized: false };
  }

  if (payment.status === "captured") {
    return { captured: true, alreadyFinalized: true };
  }

  const order = await retrieveOrder(payment.mpgs_order_id);
  const captured = order.result === "SUCCESS" && order.status === "CAPTURED";
  // Only move to a terminal "failed" on a real gateway failure. If the order is
  // still pending/initiated (e.g. the customer hit the return page before MPGS
  // finalized), leave it "pending" so a later notification can still capture it
  // — writing "failed" prematurely would surface a wrong outcome to the customer.
  const failed =
    order.result === "FAILURE" ||
    ["FAILED", "DECLINED", "CANCELLED", "EXPIRED", "REJECTED"].includes(
      String(order.status ?? ""),
    );
  const nextStatus = captured ? "captured" : failed ? "failed" : "pending";
  const supabase = createSupabaseServiceClient();

  const { data: transitioned } = await supabase
    .from("payments")
    .update({
      status: nextStatus,
      mpgs_transaction_id: order.transaction?.[0]?.transaction?.id ?? null,
      gateway_result: order,
    })
    .eq("id", payment.id)
    .neq("status", "captured")
    .select("id")
    .maybeSingle();

  const didTransition = Boolean(transitioned);

  if (captured && didTransition) {
    // Mark EVERY booking in the order paid (a payment can cover several).
    await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("payment_id", payment.id);

    // The order's contact is the same across bookings; use the first one.
    const primary = bookings[0];
    const reference = orderReference(payment);
    const transactionId = order.transaction?.[0]?.transaction?.id ?? null;

    // Fail-soft: the payment is already captured, so a receipt-email failure must
    // not throw — otherwise the webhook/return page 500s and, on retry, the
    // already-captured fast-path skips the email, losing the receipt permanently.
    try {
      await sendInvoiceEmails({
        travellerName: primary.traveller_name,
        email: primary.email,
        reference,
        amount: payment.amount,
        currency: payment.currency,
        transactionId,
        items: bookings.map((b) => ({
          title: b.tour_packages?.title ?? "Beyond Borders journey",
          amount: Number(b.quoted_amount ?? 0),
          currency: b.currency,
        })),
      });
    } catch (error) {
      console.error("[invoice email failed]", error);
    }

    // One order-level payment SMS — to the business (env number) and the customer
    // (their number), each fail-soft. Inside the guarded transition block.
    await sendPaymentSms({
      reference,
      amount: payment.amount,
      currency: payment.currency,
      customerName: primary.traveller_name,
      customerPhone: primary.phone,
    });
  }

  return { captured, alreadyFinalized: false };
}
