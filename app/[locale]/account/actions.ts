"use server";

import { redirect } from "next/navigation";
import { sendRegistrationEmails } from "@/lib/email/send";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canUseSupabaseService,
  createSupabaseServiceClient,
} from "@/lib/supabase/service";
import { registerSchema } from "@/lib/validation/account";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

/** Only allow internal redirect targets (no protocol-relative or absolute URLs). */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function withNext(path: string, next: string) {
  return next ? `${path}&next=${encodeURIComponent(next)}` : path;
}

export async function registerAction(formData: FormData) {
  const next = safeNext(formString(formData, "next"));
  const parsed = registerSchema.safeParse({
    fullName: formString(formData, "fullName"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    phone: formString(formData, "phone"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check the form.";
    redirect(withNext(`/register?error=${encodeURIComponent(message)}`, next));
  }

  const { fullName, email, password, phone } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: signUp, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error || !signUp.user) {
    const message = error?.message ?? "Could not create your account.";
    redirect(withNext(`/register?error=${encodeURIComponent(message)}`, next));
  }

  // Create the customers row (verified=false). Uses the service client, mirroring
  // the admin profile bootstrap, so it works regardless of session timing.
  if (canUseSupabaseService()) {
    const service = createSupabaseServiceClient();
    const { error: insertError } = await service.from("customers").upsert(
      { id: signUp.user.id, full_name: fullName, email, phone: phone || null },
      { onConflict: "id" },
    );

    if (insertError) {
      redirect(
        withNext(`/register?error=${encodeURIComponent(insertError.message)}`, next),
      );
    }
  }

  await sendRegistrationEmails({ fullName, email, phone: phone || null });

  redirect(next || "/account");
}

export async function loginAction(formData: FormData) {
  const next = safeNext(formString(formData, "next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (error) {
    redirect(withNext(`/login?error=${encodeURIComponent(error.message)}`, next));
  }

  redirect(next || "/account");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
