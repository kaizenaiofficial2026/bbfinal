import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";
import PayButton from "@/app/[locale]/pay/[token]/PayButton";

describe("PayButton", () => {
  it("requires both terms and privacy consent before enabling payment", () => {
    render(<PayButton token="tok" scriptUrl="https://example.com/checkout.js" />);

    const button = screen.getByRole("button", { name: /pay securely/i });
    const terms = screen.getByRole("checkbox", {
      name: /terms and conditions/i,
    });
    const privacy = screen.getByRole("checkbox", { name: /privacy policy/i });

    expect(button).toBeDisabled();
    fireEvent.click(terms);
    expect(button).toBeDisabled();
    fireEvent.click(privacy);
    expect(button).toBeEnabled();
    fireEvent.click(terms);
    expect(button).toBeDisabled();
    fireEvent.click(terms);
    expect(button).toBeEnabled();
    fireEvent.click(privacy);
    expect(button).toBeDisabled();
  });

  // The terms open in a modal now rather than navigating to /terms, so the
  // visitor never loses a half-completed payment to a page change.
  it("opens the terms and conditions in a dialog", () => {
    render(<PayButton token="tok" scriptUrl="x" />);

    const trigger = screen.getByRole("button", { name: /terms and conditions/i });
    const checkbox = screen.getByRole("checkbox", {
      name: /terms and conditions/i,
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(trigger);
    expect(
      screen.getByRole("dialog", { name: /terms (?:&|and) conditions/i }),
    ).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("opens the supplied privacy policy in a matching dialog", () => {
    render(<PayButton token="tok" scriptUrl="x" />);

    const trigger = screen.getByRole("button", { name: /privacy policy/i });
    const checkbox = screen.getByRole("checkbox", { name: /privacy policy/i });
    expect(
      screen.queryByRole("dialog", { name: /privacy policy/i }),
    ).toBeNull();

    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: /privacy policy/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /controlling your personal information/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/credit card number will not be saved/i),
    ).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
});
