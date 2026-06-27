"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { imageSrc } from "@/lib/images";
import { useEffect, useRef, useState } from "react";
import type { Destination } from "@/lib/data/types";

// 2-card page rhythm with larger editorial cards on wide screens.
const VISIBLE = 2;
const GAP = 22; // matches CSS gap
// px of vertical scroll allocated per horizontal page transition
const SCROLL_PER_PAGE = 820;
const END_HOLD_PROGRESS = 0.86;

type DestinationsProps = {
  destinations: Destination[];
};

export default function Destinations({ destinations }: DestinationsProps) {
  const t = useTranslations("home.destinations");
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const panels = destinations.slice(0, 8);
  const totalPages = Math.max(1, Math.ceil(panels.length / VISIBLE));

  useEffect(() => {
    let disposed = false;

    const sizeCards = () => {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;

      const vw = viewport.clientWidth;
      const cardsInView =
        window.innerWidth <= 720 ? 1 : window.innerWidth <= 980 ? 1.25 : 1.62;
      const cardW = (vw - GAP) / cardsInView;
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
        const outer = outerRef.current;
        const track = trackRef.current;
        const viewport = viewportRef.current;
        if (disposed || !outer || !track || !viewport) return;

        const rect = outer.getBoundingClientRect();
        const scrolledIn = -rect.top;
        const scrollSpace = rect.height - window.innerHeight;
        if (scrollSpace <= 0) return;

        const progress = Math.max(0, Math.min(1, scrolledIn / scrollSpace));
        const slideProgress = Math.min(1, progress / END_HOLD_PROGRESS);

        const vw = viewport.clientWidth;
        const cards = Array.from(track.querySelectorAll<HTMLElement>(".dest-panel"));
        const lastCard = cards.at(-1);
        const cardW = lastCard?.offsetWidth ?? 0;
        const trackW = track.scrollWidth;
        const lastCardCenterOffset = Math.max(0, (vw - cardW) / 2);
        const maxTranslate = Math.max(
          0,
          trackW - cardW - lastCardCenterOffset,
        );
        const translateX = slideProgress * maxTranslate;
        track.style.transform = `translateX(-${translateX}px)`;

        const page = Math.min(
          totalPages - 1,
          Math.floor(slideProgress * totalPages),
        );
        setActivePage(page);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      disposed = true;
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
                <h2 className="display display-lg">{t("heading")}</h2>
                <p className="lead">{t("lead")}</p>
              </div>
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
                    src={imageSrc(destination.image)}
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
                {t("viewMore")}
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
