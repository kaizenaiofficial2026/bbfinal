import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTASection from "@/components/CTASection";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { destinationSlugs, destinations, getDestination } from "@/lib/travel";

type DestinationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return destinationSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestination(slug);

  if (!destination) {
    return {
      title: "Destination",
    };
  }

  return {
    title: destination.title,
    description: `${destination.title} travel with Beyond Borders: ${destination.tagline}. ${destination.keyAttraction}.`,
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = getDestination(slug);

  if (!destination) notFound();

  const related = destinations
    .filter((item) => item.slug !== destination.slug)
    .slice(0, 3);

  return (
    <SiteShell>
      <main>
        <PageHero
          title={destination.title}
          label="Destination"
          image={destination.heroImage}
          summary={destination.tagline}
        />
        <section className="section section-paper destination-detail-section">
          <div className="container destination-detail-layout">
            <article className="destination-detail-main" data-reveal>
              <span className="section-kicker">Travel notes</span>
              <h1 className="display display-lg">{destination.tagline}</h1>
              <p className="lead">{destination.summary}</p>

              <div className="destination-detail-image">
                <Image
                  src={destination.image}
                  alt={destination.title}
                  fill
                  sizes="(max-width: 980px) 100vw, 62vw"
                />
              </div>

              <div className="destination-copy-block">
                <h2>Key attraction</h2>
                <p>{destination.keyAttraction}</p>
              </div>

              <div className="destination-copy-block">
                <h2>Highlights</h2>
                <ul className="destination-highlight-list">
                  {destination.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </article>

            <aside className="destination-sidebar" data-reveal>
              <div className="destination-fact-card">
                <span>Best for</span>
                <strong>{destination.bestFor}</strong>
              </div>
              <div className="destination-fact-card">
                <span>Route style</span>
                <strong>Private, tailor-made travel</strong>
              </div>
              <div className="destination-fact-card">
                <span>Planning from</span>
                <strong>Colombo office</strong>
              </div>
              <Link className="btn btn-primary" href="/contacts">
                Plan this route
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <div className="related-destinations">
                <h2>Explore more</h2>
                {related.map((item) => (
                  <Link href={`/${item.slug}`} key={item.slug}>
                    {item.title}
                    <span>{item.tagline}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
        <CTASection
          title={`Build ${destination.title} into a private journey.`}
          text="Share your travel dates and preferred pace, and we will connect this destination with the right hotels, guides and transfers."
          action="Start planning"
        />
      </main>
    </SiteShell>
  );
}
