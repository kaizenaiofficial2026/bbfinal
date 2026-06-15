"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CTASectionProps = {
  title: string;
  text: string;
  href?: string;
  action?: string;
};

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const CTA_IMAGE_ROWS = [
  [
    "/assets/images/destinations/yala-2.jpg",
    "/assets/images/destinations/colombo-city.jpg",
    "/assets/images/destinations/kandy.jpg",
    "/assets/images/tours/ancient-capital.jpg",
    "/assets/images/destinations/arugam-bay.jpg",
    "/assets/images/destinations/galle-fort.jpg",
  ],
  [
    "/assets/images/destinations/bentota.jpg",
    "/assets/images/destinations/sigiriya.jpg",
    "/assets/images/destinations/trincomalee.jpg",
    "/assets/images/tours/glamour-sri-lanka.jpg",
    "/assets/images/destinations/nuwara-eliya-2.jpg",
    "/assets/images/destinations/pinnawala.jpg",
  ],
];

type ScrambleLinkProps = {
  href: string;
  label: string;
};

function ScrambleLink({ href, label }: ScrambleLinkProps) {
  const [displayLabel, setDisplayLabel] = useState(label);
  const intervalRef = useRef<number | null>(null);
  const scramblingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      scramblingRef.current = false;
    };
  }, [label]);

  const scramble = () => {
    if (scramblingRef.current) return;

    scramblingRef.current = true;
    let iteration = 0;

    intervalRef.current = window.setInterval(() => {
      setDisplayLabel(
        label
          .split("")
          .map((character, index) => {
            if (character === " " || index < iteration) return character;
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join(""),
      );

      if (iteration >= label.length) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        scramblingRef.current = false;
        setDisplayLabel(label);
      }

      iteration += 0.45;
    }, 28);
  };

  return (
    <Link
      className="btn btn-primary cta-scramble-link"
      href={href}
      onFocus={scramble}
      onMouseEnter={scramble}
    >
      <span>{displayLabel}</span>
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
  );
}

export default function CTASection({
  title,
  text,
  href = "/contacts",
  action = "Contact us",
}: CTASectionProps) {
  return (
    <section className="cta-strip">
      <div className="container cta-strip-inner">
        <div className="cta-strip-copy" data-reveal>
          <span className="section-kicker">Start planning</span>
          <h2 className="display display-md">{title}</h2>
          <p>{text}</p>
          <ScrambleLink href={href} label={action} />
        </div>
        <div className="cta-marquee" aria-hidden="true">
          {CTA_IMAGE_ROWS.map((row, rowIndex) => (
            <div
              className={`cta-marquee-row${
                rowIndex % 2 === 0 ? " is-reverse" : ""
              }`}
              key={row.join("-")}
            >
              {[...row, ...row].map((src, index) => (
                <div className="cta-marquee-tile" key={`${src}-${index}`}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 34vw, 150px"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
