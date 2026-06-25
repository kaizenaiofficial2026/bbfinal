import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/Toast";

function SuccessTrigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.success("Saved!")}>
      fire
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a toast when fired and removes it on dismiss", () => {
    render(
      <ToastProvider>
        <SuccessTrigger />
      </ToastProvider>,
    );

    expect(screen.queryByText("Saved!")).toBeNull();

    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText("Saved!")).toBeNull();
  });

  it("is a no-op when used without a provider (does not throw)", () => {
    render(<SuccessTrigger />);
    fireEvent.click(screen.getByText("fire"));
    expect(screen.getByText("fire")).toBeInTheDocument();
  });
});
