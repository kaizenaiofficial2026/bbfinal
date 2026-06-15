import Hero from "@/components/Hero";
import Destinations from "@/components/Destinations";
import Tours from "@/components/Tours";
import Experience from "@/components/Experience";
import HomeCTA from "@/components/HomeCTA";
import SiteShell from "@/components/SiteShell";
import { getPublishedDestinations } from "@/lib/data/destinations";
import { getPublishedPackages } from "@/lib/data/packages";

export default async function Home() {
  const [destinations, packages] = await Promise.all([
    getPublishedDestinations(),
    getPublishedPackages(),
  ]);

  return (
    <SiteShell>
      <main>
        <Hero />
        <Destinations destinations={destinations} />
        <Tours packages={packages} />
        <Experience />
        <HomeCTA />
      </main>
    </SiteShell>
  );
}
