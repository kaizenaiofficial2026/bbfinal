"use client";

import { useRouter } from "next/navigation";
import { updateCustomInquiryStatusAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { AdminSelect } from "@/app/admin/_components/AdminSelect";
import { useToast } from "@/components/Toast";
import { Label } from "@/components/ui/label";

/**
 * Client status form for a custom inquiry. Mirrors EnquiryStatusForm: calls the
 * server action, then shows a success toast and refreshes the page (so the
 * badge above reflects the new status) — or an error toast on failure.
 */
export function CustomInquiryStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const toast = useToast();
  const router = useRouter();

  async function action(formData: FormData) {
    const result = await updateCustomInquiryStatusAction(formData);
    if (result?.ok) {
      toast.success(result.note || "Status updated.");
      router.refresh();
    } else {
      toast.error(result?.note || "Could not update the status. Try again.");
    }
  }

  return (
    <form className="admin-card admin-inline-form" action={action}>
      <input type="hidden" name="id" value={id} />
      <Label variant="bare">
        Status
        {/* key={status} so the uncontrolled select re-syncs to the new value
            after router.refresh() instead of keeping the pre-update selection. */}
        <AdminSelect
          key={status}
          name="status"
          defaultValue={status}
          ariaLabel="Status"
          options={[
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </Label>
      <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
    </form>
  );
}
