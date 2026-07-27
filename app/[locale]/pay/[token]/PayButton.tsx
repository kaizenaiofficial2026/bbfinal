"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Spinner from "@/components/Spinner";
import { PrivacyPolicyDialog } from "@/components/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/TermsDialog";

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
  const t = useTranslations("pay");
  const [pending, setPending] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <div className="pay-consents" role="group" aria-label={t("agreements")}>
        <div className="pay-terms">
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            aria-labelledby="agree-terms-label"
          />
          <span id="agree-terms-label">
            {t.rich("agreeTerms", {
              terms: (chunks) => <TermsDialog>{chunks}</TermsDialog>,
            })}
          </span>
        </div>
        <div className="pay-terms">
          <input
            id="agree-privacy"
            type="checkbox"
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
            aria-labelledby="agree-privacy-label"
          />
          <span id="agree-privacy-label">
            {t.rich("agreePrivacy", {
              privacy: (chunks) => (
                <PrivacyPolicyDialog>{chunks}</PrivacyPolicyDialog>
              ),
            })}
          </span>
        </div>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        disabled={pending || !agreedTerms || !agreedPrivacy}
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
              throw new Error(payload.error ?? t("unableStart"));
            }

            await loadCheckoutScript(scriptUrl);
            window.Checkout?.configure({ session: { id: payload.sessionId } });
            window.Checkout?.showPaymentPage();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : t("unableStart"));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? <Spinner /> : null}
        {pending ? t("starting") : t("payNow")}
      </button>
      {error ? <p className="form-note" aria-live="polite">{error}</p> : null}
    </div>
  );
}
