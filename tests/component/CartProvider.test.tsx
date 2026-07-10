import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CartProvider, useCart } from "@/components/cart/CartProvider";

// Exercises the per-user cart scoping that stops one user's cart leaking to the
// next user on a shared browser (FEATURE_AUDIT.md #1).

function Harness() {
  const { items, count, addItem } = useCart();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <ul>
        {items.map((i) => (
          <li key={i.lineId}>{i.title}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          addItem({
            packageId: "p1",
            slug: "bali-escape",
            title: "Bali Escape",
            currency: "USD",
            amount: 100,
            travelDates: "2026-08-01",
            travellers: 2,
          })
        }
      >
        add
      </button>
    </div>
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("CartProvider — per-user scoping", () => {
  it("does not leak one user's cart to another user, but restores each user's own", () => {
    const { rerender } = render(
      <CartProvider userId="user-a">
        <Harness />
      </CartProvider>,
    );

    // User A adds an item.
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByText("Bali Escape")).toBeInTheDocument();

    // Switching to user B on the same browser must NOT show A's cart.
    rerender(
      <CartProvider userId="user-b">
        <Harness />
      </CartProvider>,
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.queryByText("Bali Escape")).toBeNull();

    // Back to user A — their own cart is restored.
    rerender(
      <CartProvider userId="user-a">
        <Harness />
      </CartProvider>,
    );
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByText("Bali Escape")).toBeInTheDocument();

    // A guest (no user id) sees no cart and persists nothing.
    rerender(
      <CartProvider userId={null}>
        <Harness />
      </CartProvider>,
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("retires the legacy unscoped `bb-cart` key so it can't leak", () => {
    window.localStorage.setItem(
      "bb-cart",
      JSON.stringify([{ lineId: "legacy", title: "Old Item" }]),
    );

    render(
      <CartProvider userId="user-c">
        <Harness />
      </CartProvider>,
    );

    // The legacy cart is neither shown nor left behind in storage.
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(window.localStorage.getItem("bb-cart")).toBeNull();
  });
});
