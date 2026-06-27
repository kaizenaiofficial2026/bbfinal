import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import CTASection from "@/components/CTASection";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { imageSrc } from "@/lib/images";
import {
  getDestinationBySlug,
  getDestinationSlugs,
  getPublishedDestinations,
} from "@/lib/data/destinations";
import { destinations as editorialDestinations } from "@/scripts/seed-data";

type DestinationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getDestinationSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);

  if (!destination) {
    return {
      title: "Destination",
    };
  }

  const editorial = editorialDestinations.find((item) => item.slug === slug);
  const pageTitle = editorial?.detailTitle ?? destination.title;
  const pageTagline = editorial?.detailTagline ?? destination.tagline;

  return {
    title: pageTitle,
    description: `${pageTitle} travel with Beyond Borders: ${pageTagline}. ${destination.keyAttraction}.`,
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);

  if (!destination) notFound();

  const t = await getTranslations("destinationDetail");

  // The publishable/editable core (title, images, status, highlights) comes from
  // the backend; the richer editorial detail content (quick facts, descriptions,
  // key-attraction bullets, related places) is sourced from the static content
  // module by slug so the detail UI renders exactly as designed.
  const editorial = editorialDestinations.find((item) => item.slug === slug);

  const pageTitle = editorial?.detailTitle ?? destination.title;
  const pageTagline = editorial?.detailTagline ?? destination.tagline;
  const description = editorial?.description ?? [destination.summary];
  const keyAttractionItems = editorial?.keyAttractionItems;
  const quickFacts = editorial?.quickFacts ?? [];
  const related =
    editorial?.relatedPlaces ??
    (await getPublishedDestinations())
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
          label={t("label")}
          image={destination.heroImage}
          summary={pageTagline}
          showBreadcrumbs={false}
          showLabel={false}
          backHref="/destinations"
          backLabel={t("backLabel")}
        />
        <section className="section section-paper destination-detail-section">
          <div className="container destination-detail-layout">
            <article className="destination-detail-main" data-reveal>
              <span className="section-kicker">{t("travelNotes")}</span>
              <h1 className="display display-lg">{pageTagline}</h1>
              {description.map((paragraph) => (
                <p className="lead" key={paragraph}>
                  {paragraph}
                </p>
              ))}

              <div className="destination-detail-image">
                <Image
                  src={imageSrc(destination.image)}
                  alt={pageTitle}
                  fill
                  sizes="(max-width: 980px) 100vw, 62vw"
                />
              </div>

              <div className="destination-copy-block">
                <h2>{t("keyAttraction")}</h2>
                {keyAttractionItems ? (
                  <ul className="destination-highlight-list">
                    {keyAttractionItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{destination.keyAttraction}</p>
                )}
              </div>

              <div className="destination-copy-block">
                <h2>{t("highlights")}</h2>
                <ul className="destination-highlight-list">
                  {destination.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </article>

            <aside className="destination-sidebar" data-reveal>
              <div className="destination-fact-card">
                <span>{t("quickFacts")}</span>
                <dl className="destination-quick-facts">
                  {quickFacts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Link className="btn btn-primary" href="/contacts">
                {t("planRoute")}
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
                <h2>{t("exploreMore")}</h2>
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
          title={t("ctaTitle", { title: pageTitle })}
          text={t("ctaText")}
          action={t("ctaAction")}
        />
      </main>
    </SiteShell>
  );
}
