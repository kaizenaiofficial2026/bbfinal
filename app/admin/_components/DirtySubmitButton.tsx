"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

type DirtySubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
};

// Serialise the form's current values into a comparable string. Files are keyed
// by name/size/mtime since a File object is never equal to a fresh snapshot.
function snapshot(form: HTMLFormElement): string {
  const parts: string[] = [];
  for (const [key, value] of new FormData(form).entries()) {
    parts.push(
      value instanceof File
        ? `${key}=file:${value.name}:${value.size}:${value.lastModified}`
        : `${key}=${value}`,
    );
  }
  return parts.join("&");
}

/**
 * Submit button for the admin content forms that is DISABLED until the form is
 * actually changed (and while the save is in flight). It snapshots the form's
 * initial values on mount, then compares on every input/change so an unedited
 * "Save" can't be clicked. Mirrors SubmitButton's spinner/pending behaviour.
 */
export function DirtySubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
}: DirtySubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialRef = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;

    initialRef.current = snapshot(form);
    setDirty(false);

    const recompute = () => setDirty(snapshot(form) !== initialRef.current);
    form.addEventListener("input", recompute);
    form.addEventListener("change", recompute);
    return () => {
      form.removeEventListener("input", recompute);
      form.removeEventListener("change", recompute);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      className={className}
      type="submit"
      disabled={pending || !dirty}
      aria-busy={pending}
    >
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
