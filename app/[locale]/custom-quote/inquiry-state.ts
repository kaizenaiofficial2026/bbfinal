// Plain (non-"use server") module for the inquiry form-action state.

export type InquiryState = {
  ok: boolean;
  note: string;
  // Submitted field values, echoed back so a failed submit doesn't wipe the form.
  values?: Record<string, string>;
  // Per-field validation messages keyed by field name, so the form can mark each
  // invalid field after a server-side validation failure.
  fieldErrors?: Record<string, string>;
};

export const initialInquiryState: InquiryState = {
  ok: false,
  note: "",
};
