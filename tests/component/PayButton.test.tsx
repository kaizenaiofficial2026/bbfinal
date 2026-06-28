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

  it("links the terms and conditions text", () => {
    render(<PayButton token="tok" scriptUrl="x" />);
    const link = screen.getByRole("link", { name: /terms and conditions/i });
    expect(link).toHaveAttribute("href", "/terms");
  });
});
