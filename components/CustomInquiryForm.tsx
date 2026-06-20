"use client";

import { useActionState, useMemo, useState } from "react";
import { submitCustomInquiry } from "@/app/custom-quote/actions";
import { initialInquiryState } from "@/app/custom-quote/inquiry-state";
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

type InquiryType = "package" | "hotel" | "airticket" | "transport";

const TYPES: { value: InquiryType; label: string }[] = [
  { value: "package", label: "Package" },
  { value: "hotel", label: "Hotel" },
  { value: "airticket", label: "Air ticket" },
  { value: "transport", label: "Transport" },
];

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
  return (
    <div className="form-field">
      <label htmlFor={`ci-${name}`}>{label}</label>
      <select
        id={`ci-${name}`}
        name={name}
        defaultValue=""
        required
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      >
        <option value="" disabled>
          {placeholder ?? "Select…"}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
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
  const [state, formAction, pending] = useActionState(
    submitCustomInquiry,
    initialInquiryState,
  );
  const [startedAt] = useState(() => Date.now());
  const [type, setType] = useState<InquiryType>("package");
  const [hotel, setHotel] = useState("");

  const roomCategories = useMemo(
    () => HOTELS.find((h) => h.name === hotel)?.categories ?? [],
    [hotel],
  );

  return (
    <form className="booking-form" action={formAction}>
      <input type="hidden" name="inquiryType" value={type} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="ci-company">Company</label>
        <input id="ci-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="booking-form-section">
        <span className="booking-form-label">What can we quote?</span>
        <div className="inquiry-type-tabs">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`btn ${type === t.value ? "btn-primary" : "btn-secondary"}`}
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="booking-form-section">
        <span className="booking-form-label">Inquiry details</span>
        <div className="form-grid">
          {type === "package" ? (
            <Select name="package" label="Package" options={PACKAGE_OPTIONS} placeholder="Choose a package" />
          ) : null}

          {type === "hotel" ? (
            <>
              <Select
                name="hotel"
                label="Hotel"
                options={HOTELS.map((h) => h.name)}
                placeholder="Choose a hotel"
                onChange={setHotel}
              />
              <Select
                name="roomCategory"
                label="Room category"
                options={roomCategories}
                placeholder={hotel ? "Choose a room category" : "Select a hotel first"}
              />
              <Select name="roomType" label="Room type" options={ROOM_TYPES} />
              <Select name="mealPlan" label="Meal plan" options={MEAL_PLANS} />
              <Field name="numberOfRooms" label="Number of rooms" type="number" min={1} placeholder="1" />
              <Field name="arrival" label="Expected arrival" type="date" />
              <Field name="departure" label="Expected departure" type="date" />
              <Field name="adults" label="Number of adults" type="number" min={1} placeholder="2" />
              <Field name="children" label="Number of children" type="number" min={0} placeholder="0" />
              <Select name="extraBed" label="Extra bed" options={YES_NO} />
            </>
          ) : null}

          {type === "airticket" ? (
            <>
              <Field name="airline" label="Airline" placeholder="e.g. SriLankan Airlines" />
              <Field name="route" label="Route" placeholder="e.g. HYD - CMB" />
              <Select name="wayType" label="Trip" options={ONE_OR_BOTH_WAY} />
              <Field name="arrival" label="Departure date" type="date" />
              <Field name="departure" label="Return date" type="date" required={false} />
              <Select name="flightClass" label="Class" options={FLIGHT_CLASSES} />
              <Field name="pax" label="Passengers" type="number" min={1} placeholder="1" />
              <Select name="extraBaggage" label="Extra baggage" options={YES_NO} />
            </>
          ) : null}

          {type === "transport" ? (
            <>
              <Select name="carType" label="Car type" options={CAR_TYPES} />
              <Select name="hireType" label="Hire type" options={HIRE_TYPES} />
              <Field name="numberOfVehicles" label="Number of vehicles" type="number" min={1} placeholder="1" />
              <Field name="numberOfDays" label="Number of days" type="number" min={1} placeholder="1" />
              <Field name="pax" label="Passengers" type="number" min={1} placeholder="2" />
              <Select name="extraBaggage" label="Extra baggage" options={YES_NO} />
            </>
          ) : null}
        </div>
      </div>

      <div className="booking-form-section">
        <span className="booking-form-label">Your details</span>
        <div className="form-grid">
          <Field name="firstName" label="First name" />
          <Field name="lastName" label="Last name" />
          <Field name="countryCity" label="Country & city" required={false} placeholder="e.g. Hyderabad, India" />
          <Field name="passportNumber" label="Passport number" required={false} />
          <Field name="email" label="Email" type="email" />
          <Field name="mobile" label="Mobile number" type="tel" placeholder="+91 ..." />
        </div>
      </div>

      <div className="booking-submit-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Submit inquiry"}
        </button>
        <p className="form-note" aria-live="polite">
          {state.note}
        </p>
      </div>
    </form>
  );
}
