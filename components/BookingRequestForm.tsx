"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitBooking } from "@/app/actions";
import { initialBookingState } from "@/app/action-state";
import Spinner from "./Spinner";
import DatePicker from "./DatePicker";
import { useSubmitFeedback } from "./useSubmitFeedback";
import {
  combineTravelDates,
  isPastDate,
  isValidRange,
  todayIso,
} from "@/lib/validation/dates";

type BookingRequestFormProps = {
  packageId: string;
  packageTitle: string;
  amount: number;
  currency: string;
};

export default function BookingRequestForm({
  packageId,
  packageTitle,
  amount,
  currency,
}: BookingRequestFormProps) {
  const t = useTranslations("bookingPage");
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialBookingState,
  );
  // Booking redirects to the pay page on success, so only surface failures.
  const feedback = useSubmitFeedback(
    pending,
    state.ok,
    state.note,
    initialBookingState.note,
    { toastOnSuccess: false },
  );
  const [startedAt] = useState(() => Date.now());
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const error = validateDates();
    if (error) {
      // Cancels the form action too — the booking is never submitted.
      event.preventDefault();
      setDateError(error);
    }
  };

  return (
    <form
      className="booking-form"
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
    >
      <input type="hidden" name="tourPackageId" value={packageId} />
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* Native date pickers feed this combined value to the server. */}
      <input type="hidden" name="dates" value={combineTravelDates(start, end)} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="booking-company">{t("company")}</label>
        <input
          id="booking-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
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
              defaultValue={state.values?.travellers}
            />
          </div>
          <div className="form-field full">
            <label htmlFor="booking-notes">{t("specialRequests")}</label>
            <textarea
              id="booking-notes"
              name="notes"
              placeholder={t("specialRequestsPlaceholder")}
              defaultValue={state.values?.notes}
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
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? <Spinner /> : null}
          {pending ? t("starting") : t("reservePay", { amount: formattedAmount })}
          {!pending ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
        <p
          className={`form-note${feedback === "error" ? " is-error" : ""}`}
          aria-live="polite"
        >
          {state.note}
        </p>
      </div>
    </form>
  );
}
