"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/cart/CartProvider";
import CartView from "@/app/[locale]/cart/CartView";

/**
 * Signed-in-only floating cart. A round button pins to the bottom-right of every
 * public page and only appears once the cart holds at least one item; tapping it
 * opens a near-fullscreen modal with the cart + checkout. Replaces the old header
 * cart link.
 */
export default function FloatingCart() {
  const t = useTranslations("cart");
  const { count, ready, authenticated } = useCart();
  const [open, setOpen] = useState(false);

  const showButton = ready && authenticated && count > 0;

  // Lock page scroll and wire an Escape-to-close handler only while the modal is
  // open. (DOM side effects in an effect are fine — no setState here.)
  //
  // `overflow: hidden` alone doesn't hold on iOS Safari (touch scroll leaks to the
  // page behind the modal), so we pin <body> with position:fixed at the current
  // scroll offset and restore it on close — the only reliable cross-browser lock.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;

    html.classList.add("cart-modal-open");
    body.classList.add("cart-modal-open");
    body.style.top = `-${scrollY}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      html.classList.remove("cart-modal-open");
      body.classList.remove("cart-modal-open");
      body.style.top = "";
      document.removeEventListener("keydown", onKey);
      // Restore the scroll position the fixed-body lock captured.
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // The cart is signed-in only — never render for guests.
  if (!ready || !authenticated) return null;

  return (
    <>
      {showButton ? (
        <button
          type="button"
          className="cart-fab"
          aria-label={t("cartWithCount", { count })}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 8H6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
          </svg>
          <span className="cart-fab-badge" aria-hidden="true">
            {count}
          </span>
        </button>
      ) : null}

      {open ? (
        <div className="cart-modal" role="dialog" aria-modal="true" aria-label={t("title")}>
          <button
            type="button"
            className="cart-modal-backdrop"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div className="cart-modal-panel">
            <div className="cart-modal-head">
              <h2>{t("title")}</h2>
              <button
                type="button"
                className="cart-modal-close"
                aria-label={t("close")}
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="cart-modal-body">
              <CartView />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
