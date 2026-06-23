import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Preloader from "@/components/Preloader";
import SiteEffects from "@/components/SiteEffects";
import { getCustomerUser } from "@/lib/customer/auth";

type SiteShellProps = {
  children: ReactNode;
};

export default async function SiteShell({ children }: SiteShellProps) {
  // Resolve the customer session here (server) so the client Header can show the
  // signed-in state. Fail-soft: a transient auth error just renders signed-out.
  let account: { name: string } | null = null;
  try {
    const session = await getCustomerUser();
    if (session) account = { name: session.customer.full_name };
  } catch {
    account = null;
  }

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Header account={account} />
      {children}
      <Footer />
      <SiteEffects />
    </>
  );
}
