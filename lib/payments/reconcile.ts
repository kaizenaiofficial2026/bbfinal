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
  const supabase = createSupabaseServiceClient();

  const { data: transitioned } = await supabase
    .from("payments")
    .update({
      status: captured ? "captured" : "failed",
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
    await sendInvoiceEmails({
      travellerName: payment.bookings.traveller_name,
      email: payment.bookings.email,
      reference: payment.bookings.reference,
      packageTitle: payment.bookings.tour_packages?.title ?? "Beyond Borders journey",
      amount: payment.amount,
      currency: payment.currency,
      transactionId: order.transaction?.[0]?.transaction?.id ?? null,
    });

    // Business-facing SMS notification (fail-soft — sendPaymentSms never throws).
    // Inside the guarded transition block, so it fires exactly once.
    await sendPaymentSms({
      reference: payment.bookings.reference,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  return { captured, alreadyFinalized: false };
}
