import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ToastProvider } from "@/components/Toast";
import { CartProvider } from "@/components/cart/CartProvider";
import { getCustomerUser } from "@/lib/customer/auth";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for localized pages.
  setRequestLocale(locale);

  // The cart is a signed-in-only feature; resolve the session once (request-cached,
  // so this doesn't add a round-trip over what SiteShell already does). The user id
  // scopes the cart per-user so it can't leak across users on a shared browser, and
  // its presence gates the cart UI. Fail-soft: a transient auth error renders
  // signed-out (no cart). null id → guest.
  let userId: string | null = null;
  try {
    userId = (await getCustomerUser())?.user.id ?? null;
  } catch {
    userId = null;
  }

  return (
    <NextIntlClientProvider>
      <CartProvider userId={userId}>
        <ToastProvider>{children}</ToastProvider>
      </CartProvider>
    </NextIntlClientProvider>
  );
}
