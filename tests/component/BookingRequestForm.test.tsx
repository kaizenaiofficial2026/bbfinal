import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";

// This page prepares a request only: the button adds the package to the browser
// cart, and payment happens later from the cart (which is where the server-side
// anti-spam and re-pricing live). Nothing here posts to a server action.
const addItem = vi.fn();
const success = vi.fn();

vi.mock("@/components/cart/CartProvider", () => ({
  useCart: () => ({ addItem }),
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ success, error: vi.fn() }),
}));

import BookingRequestForm from "@/components/BookingRequestForm";

const PROPS = {
  packageId: "pkg-1",
  packageTitle: "Glamour of Sri Lanka",
  slug: "glamour-of-sri-lanka",
  amount: 1000,
  currency: "USD",
};

/**
 * Open a DatePicker and click a day in the month it opens on. Both pickers here
 * open on the current month and disable past days, so `day` must be a date that
 * has not passed — the callers use a day far enough ahead to always be pickable.
 */
function pickDate(triggerId: string, day: number) {
  fireEvent.click(document.querySelector(`button#${triggerId}`)!);
  const cell = document.querySelector<HTMLButtonElement>(
    `button#${triggerId}-day-${day}`,
  );
  expect(cell, `day ${day} should be offered by ${triggerId}`).not.toBeNull();
  expect(cell).toBeEnabled();
  fireEvent.click(cell!);
}

describe("BookingRequestForm", () => {
  // The pickers open on the current month and disable past days, so freeze the
  // clock early in a month — otherwise the days picked below stop being
  // selectable depending on when the suite runs.
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-01T09:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    addItem.mockClear();
    success.mockClear();
  });

  it("shows the package title and the amount due", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);

    expect(container.querySelector('input[name="package"]')).toHaveValue(
      "Glamour of Sri Lanka",
    );
    expect(screen.getByText("USD 1000.00")).toBeInTheDocument();
  });

  it("collects no card details (payment happens on the hosted checkout)", () => {
    render(<BookingRequestForm {...PROPS} />);

    expect(screen.queryByLabelText(/card number/i)).toBeNull();
    expect(screen.queryByLabelText(/cvc/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /add to cart/i }),
    ).toBeInTheDocument();
  });

  it("uses the custom date pickers rather than native date inputs", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);

    expect(container.querySelector("button#booking-start")).toHaveClass(
      "datepicker-trigger",
    );
    expect(container.querySelector("button#booking-end")).toHaveClass(
      "datepicker-trigger",
    );
    expect(container.querySelector('input[type="date"]')).toBeNull();
  });

  it("refuses to add to cart and asks for dates when none are selected", () => {
    render(<BookingRequestForm {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(screen.getByText(/choose your travel dates/i)).toBeInTheDocument();
    expect(addItem).not.toHaveBeenCalled();
  });

  it("adds the package to the cart once valid dates are chosen", () => {
    render(<BookingRequestForm {...PROPS} />);

    pickDate("booking-start", 20);
    pickDate("booking-end", 25);
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(addItem).toHaveBeenCalledTimes(1);
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        packageId: "pkg-1",
        slug: "glamour-of-sri-lanka",
        title: "Glamour of Sri Lanka",
        amount: 1000,
        currency: "USD",
      }),
    );
    expect(success).toHaveBeenCalled();
  });
});
