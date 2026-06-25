/**
 * Currency handling for the payment gateway.
 *
 * Packages are priced and displayed in USD, but the Seylan MPGS merchant only
 * settles in LKR. So the amount we actually send to the gateway (and charge the
 * card) is the USD price converted to LKR at a configured rate. The booking
 * keeps the USD figure for display; the payment row stores the LKR charge.
 *
 * Pure (no env/server imports) so it's unit-testable; callers pass the rate.
 */
export type Money = { amount: number; currency: string };

export function convertCharge(
  amount: number,
  currency: string,
  gatewayCurrency: string,
  usdToLkrRate: number,
): Money {
  // Already in the gateway's currency — nothing to convert.
  if (currency === gatewayCurrency) {
    return { amount, currency };
  }

  if (currency === "USD" && gatewayCurrency === "LKR") {
    // Round to 2 dp — MPGS expects the amount as a fixed-2 decimal string.
    const converted = Math.round(amount * usdToLkrRate * 100) / 100;
    return { amount: converted, currency: "LKR" };
  }

  // Unknown pairing: pass through unchanged and let the gateway reject it
  // rather than silently charge a wrong amount.
  return { amount, currency };
}
