/**
 * Responsive srcset helpers for /assets/packages/* cover images.
 * The repo ships 480w / 768w / full variants (webp + avif) for each package
 * cover; cards display at ~384px, so the full 1312px file is wasted bytes.
 */

const RESPONSIVE_PACKAGE_PATHS = new Set([
  "/assets/packages/agra-fort.webp",
  "/assets/packages/golden-triangle.webp",
  "/assets/packages/mathura.webp",
  "/assets/packages/taj-dawn.webp",
]);

/** "…/mathura.webp" -> "…/mathura-480.webp 480w, …/mathura-768.webp 768w, …/mathura.webp 1312w" (only for assets with existing generated cuts) */
export function webpSrcSet(path: string | null | undefined): string | undefined {
  if (!path || !RESPONSIVE_PACKAGE_PATHS.has(path)) {
    return undefined;
  }
  const base = path.replace(/\.webp$/, "");
  return `${base}-480.webp 480w, ${base}-768.webp 768w, ${base}.webp 1312w`;
}

/** AVIF-first <source> srcset with webp fallback via the plain src. */
export function avifSrcSet(path: string | null | undefined): string | undefined {
  if (!path || !RESPONSIVE_PACKAGE_PATHS.has(path)) {
    return undefined;
  }
  const base = path.replace(/\.webp$/, "");
  return `${base}-480.avif 480w, ${base}-768.avif 768w, ${base}.avif 1312w`;
}

export const PACKAGE_CARD_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px";
