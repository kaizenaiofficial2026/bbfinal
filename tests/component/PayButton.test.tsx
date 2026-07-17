import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";
import PayButton from "@/app/[locale]/pay/[token]/PayButton";

describe("PayButton", () => {
  it("keeps Pay securely disabled until the terms checkbox is ticked", () => {
    render(<PayButton token="tok" scriptUrl="https://example.com/checkout.js" />);

    const button = screen.getByRole("button", { name: /pay securely/i });
    const checkbox = screen.getByRole("checkbox");

    expect(button).toBeDisabled();
    fireEvent.click(checkbox);
    expect(button).toBeEnabled();
    fireEvent.click(checkbox);
    expect(button).toBeDisabled();
  });

  // The terms open in a modal now rather than navigating to /terms, so the
  // visitor never loses a half-completed payment to a page change.
  it("opens the terms and conditions in a dialog", () => {
    render(<PayButton token="tok" scriptUrl="x" />);

    const trigger = screen.getByRole("button", { name: /terms and conditions/i });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
