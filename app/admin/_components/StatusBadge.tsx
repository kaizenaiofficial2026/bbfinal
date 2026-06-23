import { statusLabel, statusTone } from "@/lib/admin/format";

/** Pill badge for any status value (booking/enquiry/payment/content/customer). */
export function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = status ?? "";
  return (
    <span className={`admin-badge admin-badge--${statusTone(value)}`}>
      {statusLabel(value)}
    </span>
  );
}
