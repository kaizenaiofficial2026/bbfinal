import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
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
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" amount={1000} currency="LKR" />,
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
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" amount={1000} currency="LKR" />,
    );

    expect(screen.queryByLabelText(/card number/i)).toBeNull();
    expect(screen.queryByLabelText(/cvc/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /reserve & pay/i }),
    ).toBeInTheDocument();
  });

  it("includes a concealed honeypot field", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" amount={1000} currency="LKR" />,
    );

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
