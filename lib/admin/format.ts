// Shared display formatters for the admin dashboard — consistent money, dates,
// and human-readable status labels/tones across every admin screen.

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
  confirmed: "Confirmed",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  draft: "Draft",
  published: "Published",
  initiated: "Initiated",
  pending: "Pending",
  captured: "Captured",
  failed: "Failed",
  refunded: "Refunded",
  verified: "Verified",
};

export type StatusTone =
  | "positive"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const STATUS_TONES: Record<string, StatusTone> = {
  new: "info",
  contacted: "warning",
  closed: "neutral",
  confirmed: "positive",
  awaiting_payment: "warning",
  paid: "positive",
  cancelled: "danger",
  draft: "neutral",
  published: "positive",
  initiated: "neutral",
  pending: "warning",
  captured: "positive",
  failed: "danger",
  refunded: "neutral",
  verified: "positive",
};

export function statusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function statusTone(status: string): StatusTone {
  return STATUS_TONES[status] ?? "neutral";
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null) return "—";
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString("en-US")}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
