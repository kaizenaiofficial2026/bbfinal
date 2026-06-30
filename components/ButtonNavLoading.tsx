"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Universal click feedback for navigation buttons. The moment a `.btn` link is
 * clicked it gets an in-button spinner (added via a CSS pseudo-element, so no
 * markup change is needed), held until the route change completes. This gives
 * every link-styled button across the whole site a loading state without
 * per-link wiring — new link-buttons are covered automatically.
 *
 * Form-submit buttons and async onClick buttons keep their own React-driven
 * spinners (useFormStatus / local pending state); this only handles plain link
 * navigations, where there is no React pending signal to read. Pure progressive
 * enhancement: without JS the links still work, just without the spinner.
 */
export default function ButtonNavLoading() {
  const pathname = usePathname();

  // The URL changed → the navigation finished (or the page unmounted). Clear any
  // spinner still showing on a persistent button (e.g. one in the header).
  useEffect(() => {
    for (const el of document.querySelectorAll(".btn.is-navigating")) {
      el.classList.remove("is-navigating");
    }
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Skip modifier / middle / new-tab clicks — those open elsewhere and don't
      // navigate this page, so a spinner would be wrong. (We deliberately do NOT
      // check event.defaultPrevented: Next's <Link> calls preventDefault to run
      // its client-side navigation, and bailing on that would mean the spinner
      // never shows for the very links we care about.)
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as HTMLElement | null)?.closest("a.btn");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      // Same-origin navigations to a different URL only (skip external links,
      // in-page hashes and re-clicks of the current page).
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      link.classList.add("is-navigating");
      // Safety net: the pathname effect clears this on a real route change, but
      // if a navigation is cancelled or only changes the query string, make sure
      // the button never stays stuck in its loading state.
      window.setTimeout(() => link.classList.remove("is-navigating"), 8000);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
