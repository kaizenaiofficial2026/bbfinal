"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DatePicker from "./DatePicker";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/Toast";
import {
  combineTravelDates,
  isPastDate,
  isValidRange,
  todayIso,
} from "@/lib/validation/dates";

type BookingRequestFormProps = {
  packageId: string;
  packageTitle: string;
  slug: string;
  image?: string;
  amount: number;
  currency: string;
};

export default function BookingRequestForm({
  packageId,
  packageTitle,
  slug,
  image,
  amount,
  currency,
}: BookingRequestFormProps) {
  const t = useTranslations("bookingPage");
  const cart = useCart();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

  const validateDates = () => {
    if (!start || !end) return t("errSelectDates");
    const today = todayIso();
    if (isPastDate(start, today) || isPastDate(end, today))
      return t("errDatePast");
    if (!isValidRange(start, end)) return t("errEndBeforeStart");
    return null;
  };

  // "Add to cart" stores this package + the entered trip details in the browser
  // cart (the server re-prices at checkout). This page only prepares a request —
  // payment happens later from the cart, so there is no direct pay action here.
  const handleAddToCart = () => {
    const error = validateDates();
    if (error) {
      setDateError(error);
      return;
    }
    const data = formRef.current ? new FormData(formRef.current) : null;
    const travellers = Math.max(1, Math.round(Number(data?.get("travellers")) || 2));
    const notes = String(data?.get("notes") ?? "").trim();
    cart.addItem({
      packageId,
      slug,
      title: packageTitle,
      image,
      currency,
      amount,
      travelDates: combineTravelDates(start, end),
      travellers,
      notes: notes || undefined,
    });
    toast.success(t("addedToCart", { title: packageTitle }));
  };

  return (
    <form
      ref={formRef}
      className="booking-form"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      <div className="booking-form-section">
        <span className="booking-form-label">{t("journeyDetails")}</span>
        <div className="form-grid">
          <div className="form-field full">
            <label htmlFor="booking-package">{t("package")}</label>
            <input
              id="booking-package"
              name="package"
              type="text"
              value={packageTitle}
              readOnly
            />
          </div>
          <DatePicker
            id="booking-start"
            label={t("startDate")}
            value={start}
            min={todayIso()}
            placeholder={t("datePlaceholder")}
            invalid={!!dateError}
            onChange={(iso) => {
              setStart(iso);
              setDateError(null);
            }}
          />
          <DatePicker
            id="booking-end"
            label={t("endDate")}
            value={end}
            min={start || todayIso()}
            placeholder={t("datePlaceholder")}
            invalid={!!dateError}
            onChange={(iso) => {
              setEnd(iso);
              setDateError(null);
            }}
          />
          {dateError ? (
            <p className="field-error full" role="alert">
              {dateError}
            </p>
          ) : null}
          <div className="form-field">
            <label htmlFor="booking-travellers">{t("travellers")}</label>
            <input
              id="booking-travellers"
              name="travellers"
              type="number"
              min="1"
              placeholder="2"
            />
          </div>
          <div className="form-field full">
            <label htmlFor="booking-notes">{t("specialRequests")}</label>
            <textarea
              id="booking-notes"
              name="notes"
              placeholder={t("specialRequestsPlaceholder")}
            />
          </div>
        </div>
      </div>

      <div className="booking-payment-preview">
        <div className="booking-payment-head">
          <div>
            <span className="booking-form-label">{t("totalDueNow")}</span>
            <h2>{t("secureCheckout")}</h2>
          </div>
          <strong>{formattedAmount}</strong>
        </div>
        <p>{t("checkoutNote")}</p>
      </div>

      <div className="booking-submit-row">
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleAddToCart}
        >
          {t("addToCart")}
        </button>
        <p className="form-note" aria-live="polite">
          {t("submitHint")}
        </p>
      </div>
    </form>
  );
}
