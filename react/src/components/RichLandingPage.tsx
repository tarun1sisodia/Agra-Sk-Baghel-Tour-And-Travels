import React, { useState } from "react";
import type { RouteDetail } from "../data/seoLandingSlugs";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "./icons";

interface RichLandingPageProps {
  route: RouteDetail;
}

export const RichLandingPage: React.FC<RichLandingPageProps> = ({ route }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const createWhatsAppLink = (vehicleName: string, fare: number) => {
    const text = encodeURIComponent(
      `Hello Agra SK Baghel Tour & Travels, I want to book a ${vehicleName} for "${route.h1}". Quoted fare: ₹${fare.toLocaleString("en-IN")}. Please confirm vehicle and driver availability.`
    );
    return `https://wa.me/${contact.whatsapp}?text=${text}`;
  };

  const canonicalUrl = `https://agraskbagheltourandtravels.com/en/${route.slug}/`;

  // Schema.org structured graph for Google rich results (Service + LocalBusiness + FAQPage + BreadcrumbList)
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        name: route.h1,
        serviceType: route.type === "local" ? "Local Sightseeing Taxi" : "Outstation Taxi Service",
        provider: {
          "@type": "LocalBusiness",
          name: "Agra SK Baghel Tour and Travels",
          telephone: contact.phone,
          email: contact.email,
          url: "https://agraskbagheltourandtravels.com/",
          address: {
            "@type": "PostalAddress",
            streetAddress: contact.dispatchOffice.streetAddress,
            addressLocality: contact.dispatchOffice.locality,
            addressRegion: contact.dispatchOffice.region,
            postalCode: contact.dispatchOffice.postalCode,
            addressCountry: contact.dispatchOffice.country,
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: contact.dispatchOffice.latitude,
            longitude: contact.dispatchOffice.longitude,
          },
        },
        areaServed: [
          { "@type": "City", name: "Agra" },
          { "@type": "AdministrativeArea", name: "Uttar Pradesh" },
          { "@type": "Country", name: "India" },
        ],
        description: route.subheadline,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: route.fares.sedan,
          highPrice: route.fares.tempo,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: route.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://agraskbagheltourandtravels.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: route.type === "local" ? "Local Tour Packages" : "Outstation Routes",
            item: `https://agraskbagheltourandtravels.com/en/${route.type === "local" ? "packages" : "routes"}/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: route.h1,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  const vehicleTiers = [
    {
      id: "sedan",
      name: "Compact Sedan (Dzire / Etios)",
      capacity: "Max 4 Pax + Balanced Luggage",
      fare: route.fares.sedan,
      bestFor: "Solo travelers, couples & small executive trips",
    },
    {
      id: "ertiga",
      name: "Maruti Ertiga SUV",
      capacity: "Max 6 Pax + Mid Luggage Bays",
      fare: route.fares.ertiga,
      bestFor: "Families, comfortable legroom & luggage balance",
    },
    {
      id: "crysta",
      name: "Toyota Innova Crysta",
      capacity: "Max 7 Pax + Premium Cabin Bays",
      fare: route.fares.crysta,
      bestFor: "VIP luxury, captain seats & highway comfort",
    },
    {
      id: "tempo",
      name: "Luxury Tempo Traveller",
      capacity: "9 to 16-Seater Force Configuration",
      fare: route.fares.tempo,
      bestFor: "Tourist groups, joint families & pilgrimage yatras",
    },
  ];

  return (
    <article className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      {/* 1. TARGETED HERO SECTION */}
      <header className="relative bg-surface-container-low border-b border-border-warm/70 pt-8 pb-12 md:py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <a className="text-primary hover:underline" href={route.type === "local" ? "/en/packages/" : "/en/routes/"}>
              {route.type === "local" ? "Local Tour Packages" : "Outstation Routes"}
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold truncate max-w-[240px] sm:max-w-none">
              {route.h1}
            </span>
          </nav>

          {/* Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-deep font-label-caps text-xs font-bold uppercase tracking-wider">
              <span className="size-2 rounded-full bg-success-jade animate-pulse shrink-0" />
              {route.type === "local" ? "Agra Local Sightseeing" : "Agra Hub Intercity Corridor"}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container border border-border-warm text-ink-charcoal text-xs font-semibold">
              <span className="material-symbols-outlined text-xs text-terracotta-sandstone">verified</span>
              100% Verified Drivers
            </span>
          </div>

          {/* Main H1 Title */}
          <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight mb-4">
            {route.h1}
          </h1>

          {/* Subheadline Lead Text */}
          <p className="text-on-surface-variant font-body-lg text-body-lg leading-relaxed max-w-3xl mb-6">
            {route.subheadline}
          </p>

          {/* Route Key Specifications Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-border-warm px-3.5 py-2 shadow-2xs">
              <span className="material-symbols-outlined text-terracotta-sandstone text-base">alt_route</span>
              <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                <strong>Distance:</strong> {route.distance}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-border-warm px-3.5 py-2 shadow-2xs">
              <span className="material-symbols-outlined text-terracotta-sandstone text-base">schedule</span>
              <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                <strong>Duration:</strong> {route.duration}
              </span>
            </div>
            {route.expressway && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-border-warm px-3.5 py-2 shadow-2xs">
                <span className="material-symbols-outlined text-terracotta-sandstone text-base">speed</span>
                <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                  <strong>Corridor:</strong> {route.expressway}
                </span>
              </div>
            )}
          </div>

          {/* Dual Primary Call-to-Action Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-terracotta-deep hover:bg-primary text-white font-label-lg py-3 px-6 rounded-xl transition-all font-bold text-sm shadow-xs active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">phone_in_talk</span>
              <span>Direct Call Dispatch ({contact.phoneDisplay})</span>
            </a>
            <a
              href={createWhatsAppLink("Compact Sedan", route.fares.sedan)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg py-3 px-6 rounded-xl transition-all font-bold text-sm shadow-xs active:scale-[0.98]"
              style={{ color: "#ffffff" }}
            >
              <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>Instant WhatsApp Desk ↗</span>
            </a>
            <a
              href="/book.html"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-border-warm text-ink-charcoal font-label-lg py-3 px-5 rounded-xl transition-all font-semibold text-sm"
            >
              <span>Book Online (28% Deposit)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        {/* 2. TRANSPARENT FARE TABLE */}
        <section className="bg-surface-container-lowest border border-border-warm rounded-2xl p-5 sm:p-8 shadow-xs">
          <div className="mb-6">
            <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
              Guaranteed Upfront Pricing
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-bold tracking-tight">
              Fixed Real-Time Upfront Pricing
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant leading-relaxed">
              ⚠️ All quoted fares are 100% transparent and <strong>inclusive of state vehicle permits, Yamuna Expressway / highway toll taxes, and commercial FASTag charges</strong>. Zero hidden driver allowances or roadside surprises.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-warm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-container border-b border-border-warm text-ink-charcoal font-semibold">
                  <th className="py-3.5 px-4 font-bold">Vehicle Tier</th>
                  <th className="py-3.5 px-4 font-bold">Capacity Details</th>
                  <th className="py-3.5 px-4 font-bold">Guaranteed Fixed Fare</th>
                  <th className="py-3.5 px-4 font-bold text-right">Instant Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {vehicleTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-sandstone-wash/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-ink-charcoal">
                      <div className="font-bold">{tier.name}</div>
                      <div className="text-xs text-on-surface-variant font-normal mt-0.5">{tier.bestFor}</div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant">
                      {tier.capacity}
                    </td>
                    <td className="py-4 px-4 font-bold text-terracotta-deep text-base">
                      ₹{tier.fare.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <a
                        href={createWhatsAppLink(tier.name, tier.fare)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-warm text-xs font-bold text-ink-charcoal hover:text-primary transition-colors"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Reserve Now →</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-on-surface-variant mt-3 italic">
            * Multi-day or customized return journeys are eligible for flat-rate day extension discounts. Contact central dispatch for tailor-made itineraries.
          </p>
        </section>

        {/* 3. ROUTE HIGHLIGHTS & ITINERARY BREAKDOWN (2 CARDS) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Landmarks Featured */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-terracotta-sandstone text-xl">location_on</span>
                <h3 className="font-headline-sm text-lg font-bold text-ink-charcoal">
                  Key Destination Landmarks Featured
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">
                Primary monuments and verified drop coordinates included along this corridor:
              </p>
              <ul className="space-y-3">
                {route.landmarks.map((landmark, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-charcoal font-medium">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-sm mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span>{landmark}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-border-warm/60 text-xs text-on-surface-variant">
              Door-to-door transit to any hotel, airport terminal, or residence within the city limits.
            </div>
          </div>

          {/* Planned Rest Stops */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-terracotta-sandstone text-xl">local_cafe</span>
                <h3 className="font-headline-sm text-lg font-bold text-ink-charcoal">
                  Planned Rest Stops &amp; Route Breaks
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">
                Hand-picked hygienic expressway food courts, refueling bays, and sanitization points:
              </p>
              <ul className="space-y-3">
                {route.stops.map((stop, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-sm mt-0.5 shrink-0">
                      restaurant
                    </span>
                    <span>{stop}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-border-warm/60 text-xs text-on-surface-variant">
              Drivers halt only at vetted, family-friendly rest plazas with clean washrooms and multi-cuisine restaurants.
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE BOOKING CTA & VALUE PROPOSITION */}
        <section className="bg-surface-container-low border border-border-warm rounded-2xl p-6 sm:p-8 text-center shadow-xs">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandstone-wash text-terracotta-deep font-label-caps text-xs font-bold uppercase tracking-wider">
              Ready for Departure?
            </span>
            <h3 className="font-headline-lg text-headline-lg text-ink-charcoal font-bold">
              Ready to Confirm Your Departure Flight or Tour?
            </h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Experience zero waiting delays, police-verified commercial chauffeurs, clean dual-zone air conditioning, and 100% transparent fare billing.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-3">
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-terracotta-deep hover:bg-primary text-white font-label-lg py-3 px-6 rounded-xl transition-all font-bold text-sm shadow-xs"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call Travel Desk ({contact.phoneDisplay})</span>
              </a>
              <a
                href={createWhatsAppLink("Any Fleet Tier", route.fares.sedan)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg py-3 px-6 rounded-xl transition-all font-bold text-sm shadow-xs"
                style={{ color: "#ffffff" }}
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                <span className="text-white" style={{ color: "#ffffff" }}>Lock Price via WhatsApp ↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* 5. STRUCTURED FAQ ACCORDION HUB */}
        <section className="bg-surface-container-lowest border border-border-warm rounded-2xl p-5 sm:p-8 shadow-xs">
          <div className="mb-6">
            <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
              Traveler Clarifications
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Direct, verified answers regarding route timings, toll taxes, pickup guarantees, and vehicle capacities.
            </p>
          </div>

          <div className="space-y-3">
            {route.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border-warm/70 bg-surface-container-lowest overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-headline-sm text-sm sm:text-base font-bold text-ink-charcoal">
                      ❓ {faq.question}
                    </span>
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-body-md text-on-surface-variant leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border-warm/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-ink-charcoal">
                Need a customized multi-city circuit or hotel package?
              </p>
              <p className="text-xs text-on-surface-variant">
                Our Taj Ganj dispatch controller assists you 24 hours a day with personalized vehicle arrangements.
              </p>
            </div>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hi Agra SK Baghel Tour & Travels, I need custom pricing for ${route.h1}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Chat with Dispatch Specialist ↗</span>
            </a>
          </div>
        </section>

        {/* 6. INTERNAL LINKING & SIBLING DISCOVERY */}
        <nav aria-label="Explore Related Travel Options" className="pt-4 border-t border-border-warm/60">
          <p className="text-xs font-bold text-ink-charcoal uppercase tracking-wider mb-3 font-label-caps">
            Explore Related Services &amp; Routes from Agra Hub:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="/en/routes/"
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              All Outstation Cab Routes
            </a>
            <a
              href="/en/packages/"
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              Taj Mahal &amp; Agra Local Packages
            </a>
            <a
              href="/en/fleet/"
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              Fleet &amp; Tempo Travellers
            </a>
            <a
              href="/en/contact/"
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              24×7 Taj Ganj Dispatch Desk
            </a>
            <a
              href="/book.html"
              className="px-3 py-1.5 rounded-lg bg-terracotta-deep/10 text-terracotta-deep hover:bg-terracotta-deep hover:text-white font-bold border border-terracotta-deep/20 transition-colors"
            >
              Instant Booking Engine
            </a>
          </div>
        </nav>
      </main>
    </article>
  );
};
