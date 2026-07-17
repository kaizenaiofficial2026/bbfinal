"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { localeRedirect } from "@/lib/i18n/redirect";
import { createOrder } from "@/lib/data/orders";
import { createEnquiry } from "@/lib/data/enquiries";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { requireVerifiedCustomer } from "@/lib/customer/auth";
import { canUseSupabaseService } from "@/lib/supabase/service";
import { sendEnquiryEmails } from "@/lib/email/send";
import { getRequestIpHash } from "@/lib/security/request";
import { trippedHoneypot } from "@/lib/security/honeypot";
import { passedTimeTrap } from "@/lib/security/time-trap";
import { toRetryMinutes } from "@/lib/security/retry-after";
import { bookingSchema } from "@/lib/validation/booking";
import { enquirySchema } from "@/lib/validation/enquiry";
import { checkEmailDeliverable } from "@/lib/validation/email-deliverability";
import type { BookingState, EnquiryState } from "@/app/action-state";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function submitEnquiry(
  _prevState: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const t = await getTranslations("serverActions");

  // Echo what the visitor typed so a failed submit never wipes the form.
  const values = {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    country: formString(formData, "country"),
    package: formString(formData, "package"),
    message: formString(formData, "message"),
  };

  // Spam trap — checked against the raw form, never as part of the schema, so it
  // can't surface an internal validation message to a real visitor.
  if (trippedHoneypot(formData)) {
    return { ok: false, note: t("checkForm"), values };
  }

  const parsed = enquirySchema.safeParse({
    name: values.name,
    email: values.email,
    phone: values.phone,
    country: values.country,
    packageLabel: values.package,
    message: values.message,
    source: "contact-form",
    startedAt: formString(formData, "startedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? t("checkForm"),
      values,
    };
  }

  if (!passedTimeTrap(parsed.data.startedAt)) {
    return {
      ok: false,
      note: t("waitMoment"),
      values,
    };
  }

  // Make sure the address can actually receive mail (catches typos + fakes).
  const email = parsed.data.email.trim().toLowerCase();
  const deliverable = await checkEmailDeliverable(email);
  if (!deliverable.ok) {
    return { ok: false, note: deliverable.reason, values };
  }

  if (!canUseSupabaseService()) {
    return {
      ok: false,
      note: t("enquiryNotConfigured"),
      values,
    };
  }

  try {
    const ipHash = await getRequestIpHash();
    const rate = await checkAndRecordRateLimit("enquiry", ipHash, {
      max: 5,
      windowMinutes: 60,
    });

    if (!rate.allowed) {
      return {
        ok: false,
        note: t("rateLimited", {
          minutes: toRetryMinutes(rate.retryAfterSeconds),
        }),
        values,
      };
    }

    await createEnquiry({
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      package_label: parsed.data.packageLabel || null,
      message: parsed.data.message,
      source: parsed.data.source,
      ip_hash: ipHash,
    });

    await sendEnquiryEmails({
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      country: parsed.data.country || null,
      packageLabel: parsed.data.packageLabel || null,
      message: parsed.data.message,
    });

    return {
      ok: true,
      note: t("enquirySuccess", { name: parsed.data.name }),
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      note: t("enquiryError"),
      values,
    };
  }
}

export async function submitBooking(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  // Only signed-in, admin-verified customers can book (defense in depth — the
  // form is only rendered for them). Redirects otherwise.
  const session = await requireVerifiedCustomer();

  const t = await getTranslations("serverActions");

  // Echo the journey details back so a failed submit doesn't wipe them.
  const values = {
    dates: formString(formData, "dates"),
    travellers: formString(formData, "travellers"),
    notes: formString(formData, "notes"),
  };

  // Spam trap — checked against the raw form, never as part of the schema, so it
  // can't surface an internal validation message to a real visitor.
  if (trippedHoneypot(formData)) {
    return { ok: false, note: t("checkBookingForm"), values };
  }

  const parsed = bookingSchema.safeParse({
    tourPackageId: formString(formData, "tourPackageId"),
    travelDates: values.dates,
    travellers: values.travellers,
    notes: values.notes,
    startedAt: formString(formData, "startedAt"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      note: parsed.error.issues[0]?.message ?? t("checkBookingForm"),
      values,
    };
  }

  if (!passedTimeTrap(parsed.data.startedAt)) {
    return {
      ok: false,
      note: t("waitMoment"),
      values,
    };
  }

  if (!canUseSupabaseService()) {
    return {
      ok: false,
      note: t("bookingsNotConfigured"),
      values,
    };
  }

  // Throttle bookings per IP — defense in depth on top of the verified-customer
  // gate, so a single approved account can't spawn unlimited booking rows.
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit("booking", ipHash, {
    max: 10,
    windowMinutes: 60,
  });
  if (!rate.allowed) {
    return {
      ok: false,
      note: t("rateLimited", { minutes: toRetryMinutes(rate.retryAfterSeconds) }),
      values,
    };
  }

  // Create a one-item order (a payment covering a single booking). The price and
  // currency are re-derived server-side inside createOrder — never trusted from
  // the client. Cart checkout uses the exact same path with multiple items.
  const order = await createOrder({
    customer: {
      userId: session.user.id,
      fullName: session.customer.full_name,
      email: session.customer.email,
      phone: session.customer.phone,
    },
    items: [
      {
        tourPackageId: parsed.data.tourPackageId,
        travelDates: parsed.data.travelDates,
        travellers: parsed.data.travellers,
        notes: parsed.data.notes || null,
      },
    ],
    ipHash,
  });

  if (!order.ok) {
    return {
      ok: false,
      note:
        order.reason === "not-available"
          ? t("journeyNotAvailable")
          : t("bookingError"),
      values,
    };
  }

  // Send the verified customer straight into the hosted MPGS checkout.
  localeRedirect(`/pay/${order.token}`, await getLocale());
}
