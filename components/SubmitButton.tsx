"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";
import { Button } from "./ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  /** Optional label shown while pending; defaults to keeping `children`. */
  pendingLabel?: React.ReactNode;
  className?: string;
};

/**
 * Submit button that shows a spinner and disables itself while the parent
 * form's action is in flight. Works for any `<form action={…}>` (server action
 * or `useActionState`) because `useFormStatus` reads the enclosing form.
 * Prevents double-submits and tells the visitor their click registered.
 */
export default function SubmitButton({
  children,
  pendingLabel,
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
      {pending && pendingLabel != null ? pendingLabel : children}
    </Button>
  );
}
