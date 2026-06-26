"use client";

import { useFormStatus } from "react-dom";

type DeleteButtonProps = {
  label: string;
  /** Shown in a confirm() prompt — the action is irreversible. */
  confirmText: string;
};

/**
 * Submit button for a delete <form>. Asks for confirmation on click (a denied
 * confirm cancels the submit) and shows a pending label while the server action
 * runs. Must be rendered inside the delete form so useFormStatus reads it.
 */
export function DeleteButton({ label, confirmText }: DeleteButtonProps) {
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
      {pending ? "Deleting…" : label}
    </button>
  );
}
