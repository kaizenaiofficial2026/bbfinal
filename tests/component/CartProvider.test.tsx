import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// The provider now syncs with the server. Stub the actions: they're "use server"
// modules whose import chain (Supabase, next-intl navigation) can't load in jsdom.
type StoredItem = Record<string, unknown>;
const loadCartAction = vi.fn<() => Promise<StoredItem[]>>(async () => []);
const saveCartAction = vi.fn<
  (items: unknown) => Promise<{ ok: boolean; items: StoredItem[] }>
>(async () => ({ ok: true, items: [] }));

vi.mock("@/components/cart/actions", () => ({
  loadCartAction: () => loadCartAction(),
  saveCartAction: (items: unknown) => saveCartAction(items),
}));

import { CartProvider, useCart } from "@/components/cart/CartProvider";

// Exercises the per-user cart scoping that stops one user's cart leaking to the
// next user on a shared browser (FEATURE_AUDIT.md #1).

function Harness() {
  const { items, count, subtotal, addItem } = useCart();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="subtotal">{subtotal}</span>
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

beforeEach(() => {
  window.localStorage.clear();
  loadCartAction.mockReset().mockResolvedValue([]);
  saveCartAction.mockReset().mockResolvedValue({ ok: true, items: [] });
});
afterEach(() => window.localStorage.clear());

describe("CartProvider — per-user scoping", () => {
  it("does not leak one user's cart to another user, but restores each user's own", () => {
    const { rerender } = render(
      <CartProvider userId="user-a">
        <Harness />
      </CartProvider>,
    );

    // User A adds an item. Subtotal = per-traveller amount × travellers
    // (travellers doubles as the line quantity): 100 × 2.
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("subtotal").textContent).toBe("200");
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

/**
 * The cart lives on the server (public.carts) so it follows a customer between
 * browsers and devices; localStorage is only a local mirror.
 */
describe("CartProvider — server sync", () => {
  it("shows a cart saved on another device", async () => {
    loadCartAction.mockResolvedValue([
      {
        lineId: "from-phone",
        packageId: "11111111-1111-4111-8111-111111111111",
        slug: "hill-country",
        title: "Hill Country Tour",
        currency: "USD",
        amount: 499,
        travelDates: "2027-01-01 to 2027-01-05",
        travellers: 2,
      },
    ]);

    render(
      <CartProvider userId="user-a">
        <Harness />
      </CartProvider>,
    );

    // Local storage is empty, so this can only have come from the server.
    await waitFor(() =>
      expect(screen.getByText("Hill Country Tour")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("subtotal").textContent).toBe("998");
  });

  it("merges the two carts rather than letting either side win", async () => {
    // This browser already has an item…
    window.localStorage.setItem(
      "bb-cart:user-b",
      JSON.stringify([
        {
          lineId: "local-1",
          packageId: "22222222-2222-4222-8222-222222222222",
          slug: "bali-escape",
          title: "Bali Escape",
          currency: "USD",
          amount: 100,
          travelDates: "2027-02-01",
          travellers: 1,
        },
      ]),
    );
    // …and the server has a different one.
    loadCartAction.mockResolvedValue([
      {
        lineId: "server-1",
        packageId: "33333333-3333-4333-8333-333333333333",
        slug: "heart-of-city",
        title: "The Heart of City",
        currency: "USD",
        amount: 200,
        travelDates: "2027-03-01",
        travellers: 1,
      },
    ]);

    render(
      <CartProvider userId="user-b">
        <Harness />
      </CartProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("The Heart of City")).toBeInTheDocument(),
    );
    expect(screen.getByText("Bali Escape")).toBeInTheDocument();
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("pushes local changes to the server", async () => {
    vi.useFakeTimers();
    try {
      render(
        <CartProvider userId="user-c">
          <Harness />
        </CartProvider>,
      );
      // Let the initial load settle so writes are allowed.
      await vi.waitFor(() => expect(loadCartAction).toHaveBeenCalled());
      await Promise.resolve();
      saveCartAction.mockClear();

      fireEvent.click(screen.getByText("add"));
      // Writes are debounced into one round-trip.
      await vi.advanceTimersByTimeAsync(600);

      expect(saveCartAction).toHaveBeenCalled();
      const lastCall = saveCartAction.mock.calls.at(-1);
      expect(lastCall).toBeDefined();
      expect(lastCall![0] as StoredItem[]).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never touches the server for a guest", async () => {
    render(
      <CartProvider userId={null}>
        <Harness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText("add"));
    await Promise.resolve();

    expect(loadCartAction).not.toHaveBeenCalled();
    expect(saveCartAction).not.toHaveBeenCalled();
  });
});
