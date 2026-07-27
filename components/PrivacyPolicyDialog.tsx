"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

/**
 * Checkout-friendly Privacy Policy dialog. It deliberately shares the Terms
 * dialog's presentation so both required agreements behave consistently.
 */
export function PrivacyPolicyDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="terms-link">
          {children}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="terms-dialog"
        aria-describedby={undefined}
      >
        <div className="terms-dialog-head">
          <DialogTitle className="terms-dialog-title">
            Privacy Policy
          </DialogTitle>
          <DialogClose
            className="terms-dialog-close"
            aria-label="Close privacy policy"
          >
            ×
          </DialogClose>
        </div>
        <div className="terms-dialog-body">
          <PrivacyPolicyContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
