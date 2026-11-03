import React, { useEffect, useState } from "react";
import {
  CONSENT_SETTINGS_EVENT,
  gpcSignalsOptOut,
  hasStoredConsent,
  saveConsent,
} from "./cookieConsent";

/**
 * Lightweight cookie consent banner.
 * - Shows once, on first visit (no stored consent).
 * - Accept All / Reject Optional / Customize; optional categories are never preselected.
 * - Fixed bottom banner (no layout shift: it overlays content, position: fixed).
 * - Reopenable via footer "Cookie Settings" (CONSENT_SETTINGS_EVENT).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setGpc(gpcSignalsOptOut());
    if (!hasStoredConsent()) setVisible(true);
    const reopen = () => setVisible(true);
    window.addEventListener(CONSENT_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_SETTINGS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const apply = (a: boolean, m: boolean) => {
    saveConsent(a, m);
    setVisible(false);
    setCustomizing(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-border-warm bg-surface/95 backdrop-blur shadow-lg"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!customizing ? (
          <>
            <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-2xl">
              We use essential cookies to keep the site working. Optional analytics and marketing cookies are only used if you allow them.
              Read our{" "}
              <a className="text-primary underline" href="/cookie-policy/">Cookie Policy</a>{" "}
              and{" "}
              <a className="text-primary underline" href="/privacy-policy/">Privacy Policy</a>.
              {gpc && <span className="block mt-1 text-xs">Your browser sends a Global Privacy Control signal — optional cookies stay off.</span>}
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button type="button" onClick={() => apply(false, false)} className="button button-outline !py-2 !px-4 text-sm min-h-[44px]">
                Reject Optional
              </button>
              <button type="button" onClick={() => setCustomizing(true)} className="button button-outline !py-2 !px-4 text-sm min-h-[44px]">
                Customize
              </button>
              <button type="button" onClick={() => apply(true, true)} className="button button-primary !py-2 !px-4 text-sm min-h-[44px]">
                Accept All
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="max-w-2xl space-y-2">
              <p className="text-body-sm font-bold text-ink-charcoal">Customize cookies</p>
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant min-h-[44px]">
                <input type="checkbox" checked disabled className="h-4 w-4" aria-label="Essential cookies (always on)" />
                <span>Essential — required for sign-in, security and bookings. Always on.</span>
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant min-h-[44px]">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} disabled={gpc} className="h-4 w-4" aria-label="Analytics cookies" />
                <span>Analytics — anonymous usage statistics.</span>
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant min-h-[44px]">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} disabled={gpc} className="h-4 w-4" aria-label="Marketing cookies" />
                <span>Marketing — personalised offers and ad measurement.</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button type="button" onClick={() => setCustomizing(false)} className="button button-outline !py-2 !px-4 text-sm min-h-[44px]">
                Back
              </button>
              <button type="button" onClick={() => apply(analytics, marketing)} className="button button-primary !py-2 !px-4 text-sm min-h-[44px]">
                Save preferences
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CookieConsent;
