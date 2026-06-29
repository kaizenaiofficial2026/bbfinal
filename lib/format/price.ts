/**
 * Display a package price like "USD 3,999". Returns null when no price is set
 * so callers can omit the price element entirely (drafts / quote-only packages).
 */
export function formatPackagePrice(
  amount?: number | null,
  currency?: string | null,
): string | null {
  if (amount == null) {
    return null;
  }
  const code = (currency || "USD").toUpperCase();
  return `${code} ${Number(amount).toLocaleString()}`;
}
