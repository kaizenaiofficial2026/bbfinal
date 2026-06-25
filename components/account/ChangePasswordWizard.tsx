"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  changeCustomerPasswordAction,
  resendCustomerPasswordOtpAction,
  startCustomerPasswordChangeAction,
} from "@/app/[locale]/account/password-actions";
import { initialPasswordStepState } from "@/app/[locale]/account/password-change-state";
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";

/**
 * Two-step "change password" wizard.
 *  Step 1 — verify the current password + choose a new one (×2). On success the
 *           server emails a 6-digit code.
 *  Step 2 — enter that code to finish. The current/new passwords are carried in
 *           client state (the user's own browser) and re-submitted with the code.
 *
 * Each step is a plain async form action, so `useFormStatus` (inside
 * SubmitButton) drives the spinner and all state updates happen in the
 * event-driven handler — never in an effect.
 */
export default function ChangePasswordWizard({ email }: { email: string }) {
  const t = useTranslations("auth");
  const toast = useToast();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");

  async function submitStep1(formData: FormData) {
    const result = await startCustomerPasswordChangeAction(
      initialPasswordStepState,
      formData,
    );
    if (result.ok) {
      setError1("");
      setStep(2);
      toast.success(result.note);
    } else {
      setError1(result.note);
      toast.error(result.note);
    }
  }

  async function submitStep2(formData: FormData) {
    const result = await changeCustomerPasswordAction(
      initialPasswordStepState,
      formData,
    );
    if (result.ok) {
      toast.success(result.note);
      setStep(1);
      setOldPassword("");
      setPassword("");
      setConfirm("");
      setError1("");
      setError2("");
      router.refresh();
    } else {
      setError2(result.note);
      toast.error(result.note);
    }
  }

  async function resend(formData: FormData) {
    const result = await resendCustomerPasswordOtpAction(
      initialPasswordStepState,
      formData,
    );
    if (result.ok) toast.success(result.note);
    else toast.error(result.note);
  }

  return (
    <section className="account-panel">
      <div className="account-panel-head">
        <h3 className="account-panel-title">{t("changePasswordTitle")}</h3>
      </div>

      <ol className="wizard-steps">
        <li className={step === 1 ? "is-active" : "is-done"}>
          <span aria-hidden="true">1</span>
          {t("step1Title")}
        </li>
        <li className={step === 2 ? "is-active" : ""}>
          <span aria-hidden="true">2</span>
          {t("step2Title")}
        </li>
      </ol>

      {step === 1 ? (
        <form className="account-security-form" action={submitStep1}>
          <p className="account-panel-note">{t("step1Hint")}</p>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="cp-old">{t("currentPassword")}</label>
              <input
                id="cp-old"
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                required
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="cp-new">{t("newPassword")}</label>
              <input
                id="cp-new"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="cp-confirm">{t("confirmPassword")}</label>
              <input
                id="cp-confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          </div>
          {error1 ? (
            <p className="form-note is-error" role="alert">
              {error1}
            </p>
          ) : null}
          <div className="account-form-actions">
            <SubmitButton className="btn btn-primary">
              {t("continueLabel")}
            </SubmitButton>
          </div>
        </form>
      ) : (
        <>
          <form className="account-security-form" action={submitStep2}>
            <p className="account-panel-note">{t("step2Hint", { email })}</p>
            <input type="hidden" name="oldPassword" value={oldPassword} />
            <input type="hidden" name="password" value={password} />
            <input type="hidden" name="confirm" value={confirm} />
            <div className="form-field full">
              <label htmlFor="cp-code">{t("codeLabel")}</label>
              <input
                id="cp-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </div>
            {error2 ? (
              <p className="form-note is-error" role="alert">
                {error2}
              </p>
            ) : null}
            <div className="account-form-actions">
              <button
                type="button"
                className="btn btn-line"
                onClick={() => {
                  setError2("");
                  setStep(1);
                }}
              >
                {t("backLabel")}
              </button>
              <SubmitButton className="btn btn-primary">
                {t("verifyChangeLabel")}
              </SubmitButton>
            </div>
          </form>
          <form action={resend} className="account-otp-form">
            <SubmitButton className="btn btn-line">{t("resendCode")}</SubmitButton>
          </form>
        </>
      )}
    </section>
  );
}
