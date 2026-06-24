/**
 * Display a package price like "LKR 450,000". Returns null when no price is set
 * so callers can omit the price element entirely (drafts / quote-only packages).
 */
export function formatPackagePrice(
  amount?: number | null,
  currency?: string | null,
): string | null {
  if (amount == null) {
    return null;
  }
  const code = (currency || "LKR").toUpperCase();
  return `${code} ${Number(amount).toLocaleString()}`;
}
