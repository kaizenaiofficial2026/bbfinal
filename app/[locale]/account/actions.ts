"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { localeRedirect } from "@/lib/i18n/redirect";
import { sendRegistrationEmails } from "@/lib/email/send";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import { registerSchema } from "@/lib/validation/account";
import { checkEmailDeliverable } from "@/lib/validation/email-deliverability";
import { checkAndRecordRateLimit } from "@/lib/data/rate-limit";
import { getRequestIpHash } from "@/lib/security/request";
import { toRetryMinutes } from "@/lib/security/retry-after";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

/** Only allow internal redirect targets (no protocol-relative or absolute URLs). */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "";
}

function withNext(path: string, next: string) {
  return next ? `${path}&next=${encodeURIComponent(next)}` : path;
}

export async function registerAction(formData: FormData) {
  const t = await getTranslations("serverActions");
  const locale = await getLocale();
  const next = safeNext(formString(formData, "next"));
  const parsed = registerSchema.safeParse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    country: formString(formData, "country"),
    city: formString(formData, "city"),
    dateOfBirth: formString(formData, "dateOfBirth"),
    passportNumber: formString(formData, "passportNumber"),
    passportExpiry: formString(formData, "passportExpiry"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    password: formString(formData, "password"),
    company: formString(formData, "company"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? t("checkForm");
    localeRedirect(withNext(`/register?error=${encodeURIComponent(message)}`, next), locale);
  }

  // Throttle account creation per IP — caps automated signup and email-bombing
  // (each register sends mail to an attacker-supplied address + the team inbox).
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit("register", ipHash, {
    max: 5,
    windowMinutes: 60,
  });
  if (!rate.allowed) {
    const message = t("rateLimited", {
      minutes: toRetryMinutes(rate.retryAfterSeconds),
    });
    localeRedirect(withNext(`/register?error=${encodeURIComponent(message)}`, next), locale);
  }

  // Reject addresses that can't actually receive mail before we burn a signup
  // attempt (and before emailing a bogus address).
  const email = parsed.data.email.trim().toLowerCase();
  const deliverable = await checkEmailDeliverable(email);
  if (!deliverable.ok) {
    localeRedirect(
      withNext(`/register?error=${encodeURIComponent(deliverable.reason)}`, next),
      locale,
    );
  }

  const {
    firstName,
    lastName,
    country,
    city,
    dateOfBirth,
    passportNumber,
    passportExpiry,
    password,
    phone,
  } = parsed.data;
  const fullName = `${firstName} ${lastName}`.trim();

  const supabase = await createSupabaseServerClient();
  const { data: signUp, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error || !signUp.user) {
    const message = error?.message ?? t("couldNotCreateAccount");
    localeRedirect(withNext(`/register?error=${encodeURIComponent(message)}`, next), locale);
  }

  // Create the customers row (verified=false). Uses the service client, mirroring
  // the admin profile bootstrap, so it works regardless of session timing.
  if (canUseSupabaseService()) {
    const service = createSupabaseServiceClient();
    const { error: insertError } = await service.from("customers").upsert(
      {
        id: signUp.user.id,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        country,
        city,
        date_of_birth: dateOfBirth,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
      },
      { onConflict: "id" },
    );

    if (insertError) {
      console.error("[register] customer upsert failed", insertError);
      localeRedirect(
        withNext(
          `/register?error=${encodeURIComponent(t("couldNotCreateAccount"))}`,
          next,
        ),
        locale,
      );
    }
  }

  await sendRegistrationEmails({ fullName, email, phone: phone || null });

  localeRedirect(next || "/account", locale);
}

export async function loginAction(formData: FormData) {
  const locale = await getLocale();
  const next = safeNext(formString(formData, "next"));

  // Throttle sign-in attempts per IP — slows credential stuffing / brute force.
  const ipHash = await getRequestIpHash();
  const rate = await checkAndRecordRateLimit("login", ipHash, {
    max: 10,
    windowMinutes: 15,
  });
  if (!rate.allowed) {
    const t = await getTranslations("serverActions");
    const message = t("rateLimited", {
      minutes: toRetryMinutes(rate.retryAfterSeconds),
    });
    localeRedirect(withNext(`/login?error=${encodeURIComponent(message)}`, next), locale);
  }

  const supabase = await createSupabaseServerClient();
  const { data: signIn, error } = await supabase.auth.signInWithPassword({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (error) {
    localeRedirect(withNext(`/login?error=${encodeURIComponent(error.message)}`, next), locale);
  }

  // Deactivated by staff? Sign back out and explain instead of letting them in.
  if (signIn.user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("active")
      .eq("id", signIn.user.id)
      .maybeSingle();
    if (customer && customer.active === false) {
      await supabase.auth.signOut();
      const t = await getTranslations("serverActions");
      localeRedirect(
        withNext(`/login?error=${encodeURIComponent(t("accountDeactivated"))}`, next),
        locale,
      );
    }
  }

  localeRedirect(next || "/account", locale);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  localeRedirect("/", await getLocale());
}
