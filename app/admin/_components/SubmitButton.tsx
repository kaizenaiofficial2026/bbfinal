"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
};

/**
 * Submit button that disables itself and shows a pending label while the parent
 * form's server action is in flight — prevents double-submits and gives the
 * admin clear feedback on saves/uploads.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
