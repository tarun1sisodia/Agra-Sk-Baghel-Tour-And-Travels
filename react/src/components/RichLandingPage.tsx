import React, { useState } from "react";
import type { RouteDetail } from "../data/seoLandingSlugs";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "./icons";
import {
  PageHeroTitle,
  SectionHeading,
  CardTitle,
  BodyLead,
  BodyText,
  Eyebrow,
  PriceDisplay,
  CtaButton,
} from "./ui/typography";

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
      bestFor: "Solo travelers, couples & small executive trips (budget car rental in Agra)",
    },
    {
      id: "ertiga",
      name: "Maruti Ertiga SUV",
      capacity: "Max 6 Pax + Mid Luggage Bays",
      fare: route.fares.ertiga,
      bestFor: "Families, comfortable legroom & luggage balance (Ertiga taxi booking Agra)",
    },
    {
      id: "crysta",
      name: "Toyota Innova Crysta",
      capacity: "Max 7 Pax + Premium Cabin Bays",
      fare: route.fares.crysta,
      bestFor: "VIP luxury, captain seats & highway comfort (Innova Crysta rental in Agra)",
    },
    {
      id: "tempo",
      name: "Luxury Tempo Traveller",
      capacity: "9 to 16-Seater Force Configuration",
      fare: route.fares.tempo,
      bestFor: "Tourist groups, joint families & pilgrimage yatras (9 12 16 seater tempo traveller Agra)",
    },
  ];

  const isLocal = route.type === "local";

  return (
    <article className="bg-surface font-body-md text-base text-on-surface antialiased min-h-screen">
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
            <a className="text-primary hover:underline" href={isLocal ? "/en/packages/" : "/en/routes/"}>
              {isLocal ? "Local Tour Packages" : "Outstation Routes"}
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold truncate max-w-[240px] sm:max-w-none">
              {route.h1}
            </span>
          </nav>

          {/* Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Eyebrow variant="sandstone">
              <span className="size-2 rounded-full bg-success-jade animate-pulse shrink-0" />
              {isLocal ? "Agra Local Sightseeing • 8–12h Dedicated Chauffeur" : "Agra Hub Intercity Corridor • Tolls & FASTag Included"}
            </Eyebrow>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container border border-border-warm text-ink-charcoal text-xs font-semibold">
              <span className="material-symbols-outlined text-xs text-terracotta-sandstone">verified</span>
              100% Verified Commercial Drivers
            </span>
          </div>

          {/* Main H1 Title (Strictly 36px / 2.25rem scale, exactly one per page) */}
          <PageHeroTitle className="mb-4">
            {route.h1}
          </PageHeroTitle>

          {/* Subheadline Lead Text (18px lead, 1.55 line height) */}
          <BodyLead className="max-w-3xl mb-6">
            {route.subheadline}
          </BodyLead>

          {/* Route Key Specifications Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-xl glass-card-frosted border border-white/60 px-4 py-2 shadow-xs">
              <span className="material-symbols-outlined text-terracotta-sandstone text-base">alt_route</span>
              <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                <strong>Distance:</strong> {route.distance}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl glass-card-frosted border border-white/60 px-4 py-2 shadow-xs">
              <span className="material-symbols-outlined text-terracotta-sandstone text-base">schedule</span>
              <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                <strong>Duration:</strong> {route.duration}
              </span>
            </div>
            {route.expressway && (
              <div className="inline-flex items-center gap-2 rounded-xl glass-card-frosted border border-white/60 px-4 py-2 shadow-xs">
                <span className="material-symbols-outlined text-terracotta-sandstone text-base">speed</span>
                <span className="text-ink-charcoal text-xs sm:text-sm font-semibold">
                  <strong>Corridor:</strong> {route.expressway}
                </span>
              </div>
            )}
          </div>

          {/* Dual Primary Call-to-Action Buttons (48px min touch target) */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <CtaButton
              href={`tel:${contact.phone}`}
              variant="primary"
              size="large"
              icon="phone_in_talk"
              iconPosition="left"
            >
              {isLocal ? "Direct Local Dispatch" : "Highway Dispatch Desk"} ({contact.phoneDisplay})
            </CtaButton>
            <CtaButton
              href={createWhatsAppLink(isLocal ? "Local Tour Sedan" : "Outstation Express Sedan", route.fares.sedan)}
              variant="whatsapp"
              size="large"
            >
              {isLocal ? "Book Local Chauffeur Now ↗" : "Pre-Book Outstation Transfer ↗"}
            </CtaButton>
            <CtaButton
              href="/book.html"
              variant="outline"
              size="default"
              icon="arrow_forward"
              iconPosition="right"
            >
              Instant Online Booking (28% Deposit)
            </CtaButton>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        {/* 2. TRANSPARENT FARE TABLE (Section Heading <h2> at 28px / 1.75rem) */}
        <section className="glass-card-frosted border border-white/60 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="mb-6">
            <Eyebrow variant="sandstone" className="mb-1">
              Guaranteed Upfront Pricing
            </Eyebrow>
            <SectionHeading className="mt-1">
              Fixed Real-Time Upfront Pricing ({isLocal ? "Local Sightseeing Taxi in Agra" : "Outstation Taxi Service from Agra"})
            </SectionHeading>
            <BodyText className="mt-2">
              ⚠️ All quoted fares are 100% transparent and <strong>inclusive of state vehicle permits, Yamuna Expressway / highway toll taxes, and commercial FASTag charges</strong>. Zero hidden driver allowances or roadside surprises.
            </BodyText>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 backdrop-blur-sm shadow-xs">
            <table className="w-full border-collapse text-left text-sm sm:text-base">
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
                      <div className="text-xs sm:text-sm text-on-surface-variant font-normal mt-0.5">{tier.bestFor}</div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-sm">
                      {tier.capacity}
                    </td>
                    <td className="py-4 px-4 font-bold text-terracotta-deep text-lg">
                      <PriceDisplay amount={tier.fare} className="text-terracotta-deep text-lg" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <CtaButton
                        href={createWhatsAppLink(tier.name, tier.fare)}
                        variant="secondary"
                        size="compact"
                        icon={<WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />}
                        iconPosition="left"
                      >
                        Reserve Now →
                      </CtaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-3 italic">
            * Multi-day or customized return journeys are eligible for flat-rate day extension discounts. Contact central dispatch for tailor-made itineraries.
          </p>

          {/* CONDITIONAL LAYOUT VARIATION BOX (Local vs. Inter-City) */}
          {isLocal ? (
            <div className="mt-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-800 text-xl">schedule</span>
                <CardTitle className="text-amber-950">
                  ⏱️ Local Sightseeing Flex Policies &amp; Inclusions:
                </CardTitle>
              </div>
              <ul className="space-y-2.5 text-base text-amber-950 leading-[1.6] font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Dedicated Chauffeur &amp; AC Vehicle:</strong> The vehicle remains 100% dedicated to your party throughout the full booking tenure. No shared rides or detour interruptions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Transparent Extension Rates:</strong> Extend beyond standard package limits at a flat ₹120/hour or ₹12/km. Zero tourist-trap shop stops or forced commissions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Flexible Itinerary &amp; Route Ordering:</strong> You decide when to visit each monument. Take sunset halts at Mehtab Bagh or morning sunrise tours at Taj Mahal at your own leisure.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Station &amp; Hotel Pickups:</strong> Guaranteed on-time pickups from Agra Cantt Railway Station (AGC), Raja Ki Mandi, or any hotel along Fatehabad Road and Taj Nagri with zero waiting penalties.</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-800 text-xl">verified_user</span>
                <CardTitle className="text-emerald-950">
                  🛣️ Outstation Highway Safety &amp; All-Inclusive Inclusions:
                </CardTitle>
              </div>
              <ul className="space-y-2.5 text-base text-emerald-950 leading-[1.6] font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>All-Inclusive Fixed Fare:</strong> State border entry permits (Delhi, Haryana, Rajasthan, MP, UP), expressway toll plazas, and commercial FASTag taxes are 100% included upfront. Zero driver DA or night surcharges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Highway Safety Compliant Fleet:</strong> Modern commercial fleet equipped with dual-zone climate control, calibrated speed-limiters, GPS navigation, and seasoned highway-certified chauffeurs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Sanitized Expressway Rest Stops:</strong> Chauffeur halts only at vetted food oasis plazas (e.g. Yamuna Expressway Milestone 95, NH21 Midways) featuring clean family washrooms and branded dining.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-800 font-bold shrink-0 text-base">✓</span>
                  <span><strong>Zero-Penalty Flight &amp; Trip Rescheduling:</strong> Free cancellation or departure reschedule up to 6 hours before dispatch for airport drops and long-haul inter-city transit.</span>
                </li>
              </ul>
            </div>
          )}
        </section>

        {/* 3. ROUTE HIGHLIGHTS & ITINERARY BREAKDOWN */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Landmarks Featured */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-terracotta-sandstone text-xl">location_on</span>
                <CardTitle>
                  {isLocal ? "Key Heritage Monuments & Drop Points" : "Key Highway Nodes & Terminal Drops"}
                </CardTitle>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-4">
                {isLocal
                  ? "Primary monuments and verified drop coordinates included in this local tour:"
                  : "Key terminal destinations, major junctions, and drop-off coordinates:"}
              </p>
              <ul className="space-y-3">
                {route.landmarks.map((landmark, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-base text-ink-charcoal font-medium leading-[1.6]">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-sm mt-1 shrink-0">
                      check_circle
                    </span>
                    <span>{landmark}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-border-warm/60 text-xs sm:text-sm text-on-surface-variant">
              {isLocal
                ? "Door-to-door transit to any hotel, Agra Cantt station, or homestay within Agra city limits."
                : "Direct doorstep drop to any corporate hub, terminal gate, or residential sector in the destination region."}
            </div>
          </div>

          {/* Planned Rest Stops */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-terracotta-sandstone text-xl">local_cafe</span>
                <CardTitle>
                  {isLocal ? "Recommended Route Halts & Artisan Hubs" : "Planned Expressway Food Plazas & Rest Stops"}
                </CardTitle>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-4">
                {isLocal
                  ? "Curated stops for authentic Agra marble craft, petha sweets, and street food:"
                  : "Hand-picked hygienic expressway food courts, refueling bays, and sanitization points:"}
              </p>
              <ul className="space-y-3">
                {route.stops.map((stop, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-base text-on-surface-variant leading-[1.6]">
                    <span className="material-symbols-outlined text-secondary text-sm mt-1 shrink-0">
                      restaurant
                    </span>
                    <span>{stop}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-border-warm/60 text-xs sm:text-sm text-on-surface-variant">
              {isLocal
                ? "Drivers halt only at genuine artisan hubs and hygienic cafes with clean amenities."
                : "Chauffeurs halt strictly at vetted, family-friendly expressway plazas with clean washrooms and multi-cuisine restaurants."}
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE BOOKING CTA & VALUE PROPOSITION */}
        <section className="bg-surface-container-low border border-border-warm rounded-2xl p-6 sm:p-8 text-center shadow-xs">
          <div className="max-w-2xl mx-auto space-y-3">
            <Eyebrow variant="sandstone">
              {isLocal ? "Agra Sightseeing Chauffeur Desk" : "Inter-City Highway Transit"}
            </Eyebrow>
            <SectionHeading className="text-xl sm:text-2xl">
              {isLocal ? "Ready to Explore the Taj Mahal & Historic Agra?" : "Ready to Confirm Your Outstation or Airport Cab?"}
            </SectionHeading>
            <BodyText>
              {isLocal
                ? "Experience zero waiting delays, police-verified local chauffeurs, clean dual-zone air conditioning, and transparent hourly/daily billing."
                : "Travel in high-speed comfort with police-verified commercial chauffeurs, pre-cleared toll passes, and 100% transparent upfront billing."}
            </BodyText>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-3">
              <CtaButton
                href={`tel:${contact.phone}`}
                variant="primary"
                icon="call"
                iconPosition="left"
              >
                Call Travel Desk ({contact.phoneDisplay})
              </CtaButton>
              <CtaButton
                href={createWhatsAppLink(isLocal ? "Sightseeing Vehicle" : "Highway Fleet", route.fares.sedan)}
                variant="whatsapp"
              >
                {isLocal ? "Lock Price via WhatsApp ↗" : "Pre-Book via WhatsApp ↗"}
              </CtaButton>
            </div>
          </div>
        </section>

        {/* 5. STRUCTURED FAQ ACCORDION HUB */}
        <section className="bg-surface-container-lowest border border-border-warm rounded-2xl p-5 sm:p-8 shadow-xs">
          <div className="mb-6">
            <Eyebrow variant="sandstone" className="mb-1">
              Traveler Clarifications
            </Eyebrow>
            <SectionHeading className="mt-1">
              Frequently Asked Questions
            </SectionHeading>
            <BodyText className="mt-1">
              Direct, verified answers regarding route timings, toll taxes, pickup guarantees, and vehicle capacities.
            </BodyText>
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
                    <CardTitle className="text-base sm:text-lg">
                      ❓ {faq.question}
                    </CardTitle>
                    <span className="material-symbols-outlined text-primary text-lg shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <BodyText className="p-4 pt-0 border-t border-border-warm/40 mt-1">
                      {faq.answer}
                    </BodyText>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border-warm/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm sm:text-base font-semibold text-ink-charcoal">
                Need a customized multi-city circuit, tour package, or outstation cab?
              </p>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Our Taj Ganj dispatch controller assists you 24 hours a day with personalized vehicle arrangements.
              </p>
            </div>
            <a
              href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hi Agra SK Baghel Tour & Travels, I need custom pricing for ${route.h1}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <span>Chat with Dispatch Specialist ↗</span>
            </a>
          </div>
        </section>

        {/* 6. LOCAL SEO & BUSINESS PROFILE CITATION CARD (Explicit NAP Differentiation) */}
        <section className="bg-surface-container-low border border-border-warm rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-2 max-w-xl">
              <Eyebrow variant="sandstone">
                Official Registered Tourist Transport
              </Eyebrow>
              <CardTitle className="text-xl sm:text-[1.375rem] mt-1">
                Agra SK Baghel Tour and Travels — Operations &amp; Dispatch Offices
              </CardTitle>
              <BodyText>
                Operating government-approved tourist commercial fleets across Agra and North India. For inquiries, hotel pickups, or airport dispatches, connect with our centralized teams:
              </BodyText>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/80">
                  <div className="font-bold text-ink-charcoal flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-base">storefront</span>
                    <span>Taj Ganj Front Office</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    450m from Taj Mahal Eastern Gate, Taj Ganj, Agra, Uttar Pradesh 282001 (Customer bookings, guide coordination &amp; immediate tourist dispatch)
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/80">
                  <div className="font-bold text-ink-charcoal flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-base">build_circle</span>
                    <span>Registered Fleet Garage</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    1 Nandlalpur, Hathras Road, near Khusum Nagla, Agra, Uttar Pradesh 282006 (Maintenance, vehicle sanitization &amp; driver fleet depot)
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
              <CtaButton
                href={`tel:${contact.phone}`}
                variant="primary"
                icon="call"
                iconPosition="left"
              >
                24×7 Dispatch: {contact.phoneDisplay}
              </CtaButton>
              <CtaButton
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hello Agra SK Baghel Tour & Travels, I want to confirm taxi availability.")}`}
                variant="whatsapp"
              >
                Instant WhatsApp Desk
              </CtaButton>
            </div>
          </div>
        </section>

        {/* 7. INTERNAL LINKING & SIBLING DISCOVERY */}
        <nav aria-label="Explore Related Travel Options" className="pt-4 border-t border-border-warm/60">
          <p className="text-xs font-bold text-ink-charcoal uppercase tracking-wider mb-3 font-label-caps">
            Explore Related Services &amp; Routes from Agra Hub:
          </p>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <a
              href="/en/routes/"
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              All Outstation Cab Routes
            </a>
            <a
              href="/en/packages/"
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              Taj Mahal &amp; Agra Local Packages
            </a>
            <a
              href="/en/fleet/"
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              Fleet &amp; Tempo Travellers
            </a>
            <a
              href="/en/contact/"
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-ink-charcoal font-semibold border border-border-warm transition-colors"
            >
              24×7 Taj Ganj Dispatch Desk
            </a>
            <a
              href="/book.html"
              className="px-3.5 py-2 rounded-lg bg-terracotta-deep/10 text-terracotta-deep hover:bg-terracotta-deep hover:text-white font-bold border border-terracotta-deep/20 transition-colors"
            >
              Instant Booking Engine
            </a>
          </div>
        </nav>
      </main>
    </article>
  );
};
