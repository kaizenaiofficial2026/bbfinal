/**
 * One layout, two outputs. The receipt is laid out ONCE as backend-agnostic draw
 * ops in PDF points; the PDF and JPEG renderers just execute them. That's what
 * keeps the two exports pixel-identical instead of drifting apart as the receipt
 * changes.
 *
 * The receipt is a COMPACT CARD, not a sparse full page: the document is sized
 * to the card plus an even margin, so the card is centred with no dead space
 * below it. A long order grows the card downward rather than paginating.
 *
 * Coordinates are top-left origin (y grows downward) — canvas-native, and the
 * PDF renderer works the same way since jsPDF also measures from the top.
 */

import type { Receipt } from "./receipt-model";

export type DrawOp =
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      bold?: boolean;
      color?: string;
      /** `right` treats x as the right edge; the renderer measures the string. */
      align?: "left" | "right";
    }
  | { kind: "line"; x: number; y: number; width: number; color: string }
  | {
      kind: "image";
      /** Same-origin URL the renderers load before painting. */
      src: string;
      x: number;
      /** Top edge (unlike text ops, which anchor to the baseline). */
      y: number;
      width: number;
      height: number;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      /** Fill colour; omit for an outline-only box. */
      color?: string;
      /** Border colour. */
      stroke?: string;
      /** Corner radius, matching the site's rounded surfaces. */
      radius?: number;
    };

/** Brand mark drawn in the receipt header (served from `public/`). */
export const BRAND_LOGO_SRC = "/assets/images/brand/logo.png";

const CARD_WIDTH = 440;
const PAGE_MARGIN = 26;
const CARD_PADDING = 24;

export const PAGE_WIDTH = CARD_WIDTH + PAGE_MARGIN * 2;

const CARD_X = PAGE_MARGIN;
const LEFT = CARD_X + CARD_PADDING;
const RIGHT = CARD_X + CARD_WIDTH - CARD_PADDING;
const INNER_WIDTH = CARD_WIDTH - CARD_PADDING * 2;
/** Quantity column sits between the package name and the amount. */
const QTY_X = RIGHT - 96;

export const COLORS = {
  ink: "#1c1a15",
  muted: "#6b6559",
  gold: "#b3924f",
  line: "#e0ddd4",
  band: "#faf7f0",
  paper: "#ffffff",
  positive: "#1f7a4d",
  positiveSoft: "#e6f2ea",
};

export type ReceiptLayout = {
  ops: DrawOp[];
  width: number;
  height: number;
};

/**
 * Approximate rendered width of a Helvetica string. The layout has no font
 * metrics, but the status pill must be sized around its label — 0.52em per
 * character is close enough for short status words in both backends.
 */
function approxTextWidth(text: string, size: number, bold?: boolean): number {
  return text.length * size * (bold ? 0.56 : 0.52);
}

export function layoutReceipt(receipt: Receipt): ReceiptLayout {
  const body: DrawOp[] = [];
  let y = 0;

  const text = (
    value: string,
    x: number,
    size: number,
    opts: { bold?: boolean; color?: string; align?: "left" | "right" } = {},
  ) => {
    body.push({ kind: "text", x, y, text: value, size, ...opts });
  };

  /** Full-width divider inside the card. */
  const rule = () => {
    body.push({ kind: "line", x: LEFT, y, width: INNER_WIDTH, color: COLORS.line });
  };

  // ── Header: brand mark, reference, status pill ───────────────────────────
  // The logo replaces the old "BEYOND BORDERS" text eyebrow. Natural size is
  // 154×75; drawn at 88×43 so it sits on the same line the caps text occupied.
  y = PAGE_MARGIN + CARD_PADDING;
  body.push({
    kind: "image",
    src: BRAND_LOGO_SRC,
    x: LEFT,
    y,
    width: 88,
    height: 43,
  });

  y += 43 + 20;
  text(receipt.reference, LEFT, 17, { bold: true, color: COLORS.ink });

  // Status pill, vertically centred on the reference line.
  const pillLabel = receipt.payment.status;
  const pillWidth = approxTextWidth(pillLabel, 9, true) + 22;
  const pillHeight = 21;
  body.push({
    kind: "rect",
    x: RIGHT - pillWidth,
    y: y - 15,
    width: pillWidth,
    height: pillHeight,
    color: COLORS.positiveSoft,
    radius: 10.5,
  });
  body.push({
    kind: "text",
    x: RIGHT - pillWidth / 2 + approxTextWidth(pillLabel, 9, true) / 2,
    y: y - 1,
    text: pillLabel,
    size: 9,
    bold: true,
    color: COLORS.positive,
    align: "right",
  });

  y += 14;
  text(`Paid ${receipt.paidAt}`, LEFT, 8.5, { color: COLORS.muted });

  y += 16;
  rule();

  // ── Billing details ──────────────────────────────────────────────────────
  y += 24;
  text("Billing details", LEFT, 12, { bold: true, color: COLORS.ink });

  y += 18;
  text(receipt.customer.name, LEFT, 10.5, { color: COLORS.ink });

  const labelled = (label: string, value: string) => {
    y += 19;
    text(label, LEFT, 8, { bold: true, color: COLORS.muted });
    y += 12;
    text(value, LEFT, 9.5, { color: COLORS.ink });
  };

  labelled("EMAIL", receipt.customer.email);
  labelled("PHONE", receipt.customer.phone);
  // Only shown when the customer record actually holds one, so the receipt
  // never prints an empty "NIC/Passport No" row.
  if (receipt.customer.passportNumber) {
    labelled("NIC / PASSPORT NO", receipt.customer.passportNumber);
  }
  labelled("PAYMENT VIA", receipt.payment.method);

  y += 10;
  text(`Ref ${receipt.payment.reference}`, LEFT, 8, { color: COLORS.muted });

  // ── Items table ──────────────────────────────────────────────────────────
  y += 20;
  rule();

  y += 15;
  text("PACKAGE", LEFT, 8, { bold: true, color: COLORS.muted });
  text("QTY", QTY_X, 8, { bold: true, color: COLORS.muted });
  text("TOTAL", RIGHT, 8, { bold: true, color: COLORS.muted, align: "right" });

  y += 9;
  rule();

  for (const item of receipt.items) {
    y += 20;
    text(item.title, LEFT, 10, { bold: true, color: COLORS.ink });
    text(String(item.travellers), QTY_X, 10, { color: COLORS.ink });
    text(item.amount, RIGHT, 10, { color: COLORS.ink, align: "right" });

    y += 12;
    text(item.dates, LEFT, 8, { color: COLORS.muted });

    if (item.reference) {
      y += 11;
      text(item.reference, LEFT, 8, { color: COLORS.muted });
    }

    y += 12;
    rule();
  }

  // ── Total ────────────────────────────────────────────────────────────────
  y += 22;
  text("Total paid", LEFT, 11, { bold: true, color: COLORS.ink });
  text(receipt.total, RIGHT, 13, {
    bold: true,
    color: COLORS.ink,
    align: "right",
  });

  y += 12;
  body.push({ kind: "line", x: LEFT, y, width: INNER_WIDTH, color: COLORS.gold });

  // ── Footer ───────────────────────────────────────────────────────────────
  y += 22;
  text("Thank you — your payment has been received in full.", LEFT, 8.5, {
    color: COLORS.ink,
  });

  y += 13;
  text(`${receipt.brand.email}  ·  ${receipt.brand.phone}`, LEFT, 8, {
    color: COLORS.muted,
  });

  // The card ends a padding's distance below the last line; the page adds one
  // even margin all round, which is what centres the card.
  const cardHeight = y + CARD_PADDING - PAGE_MARGIN;
  const height = cardHeight + PAGE_MARGIN * 2;

  // Painted back-to-front: page surface, then the card, then the content — so
  // both backends produce the same stack without needing z-order logic.
  const ops: DrawOp[] = [
    {
      kind: "rect",
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height,
      color: COLORS.band,
    },
    {
      kind: "rect",
      x: CARD_X,
      y: PAGE_MARGIN,
      width: CARD_WIDTH,
      height: cardHeight,
      color: COLORS.paper,
      stroke: COLORS.line,
      radius: 10,
    },
    ...body,
  ];

  return { ops, width: PAGE_WIDTH, height };
}
