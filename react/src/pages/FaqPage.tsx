import React, { useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { WhatsAppIcon } from "../components/icons";

export interface FaqPageProps {
  language?: SupportedLanguage;
}

export type FaqCategory = "all" | "fares" | "booking" | "fleet" | "sightseeing";

export interface FaqItem {
  id: string;
  category: "fares" | "booking" | "fleet" | "sightseeing";
  q: string;
  a: string;
}

const FAQS_DATA: FaqItem[] = [
  // 1. Tolls & Fares
  {
    id: "fares-1",
    category: "fares",
    q: "Are expressway tolls and FASTag charges included in one-way cab fares?",
    a: "Yes. All our published one-way fares (e.g., Agra to Delhi NCR ₹3,499, Agra to Jaipur ₹3,499, Agra to Lucknow ₹4,499) include 100% of Yamuna Expressway, Eastern Peripheral Expressway, and state highway toll charges. Chauffeurs carry registered FASTag cards with zero roadside toll deductions asked from guests.",
  },
  {
    id: "fares-tour-cost",
    category: "fares",
    q: "How much does an Agra sightseeing taxi or private tour cost?",
    a: "An Agra local sightseeing taxi package starts from ₹1,800 to ₹2,500 for a private air-conditioned Sedan (covering Taj Mahal, Agra Red Fort, Baby Taj, and Mehtab Bagh for 8 Hours / 80 Km). Same-day return outstation packages from Delhi start at ₹4,999 in a private Sedan with all expressway tolls included. Luxury SUVs like Innova Crysta start at ₹3,200 for local day charters, while 12-seater Tempo Travellers start at ₹4,500.",
  },
  {
    id: "fares-2",
    category: "fares",
    q: "How does the 300 km/day minimum outstation rule work?",
    a: "For multi-day and round-trip outstation journeys, billing is calculated on a standardized minimum threshold of 300 kilometers per calendar day. For instance, a 2-day round trip to Jaipur covers a minimum billable 600 km. Any distance driven beyond 600 km is simply billed at the per-km rate of your selected vehicle (e.g., ₹12/km for Sedan, ₹14/km for Ertiga, ₹18/km for Innova Crysta).",
  },
  {
    id: "fares-3",
    category: "fares",
    q: "When does the driver night allowance apply?",
    a: "A modest night allowance of ₹300 per night applies strictly when the vehicle is in operation between 10:00 PM and 6:00 AM, or during multi-day outstation trips where the chauffeur stays overnight away from Agra. There are zero daytime driver batta charges or hidden meal surcharges.",
  },
  {
    id: "fares-4",
    category: "fares",
    q: "Can I receive an official GST invoice and booking receipt for corporate reimbursement?",
    a: "Yes. We issue computerized tax invoices with your company legal name, GSTIN, passenger roster, and route breakdown. Your invoice is delivered instantly via email and WhatsApp upon completion of your journey.",
  },
  {
    id: "fares-5",
    category: "fares",
    q: "Are there any hidden festival surge charges or foggy winter surcharges?",
    a: "Never. Agra SK Baghel Tour & Travels operates on a strictly transparent, server-authoritative fare structure. Once your fare is quoted and confirmed with your 28% advance deposit, that price is locked 100%—even during peak Diwali, Christmas, New Year festivals, or winter fog season.",
  },

  // 2. Booking & Payment
  {
    id: "booking-1",
    category: "booking",
    q: "How much advance deposit is required to confirm my booking?",
    a: "We only require a 28% advance token deposit to lock your vehicle and assigned chauffeur in our Taj Ganj dispatch roster. The remaining 72% balance is paid directly to the driver at the end of your trip via UPI, cash, debit card, or credit card.",
  },
  {
    id: "booking-2",
    category: "booking",
    q: "What is your cancellation and refund policy?",
    a: "We offer an industry-leading 100% full refund on your 28% advance deposit if you cancel at least 24 hours prior to your scheduled pickup time. For cancellations requested between 6 and 24 hours before departure, a 50% credit is retained. Same-day emergency rescheduling is completely free of charge, subject to vehicle availability.",
  },
  {
    id: "booking-3",
    category: "booking",
    q: "How and when will I receive my driver and vehicle details?",
    a: "Once your booking is confirmed, our dispatch controller registers your journey. A digital transit voucher containing your chauffeur's name, verified mobile number, vehicle model, and yellow-plate commercial registration number is sent to you via WhatsApp and SMS 2 hours before scheduled pickup.",
  },
  {
    id: "booking-4",
    category: "booking",
    q: "What payment methods do you accept for online deposits and driver balance?",
    a: "We accept all major Indian and international payment methods through secure Razorpay gateways: UPI (Google Pay, PhonePe, Paytm, BHIM), Visa, MasterCard, RuPay, American Express credit/debit cards, and NetBanking across 50+ banks. Chauffeurs also accept cash or direct UPI on trip completion.",
  },
  {
    id: "booking-5",
    category: "booking",
    q: "Can I modify my pickup time or hotel address after booking?",
    a: "Yes. You can adjust your pickup location, hotel address, or departure time by contacting our 24×7 Taj Ganj dispatch desk via WhatsApp or phone (+91 97628 17598). Timely itinerary adjustments made at least 3 hours before departure incur zero administrative fees.",
  },

  // 3. Fleet & Amenities
  {
    id: "fleet-1",
    category: "fleet",
    q: "Do all vehicles have full air-conditioning during peak summer and hill highway travel?",
    a: "100% yes. Every vehicle in our fleet is equipped with high-capacity dual-zone air conditioning. Our chauffeurs are trained to maintain optimal cabin cooling at all times without turning off AC during Yamuna Expressway highway cruises, city traffic, or monument parking waits.",
  },
  {
    id: "fleet-2",
    category: "fleet",
    q: "How much luggage can fit in a Sedan vs an Ertiga vs an Innova Crysta?",
    a: "A standard Sedan (Dzire / Etios) comfortably accommodates 2 large suitcases plus 2 cabin bags. An Ertiga MPV accommodates 3 medium suitcases plus 2 backpacks. An Innova Crysta carries 4 large trolley suitcases plus 3 carry-on bags. For groups with extensive luggage, our Force Tempo Travellers feature dedicated rear luggage holds and weatherproof roof carriers.",
  },
  {
    id: "fleet-3",
    category: "fleet",
    q: "What seating capacities are available for Force Tempo Travellers?",
    a: "We operate commercial yellow-plate Force Tempo Travellers in 9-seater, 12-seater, 16-seater, 20-seater, and 24-seater executive configurations. All models feature pushback 1x1 and 2x1 leatherette seats, individual AC vents, mobile charging ports, LED reading lights, and premium acoustic soundproofing.",
  },
  {
    id: "fleet-4",
    category: "fleet",
    q: "Are pets allowed inside your vehicles?",
    a: "To ensure the highest standards of cleanliness, allergen safety, and interior upholstery hygiene for subsequent guests—including international travelers with sensitivities—pets and animals are strictly not permitted inside our cabs.",
  },
  {
    id: "fleet-5",
    category: "fleet",
    q: "Are your drivers commercially licensed and background-verified?",
    a: "Yes. Every chauffeur on our roster holds a valid commercial driver's license, has undergone police background verification, and has a minimum of 5 years of professional highway driving experience across Uttar Pradesh, Delhi NCR, and Rajasthan corridors.",
  },

  // 4. Agra Sightseeing & Monument Protocols
  {
    id: "sightseeing-1",
    category: "sightseeing",
    q: "Is the Taj Mahal closed on any day of the week?",
    a: "Yes. The Taj Mahal is strictly closed to all tourists every Friday for congregational prayers. However, all other Agra monuments—including Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah (Baby Taj), Sikandra, and Mehtab Bagh—remain open all 7 days of the week.",
  },
  {
    id: "sightseeing-tickets",
    category: "sightseeing",
    q: "What are the entry ticket prices for the Taj Mahal and Agra Fort?",
    a: "Taj Mahal tickets are ₹50 for Indian nationals, ₹540 for SAARC/BIMSTEC citizens, and ₹1,100 for international foreign tourists (plus an optional ₹200 fee for the main dome mausoleum interior). Agra Fort tickets are ₹50 for Indians, ₹90 for SAARC, and ₹650 for foreign tourists. Children under 15 years enter completely free across all ASI protected monuments.",
  },
  {
    id: "sightseeing-package-inclusions",
    category: "sightseeing",
    q: "What is included in an Agra local sightseeing taxi package?",
    a: "Our private Agra sightseeing taxi packages include: dedicated private air-conditioned vehicle for 8 Hours / 80 Km (or 12 Hours / 100 Km), experienced chauffeur with heritage knowledge, fuel, driver allowance, and all monument parking charges. Monument entry fees, licensed guide fees, and meals are billed separately.",
  },
  {
    id: "sightseeing-2",
    category: "sightseeing",
    q: "What is the best departure time for the Taj Mahal sunrise tour?",
    a: "Monument gates open 30 minutes before sunrise (approximately 5:30 AM in summer and 6:15 AM in winter). We recommend scheduled hotel pickup 45 minutes before sunrise to reach the Taj East Gate parking plaza (Shilpgram) before tour buses arrive and enjoy the serene dawn reflection in peace.",
  },
  {
    id: "sightseeing-3",
    category: "sightseeing",
    q: "Can you arrange approved government monument tour guides?",
    a: "Yes. We coordinate with Ministry of Tourism and ASI-approved licensed historians fluent in English, French, Spanish, German, and Italian at standardized government rates. Guides meet you directly at the monument ticket pavilion, ensuring you avoid aggressive street touts.",
  },
  {
    id: "sightseeing-4",
    category: "sightseeing",
    q: "How does pickup work at Agra Cantt Railway Station (AGC)?",
    a: "For arrivals via Gatimaan Express, Vande Bharat Express, or Shatabdi Express at Agra Cantt Railway Station (AGC), your chauffeur monitors your live train status and meets you outside Platform 1 Exit holding a customized name board with your vehicle parked nearby.",
  },
  {
    id: "sightseeing-5",
    category: "sightseeing",
    q: "Where do cabs drop passengers at the Taj Mahal and other monuments?",
    a: "Due to Agra Archaeological Protection regulations, motorized vehicles drop passengers at designated parking plazas (such as Shilpgram at Taj East Gate or the Agra Fort plaza). Silent, pollution-free electric golf carts transport guests the remaining 500 meters to the security gate.",
  },
  {
    id: "sightseeing-6",
    category: "sightseeing",
    q: "What items are prohibited inside the Taj Mahal and Agra Fort?",
    a: "Prohibited items include food, chewing gum, smoking devices, matchboxes, tripods, large backpacks, and sharp objects. Mobile phones and small handheld digital cameras are permitted. Secure locker facilities are available at entry gates.",
  },
];

export function FaqPage({ language = "en" }: FaqPageProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // FAQPage JSON-LD (AEO): exposes every Q&A to Google's rich results and
  // AI answer engines. Built from the full dataset (not the filtered view).
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* 1. HERO SECTION */}
      <section className="relative bg-surface-container-low px-margin-mobile md:px-margin pt-space-xl pb-space-2xl overflow-hidden border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto relative z-10 flex flex-col space-y-space-md">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-label-caps text-xs">
            <a className="hover:text-primary transition-colors flex items-center gap-1" href="/">
              <span className="material-symbols-outlined text-icon-16">home</span>
              <span>Home</span>
            </a>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span>Support</span>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-primary font-bold">Frequently Asked Questions</span>
          </nav>

          <div className="max-w-3xl space-y-space-xs">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-label-md uppercase tracking-wider font-bold inline-block">
              24×7 Traveler Helpdesk
            </span>
            <h1 className="font-headline-hero text-headline-hero text-on-surface tracking-tight leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Find instant clarity on intercity cab fares, Yamuna Expressway toll inclusions, 28% advance deposits, vehicle
              classes, and Agra monument guidelines.
            </p>
          </div>

          {/* Search & Category Filter Dock */}
          <div className="pt-space-md max-w-4xl space-y-4">
            <div className="relative">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 top-3 text-icon-20">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tolls, advance deposit, luggage, cancellation rules..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-lowest border border-border-warm text-on-surface text-sm focus:outline-none focus:border-primary shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: `All Questions (${FAQS_DATA.length})` },
                { id: "fares", label: "Tolls & Fares" },
                { id: "booking", label: "Booking & Payments" },
                { id: "fleet", label: "Fleet & Luggage" },
                { id: "sightseeing", label: "Agra Sightseeing" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-lg font-label-caps text-xs uppercase tracking-wider transition-all whitespace-nowrap font-bold ${activeCategory === cat.id
                    ? "bg-ink-charcoal text-white shadow-sm"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACCORDION LIST (Crawlable Details Elements) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-border-warm/60">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1.5">search_off</span>
              <h2 className="font-headline-sm text-base font-semibold text-ink-charcoal">No questions matched your search</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Try another keyword or chat with our 24x7 desk on WhatsApp.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <details
                key={faq.id}
                open
                className="group border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs"
              >
                <summary className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors cursor-pointer select-none list-none">
                  <span className="font-title-md text-sm sm:text-base font-semibold text-ink-charcoal">{faq.q}</span>
                  <span className="material-symbols-outlined text-primary text-icon-20 shrink-0 transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="p-3.5 sm:p-4 pt-0 text-on-surface-variant font-body-sm text-sm leading-relaxed border-t border-border-warm/40 mt-1">
                  {faq.a}
                </div>
              </details>
            ))
          )}
        </div>

        {/* 3. STILL HAVE QUESTIONS? BENTO STRIP */}
        <div className="mt-10 pt-8 border-t border-border-warm/60">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="font-headline-lg text-headline-lg font-semibold text-ink-charcoal">Still have a question?</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Our Taj Ganj control desk is manned 24 hours a day, 7 days a week.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="tel:+919762817598"
              className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/70 hover:border-primary transition-all flex flex-col items-center text-center shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-sandstone-wash flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-lg">phone_in_talk</span>
              </div>
              <h3 className="font-title-md text-xs font-bold text-ink-charcoal">Call 24×7 Desk</h3>
              <p className="text-body-md text-primary font-bold mt-0.5">+91 97628 17598</p>
            </a>

            <a
              href="https://wa.me/919762817598"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff" }}
              className="p-3.5 rounded-xl bg-black border border-white/10 hover:bg-neutral-900 transition-all flex flex-col items-center text-center shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-900/40 flex items-center justify-center text-white mb-2">
                <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-title-md text-xs font-bold text-white">Chat on WhatsApp</h3>
              <p className="text-body-md text-emerald-400 font-bold mt-0.5">Instant Reply</p>
            </a>

            <a
              href="/en/contact/"
              className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/70 hover:border-primary transition-all flex flex-col items-center text-center shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-sandstone-wash flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-lg">support_agent</span>
              </div>
              <h3 className="font-title-md text-xs font-bold text-ink-charcoal">Custom Itinerary</h3>
              <p className="text-body-md text-primary font-bold mt-0.5">Concierge Support</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FaqPage;
