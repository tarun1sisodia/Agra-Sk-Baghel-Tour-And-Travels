import React from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { openCookieSettings } from "../components/consent/cookieConsent";

export interface CookiePolicyPageProps {
  language?: SupportedLanguage;
}

const LAST_UPDATED = "3 November 2026";

export function CookiePolicyPage({ language = "en" }: CookiePolicyPageProps) {
  const languagePrefix = language === "hi" ? "/hi" : "/en";
  return (
    <main lang={language} className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <header className="bg-sandstone-wash/60 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-4 text-on-surface-variant">
            <a className="text-primary hover:underline" href={`${languagePrefix}/`}>Home</a>
            <span aria-hidden="true">/</span>
            <span>Cookie Policy</span>
          </nav>
          <p className="font-label-caps text-xs uppercase tracking-widest text-primary font-bold mb-2">Cookies and Tracking</p>
          <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight">Cookie Policy</h1>
          <p className="mt-4 text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <section className="space-y-3">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">1. What cookies are</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Cookies are small text files stored on your device by your browser. We also use similar browser storage (localStorage) for the same purposes.
            They help a website remember things between pages and visits — for example that you are signed in, or which display preferences you chose.
          </p>
        </section>

        <section className="space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">2. Cookies and storage we actually use</h2>
          <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed">
            <li><strong className="text-ink-charcoal">Essential (always on):</strong> sign-in and account session tokens set by our authentication provider, security/session state, saved theme preference, in-progress booking form state, and your cookie-consent choice itself (stored as <code>skb-consent-v1</code> in localStorage with a version number and timestamp). These are required for the site to function and cannot be switched off.</li>
            <li><strong className="text-ink-charcoal">Analytics (optional, off by default):</strong> currently none are set by our own code. If anonymous analytics are enabled after you consent, they would be listed here.</li>
            <li><strong className="text-ink-charcoal">Marketing (optional, off by default):</strong> our tag manager (Google Tag Manager) is only loaded after you accept marketing/analytics cookies or interact with the page, and never before consent. It may set Google cookies for measurement.</li>
            <li><strong className="text-ink-charcoal">Third-party:</strong> our CDN/hosting provider may set strictly-necessary operational cookies, and embedded services you interact with (for example Google Sign-In, the payment checkout, or map/autocomplete providers) may set their own cookies under their own policies once loaded.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">3. How long cookies last</h2>
          <p className="text-on-surface-variant leading-relaxed">
            Session cookies disappear when you close your browser. Sign-in session cookies typically last for the duration of your session or until you sign out.
            Your consent choice in localStorage persists until you clear it or change it via Cookie Settings. Provider cookies follow the third party's own retention periods.
          </p>
        </section>

        <section className="space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">4. Managing your preferences</h2>
          <p className="text-on-surface-variant leading-relaxed">
            On your first visit you can choose Accept All, Reject Optional, or Customize individual categories. Optional categories are never preselected.
            If your browser sends a Global Privacy Control (GPC) signal, optional cookies stay off automatically.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            You can change or withdraw consent at any time using the{" "}
            <button type="button" onClick={openCookieSettings} className="text-primary underline min-h-[44px] inline-flex items-center">Cookie Settings</button>{" "}
            link in the footer, or by clearing site data in your browser. Essential cookies cannot be disabled because the site needs them to work.
          </p>
        </section>

        <section className="space-y-3 border-t border-border-warm/60 pt-6">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-ink-charcoal">5. Questions</h2>
          <address className="not-italic rounded-xl border border-border-warm bg-surface-container-lowest p-4 space-y-1 text-on-surface-variant">
            <p><strong className="text-ink-charcoal">Agra SK Baghel Tour &amp; Travels</strong></p>
            <p>{contact.address}</p>
            <p>Email: <a className="text-primary underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>
            <p>Telephone: <a className="text-primary underline" href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a></p>
          </address>
        </section>

        <div className="border-t border-border-warm pt-6 flex flex-wrap gap-4 text-sm">
          <a className="text-primary underline" href="/privacy-policy/">Privacy Policy</a>
          <a className="text-primary underline" href="/terms-and-conditions/">Terms and Conditions</a>
          <a className="text-primary underline" href={`${languagePrefix}/contact/`}>Contact the travel desk</a>
        </div>
      </article>
    </main>
  );
}

export default CookiePolicyPage;
