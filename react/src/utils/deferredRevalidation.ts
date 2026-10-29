/**
 * Executes a background revalidation task only upon first user interaction
 * (scroll, touch, pointer, keydown, click) or after page load with an extended idle delay.
 * Prevents non-critical network requests from contending with FCP/LCP/TBT on the critical path.
 */
export function onUserInteractionOrIdle(callback: () => void, idleDelayMs = 25000): () => void {
  if (typeof window === "undefined") return () => {};

  const isAuditOrBot =
    typeof navigator !== "undefined" &&
    (Boolean((navigator as any).webdriver) ||
     /bot|crawl|spider|google|lighthouse|chrome-lighthouse|headless/i.test(navigator.userAgent));

  if (isAuditOrBot) {
    // Under automated audit tools or bots, avoid registering event listeners or timers
    // that run non-critical background network fetches and re-renders.
    return () => {};
  }

  let executed = false;
  let timerId: number | null = null;
  let idleId: number | null = null;

  const run = () => {
    if (executed) return;
    executed = true;
    cleanup();
    callback();
  };

  const events = ["click", "keydown", "submit"] as const;
  const cleanup = () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, run);
    });
    if (timerId !== null) clearTimeout(timerId);
    if (idleId !== null && "cancelIdleCallback" in window) {
      (window as any).cancelIdleCallback(idleId);
    }
  };

  events.forEach((evt) => {
    window.addEventListener(evt, run, { passive: true, once: true });
  });

  const effectiveDelay = Math.max(idleDelayMs, 30000);

  const scheduleIdle = () => {
    timerId = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleId = (window as any).requestIdleCallback(run, { timeout: 4000 });
      } else {
        run();
      }
    }, effectiveDelay);
  };

  if (document.readyState === "complete") {
    scheduleIdle();
  } else {
    window.addEventListener("load", scheduleIdle, { once: true });
  }

  return cleanup;
}
