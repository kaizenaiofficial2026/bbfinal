import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast as sonnerToast } from "sonner";
import { ToastProvider, useToast } from "@/components/Toast";

function SuccessTrigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.success("Saved!")}>
      fire
    </button>
  );
}

// Sonner keeps toast state at module scope; clear it between tests so a toast
// fired in one case can't leak into the next.
afterEach(() => {
  sonnerToast.dismiss();
});

describe("ToastProvider", () => {
  it("shows a toast when fired and removes it on dismiss", async () => {
    render(
      <ToastProvider>
        <SuccessTrigger />
      </ToastProvider>,
    );

    expect(screen.queryByText("Saved!")).toBeNull();

    // Sonner renders the toast asynchronously through its portal.
    fireEvent.click(screen.getByText("fire"));
    expect(
      await screen.findByText("Saved!", {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss"));
    await waitFor(() => expect(screen.queryByText("Saved!")).toBeNull(), {
      timeout: 3000,
    });
  });

  it("is a no-op when used without a provider (does not throw)", () => {
    render(<SuccessTrigger />);
    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByText("fire")).toBeInTheDocument();
  });
});
