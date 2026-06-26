import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";

vi.mock("@/app/[locale]/custom-quote/actions", () => ({
  submitCustomInquiry: vi.fn(async () => ({ ok: true, note: "ok" })),
}));

import CustomInquiryForm from "@/components/CustomInquiryForm";

describe("CustomInquiryForm (wizard)", () => {
  it("opens on step 1 of 4 with Next (not Submit) and an all-required hint", () => {
    render(<CustomInquiryForm />);

    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
    expect(screen.getByText(/All fields are required\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /submit inquiry/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the later steps (transport + guest details) hidden initially", () => {
    const { container } = render(<CustomInquiryForm />);

    // Guest fields live on the final step, which is hidden on step 1.
    const firstName = container.querySelector('input[name="firstName"]');
    expect(firstName).not.toBeNull();
    expect(firstName?.closest("[hidden]")).not.toBeNull();

    // The package field on the active step 1 is visible (no hidden ancestor).
    const pkg = container.querySelector('[name="package"]');
    expect(pkg).not.toBeNull();
    expect(pkg?.closest("[hidden]")).toBeNull();
  });

  it("blocks advancing past an empty step and surfaces a required error", () => {
    render(<CustomInquiryForm />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Still on step 1, with a required-field error shown.
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(
      0,
    );
  });

  it("advances to step 2 once the package step is completed", () => {
    render(<CustomInquiryForm />);

    // Open the Package dropdown and pick an option, then advance.
    fireEvent.click(screen.getByRole("button", { name: "Package" }));
    fireEvent.click(
      screen.getByRole("option", { name: "The Heart of City - USD 200" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
  });

  it("includes a concealed honeypot and a timing field for spam defense", () => {
    const { container } = render(<CustomInquiryForm />);

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });
});
