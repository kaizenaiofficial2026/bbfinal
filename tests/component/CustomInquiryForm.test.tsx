import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";

vi.mock("@/app/[locale]/custom-quote/actions", () => ({
  submitCustomInquiry: vi.fn(async () => ({ ok: true, note: "ok" })),
}));

import CustomInquiryForm from "@/components/CustomInquiryForm";

describe("CustomInquiryForm (wizard)", () => {
  it("opens on step 1 of 3 with both Next and Submit available", () => {
    render(<CustomInquiryForm />);

    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    // Next advances between sections; Submit inquiry can finish from any step.
    expect(screen.getByRole("button", { name: /^next$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit inquiry/i }),
    ).toBeInTheDocument();
  });

  it("shows the three steps Hotel, Air ticket, Transport (Tours removed)", () => {
    const { container } = render(<CustomInquiryForm />);
    const names = Array.from(
      container.querySelectorAll(".inquiry-step-name"),
    ).map((n) => n.textContent);
    expect(names).toEqual(["Hotel", "Air ticket", "Transport"]);
  });

  it("shows the Hotel step first with always-visible guest details", () => {
    const { container } = render(<CustomInquiryForm />);

    const hotel = container.querySelector('[name="hotel"]');
    expect(hotel).not.toBeNull();
    expect(hotel?.closest("[hidden]")).toBeNull();

    // Guest details are now always visible (not tucked inside a hidden step).
    const firstName = container.querySelector('input[name="firstName"]');
    expect(firstName).not.toBeNull();
    expect(firstName?.closest("[hidden]")).toBeNull();
  });

  it("lets Next skip an empty (optional) section", () => {
    render(<CustomInquiryForm />);

    // Hotel left empty → Next advances straight to step 2 with no error.
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
  });

  it("blocks submit with no service and requires guest details", () => {
    render(<CustomInquiryForm />);

    fireEvent.click(screen.getByRole("button", { name: /submit inquiry/i }));

    expect(screen.getByText(/at least one service/i)).toBeInTheDocument();
    expect(
      screen.getAllByText("This field is required.").length,
    ).toBeGreaterThan(0);
  });

  it("includes a concealed honeypot and a timing field for spam defense", () => {
    const { container } = render(<CustomInquiryForm />);

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });
});
