"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TermsContent } from "./TermsContent";

/**
 * Terms & Conditions shown in a popup modal instead of navigating to the `/terms`
 * page in a new tab. `children` is the inline trigger text (e.g. "terms and
 * conditions"), styled as a link via `.terms-link`.
 */
export function TermsDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="terms-link">
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="terms-dialog sm:max-w-2xl gap-0 p-0 max-h-[85vh] grid-rows-[auto_1fr]">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-lg">Terms &amp; Conditions</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <TermsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
