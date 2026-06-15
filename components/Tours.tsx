import Image from "next/image";
import Link from "next/link";
import { tourPackages } from "@/lib/travel";

const packageOrder = [
  "glamour-of-sri-lanka",
  "sunbath-on-sands-standard",
  "a-classic-of-the-city",
];

const imageFocus: Record<string, string> = {
  "glamour-of-sri-lanka": "center center",
  "sunbath-on-sands-standard": "center center",
  "a-classic-of-the-city": "center center",
};

const packages = packageOrder
  .map((slug) => tourPackages.find((tour) => tour.slug === slug))
  .filter((tour): tour is (typeof tourPackages)[number] => Boolean(tour));

export default function Tours() {
  return (
    <section className="luxury-packages-section" id="tours">
      <div className="container">
        <div className="luxury-packages-header">
          <h2 className="display display-lg">Our Tour Packages</h2>
        </div>

        <div className="luxury-package-grid" data-reveal-group="package-cards">
          {packages.map((tour) => (
            <article className="luxury-package-card" key={tour.slug}>
              <Link
                className="luxury-package-link"
                href={`/tours#${tour.slug}`}
                aria-label={`View ${tour.title} package`}
              >
                <Image
                  className="luxury-package-image"
                  src={tour.image}
                  alt={tour.title}
                  fill
                  sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 50vw"
                  style={{ objectPosition: imageFocus[tour.slug] }}
                />
                <div className="luxury-card-overlay" />
                <div className="luxury-card-content">
                  <h3>{tour.title}</h3>
                  <p>{tour.summary}</p>
                  <span className="luxury-explore-btn">Explore</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <div className="luxury-swipe-cue" aria-hidden="true">
          <span>Swipe</span>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </div>

        <div className="luxury-packages-more">
          <Link className="luxury-more-btn" href="/tours">
            Click to view more
          </Link>
        </div>
      </div>
    </section>
  );
}
