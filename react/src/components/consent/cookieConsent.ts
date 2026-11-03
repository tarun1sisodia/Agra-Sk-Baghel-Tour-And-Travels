/**
 * Minimal cookie-consent store for Agra SK Baghel Tour & Travels.
 *
 * - Consent is persisted in localStorage with a version + timestamp.
 * - Optional categories (analytics, marketing) default to OFF and are never
 *   preselected; trackers must check `hasConsent()` before loading.
 * - Global Privacy Control (`navigator.globalPrivacyControl`) is honoured by
 *   treating optional consent as denied.
 */

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "skb-consent-v1";
export const CONSENT_SETTINGS_EVENT = "skb:cookie-settings";

export interface ConsentState {
  version: number;
  decidedAt: string; // ISO timestamp
  analytics: boolean;
  marketing: boolean;
}

export function hasStoredConsent(): boolean {
  if (typeof window === "undefined") return true; // SSR/crawler: no banner, no trackers
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : CONSENT_VERSION,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date(0).toISOString(),
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

/** True only when the user explicitly opted in AND GPC is not signaling opt-out. */
export function hasConsent(category: "analytics" | "marketing"): boolean {
  if (typeof navigator !== "undefined" && (navigator as any).globalPrivacyControl === true) return false;
  const consent = readConsent();
  if (!consent) return false;
  return category === "analytics" ? consent.analytics : consent.marketing;
}

export function gpcSignalsOptOut(): boolean {
  return typeof navigator !== "undefined" && (navigator as any).globalPrivacyControl === true;
}

export function saveConsent(analytics: boolean, marketing: boolean): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    analytics: gpcSignalsOptOut() ? false : analytics,
    marketing: gpcSignalsOptOut() ? false : marketing,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode) — consent simply won't persist
  }
  return state;
}

/** Called from the footer "Cookie Settings" link to reopen the banner. */
export function openCookieSettings(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_SETTINGS_EVENT));
  }
}
