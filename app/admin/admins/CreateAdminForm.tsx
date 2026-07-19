"use client";

import { useRef } from "react";
import { createAdminAction } from "@/app/admin/actions";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Super-admin control to create a second-level admin account. Reports the outcome
 * via a toast (so a duplicate address or mismatched confirmation doesn't hit the
 * error boundary) and clears the fields on success.
 */
export function CreateAdminForm() {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    const result = await createAdminAction(formData);
    if (result.ok) {
      toast.success(result.note);
      formRef.current?.reset();
    } else {
      toast.error(result.note);
    }
  }

  return (
    // `admin-form` is what gives the bare <Label> its stacked caption-above-input
    // grid — without that ancestor the caption and field run inline on one row.
    <form
      ref={formRef}
      action={action}
      className="admin-form admin-create-admin"
      aria-label="Create second-level admin"
    >
      <div className="admin-create-admin-grid">
        <Label variant="bare">
          Full name
          <Input
            variant="bare"
            type="text"
            name="fullName"
            placeholder="Nimal Silva"
            autoComplete="off"
            minLength={2}
            required
          />
        </Label>
        <Label variant="bare">
          Email
          <Input
            variant="bare"
            type="email"
            name="email"
            placeholder="name@beyondborders.lk"
            autoComplete="off"
            required
          />
        </Label>
        <Label variant="bare">
          Password
          <PasswordInput
            variant="bare"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="admin-field-hint">At least 8 characters.</span>
        </Label>
        <Label variant="bare">
          Confirm password
          <PasswordInput
            variant="bare"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Label>
      </div>

      <div className="admin-create-admin-foot">
        <SubmitButton pendingLabel="Creating…">Create admin</SubmitButton>
      </div>
    </form>
  );
}
