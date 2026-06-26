"use client";

import { useEffect } from "react";

/**
 * The root layout ships `<body class="is-loading">` (overflow: hidden) to gate
 * the public-site preloader intro, and that class is normally cleared by
 * SiteEffects. The global not-found renders outside SiteShell, so without this
 * the scroll lock would persist and a tall 404 couldn't scroll on small
 * screens. Clearing it on mount restores normal scrolling. Mirrors
 * app/admin/ScrollUnlock for the same reason in the admin area.
 */
export default function BodyScrollReset() {
  useEffect(() => {
    document.body.classList.remove("is-loading");
  }, []);

  return null;
}
