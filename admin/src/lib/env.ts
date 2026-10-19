/**
 * Environment configuration for Admin Operations Desk.
 * Adheres to FIND-019: centralizes environment variables and fallback URLs.
 */
function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export const env = {
  API_BASE_URL:
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" && isLocalHost(window.location.hostname)
      ? "http://localhost:4000"
      : ""),
  CUSTOMER_SITE_URL:
    (import.meta.env.VITE_CUSTOMER_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" && isLocalHost(window.location.hostname)
      ? "http://localhost:5173"
      : "https://skbagheltravels-customer.coccoder999.workers.dev"),
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "") || "",
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "",
  ADMIN_EMAIL: (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() || "",
  IS_DEV: Boolean(import.meta.env.DEV),
} as const;
