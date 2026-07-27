import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderIntl as render } from "./intl-render";
import PayButton from "@/app/[locale]/pay/[token]/PayButton";

describe("PayButton", () => {
  afterEach(() => {
    delete window.Checkout;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("requires terms agreement and privacy acknowledgment before payment", () => {
    render(<PayButton token="tok" scriptUrl="https://example.com/checkout.js" />);

    const button = screen.getByRole("button", { name: /pay securely/i });
    const terms = screen.getByRole("checkbox", {
      name: /terms and conditions/i,
    });
    const privacy = screen.getByRole("checkbox", { name: /privacy policy/i });

    expect(privacy).toHaveAccessibleName(/acknowledge that i have read/i);
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
        name: /your privacy choices and rights/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not directly collect the full card number/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Beyond Borders Travels (Private) Limited"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "info@beyondborders.lk" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "+94 76 097 9222" }),
    ).toHaveAttribute("href", "tel:+94760979222");
    expect(screen.queryByText(/reservations@beyondborders\.lk/i)).toBeNull();
    expect(screen.getByText(/27 July 2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/Data Protection Act 1998/i)).toBeNull();
    expect(checkbox).not.toBeChecked();
  });

  it("creates one server-side session with both consent versions and opens Checkout", async () => {
    const configure = vi.fn();
    const showPaymentPage = vi.fn();
    window.Checkout = { configure, showPaymentPage };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ sessionId: "SESSION-123" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PayButton
        token="pay-token"
        scriptUrl="https://seylan.gateway.mastercard.com/static/checkout/checkout.min.js"
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /terms and conditions/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /privacy policy/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /pay securely/i }));

    await waitFor(() => expect(showPaymentPage).toHaveBeenCalledOnce());
    expect(configure).toHaveBeenCalledWith({
      session: { id: "SESSION-123" },
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(request?.body))).toEqual({
      token: "pay-token",
      acceptedTerms: true,
      acceptedPrivacy: true,
      termsVersion: "2026-07-27",
      privacyVersion: "2026-07-27",
    });
  });

  it("does not silently succeed when the gateway script loads without Checkout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ sessionId: "SESSION-123" })),
    );

    render(
      <PayButton
        token="pay-token"
        scriptUrl="https://seylan.gateway.mastercard.com/static/checkout/checkout.min.js"
      />,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      queueMicrotask(() => {
        (node as HTMLScriptElement).onload?.(new Event("load"));
      });
      return node;
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /terms and conditions/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /privacy policy/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /pay securely/i }));

    expect(
      await screen.findByText(/unable to start payment/i),
    ).toBeInTheDocument();
  });

  it("handles a malformed session response without attempting Checkout", async () => {
    const configure = vi.fn();
    const showPaymentPage = vi.fn();
    window.Checkout = { configure, showPaymentPage };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>bad gateway</html>")),
    );

    render(<PayButton token="pay-token" scriptUrl="x" />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: /terms and conditions/i }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /privacy policy/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /pay securely/i }));

    expect(
      await screen.findByText(/unable to start payment/i),
    ).toBeInTheDocument();
    expect(configure).not.toHaveBeenCalled();
    expect(showPaymentPage).not.toHaveBeenCalled();
  });
});
