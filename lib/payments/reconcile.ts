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

  // The gateway is trusted for the OUTCOME, but never for the amount. A hosted
  // checkout session id is handed to the browser, so unless session signing is
  // enforced on the merchant profile the holder can alter the session before
  // paying. Confirm the captured money matches what we asked for, or a 0.01
  // capture would mark the whole order paid and email a full-price invoice.
  const paidAmount = Number(order.amount);
  const amountMatches =
    Number.isFinite(paidAmount) &&
    paidAmount.toFixed(2) === Number(payment.amount).toFixed(2);
  const currencyMatches =
    String(order.currency ?? "").toUpperCase() ===
    String(payment.currency ?? "").toUpperCase();

  const gatewaySucceeded =
    order.result === "SUCCESS" && order.status === "CAPTURED";
  const captured = gatewaySucceeded && amountMatches && currencyMatches;

  if (gatewaySucceeded && !captured) {
    // Money moved, but not the amount we billed. Never mark this paid — leave it
    // for a human, and make the mismatch loud.
    console.error("[payment amount mismatch]", {
      reference: orderReference(payment),
      mpgsOrderId: payment.mpgs_order_id,
      expected: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      captured: `${order.currency} ${order.amount}`,
    });
  }
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
    // Billing details for the invoice's address block. Best-effort: a missing
    // customer row (legacy/guest booking) just omits those lines.
    let billing: { country: string | null; passport_number: string | null } | null =
      null;
    if (primary.user_id) {
      const { data } = await supabase
        .from("customers")
        .select("country, passport_number")
        .eq("id", primary.user_id)
        .maybeSingle();
      billing = data ?? null;
    }

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
          // Travellers doubles as the quantity — quoted_amount is already the
          // line total (per-traveller price × travellers).
          quantity: b.travellers,
          amount: Number(b.quoted_amount ?? 0),
          currency: b.currency,
        })),
        customer: {
          email: primary.email,
          phone: primary.phone,
          country: billing?.country ?? null,
          passportNumber: billing?.passport_number ?? null,
        },
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
