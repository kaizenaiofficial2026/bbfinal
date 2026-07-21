"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { loadCartAction, saveCartAction } from "./actions";

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
  // Whether a customer is signed in. The cart is a signed-in-only feature, so the
  // floating cart button and the "Add to cart" action are hidden when this is false.
  authenticated: boolean;
};

// Cart storage is scoped PER USER (`bb-cart:<userId>`). The cart is a signed-in-
// only feature, so a guest has no persistent cart, and on a shared browser one
// user can never see another user's items — logging in as a different user (or
// out) reads a different key. `bb-cart` (unscoped) is the legacy key and is a
// cross-user leak vector, so it's removed the first time we scope to a user.
const STORAGE_PREFIX = "bb-cart";
const EMPTY: CartItem[] = [];

// ── Module-level external store (localStorage-backed) ────────────────────────
// Using an external store + useSyncExternalStore avoids setState-in-effect (which
// the React Compiler lint forbids) AND the SSR hydration mismatch: the server
// snapshot is empty, the client snapshot reads localStorage after mount.

let items: CartItem[] = EMPTY;
// The localStorage key for the currently-signed-in user, or null for a guest.
// `undefined` means "not yet synced to any user this session".
let activeKey: string | null | undefined = undefined;
const listeners = new Set<() => void>();

function readStorage(key: string): CartItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Point the store at the signed-in user's cart (or empty it for a guest). Called
// during render before the snapshot is read, so the correct user's items are in
// place on first paint. Idempotent — a no-op when the user hasn't changed — and
// does NOT emit (the render that triggered the user change re-reads the snapshot
// itself); only add/remove/clear emit.
function syncUser(userId: string | null) {
  if (typeof window === "undefined") return;
  const nextKey = userId ? `${STORAGE_PREFIX}:${userId}` : null;
  if (nextKey === activeKey) return;
  activeKey = nextKey;
  items = nextKey ? readStorage(nextKey) : EMPTY;
  try {
    // Retire the legacy unscoped cart so it can't leak to the next user.
    window.localStorage.removeItem(STORAGE_PREFIX);
  } catch {
    // ignore
  }
}

function persist() {
  if (!activeKey) return; // guests don't persist a cart
  try {
    window.localStorage.setItem(activeKey, JSON.stringify(items));
  } catch {
    // private mode / quota — the cart just won't persist.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Union of the local and server carts, keyed by lineId. A union (rather than
 * "server wins") means nothing a customer added on either device silently
 * disappears when the two meet.
 */
function mergeCarts(
  local: CartItem[],
  server: CartItem[],
  serverHasRow: boolean,
): CartItem[] {
  // The SERVER is the source of truth once a cart row exists. A union looks
  // friendlier but can't express a removal — deletion is only ever "absence", so
  // unioning resurrects it: remove a package on your laptop and your phone's
  // stale copy pushes it back, and a cart cleared by checkout reappears and gets
  // paid for twice.
  if (serverHasRow) return server;

  // No row yet (first sync for this customer): adopt whatever this browser has,
  // which also migrates a cart left over from the old localStorage-only version.
  return local;
}

// ── Server sync ──────────────────────────────────────────────────────────────
// localStorage stays the fast local mirror (instant reads, works offline), but
// the server row is what makes the cart follow the customer between browsers
// and devices. Writes are debounced so a burst of edits is one round-trip.

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pushToServer: ((items: CartItem[]) => void) | null = null;
/** Set once the server cart has been merged in, so we don't push before we pull. */
let hydratedKey: string | null = null;

function scheduleSave() {
  if (!activeKey || hydratedKey !== activeKey || !pushToServer) return;
  if (saveTimer) clearTimeout(saveTimer);
  const snapshot = items;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    pushToServer?.(snapshot);
  }, 400);
}

function setItems(next: CartItem[]) {
  items = next;
  persist();
  scheduleSave();
  emit();
}

/** Apply the server's cart without echoing it straight back as a save. */
function adoptServerItems(next: CartItem[]) {
  items = next;
  persist();
  emit();
}

const cartStore = {
  syncUser,
  adoptServerItems,
  markHydrated(key: string | null) {
    hydratedKey = key;
  },
  setPusher(fn: ((items: CartItem[]) => void) | null) {
    pushToServer = fn;
  },
  /** Flush any pending debounce — used before navigating to checkout. */
  flush() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      pushToServer?.(items);
    }
  },
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  // getSnapshot must return a STABLE reference between mutations (Object.is).
  getSnapshot(): CartItem[] {
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
  authenticated: false,
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({
  children,
  userId = null,
}: {
  children: React.ReactNode;
  /** Signed-in customer's id, or null/undefined for a guest. Scopes the cart. */
  userId?: string | null;
}) {
  const authenticated = Boolean(userId);

  // Point the store at this user's cart BEFORE reading the snapshot, so the right
  // items are present on first paint and a different user never sees them. Safe to
  // call during render: it's idempotent and only mutates when the user changed
  // (mirrors the original lazy-hydration approach, no setState-in-effect).
  cartStore.syncUser(userId ?? null);

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

  // Pull the server cart once per signed-in user, merge it with whatever this
  // browser already had, then keep the server in step with local edits. This is
  // what makes a cart built on a phone show up on a laptop.
  useEffect(() => {
    if (!userId) {
      cartStore.markHydrated(null);
      cartStore.setPusher(null);
      return;
    }

    let cancelled = false;
    cartStore.setPusher((next) => {
      void saveCartAction(next);
    });

    loadCartAction()
      .then(({ items: serverItems, hasRow }) => {
        if (cancelled) return;
        const local = cartStore.getSnapshot();
        const resolved = mergeCarts(local, serverItems, hasRow);
        cartStore.adoptServerItems(resolved);
        cartStore.markHydrated(`${STORAGE_PREFIX}:${userId}`);
        // Only write when this browser is the one seeding the server; adopting
        // the server's cart must not echo straight back.
        if (!hasRow && resolved.length > 0) void saveCartAction(resolved);
      })
      .catch(() => {
        // Offline or the row is unreadable — carry on with the local cart and
        // let the next edit retry the write.
        if (!cancelled) cartStore.markHydrated(`${STORAGE_PREFIX}:${userId}`);
      });

    return () => {
      cancelled = true;
      cartStore.flush();
      cartStore.setPusher(null);
      cartStore.markHydrated(null);
    };
  }, [userId]);

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
    // `amount` is the per-traveller price; travellers doubles as the line
    // quantity (the server re-prices with the same rule at checkout).
    const subtotal = current.reduce(
      (sum, i) => sum + i.amount * Math.max(1, i.travellers || 1),
      0,
    );
    return {
      items: current,
      count: current.length,
      subtotal,
      currency: current[0]?.currency ?? null,
      addItem,
      removeItem,
      clear,
      ready,
      authenticated,
    };
  }, [current, ready, authenticated, addItem, removeItem, clear]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
