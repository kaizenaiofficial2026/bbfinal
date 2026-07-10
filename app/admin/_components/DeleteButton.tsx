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

type DeleteButtonProps = {
  label: string;
  /** Shown in the confirmation dialog — the action is irreversible. */
  confirmText: string;
};

/**
 * Submit button for a delete <form>. Opens a styled confirmation dialog on click
 * (Cancel dismisses; Confirm submits the enclosing form) and shows an in-button
 * spinner while the server action runs. Must be rendered inside the delete form
 * so useFormStatus reads it and the trigger can requestSubmit() that form.
 */
export function DeleteButton({ label, confirmText }: DeleteButtonProps) {
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
          {pending ? "Deleting…" : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{confirmText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
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
