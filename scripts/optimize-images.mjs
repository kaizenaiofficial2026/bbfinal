// One-off asset optimizer: caps oversized JPEGs and re-encodes them at a
// sensible quality. Sources are re-written in place (originals remain in git
// history). Run with: node scripts/optimize-images.mjs
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = "public/assets/images";
const MAX_EDGE = 2560; // longest side; covers full-bleed on virtually every display
const QUALITY = 80;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let before = 0;
let after = 0;
let changed = 0;

for await (const file of walk(ROOT)) {
  if (![".jpg", ".jpeg"].includes(extname(file).toLowerCase())) continue;

  const original = (await stat(file)).size;
  const image = sharp(file, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const tooBig = (meta.width ?? 0) > MAX_EDGE || (meta.height ?? 0) > MAX_EDGE;

  const tmp = `${file}.tmp`;
  await image
    .resize({
      width: tooBig ? MAX_EDGE : undefined,
      height: tooBig ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp);

  const optimized = (await stat(tmp)).size;
  before += original;

  // Keep whichever is smaller; never regress a file.
  if (optimized < original) {
    await rename(tmp, file);
    after += optimized;
    changed += 1;
    const pct = (((original - optimized) / original) * 100).toFixed(0);
    console.log(`  ${file}  ${(original / 1048576).toFixed(2)}MB -> ${(optimized / 1048576).toFixed(2)}MB  (-${pct}%)`);
  } else {
    await unlink(tmp);
    after += original;
  }
}

console.log(
  `\nOptimized ${changed} images. Total ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB ` +
    `(saved ${((before - after) / 1048576).toFixed(1)}MB).`,
);
