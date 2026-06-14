"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Destination } from "@/lib/data/types";

// 2 cards visible at a time → 4 pages → 3 transitions
const VISIBLE = 2;
const GAP = 22; // matches CSS gap
// px of vertical scroll allocated per horizontal page transition
const SCROLL_PER_PAGE = 700;

type DestinationsProps = {
  destinations: Destination[];
};

export default function Destinations({ destinations }: DestinationsProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const panels = destinations.slice(0, 8);
  const totalPages = Math.max(1, Math.ceil(panels.length / VISIBLE));

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!outer || !track || !viewport) return;

    const sizeCards = () => {
      // available height for cards = section height minus header/padding/dots/footer
      // we let CSS drive the height via the fixed 500px on .dest-viewport
      // but we must set the card widths so 2 cards exactly fill the viewport width
      const vw = viewport.clientWidth;
      const cardW = (vw - GAP) / VISIBLE;
      track.querySelectorAll<HTMLElement>(".dest-panel").forEach((card) => {
        card.style.width = `${cardW}px`;
      });
    };

    sizeCards();
    window.addEventListener("resize", sizeCards);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = outer.getBoundingClientRect();
        const scrolledIn = -rect.top;
        const scrollSpace = rect.height - window.innerHeight;
        if (scrollSpace <= 0) return;

        const progress = Math.max(0, Math.min(1, scrolledIn / scrollSpace));

        // How far to slide: one "page" = cardWidth + gap between pages
        const vw = viewport.clientWidth;
        const pageWidth = vw + GAP; // one full page step in px
        const translateX = progress * (totalPages - 1) * pageWidth;
        track.style.transform = `translateX(-${translateX}px)`;

        const page = Math.min(totalPages - 1, Math.floor(progress * totalPages));
        setActivePage(page);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sizeCards);
      cancelAnimationFrame(raf);
    };
  }, [totalPages]);

  if (panels.length === 0) {
    return null;
  }

  const outerHeight = `calc(100vh + ${(totalPages - 1) * SCROLL_PER_PAGE}px)`;

  return (
    <div
      className="dest-scroll-outer"
      ref={outerRef}
      style={{ height: outerHeight }}
    >
      <div className="dest-scroll-sticky">
        <section className="destinations" id="destinations">

          {/* Header — sits above the scrolling track */}
          <div className="container">
            <div className="dest-head">
              <div>
                <span className="section-kicker">Island atlas</span>
                <h2 className="display display-lg">
                  Cinematic chapters of Sri Lanka.
                </h2>
              </div>
              <p className="lead">
                Move from carved stone and sacred cities to tea mist, surf
                breaks and wild national parks without losing the feeling of a
                single beautifully held journey.
              </p>
            </div>
          </div>

          {/* Scrolling card strip — all 8 cards in one row, clips at viewport edge */}
          <div className="dest-viewport" ref={viewportRef}>
            <div
              className="dest-track"
              ref={trackRef}
            >
              {panels.map((destination, index) => (
                <Link className="dest-panel" href={`/${destination.slug}`} key={destination.slug}>
                  <Image
                    src={destination.image}
                    alt={destination.title}
                    fill
                    sizes="(max-width: 720px) 100vw, 50vw"
                  />
                  <span className="dest-tag">{destination.tagline}</span>
                  <div className="dest-content">
                    <span className="dest-index">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{destination.title}</h3>
                      <p>{destination.summary}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Dots + CTA */}
          <div className="container">
            <div className="dest-pagination">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={"dest-dot" + (i === activePage ? " is-active" : "")}
                  aria-label={`Page ${i + 1}`}
                  // dots are read-only scroll indicators — no click handler needed
                />
              ))}
            </div>

            <div className="dest-footer">
              <Link className="btn btn-line" href="/destinations">
                View more destinations
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
