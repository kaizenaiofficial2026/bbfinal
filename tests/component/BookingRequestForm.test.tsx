import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";

vi.mock("@/app/actions", () => ({
  submitBooking: vi.fn(async () => ({ ok: true, note: "ok", reference: "BB-TEST" })),
}));

vi.mock("@/app/action-state", () => ({
  initialBookingState: { note: "Submit this request.", ok: false },
}));

import BookingRequestForm from "@/components/BookingRequestForm";

describe("BookingRequestForm", () => {
  it("carries the package context in hidden fields", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" slug="glamour-of-sri-lanka" amount={1000} currency="USD" />,
    );

    expect(
      container.querySelector('input[name="tourPackageId"]'),
    ).toHaveValue("pkg-1");
    expect(
      container.querySelector('input[name="package"]'),
    ).toHaveValue("Glamour of Sri Lanka");
    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });

  it("collects no card details (payment happens on the hosted checkout)", () => {
    render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" slug="glamour-of-sri-lanka" amount={1000} currency="USD" />,
    );

    expect(screen.queryByLabelText(/card number/i)).toBeNull();
    expect(screen.queryByLabelText(/cvc/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /reserve & pay/i }),
    ).toBeInTheDocument();
  });

  it("includes a concealed honeypot field", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" slug="glamour-of-sri-lanka" amount={1000} currency="USD" />,
    );

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("uses the custom date pickers feeding a hidden dates field", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" slug="glamour-of-sri-lanka" amount={1000} currency="USD" />,
    );

    // The native <input type="date"> was replaced with the themed DatePicker,
    // whose trigger is a button; the value still posts via the hidden field.
    expect(container.querySelector("button#booking-start")).toHaveClass(
      "datepicker-trigger",
    );
    expect(container.querySelector("button#booking-end")).toHaveClass(
      "datepicker-trigger",
    );
    expect(container.querySelector('input[name="dates"]')).not.toBeNull();
  });

  it("blocks submit and asks for dates when none are selected", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" slug="glamour-of-sri-lanka" amount={1000} currency="USD" />,
    );

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(
      screen.getByText(/choose your travel dates/i),
    ).toBeInTheDocument();
  });
});
