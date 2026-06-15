import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/actions", () => ({
  submitBooking: vi.fn(async () => ({ ok: true, note: "ok", reference: "BB-TEST" })),
  initialBookingState: { note: "Submit this request.", ok: false },
}));

import BookingRequestForm from "@/components/BookingRequestForm";

describe("BookingRequestForm", () => {
  it("carries the package context in hidden fields", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" />,
    );

    expect(
      container.querySelector('input[name="tourPackageId"]'),
    ).toHaveValue("pkg-1");
    expect(
      container.querySelector('input[name="packageTitle"]'),
    ).toHaveValue("Glamour of Sri Lanka");
    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });

  it("collects no card details (payment happens later via pay link)", () => {
    render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" />,
    );

    expect(screen.queryByLabelText(/card number/i)).toBeNull();
    expect(screen.queryByLabelText(/cvc/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /send booking request/i }),
    ).toBeInTheDocument();
  });

  it("includes a concealed honeypot field", () => {
    const { container } = render(
      <BookingRequestForm packageId="pkg-1" packageTitle="Glamour of Sri Lanka" />,
    );

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
