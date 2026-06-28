"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { submitCustomInquiry } from "@/app/[locale]/custom-quote/actions";
import { initialInquiryState } from "@/app/[locale]/custom-quote/inquiry-state";
import {
  CAR_TYPES,
  HIRE_TYPES,
  HOTELS,
  MEAL_PLANS,
  ROOM_TYPES,
  YES_NO,
} from "@/lib/data/custom-inquiry-options";
import { isPastDate, isValidRange, todayIso } from "@/lib/validation/dates";
import {
  parseSegments,
  validateAirSegments,
  type AirMessages,
} from "@/lib/validation/air-segments";
import {
  airStarted,
  hotelStarted,
  transportStarted,
} from "@/lib/validation/custom-inquiry";
import AirTicketBuilder from "./AirTicketBuilder";
import CustomInquiryContactFields from "./CustomInquiryContactFields";
import BaseSelect from "./Select";
import Spinner from "./Spinner";
import { useSubmitFeedback } from "./useSubmitFeedback";

// Submitted values (echoed back by the action on a failed submit) reach the
// module-level Field/Select helpers via context, so the form repopulates
// instead of wiping every field.
const InquiryValuesContext = createContext<Record<string, string>>({});

// Per-field client validation errors + a clearer, surfaced the same way.
const InquiryErrorsContext = createContext<{
  errors: Record<string, string>;
  clearError: (name: string) => void;
}>({ errors: {}, clearError: () => {} });

// The inquiry is a 3-step wizard: Hotel → Air ticket → Transport. The sections
// are OPTIONAL — the customer picks at least one; a section is only validated
// once it's "started", and then it's all-or-nothing. Each section's fields are
// listed here for that started/complete check (the airticket return date is
// validated separately — required only for a round trip). Field names are
// namespaced per section because every step shares one <form>.
const STEP_FIELDS: string[][] = [
  [
    "hotel",
    "hotelRoomCategory",
    "hotelRoomType",
    "hotelMealPlan",
    "hotelRooms",
    "hotelArrival",
    "hotelDeparture",
    "hotelAdults",
    "hotelExtraBed",
  ],
  ["airline", "airClass", "airAdults", "airExtraBaggage"],
  ["carType", "hireType", "transportVehicles", "transportDays", "transportPax", "transportExtraBaggage"],
];

// Guest details live on the final step alongside Transport.
const GUEST_REQUIRED = [
  "firstName",
  "lastName",
  "countryCity",
  "passportNumber",
  "email",
  "mobile",
];

const LAST_STEP = STEP_FIELDS.length - 1;

// Thin adapter over the shared custom dropdown (components/Select).
function Select({
  name,
  label,
  options,
  placeholder,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly string[];
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const withPlaceholder = [
    { label: placeholder ?? "Select…", value: "" },
    ...options.map((opt) => ({ label: opt, value: opt })),
  ];
  const values = useContext(InquiryValuesContext);
  const { errors, clearError } = useContext(InquiryErrorsContext);

  return (
    <BaseSelect
      name={name}
      label={label}
      options={withPlaceholder}
      defaultValue={values[name]}
      error={errors[name]}
      onChange={(value) => {
        clearError(name);
        onChange?.(value);
      }}
    />
  );
}

function Field({
  name,
  label,
  type = "text",
  min,
  placeholder,
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  min?: number | string;
  placeholder?: string;
  required?: boolean;
}) {
  const values = useContext(InquiryValuesContext);
  const { errors, clearError } = useContext(InquiryErrorsContext);
  const error = errors[name];
  return (
    <div className={`form-field${error ? " is-invalid" : ""}`}>
      <label htmlFor={`ci-${name}`}>{label}</label>
      <input
        id={`ci-${name}`}
        name={name}
        type={type}
        min={min}
        placeholder={placeholder}
        defaultValue={values[name]}
        required={required}
        onInput={() => clearError(name)}
      />
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function CustomInquiryForm() {
  const t = useTranslations("customQuote");
  const [state, formAction, pending] = useActionState(
    submitCustomInquiry,
    initialInquiryState,
  );
  const feedback = useSubmitFeedback(
    pending,
    state.ok,
    state.note,
    initialInquiryState.note,
  );
  const [startedAt] = useState(() => Date.now());
  const [step, setStep] = useState(0);
  const [hotel, setHotel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Merge server-returned field errors (validation that only runs server-side,
  // e.g. email deliverability or cross-field date refines) with local client
  // errors so every invalid field is marked, not just a single generic note.
  // Local errors win, so editing a field still clears it.
  const errorsApi = useMemo(
    () => ({
      errors: { ...(state.fieldErrors ?? {}), ...errors },
      clearError,
    }),
    [state.fieldErrors, errors, clearError],
  );

  const steps = [
    { key: "hotel", label: t("typeHotel") },
    { key: "airticket", label: t("typeAirticket") },
    { key: "transport", label: t("typeTransport") },
  ];

  const roomCategories = useMemo(
    () => HOTELS.find((h) => h.name === hotel)?.categories ?? [],
    [hotel],
  );

  const valuesFromForm = (fd: FormData): Record<string, string> => {
    const v: Record<string, string> = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === "string") v[key] = value;
    }
    return v;
  };

  const sectionStarted = [hotelStarted, airStarted, transportStarted];

  // Validate ONE service section — but only if the user has started it. A
  // skipped (empty) section returns no errors; a started one must be complete.
  const validateSection = (
    s: number,
    fd: FormData,
  ): Record<string, string> => {
    const v = valuesFromForm(fd);
    const next: Record<string, string> = {};
    if (!sectionStarted[s](v)) return next;

    const get = (name: string) => (v[name] ?? "").trim();
    const today = todayIso();

    if (s === 0) {
      for (const name of STEP_FIELDS[0]) {
        if (!get(name)) next[name] = t("errRequired");
      }
      const arrival = get("hotelArrival");
      const departure = get("hotelDeparture");
      if (arrival && isPastDate(arrival, today))
        next.hotelArrival = t("errDatePast");
      if (arrival && departure && !isValidRange(arrival, departure))
        next.hotelDeparture = t("errDepartureBeforeArrival");
    } else if (s === 1) {
      for (const name of STEP_FIELDS[1]) {
        if (!get(name)) next[name] = t("errRequired");
      }
      const airMsg: AirMessages = {
        tripRequired: t("errRequired"),
        multiMin: t("errMultiMin"),
        fromRequired: t("errAirFrom"),
        toRequired: t("errAirTo"),
        dateRequired: t("errAirDate"),
        datePast: t("errDatePast"),
        samePlace: t("errAirSamePlace"),
        returnRequired: t("errReturnRequired"),
        returnBeforeDepart: t("errReturnBeforeDeparture"),
      };
      const airErrors = validateAirSegments(
        get("airTripType"),
        parseSegments(get("airSegments")),
        today,
        airMsg,
      );
      for (const [key, message] of Object.entries(airErrors)) {
        next[`air-${key}`] = message;
      }
    } else if (s === 2) {
      for (const name of STEP_FIELDS[2]) {
        if (!get(name)) next[name] = t("errRequired");
      }
    }

    return next;
  };

  // Guest/contact details are always required, whichever services are chosen.
  const validateGuest = (fd: FormData): Record<string, string> => {
    const get = (name: string) => String(fd.get(name) ?? "").trim();
    const next: Record<string, string> = {};
    for (const name of GUEST_REQUIRED) {
      if (!get(name)) next[name] = t("errRequired");
    }
    return next;
  };

  const scrollToFirstError = (form: HTMLFormElement) => {
    requestAnimationFrame(() => {
      form
        .querySelector(".is-invalid")
        ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
  };

  // Next just advances; if the current section was started it must be complete
  // first (an empty/skipped section advances freely).
  const goNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) return;
    const found = validateSection(step, new FormData(form));
    if (Object.keys(found).length > 0) {
      setErrors(found);
      scrollToFirstError(form);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, LAST_STEP));
    form.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const goBack = (event: React.MouseEvent<HTMLButtonElement>) => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    event.currentTarget.form?.scrollIntoView?.({
      behavior: "smooth",
      block: "start",
    });
  };

  // Submit: every started section must be complete, the guest details must be
  // filled, and at least one service must be present. Otherwise cancel the
  // submit, jump to the first incomplete section and surface the errors.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const fd = new FormData(form);
    const v = valuesFromForm(fd);
    const perSection = STEP_FIELDS.map((_, s) => validateSection(s, fd));
    const guestErrors = validateGuest(fd);
    const completeCount = perSection.filter(
      (errs, s) => sectionStarted[s](v) && Object.keys(errs).length === 0,
    ).length;

    const all: Record<string, string> = Object.assign(
      {},
      ...perSection,
      guestErrors,
    );
    if (completeCount === 0) all.sections = t("errPickOne");

    if (Object.keys(all).length > 0) {
      event.preventDefault();
      setErrors(all);
      const firstBad = perSection.findIndex((e) => Object.keys(e).length > 0);
      if (firstBad >= 0 && firstBad !== step) setStep(firstBad);
      scrollToFirstError(form);
    }
  };

  return (
    <InquiryValuesContext.Provider value={state.values ?? {}}>
      <InquiryErrorsContext.Provider value={errorsApi}>
        <form
          className="booking-form"
          action={formAction}
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="startedAt" value={startedAt} />
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="ci-company">{t("company")}</label>
            <input
              id="ci-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="inquiry-wizard-head">
            <ol className="inquiry-steps">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className={`inquiry-step${i === step ? " is-active" : ""}${
                    i < step ? " is-done" : ""
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="inquiry-step-index">
                    {i < step ? "✓" : i + 1}
                  </span>
                  <span className="inquiry-step-name">{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="inquiry-step-caption">
              {t("stepLabel", { current: step + 1, total: steps.length })} ·{" "}
              {t("optionalHint")}
            </p>
          </div>

          {/* Step 1 — Hotel */}
          <div className="booking-form-section" hidden={step !== 0}>
            <span className="booking-form-label">{t("typeHotel")}</span>
            <div className="form-grid">
              <Select
                name="hotel"
                label={t("hotel")}
                options={HOTELS.map((h) => h.name)}
                placeholder={t("chooseHotel")}
                onChange={setHotel}
              />
              <Select
                key={hotel}
                name="hotelRoomCategory"
                label={t("roomCategory")}
                options={roomCategories}
                placeholder={hotel ? t("chooseRoomCategory") : t("selectHotelFirst")}
              />
              <Select name="hotelRoomType" label={t("roomType")} options={ROOM_TYPES} placeholder={t("selectPlaceholder")} />
              <Select name="hotelMealPlan" label={t("mealPlan")} options={MEAL_PLANS} placeholder={t("selectPlaceholder")} />
              <Field name="hotelRooms" label={t("numberOfRooms")} type="number" min={1} placeholder="1" />
              <Field name="hotelArrival" label={t("expectedArrival")} type="date" />
              <Field name="hotelDeparture" label={t("expectedDeparture")} type="date" />
              <Field name="hotelAdults" label={t("adults")} type="number" min={1} placeholder="2" />
              <Field name="hotelChildren" label={t("children")} type="number" min={0} placeholder="0" required={false} />
              <Select name="hotelExtraBed" label={t("extraBed")} options={YES_NO} placeholder={t("selectPlaceholder")} />
            </div>
          </div>

          {/* Step 2 — Air ticket: trip builder (One way / Round trip / Multi-city)
              followed by the remaining flight details. */}
          <div className="booking-form-section" hidden={step !== 1}>
            <span className="booking-form-label">{t("typeAirticket")}</span>
            <AirTicketBuilder
              defaultTripType={state.values?.airTripType}
              defaultSegments={state.values?.airSegments}
              defaultAirline={state.values?.airline}
              defaultClass={state.values?.airClass}
              defaultAdults={state.values?.airAdults}
              defaultChildren={state.values?.airChildren}
              defaultExtraBaggage={state.values?.airExtraBaggage}
              errors={errorsApi.errors}
              clearError={clearError}
            />
          </div>

          {/* Step 3 — Transport */}
          <div className="booking-form-section" hidden={step !== 2}>
            <span className="booking-form-label">{t("typeTransport")}</span>
            <div className="form-grid">
              <Select name="carType" label={t("carType")} options={CAR_TYPES} placeholder={t("selectPlaceholder")} />
              <Select name="hireType" label={t("hireType")} options={HIRE_TYPES} placeholder={t("selectPlaceholder")} />
              <Field name="transportVehicles" label={t("numberOfVehicles")} type="number" min={1} placeholder="1" />
              <Field name="transportDays" label={t("numberOfDays")} type="number" min={1} placeholder="1" />
              <Field name="transportPax" label={t("passengers")} type="number" min={1} placeholder="2" />
              <Select name="transportExtraBaggage" label={t("extraBaggage")} options={YES_NO} placeholder={t("selectPlaceholder")} />
            </div>
          </div>

          {/* Service navigation — Back / Next, above the always-on details. */}
          <div className="inquiry-nav">
            {step > 0 ? (
              <button
                className="btn btn-line"
                type="button"
                onClick={goBack}
                disabled={pending}
              >
                {t("back")}
              </button>
            ) : (
              <span />
            )}
            {step < LAST_STEP ? (
              <button
                className="btn btn-line"
                type="button"
                onClick={goNext}
                disabled={pending}
              >
                {t("next")}
              </button>
            ) : (
              <span />
            )}
          </div>

          {/* Your details — always required, whichever services are chosen. */}
          <div className="booking-form-section inquiry-guest">
            <span className="booking-form-label">{t("yourDetails")}</span>
            <div className="form-grid">
              <Field name="firstName" label={t("firstName")} />
              <Field name="lastName" label={t("lastName")} />
              <CustomInquiryContactFields
                defaultCountryCity={state.values?.countryCity}
                defaultMobile={state.values?.mobile}
                errors={errorsApi.errors}
                clearError={clearError}
              />
              <Field name="passportNumber" label={t("passportNumber")} />
              <Field name="email" label={t("email")} type="email" />
            </div>
          </div>

          {errorsApi.errors.sections ? (
            <p className="field-error inquiry-sections-error" role="alert">
              {errorsApi.errors.sections}
            </p>
          ) : null}

          <div className="inquiry-submit">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? <Spinner /> : null}
              {pending ? t("sending") : t("submitInquiry")}
            </button>
          </div>

          <p
            className={`form-note${
              feedback === "error"
                ? " is-error"
                : feedback === "success"
                  ? " is-success"
                  : ""
            }`}
            aria-live="polite"
          >
            {state.note}
          </p>
        </form>
      </InquiryErrorsContext.Provider>
    </InquiryValuesContext.Provider>
  );
}
