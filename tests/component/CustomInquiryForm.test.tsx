import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";

vi.mock("@/app/[locale]/custom-quote/actions", () => ({
  submitCustomInquiry: vi.fn(async () => ({ ok: true, note: "ok" })),
}));

import CustomInquiryForm from "@/components/CustomInquiryForm";

describe("CustomInquiryForm (wizard)", () => {
  it("opens on step 1 of 3 with a Submit step button and an all-required hint", () => {
    render(<CustomInquiryForm />);

    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getByText(/All fields are required\./)).toBeInTheDocument();
    // The step button is labelled "Submit"; the final "Submit inquiry" button
    // only appears on the last step.
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit inquiry/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the three steps Hotel, Air ticket, Transport (Tours removed)", () => {
    const { container } = render(<CustomInquiryForm />);
    const names = Array.from(
      container.querySelectorAll(".inquiry-step-name"),
    ).map((n) => n.textContent);
    expect(names).toEqual(["Hotel", "Air ticket", "Transport"]);
  });

  it("shows the Hotel step first and keeps the later guest details hidden", () => {
    const { container } = render(<CustomInquiryForm />);

    // The hotel field on the active step 1 is visible (no hidden ancestor).
    const hotel = container.querySelector('[name="hotel"]');
    expect(hotel).not.toBeNull();
    expect(hotel?.closest("[hidden]")).toBeNull();

    // Guest fields live on the final step, which is hidden on step 1.
    const firstName = container.querySelector('input[name="firstName"]');
    expect(firstName).not.toBeNull();
    expect(firstName?.closest("[hidden]")).not.toBeNull();
  });

  it("blocks advancing past an empty step and surfaces a required error", () => {
    render(<CustomInquiryForm />);

    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    // Still on step 1, with a required-field error shown.
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(
      0,
    );
  });

  it("includes a concealed honeypot and a timing field for spam defense", () => {
    const { container } = render(<CustomInquiryForm />);

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });
});
