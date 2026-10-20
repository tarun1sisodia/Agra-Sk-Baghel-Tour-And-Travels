import React, { useState, useEffect } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import generatedPublishedContent from "../data/generated-published-content.json";
import { getApiBaseUrl } from "../services/api";

export interface TermsPageProps {
  language?: SupportedLanguage;
}

export interface CancellationPolicyItem {
  id: string;
  policyType: string;
  noticePeriodText: string;
  sortOrder: number;
  feeRetainedPercent: number | string;
  refundPercent: number | string;
  ruleText: string;
  refundTimelineNote?: string;
}

const TOC_ITEMS = [
  { id: "sec-fleet", label: "1. Fleet Specifications" },
  { id: "sec-outstation", label: "2. Outstation 300 km/Day Rule" },
  { id: "sec-tolls", label: "3. Tolls & State Taxes" },
  { id: "sec-night", label: "4. Driver Night Allowance" },
  { id: "sec-advance", label: "5. 28% Advance & Refunds" },
  { id: "sec-luggage", label: "6. Luggage & Etiquette" },
  { id: "sec-legal", label: "7. Agra Jurisdiction" },
];

export function TermsPage({ language = "en" }: TermsPageProps) {
  const [policies, setPolicies] = useState<CancellationPolicyItem[]>(
    () => ((generatedPublishedContent as any)?.cancellationPolicies as CancellationPolicyItem[]) || []
  );

  useEffect(() => {
    let active = true;
    const fetchLivePolicies = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/cancellation-policies`);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: CancellationPolicyItem[] };
        if (active && json.data && Array.isArray(json.data) && json.data.length > 0) {
          setPolicies(json.data);
        }
      } catch {
        // Keep baseline snapshot if offline or unreached
      }
    };
    void fetchLivePolicies();
    return () => {
      active = false;
    };
  }, []);

  const cabPolicies = policies.filter((p) => p.policyType === "cab").sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
  const tourPolicies = policies.filter((p) => p.policyType === "tour_package").sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-surface-container-low/70 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold">Terms &amp; Operational Charter</span>
          </nav>

          <div className="max-w-4xl">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-label-md uppercase tracking-wider font-bold inline-block mb-3">
              Standard Commercial Contract
            </span>
            <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight mb-3">
              Terms of Service &amp; Operational Charter
            </h1>
            <p className="text-on-surface-variant font-body-lg text-xs sm:text-title-lg leading-relaxed mb-6">
              Binding operational agreement between Agra SK Baghel Tour and Travels (Agra) and the reserving guest or corporate
              client. Transparent commercial tariffs with zero hidden conditions.
            </p>
          </div>

          {/* Quick Jump Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-label-caps text-xs transition-colors font-bold"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 2. TERMS CONTENT BODY */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Purpose */}
        <div className="p-4 sm:p-5 rounded-xl bg-sandstone-wash/40 border border-border-warm/70">
          <h2 className="font-headline-sm text-sm sm:text-base font-bold text-ink-charcoal mb-2">Charter Purpose &amp; Enforceability</h2>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            This document constitutes a binding operational agreement between <strong>Agra SK Baghel Tour and Travels Agra</strong> and
            the reserving passenger or corporate institution. All chauffeurs, fleet categories, point-to-point drops, and multi-day
            heritage circuits are regulated strictly according to the transparent commercial tariffs established below. No verbal
            modification by individual drivers is recognized.
          </p>
        </div>

        {/* Section 1: Fleet */}
        <div id="sec-fleet" className="scroll-mt-28 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              01
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Fleet Specifications &amp; Allocation</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Every vehicle dispatched carries an active All-India Tourist Permit (AITP), yellow commercial license plates,
            comprehensive commercial passenger insurance, and dual-zone air conditioning. Vehicle tiers are categorized as:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm">
              <h4 className="font-bold text-xs text-ink-charcoal">Sedan (Dzire / Etios)</h4>
              <p className="text-label-lg text-on-surface-variant mt-0.5">4 Passengers · 2 Large Bags · ₹10/km outstation baseline.</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm">
              <h4 className="font-bold text-xs text-ink-charcoal">MPV (Maruti Ertiga)</h4>
              <p className="text-label-lg text-on-surface-variant mt-0.5">6 Passengers · 3 Large Bags · ₹14/km outstation baseline.</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm">
              <h4 className="font-bold text-xs text-ink-charcoal">Executive SUV (Innova Crysta)</h4>
              <p className="text-label-lg text-on-surface-variant mt-0.5">6/7 Passengers · 4 Large Bags · ₹18/km outstation baseline.</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm">
              <h4 className="font-bold text-xs text-ink-charcoal">Group Van (Tempo / Urbania)</h4>
              <p className="text-label-lg text-on-surface-variant mt-0.5">9 to 26 Passengers · Luggage Hold · ₹25–₹34/km baseline.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Outstation 300 km */}
        <div id="sec-outstation" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              02
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Outstation 300 km/Day Rule</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            All multi-day and round-trip outstation itineraries are calculated on a standard commercial baseline of 300 km per
            calendar day (00:00 to 23:59). If the total distance driven across a 2-day trip is 520 km, the minimum billable
            distance charged is 600 km. Any kilometers exceeding 600 km are billed pro-rata at the vehicle rate card.
          </p>
        </div>

        {/* Section 3: Tolls & State Taxes */}
        <div id="sec-tolls" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              03
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Toll Taxes &amp; State Border Clearance</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            One-way fixed rate corridors (e.g. Agra to Delhi IGI Airport, Agra to Jaipur) are all-inclusive of FASTag deductions,
            expressway tolls, and commercial interstate entry taxes. For custom open-ended round-trips, tolls, monument parking,
            and state permits are documented on the official driver trip log and billed at actual government receipt values.
          </p>
        </div>

        {/* Section 4: Night Allowance */}
        <div id="sec-night" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              04
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Driver Night Allowance</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            A fixed night allowance of ₹300 per night applies strictly when the vehicle is driven between 10:00 PM and 6:00 AM,
            or when a chauffeur stays overnight outside Agra city limits. Daytime driving incurs zero driver batta surcharges.
          </p>
        </div>

        {/* Section 5: Advance & Refunds */}
        <div id="sec-advance" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              05
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">28% Token Advance &amp; Cancellation Slabs</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            To secure vehicle booking and chauffeur assignment, a 28% advance token is collected via UPI, credit/debit card, or
            net banking. The 72% balance is paid directly at drop-off.
          </p>
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm space-y-1.5 text-body-md">
            {cabPolicies.length > 0 ? (
              cabPolicies.map((slab, idx) => (
                <div
                  key={slab.id || idx}
                  className={`flex justify-between py-1 ${idx < cabPolicies.length - 1 ? "border-b border-border-warm/40" : ""}`}
                >
                  <span className="font-semibold text-ink-charcoal">{slab.noticePeriodText}:</span>
                  <span
                    className={
                      Number(slab.refundPercent) >= 100
                        ? "text-success-jade font-bold"
                        : Number(slab.refundPercent) > 0
                        ? "text-primary font-bold"
                        : "text-secondary font-bold"
                    }
                  >
                    {Number(slab.refundPercent) === 100
                      ? "100% Full Refund of Token"
                      : Number(slab.refundPercent) === 0
                      ? (slab.ruleText || "Token retained to cover dispatch fuel")
                      : `${slab.refundPercent}% Token Refund (${slab.ruleText})`}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-border-warm/40">
                  <span className="font-semibold text-ink-charcoal">&gt; 24 Hours before Pickup:</span>
                  <span className="text-success-jade font-bold">100% Full Refund of Token</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-warm/40">
                  <span className="font-semibold text-ink-charcoal">6 to 24 Hours before Pickup:</span>
                  <span className="text-primary font-bold">50% Token Refund / 100% Trip Credit</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-ink-charcoal">&lt; 6 Hours / Chauffeur En Route:</span>
                  <span className="text-secondary font-bold">Token retained to cover dispatch fuel</span>
                </div>
              </>
            )}
          </div>
          {tourPolicies.length > 0 && (
            <div className="mt-3 p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm space-y-1.5 text-body-md">
              <h3 className="font-headline-sm text-xs font-bold text-ink-charcoal mb-2">Tour Package Cancellation Slabs</h3>
              {tourPolicies.map((slab, idx) => (
                <div
                  key={slab.id || idx}
                  className={`flex justify-between py-1 ${idx < tourPolicies.length - 1 ? "border-b border-border-warm/40" : ""}`}
                >
                  <span className="font-semibold text-ink-charcoal">{slab.noticePeriodText}:</span>
                  <span
                    className={
                      Number(slab.refundPercent) >= 100
                        ? "text-success-jade font-bold"
                        : Number(slab.refundPercent) > 0
                        ? "text-primary font-bold"
                        : "text-secondary font-bold"
                    }
                  >
                    {Number(slab.refundPercent) === 100
                      ? "100% Refund"
                      : Number(slab.refundPercent) === 0
                      ? (slab.ruleText || "Advance forfeited")
                      : `${slab.refundPercent}% Refund (${slab.ruleText})`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Luggage & Etiquette */}
        <div id="sec-luggage" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              06
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Luggage &amp; Vehicle Etiquette</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            All vehicles are strictly non-smoking. Carrying contraband, illegal narcotics, or weapons is strictly prohibited and
            will result in immediate termination of the trip without refund. To maintain vehicle hygiene and protect guests with
            severe allergies, pets and domestic animals are strictly not permitted inside our vehicles.
          </p>
        </div>

        {/* Section 7: Legal Jurisdiction */}
        <div id="sec-legal" className="scroll-mt-28 space-y-3 border-t border-border-warm/60 pt-6">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
              07
            </span>
            <h2 className="font-headline-md text-sm sm:text-base font-bold text-ink-charcoal">Agra Legal Jurisdiction</h2>
          </div>
          <p className="text-body-md sm:text-xs text-on-surface-variant leading-relaxed">
            Any dispute, controversy, or claim arising out of or relating to services rendered by Agra SK Baghel Tour and Travels shall
            be subject exclusively to the jurisdiction of the competent courts of law located in Agra, Uttar Pradesh, India.
          </p>
        </div>
      </section>
    </div>
  );
}
