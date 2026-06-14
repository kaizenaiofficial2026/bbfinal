import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-montserrat",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`is-loading ${lato.variable} ${montserrat.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
