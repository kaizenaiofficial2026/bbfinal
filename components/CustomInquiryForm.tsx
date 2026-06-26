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
  FLIGHT_CLASSES,
  HIRE_TYPES,
  HOTELS,
  MEAL_PLANS,
  ONE_OR_BOTH_WAY,
  PACKAGE_OPTIONS,
  ROOM_TYPES,
  YES_NO,
} from "@/lib/data/custom-inquiry-options";
import { isPastDate, isValidRange, todayIso } from "@/lib/validation/dates";
import BaseSelect from "./Select";
import Spinner from "./Spinner";
import { useSubmitFeedback } from "./useSubmitFeedback";

type InquiryType = "package" | "hotel" | "airticket" | "transport";

// Submitted values (echoed back by the action on a failed submit) reach the
// module-level Field/Select helpers via context, so the form repopulates
// instead of wiping every field.
const InquiryValuesContext = createContext<Record<string, string>>({});

// Per-field client validation errors + a clearer, surfaced the same way.
const InquiryErrorsContext = createContext<{
  errors: Record<string, string>;
  clearError: (name: string) => void;
}>({ errors: {}, clearError: () => {} });

// Every visible field per inquiry type is mandatory (dates handled separately
// below; airticket return date is required only for a round trip).
const REQUIRED: Record<InquiryType, string[]> = {
  package: ["package"],
  hotel: [
    "hotel",
    "roomCategory",
    "roomType",
    "mealPlan",
    "numberOfRooms",
    "adults",
    "children",
    "extraBed",
  ],
  airticket: ["airline", "route", "wayType", "flightClass", "pax", "extraBaggage"],
  transport: [
    "carType",
    "hireType",
    "numberOfVehicles",
    "numberOfDays",
    "pax",
    "extraBaggage",
  ],
};
const GUEST_REQUIRED = [
  "firstName",
  "lastName",
  "countryCity",
  "passportNumber",
  "email",
  "mobile",
];

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
  const [type, setType] = useState<InquiryType>("package");
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

  const errorsApi = useMemo(
    () => ({ errors, clearError }),
    [errors, clearError],
  );

  const types: { value: InquiryType; label: string }[] = [
    { value: "package", label: t("typePackage") },
    { value: "hotel", label: t("typeHotel") },
    { value: "airticket", label: t("typeAirticket") },
    { value: "transport", label: t("typeTransport") },
  ];

  const roomCategories = useMemo(
    () => HOTELS.find((h) => h.name === hotel)?.categories ?? [],
    [hotel],
  );

  const validate = (fd: FormData): Record<string, string> => {
    const get = (name: string) => String(fd.get(name) ?? "").trim();
    const next: Record<string, string> = {};

    for (const name of [...GUEST_REQUIRED, ...REQUIRED[type]]) {
      if (!get(name)) next[name] = t("errRequired");
    }

    const today = todayIso();
    if (type === "hotel") {
      const arrival = get("arrival");
      const departure = get("departure");
      if (!arrival) next.arrival = t("errArrivalRequired");
      else if (isPastDate(arrival, today)) next.arrival = t("errDatePast");
      if (!departure) next.departure = t("errDepartureRequired");
      else if (arrival && !isValidRange(arrival, departure))
        next.departure = t("errDepartureBeforeArrival");
    } else if (type === "airticket") {
      const arrival = get("arrival");
      const departure = get("departure");
      const wayType = get("wayType");
      if (!arrival) next.arrival = t("errDepartureRequired");
      else if (isPastDate(arrival, today)) next.arrival = t("errDatePast");
      // Return date is mandatory for a round trip, optional one-way.
      if (wayType === "Both way" && !departure)
        next.departure = t("errReturnRequired");
      else if (departure && arrival && !isValidRange(arrival, departure))
        next.departure = t("errReturnBeforeDeparture");
    }

    return next;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const found = validate(new FormData(form));
    if (Object.keys(found).length > 0) {
      event.preventDefault();
      setErrors(found);
      requestAnimationFrame(() => {
        form
          .querySelector(".is-invalid")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
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
          <input type="hidden" name="inquiryType" value={type} />
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

          <div className="booking-form-section">
            <span className="booking-form-label">{t("whatQuote")}</span>
            <div className="inquiry-type-tabs">
              {types.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`btn ${type === tab.value ? "btn-primary" : "btn-secondary"}`}
                  aria-pressed={type === tab.value}
                  onClick={() => {
                    setType(tab.value);
                    setErrors({});
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="booking-form-section">
            <span className="booking-form-label">{t("inquiryDetails")}</span>
            <div className="form-grid">
              {type === "package" ? (
                <Select name="package" label={t("package")} options={PACKAGE_OPTIONS} placeholder={t("choosePackage")} />
              ) : null}

              {type === "hotel" ? (
                <>
                  <Select
                    name="hotel"
                    label={t("hotel")}
                    options={HOTELS.map((h) => h.name)}
                    placeholder={t("chooseHotel")}
                    onChange={setHotel}
                  />
                  <Select
                    key={hotel}
                    name="roomCategory"
                    label={t("roomCategory")}
                    options={roomCategories}
                    placeholder={hotel ? t("chooseRoomCategory") : t("selectHotelFirst")}
                  />
                  <Select name="roomType" label={t("roomType")} options={ROOM_TYPES} placeholder={t("selectPlaceholder")} />
                  <Select name="mealPlan" label={t("mealPlan")} options={MEAL_PLANS} placeholder={t("selectPlaceholder")} />
                  <Field name="numberOfRooms" label={t("numberOfRooms")} type="number" min={1} placeholder="1" />
                  <Field name="arrival" label={t("expectedArrival")} type="date" />
                  <Field name="departure" label={t("expectedDeparture")} type="date" />
                  <Field name="adults" label={t("adults")} type="number" min={1} placeholder="2" />
                  <Field name="children" label={t("children")} type="number" min={0} placeholder="0" />
                  <Select name="extraBed" label={t("extraBed")} options={YES_NO} placeholder={t("selectPlaceholder")} />
                </>
              ) : null}

              {type === "airticket" ? (
                <>
                  <Field name="airline" label={t("airline")} placeholder={t("airlinePlaceholder")} />
                  <Field name="route" label={t("route")} placeholder={t("routePlaceholder")} />
                  <Select name="wayType" label={t("trip")} options={ONE_OR_BOTH_WAY} placeholder={t("selectPlaceholder")} />
                  <Field name="arrival" label={t("departureDate")} type="date" />
                  <Field name="departure" label={t("returnDate")} type="date" required={false} />
                  <Select name="flightClass" label={t("flightClass")} options={FLIGHT_CLASSES} placeholder={t("selectPlaceholder")} />
                  <Field name="pax" label={t("passengers")} type="number" min={1} placeholder="1" />
                  <Select name="extraBaggage" label={t("extraBaggage")} options={YES_NO} placeholder={t("selectPlaceholder")} />
                </>
              ) : null}

              {type === "transport" ? (
                <>
                  <Select name="carType" label={t("carType")} options={CAR_TYPES} placeholder={t("selectPlaceholder")} />
                  <Select name="hireType" label={t("hireType")} options={HIRE_TYPES} placeholder={t("selectPlaceholder")} />
                  <Field name="numberOfVehicles" label={t("numberOfVehicles")} type="number" min={1} placeholder="1" />
                  <Field name="numberOfDays" label={t("numberOfDays")} type="number" min={1} placeholder="1" />
                  <Field name="pax" label={t("passengers")} type="number" min={1} placeholder="2" />
                  <Select name="extraBaggage" label={t("extraBaggage")} options={YES_NO} placeholder={t("selectPlaceholder")} />
                </>
              ) : null}
            </div>
          </div>

          <div className="booking-form-section">
            <span className="booking-form-label">{t("yourDetails")}</span>
            <div className="form-grid">
              <Field name="firstName" label={t("firstName")} />
              <Field name="lastName" label={t("lastName")} />
              <Field name="countryCity" label={t("countryCity")} placeholder={t("countryCityPlaceholder")} />
              <Field name="passportNumber" label={t("passportNumber")} />
              <Field name="email" label={t("email")} type="email" />
              <Field name="mobile" label={t("mobile")} type="tel" placeholder="+91 ..." />
            </div>
          </div>

          <div className="booking-submit-row">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? <Spinner /> : null}
              {pending ? t("sending") : t("submitInquiry")}
            </button>
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
          </div>
        </form>
      </InquiryErrorsContext.Provider>
    </InquiryValuesContext.Provider>
  );
}
