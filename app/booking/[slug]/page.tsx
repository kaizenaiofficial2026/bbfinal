import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingRequestForm from "@/components/BookingRequestForm";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import {
  getPackageBySlug,
  getPackageSlugs,
  getPublishedPackages,
} from "@/lib/data/packages";

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPackageSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tourPackage = await getPackageBySlug(slug);

  if (!tourPackage) {
    return {
      title: "Booking",
    };
  }

  return {
    title: `Book ${tourPackage.title}`,
    description: `Prepare a Beyond Borders booking request for ${tourPackage.title}. Package total and payment instructions are confirmed after planner review.`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const tourPackage = await getPackageBySlug(slug);

  if (!tourPackage) notFound();

  const relatedPackages = (await getPublishedPackages())
    .filter((item) => item.slug !== tourPackage.slug)
    .slice(0, 3);

  return (
    <SiteShell>
      <main>
        <PageHero
          title="Booking"
          label="Journey checkout"
          image={tourPackage.image}
          summary={`Prepare a booking request for ${tourPackage.title}. The final package amount is confirmed by a Beyond Borders planner.`}
        />

        <section className="section section-paper booking-page">
          <div className="container booking-layout">
            <article className="booking-main" data-reveal>
              <div className="booking-package-panel">
                <div className="booking-package-image">
                  <Image
                    src={tourPackage.image}
                    alt={tourPackage.title}
                    fill
                    sizes="(max-width: 980px) 100vw, 44vw"
                  />
                  <span className="tour-badge">{tourPackage.tier}</span>
                </div>
                <div className="booking-package-copy">
                  <span className="section-kicker">Selected package</span>
                  <h1 className="display display-md">{tourPackage.title}</h1>
                  <p>{tourPackage.summary}</p>
                  <div className="tour-meta">
                    <span>{tourPackage.duration}</span>
                    <span>{tourPackage.hotels}</span>
                    <span>{tourPackage.destinations}</span>
                  </div>
                </div>
              </div>

              <div className="booking-info-grid">
                <section className="booking-info-card">
                  <span className="booking-form-label">Itinerary</span>
                  <div className="tour-itinerary">
                    {tourPackage.itinerary.map((item) => (
                      <div className="tour-itinerary-item" key={item.day}>
                        <span>{item.day}</span>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="booking-info-card">
                  <span className="booking-form-label">Included</span>
                  <div className="tour-inclusions">
                    {tourPackage.inclusions.map((inclusion) => (
                      <span key={inclusion}>{inclusion}</span>
                    ))}
                  </div>
                  <div className="booking-next-steps">
                    <h2>What happens next</h2>
                    <ol>
                      <li>Send this frontend booking request.</li>
                      <li>A planner confirms availability and package total.</li>
                      <li>Beyond Borders shares secure payment instructions.</li>
                    </ol>
                  </div>
                </section>
              </div>

              <BookingRequestForm
                packageId={tourPackage.id}
                packageTitle={tourPackage.title}
              />
            </article>

            <aside className="booking-sidebar" data-reveal>
              <div className="booking-summary-card">
                <span className="booking-form-label">Payment summary</span>
                <h2>Amount confirmed after planner review</h2>
                <div className="booking-total-row">
                  <span>Package total</span>
                  <strong>
                    {tourPackage.priceAmount != null
                      ? `${tourPackage.currency} ${Number(
                          tourPackage.priceAmount,
                        ).toLocaleString()}`
                      : "TBD"}
                  </strong>
                </div>
                <div className="booking-total-row">
                  <span>Payment status</span>
                  <strong>Not charged</strong>
                </div>
                <p>
                  This page prepares a booking request only. No real payment is
                  processed here.
                </p>
              </div>

              <div className="related-destinations">
                <h2>Other packages</h2>
                {relatedPackages.map((item) => (
                  <Link href={`/booking/${item.slug}`} key={item.slug}>
                    {item.title}
                    <span>{item.duration}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
