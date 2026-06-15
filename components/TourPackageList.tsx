import Image from "next/image";
import Link from "next/link";
import type { TourPackage } from "@/lib/data/types";

type TourPackageListProps = {
  packages: TourPackage[];
};

export default function TourPackageList({ packages }: TourPackageListProps) {
  return (
    <div className="tour-package-grid" data-reveal-group="package-cards">
      {packages.map((tour) => (
        <article className="tour-package-card" id={tour.slug} key={tour.slug}>
          <div className="tour-package-image">
            <Image
              src={tour.image}
              alt={tour.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1220px) 50vw, 580px"
            />
          </div>
          <div className="tour-package-body">
            <h2>{tour.title}</h2>
            <p>{tour.summary}</p>
            <div className="tour-meta">
              <span>{tour.duration}</span>
              <span>{tour.tier}</span>
              <span>{tour.hotels}</span>
              <span>{tour.destinations}</span>
            </div>
            <Link className="tour-package-button" href={`/booking/${tour.slug}`}>
              View Package Details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
