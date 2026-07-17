"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireVerifiedCustomer } from "@/lib/customer/auth";
import { createOrder } from "@/lib/data/orders";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { canUseSupabaseService } from "@/lib/supabase/service";
import { getRequestIpHash } from "@/lib/security/request";
import { trippedHoneypot } from "@/lib/security/honeypot";
import { passedTimeTrap } from "@/lib/security/time-trap";
import { toRetryMinutes } from "@/lib/security/retry-after";

export type CheckoutState = {
  ok: boolean;
  note?: string;
  token?: string;
};

const cartItemSchema = z.object({
  packageId: z.string().min(1),
  travelDates: z.string().min(3).max(120),
  travellers: z.coerce.number().int().min(1).max(50),
  notes: z.string().max(2000).optional().nullable(),
});

export async function checkoutCartAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Gate: only signed-in, admin-verified customers can pay. Redirects otherwise.
  const session = await requireVerifiedCustomer("/cart");
  const t = await getTranslations("cart");

  // Honeypot + time-trap (same anti-spam as the booking form).
  if (trippedHoneypot(formData)) {
    return { ok: false, note: t("checkoutError") };
  }
  if (!passedTimeTrap(Number(formData.get("startedAt") ?? 0))) {
    return { ok: false, note: t("waitMoment") };
  }

  if (!canUseSupabaseService()) {
    return { ok: false, note: t("checkoutError") };
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, note: t("checkoutError") };
  }
  const parsed = z.array(cartItemSchema).min(1).max(20).safeParse(rawItems);
  if (!parsed.success) {
    return { ok: false, note: t("empty") };
  }

  // Throttle checkout per IP (reuse the booking limiter).
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit("booking", ipHash, {
    max: 10,
    windowMinutes: 60,
  });
  if (!rate.allowed) {
    return {
      ok: false,
      note: t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
    };
  }

  const order = await createOrder({
    customer: {
      userId: session.user.id,
      fullName: session.customer.full_name,
      email: session.customer.email,
      phone: session.customer.phone,
    },
    items: parsed.data.map((item) => ({
      tourPackageId: item.packageId,
      travelDates: item.travelDates,
      travellers: item.travellers,
      notes: item.notes ?? null,
    })),
    ipHash,
  });

  if (!order.ok) {
    return {
      ok: false,
      note:
        order.reason === "not-available"
          ? t("notAvailable")
          : order.reason === "mixed-currency"
            ? t("mixedCurrency")
            : t("checkoutError"),
    };
  }

  // Return the pay token so the client can clear the cart and navigate.
  return { ok: true, token: order.token };
}
