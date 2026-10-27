import React from "react";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";
import {
  EDITORIAL_TYPOGRAPHY,
  PrimaryButton,
  WhatsAppButton,
} from "../components/layout/EditorialPageTemplate";

interface AboutPageProps {
  language?: "en" | "hi";
}

export function AboutPage({ language = "en" }: AboutPageProps) {
  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Top Breadcrumb Bar */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-on-surface font-semibold">Why Choose Us</span>
            <span className="material-symbols-outlined text-icon-14 text-terracotta-sandstone">chevron_right</span>
            <span className="text-terracotta-sandstone font-medium">The Baghel Standard</span>
          </nav>
        </div>
      </div>

      {/* Hero Chapter: Poetic Classical Modernism */}
      <section className="relative w-full bg-surface pt-space-xl pb-space-2xl overflow-hidden">
        {/* Ambient Heritage Glow */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-sandstone-wash/60 blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            {/* Text Column */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-caps text-body-sm uppercase tracking-widest w-fit font-bold">
                <span className="material-symbols-outlined text-icon-14">verified</span>
                Heritage Chauffeur Ethics Since 2009
              </span>
              <h1 className={EDITORIAL_TYPOGRAPHY.heroH1}>
                Chauffeured Transit as an Art Form.{" "}
                <span className={EDITORIAL_TYPOGRAPHY.heroAccent}>Never an Anonymous Ride.</span>
              </h1>
              <p className={`${EDITORIAL_TYPOGRAPHY.lead} max-w-2xl`}>
                For over 15 years, headquartered directly beside the Taj East Gate in Taj Ganj, Agra SK Baghel Tour and Travels has provided discerning travelers, families, and diplomats with peerless road journeys across
                Agra, the Golden Triangle, and North India.
              </p>

              <div className="pt-space-xs flex flex-wrap items-center gap-space-sm">
                <PrimaryButton href="/book/" size="lg" icon="calendar_month" iconPosition="left">
                  Reserve With 28% Token
                </PrimaryButton>
                <WhatsAppButton
                  size="lg"
                  inquiryText="Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about your chauffeur services in Agra."
                  label="WhatsApp Taj Ganj Desk"
                />
              </div>

              {/* Trust Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-space-md">
                <div className="flex flex-col glass-card-frosted p-3.5 rounded-2xl shadow-xs transition-all hover:-translate-y-0.5">
                  <span className="font-headline-md text-base sm:text-lg text-terracotta-sandstone font-serif font-bold">15+</span>
                  <span className="font-body-sm text-label-md text-on-surface font-semibold">Years in Taj Ganj</span>
                  <span className="text-body-sm text-secondary">Family-run local heritage</span>
                </div>
                <div className="flex flex-col glass-card-frosted p-3.5 rounded-2xl shadow-xs transition-all hover:-translate-y-0.5">
                  <span className="font-headline-md text-base sm:text-lg text-terracotta-sandstone font-serif font-bold">3,800+</span>
                  <span className="font-body-sm text-label-md text-on-surface font-semibold">Verified Expeditions</span>
                  <span className="text-body-sm text-secondary">4.9 / 5 Guest Satisfaction</span>
                </div>
                <div className="flex flex-col glass-card-frosted p-3.5 rounded-2xl shadow-xs transition-all hover:-translate-y-0.5">
                  <span className="font-headline-md text-base sm:text-lg text-terracotta-sandstone font-serif font-bold">100%</span>
                  <span className="font-body-sm text-label-md text-on-surface font-semibold">Yellow-Plate Fleet</span>
                  <span className="text-body-sm text-secondary">Zero illegal white plates</span>
                </div>
                <div className="flex flex-col glass-card-frosted p-3.5 rounded-2xl shadow-xs transition-all hover:-translate-y-0.5">
                  <span className="font-headline-md text-base sm:text-lg text-terracotta-sandstone font-serif font-bold">0</span>
                  <span className="font-body-sm text-label-md text-on-surface font-semibold">Emporium Detours</span>
                  <span className="text-body-sm text-secondary">Zero commission traps</span>
                </div>
              </div>
            </div>

            {/* Visual Column with Asymmetric Editorial Overlay */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl glass-card-frosted p-2 border border-white/60">
                <img
                  className="w-full h-[340px] sm:h-[380px] object-cover rounded-2xl"
                  alt="A pristine Toyota Innova Crysta luxury touring vehicle parked on a scenic road with historic sandstone monuments in the background"
                  src="/assets/fleet/innova.webp"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/fleet/innova.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-ink-midnight/20 to-transparent rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The 6 Pillars of the Baghel Standard */}
      <section className="w-full bg-surface-container-low/60 py-10 sm:py-space-xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          {/* Section Title Header */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8 sm:mb-space-lg">
            <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} mb-1`}>
              The Chauffeur Ethics Protocol
            </span>
            <h2 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} mb-1.5`}>
              Six Sacred Pillars of Our Transit Standard
            </h2>
            <p className={EDITORIAL_TYPOGRAPHY.body}>
              In an industry plagued by bait-and-switch app aggregators and aggressive tourist brokers, we hold an
              unyielding contract with our guests: complete autonomy, total transparency, and unwavering courtesy.
            </p>
          </div>

          {/* 6 Pillars Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Pillar 01 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">01</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">do_not_disturb_on</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>Zero Commission Traps Guarantee</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  Strict contractual prohibition against unsolicited marble, rug, spice, or jewelry emporiums. Your
                  itinerary belongs to you. If a driver forces an unrequested stop, your entire return fare is fully
                  refunded on the spot.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Guest Protection</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">100% Uncompromised Itinerary Integrity</span>
              </div>
            </div>

            {/* Pillar 02 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">02</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">flight_takeoff</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>Punctual Doorstep &amp; Flight Tracking</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  Live radar sync with Delhi IGI Terminal 3 arrivals and Agra Cantt Gatimaan Express. Your chauffeur
                  positions vehicle 15 minutes before touch-down, holding a personalized name placard at the arrival
                  vestibule.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Buffer Guarantee</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">Zero Surcharge for Flight or Rail Delays</span>
              </div>
            </div>

            {/* Pillar 03 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">03</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">badge</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>100% Yellow-Plate Commercial Fleet</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  We never run precarious private "white-plate" personal cars. Every vehicle holds active tourist
                  permits, passenger liability insurance up to ₹1,000,000, and is strictly under 36 months in service
                  age.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Legal Verification</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">All India Tourist Permit (AITP) Certified</span>
              </div>
            </div>

            {/* Pillar 04 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">04</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">person_apron</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>Chauffeur Etiquette &amp; Heritage Fluency</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  Police background verified, crisp formal attire, and non-smoking interiors. Chauffeurs possess minimum
                  7+ years highway mastery, fluent in Hindi &amp; English, trained in discreet guest hospitality.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Chauffeur Standard</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">Bilingual, Courteous &amp; Tobacco-Free</span>
              </div>
            </div>

            {/* Pillar 05 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">05</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">payments</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>Transparent 28% Advance &amp; Fare Lock</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  Confirm bookings with a clean 28% advance token. The balance is paid upon reaching your destination. All
                  Yamuna Expressway and Eastern Peripheral tolls are transparently bundled. Zero surprise return fees.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Financial Safety</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">booking receipt Invoiced • No Cash Shakedowns</span>
              </div>
            </div>

            {/* Pillar 06 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-lg sm:text-xl font-serif text-terracotta-sandstone font-bold">06</span>
                  <span className="material-symbols-outlined text-primary text-icon-22">support_agent</span>
                </div>
                <h3 className={EDITORIAL_TYPOGRAPHY.subH4}>24/7 Taj Ganj Central Control Desk</h3>
                <p className={EDITORIAL_TYPOGRAPHY.compact}>
                  Never get stranded on an automated voicemail robot. Our central garage control desk in Taj Ganj is staffed
                  24 hours a day by human dispatch managers with direct phone and live WhatsApp link to every vehicle.
                </p>
              </div>
              <div className="mt-4 pt-2.5 bg-sandstone-wash/60 p-2.5 rounded-xl border border-border-warm/40">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-label-caps mb-0.5`}>Live Operational Desk</span>
                <span className="font-body-sm text-body-md text-ink-charcoal font-medium">Instant WhatsApp &amp; Call Escalation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 21-Point Mechanical Inspection & Fleet Standards (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-space-xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-ink-charcoal text-ivory-surface rounded-xl p-4 sm:p-6 lg:p-7 shadow-lg overflow-hidden relative">
            <svg
              className="absolute -right-12 -top-12 w-64 h-64 opacity-5 text-terracotta-sunlit pointer-events-none"
              fill="currentColor"
              viewBox="0 0 100 100"
            >
              <polygon points="50,0 60,35 95,35 68,57 78,92 50,70 22,92 32,57 5,35 40,35" />
            </svg>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              <div className="lg:col-span-5 flex flex-col gap-2.5">
                <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowGold} text-body-sm`}>
                  Unwavering Vehicle Readiness
                </span>
                <h2 className={EDITORIAL_TYPOGRAPHY.sectionH2Dark}>
                  The 21-Point Morning Pre-Departure Ritual
                </h2>
                <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
                  Before any Baghel vehicle pulls up to your hotel porch, an uncompromising 45-minute mechanical and
                  sensory audit is executed at our Taj Ganj maintenance facility.
                </p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-2 text-body-md">
                    <span className="material-symbols-outlined text-gold-accent text-icon-16">speed</span>
                    <span className="text-ivory-surface font-medium">Governor Speed Cap:</span>
                    <span className="text-secondary-fixed-dim">Strictly calibrated to 80–100 km/h</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-md">
                    <span className="material-symbols-outlined text-gold-accent text-icon-16">local_drink</span>
                    <span className="text-ivory-surface font-medium">In-Cabin Hospitality:</span>
                    <span className="text-secondary-fixed-dim">Chilled sealed water, tissues &amp; mints</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-md">
                    <span className="material-symbols-outlined text-gold-accent text-icon-16">medical_services</span>
                    <span className="text-ivory-surface font-medium">Safety Equipment:</span>
                    <span className="text-secondary-fixed-dim">ISO-approved medical kit &amp; fire canister</span>
                  </div>
                </div>
              </div>

              {/* Inspection Interactive / List Matrix (Compact -20%) */}
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-ink-slate p-2.5 sm:p-3 rounded-lg flex flex-col gap-1 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowGold} text-label-caps`}>Mechanical Systems</span>
                      <span className="material-symbols-outlined text-success-jade text-icon-16">check_circle</span>
                    </div>
                    <h4 className={EDITORIAL_TYPOGRAPHY.subH4Dark}>Braking &amp; Tread Depth</h4>
                    <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
                      Digital vernier measurement ensuring &gt;4mm tread for Yamuna Expressway wet performance.
                    </p>
                  </div>
                  <div className="bg-ink-slate p-2.5 sm:p-3 rounded-lg flex flex-col gap-1 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowGold} text-label-caps`}>Atmospheric Purity</span>
                      <span className="material-symbols-outlined text-success-jade text-icon-16">check_circle</span>
                    </div>
                    <h4 className={EDITORIAL_TYPOGRAPHY.subH4Dark}>Dual-Zone AC Sanitization</h4>
                    <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
                      Daily HEPA filter vacuuming and ozone treatment to keep air crisp and allergen-free.
                    </p>
                  </div>
                  <div className="bg-ink-slate p-2.5 sm:p-3 rounded-lg flex flex-col gap-1 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowGold} text-label-caps`}>Navigational Rigor</span>
                      <span className="material-symbols-outlined text-success-jade text-icon-16">check_circle</span>
                    </div>
                    <h4 className={EDITORIAL_TYPOGRAPHY.subH4Dark}>Redundant GPS Telematics</h4>
                    <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
                      Dual SIM tracking transponders connected to our central Taj Ganj dispatch monitoring wall.
                    </p>
                  </div>
                  <div className="bg-ink-slate p-2.5 sm:p-3 rounded-lg flex flex-col gap-1 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowGold} text-label-caps`}>Guest Ergonomics</span>
                      <span className="material-symbols-outlined text-success-jade text-icon-16">check_circle</span>
                    </div>
                    <h4 className={EDITORIAL_TYPOGRAPHY.subH4Dark}>Power Port Validation</h4>
                    <p className={EDITORIAL_TYPOGRAPHY.compactDark}>
                      Multivolt USB-C &amp; Type-A fast charging docks tested for iPhone, Android, and laptops.
                    </p>
                  </div>
                </div>

                {/* Visual Fleet Cutout Strip */}
                <div className="mt-2.5 bg-ink-slate/60 p-2 sm:p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-body-md border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-terracotta-sunlit text-icon-16">airline_seat_recline_normal</span>
                    <span className="text-ivory-surface">
                      Toyota Innova Crysta • Dzire Executive • Urbania 10-Seater • Tempo Traveller
                    </span>
                  </div>
                  <span className="text-gold-accent font-semibold text-label-lg">100% AC Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Transparent Comparison Matrix (Compact -20%) */}
      <section className="w-full bg-surface-container-low py-8 sm:py-space-xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-6 sm:mb-space-lg">
            <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} mb-1`}>
              The Unfiltered Truth
            </span>
            <h2 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} mb-1.5`}>
              Why Discerning Voyagers Avoid The App Lottery
            </h2>
            <p className={EDITORIAL_TYPOGRAPHY.body}>
              Comparing Agra SK Baghel Tour and Travels with generic app-based rides and street touts operating around Agra
              tourist stations.
            </p>
          </div>

          {/* Comparison Table Wrapper */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs overflow-x-auto border border-border-warm/50">
            <table className="w-full text-left border-collapse min-w-[650px] font-body-sm text-label-md">
              <thead>
                <tr className="bg-sandstone-wash/80 text-on-surface border-b border-border-warm">
                  <th className="py-2.5 px-4 font-title-md text-xs font-bold">Standard Criteria</th>
                  <th className="py-2.5 px-4 font-title-md text-xs font-bold text-terracotta-sandstone bg-sandstone-wash">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-terracotta-sandstone text-icon-16">stars</span>
                      Agra SK Baghel Tour and Travels
                    </span>
                  </th>
                  <th className="py-2.5 px-4 font-title-md text-xs font-bold text-secondary">Anonymous App Cabs</th>
                  <th className="py-2.5 px-4 font-title-md text-xs font-bold text-secondary">Street Brokers / Touts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/30">
                {/* Row 1 */}
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Vehicle Model Guarantee</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">check_circle</span>
                      Exact Model Reserved (e.g. Crysta ZX)
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">"Or Equivalent" often downgraded</td>
                  <td className="py-2.5 px-4 text-error">Unverified worn vehicles</td>
                </tr>
                {/* Row 2 */}
                <tr className="bg-surface-container hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Unsolicited Commission Stops</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">verified_user</span>
                      Strict Zero Tolerance (Cash penalty)
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">Drivers often push preferred shops</td>
                  <td className="py-2.5 px-4 text-error">Extreme pressure to buy marble &amp; rugs</td>
                </tr>
                {/* Row 3 */}
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Yamuna Toll &amp; State Taxes</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">check_circle</span>
                      Bundled &amp; Stated Upfront
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">Arbitrary cash demands at toll gates</td>
                  <td className="py-2.5 px-4 text-error">Frequent extortion at highway borders</td>
                </tr>
                {/* Row 4 */}
                <tr className="bg-surface-container hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Driver Verification</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">check_circle</span>
                      Police ID + 7+ Yrs Golden Triangle
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">Basic gig-worker profile</td>
                  <td className="py-2.5 px-4 text-error">Zero background oversight</td>
                </tr>
                {/* Row 5 */}
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Chauffeur Contact Time</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">check_circle</span>
                      Assigned 18–24 Hours Prior
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">Assigned 10 mins before departure</td>
                  <td className="py-2.5 px-4 text-error">Random driver on spot</td>
                </tr>
                {/* Row 6 */}
                <tr className="bg-surface-container hover:bg-surface-container-low transition-colors">
                  <td className="py-2.5 px-4 font-medium text-ink-charcoal">Cancellation &amp; Reschedule</td>
                  <td className="py-2.5 px-4 font-semibold text-success-jade bg-sandstone-wash/30">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-icon-16">check_circle</span>
                      Free Reschedule up to 12 Hours
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">Strict non-negotiable penalty</td>
                  <td className="py-2.5 px-4 text-error">Total forfeiture of deposit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Real Heritage Testimonials (Compact -20%) */}
      <section className="w-full bg-surface py-8 sm:py-space-xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-space-lg gap-space-sm">
            <div className="flex flex-col gap-1 max-w-xl">
              <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} mb-0.5`}>
                Guest Chronicle
              </span>
              <h2 className={EDITORIAL_TYPOGRAPHY.sectionH2}>
                Words From Those Who Journeyed With Us
              </h2>
            </div>
            <div className="flex items-center gap-1 text-label-md font-body-sm text-secondary">
              <span className="material-symbols-outlined text-gold-accent text-icon-18">star</span>
              <span className="font-semibold text-ink-charcoal">4.92 / 5.0 Aggregate</span>
              <span>across Google &amp; TripAdvisor</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Testimonial 1 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-gold-accent">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16" style={{ fontVariationSettings: '"FILL" 1' }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-label-lg text-secondary font-mono">Delhi ⇄ Agra Same-Day</span>
                </div>
                <p className="font-headline-sm text-xs sm:text-title-lg font-serif italic text-ink-charcoal leading-relaxed">
                  “Zero pressure. As two solo women travelers visiting the Taj at sunrise, our driver Mr. Rajesh was
                  chivalrous, highly defensive on the expressway, and didn’t stop at a single souvenir shop.”
                </p>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-border-warm/40 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-title-md text-xs text-on-surface font-semibold">Elena Rostova &amp; Claire V.</span>
                    <span className="text-label-lg text-secondary">Geneva, Switzerland</span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-success-jade text-label-lg font-medium">
                    <span className="material-symbols-outlined text-success-jade text-icon-15">verified</span>
                    <span>Verified Guest</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-gold-accent">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16" style={{ fontVariationSettings: '"FILL" 1' }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-label-lg text-secondary font-mono">Mathura-Vrindavan Circuit</span>
                </div>
                <p className="font-headline-sm text-xs sm:text-title-lg font-serif italic text-ink-charcoal leading-relaxed">
                  “We booked a 12-seater Tempo Traveller for an extended family pilgrimage. The vehicle had clean
                  seatcovers, pristine cold AC throughout 42°C heat, and courteous behavior toward elderly parents.”
                </p>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-border-warm/40 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-title-md text-xs text-on-surface font-semibold">Rajesh &amp; Sunita Sharma</span>
                    <span className="text-label-lg text-secondary">Greater Kailash, New Delhi</span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-success-jade text-label-lg font-medium">
                    <span className="material-symbols-outlined text-success-jade text-icon-15">verified</span>
                    <span>Verified Guest</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-card-frosted p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/60">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-gold-accent">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-icon-16" style={{ fontVariationSettings: '"FILL" 1' }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-label-lg text-secondary font-mono">Golden Triangle 4-Day</span>
                </div>
                <p className="font-headline-sm text-xs sm:text-title-lg font-serif italic text-ink-charcoal leading-relaxed">
                  “I arrange road delegations for visiting architectural academics. The punctuality of Agra SK Baghel Tour and Travels's desk
                  at Taj Ganj is the finest in Uttar Pradesh. Transparent invoicing and genuine warmth.”
                </p>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-border-warm/40 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-title-md text-xs text-on-surface font-semibold">David Miller</span>
                    <span className="text-label-lg text-secondary">Melbourne, Australia</span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-success-jade text-label-lg font-medium">
                    <span className="material-symbols-outlined text-success-jade text-icon-15">verified</span>
                    <span>Verified Guest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Direct Dispatch Location & Ground Reality (Compact -20%) */}
      <section className="w-full bg-surface-container-low py-8 sm:py-space-xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-6 flex flex-col gap-3">
              <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-body-sm`}>
                Physical Roots in Taj Ganj
              </span>
              <h2 className={EDITORIAL_TYPOGRAPHY.sectionH2}>
                Not a Remote Call-Center. We Are Directly On The Heritage Ground.
              </h2>
              <p className={EDITORIAL_TYPOGRAPHY.compact}>
                Our office sits 450 meters from the Taj Mahal Eastern Gate ticket concourse. When monsoon storms cause
                expressway delays or VIP motorcades divert city traffic, our local dispatchers navigate alternate
                historical bypasses in real time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-start gap-3 shadow-xs border border-white/60">
                  <span className="material-symbols-outlined text-terracotta-sandstone mt-0.5 text-icon-20">pin_drop</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-xs text-on-surface font-serif font-bold">Taj Ganj Station</span>
                    <span className="text-label-lg text-secondary">{contact.address}</span>
                  </div>
                </div>
                <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-start gap-3 shadow-xs border border-white/60">
                  <span className="material-symbols-outlined text-terracotta-sandstone mt-0.5 text-icon-20">alarm_on</span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-xs text-on-surface font-serif font-bold">Agra Cantt Backup</span>
                    <span className="text-label-lg text-secondary">Dedicated station coordinator on platform 1 arrival</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div
                className="w-full h-80 rounded-3xl bg-cover bg-center shadow-xl relative overflow-hidden border border-white/40"
                style={{
                  backgroundImage:
                    'url("/assets/places/gallery/taj-mahal-01-1600.webp")',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent flex items-end p-space-md">
                  <div className="flex items-center justify-between w-full text-ivory-surface">
                    <div>
                      <p className="font-title-md text-title-md font-serif">Agra SK Baghel Tour and Travels Taj Ganj Control Center</p>
                      <p className="text-body-sm text-sandstone-wash/80">Active 24 Hours • 7 Days A Week</p>
                    </div>
                    <a
                      className="bg-terracotta-deep text-white px-3 py-1.5 rounded-xl text-label-caps font-label-caps uppercase hover:bg-terracotta-sunlit transition-colors shadow-md"
                      href={contact.mapsUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Open In Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Grand Call-to-Action Strip */}
      <section className="w-full bg-sandstone-wash py-space-3xl">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="glass-card-frosted rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 w-full border border-white/80">
            <div className="flex flex-col gap-space-xs max-w-xl text-left w-full">
              <span className={`${EDITORIAL_TYPOGRAPHY.eyebrowSandstone} text-body-sm`}>
                Unrivaled Hospitality Awaits
              </span>
              <h2 className={EDITORIAL_TYPOGRAPHY.sectionH2}>
                Experience Agra With Dignity &amp; Poise.
              </h2>
              <p className={`${EDITORIAL_TYPOGRAPHY.body} max-w-lg`}>
                Lock your chauffeur vehicle today with a transparent 28% advance token. Zero hidden charges, spotless
                air-conditioned fleet, and gracious guidance.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
              <PrimaryButton href="/book/" size="lg" icon="calendar_today" iconPosition="left">
                Book Your Chauffeur Now
              </PrimaryButton>
              <WhatsAppButton
                size="lg"
                inquiryText="Hello Agra SK Baghel Tour and Travels Desk, I would like to inquire about your chauffeur services in Agra."
                label="WhatsApp Taj Ganj Desk"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default AboutPage;
