/**
 * Responsive srcset helpers for /assets/packages/* cover images.
 * The repo ships 480w / 768w / full variants (webp + avif) for each package
 * cover; cards display at ~384px, so the full 1312px file is wasted bytes.
 */

/** "…/mathura.webp" -> "…/mathura-480.webp, …/mathura-768.webp 768w, …/mathura.webp 1312w" */
export function webpSrcSet(path: string): string {
  const base = path.replace(/\.webp$/, "");
  return `${base}-480.webp 480w, ${base}-768.webp 768w, ${base}.webp 1312w`;
}

/** AVIF-first <source> srcset with webp fallback via the plain src. */
export function avifSrcSet(path: string): string {
  const base = path.replace(/\.webp$/, "");
  return `${base}-480.avif 480w, ${base}-768.avif 768w, ${base}.avif 1312w`;
}

export const PACKAGE_CARD_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px";
