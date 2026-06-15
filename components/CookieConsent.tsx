"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bb-cookie-consent";

function readConsent(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already answered — never show again.
    if (readConsent()) return;

    let disposed = false;
    const reveal = () => {
      if (!disposed) setVisible(true);
    };

    // Wait until the preloader has lifted so the banner doesn't animate in
    // underneath the loading screen, then show it.
    const show = () => window.setTimeout(reveal, 400);

    if (!document.body.classList.contains("is-loading")) {
      const t = show();
      return () => {
        disposed = true;
        window.clearTimeout(t);
      };
    }

    const observer = new MutationObserver(() => {
      if (!document.body.classList.contains("is-loading")) {
        observer.disconnect();
        show();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Safety net in case the loading class never clears.
    const fallback = window.setTimeout(reveal, 9000);

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const choose = (value: "accepted" | "declined") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage unavailable (private mode) — just dismiss for this session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
    >
      <div className="cookie-consent-inner">
        <p className="cookie-consent-text">
          We use cookies to enhance your browsing experience and analyse site
          traffic. By continuing to use this site, you agree to our use of
          cookies.
        </p>
        <div className="cookie-consent-actions">
          <button
            type="button"
            className="btn btn-line"
            onClick={() => choose("declined")}
          >
            Decline
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => choose("accepted")}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
