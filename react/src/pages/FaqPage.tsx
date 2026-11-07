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
    a: "Yes. One-way fares such as Agra–Delhi ₹3,499 and Agra–Jaipur ₹3,499 include all Yamuna Expressway and state-highway tolls. The driver carries a FASTag, so nobody asks you for toll money on the road.",
  },
  {
    id: "fares-tour-cost",
    category: "fares",
    q: "How much does an Agra tour cost?",
    a: "A private full-day sightseeing cab costs ₹2,000–₹2,500 in a sedan for 8 hours / 80 km, covering Taj Mahal, Agra Fort, Baby Taj and Mehtab Bagh. Monument tickets and a guide are extra.",
  },
  {
    id: "fares-2",
    category: "fares",
    q: "How does the 300 km/day minimum outstation rule work?",
    a: "Round-trip outstation billing starts at 300 km per calendar day, so a 2-day trip to Jaipur bills at least 600 km. Distance above that is charged at your vehicle's per-km rate.",
  },
  {
    id: "fares-3",
    category: "fares",
    q: "When does the driver night allowance apply?",
    a: "Sedan and SUV: ₹500 per night. All other vehicles: ₹700 per night. It applies only when the vehicle runs between 8 PM and 6 AM, or the driver stays overnight on a multi-day trip — there is no daytime driver charge.",
  },
  {
    id: "fares-4",
    category: "fares",
    q: "Can I get an official receipt for reimbursement?",
    a: "Yes. A computerised receipt with your company name and tax details is sent on email or WhatsApp as soon as the booking is confirmed.",
  },

  // 2. Booking & Payment
  {
    id: "booking-1",
    category: "booking",
    q: "How much advance do I pay to confirm a booking?",
    a: "28% as a token deposit to lock the vehicle and driver. The remaining 72% is paid to the driver at the end of the trip, by UPI, cash or card.",
  },
  {
    id: "booking-2",
    category: "booking",
    q: "What is the cancellation and refund policy?",
    a: "Cancel 24 hours or more before pickup and the 28% advance is refunded in full. Cancel 6–24 hours before pickup and 50% is kept as credit; same-day rescheduling is free if a vehicle is available.",
  },
  {
    id: "booking-3",
    category: "booking",
    q: "When do I get my driver and vehicle details?",
    a: "2 hours before pickup, on WhatsApp and SMS. The message has the driver's name and verified phone number, the vehicle model, and its yellow-plate commercial registration number.",
  },

  // 3. Fleet & Amenities
  {
    id: "fleet-1",
    category: "fleet",
    q: "Do all vehicles have air-conditioning?",
    a: "Yes, every vehicle, all year. AC stays on during highway driving and monument stops, including peak summer.",
  },
  {
    id: "fleet-2",
    category: "fleet",
    q: "How much luggage fits in a sedan, Ertiga or Innova Crysta?",
    a: "Sedan: 2 large suitcases + 2 small bags. Ertiga: 3 medium suitcases + 2 cabin bags. Innova Crysta: 4 large trolley bags. Tempo Travellers have a rear luggage bay for 8 large bags.",
  },
  {
    id: "fleet-4",
    category: "fleet",
    q: "Are pets allowed in the vehicles?",
    a: "No. Pets are not allowed, to keep the upholstery clean and allergen-free for the next passengers.",
  },

  // 4. Agra Sightseeing & Monument Protocols
  {
    id: "sightseeing-1",
    category: "sightseeing",
    q: "Is the Taj Mahal closed on any day?",
    a: "Yes, every Friday, for prayers. Agra Fort, Fatehpur Sikri, Baby Taj and Mehtab Bagh stay open all 7 days.",
  },
  {
    id: "sightseeing-tickets",
    category: "sightseeing",
    q: "What are the Taj Mahal and Agra Fort ticket prices?",
    a: "Taj Mahal: ₹50 Indian, ₹540 SAARC/BIMSTEC, ₹1,100 foreign, plus ₹200 for the main mausoleum; under-15s free. Agra Fort: ₹50 Indian, ₹650 foreign.",
  },
  {
    id: "sightseeing-package-inclusions",
    category: "sightseeing",
    q: "What is included in an Agra local sightseeing taxi package?",
    a: "A private AC vehicle for 8 hours / 80 km (or 12 hours / 100 km), a chauffeur, fuel and monument parking. Monument tickets, guide fees and food are extra.",
  },
  {
    id: "sightseeing-2",
    category: "sightseeing",
    q: "What is the best time for the Taj Mahal sunrise tour?",
    a: "Gates open 30 minutes before sunrise — about 5:30 AM in summer, 6:15 AM in winter. Pickup is 45 minutes before sunrise, so you reach the East Gate before the tour buses.",
  },
  {
    id: "sightseeing-3",
    category: "sightseeing",
    q: "Are licensed monument guides available?",
    a: "Yes. Ministry of Tourism licensed guides in English, Spanish, French or German can meet you at the monument gate if you ask when booking.",
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
