import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import BookingRequestForm from "@/components/BookingRequestForm";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { imageSrc } from "@/lib/images";
import {
  getPackageBySlug,
  getPackageSlugs,
  getPublishedPackages,
} from "@/lib/data/packages";
import { getCustomerUser } from "@/lib/customer/auth";
import { tourPackages as editorialPackages } from "@/scripts/seed-data";

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

  const t = await getTranslations("bookingPage");
  const session = await getCustomerUser();
  const nextPath = `/booking/${tourPackage.slug}`;

  let bookingSection: React.ReactNode;
  if (!session) {
    bookingSection = (
      <div className="booking-form-section">
        <span className="booking-form-label">{t("reserveJourney")}</span>
        <p className="form-note">{t("signInPrompt")}</p>
        <div className="booking-submit-row">
          <Link className="btn btn-primary" href={`/register?next=${encodeURIComponent(nextPath)}`}>
            {t("registerToReserve")}
          </Link>
          <Link className="btn btn-secondary" href={`/login?next=${encodeURIComponent(nextPath)}`}>
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  } else if (!session.customer.verified) {
    bookingSection = (
      <div className="booking-form-section">
        <span className="booking-form-label">{t("reserveJourney")}</span>
        <p className="form-note">{t("awaitingVerification")}</p>
        <Link className="btn btn-secondary" href="/account">{t("viewAccount")}</Link>
      </div>
    );
  } else if (tourPackage.priceAmount == null) {
    bookingSection = (
      <div className="booking-form-section">
        <span className="booking-form-label">{t("reserveJourney")}</span>
        <p className="form-note">
          {t("noInstantCheckoutPre")}{" "}
          <Link href="/contacts">{t("contactTeamLink")}</Link>.
        </p>
      </div>
    );
  } else {
    bookingSection = (
      <BookingRequestForm
        packageId={tourPackage.id}
        packageTitle={tourPackage.title}
        amount={tourPackage.priceAmount}
        currency={tourPackage.currency ?? "USD"}
      />
    );
  }

  const relatedPackages = (await getPublishedPackages())
    .filter((item) => item.slug !== tourPackage.slug)
    .slice(0, 3);

  // The bulleted day-by-day itinerary is rich editorial content sourced from the
  // static content module by slug; admin-managed packages fall back to wrapping
  // the backend's single itinerary description per day.
  const editorialPackage = editorialPackages.find((item) => item.slug === slug);
  const itinerary =
    editorialPackage?.itinerary ??
    tourPackage.itinerary.map((item) => ({
      day: item.day,
      title: item.title,
      items: [item.description],
    }));

  return (
    <SiteShell>
      <main>
        <PageHero
          title={tourPackage.title}
          label={t("heroLabel")}
          image={tourPackage.heroImage}
          summary={t("heroSummary", { title: tourPackage.title })}
          showBreadcrumbs={false}
          showLabel={false}
          backHref="/tours"
          backLabel={t("backToTours")}
        />

        <section className="section section-paper booking-page">
          <div className="container booking-layout">
            <article className="booking-main" data-reveal>
              <div className="booking-package-panel">
                <Image
                  src={imageSrc(tourPackage.image)}
                  alt={tourPackage.title}
                  fill
                  sizes="(max-width: 980px) 100vw, 58vw"
                  className="booking-package-bg"
                />
                <div className="booking-package-overlay" aria-hidden="true" />
                <div className="booking-package-copy">
                  <span className="tour-badge">{tourPackage.tier}</span>
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
                  <span className="booking-form-label">{t("itinerary")}</span>
                  <div className="tour-itinerary">
                    {itinerary.map((item) => (
                      <div className="tour-itinerary-item" key={item.day}>
                        <span>{item.day}</span>
                        <div>
                          <h3>{item.title}</h3>
                          <ul>
                            {item.items.map((itineraryItem) => (
                              <li key={itineraryItem}>{itineraryItem}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="booking-info-card">
                  <span className="booking-form-label">{t("included")}</span>
                  <div className="tour-inclusions">
                    {tourPackage.inclusions.map((inclusion) => (
                      <span key={inclusion}>{inclusion}</span>
                    ))}
                  </div>
                  <div className="booking-next-steps">
                    <h2>{t("whatNext")}</h2>
                    <ol>
                      <li>{t("step1")}</li>
                      <li>{t("step2")}</li>
                      <li>{t("step3")}</li>
                    </ol>
                  </div>
                </section>
              </div>

              {bookingSection}
            </article>

            <aside className="booking-sidebar" data-reveal>
              <div className="booking-summary-card">
                <span className="booking-form-label">{t("paymentSummary")}</span>
                <h2>{t("amountConfirmed")}</h2>
                <div className="booking-total-row">
                  <span>{t("packageTotal")}</span>
                  <strong>
                    {tourPackage.priceAmount != null
                      ? `${tourPackage.currency} ${Number(
                          tourPackage.priceAmount,
                        ).toLocaleString()}`
                      : "TBD"}
                  </strong>
                </div>
                <div className="booking-total-row">
                  <span>{t("paymentStatus")}</span>
                  <strong>{t("notCharged")}</strong>
                </div>
                <p>{t("prepareNote")}</p>
              </div>

              <div className="related-destinations">
                <h2>{t("otherPackages")}</h2>
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
