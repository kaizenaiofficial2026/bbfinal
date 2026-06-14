import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/actions", () => ({
  submitEnquiry: vi.fn(async () => ({ ok: true, note: "ok" })),
  initialEnquiryState: { note: "Share your dates and travel notes.", ok: false },
}));

import ContactForm from "@/components/ContactForm";

describe("ContactForm", () => {
  it("renders accessible enquiry fields and the initial note", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Travel notes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send enquiry/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Share your dates and travel notes."),
    ).toBeInTheDocument();
  });

  it("includes a concealed honeypot and a timing field for spam defense", () => {
    const { container } = render(<ContactForm />);

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();

    expect(container.querySelector('input[name="startedAt"]')).not.toBeNull();
  });
});
