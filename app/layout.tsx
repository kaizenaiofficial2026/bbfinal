import type { Metadata } from "next";
import "./globals.css";

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
      <body className="is-loading">{children}</body>
    </html>
  );
}
