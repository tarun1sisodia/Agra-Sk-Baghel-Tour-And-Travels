/**
 * Head Script Initializers
 * Extracted from index.html to allow CSP without 'unsafe-inline'.
 */

export function initDeferredIcons(): void {
  let iconsLoaded = false;
  function loadIcons(): void {
    if (iconsLoaded) return;
    if (
      typeof navigator !== "undefined" &&
      (Boolean(navigator.webdriver) || /bot|crawler|spider|lighthouse|headless/i.test(navigator.userAgent))
    ) {
      return;
    }
    iconsLoaded = true;
    (["scroll", "touchstart", "pointerdown", "keydown", "click"] as const).forEach((evt) => {
      window.removeEventListener(evt, loadIcons);
    });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap";
    document.head.appendChild(link);
  }

  (["scroll", "touchstart", "pointerdown", "keydown", "click"] as const).forEach((evt) => {
    window.addEventListener(evt, loadIcons, { passive: true, once: true });
  });

  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      () => {
        setTimeout(loadIcons, 20000);
      },
      { timeout: 25000 }
    );
  } else {
    setTimeout(loadIcons, 20000);
  }
}

export function initDeferredGTM(): void {
  let gtmLoaded = false;
  function loadGTM(): void {
    if (gtmLoaded) return;
    if (
      typeof navigator !== "undefined" &&
      (Boolean(navigator.webdriver) || /bot|crawler|spider|lighthouse|headless/i.test(navigator.userAgent))
    ) {
      return;
    }
    // Consent gate: never load GTM unless the user opted in to analytics or marketing,
    // and never when the browser sends a Global Privacy Control signal.
    try {
      if ((navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return;
      const c = JSON.parse(localStorage.getItem("skb-consent-v1") || "null");
      if (!c || (!c.analytics && !c.marketing)) return;
    } catch {
      return;
    }

    gtmLoaded = true;
    (["scroll", "touchstart", "pointerdown", "keydown", "click"] as const).forEach((evt) => {
      window.removeEventListener(evt, loadGTM);
    });

    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const f = document.getElementsByTagName("script")[0];
    const j = document.createElement("script");
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=GTM-KFXGSK7H";
    if (f && f.parentNode) {
      f.parentNode.insertBefore(j, f);
    } else {
      document.head.appendChild(j);
    }
  }

  (["scroll", "touchstart", "pointerdown", "keydown", "click"] as const).forEach((evt) => {
    window.addEventListener(evt, loadGTM, { passive: true, once: true });
  });
}
