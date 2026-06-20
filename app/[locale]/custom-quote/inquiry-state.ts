// Plain (non-"use server") module for the inquiry form-action state.

export type InquiryState = {
  ok: boolean;
  note: string;
};

export const initialInquiryState: InquiryState = {
  ok: false,
  note: "",
};
