import Image from "next/image";
import Link from "next/link";
import type { TourPackage } from "@/lib/travel";

type TourPackageListProps = {
  packages: TourPackage[];
};

export default function TourPackageList({ packages }: TourPackageListProps) {
  return (
    <div className="tour-package-grid" data-reveal-group>
      {packages.map((tour) => (
        <article className="tour-package-card" key={tour.slug}>
          <div className="tour-package-image">
            <Image
              src={tour.image}
              alt={tour.title}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            <span className="tour-badge">{tour.tier}</span>
          </div>
          <div className="tour-package-body">
            <h2>{tour.title}</h2>
            <p>{tour.summary}</p>
            <div className="tour-meta">
              <span>{tour.duration}</span>
              <span>{tour.hotels}</span>
              <span>{tour.destinations}</span>
            </div>
            <div className="tour-itinerary">
              {tour.itinerary.map((item) => (
                <div className="tour-itinerary-item" key={item.day}>
                  <span>{item.day}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="tour-inclusions">
              {tour.inclusions.map((inclusion) => (
                <span key={inclusion}>{inclusion}</span>
              ))}
            </div>
            <Link className="icon-link" href="/contacts">
              Book this journey
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
          </div>
        </article>
      ))}
    </div>
  );
}
