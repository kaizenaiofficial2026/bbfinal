/**
 * Currency handling for the payment gateway.
 *
 * The Seylan MPGS merchant now settles in USD, so packages are charged in USD
 * with no conversion (the booking flow uses the package's native amount/currency
 * directly). This helper is retained as a fallback for the case where a gateway
 * settles in a different currency than the package price.
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
