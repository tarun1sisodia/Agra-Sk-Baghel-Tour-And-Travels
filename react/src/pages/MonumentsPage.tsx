import React from "react";
import Reveal from "../components/reveal";
import { MonumentCard, type MonumentCardContract } from "../components/cards";
import { SectionHeading } from "../components/badges";
import type { SupportedLanguage } from "../config";
import generatedPublishedContent from "../data/generated-published-content.json";

const MONUMENT_IMAGES: Record<string, { src: string; alt: string }> = {
  "taj-mahal": {
    src: "/assets/places/agra-taj-mahal.webp",
    alt: "Taj Mahal white marble dome and minarets in Agra",
  },
  "agra-red-fort": {
    src: "/assets/places/agra-red-fort.webp",
    alt: "Agra Red Fort sandstone ramparts at sunset",
  },
  "fatehpur-sikri": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Buland Darwaza triumphal gateway at Fatehpur Sikri",
  },
  "itmad-ud-daulah-baby-taj": {
    src: "/assets/places/gallery/taj-mahal-03.jpg",
    alt: "Itmad-ud-Daulah Baby Taj Pietra Dura marble inlay",
  },
  "mehtab-bagh": {
    src: "/assets/places/gallery/mehtab-bagh-01.jpg",
    alt: "Mehtab Bagh moonlight garden view of Taj Mahal across Yamuna",
  },
  "sikandra-akbar-tomb": {
    src: "/assets/places/gallery/agra-fort-01.jpg",
    alt: "Akbar the Great mausoleum at Sikandra Agra",
  },
  "jama-masjid-agra": {
    src: "/assets/places/gallery/agra-fort-02.jpg",
    alt: "Historic Jama Masjid red sandstone Friday mosque in Old Agra",
  },
  "moti-masjid-pearl-mosque": {
    src: "/assets/places/agra-red-fort.webp",
    alt: "Moti Masjid Pearl Mosque white marble arches inside Agra Fort",
  },
  "jodha-bai-ka-rauza": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Jodha Bai Ka Rauza zenana palace inside Fatehpur Sikri",
  },
  "mariam-uz-zamani-palace": {
    src: "/assets/places/agra-fatehpur-sikri.webp",
    alt: "Mariam-uz-Zamani Palace Sunahra Makan carved sandstone brackets",
  },
};

type PublishedMonument = {
  name?: string;
  slug?: string;
  monumentCode?: string;
  visitingHours?: string;
};

function slugifyMonumentName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const publishedMonuments = ((generatedPublishedContent as { monuments?: PublishedMonument[] }).monuments ?? [])
  .filter((item): item is PublishedMonument & { name: string } => Boolean(item?.name?.trim()))
  .map((item): MonumentCardContract => {
    const slug = item.slug || item.monumentCode || slugifyMonumentName(item.name);
    const image = MONUMENT_IMAGES[slug];
    return {
      slug,
      name: item.name,
      thumbnail: image?.src,
      thumbnailAlt: image?.alt,
      visitingHours: item.visitingHours,
    };
  });

export interface MonumentsPageProps {
  language?: SupportedLanguage;
}

export function MonumentsPage({ language = "en" }: MonumentsPageProps) {
  return (
    <main className="min-h-screen bg-ivory text-ink">
      {/* 1. Header Hero Showcase */}
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-28 md:px-8">
        <Reveal>
          <div className="flex flex-col gap-3">
            <SectionHeading
              as="h1"
              index="M"
              kicker={`${publishedMonuments.length} Heritage Dossiers`}
              title={
                <>
                  Monuments of <em className="text-saffron italic">Agra</em>
                </>
              }
            />
            <p className="max-w-3xl text-sm sm:text-base text-ink/75 leading-relaxed mt-1">
              Explore the timeless architectural brilliance of Agra's Mughal heritage. Complete visitor guides covering entry hours, electronic ticket booking, and private chauffeur-driven taxi transfers across all UNESCO World Heritage sites.
            </p>
          </div>
        </Reveal>

        {/* 2. Monuments Grid */}
        <div className="mt-8">
          <h2 className="sr-only">Published Monument Guides</h2>
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
            {publishedMonuments.map((monument, index) => (
              <Reveal key={monument.slug} delay={index * 60}>
                <MonumentCard monument={monument} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Heritage & Visitor Guide */}
      <section className="border-t border-hairline bg-surface-2/40 py-16 px-5 md:px-8">
        <div className="mx-auto max-w-6xl space-y-12">
          {/* Subsection: Mughal Architectural Legacy */}
          <div className="space-y-4">
            <span className="font-mono text-xs uppercase tracking-wider text-gold-text">
              Imperial Architecture & History
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Exploring the Mughal Heritage: Agra's Imperial Capital
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-ink-soft leading-relaxed">
              <p>
                From 1526 until 1658, Agra served as the bustling imperial capital of the Mughal Empire. It was transformed by successive emperors into a grand showcase of Islamic, Persian, and indigenous Indian architecture. Nestled along the meandering Yamuna River, the city's monuments symbolize the apex of artistic expression in marble, red sandstone, and geometric landscaping.
              </p>
              <p>
                The crown jewel of this heritage is the <strong>Taj Mahal</strong>, commissioned by Emperor Shah Jahan in 1631 in memory of his beloved wife Mumtaz Mahal. Built over 22 years from translucent white Makrana marble, its Pietra Dura floral inlays and paradise Charbagh gardens have made it one of the Seven Wonders of the World. A short distance upriver lies the formidable <strong>Agra Red Fort</strong>, built by Akbar the Great in 1565. Its 2.5-kilometer double-curtain sandstone walls encompass opulent courtly palaces, including the Jahangiri Mahal, Diwan-i-Khas, and the octagonal Musamman Burj tower where Shah Jahan spent his final years.
              </p>
              <p>
                Beyond the city limits, <strong>Fatehpur Sikri</strong> stands as Akbar's imperial ghost city, founded in 1571. Anchored by the 54-meter Buland Darwaza and the white marble tomb of Sufi mystic Sheikh Salim Chishti, it blends Hindu temple pillars with Islamic arches. Additional must-visit riverside gems include <strong>Itmad-ud-Daulah</strong> (the Baby Taj, celebrated for its jewel-box Pietra Dura craftsmanship), the serene <strong>Mehtab Bagh</strong> sunset vantage point across the Yamuna, and <strong>Sikandra</strong>, the peaceful garden tomb of Emperor Akbar the Great.
              </p>
            </div>
          </div>

          {/* Subsection: Practical Visitor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="rounded-2xl border border-hairline bg-bg p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-text flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">confirmation_number</span>
                </div>
                <h3 className="font-display text-lg font-bold text-ink">ASI Ticketing & Entry Protocols</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                The Archaeological Survey of India (ASI) has eliminated paper ticketing queues at major Agra monuments. Visitors can purchase digital entry tickets via the official portal (asi.payumoney.com) or scan on-site QR codes. Note that the Taj Mahal is strictly closed on Fridays, while all other Agra monuments remain open seven days a week from sunrise to sunset.
              </p>
              <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside">
                <li>Taj Mahal Entry: ₹50 (Indians) | ₹540 (SAARC) | ₹1,100 (Foreigners)</li>
                <li>Agra Fort Entry: ₹50 (Indians) | ₹90 (SAARC) | ₹650 (Foreigners)</li>
                <li>Free entry for children under 15 years at all ASI monuments</li>
                <li>Complimentary shoe covers and water bottle provided for foreign ticket holders</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-hairline bg-bg p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold-text flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">local_taxi</span>
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Sightseeing Taxi & Chauffeur Hire</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                Navigating Agra's monuments is most comfortable in a private, air-conditioned vehicle with a verified chauffeur who handles traffic, parking, and toll logistics. Under Agra Archaeological Protection rules, motorized commercial vehicles drop passengers at designated parking plazas (such as Shilpgram at Taj East Gate), from where electric golf carts ferry visitors to the monument entrance.
              </p>
              <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside">
                <li>Sedan (Dzire / Etios): Ideal for solo travelers and couples (2-4 guests)</li>
                <li>Maruti Ertiga MPV: Great for families needing extra luggage room (4-6 guests)</li>
                <li>Toyota Innova Crysta: Premium executive comfort with plush pushback seats</li>
                <li>Force Tempo Traveller (12 to 26 seats): Best for wedding and tour groups</li>
              </ul>
            </div>
          </div>

          {/* Subsection: FAQ List */}
          <div className="pt-6 space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Frequently Asked Questions About Agra Monuments
            </h2>
            <div className="space-y-3">
              <details open className="group rounded-xl border border-hairline bg-bg p-4 sm:p-5">
                <summary className="font-display text-sm sm:text-base font-semibold text-ink cursor-pointer list-none flex items-center justify-between">
                  <span>Which day of the week is the Taj Mahal closed?</span>
                  <span className="material-symbols-outlined text-primary text-sm transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  The Taj Mahal is strictly closed to tourists every Friday for congregational prayers. However, all other major monuments in Agra—including Agra Fort, Fatehpur Sikri, Itmad-ud-Daulah (Baby Taj), Sikandra, and Mehtab Bagh—remain open all 7 days of the week.
                </p>
              </details>

              <details open className="group rounded-xl border border-hairline bg-bg p-4 sm:p-5">
                <summary className="font-display text-sm sm:text-base font-semibold text-ink cursor-pointer list-none flex items-center justify-between">
                  <span>What is the best time to visit Agra for sightseeing?</span>
                  <span className="material-symbols-outlined text-primary text-sm transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  The ideal sightseeing season is from October through March, when daytime temperatures are pleasant (15°C to 28°C). For the Taj Mahal, sunrise tours are highly recommended to avoid midday tour bus crowds and witness the soft morning light reflecting across the white marble.
                </p>
              </details>

              <details open className="group rounded-xl border border-hairline bg-bg p-4 sm:p-5">
                <summary className="font-display text-sm sm:text-base font-semibold text-ink cursor-pointer list-none flex items-center justify-between">
                  <span>How much does a full-day private taxi cost for Agra sightseeing?</span>
                  <span className="material-symbols-outlined text-primary text-sm transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  A private 8-Hour / 80 Km full-day sightseeing taxi package starts from ₹1,800 to ₹2,500 in a Sedan, covering Taj Mahal, Agra Fort, Baby Taj, and Mehtab Bagh with dedicated waiting, fuel, and parking included. Outstation day tours to Fatehpur Sikri or Mathura start from ₹3,499.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default MonumentsPage;
