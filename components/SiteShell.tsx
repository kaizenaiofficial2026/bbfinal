import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Preloader from "@/components/Preloader";
import SiteEffects from "@/components/SiteEffects";

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Header />
      {children}
      <Footer />
      <SiteEffects />
    </>
  );
}
