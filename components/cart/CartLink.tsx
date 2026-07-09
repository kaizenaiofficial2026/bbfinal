"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";

export default function CartLink({ className }: { className?: string }) {
  const t = useTranslations("cart");
  const { count, ready } = useCart();
  const showCount = ready && count > 0;

  return (
    <Link
      className={`cart-link${className ? ` ${className}` : ""}`}
      href="/cart"
      aria-label={
        showCount ? t("cartWithCount", { count }) : t("title")
      }
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
      {showCount ? (
        <span className="cart-badge" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
