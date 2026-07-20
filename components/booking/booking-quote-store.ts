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
 *
 * The store keeps BOTH the raw text the user is typing and the clamped number
 * used for pricing. Clamping every keystroke made the field impossible to edit:
 * clearing it produced 0 → clamped to 1 → "1" reappeared, so you could never
 * delete the digit to type your own count.
 */

export const DEFAULT_TRAVELLERS = 2;
export const MIN_TRAVELLERS = 1;
export const MAX_TRAVELLERS = 50;

type QuoteState = {
  packageId: string | null;
  /** Clamped count used for pricing. Never 0 or NaN. */
  travellers: number;
  /** Exactly what's in the input, including "" mid-edit. */
  input: string;
};

function initialState(packageId: string | null): QuoteState {
  return {
    packageId,
    travellers: DEFAULT_TRAVELLERS,
    input: String(DEFAULT_TRAVELLERS),
  };
}

let state: QuoteState = initialState(null);
const SERVER_STATE: QuoteState = initialState(null);
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
    state = initialState(packageId);
  },

  /**
   * Accept the raw field value. An empty (or not-yet-valid) entry is kept as-is
   * so the user can clear the box and type freely; pricing falls back to the
   * minimum until they've typed a usable number.
   */
  setInput(raw: string) {
    if (raw === state.input) return;
    const parsed = Number(raw);
    const travellers =
      raw.trim() === "" || !Number.isFinite(parsed)
        ? MIN_TRAVELLERS
        : clampTravellerCount(parsed);
    state = { ...state, input: raw, travellers };
    emit();
  },

  /**
   * Normalise on blur/submit: whatever half-finished text is in the box becomes
   * the clamped number, so the field can never be left empty or out of range.
   */
  commitInput() {
    const normalised = String(state.travellers);
    if (normalised === state.input) return;
    state = { ...state, input: normalised };
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

function useQuote(): QuoteState {
  return useSyncExternalStore(
    bookingQuoteStore.subscribe,
    bookingQuoteStore.getSnapshot,
    bookingQuoteStore.getServerSnapshot,
  );
}

/** The clamped count used for pricing. */
export function useBookingTravellers(): number {
  return useQuote().travellers;
}

/** The raw field value, so the input stays editable while typing. */
export function useBookingTravellersInput(): string {
  return useQuote().input;
}

/** Shared clamp: whole travellers, 1–50 (mirrors the server's bounds). */
export function clampTravellerCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRAVELLERS;
  return Math.min(MAX_TRAVELLERS, Math.max(MIN_TRAVELLERS, Math.round(value)));
}
