"use server";

const INITIAL_NOTE =
  "Presentation form only. Use email or phone for a real enquiry.";

export type EnquiryState = {
  note: string;
  ok: boolean;
};

export const initialEnquiryState: EnquiryState = {
  note: INITIAL_NOTE,
  ok: false,
};

/**
 * Presentation-only enquiry handler.
 *
 * Wired as a Server Action via `<form action={...}>` so the form submits and
 * responds even with JavaScript disabled (progressive enhancement). In a real
 * deployment this is where you would forward the enquiry to email / a CRM.
 */
export async function submitEnquiry(
  _prevState: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !phone || !country || !message) {
    return {
      ok: false,
      note: "Please complete your name, email, phone, country and travel notes.",
    };
  }

  return {
    ok: true,
    note: name
      ? `Thanks, ${name}. A Beyond Borders planner will reply by email or phone.`
      : "Thanks. A Beyond Borders planner will reply by email or phone.",
  };
}
