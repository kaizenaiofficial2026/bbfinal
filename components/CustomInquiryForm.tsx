"use client";

import { useActionState, useMemo, useState } from "react";
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
import BaseSelect from "./Select";

type InquiryType = "package" | "hotel" | "airticket" | "transport";

// Thin adapter over the shared custom dropdown (components/Select) so every
// inquiry dropdown gets the same UI as the contact form instead of the native
// browser <select>: it turns `placeholder` into a leading empty-value option and
// forwards `onChange` (used by the hotel → room-category dependency).
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

  return (
    <BaseSelect
      name={name}
      label={label}
      options={withPlaceholder}
      onChange={onChange}
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
  min?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="form-field">
      <label htmlFor={`ci-${name}`}>{label}</label>
      <input
        id={`ci-${name}`}
        name={name}
        type={type}
        min={min}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default function CustomInquiryForm() {
  const t = useTranslations("customQuote");
  const [state, formAction, pending] = useActionState(
    submitCustomInquiry,
    initialInquiryState,
  );
  const [startedAt] = useState(() => Date.now());
  const [type, setType] = useState<InquiryType>("package");
  const [hotel, setHotel] = useState("");

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

  return (
    <form className="booking-form" action={formAction}>
      <input type="hidden" name="inquiryType" value={type} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="ci-company">{t("company")}</label>
        <input id="ci-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
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
              onClick={() => setType(tab.value)}
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
          <Field name="countryCity" label={t("countryCity")} required={false} placeholder={t("countryCityPlaceholder")} />
          <Field name="passportNumber" label={t("passportNumber")} required={false} />
          <Field name="email" label={t("email")} type="email" />
          <Field name="mobile" label={t("mobile")} type="tel" placeholder="+91 ..." />
        </div>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? t("sending") : t("submitInquiry")}
        </button>
        <p className="form-note" aria-live="polite">
          {state.note}
        </p>
      </div>
    </form>
  );
}
