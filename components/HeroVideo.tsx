"use client";

import { useEffect, useRef } from "react";

// The hero background video. Autoplay on mobile is fragile: React doesn't
// reliably set the live `muted` property on hydration, and most mobile browsers
// only autoplay a video that is provably muted + inline, often needing an
// explicit play() call (and sometimes a first user gesture). We drive all of
// that imperatively here. Desktop markup/appearance is unchanged.
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Force muted state so the browser's autoplay policy allows playback.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");

    const tryPlay = () => {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          // Blocked (e.g. iOS Low Power Mode) — the poster stays visible and
          // we retry on the first interaction / when the tab is shown.
        });
      }
    };

    tryPlay();
    video.addEventListener("canplay", tryPlay);

    // Some mobile browsers refuse autoplay until the first gesture; retry once.
    const onFirstGesture = () => tryPlay();
    window.addEventListener("touchstart", onFirstGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onFirstGesture, { once: true });

    const onVisible = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      video.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <video
      ref={ref}
      id="heroImage"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/assets/images/heroes/hero-poster.jpg"
      aria-hidden="true"
    >
      <source src="/assets/hero-bg.mp4" type="video/mp4" />
    </video>
  );
}
