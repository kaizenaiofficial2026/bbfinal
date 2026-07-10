"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TermsContent } from "./TermsContent";

/**
 * Terms & Conditions shown in a popup modal instead of navigating to the `/terms`
 * page in a new tab. `children` is the inline trigger text (e.g. "terms and
 * conditions"), styled as a link via `.terms-link`. The card has a fixed header
 * and an internally scrolling body (see `.terms-dialog*` in globals.css).
 */
export function TermsDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="terms-link">
          {children}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="terms-dialog">
        <div className="terms-dialog-head">
          <DialogTitle className="terms-dialog-title">
            Terms &amp; Conditions
          </DialogTitle>
          <DialogClose className="terms-dialog-close" aria-label="Close">
            ×
          </DialogClose>
        </div>
        <div className="terms-dialog-body">
          <TermsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
