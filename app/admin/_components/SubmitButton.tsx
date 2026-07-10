"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
};

/**
 * Submit button that disables itself and shows an in-button spinner (plus a
 * pending label) while the parent form's server action is in flight — prevents
 * double-submits and gives the admin clear feedback on saves/uploads.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
