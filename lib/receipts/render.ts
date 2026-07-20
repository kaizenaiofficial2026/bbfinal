"use client";

/**
 * Browser-side renderers for a receipt layout. Both walk the SAME draw ops
 * (receipt-layout.ts) so the PDF and the JPEG always show the same document.
 *
 * jsPDF is imported dynamically: it's only needed when an admin actually clicks
 * Export, so it never lands in the page bundle.
 */

import { COLORS, layoutReceipt, type DrawOp } from "./receipt-layout";
import type { Receipt } from "./receipt-model";

/** Oversampling for the JPEG so text stays crisp on retina screens and in print. */
const JPEG_SCALE = 2;
const JPEG_QUALITY = 0.94;

const FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif';

function canvasFont(size: number, bold?: boolean): string {
  return `${bold ? "600 " : ""}${size}px ${FONT_STACK}`;
}

/**
 * Pre-load every image the layout references, keyed by src. Both backends need
 * the bitmap up front — canvas can only draw a decoded image, and jsPDF needs a
 * data URL. Fetching once here keeps the two paths identical.
 *
 * A logo that fails to load must not fail the whole export, so a broken image
 * resolves to `null` and is simply skipped when painting.
 */
async function loadImages(
  ops: DrawOp[],
): Promise<Map<string, { image: HTMLImageElement; dataUrl: string } | null>> {
  const sources = new Set(
    ops.filter((op) => op.kind === "image").map((op) => op.src),
  );
  const entries = await Promise.all(
    [...sources].map(async (src) => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`${response.status}`);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("decode failed"));
          img.src = dataUrl;
        });
        return [src, { image, dataUrl }] as const;
      } catch {
        return [src, null] as const;
      }
    }),
  );
  return new Map(entries);
}

/** Draw the ops onto a 2D context (used for the JPEG, and as the PDF's twin). */
function paintCanvas(
  ops: DrawOp[],
  ctx: CanvasRenderingContext2D,
  images: Map<string, { image: HTMLImageElement; dataUrl: string } | null>,
) {
  // Canvas draws text from the BASELINE by default; the layout's y is the text's
  // baseline too, so alignment matches the PDF backend exactly.
  ctx.textBaseline = "alphabetic";

  for (const op of ops) {
    if (op.kind === "image") {
      const asset = images.get(op.src);
      if (asset) ctx.drawImage(asset.image, op.x, op.y, op.width, op.height);
      continue;
    }
    if (op.kind === "rect") {
      const radius = op.radius ?? 0;
      ctx.beginPath();
      if (radius > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(op.x, op.y, op.width, op.height, radius);
      } else {
        ctx.rect(op.x, op.y, op.width, op.height);
      }
      if (op.color) {
        ctx.fillStyle = op.color;
        ctx.fill();
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      continue;
    }
    if (op.kind === "line") {
      ctx.strokeStyle = op.color;
      ctx.lineWidth = 1;
      // Half-pixel offset keeps a 1px rule from blurring across two rows.
      const y = Math.round(op.y) + 0.5;
      ctx.beginPath();
      ctx.moveTo(op.x, y);
      ctx.lineTo(op.x + op.width, y);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = op.color ?? COLORS.ink;
    ctx.font = canvasFont(op.size, op.bold);
    ctx.textAlign = op.align === "right" ? "right" : "left";
    ctx.fillText(op.text, op.x, op.y);
  }
}

/** Render the receipt to a JPEG blob. */
export async function renderReceiptJpeg(receipt: Receipt): Promise<Blob> {
  const { ops, width, height } = layoutReceipt(receipt);
  const images = await loadImages(ops);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * JPEG_SCALE);
  canvas.height = Math.ceil(height * JPEG_SCALE);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create the receipt image.");

  // JPEG has no alpha — paint an opaque base first or transparent pixels turn
  // black. The layout paints its own page surface on top of this.
  ctx.fillStyle = COLORS.band;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(JPEG_SCALE, JPEG_SCALE);

  paintCanvas(ops, ctx, images);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Could not encode the receipt image.");
  return blob;
}

/** Render the receipt to a PDF blob with real (selectable) text. */
export async function renderReceiptPdf(receipt: Receipt): Promise<Blob> {
  const { ops, width, height } = layoutReceipt(receipt);
  const [images, { jsPDF }] = await Promise.all([
    loadImages(ops),
    import("jspdf"),
  ]);

  const doc = new jsPDF({
    unit: "pt",
    format: [width, height],
    // jsPDF SWAPS the format dimensions to satisfy the orientation, so a
    // hard-coded "portrait" silently transposes a card that's wider than it is
    // tall (a short receipt) and clips its right edge. Derive it instead.
    orientation: height >= width ? "portrait" : "landscape",
    compress: true,
  });

  for (const op of ops) {
    if (op.kind === "image") {
      const asset = images.get(op.src);
      if (asset) {
        doc.addImage(asset.dataUrl, "PNG", op.x, op.y, op.width, op.height);
      }
      continue;
    }
    if (op.kind === "rect") {
      // "FD" = fill then draw the border; "F"/"S" when only one is wanted.
      const style = op.color && op.stroke ? "FD" : op.color ? "F" : "S";
      if (op.color) doc.setFillColor(op.color);
      if (op.stroke) {
        doc.setDrawColor(op.stroke);
        doc.setLineWidth(1);
      }
      if (op.radius) {
        doc.roundedRect(
          op.x,
          op.y,
          op.width,
          op.height,
          op.radius,
          op.radius,
          style,
        );
      } else {
        doc.rect(op.x, op.y, op.width, op.height, style);
      }
      continue;
    }
    if (op.kind === "line") {
      doc.setDrawColor(op.color);
      doc.setLineWidth(1);
      doc.line(op.x, op.y, op.x + op.width, op.y);
      continue;
    }
    doc.setTextColor(op.color ?? COLORS.ink);
    doc.setFont("helvetica", op.bold ? "bold" : "normal");
    doc.setFontSize(op.size);
    // jsPDF measures text from the baseline as well, so the same y works for
    // both backends; `align: right` anchors the string's right edge at x.
    doc.text(op.text, op.x, op.y, {
      align: op.align === "right" ? "right" : "left",
      baseline: "alphabetic",
    });
  }

  doc.setProperties({
    title: `${receipt.reference} receipt`,
    subject: `Payment receipt for ${receipt.reference}`,
    author: receipt.brand.name,
    creator: receipt.brand.name,
  });

  return doc.output("blob");
}

/** Save a blob to the visitor's downloads under `filename`. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next frame — revoking synchronously can cancel the download
  // in some browsers before it starts.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
