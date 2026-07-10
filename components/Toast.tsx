"use client";

import { toast as sonnerToast } from "sonner";
import { Toaster } from "./ui/sonner";

type ToastKind = "success" | "error" | "info";

type ToastApi = {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const AUTO_DISMISS_MS = 4500;

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8v5M12 16.5v.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Render the site's toast card (unchanged markup/classes) inside a Sonner toast.
// Sonner is configured `unstyled` so `.toast*` CSS in globals.css fully controls
// the look; here we only wire the message, kind and dismiss button.
function showToast(message: string, kind: ToastKind) {
  if (!message) return;
  sonnerToast.custom(
    (id) => (
      <div
        className={`toast toast-${kind}`}
        role={kind === "error" ? "alert" : "status"}
      >
        <span className={`toast-icon toast-icon-${kind}`}>
          <ToastIcon kind={kind} />
        </span>
        <p className="toast-message">{message}</p>
        <button
          type="button"
          className="toast-close"
          aria-label="Dismiss"
          onClick={() => sonnerToast.dismiss(id)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    ),
    { duration: AUTO_DISMISS_MS },
  );
}

// Stable module-level API — Sonner's queue is global, so no context is needed.
const toastApi: ToastApi = {
  show: (message, kind = "info") => showToast(message, kind),
  success: (message) => showToast(message, "success"),
  error: (message) => showToast(message, "error"),
};

/**
 * Toast API, unchanged for callers: `const toast = useToast(); toast.success(…)`.
 * Now backed by Sonner (shadcn) instead of a bespoke context/timer.
 */
export function useToast(): ToastApi {
  return toastApi;
}

/**
 * Mounts the Sonner toaster. Kept named `ToastProvider` and used the same way so
 * the two layouts (public + admin) need no change. No longer a React context
 * provider — it simply renders the toaster alongside its children.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Toaster is rendered BEFORE children so Sonner subscribes first: a child that
  // fires a toast in a mount effect (e.g. AuthErrorToast on ?error=) would
  // otherwise emit before the toaster is listening and the toast would be lost.
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}
