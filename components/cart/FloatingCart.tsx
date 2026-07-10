"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/cart/CartProvider";
import CartView from "@/app/[locale]/cart/CartView";

/**
 * Signed-in-only floating cart. A round button pins to the bottom-right of every
 * public page and only appears once the cart holds at least one item; tapping it
 * opens a near-fullscreen modal with the cart + checkout.
 *
 * Built on Radix Dialog (shadcn's underlying primitive) so focus-trapping, body
 * scroll-lock (incl. the iOS touch-leak case, via react-remove-scroll), Escape,
 * the portal and outside-click-to-close all come for free — replacing the former
 * hand-rolled position:fixed body pin and keydown handler. The existing markup
 * and .cart-* classes are reused verbatim via asChild, so the look is unchanged.
 */
export default function FloatingCart() {
  const t = useTranslations("cart");
  const { count, ready, authenticated } = useCart();

  // The cart is signed-in only — never render for guests.
  if (!ready || !authenticated) return null;

  const showButton = count > 0;

  return (
    <DialogPrimitive.Root>
      {showButton ? (
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="cart-fab"
            aria-label={t("cartWithCount", { count })}
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
        </DialogPrimitive.Trigger>
      ) : null}

      <DialogPrimitive.Portal>
        <div className="cart-modal">
          <DialogPrimitive.Overlay asChild>
            <div className="cart-modal-backdrop" />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content
            className="cart-modal-panel"
            aria-describedby={undefined}
          >
            <div className="cart-modal-head">
              <DialogPrimitive.Title asChild>
                <h2>{t("title")}</h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="cart-modal-close"
                  aria-label={t("close")}
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
              </DialogPrimitive.Close>
            </div>
            <div className="cart-modal-body">
              <CartView />
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
