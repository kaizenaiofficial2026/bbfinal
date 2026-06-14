import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import Tours from "@/components/Tours";
import Experience from "@/components/Experience";
import HomeCTA from "@/components/HomeCTA";
import SiteShell from "@/components/SiteShell";

export default function Home() {
  return (
    <SiteShell>
      <main>
        <Hero />
        <Destinations />
        <Tours />
        <Experience />
        <HomeCTA />
      </main>
    </SiteShell>
  );
}
