"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DeleteAccountButtonProps = {
  label: string;
  pendingLabel: string;
  /** Shown in the confirmation dialog — deletion is irreversible. */
  confirmText: string;
  /** Localized label for the dialog's dismiss button. */
  cancelLabel: string;
};

/**
 * Submit button for the self-service "delete my account" form. Opens a styled
 * confirmation dialog on click (Cancel dismisses; Confirm submits the enclosing
 * form) and shows an in-button spinner while the server action runs. Must be
 * rendered inside the delete <form> so useFormStatus reads it.
 */
export default function DeleteAccountButton({
  label,
  pendingLabel,
  confirmText,
  cancelLabel,
}: DeleteAccountButtonProps) {
  const { pending } = useFormStatus();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="danger"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? <Spinner /> : null}
          {pending ? pendingLabel : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{confirmText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            onClick={() => triggerRef.current?.form?.requestSubmit()}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
