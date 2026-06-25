"use client";

import { useEffect } from "react";
import { useToast } from "./Toast";

export type SubmitFeedback = "success" | "error" | null;

/**
 * Surfaces the outcome of a `useActionState` form submit:
 *  - returns the resolved feedback kind so the form can colour its inline note
 *    (red on failure, green on success), derived purely from props — no refs,
 *    no setState
 *  - fires a success/error toast once per completion (the toast store is an
 *    external system, so the call lives in an effect)
 *
 * A submit is "settled" when it is no longer pending AND the note has changed
 * away from the form's initial instructions text. `toastOnSuccess: false` skips
 * the success toast for forms that redirect on success.
 */
export function useSubmitFeedback(
  pending: boolean,
  ok: boolean,
  note: string,
  initialNote: string,
  options?: { toastOnSuccess?: boolean },
): SubmitFeedback {
  const toast = useToast();
  const toastOnSuccess = options?.toastOnSuccess ?? true;
  const settled = !pending && note !== initialNote && note !== "";

  useEffect(() => {
    if (settled) {
      if (ok) {
        if (toastOnSuccess) toast.success(note);
      } else {
        toast.error(note);
      }
    }
    // Re-runs whenever the submit result changes (pending toggling drives the
    // settled edge), firing one toast per completion.
  }, [settled, ok, note, toast, toastOnSuccess]);

  return settled ? (ok ? "success" : "error") : null;
}
