"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { ADMIN_SECURITY_INBOX } from "@/lib/admin/constants";
import {
  changeAdminPasswordAction,
  resendAdminPasswordOtpAction,
  startAdminPasswordChangeAction,
} from "../actions";
import { initialAdminPasswordStepState } from "./password-change-state";

export default function AdminPasswordWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [success, setSuccess] = useState("");

  async function submitStep1(formData: FormData) {
    const result = await startAdminPasswordChangeAction(
      initialAdminPasswordStepState,
      formData,
    );
    if (result.ok) {
      setError1("");
      setError2("");
      setSuccess(result.note);
      setStep(2);
    } else {
      setSuccess("");
      setError1(result.note);
    }
  }

  async function submitStep2(formData: FormData) {
    const result = await changeAdminPasswordAction(
      initialAdminPasswordStepState,
      formData,
    );
    if (result.ok) {
      setStep(1);
      setOldPassword("");
      setPassword("");
      setConfirm("");
      setError1("");
      setError2("");
      setSuccess(result.note);
      router.refresh();
    } else {
      setSuccess("");
      setError2(result.note);
    }
  }

  async function resend(formData: FormData) {
    const result = await resendAdminPasswordOtpAction(
      initialAdminPasswordStepState,
      formData,
    );
    if (result.ok) {
      setError2("");
      setSuccess(result.note);
    } else {
      setSuccess("");
      setError2(result.note);
    }
  }

  return (
    <>
      {success ? (
        <p className="admin-note-success" role="status">
          {success}
        </p>
      ) : null}

      <ol className="wizard-steps">
        <li className={step === 1 ? "is-active" : "is-done"}>
          <span aria-hidden="true">1</span>
          Verify password
        </li>
        <li className={step === 2 ? "is-active" : ""}>
          <span aria-hidden="true">2</span>
          Enter code
        </li>
      </ol>

      {step === 1 ? (
        <form className="admin-form" action={submitStep1}>
          <p className="form-hint">
            Enter your current password and choose a new one. The verification
            code will be sent to {ADMIN_SECURITY_INBOX}.
          </p>
          <label>
            Current password
            <input
              name="oldPassword"
              type="password"
              autoComplete="current-password"
              required
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </label>
          <div className="admin-grid-2">
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
          </div>
          {error1 ? (
            <p className="admin-alert" role="alert">
              {error1}
            </p>
          ) : null}
          <div className="admin-actions-row">
            <SubmitButton pendingLabel="Sending…">Continue</SubmitButton>
          </div>
        </form>
      ) : (
        <>
          <form className="admin-form" action={submitStep2}>
            <p className="form-hint">
              Enter the 6-digit code sent to {ADMIN_SECURITY_INBOX}.
            </p>
            <input type="hidden" name="oldPassword" value={oldPassword} />
            <input type="hidden" name="password" value={password} />
            <input type="hidden" name="confirm" value={confirm} />
            <label>
              Verification code
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>
            {error2 ? (
              <p className="admin-alert" role="alert">
                {error2}
              </p>
            ) : null}
            <div className="admin-actions-row">
              <button
                type="button"
                className="btn btn-line"
                onClick={() => {
                  setError2("");
                  setSuccess("");
                  setStep(1);
                }}
              >
                Back
              </button>
              <SubmitButton pendingLabel="Updating…">
                Verify and change password
              </SubmitButton>
            </div>
          </form>
          <form action={resend} className="admin-otp-form">
            <SubmitButton pendingLabel="Sending…" className="btn btn-line">
              Resend code
            </SubmitButton>
          </form>
        </>
      )}
    </>
  );
}
