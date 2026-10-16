export const APPROVED_PRODUCTION_ORIGIN = "https://agraskbagheltourandtravels.com";

export type SiteOriginMode = "development" | "preview" | "production";

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Resolve a safe origin for canonical metadata and generated public URLs. */
export function resolveSiteOrigin(raw: string | undefined, mode: SiteOriginMode = "development"): string {
  const candidate = raw?.trim() || APPROVED_PRODUCTION_ORIGIN;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error("VITE_SITE_URL must be a valid absolute URL."); }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("VITE_SITE_URL must be an origin without credentials, query, or fragment.");
  }
  if (url.pathname !== "/" && url.pathname !== "") throw new Error("VITE_SITE_URL must not contain a path.");
  const localHttpAllowed = mode === "development" && url.protocol === "http:" && isLoopbackHost(url.hostname);
  if (url.protocol !== "https:" && !localHttpAllowed) {
    throw new Error("VITE_SITE_URL must use HTTPS except for an explicit local loopback origin in development.");
  }
  if (mode === "production" && url.origin !== APPROVED_PRODUCTION_ORIGIN) {
    throw new Error("Production VITE_SITE_URL must equal " + APPROVED_PRODUCTION_ORIGIN + ".");
  }
  return url.origin;
}

export function isHindiIndexingEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}