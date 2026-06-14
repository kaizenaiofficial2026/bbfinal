"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Destination } from "@/lib/travel";

type DestinationGridProps = {
  destinations: Destination[];
};

export default function DestinationGrid({ destinations }: DestinationGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="destination-selector" data-reveal-group>
      {destinations.map((destination, index) => (
        <article
          className={`destination-selector-panel${
            activeIndex === index ? " is-active" : ""
          }`}
          key={destination.slug}
        >
          <button
            type="button"
            className="destination-selector-trigger"
            aria-pressed={activeIndex === index}
            aria-label={`Show ${destination.title}`}
            onClick={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <Image
              src={destination.image}
              alt=""
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 46vw"
            />
            <span className="destination-selector-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="destination-selector-copy">
              <small>{destination.tagline}</small>
              <strong>{destination.title}</strong>
              <span>{destination.keyAttraction}</span>
            </span>
          </button>
          <Link
            className="destination-selector-link"
            href={`/${destination.slug}`}
            aria-label={`View ${destination.title} destination`}
          >
            View destination
          </Link>
        </article>
      ))}
    </div>
  );
}
