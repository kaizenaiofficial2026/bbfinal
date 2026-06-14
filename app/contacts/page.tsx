import type { Metadata } from "next";
import Contact from "@/components/Contact";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Contact Beyond Borders",
  description:
    "Contact Beyond Borders in Colombo for private Sri Lanka tour planning.",
};

export default function ContactsPage() {
  return (
    <SiteShell>
      <main>
        <PageHero
          title="Contact Us"
          label="Get in touch"
          image="/assets/images/heroes/contact-header.jpg"
          summary="Share your dates, preferred pace and must-see places. A Beyond Borders planner will shape the first route."
        />
        <Contact />
      </main>
    </SiteShell>
  );
}
