const prefetchedUrls = new Set<string>();

/**
 * Fallback speculative prefetcher for browsers without native Speculation Rules support.
 * When the Speculation Rules API is supported (Chromium 109+), native speculative
 * execution runs at the browser engine level with zero DOM churn.
 */
export function prefetchDocument(url: string): void {
  // If Speculation Rules API is supported, the browser handles speculative fetching
  // natively via the document-level rule without manual DOM injection.
  if (
    typeof HTMLScriptElement !== "undefined" &&
    typeof HTMLScriptElement.supports === "function" &&
    HTMLScriptElement.supports("speculationrules")
  ) {
    return;
  }

  if (
    !url ||
    prefetchedUrls.has(url) ||
    url.startsWith("#") ||
    url.startsWith("tel:") ||
    url.startsWith("mailto:") ||
    url.startsWith("https://wa.me") ||
    url.startsWith("/book") ||
    url.startsWith("/booking") ||
    url.startsWith("/auth") ||
    url.startsWith("/login") ||
    url.startsWith("/my-bookings") ||
    url.startsWith("/payment") ||
    url.includes("/admin")
  ) {
    return;
  }

  prefetchedUrls.add(url);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}
