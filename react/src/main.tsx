import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "@/app/App";
import { AppErrorBoundary } from "@/AppErrorBoundary";
import { assertCatalogueInvariants } from "@/data/parity";
import "@/styles/fonts.css";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "@/styles/global.css";
import "@/styles/heritage-animations.css";
import { initDeferredIcons, initDeferredGTM } from "@/app/headScripts";

// Deferred icon font & analytics initializers (extracted from index.html for strict CSP)
initDeferredIcons();
initDeferredGTM();

// Service Worker registration for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);
        // Update check
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('New content available. Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

if (import.meta.env.DEV) {
  try {
    assertCatalogueInvariants();
  } catch (e) {
    console.warn("Catalogue invariant check warning:", e);
  }
}

const appTree = (
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);

if (root.hasChildNodes()) {
  let isHydrated = false;
  const doHydrate = () => {
    if (isHydrated) return;
    isHydrated = true;
    cleanup();
    hydrateRoot(root, appTree);
  };

  const userEvents = ["click", "touchstart", "scroll", "keydown", "pointerdown"] as const;
  const cleanup = () => {
    userEvents.forEach((evt) => window.removeEventListener(evt, doHydrate));
  };
  userEvents.forEach((evt) => window.addEventListener(evt, doHydrate, { passive: true, once: true }));

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(doHydrate, { timeout: 2500 });
  } else {
    setTimeout(doHydrate, 1200);
  }
} else {
  createRoot(root).render(appTree);
}
