"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny shared store linking the booking form's travellers input to the payment
 * summary card in the page sidebar (a separate client island), so the "Package
 * total" on the right updates live as the traveller count changes. Same
 * external-store pattern as the cart (no setState-in-effect, no hydration
 * mismatch: the server snapshot equals the initial client state).
 *
 * Travellers doubles as the package QUANTITY — pricing is per traveller, and the
 * server re-derives the same price × travellers at checkout (lib/data/orders.ts).
 */

export const DEFAULT_TRAVELLERS = 2;

type QuoteState = { packageId: string | null; travellers: number };

let state: QuoteState = { packageId: null, travellers: DEFAULT_TRAVELLERS };
const SERVER_STATE: QuoteState = {
  packageId: null,
  travellers: DEFAULT_TRAVELLERS,
};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const bookingQuoteStore = {
  /**
   * Point the store at the package being booked. Called during render (like the
   * cart's syncUser): idempotent, resets the count when navigating between
   * booking pages so one package's traveller count never leaks into another's,
   * and never emits — the rendering island reads the fresh snapshot itself.
   */
  syncPackage(packageId: string) {
    if (state.packageId === packageId) return;
    state = { packageId, travellers: DEFAULT_TRAVELLERS };
  },
  setTravellers(travellers: number) {
    if (travellers === state.travellers) return;
    state = { ...state, travellers };
    emit();
  },
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
  getSnapshot(): QuoteState {
    return state;
  },
  getServerSnapshot(): QuoteState {
    return SERVER_STATE;
  },
};

export function useBookingTravellers(): number {
  return useSyncExternalStore(
    bookingQuoteStore.subscribe,
    bookingQuoteStore.getSnapshot,
    bookingQuoteStore.getServerSnapshot,
  ).travellers;
}

/** Shared clamp: whole travellers, 1–50 (mirrors the server's bounds). */
export function clampTravellerCount(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(50, Math.max(1, Math.round(value)));
}
