"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import {
  downloadBlob,
  renderReceiptJpeg,
  renderReceiptPdf,
} from "@/lib/receipts/render";
import type { Receipt } from "@/lib/receipts/receipt-model";

type Format = "pdf" | "jpeg";

/**
 * Download the payment receipt as a PDF or a JPEG. Rendering happens in the
 * browser from the receipt data the server already resolved, so there's no
 * export endpoint to secure — the data is only ever sent to an admin who can
 * already see this booking.
 */
export function ReceiptExportButtons({ receipt }: { receipt: Receipt }) {
  const toast = useToast();
  const [busy, setBusy] = useState<Format | null>(null);

  async function exportAs(format: Format) {
    if (busy) return;
    setBusy(format);
    try {
      const blob =
        format === "pdf"
          ? await renderReceiptPdf(receipt)
          : await renderReceiptJpeg(receipt);
      downloadBlob(
        blob,
        `${receipt.fileBase}.${format === "pdf" ? "pdf" : "jpg"}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not generate the receipt.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-receipt-actions">
      <span className="admin-receipt-label">Receipt</span>
      <div className="admin-receipt-buttons">
        <button
          type="button"
          className="btn btn-line"
          onClick={() => exportAs("pdf")}
          disabled={busy !== null}
          aria-busy={busy === "pdf"}
        >
          {busy === "pdf" ? "Preparing…" : "PDF"}
        </button>
        <button
          type="button"
          className="btn btn-line"
          onClick={() => exportAs("jpeg")}
          disabled={busy !== null}
          aria-busy={busy === "jpeg"}
        >
          {busy === "jpeg" ? "Preparing…" : "JPEG"}
        </button>
      </div>
    </div>
  );
}
