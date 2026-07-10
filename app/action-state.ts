// Plain (non-"use server") module for form-action state shapes and their
// initial values. These must NOT live in app/actions.ts because a "use server"
// file may only export async functions — exporting these objects there throws
// "A 'use server' file can only export async functions, found object."

// Submitted values are echoed back on a failed submit so the form repopulates
// (React 19 resets uncontrolled inputs after an action; defaultValue restores them).
export type EnquiryValues = {
  name: string;
  email: string;
  phone: string;
  country: string;
  package: string;
  message: string;
};

export type EnquiryState = {
  note: string;
  ok: boolean;
  values?: EnquiryValues;
};

export type BookingValues = {
  dates: string;
  travellers: string;
  notes: string;
};

export type BookingState = {
  note: string;
  ok: boolean;
  reference?: string;
  values?: BookingValues;
};

// Initial notes are intentionally EMPTY. The forms render a localized helper hint
// from their i18n namespace when the note is empty (see ContactForm's
// `state.note || t("shareHint")` and BookingRequestForm's
// `state.note || t("submitHint")`). A hardcoded English string here would leak
// English into every non-English locale.
export const initialEnquiryState: EnquiryState = {
  note: "",
  ok: false,
};

export const initialBookingState: BookingState = {
  note: "",
  ok: false,
};
