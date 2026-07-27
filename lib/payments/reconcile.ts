import "server-only";

import { dbError } from "@/lib/data/errors";
import { orderReference, type PaymentWithBookings } from "@/lib/data/payments";
import { sendInvoiceEmails } from "@/lib/email/send";
import { sendPaymentSms } from "@/lib/sms/send";
import { retrieveOrder } from "@/lib/payments/mpgs";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ReconcileResult = {
  captured: boolean;
  alreadyFinalized: boolean;
  refunded?: boolean;
};

function previousCheckoutAudit(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const audit = value as {
    consent?: unknown;
    sessionCreatedAt?: unknown;
  };
  const consent =
    audit.consent &&
    typeof audit.consent === "object" &&
    !Array.isArray(audit.consent)
      ? audit.consent
      : undefined;
  const sessionCreatedAt =
    typeof audit.sessionCreatedAt === "string"
      ? audit.sessionCreatedAt
      : undefined;
  return {
    ...(consent ? { consent } : {}),
    ...(sessionCreatedAt ? { sessionCreatedAt } : {}),
  };
}

/**
 * Confirm a payment against MPGS and apply the outcome exactly once.
 *
 * Idempotent and concurrency-safe so it can be called from the webhook, return
 * page, and scheduled recovery job without sending duplicate receipts.
 *
 * Bookings are marked paid before the guarded payment transition. That order is
 * deliberate: if the booking write fails, the payment remains retryable instead
 * of becoming permanently `captured` while its bookings still look unpaid. If
 * the later payment write fails, another reconciliation safely repeats the
 * idempotent booking update and completes the transition.
 */
export async function reconcilePayment(
  payment: PaymentWithBookings,
  options: { checkCaptured?: boolean } = {},
): Promise<ReconcileResult> {
  const bookings = payment.bookings ?? [];
  if (bookings.length === 0) {
    return { captured: false, alreadyFinalized: false };
  }

  const supabase = createSupabaseServiceClient();

  if (payment.status === "refunded") {
    return { captured: false, alreadyFinalized: true, refunded: true };
  }

  if (payment.status === "captured" && !options.checkCaptured) {
    // Repair rows captured by an older/partial implementation. Never let the
    // fast path preserve a captured payment whose bookings still look unpaid.
    if (bookings.some((booking) => booking.status !== "paid")) {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("payment_id", payment.id);
      if (error) dbError(error);
    }
    return { captured: true, alreadyFinalized: true };
  }

  const order = await retrieveOrder(payment.mpgs_order_id);

  // The gateway is trusted for the OUTCOME, but never for the amount. A hosted
  // checkout session id is handed to the browser, so unless session signing is
  // enforced on the merchant profile the holder can alter the session before
  // paying. Confirm the captured money matches what we asked for, or a 0.01
  // capture would mark the whole order paid and email a full-price invoice.
  // Retrieve Order exposes both the requested order amount and, where
  // supported, the amount actually captured. Prefer the latter so a partial or
  // altered capture can never satisfy reconciliation merely because
  // `order.amount` still echoes the original request.
  const capturedAmount = order.totalCapturedAmount ?? order.amount;
  const paidAmount = Number(capturedAmount);
  const amountMatches =
    Number.isFinite(paidAmount) &&
    paidAmount.toFixed(2) === Number(payment.amount).toFixed(2);
  const currencyMatches =
    String(order.currency ?? "").toUpperCase() ===
    String(payment.currency ?? "").toUpperCase();
  const orderIdMatches = String(order.id ?? "") === payment.mpgs_order_id;

  const gatewaySucceeded =
    order.result === "SUCCESS" && order.status === "CAPTURED";
  const captured =
    gatewaySucceeded && orderIdMatches && amountMatches && currencyMatches;
  const refundedAmount = Number(order.totalRefundedAmount);
  const refundAmountMatches =
    Number.isFinite(refundedAmount) &&
    refundedAmount.toFixed(2) === Number(payment.amount).toFixed(2);
  const fullyRefunded =
    order.result === "SUCCESS" &&
    ["REFUNDED", "EXCESSIVELY_REFUNDED"].includes(
      String(order.status ?? ""),
    ) &&
    orderIdMatches &&
    currencyMatches &&
    (String(order.status) === "EXCESSIVELY_REFUNDED"
      ? refundedAmount >= Number(payment.amount)
      : refundAmountMatches);

  if (gatewaySucceeded && !captured) {
    // Money moved, but not the amount we billed. Never mark this paid — leave it
    // for a human, and make the mismatch loud.
    console.error("[payment amount mismatch]", {
      reference: orderReference(payment),
      mpgsOrderId: payment.mpgs_order_id,
      expected: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      captured: `${order.currency} ${String(capturedAmount ?? "")}`,
      orderIdMatches,
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
  const checkoutAudit = previousCheckoutAudit(payment.gateway_result);
  const gatewayResult = {
    phase: "reconcile",
    order,
    ...checkoutAudit,
  };

  if (fullyRefunded) {
    const { data: transitioned, error } = await supabase
      .from("payments")
      .update({
        status: "refunded",
        mpgs_transaction_id:
          order.transaction?.[0]?.transaction?.id ?? null,
        gateway_result: gatewayResult,
      })
      .eq("id", payment.id)
      .in("status", ["captured", "pending"])
      .select("id")
      .maybeSingle();
    if (error) dbError(error);

    if (transitioned) {
      console.warn("[payment refunded]", {
        reference: orderReference(payment),
        paymentId: payment.id,
        amount: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      });
    }
    return {
      captured: false,
      alreadyFinalized: !transitioned,
      refunded: true,
    };
  }

  // A captured payment may receive later refund/chargeback notifications.
  // Preserve the latest gateway state without ever downgrading it to pending.
  // Full refunds transition above; partial/refund-requested states stay captured
  // because the current data model has no partial-refund amount/status.
  if (payment.status === "captured") {
    if (bookings.some((booking) => booking.status !== "paid")) {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("payment_id", payment.id);
      if (error) dbError(error);
    }

    const { error } = await supabase
      .from("payments")
      .update({
        mpgs_transaction_id:
          order.transaction?.[0]?.transaction?.id ?? null,
        gateway_result: gatewayResult,
      })
      .eq("id", payment.id)
      .eq("status", "captured");
    if (error) dbError(error);

    if (
      [
        "PARTIALLY_REFUNDED",
        "REFUND_REQUESTED",
        "DISPUTED",
        "CHARGEBACK_PROCESSED",
      ].includes(
        String(order.status ?? ""),
      )
    ) {
      console.warn("[payment requires refund review]", {
        reference: orderReference(payment),
        paymentId: payment.id,
        gatewayStatus: order.status,
        refundedAmount: order.totalRefundedAmount ?? null,
      });
    }
    return { captured: true, alreadyFinalized: true };
  }

  if (captured) {
    // This write is idempotent. Do it first so a failure leaves the payment
    // eligible for webhook/return/cron reconciliation instead of stranding a
    // captured payment with unpaid bookings.
    const { error } = await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("payment_id", payment.id);
    if (error) dbError(error);
  }

  const { data: transitioned, error: transitionError } = await supabase
    .from("payments")
    .update({
      status: nextStatus,
      mpgs_transaction_id: order.transaction?.[0]?.transaction?.id ?? null,
      gateway_result: gatewayResult,
    })
    .eq("id", payment.id)
    .neq("status", "captured")
    .select("id")
    .maybeSingle();
  if (transitionError) dbError(transitionError);

  const didTransition = Boolean(transitioned);

  if (captured && didTransition) {
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
      // The customer has been charged but has no receipt. Log the order details,
      // not just the error, so it can be found and the invoice re-sent by hand.
      console.error("[invoice email failed] CUSTOMER CHARGED, NO RECEIPT SENT", {
        reference,
        paymentId: payment.id,
        email: primary.email,
        amount: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
        error,
      });
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
