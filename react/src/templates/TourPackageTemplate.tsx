import { useEffect, useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { type TourPackage, type TourPackageGalleryImage } from "../data";
import { WhatsAppIcon } from "../components/icons";
import { resolveCatalogMediaUrl } from "../services/catalog";
import { fetchLiveTourPackageBySlug } from "../services/catalogManifest";
import { VEHICLE_TIERS, type VehicleTier, resolveTierKey } from "../contracts/vehicle-tiers";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";

export interface NormalizedTourPackage {
  id: string;
  slug: string;
  packageCode?: string;
  name: string;
  kicker?: string;
  duration: string;
  days?: number;
  nights?: number;
  from: number;
  image?: string;
  gallery?: readonly TourPackageGalleryImage[];
  places?: readonly string[];
  blurb?: string;
  includes?: readonly string[];
  excludes?: readonly string[];
  source?: string;
  destination?: string;
  fleetPrices?: Record<string, number>;
  itinerary?: readonly { time?: string; title: string; desc: string }[];
  nightChargeInr?: number;
}

export interface TourPackageTemplateProps {
  language?: SupportedLanguage;
  pkg: TourPackage | NormalizedTourPackage | any;
}

interface ItineraryItem {
  time: string;
  title: string;
  desc: string;
}

const PACKAGE_DEFAULT_TIMELINES: Record<string, ItineraryItem[]> = {
  "taj-sunrise": [
    { time: "02:30 AM", title: "Doorstep Pickup from Delhi NCR / Hotel", desc: "Chauffeur arrives at your doorstep for a smooth, air-conditioned night drive via Yamuna Expressway." },
    { time: "05:30 AM", title: "Arrival in Agra & Meet ASI Guide", desc: "Quick freshen up and meet your approved government heritage guide near the Taj Mahal East Gate." },
    { time: "06:00 AM", title: "Taj Mahal Sunrise Exploration", desc: "Witness the pristine white marble bathed in golden dawn light before the public crowds arrive." },
    { time: "09:30 AM", title: "5-Star Royal Palace Buffet Breakfast", desc: "Relaxed lavish breakfast buffet at Courtyard by Marriott or ITC Mughal in Agra." },
    { time: "11:00 AM", title: "Agra Fort Royal Courtyards", desc: "Explore Jahangiri Mahal, Diwan-i-Khas, and Shah Jahan's historic prison with direct Taj views." },
    { time: "01:30 PM", title: "Lunch & Marble Inlay Atelier", desc: "Discover the age-old Pietra Dura marble inlay craft practiced by descendants of original Taj artisans." },
    { time: "04:30 PM", title: "Mehtab Bagh Sunset & Return Drive", desc: "Catch sunset reflections across the Yamuna River before a smooth expressway return drive back to Delhi NCR." },
  ],
  "agra-day": [
    { time: "06:00 AM", title: "Doorstep Hotel / Residence Pickup", desc: "Your dedicated commercial chauffeur arrives in a sanitized, chilled vehicle across Delhi NCR or Agra." },
    { time: "09:30 AM", title: "Taj Mahal Guided Heritage Excursion", desc: "Enter via express electronic gate with your licensed ASI guide for in-depth architectural narrative." },
    { time: "01:00 PM", title: "Authentic Mughlai Culinary Lunch", desc: "Enjoy a relaxed dining pause at a verified fine-dining multi-cuisine restaurant in Taj Ganj." },
    { time: "02:30 PM", title: "Agra Fort & Tomb of I'timād-ud-Daulah", desc: "Explore Akbar's majestic sandstone citadel and the delicate marble jewel-box Baby Taj." },
    { time: "05:30 PM", title: "Mehtab Bagh Sunset & Drop-Off", desc: "Capture sunset reflections across the Yamuna before comfortable drop at hotel or railway station." },
  ],
  "mathura-vrindavan": [
    { time: "07:00 AM", title: "Doorstep Pickup from Agra or Delhi NCR", desc: "Chauffeur greets you in a sanitized AC cab and departs for the sacred Braj corridor." },
    { time: "08:30 AM", title: "Shri Krishna Janmabhoomi Mathura", desc: "Visit the sacred birthplace of Lord Krishna, the ancient prison sanctum, and Keshavdev temple." },
    { time: "11:00 AM", title: "Dwarkadhish Temple & Vishram Ghat", desc: "Experience historic temple darshan followed by sacred Yamuna Aarti steps at Vishram Ghat." },
    { time: "01:00 PM", title: "Traditional Satvik Braj Bhojan", desc: "Enjoy authentic satvik vegetarian lunch with famous Mathura khoya pedas." },
    { time: "02:30 PM", title: "Banke Bihari Ji Mandir, Vrindavan", desc: "Chauffeur navigates you smoothly through Vrindavan to witness Thakur Ji's mesmerizing darshan." },
    { time: "05:00 PM", title: "ISKCON Krishna Balaram Temple", desc: "Immerse in joyful evening kirtan and peaceful marble temple corridors." },
    { time: "06:30 PM", title: "Prem Mandir Musical Light Show", desc: "Behold the magnificent white Italian marble temple illuminated in majestic evening lighting." },
    { time: "08:00 PM", title: "Smooth Expressway Return Journey", desc: "Relax in your AC vehicle on the Yamuna Expressway back to your hotel or residence." },
  ],
};

const TOUR_FAQS = [
  {
    q: "What happens if there is morning winter fog or overcast clouds?",
    a: "While morning mist occurs predominantly during late December and January, the Taj Mahal creates an enchanting mystical silhouette in soft morning conditions. Our guides adapt the route pacing—starting with the intricate interiors and marble corridors, transitioning to open courtyard photography as the morning sun burns off the mist by 08:00 AM.",
  },
  {
    q: "Are shoes allowed inside the main mausoleum chamber?",
    a: "Shoes are not permitted on the main white marble plinth. Our tour package provides complimentary hygienic fabric shoe covers so you do not have to walk barefoot or wait in long queues at the public shoe deposit counters.",
  },
  {
    q: "How do we purchase monument entry tickets?",
    a: "The Archaeological Survey of India (ASI) requires photo identification (Passport or Aadhaar card) for ticket issuance. You may purchase tickets online via the ASI portal, or simply ask our WhatsApp to pre-book them electronically under your names to bypass all on-site ticketing counters entirely.",
  },
  {
    q: "Can we alter the departure timing or customize stops?",
    a: "Yes, this is an entirely private tour. If you wish to adjust departure by 30 minutes, or replace Mehtab Bagh with the Tomb of I'timād-ud-Daulah (Baby Taj) or local petha sweets tasting, simply inform your concierge via WhatsApp or telephone without any penalty surcharge.",
  },
  {
    q: "What is the exact 28% advance payment policy?",
    a: "In accordance with our customer-protection charter, you pay only 28% online to lock the chauffeur and guide. The remaining 72% is paid directly to your chauffeur upon completion of your tour, after you are completely satisfied with your journey.",
  },
];

const CANONICAL_FLEET_DESCRIPTIONS: Record<VehicleTier, { name: string; seats: string; bags: string; ac: string; desc: string }> = {
  sedan: { name: "Sedan (Dzire / Etios)", seats: "4 Passengers", bags: "2-3 Bags", ac: "Dual Climate AC", desc: "Ideal for couples and small families." },
  ertiga: { name: "Ertiga MPV", seats: "6 Passengers", bags: "3-4 Bags", ac: "Roof-Mounted AC", desc: "Extra legroom and flexible 3rd row seating." },
  "innova-crysta": { name: "Toyota Innova Crysta", seats: "6-7 Passengers", bags: "4-5 Bags", ac: "VIP Climate Cabin", desc: "Plush captain seats and whisper-quiet suspension." },
  "tempo-traveller": { name: "Tempo Traveller", seats: "12–16 Passengers", bags: "Luggage Bay", ac: "Individual AC Vents", desc: "Spacious pushback seats for large families and groups." },
  urbania: { name: "Force Urbania Luxury Van", seats: "10–17 Passengers", bags: "Full Luggage Bay", ac: "Monocoque Luxury AC", desc: "Chauffeur-grade luxury executive travel." },
};

export function TourPackageTemplate({ language = "en", pkg }: TourPackageTemplateProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [livePackage, setLivePackage] = useState<typeof pkg | null>(null);
  const activePkg = livePackage ?? pkg;

  useEffect(() => {
    const slug = pkg.slug || pkg.id;
    if (!slug || typeof window === "undefined") return;
    let mounted = true;
    fetchLiveTourPackageBySlug(String(slug)).then((fresh) => {
      if (mounted && fresh) setLivePackage(fresh);
    });
    return () => { mounted = false; };
  }, [pkg.slug, pkg.id]);

  // Normalize package properties
  const packageName = activePkg.name || "Signature Heritage Tour";
  const packageKicker = activePkg.kicker || (activePkg.packageCode ? `CODE: ${activePkg.packageCode}` : "Signature Heritage Expedition");
  const packageDuration = activePkg.duration || activePkg.durationText || (activePkg.days ? `${activePkg.days} Days / ${activePkg.nights ?? activePkg.days - 1} Nights` : "Full Day Sightseeing");
  const packageBlurb = activePkg.blurb || (activePkg.inclusionsHighlight ? `${activePkg.inclusionsHighlight}. Private sanitized AC cab, dedicated chauffeur, and curated sightseeing.` : "Private air-conditioned chauffeur tour with personalized heritage exploration and doorstep pickup.");
  const packageSlug = activePkg.slug || activePkg.id || "tour-package";
  const packageSource = activePkg.source || "Agra";
  const packageDestination = activePkg.destination || packageName;

  // Resolve starting gross price and 28% token
  const grossPrice = Number(activePkg.from || activePkg.startingPriceInr || activePkg.fleetPrices?.sedan || 0);
  const advanceAmount = Math.round(grossPrice * 0.28);
  const balanceAmount = grossPrice - advanceAmount;

  // Normalized gallery list
  const galleryItems = useMemo<TourPackageGalleryImage[]>(() => {
    if (activePkg.gallery && Array.isArray(activePkg.gallery) && activePkg.gallery.length > 0) {
      return activePkg.gallery.map((item: any) => typeof item === "string" ? { url: item, caption: "Tour View" } : item);
    }
    if (activePkg.image) return [{ url: activePkg.image, caption: "Signature Tour View" }];
    return [];
  }, [activePkg]);

  // Media URL resolution with EXACTLY 3 BENTO HERO IMAGES (matching reference image)
  const mainImg = selectedImageIndex !== null && galleryItems[selectedImageIndex]
    ? resolveCatalogMediaUrl(galleryItems[selectedImageIndex].url)
    : resolveCatalogMediaUrl(galleryItems[0]?.url || activePkg.image || "/assets/packages/taj-dawn.webp");

  const secImg1 = galleryItems[1]?.url
    ? resolveCatalogMediaUrl(galleryItems[1].url)
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuA2yf-yBU3hlsj0yoDvKQuP0oe6WgHmL9Zp1It3UX4nt2DQnx758CLagwRSUfUyxP1x94bKKqwL8EeD-VILb9XhvYHbrj9ajEPX9oXgLEMY_ksbGoFyGii8FeQlpfiDsaJEaBiElqArswBsy-Szo9P1AiuEHzAqAHIBl2U5mryTmHPcxLdKPwyvoEk7Pc17rJDEn76H1pc-eP1-8L2SqkX8sVvPSIZZAjXjDDd2o__BhvpU5Aw0v4WFIw";
  const secCap1 = galleryItems[1]?.caption || "Grand Amar Singh Gate at Agra Red Fort";

  const secImg2 = galleryItems[2]?.url
    ? resolveCatalogMediaUrl(galleryItems[2].url)
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuBI1YNHnPOUMAYZXIn-msx_lCMvf_qW2T2cwxbtIVgvOgnUSQ5Es3br-96fv0T8NuwFm4EFi6bGA_QPKTGF6yKCLYfa279a_zZA8U4Dud5Ex6k0QTPqUTiymsfL4UhCGp9nhedjTOV-2Dg9Q4Y4MHN9bs0U-F_FF0lT2CBiiB1gfW0n8kVIE_azmlZqxA6lKnKD5AJXt2lZTxubG2rf9Grv4GXrmpphWD5jUJHc04_9DLcyq3sYwDVQ7Q";
  const secCap2 = galleryItems[2]?.caption || "Sunset vantage point over Yamuna";

  // Resolve timeline stops
  const timelineStops = useMemo<ItineraryItem[]>(() => {
    if (activePkg.itinerary && Array.isArray(activePkg.itinerary) && activePkg.itinerary.length > 0) {
      return activePkg.itinerary.map((stop: any, idx: number) => ({
        time: stop.time || `Stop 0${idx + 1}`,
        title: typeof stop.title === "string" ? stop.title : stop.title?.en || stop.name || `Sightseeing Stop ${idx + 1}`,
        desc: typeof stop.desc === "string" ? stop.desc : stop.desc?.en || stop.description || "Chauffeured sightseeing and heritage exploration.",
      }));
    }
    if (activePkg.timeline && Array.isArray(activePkg.timeline) && activePkg.timeline.length > 0) {
      return activePkg.timeline.map((stop: any) => ({
        time: stop.time || "En Route",
        title: typeof stop.title === "string" ? stop.title : stop.title?.en || "Sightseeing Stop",
        desc: typeof stop.desc === "string" ? stop.desc : stop.desc?.en || "Guided exploration.",
      }));
    }
    if (PACKAGE_DEFAULT_TIMELINES[activePkg.id] || PACKAGE_DEFAULT_TIMELINES[activePkg.slug]) {
      return PACKAGE_DEFAULT_TIMELINES[activePkg.id] || PACKAGE_DEFAULT_TIMELINES[activePkg.slug];
    }
    const placesList = activePkg.places && activePkg.places.length > 0 ? activePkg.places : [packageSource, packageDestination];
    return placesList.map((place: string, idx: number) => ({
      time: `Stop 0${idx + 1}`,
      title: place,
      desc: `Chauffeured visit and guided architectural exploration of ${place} with dedicated waiting time and parking assistance.`,
    }));
  }, [activePkg, packageSource, packageDestination]);

  const defaultIncludes = [
    "Dedicated sanitized commercial AC cab exclusively for your group",
    "Police-verified commercial chauffeur & highway specialist",
    "Expressway FASTag tolls, state commercial taxes, and parking fees",
    "Complimentary chilled bottled water and wet wipes on board",
    "Doorstep pickup & drop-off at your hotel or railway station",
  ];

  const defaultExcludes = [
    "Monument entrance tickets (kept separate for 100% transparency)",
    "Personal dining, camera fees, or souvenir shopping expenses",
    "Optional gratuities to chauffeur or licensed ASI guide",
  ];

  const packageIncludes = activePkg.includes && activePkg.includes.length > 0 ? activePkg.includes : defaultIncludes;
  const packageExcludes = activePkg.excludes && activePkg.excludes.length > 0 ? activePkg.excludes : defaultExcludes;

  const bookStep1Url = `/book.html?category=tour_package&product=${encodeURIComponent(packageSlug)}&from=${encodeURIComponent(packageSource)}&to=${encodeURIComponent(packageDestination)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    grossPrice > 0
      ? `Hello Agra SK Baghel Tour and Travels, I wish to reserve the tour package "${packageName}" (Starting ₹${grossPrice.toLocaleString("en-IN")}).`
      : `Hello Agra SK Baghel Tour and Travels, I wish to reserve the tour package "${packageName}".`
  )}`;

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/packages/${packageSlug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Packages", url: "/packages/" },
    { name: packageName, url: `/packages/${packageSlug}/` },
  ]);

  const faqSchema = buildFaqSchema(TOUR_FAQS.map((faq) => ({ question: faq.q, answer: faq.a })));

  const tripSchema = buildTouristTripSchema({
    name: packageName,
    description: packageBlurb,
    touristType: ["Cultural Heritage", "Private Sightseeing", "All-Inclusive Tour"],
    itinerary: timelineStops.map((stop) => ({
      name: stop.title,
      description: stop.desc,
    })),
    offers: {
      price: grossPrice,
      priceCurrency: "INR",
      availability: "InStock",
    },
  });

  return (
    <div className="flex flex-col w-full bg-surface">
      <JsonLd schema={buildGraphSchema(breadcrumbSchema, faqSchema, tripSchema)} />

      {/* BREADCRUMBS BAR */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm px-margin-mobile lg:px-margin border-b border-border-warm/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
          <nav className="flex items-center gap-space-xs" aria-label="Breadcrumb">
            <a className="hover:text-primary transition-colors" href="/en/">Home</a>
            <span className="text-outline-variant text-body-lg font-sans">/</span>
            <a className="hover:text-primary transition-colors" href="/en/packages/">Packages</a>
            <span className="text-outline-variant text-body-lg font-sans">/</span>
            <span className="text-primary font-medium">{packageName}</span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-body-lg text-secondary">
            <span className="w-2 h-2 rounded-full bg-success-jade inline-block animate-pulse"></span>
            <span>24×7 Instant Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* HERO STORY & VISUAL SHOWCASE */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-lg">
        <div className="flex flex-col gap-space-md">
          {/* Eyebrow Badges */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg text-label-caps uppercase font-semibold tracking-widest">
              {packageKicker}
            </span>
            <span className="bg-sandstone-wash text-terracotta-sandstone px-3 py-1 rounded-lg text-label-caps uppercase font-semibold tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-icon-14">route</span>
              {packageSource} → {packageDestination}
            </span>
            <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-lg text-label-caps uppercase font-semibold">
              All-Inclusive Chauffeur &amp; Guide
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-gold-accent font-semibold text-body-sm bg-ink-charcoal text-ivory-surface px-3 py-1 rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-icon-16 text-gold-accent">star</span>
              4.98 / 5 <span className="text-secondary-fixed-dim font-normal text-label-md">(650+ Verified Visitors)</span>
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-xs">
              <h1 className="font-headline-hero text-headline-hero text-on-surface leading-tight font-serif">
                {packageName}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                {packageBlurb}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-secondary text-body-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-primary text-icon-18">schedule</span>
                <span>Duration: <strong className="text-on-surface">{packageDuration}</strong></span>
              </div>
            </div>
          </div>

          {/* EXACT 3-IMAGE HERO BENTO MOSAIC (Matching reference image) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mt-space-md">
            {/* 1 Large Left Feature Image */}
            <div className="md:col-span-8 relative rounded-xl overflow-hidden min-h-[360px] lg:min-h-[460px] shadow-md group bg-surface-container">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={`${packageName} signature feature`}
                src={mainImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/packages/taj-dawn.webp";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/85 via-ink-charcoal/25 to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-space-sm text-ivory-surface">
                <div>
                  <span className="text-label-caps uppercase text-gold-accent font-semibold tracking-wider">
                    Signature Experience
                  </span>
                  <h3 className="font-headline-md text-headline-sm text-surface font-serif">Private AC Chauffeur Expedition</h3>
                  <p className="text-body-sm text-sandstone-wash/80 max-w-lg">
                    Tolls included, chilled bottled water, wet wipes, and verified licensed ASI guide.
                  </p>
                </div>
                <span className="bg-surface/20 backdrop-blur-md px-3 py-1 rounded-lg text-body-sm font-medium">
                  Doorstep Pickup
                </span>
              </div>
            </div>

            {/* 2 Stacked Right Images */}
            <div className="md:col-span-4 grid grid-cols-1 gap-space-md">
              <div className="relative rounded-xl overflow-hidden min-h-[170px] lg:min-h-[215px] shadow-sm group bg-surface-container">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={`${packageName} monument vantage`}
                  src={secImg1}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/places/gallery/taj-mahal-01.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-ivory-surface">
                  <span className="text-label-caps uppercase text-terracotta-sunlit">Monument Vantage</span>
                  <p className="font-headline-sm text-headline-card leading-snug">{secCap1}</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden min-h-[170px] lg:min-h-[215px] shadow-sm group bg-surface-container">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={`${packageName} heritage hospitality`}
                  src={secImg2}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/assets/places/gallery/agra-fort-01.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-ivory-surface">
                  <span className="text-label-caps uppercase text-gold-accent">Heritage Experience</span>
                  <p className="font-headline-sm text-headline-card leading-snug">{secCap2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Thumbnail Strip with all verified photos */}
          {galleryItems.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-surface-container-low rounded-xl border border-border-warm/60 no-scrollbar">
              {galleryItems.map((g, idx) => {
                const url = resolveCatalogMediaUrl(g.url);
                const isSelected = (selectedImageIndex === null && idx === 0) || selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                      isSelected ? "border-primary ring-2 ring-primary/50 scale-102" : "border-border-warm opacity-80 hover:opacity-100"
                    } shadow-xs`}
                  >
                    <img
                      src={url}
                      alt={g.alt || `${packageName} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/assets/packages/taj-dawn.webp";
                      }}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-on-surface-variant font-semibold pl-2 shrink-0">
                {galleryItems.length} Verified Photo{galleryItems.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* CORE CONTENT: ITINERARY & RESERVATION DOCK */}
      <section className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* LEFT COLUMN: Chapters 01-04 */}
          <div className="lg:col-span-7 flex flex-col gap-space-2xl">
            {/* Chapter 01: The Experience Overview */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">01.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">The Imperial Heritage Experience</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {packageBlurb} Designed with complete flexibility and royal hospitality, this private expedition bypasses crowded tour buses, ensuring an intimate, personalized connection with the grand history and architecture of North India.
              </p>
              <div className="bg-surface-container rounded-xl p-space-md flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-gold-accent text-icon-24 shrink-0 mt-0.5">hotel_class</span>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">Why Private Chauffeur Travel is Paramount</span>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Doorstep hotel pickup, peaceful expressway transit, zero midway detours, and complete freedom to pause for photography and dining whenever you desire.
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter 02: Clear Transparent Package Accounting */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">02.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Clear Transparent Package Accounting</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {/* Included */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-success-jade">
                    <span className="material-symbols-outlined text-icon-22">check_circle</span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">What is Fully Included</span>
                  </div>
                  <ul className="flex flex-col gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    {packageIncludes.map((inc: string, i: number) => (
                      <li key={i} className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-success-jade text-icon-18 shrink-0 mt-0.5">check_circle</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Excluded */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-secondary">
                    <span className="material-symbols-outlined text-icon-22">cancel</span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">Transparent Exclusions</span>
                  </div>
                  <ul className="flex flex-col gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    {packageExcludes.map((exc: string, i: number) => (
                      <li key={i} className="flex items-start gap-space-xs">
                        <span className="material-symbols-outlined text-outline text-icon-18 shrink-0 mt-0.5">remove_circle_outline</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Chapter 03: Monument Protocols & Guidelines */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">03.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Monument Protocols &amp; Visitor Etiquette</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">badge</span>
                  <span className="font-title-md text-on-surface font-semibold">Government ID Required</span>
                  <p className="text-body-sm text-secondary">Original Passport or Aadhaar required for entry ticketing security gates.</p>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">event_busy</span>
                  <span className="font-title-md text-on-surface font-semibold">Friday Taj Closure</span>
                  <p className="text-body-sm text-secondary">Taj Mahal is closed every Friday for prayers. Agra Fort & Fatehpur Sikri remain open.</p>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">no_backpack</span>
                  <span className="font-title-md text-on-surface font-semibold">Prohibited Items</span>
                  <p className="text-body-sm text-secondary">Tripods, tobacco, food items, and large bags are prohibited inside central monuments.</p>
                </div>
              </div>
            </div>

            {/* Chapter 04: Hour-by-Hour Timeline */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">04.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Curated Tour Timeline</h2>
              </div>
              <div className="relative pl-6 border-l-2 border-border-warm space-y-6">
                {timelineStops.map((stop, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-surface" />
                    <span className="text-xs font-semibold text-terracotta-sandstone uppercase tracking-wider">{stop.time}</span>
                    <h3 className="font-title-md text-ink-charcoal font-serif">{stop.title}</h3>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{stop.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Reservation Dock */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-sandstone-wash/80 rounded-2xl border border-border-warm p-space-xl shadow-lg flex flex-col gap-space-lg">
              <div className="flex flex-col">
                <span className="text-label-caps uppercase text-terracotta-sandstone font-bold tracking-widest">
                  Private Tour Package Tariff
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                    {grossPrice > 0 ? `₹${grossPrice.toLocaleString("en-IN")}` : "Custom Quote"}
                  </span>
                  <span className="text-body-md text-on-surface-variant font-medium">All-Inclusive</span>
                </div>
                {grossPrice > 0 ? (
                  <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-surface border border-border-warm/60 text-body-sm text-secondary">
                    <span className="material-symbols-outlined text-success-jade text-icon-20">verified</span>
                    <span>Pay only <strong>₹{advanceAmount.toLocaleString("en-IN")}</strong> now (28% advance token). Balance ₹{balanceAmount.toLocaleString("en-IN")} on drop.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-surface border border-border-warm/60 text-body-sm text-secondary">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">info</span>
                    <span>Live quotation generated upon vehicle and date selection. Zero upfront token until confirmed.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-space-sm">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-semibold hover:bg-terracotta-sunlit transition-all shadow-md text-center"
                  href={bookStep1Url}
                >
                  <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                  <span>Reserve This Package Now</span>
                </a>
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-neutral-900 border border-white/10 py-3 rounded-lg text-label-lg font-semibold transition-all shadow-sm text-center"
                  style={{ color: "#ffffff" }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
                  <span className="text-white" style={{ color: "#ffffff" }}>Inquire on WhatsApp</span>
                </a>
              </div>

              {/* Guarantees List */}
              <div className="pt-space-sm border-t border-border-warm/60 flex flex-col gap-2 text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18">check</span>
                  <span>24-Hour Free Cancellation guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18">check</span>
                  <span>100% Commercial Yellow-Plate sanitized cab</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18">check</span>
                  <span>Zero commission shopping stopovers guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CANONICAL 5-FLEET PRICE COMPARISON MATRIX */}
      <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Vehicle Upgrade Tiers
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Select Fleet Tier for {packageName}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Fixed, guaranteed package rates for all 5 canonical vehicle classes. Includes air-conditioned travel, parking receipts, and chauffeur custody.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {VEHICLE_TIERS.map((tier) => {
              const spec = CANONICAL_FLEET_DESCRIPTIONS[tier];
              const resolved = resolveTierKey(activePkg.fleetPrices, tier);
              let tierFare = Number(resolved.value || 0);

              if (!tierFare && tier === "sedan") {
                tierFare = grossPrice;
              }

              const token = Math.round(tierFare * 0.28);

              return (
                <div
                  key={tier}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-warm/60 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-md uppercase tracking-wider font-semibold">
                        {tier.replace("-", " ")}
                      </span>
                      <span className="text-body-sm text-secondary font-medium">{spec.seats}</span>
                    </div>

                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-serif mt-1">{spec.name}</h3>

                    <div className="flex flex-col gap-1 py-space-xs border-y border-border-warm/30 text-body-sm text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span>Luggage:</span>
                        <span className="font-medium text-ink-charcoal">{spec.bags}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Climate:</span>
                        <span className="font-medium text-success-jade">{spec.ac}</span>
                      </div>
                      <p className="text-xs text-secondary mt-1">{spec.desc}</p>
                    </div>

                    <div className="flex flex-col pt-1">
                      <span className="text-label-md font-label-caps text-secondary uppercase">
                        All-Inclusive Fixed Price
                      </span>
                      <span className="font-headline-md text-headline-md text-terracotta-sandstone font-serif font-semibold">
                        {tierFare > 0 ? `₹${tierFare.toLocaleString("en-IN")}` : "On request"}
                      </span>
                      {tierFare > 0 ? (
                        <span className="text-label-md text-secondary">
                          ₹{token.toLocaleString("en-IN")} token to lock (28%)
                        </span>
                      ) : (
                        <span className="text-label-md text-secondary">
                          Live quote upon booking
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    className="mt-space-md w-full inline-flex items-center justify-center gap-1 bg-terracotta-deep text-white py-2.5 rounded text-label-lg font-label-lg shadow-sm hover:bg-terracotta-sunlit transition-all text-center"
                    href={`/book.html?category=tour_package&product=${encodeURIComponent(packageSlug)}&car=${tier}&from=${encodeURIComponent(packageSource)}&to=${encodeURIComponent(packageDestination)}`}
                  >
                    <span>Select {tier === "innova-crysta" ? "Innova" : tier.split("-")[0]}</span>
                    <span className="material-symbols-outlined text-icon-16">arrow_forward</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PACKAGE FAQS */}
      <section className="w-full bg-surface py-space-3xl">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin">
          <div className="flex flex-col items-center text-center mb-space-2xl">
            <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase tracking-widest mb-space-xs">
              Helpful Information
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-serif mb-space-sm">
              Frequently Asked Questions
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Common questions answered by our travel desk regarding timings, ticket bookings, and chauffeur standards.
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            {TOUR_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border-warm/60 bg-surface-container-lowest overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-space-lg py-space-md text-left flex items-center justify-between gap-space-md hover:bg-sandstone-wash/30 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-ink-charcoal font-serif">{faq.q}</span>
                    <span className={`material-symbols-outlined text-icon-20 text-terracotta-sandstone transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-lg pb-space-md pt-space-xs border-t border-border-warm/20 text-body-md text-on-surface-variant leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
