"use client";

import { useState } from "react";
import { Input } from "./ui/input";

/**
 * Every native input prop except `type` (owned by the toggle) passes straight
 * through, so this drops into both uncontrolled forms (defaultValue) and
 * controlled ones (value + onChange).
 */
type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  name: string;
  showLabel?: string;
  hideLabel?: string;
  /**
   * `field` (default) is the public auth look; `bare` defers to the unlayered
   * `.admin-form input` rules so the admin panel keeps its own field style.
   */
  variant?: "field" | "bare";
};

/**
 * Password field with a show/hide eye toggle. Used for EVERY password input in
 * the app — public auth, account and admin — so the reveal affordance is
 * consistent wherever someone types a password.
 */
export default function PasswordInput({
  autoComplete = "current-password",
  showLabel = "Show password",
  hideLabel = "Hide password",
  variant = "field",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password">
      <Input
        {...props}
        variant={variant}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? hideLabel : showLabel}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.9 9.9 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.7 3.6M6.1 6.1C4 7.4 2.6 9.3 2 12c1 2.5 5 7 10 7 1.2 0 2.3-.2 3.3-.6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.7"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
