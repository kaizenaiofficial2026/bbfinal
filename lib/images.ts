/**
 * Shared image helpers for content rendered from the database (packages,
 * destinations). A row can carry an empty `image`/`hero_image` (e.g. a package
 * saved without uploading one), and passing an empty string to next/image throws
 * "An empty string was passed to the src attribute". `imageSrc` guarantees a
 * non-empty, renderable src by falling back to a bundled asset.
 */
export const FALLBACK_IMAGE = "/assets/images/heroes/hero-poster.jpg";

export function imageSrc(value?: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : FALLBACK_IMAGE;
}
