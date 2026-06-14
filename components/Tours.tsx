import Image from "next/image";
import Link from "next/link";
import type { TourPackage } from "@/lib/data/types";

type ToursProps = {
  packages: TourPackage[];
};

export default function Tours({ packages }: ToursProps) {
  const feature =
    packages.find((tourPackage) => tourPackage.tier.toLowerCase().includes("luxury")) ??
    packages[0];
  const cards = packages
    .filter((tourPackage) => tourPackage.slug !== feature?.slug)
    .slice(0, 3);

  return (
    <section className="section section-paper" id="tours">
      <div className="container">
        <div className="tours-head" data-reveal>
          <div>
            <span className="section-kicker">Signature tours</span>
            <h2 className="display display-lg">Journeys with space for wonder.</h2>
          </div>
          <p className="lead">
            Each tour includes airport transfers, daily breakfast and a
            dedicated Beyond Borders assistant, then adapts to how you prefer to
            travel.
          </p>
        </div>

        <div className="tour-layout">
          {feature ? (
            <Link className="tour-feature" data-reveal href={`/booking/${feature.slug}`}>
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                sizes="(max-width: 720px) 100vw, (max-width: 1180px) 100vw, 58vw"
              />
              <div className="tour-feature-body">
                <span className="tour-badge">{feature.tier}</span>
                <h3>{feature.title}</h3>
                <p>{feature.summary}</p>
                <div className="tour-meta">
                  <span>{feature.duration}</span>
                  <span>{feature.hotels}</span>
                  <span>{feature.destinations}</span>
                </div>
              </div>
            </Link>
          ) : null}

          <div>
            <div className="tour-list" data-reveal-group>
              {cards.map((tourPackage) => (
                <Link
                  className="tour-card"
                  href={`/booking/${tourPackage.slug}`}
                  key={tourPackage.slug}
                >
                  <div className="tour-card-image">
                    <Image
                      src={tourPackage.image}
                      alt={tourPackage.title}
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 168px"
                    />
                  </div>
                  <div className="tour-card-body">
                    <span className="tour-badge">{tourPackage.tier}</span>
                    <h3>{tourPackage.title}</h3>
                    <p>{tourPackage.summary}</p>
                    <div className="tour-meta">
                      <span>{tourPackage.duration}</span>
                      <span>{tourPackage.hotels}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="inclusion-strip" data-reveal-group>
              <span>Airport transfers</span>
              <span>Daily breakfast</span>
              <span>Dedicated assistant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
