import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";

export interface NotFoundPageProps {
  language?: SupportedLanguage;
}

export function NotFoundPage({ language = "en" }: NotFoundPageProps) {
  const [search, setSearch] = useState("");

  const popularLinks = [
    { label: "Taj Mahal Sunrise Tour", url: "/en/packages/taj-mahal-sunrise-tour/" },
    { label: "Agra to Delhi Taxi", url: "/en/agra-to-delhi-taxi/" },
    { label: "Agra to Jaipur Cab", url: "/en/agra-to-jaipur-taxi/" },
    { label: "Fleet Showroom", url: "/en/fleet/" },
    { label: "All Tour Packages", url: "/en/packages/" },
    { label: "24x7 Dispatch Desk", url: "/en/contact/" },
  ];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredLinks = normalizedSearch
    ? popularLinks.filter((item) => `${item.label} ${item.url}`.toLowerCase().includes(normalizedSearch))
    : popularLinks;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* 404 HERITAGE DETOUR STAGE */}
      <section className="relative w-full py-space-xl md:py-space-3xl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full bg-sandstone-wash text-primary font-label-caps text-xs uppercase tracking-wider font-bold inline-block">
                Route Diversion · Error 404
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal leading-[1.08] tracking-tight">
                It seems your chauffeur has taken a{" "}
                <span className="text-primary italic font-normal">detour</span>.
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                The page you followed does not exist or may have moved. Our 24×7 booking support is available by phone
                to help you find the right route or tour.
              </p>

              {/* Instant Search / Recovery */}
              <div className="pt-2 max-w-lg space-y-3">
                <div className="relative">
                  <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 top-3 text-icon-20">
                    search
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search routes, packages or fleet..."
                    aria-label="Search route, package, or fleet suggestions"
                    className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest border border-border-warm text-on-surface text-base focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <h2 className="text-xs text-on-surface-variant font-medium m-0 inline">Quick suggestions:</h2>
                  {filteredLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.url}
                      className="inline-flex min-h-[48px] items-center px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-xs text-ink-charcoal font-medium transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  {filteredLinks.length === 0 && (
                    <span role="status" className="text-xs text-on-surface-variant">
                      No matching quick links. Please call dispatch for help.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <a
                  href="/"
                  className="min-h-[48px] px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-icon-18">home</span>
                  <span>Return to Home</span>
                </a>
                <a
                  href={`tel:${contact.phone}`}
                  aria-label={`Call dispatch at ${contact.phoneDisplay}`}
                  className="min-h-[48px] px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-icon-18">call</span>
                  <span>Call dispatch</span>
                </a>
                <a
                  href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hello, I need help with a taxi or tour booking in Agra.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] px-4 py-2.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs active:scale-[0.98]"
                >
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
                  <span className="text-white font-semibold">WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right: Dispatch Support */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-surface-container-low rounded-2xl p-6 sm:p-8 overflow-hidden shadow-xl border border-border-warm/80">
                <div className="absolute -right-4 -bottom-8 font-headline-hero text-display-watermark font-bold text-primary/5 select-none leading-none pointer-events-none">
                  404
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-primary text-white font-label-caps text-label-lg uppercase font-bold">
                      24×7 Dispatch Support
                    </span>
                    <span className="text-xs text-success-jade font-semibold flex items-center gap-1">
                      <span className="size-2 rounded-full bg-success-jade" />
                      Available by phone
                    </span>
                  </div>

                  <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner">
                    <img
                      className="w-full h-full object-cover"
                      src="/assets/fleet/innova.webp"
                      alt="Toyota Innova Crysta tour vehicle"
                      width={1200}
                      height={1050}
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-ivory-surface">
                      <h3 className="font-title-md text-xs font-semibold block m-0">Agra taxi and tour assistance</h3>
                      <a className="font-body-sm text-label-md text-ivory-surface underline" href={`tel:${contact.phone}`}>
                        {contact.phoneDisplay}
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Need roadside assistance or point-to-point transport? Call our 24×7 dispatch hotline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
