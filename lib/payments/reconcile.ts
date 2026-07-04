import "server-only";

import type { PaymentWithBooking } from "@/lib/data/payments";
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
  payment: PaymentWithBooking,
): Promise<ReconcileResult> {
  if (!payment.bookings) {
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
    await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("id", payment.booking_id);
    // Fail-soft: the payment is already captured, so a receipt-email failure must
    // not throw — otherwise the webhook/return page 500s and, on retry, the
    // already-captured fast-path skips the email, losing the receipt permanently.
    try {
      await sendInvoiceEmails({
        travellerName: payment.bookings.traveller_name,
        email: payment.bookings.email,
        reference: payment.bookings.reference,
        packageTitle: payment.bookings.tour_packages?.title ?? "Beyond Borders journey",
        amount: payment.amount,
        currency: payment.currency,
        transactionId: order.transaction?.[0]?.transaction?.id ?? null,
      });
    } catch (error) {
      console.error("[invoice email failed]", error);
    }

    // Payment SMS — to the business (env number) and the customer (their number),
    // each fail-soft. Inside the guarded transition block, so it fires once.
    await sendPaymentSms({
      reference: payment.bookings.reference,
      amount: payment.amount,
      currency: payment.currency,
      customerName: payment.bookings.traveller_name,
      customerPhone: payment.bookings.phone,
    });
  }

  return { captured, alreadyFinalized: false };
}
