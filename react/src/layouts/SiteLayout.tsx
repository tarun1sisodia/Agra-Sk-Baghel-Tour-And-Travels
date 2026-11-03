import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Header, LeadBar, RadialDock, Footer, SkipLink } from "../components/Chrome";
import { OAuthErrorBanner } from "../components/OAuthErrorBanner";
import { CookieConsent } from "../components/consent/CookieConsent";

// The buddy chat widget is non-critical: lazy chunk + mount only after idle/interaction
// so it never contends with FCP/LCP/TBT on the critical path.
const BuddyWidget = lazy(() => import("../components/avatar/BuddyWidget").then((m) => ({ default: m.BuddyWidget })));

function useIdleMount(delayMs = 4000): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isBot =
      Boolean((navigator as any).webdriver) ||
      /bot|crawl|spider|google|lighthouse|headless/i.test(navigator.userAgent);
    if (isBot) {
      setMounted(true); // keep SSR/crawler output complete
      return;
    }
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, delayMs));
    const id = idle(() => setMounted(true));
    const timer = window.setTimeout(() => setMounted(true), delayMs);
    return () => {
      if (typeof (window as any).cancelIdleCallback === "function") (window as any).cancelIdleCallback(id);
      window.clearTimeout(timer);
    };
  }, [delayMs]);
  return mounted;
}

interface SiteLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function SiteLayout({ children, currentPath }: SiteLayoutProps) {
  const mountBuddy = useIdleMount();
  return (
    <div className="app-shell">
      <SkipLink />
      <OAuthErrorBanner />
      <Header currentPath={currentPath} />
      <div className="pt-16">
        {children}
      </div>
      <LeadBar />
      <RadialDock />
      {mountBuddy && (
        <Suspense fallback={null}>
          <BuddyWidget />
        </Suspense>
      )}
      <Footer />
      <CookieConsent />
    </div>
  );
}
