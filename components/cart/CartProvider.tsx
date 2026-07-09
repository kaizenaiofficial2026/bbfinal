"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

// One line in the cart: a package plus the per-trip details entered when adding
// it. `amount`/`currency` are for DISPLAY ONLY — the server re-prices at checkout.
export type CartItem = {
  lineId: string;
  packageId: string;
  slug: string;
  title: string;
  image?: string;
  currency: string;
  amount: number;
  travelDates: string;
  travellers: number;
  notes?: string;
};

type CartApi = {
  items: CartItem[];
  count: number;
  subtotal: number;
  currency: string | null;
  addItem: (item: Omit<CartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = "bb-cart";
const EMPTY: CartItem[] = [];

// ── Module-level external store (localStorage-backed) ────────────────────────
// Using an external store + useSyncExternalStore avoids setState-in-effect (which
// the React Compiler lint forbids) AND the SSR hydration mismatch: the server
// snapshot is empty, the client snapshot reads localStorage after mount.

let items: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  items = readStorage();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // private mode / quota — the cart just won't persist.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function setItems(next: CartItem[]) {
  items = next;
  persist();
  emit();
}

const cartStore = {
  subscribe(callback: () => void) {
    ensureHydrated();
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  // getSnapshot must return a STABLE reference between mutations (Object.is).
  getSnapshot(): CartItem[] {
    ensureHydrated();
    return items;
  },
  getServerSnapshot(): CartItem[] {
    return EMPTY;
  },
  add(item: Omit<CartItem, "lineId">) {
    const lineId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `line-${Date.now()}-${performance.now()}`;
    setItems([...items, { ...item, lineId }]);
  },
  remove(lineId: string) {
    setItems(items.filter((i) => i.lineId !== lineId));
  },
  clear() {
    setItems(EMPTY);
  },
};

// A tiny store that reports whether we're past hydration (false on server / first
// render, true after mount) — again without setState-in-effect.
const mountedStore = {
  subscribe() {
    return () => {};
  },
  getSnapshot() {
    return true;
  },
  getServerSnapshot() {
    return false;
  },
};

const noop = () => {};
const CartContext = createContext<CartApi>({
  items: EMPTY,
  count: 0,
  subtotal: 0,
  currency: null,
  addItem: noop,
  removeItem: noop,
  clear: noop,
  ready: false,
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const ready = useSyncExternalStore(
    mountedStore.subscribe,
    mountedStore.getSnapshot,
    mountedStore.getServerSnapshot,
  );

  const addItem = useCallback((item: Omit<CartItem, "lineId">) => {
    cartStore.add(item);
  }, []);
  const removeItem = useCallback((lineId: string) => {
    cartStore.remove(lineId);
  }, []);
  const clear = useCallback(() => {
    cartStore.clear();
  }, []);

  const api = useMemo<CartApi>(() => {
    const subtotal = current.reduce((sum, i) => sum + i.amount, 0);
    return {
      items: current,
      count: current.length,
      subtotal,
      currency: current[0]?.currency ?? null,
      addItem,
      removeItem,
      clear,
      ready,
    };
  }, [current, ready, addItem, removeItem, clear]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
