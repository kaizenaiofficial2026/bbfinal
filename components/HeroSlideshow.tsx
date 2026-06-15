"use client";

import { useEffect, useState } from "react";

type HeroSlideshowProps = {
  images: string[];
  intervalMs?: number;
};

export default function HeroSlideshow({
  images,
  intervalMs = 2000,
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((currentIndex + 1) % images.length);
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentIndex, images.length, intervalMs]);

  useEffect(() => {
    if (previousIndex === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPreviousIndex(null);
    }, 800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [previousIndex]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="hero-slideshow" aria-hidden="true">
      {images.map((image, index) => {
        const isCurrent = index === currentIndex;
        const isPrevious = index === previousIndex;
        const className = [
          "hero-slideshow__image",
          isCurrent ? "hero-slideshow__image--current" : "",
          isPrevious ? "hero-slideshow__image--previous" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <img
            className={className}
            src={image}
            alt=""
            key={image}
            draggable={false}
          />
        );
      })}
      <style>{`
        .hero-slideshow {
          position: absolute;
          inset: 0;
          z-index: -3;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .hero-slideshow__image {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          object-fit: cover;
          filter: saturate(0.98) contrast(1.03);
          opacity: 0;
          transform: translate3d(100%, 0, 0);
          transition:
            transform 700ms ease-in-out,
            opacity 0ms linear 0ms;
          user-select: none;
        }

        .hero-slideshow__image--current {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          transition:
            transform 700ms ease-in-out,
            opacity 0ms linear 0ms;
        }

        .hero-slideshow__image--previous {
          opacity: 1;
          transform: translate3d(-100%, 0, 0);
          transition:
            transform 700ms ease-in-out,
            opacity 0ms linear 0ms;
        }
      `}</style>
    </div>
  );
}
