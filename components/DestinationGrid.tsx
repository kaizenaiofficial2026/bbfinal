import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/lib/travel";

type DestinationGridProps = {
  destinations: Destination[];
};

export default function DestinationGrid({ destinations }: DestinationGridProps) {
  return (
    <div className="destination-grid" data-reveal-group>
      {destinations.map((destination, index) => (
        <Link
          className="destination-card"
          href={`/${destination.slug}`}
          key={destination.slug}
        >
          <Image
            src={destination.image}
            alt={destination.title}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 33vw"
          />
          <span className="destination-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="destination-card-content">
            <small>{destination.tagline}</small>
            <h2>{destination.title}</h2>
            <p>{destination.keyAttraction}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
