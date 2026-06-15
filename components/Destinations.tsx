"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PANELS = [
  {
    href: "/sigiriya",
    img: "/assets/images/destinations/sigiriya.jpg",
    alt: "Sigiriya rock fortress above jungle",
    tag: "UNESCO",
    index: "01",
    title: "Sigiriya",
    desc: "The eighth wonder of the world, where water gardens, frescoes and stone stairways rise from the forest.",
  },
  {
    href: "/kandy",
    img: "/assets/images/destinations/kandy.jpg",
    alt: "Kandy temple and lake",
    tag: "Sacred city",
    index: "02",
    title: "Kandy",
    desc: "Home of the Sacred Tooth Relic, botanical gardens and evenings wrapped in temple bells.",
  },
  {
    href: "/galle",
    img: "/assets/images/destinations/galle-fort.jpg",
    alt: "Galle Fort coast and lighthouse",
    tag: "Coastal fort",
    index: "03",
    title: "Galle",
    desc: "Dutch ramparts, sea air, boutique lanes and sunset walks along the largest remaining fortress in Asia.",
  },
  {
    href: "/nuwara-eliya",
    img: "/assets/images/destinations/nuwara-eliya-2.jpg",
    alt: "Nuwara Eliya tea estates and mountains",
    tag: "Tea country",
    index: "04",
    title: "Nuwara Eliya",
    desc: "Little England in the highlands, with tea estates, cool mornings and one of the world's most scenic train routes.",
  },
  {
    href: "/yala",
    img: "/assets/images/destinations/yala-2.jpg",
    alt: "Wild landscape in Yala National Park",
    tag: "Safari",
    index: "05",
    title: "Yala",
    desc: "Leopard country, coastal lagoons and dawn safaris through Sri Lanka's most visited national park.",
  },
  {
    href: "/trincomalee",
    img: "/assets/images/destinations/trincomalee.jpg",
    alt: "Trincomalee coastline and natural harbor",
    tag: "Blue coast",
    index: "06",
    title: "Trincomalee",
    desc: "A natural harbor, Nilaveli Beach, Koneswaram Temple and whale watching in season.",
  },
  {
    href: "/colombo",
    img: "/assets/images/destinations/colombo.jpg",
    alt: "Colombo city skyline and coast",
    tag: "Capital",
    index: "07",
    title: "Colombo",
    desc: "The island's beating capital, from Galle Face Green and Gangaramaya Temple to markets and skyline dinners.",
  },
  {
    href: "/bentota",
    img: "/assets/images/destinations/bentota.jpg",
    alt: "Bentota beach and river",
    tag: "Beach",
    index: "08",
    title: "Bentota",
    desc: "Golden sand, Madu River, turtle hatcheries and slow coastal days designed around warm water.",
  },
];

// 2-card page rhythm with larger editorial cards on wide screens.
const VISIBLE = 2;
const TOTAL_PAGES = Math.ceil(PANELS.length / VISIBLE);
const GAP = 22; // matches CSS gap
// px of vertical scroll allocated per horizontal page transition
const SCROLL_PER_PAGE = 820;
const END_HOLD_PROGRESS = 0.86;

export default function Destinations() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

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
          TOTAL_PAGES - 1,
          Math.floor(slideProgress * TOTAL_PAGES),
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
  }, []);

  const outerHeight = `calc(100vh + ${(TOTAL_PAGES - 1) * SCROLL_PER_PAGE}px)`;

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
                <h2 className="display display-lg">
                  Cinematic chapters of Sri Lanka.
                </h2>
                <p className="lead">
                  From ancient rock fortresses to pristine beaches – discover
                  why Sri Lanka is called the pearl of the Indian Ocean.
                </p>
              </div>
            </div>
          </div>

          {/* Scrolling card strip — all 8 cards in one row, clips at viewport edge */}
          <div className="dest-viewport" ref={viewportRef}>
            <div
              className="dest-track"
              ref={trackRef}
            >
              {PANELS.map((p) => (
                <Link className="dest-panel" href={p.href} key={p.index}>
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, 50vw"
                  />
                  <span className="dest-tag">{p.tag}</span>
                  <div className="dest-content">
                    <span className="dest-index">{p.index}</span>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Dots + CTA */}
          <div className="container">
            <div className="dest-pagination">
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
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
