import { statusLabel, statusTone } from "@/lib/admin/format";
import { Badge } from "@/components/ui/badge";

/** Pill badge for any status value (booking/enquiry/payment/content/customer). */
export function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = status ?? "";
  return (
    <Badge className={`admin-badge admin-badge--${statusTone(value)}`}>
      {statusLabel(value)}
    </Badge>
  );
}
