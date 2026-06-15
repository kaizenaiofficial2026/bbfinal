"use client";

import { useState } from "react";

declare global {
  interface Window {
    Checkout?: {
      configure: (options: { session: { id: string } }) => void;
      showPaymentPage: () => void;
    };
  }
}

function loadCheckoutScript(scriptUrl: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.Checkout) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load checkout."));
    document.body.appendChild(script);
  });
}

export default function PayButton({
  token,
  scriptUrl,
}: {
  token: string;
  scriptUrl: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");

          try {
            const response = await fetch("/api/payments/create-session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token }),
            });
            const payload = await response.json();

            if (!response.ok) {
              throw new Error(payload.error ?? "Unable to start payment.");
            }

            await loadCheckoutScript(scriptUrl);
            window.Checkout?.configure({ session: { id: payload.sessionId } });
            window.Checkout?.showPaymentPage();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Unable to start payment.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Starting…" : "Pay securely"}
      </button>
      {error ? <p className="form-note" aria-live="polite">{error}</p> : null}
    </div>
  );
}
