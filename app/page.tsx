import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import Tours from "@/components/Tours";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import SiteShell from "@/components/SiteShell";

export default function Home() {
  return (
    <SiteShell>
      <main>
        <Hero />
        <Destinations />
        <Tours />
        <Experience />
        <Contact />
      </main>
    </SiteShell>
  );
}
