"use client";

import { useRouter } from "next/navigation";
import { updateCustomInquiryStatusAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { useToast } from "@/components/Toast";

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
      <label>
        Status
        {/* key={status} so the uncontrolled select re-syncs to the new value
            after router.refresh() instead of keeping the pre-update selection. */}
        <select key={status} name="status" defaultValue={status}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
    </form>
  );
}
