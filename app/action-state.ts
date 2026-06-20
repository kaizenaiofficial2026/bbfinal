// Plain (non-"use server") module for form-action state shapes and their
// initial values. These must NOT live in app/actions.ts because a "use server"
// file may only export async functions — exporting these objects there throws
// "A 'use server' file can only export async functions, found object."

export type EnquiryState = {
  note: string;
  ok: boolean;
};

export type BookingState = {
  note: string;
  ok: boolean;
  reference?: string;
};

export const initialEnquiryState: EnquiryState = {
  note: "Share your dates and travel notes. Our planners will reply by email.",
  ok: false,
};

export const initialBookingState: BookingState = {
  note: "Submit this request and our planners will confirm availability, amount and secure payment instructions.",
  ok: false,
};
