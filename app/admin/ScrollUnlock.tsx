"use client";

import { useEffect } from "react";

/**
 * The root layout ships `<body class="is-loading">`, which sets
 * `overflow: hidden` to gate the public-site preloader intro. That class is
 * normally cleared by SiteEffects — but the admin area does not render
 * SiteShell/SiteEffects, so without this the lock would persist and the admin
 * pages (and their forms) could not scroll. Clearing it on mount restores
 * normal scrolling for the admin area.
 */
export default function ScrollUnlock() {
  useEffect(() => {
    document.body.classList.remove("is-loading");
  }, []);

  return null;
}
