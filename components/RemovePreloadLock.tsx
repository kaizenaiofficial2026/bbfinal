"use client";

import { useEffect } from "react";

/**
 * The root layout ships `<body class="is-loading">` (overflow:hidden) which is
 * normally cleared by SiteEffects inside SiteShell. The auth screens render
 * their own focused shell without SiteShell, so they clear the lock themselves
 * — otherwise the page couldn't scroll on short viewports.
 */
export default function RemovePreloadLock() {
  useEffect(() => {
    document.body.classList.remove("is-loading");
  }, []);

  return null;
}
