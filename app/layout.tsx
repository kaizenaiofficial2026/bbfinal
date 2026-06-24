import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Inter,
  Lora,
  Noto_Sans_Arabic,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_SC,
  Noto_Sans_Telugu,
} from "next/font/google";
import { getLocale } from "next-intl/server";
import CookieConsent from "@/components/CookieConsent";
import PageviewTracker from "@/components/PageviewTracker";
import { isRtl } from "@/i18n/routing";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-bodoni-moda",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-lora",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

// Script fonts for non-Latin locales. Applied per-locale via [lang] rules in
// globals.css. preload:false keeps them off pages that don't need them.
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-arabic",
  preload: false,
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-devanagari",
  preload: false,
});

const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-kannada",
  preload: false,
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-telugu",
  preload: false,
});

const notoSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sc",
  preload: false,
});

const fontVariables = [
  bodoniModa.variable,
  lora.variable,
  inter.variable,
  notoArabic.variable,
  notoDevanagari.variable,
  notoKannada.variable,
  notoTelugu.variable,
  notoSC.variable,
].join(" ");

export const metadata: Metadata = {
  title: {
    default: "Beyond Borders | The Travel Partner",
    template: "%s | Beyond Borders",
  },
  description:
    "Beyond Borders designs private Sri Lanka journeys across ancient cities, tea country, leopard country and golden shores — handcrafted in Colombo.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: "/assets/images/brand/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Beyond Borders",
    title: "Beyond Borders | The Travel Partner",
    description:
      "Private Sri Lanka journeys across ancient cities, tea country, leopard country and golden shores — handcrafted in Colombo.",
    images: ["/assets/images/brand/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beyond Borders | The Travel Partner",
    description:
      "Private Sri Lanka journeys, handcrafted in Colombo by Beyond Borders.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={fontVariables}
    >
      <body className="is-loading">
        {children}
        <CookieConsent />
        <PageviewTracker />
      </body>
    </html>
  );
}
