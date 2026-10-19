import type { ReactNode } from "react";
import { Header, LeadBar, RadialDock, Footer, SkipLink } from "../components/Chrome";
import { BuddyWidget } from "../components/avatar/BuddyWidget";
import { OAuthErrorBanner } from "../components/OAuthErrorBanner";

interface SiteLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function SiteLayout({ children, currentPath }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <SkipLink />
      <OAuthErrorBanner />
      <Header currentPath={currentPath} />
      <div className="pt-12">
        {children}
      </div>
      <LeadBar />
      <RadialDock />
      <BuddyWidget />
      <Footer />
    </div>
  );
}

