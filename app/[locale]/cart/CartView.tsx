"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import Spinner from "@/components/Spinner";
import PaymentMethods from "@/components/PaymentMethods";
import { useCart } from "@/components/cart/CartProvider";
import { imageSrc } from "@/lib/images";
import { checkoutCartAction, type CheckoutState } from "./actions";

const initialState: CheckoutState = { ok: false };

export default function CartView() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const router = useRouter();
  const { items, subtotal, currency, removeItem, clear, ready } = useCart();
  const [state, formAction, pending] = useActionState(
    checkoutCartAction,
    initialState,
  );
  const [startedAt] = useState(() => Date.now());

  // On success the action returns a pay token — clear the cart and go pay.
  useEffect(() => {
    if (state.ok && state.token) {
      clear();
      router.push(`/pay/${state.token}`);
    }
  }, [state, clear, router]);

  // Avoid a hydration flash: render nothing meaningful until the cart hydrates.
  if (!ready) {
    return <p className="form-hint">{t("loading")}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>{t("empty")}</h2>
        <p className="form-hint">{t("emptyNote")}</p>
        <Link className="btn btn-primary" href="/tours">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  const money = (amount: number, cur: string) => `${cur} ${amount.toFixed(2)}`;

  return (
    <div className="cart-layout">
      <ul className="cart-items">
        {items.map((item) => (
          <li className="cart-item" key={item.lineId}>
            {item.image ? (
              <div className="cart-item-media">
                <Image
                  src={imageSrc(item.image)}
                  alt=""
                  width={120}
                  height={90}
                  unoptimized
                />
              </div>
            ) : null}
            <div className="cart-item-body">
              <h3 className="cart-item-title">{item.title}</h3>
              <p className="cart-item-meta">
                {item.travelDates} · {t("travellersCount", { count: item.travellers })}
              </p>
              {item.notes ? (
                <p className="cart-item-notes">{item.notes}</p>
              ) : null}
            </div>
            <div className="cart-item-side">
              <strong>{money(item.amount, item.currency)}</strong>
              <button
                type="button"
                className="cart-item-remove"
                onClick={() => removeItem(item.lineId)}
                aria-label={t("remove")}
                title={t("remove")}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="cart-summary">
        <h2>{t("summary")}</h2>
        <div className="cart-summary-row">
          <span>{t("items")}</span>
          <strong>{items.length}</strong>
        </div>
        <div className="cart-summary-row cart-summary-total">
          <span>{t("subtotal")}</span>
          <strong>{money(subtotal, currency ?? "USD")}</strong>
        </div>

        <form action={formAction}>
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <input type="hidden" name="startedAt" value={startedAt} />
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="cart-company">Company</label>
            <input
              id="cart-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <button
            className="btn btn-primary cart-checkout"
            type="submit"
            disabled={pending || (state.ok && Boolean(state.token))}
            aria-busy={pending}
          >
            {pending ? <Spinner /> : null}
            {pending ? t("processing") : t("checkout")}
          </button>
        </form>
        {state.note && !state.ok ? (
          <p className="form-note is-error" role="alert">
            {state.note}
          </p>
        ) : null}
        <p className="cart-summary-note">{t("checkoutNote")}</p>
        <PaymentMethods label={tc("weAccept")} />
        <Link className="cart-continue" href="/tours">
          {t("continueShopping")}
        </Link>
      </aside>
    </div>
  );
}
