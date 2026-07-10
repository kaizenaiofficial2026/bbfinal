"use client";

import { useRef } from "react";
import { setAdminPasswordAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { useToast } from "@/components/Toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Super-admin control to set a second-level admin's password directly. Reports
 * success/failure via a toast (so a mismatched confirmation doesn't hit the error
 * boundary) and clears the fields on success.
 */
export function SetAdminPasswordForm({ adminId }: { adminId: string }) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    const result = await setAdminPasswordAction(formData);
    if (result.ok) {
      toast.success(result.note);
      formRef.current?.reset();
    } else {
      toast.error(result.note);
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="admin-inline-form admin-password-set"
    >
      <input type="hidden" name="adminId" value={adminId} />
      <Label variant="bare">
        New password
        <Input
          variant="bare"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Label>
      <Label variant="bare">
        Confirm
        <Input
          variant="bare"
          type="password"
          name="confirm"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Label>
      <SubmitButton pendingLabel="Saving…">Set password</SubmitButton>
    </form>
  );
}
