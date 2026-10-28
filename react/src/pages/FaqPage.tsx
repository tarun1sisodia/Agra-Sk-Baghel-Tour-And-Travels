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
    a: "Yes. All our published one-way fares (e.g., Agra to Delhi NCR ₹3,499, Agra to Jaipur ₹3,499) include 100% of state highway and Yamuna Expressway toll charges. Chauffeurs carry registered FASTag cards with zero roadside toll deductions asked from guests.",
  },
  {
    id: "fares-tour-cost",
    category: "fares",
    q: "How much does an Agra tour cost?",
    a: "An Agra tour ranges from ₹450 per person for budget DIY travel to ₹1,800–₹2,500 for a private full-day chauffeur-driven cab (covering Taj Mahal, Agra Fort, Baby Taj, and Mehtab Bagh). Same-day outstation packages from Delhi start at ₹4,999 in a private sedan (all expressway tolls included), while luxury overnight heritage packages with 5-star lodging range between ₹12,000 and ₹25,000+.",
  },
  {
    id: "fares-2",
    category: "fares",
    q: "How does the 300 km/day minimum outstation rule work?",
    a: "For multi-day and round-trip outstation journeys, billing is based on a standard minimum threshold of 300 km per calendar day. For instance, a 2-day round trip to Jaipur covers a minimum billable 600 km. Any distance driven beyond 600 km is simply billed at the per-km rate of your selected vehicle.",
  },
  {
    id: "fares-3",
    category: "fares",
    q: "When does the driver night allowance apply?",
    a: "A night allowance of ₹300 per night applies strictly when the vehicle is in operation between 10:00 PM and 6:00 AM, or during multi-day outstation trips where the driver stays overnight. There are zero daytime driver batta charges.",
  },
  {
    id: "fares-4",
    category: "fares",
    q: "Can I receive an official booking receipt for corporate expense reimbursement?",
    a: "Yes. We issue computerized booking receipts with your company legal name and tax details, delivered instantly via email or WhatsApp upon booking completion.",
  },

  // 2. Booking & Payment
  {
    id: "booking-1",
    category: "booking",
    q: "How much advance deposit is required to confirm my booking?",
    a: "We only require a 28% advance token deposit to lock your vehicle and assigned chauffeur in our dispatch roster. The remaining 72% balance is paid directly to the driver at the end of your trip via UPI, cash, or card.",
  },
  {
    id: "booking-2",
    category: "booking",
    q: "What is your cancellation and refund policy?",
    a: "We offer a 100% full refund on your advance token if cancelled at least 24 hours prior to scheduled departure. For cancellations made between 6 and 24 hours before pickup, a 50% credit is retained. Same-day emergency rescheduling is free of charge subject to vehicle availability.",
  },
  {
    id: "booking-3",
    category: "booking",
    q: "How will I receive my driver and vehicle details?",
    a: "Once your booking is confirmed, our Taj Ganj dispatch controller sends you a digital transit voucher on WhatsApp and SMS containing driver name, verified phone number, vehicle model, and yellow-plate commercial registration number 2 hours before scheduled departure.",
  },

  // 3. Fleet & Amenities
  {
    id: "fleet-1",
    category: "fleet",
    q: "Do all vehicles have full air-conditioning during peak summer and hill travel?",
    a: "100% yes. Every vehicle in our fleet is equipped with powerful dual-zone air conditioning. Chauffeurs are instructed to maintain cool cabin comfort at all times without turning off AC during highway cruises or city monument stops.",
  },
  {
    id: "fleet-2",
    category: "fleet",
    q: "How much luggage can fit in a Sedan vs an Ertiga or Innova Crysta?",
    a: "A Sedan accommodates 2 large suitcases plus 2 small hand bags. An Ertiga MPV accommodates 3 medium suitcases plus 2 cabin bags. An Innova Crysta comfortably carries 4 large trolley bags with additional rear storage. For larger groups, our Tempo Travellers feature dedicated rear luggage bays and weatherproof roof carriers.",
  },
  {
    id: "fleet-3",
    category: "fleet",
    q: "Are pets allowed in your vehicles?",
    a: "To ensure the highest hygiene standards, allergen safety, and upholstery care for all subsequent guests, pets and animals are strictly not permitted inside our cabs.",
  },

  // 4. Agra Sightseeing & Monument Rules
  {
    id: "sightseeing-1",
    category: "sightseeing",
    q: "Is the Taj Mahal closed on any day of the week?",
    a: "Yes. The Taj Mahal is strictly closed every Friday to general tourists for congregational prayers. All other Agra monuments—including Agra Fort, Fatehpur Sikri, Itimad-ud-Daulah (Baby Taj), and Mehtab Bagh—remain open 7 days a week.",
  },
  {
    id: "sightseeing-tickets",
    category: "sightseeing",
    q: "What are the entry ticket prices for Taj Mahal and Agra Fort?",
    a: "Taj Mahal entry tickets are ₹50 for Indian citizens, ₹540 for SAARC/BIMSTEC visitors, and ₹1,100 for foreign international tourists (plus an optional ₹200 ticket for the main mausoleum interior dome). Agra Fort entry tickets are ₹50 for Indian nationals and ₹650 for foreign tourists. Entry is completely free for children under 15 years across all ASI protected monuments.",
  },
  {
    id: "sightseeing-package-inclusions",
    category: "sightseeing",
    q: "What is included in an Agra local sightseeing taxi package?",
    a: "Our private Agra local sightseeing taxi packages include: dedicated private air-conditioned vehicle for 8 Hours / 80 Km (or 12 Hours / 100 Km), commercial chauffeur with extensive local heritage route knowledge, fuel expenses, and monument parking charges. Monument entrance fees, licensed guide fees, and food/beverages are billed separately.",
  },
  {
    id: "sightseeing-2",
    category: "sightseeing",
    q: "What is the best time for the Taj Mahal sunrise tour?",
    a: "Monument gates open 30 minutes before sunrise (typically 5:30 AM in summer and 6:15 AM in winter). We recommend scheduled hotel pickup 45 minutes before sunrise to reach the Taj East Gate ticket counter before tour bus crowds arrive.",
  },
  {
    id: "sightseeing-3",
    category: "sightseeing",
    q: "Are licensed government monument tour guides available?",
    a: "Yes. We can pair your vehicle reservation with an approved Ministry of Tourism licensed English, Spanish, French, or German speaking heritage guide who meets you directly at the monument gate.",
  },
];

export function FaqPage({ language = "en" }: FaqPageProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "fares-1": true });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

      {/* 2. ACCORDION LIST (Compact -20%) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-border-warm/60">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1.5">search_off</span>
              <h2 className="font-headline-sm text-base font-semibold text-ink-charcoal">No questions matched your search</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Try another keyword or chat with our 24x7 desk on WhatsApp.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id];
              return (
                <div key={faq.id} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-xs sm:text-title-lg font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-icon-18 shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-3 sm:p-3.5 pt-0 text-on-surface-variant font-body-sm text-body-md leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 3. STILL HAVE QUESTIONS? BENTO STRIP (Compact -20%) */}
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
              className="p-3.5 rounded-xl bg-black text-white hover:bg-neutral-900 border border-white/10 transition-all flex flex-col items-center text-center shadow-xs active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
                <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
              </div>
              <h3 className="font-title-md text-xs font-bold text-white" style={{ color: "#ffffff" }}>WhatsApp</h3>
              <p className="text-body-md text-whatsapp font-bold mt-0.5">Instant Response</p>
            </a>

            <a
              href="mailto:bookings@agraskbagheltourandtravels.com"
              className="p-3.5 rounded-xl bg-surface-container-lowest border border-border-warm/70 hover:border-primary transition-all flex flex-col items-center text-center shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-sandstone-wash flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-lg">mail</span>
              </div>
              <h3 className="font-title-md text-xs font-bold text-ink-charcoal">Email Support</h3>
              <p className="text-label-lg text-on-surface-variant font-medium mt-0.5 truncate max-w-full">
                bookings@agraskbagheltourandtravels.com
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
