import type { Metadata } from "next";
import { Bodoni_Moda, Inter, Lora } from "next/font/google";
import { getLocale } from "next-intl/server";
import CookieConsent from "@/components/CookieConsent";
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

export const metadata: Metadata = {
  title: {
    default: "Beyond Borders | The Travel Partner",
    template: "%s | Beyond Borders",
  },
  description:
    "Beyond Borders designs private Sri Lanka journeys across ancient cities, tea country, leopard country and golden shores — handcrafted in Colombo.",
  icons: {
    icon: "/assets/images/brand/favicon.png",
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
      className={`${bodoniModa.variable} ${lora.variable} ${inter.variable}`}
    >
      <body className="is-loading">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
