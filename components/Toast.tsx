"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const noop = () => {};

// No-op default so components that call useToast() still work when rendered
// without a provider (e.g. isolated component tests).
const ToastContext = createContext<ToastApi>({
  show: noop,
  success: noop,
  error: noop,
});

export function useToast() {
  return useContext(ToastContext);
}

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      if (!message) return;
      const id = (idRef.current += 1);
      setToasts((list) => [...list, { id, kind, message }]);
      setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toast-container"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role={toast.kind === "error" ? "alert" : "status"}
          >
            <span className={`toast-icon toast-icon-${toast.kind}`}>
              <ToastIcon kind={toast.kind} />
            </span>
            <p className="toast-message">{toast.message}</p>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => remove(toast.id)}
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
        ))}
      </div>
    </ToastContext.Provider>
  );
}
