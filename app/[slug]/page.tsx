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

  const pageTitle = destination.detailTitle ?? destination.title;
  const pageTagline = destination.detailTagline ?? destination.tagline;

  return {
    title: pageTitle,
    description: `${pageTitle} travel with Beyond Borders: ${pageTagline}. ${destination.keyAttraction}.`,
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = getDestination(slug);

  if (!destination) notFound();

  const pageTitle = destination.detailTitle ?? destination.title;
  const pageTagline = destination.detailTagline ?? destination.tagline;
  const description = destination.description ?? [destination.summary];
  const related =
    destination.relatedPlaces ??
    destinations
      .filter((item) => item.slug !== destination.slug)
      .slice(0, 3)
      .map((item) => ({
        title: item.title,
        tagline: item.tagline,
        href: `/${item.slug}`,
      }));

  return (
    <SiteShell>
      <main>
        <PageHero
          title={pageTitle}
          label="Destination"
          image={destination.heroImage}
          summary={pageTagline}
          showBreadcrumbs={false}
          showLabel={false}
          backHref="/destinations"
          backLabel="← Back to Destinations"
        />
        <section className="section section-paper destination-detail-section">
          <div className="container destination-detail-layout">
            <article className="destination-detail-main" data-reveal>
              <span className="section-kicker">Travel notes</span>
              <h1 className="display display-lg">{pageTagline}</h1>
              {description.map((paragraph) => (
                <p className="lead" key={paragraph}>
                  {paragraph}
                </p>
              ))}

              <div className="destination-detail-image">
                <Image
                  src={destination.image}
                  alt={pageTitle}
                  fill
                  sizes="(max-width: 980px) 100vw, 62vw"
                />
              </div>

              <div className="destination-copy-block">
                <h2>Key attraction</h2>
                {destination.keyAttractionItems ? (
                  <ul className="destination-highlight-list">
                    {destination.keyAttractionItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{destination.keyAttraction}</p>
                )}
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
                <span>Quick Facts</span>
                <dl className="destination-quick-facts">
                  {destination.quickFacts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
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
                  <Link href={item.href} key={item.title}>
                    {item.title}
                    {item.tagline ? <span>{item.tagline}</span> : null}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
        <CTASection
          title={`Build ${pageTitle} into a private journey.`}
          text="Share your travel dates and preferred pace, and we will connect this destination with the right hotels, guides and transfers."
          action="Start planning"
        />
      </main>
    </SiteShell>
  );
}
