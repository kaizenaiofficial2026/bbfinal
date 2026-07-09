"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

type DeleteAccountButtonProps = {
  label: string;
  pendingLabel: string;
  /** Shown in a confirm() prompt — deletion is irreversible. */
  confirmText: string;
};

/**
 * Submit button for the self-service "delete my account" form. Asks for
 * confirmation on click (a denied confirm cancels the submit) and shows an
 * in-button spinner while the server action runs. Must be rendered inside the
 * delete <form> so useFormStatus reads it.
 */
export default function DeleteAccountButton({
  label,
  pendingLabel,
  confirmText,
}: DeleteAccountButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-danger"
      disabled={pending}
      aria-busy={pending}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
