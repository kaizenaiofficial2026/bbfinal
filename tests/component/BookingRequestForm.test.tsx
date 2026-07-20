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

  it("shows the total for the default 2 travellers (price is per traveller)", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);

    expect(container.querySelector('input[name="package"]')).toHaveValue(
      "Glamour of Sri Lanka",
    );
    expect(container.querySelector('input[name="travellers"]')).toHaveValue(2);
    expect(screen.getByText("USD 2000.00")).toBeInTheDocument();
  });

  it("recalculates the total live as the traveller count changes", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);
    const travellers = container.querySelector('input[name="travellers"]')!;

    fireEvent.change(travellers, { target: { value: "4" } });
    expect(screen.getByText("USD 4000.00")).toBeInTheDocument();

    // Out-of-range input clamps instead of pricing nonsense.
    fireEvent.change(travellers, { target: { value: "500" } });
    expect(screen.getByText("USD 50000.00")).toBeInTheDocument();

    fireEvent.change(travellers, { target: { value: "1" } });
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

  /**
   * Regression: the field used to clamp on every keystroke, so clearing it gave
   * 0 → clamped to 1 → "1" reappeared instantly and the digit could never be
   * deleted to type a different count. The raw text must survive editing and
   * only normalise on blur.
   */
  it("lets the traveller count be cleared and retyped", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);
    const field = container.querySelector<HTMLInputElement>(
      'input[name="travellers"]',
    )!;

    fireEvent.change(field, { target: { value: "" } });
    expect(field.value).toBe(""); // stays empty instead of snapping back to "1"

    fireEvent.change(field, { target: { value: "7" } });
    expect(field.value).toBe("7");
    expect(screen.getByText("USD 7000.00")).toBeInTheDocument();
  });

  it("normalises an empty or out-of-range count on blur", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);
    const field = container.querySelector<HTMLInputElement>(
      'input[name="travellers"]',
    )!;

    fireEvent.change(field, { target: { value: "" } });
    fireEvent.blur(field);
    expect(field.value).toBe("1");

    fireEvent.change(field, { target: { value: "999" } });
    fireEvent.blur(field);
    expect(field.value).toBe("50");
    expect(screen.getByText("USD 50000.00")).toBeInTheDocument();
  });

  it("adds the package to the cart with the chosen traveller count", () => {
    const { container } = render(<BookingRequestForm {...PROPS} />);

    fireEvent.change(container.querySelector('input[name="travellers"]')!, {
      target: { value: "3" },
    });
    pickDate("booking-start", 20);
    pickDate("booking-end", 25);
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(addItem).toHaveBeenCalledTimes(1);
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        packageId: "pkg-1",
        slug: "glamour-of-sri-lanka",
        title: "Glamour of Sri Lanka",
        // `amount` stays the per-traveller unit price; travellers carries the
        // quantity. The server re-prices amount × travellers at checkout.
        amount: 1000,
        travellers: 3,
        currency: "USD",
      }),
    );
    expect(success).toHaveBeenCalled();
  });
});
