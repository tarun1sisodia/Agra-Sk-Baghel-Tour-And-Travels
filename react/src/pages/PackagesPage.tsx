import { useState, useMemo, useEffect } from "react";
import { siteConfig, type SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { packages as staticPackages, type TourPackage } from "../data";
import generatedPublishedTourPackages from "../data/generated-published-tour-packages.json";
import { WhatsAppIcon } from "../components/icons";
import { Pagination } from "../components/ui/Pagination";
import { LiveCatalogSection } from "../components/catalog/LiveCatalogSection";
import { loadPublishedPackages, toDossierTourPackage } from "../services/catalogManifest";
import { resolveCatalogMediaUrl } from "../services/catalog";
import { LatestPackagesSection } from "../templates/sections/LatestPackagesSection";
import { LatestToursSection } from "../templates/sections/LatestToursSection";

interface PackagesPageProps {
  language?: SupportedLanguage;
}

type PackageFilterCategory = "all" | "sightseeing" | "dawn" | "pilgrimage" | "multiday" | "excursion";

interface PackageCardData {
  pkg: TourPackage;
  categories: PackageFilterCategory[];
  badgeTag: string;
  badgeClass: string;
  durationBadge: string;
  durationIcon: string;
  stops: string[];
  inclusions: string[];
  vehiclePrices: { label: string; price: string }[];
}

const PACKAGE_METADATA: Record<string, {
  categories: PackageFilterCategory[];
  badgeTag: string;
  badgeClass: string;
  durationBadge: string;
  durationIcon: string;
  stops: string[];
  inclusions: string[];
  vehiclePrices?: { label: string; price: string }[];
  suitedFor: string;
  recommendedFleet: string;
}> = {
  "agra-day": {
    categories: ["sightseeing"],
    badgeTag: "MOST POPULAR",
    badgeClass: "bg-primary text-on-primary",
    durationBadge: "8–10 Hours",
    durationIcon: "schedule",
    stops: ["Taj Mahal (Dawn/Morning)", "Agra Fort Diwan-i-Khas", "Baby Taj (Itimad-ud-Daulah)", "Mehtab Bagh Sunset"],
    inclusions: [
      "Hotel or Agra Cantt Railway Station pickup & drop",
      "All fuel, commercial toll parking receipts included",
      "Dedicated AC chauffeur & chilled bottled water",
    ],
    vehiclePrices: [
      { label: "Ertiga", price: "₹4,499" },
      { label: "Innova", price: "₹6,499" },
      { label: "Tempo", price: "₹9,500" },
    ],
    suitedFor: "First-Time Visitors",
    recommendedFleet: "Sedan Dzire / Ertiga",
  },
  "taj-sunrise": {
    categories: ["dawn", "sightseeing"],
    badgeTag: "DAWN SPECIAL",
    badgeClass: "bg-gold-accent text-ink-charcoal font-bold",
    durationBadge: "5:00 AM Departure",
    durationIcon: "alarm",
    stops: ["5:15 AM Gate Queue Priority", "Taj First Light Glow", "Mehtab Bagh Morning View", "Heritage Breakfast Halt"],
    inclusions: [
      "VIP Dawn priority chauffeur timing & hotel pickup",
      "Skip-the-line guidance & prime photo vantage access",
      "Chilled towels, hydration kit & umbrella on board",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹12,999" },
      { label: "Innova Crysta", price: "₹15,500" },
      { label: "Urbania Van", price: "₹22,000" },
    ],
    suitedFor: "Couples & Photographers",
    recommendedFleet: "Innova Crysta VIP",
  },
  "mathura-vrindavan": {
    categories: ["pilgrimage"],
    badgeTag: "PILGRIMAGE",
    badgeClass: "bg-terracotta-deep text-white",
    durationBadge: "55 KM Corridor",
    durationIcon: "map",
    stops: ["Krishna Janmabhoomi", "Dwarkadhish Mathura", "Banke Bihari Temple", "Prem Mandir Light Show"],
    inclusions: [
      "Aarti schedule synchronized so you never encounter closed gates",
      "Designated drop points nearest to temple e-rickshaw links",
      "Agra round-trip transit with UP state permit paid",
    ],
    vehiclePrices: [
      { label: "Ertiga", price: "₹5,500" },
      { label: "Innova", price: "₹7,500" },
      { label: "Tempo", price: "₹11,500" },
    ],
    suitedFor: "Families & Pilgrims",
    recommendedFleet: "Ertiga / Innova / Tempo",
  },
  "gatimaan-express": {
    categories: ["dawn", "sightseeing"],
    badgeTag: "FAST-TRACK",
    badgeClass: "bg-primary text-on-primary",
    durationBadge: "12h Total Tour",
    durationIcon: "train",
    stops: ["Nizamuddin Train Reception", "Agra Cantt Nameboard Meet", "Taj Mahal & Red Fort", "5-Star Buffet & Return"],
    inclusions: [
      "Agra Cantt platform greeting with guest nameboard",
      "Full-day dedicated executive sedan or Innova in Agra",
      "Assisted drop back to Gatimaan Express 5:50 PM return",
    ],
    vehiclePrices: [
      { label: "Executive Sedan", price: "₹14,999" },
      { label: "Innova Crysta", price: "₹17,999" },
    ],
    suitedFor: "Business & Delhi Expats",
    recommendedFleet: "Train + Executive Cab",
  },
  "agra-fort-day": {
    categories: ["sightseeing", "multiday"],
    badgeTag: "2 DAYS / 1 NIGHT",
    badgeClass: "bg-terracotta-deep text-white",
    durationBadge: "2 Full Days",
    durationIcon: "hotel",
    stops: ["Day 1: Fort + Artisan Lane", "Sunset Yamuna Point", "Day 2: Taj Dawn & Sikandra", "Fatehpur Sikri Capital"],
    inclusions: [
      "48-hour continuous vehicle custody for your family",
      "Excursion to Emperor Akbar's Tomb & Fatehpur Sikri",
      "Driver night allowance & parking fully settled",
    ],
    vehiclePrices: [
      { label: "Innova Crysta", price: "₹11,500" },
      { label: "Tempo Traveller", price: "₹16,500" },
    ],
    suitedFor: "Unhurried Elders",
    recommendedFleet: "Innova Crysta",
  },
  "golden-triangle": {
    categories: ["multiday"],
    badgeTag: "ICONIC CIRCUIT",
    badgeClass: "bg-ink-charcoal text-gold-accent font-bold",
    durationBadge: "3 Imperial Cities",
    durationIcon: "route",
    stops: ["Delhi India Gate & Qutub", "Agra Taj Mahal Sunrise", "Chand Baori Stepwell", "Jaipur Amber Fort & Hawa"],
    inclusions: [
      "All 3 interstate border permits (UP, RJ, Delhi NCT)",
      "Dedicated long-range highway chauffeur with night halt",
      "Flexible Delhi airport or Jaipur airport conclusion",
    ],
    vehiclePrices: [
      { label: "Innova Crysta", price: "₹24,000" },
      { label: "Tempo Traveller", price: "₹36,000" },
    ],
    suitedFor: "International Voyagers",
    recommendedFleet: "Innova / Tempo Traveller",
  },
  "fatehpur-sikri": {
    categories: ["sightseeing", "excursion"],
    badgeTag: "CITADEL EXCURSION",
    badgeClass: "bg-terracotta-deep text-white font-bold",
    durationBadge: "40 KM Corridor",
    durationIcon: "fort",
    stops: ["Buland Darwaza", "Sheikh Salim Chishti Dargah", "Panch Mahal", "Jodha Bai Palace"],
    inclusions: [
      "Agra hotel doorstep pickup & drop",
      "All highway tolls & parking receipts included",
      "Dedicated AC chauffeur & chilled bottled water",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹2,000" },
      { label: "Ertiga", price: "₹2,700" },
      { label: "Innova", price: "₹3,645" },
      { label: "Tempo", price: "₹5,800" },
    ],
    suitedFor: "History Enthusiasts",
    recommendedFleet: "Sedan / Ertiga / Innova",
  },
  "jaipur-excursion": {
    categories: ["sightseeing", "excursion"],
    badgeTag: "ROYAL EXCURSION",
    badgeClass: "bg-gold-accent text-ink-charcoal font-bold",
    durationBadge: "240 KM Corridor",
    durationIcon: "directions_car",
    stops: ["Amber Fort & Lake", "Hawa Mahal", "Jal Mahal Palace", "City Palace"],
    inclusions: [
      "All NH-21 tolls and Rajasthan state passenger tax included",
      "Dedicated long-range highway cruiser",
      "Agra hotel pickup & drop with zero dead-mileage charges",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹3,499" },
      { label: "Ertiga", price: "₹4,800" },
      { label: "Innova", price: "₹6,499" },
      { label: "Tempo", price: "₹9,800" },
    ],
    suitedFor: "Royal Culture Voyagers",
    recommendedFleet: "Sedan / Innova Crysta",
  },
  "bharatpur-sanctuary": {
    categories: ["excursion"],
    badgeTag: "WILDLIFE SAFARI",
    badgeClass: "bg-success-jade text-white font-bold",
    durationBadge: "55 KM Corridor",
    durationIcon: "flutter_dash",
    stops: ["Keoladeo National Park (UNESCO)", "Sarus Crane Wetland", "Lohagarh Fort", "Deeg Palace"],
    inclusions: [
      "Doorstep Agra round-trip cab transfer",
      "Rajasthan commercial entry permit paid",
      "Keoladeo sanctuary parking and toll fees included",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹2,200" },
      { label: "Ertiga", price: "₹2,900" },
      { label: "Innova", price: "₹3,800" },
      { label: "Tempo", price: "₹5,800" },
    ],
    suitedFor: "Birdwatchers & Nature Lovers",
    recommendedFleet: "Sedan / Ertiga / Innova",
  },
  "delhi-landmarks": {
    categories: ["sightseeing", "excursion"],
    badgeTag: "CAPITAL CIRCUIT",
    badgeClass: "bg-ink-charcoal text-white font-bold",
    durationBadge: "230 KM Corridor",
    durationIcon: "location_city",
    stops: ["Qutub Minar", "Humayun's Tomb", "India Gate", "Red Fort"],
    inclusions: [
      "Yamuna Expressway fast-track tolls included",
      "Delhi commercial entry passenger permits settled",
      "Full Delhi city transit and doorstep hotel drop",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹3,499" },
      { label: "Ertiga", price: "₹4,800" },
      { label: "Innova", price: "₹6,499" },
      { label: "Tempo", price: "₹9,500" },
    ],
    suitedFor: "Capital Voyagers",
    recommendedFleet: "Sedan / Innova Crysta",
  },
  "agra-markets": {
    categories: ["sightseeing"],
    badgeTag: "SHOPPING TOUR",
    badgeClass: "bg-sandstone-wash text-primary font-bold",
    durationBadge: "8 Hours / 80 KM",
    durationIcon: "shopping_bag",
    stops: ["Sadar Bazaar Crafts", "Kinari Bazaar Zardozi", "Marble Inlay Studios", "Petha Confectioners"],
    inclusions: [
      "8 hours / 80 km continuous vehicle custody",
      "Dedicated chauffeur waiting at every market stop",
      "Zero parking stress and safe luggage custody in vehicle",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹1,900" },
      { label: "Ertiga", price: "₹2,600" },
      { label: "Innova", price: "₹2,850" },
      { label: "Tempo", price: "₹5,500" },
    ],
    suitedFor: "Souvenir & Handicraft Shoppers",
    recommendedFleet: "Sedan / Ertiga",
  },
  "agra-complete": {
    categories: ["sightseeing"],
    badgeTag: "ALL 6 MONUMENTS",
    badgeClass: "bg-primary text-on-primary font-bold",
    durationBadge: "12 Hours / 120 KM",
    durationIcon: "hotel_class",
    stops: ["Taj Mahal & Agra Fort", "Baby Taj", "Mehtab Bagh Sunset", "Akbar Tomb Sikandra"],
    inclusions: [
      "12 hours / 120 km comprehensive vehicle custody",
      "All Agra municipal parking and tolls included",
      "Chilled bottled water & verified chauffeur",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹2,200" },
      { label: "Ertiga", price: "₹2,900" },
      { label: "Innova", price: "₹3,400" },
      { label: "Tempo", price: "₹6,200" },
    ],
    suitedFor: "Architecture Aficionados",
    recommendedFleet: "Sedan / Innova / Urbania",
  },
  "golden-triangle-4d": {
    categories: ["multiday"],
    badgeTag: "GRAND CIRCUIT",
    badgeClass: "bg-ink-charcoal text-gold-accent font-bold",
    durationBadge: "4 Days / 3 Nights",
    durationIcon: "route",
    stops: ["Delhi Historic Quarters", "Taj Mahal Sunrise", "Fatehpur Sikri & Stepwell", "Jaipur Royal Palaces"],
    inclusions: [
      "4 continuous days dedicated private vehicle custody",
      "All 3 state entry taxes (UP, DL, RJ) and highway tolls",
      "Chauffeur overnight stay allowances fully covered",
    ],
    vehiclePrices: [
      { label: "Sedan", price: "₹24,000" },
      { label: "Ertiga", price: "₹29,000" },
      { label: "Innova", price: "₹35,000" },
      { label: "Tempo", price: "₹47,000" },
    ],
    suitedFor: "Complete India Tour Voyagers",
    recommendedFleet: "Innova Crysta / Force Urbania",
  },
};

const PACKAGES_FAQS = [
  {
    q: "Are monument entry tickets included in the package price?",
    a: "Monument tickets are intentionally excluded to give you full financial transparency and avoid exorbitant intermediary markups. Indian citizens pay ₹50, SAARC tourists pay ₹540, and foreign tourists pay ₹1,100 at the Taj Mahal. Your chauffeur will guide you directly to the electronic ASI contactless kiosk or assist you with booking online via the official ASI portal on your phone.",
  },
  {
    q: "Can we customize monument stops or spend extra time at the Taj Mahal?",
    a: "Yes, absolutely. Because all our tours are 100% private charters, you set the tempo. If you want to spend 3 hours immersed in the Taj Mahal's marble gardens and skip a minor monument, or make a lunch stopover at a particular culinary spot in Agra, your chauffeur will happily accommodate your preferences without extra charges within the daily duration.",
  },
  {
    q: "Do you provide English, Spanish, German, or French-speaking tour guides?",
    a: "Yes. We coordinate with Ministry of Tourism certified and licensed Archaeological Survey of India (ASI) guides who speak fluent English, French, Spanish, German, Italian, or Russian. The guide fee is fixed at government-mandated tariffs and can be added directly to your itinerary upon reservation.",
  },
  {
    q: "What happens if our train (e.g. Gatimaan Express) or flight is delayed?",
    a: "We track train numbers (such as 12050 Gatimaan Express or 12002 Shatabdi) and flight arrivals in real-time. If your train or flight is delayed, your assigned chauffeur remains stationed at the arrival terminal with zero waiting penalty for up to 90 minutes.",
  },
  {
    q: "Can elderly passengers or wheelchair users be accommodated comfortably?",
    a: "Yes, our fleet includes comfortable high-seating vehicles like the Innova Crysta and Force Urbania that offer easy ingress and egress. We can arrange collapsible wheelchair storage in the trunk and coordinate golf-cart battery shuttle transit between monument gates and monument entries where walking distances are extensive.",
  },
];

const GALLERY_PREFIX = "/assets/places/gallery/";
const GALLERY_SIZES = "(max-width: 640px) 480px, (max-width: 1100px) 960px, 1600px";

function galleryBase(url: string): string | null {
  return url.startsWith(GALLERY_PREFIX) && url.endsWith(".jpg")
    ? url.slice(0, -".jpg".length)
    : null;
}

interface PackagePhotoProps {
  url: string;
  alt: string;
  className?: string;
  eager?: boolean;
  onClick?: () => void;
}

function PackagePhoto({ url, alt, className, eager, onClick }: PackagePhotoProps) {
  const resolved = resolveCatalogMediaUrl(url);
  const base = galleryBase(resolved);
  const [currentSrc, setCurrentSrc] = useState(base ? `${base}.jpg` : resolved || "/assets/packages/taj-dawn.webp");

  useEffect(() => {
    setCurrentSrc(base ? `${base}.jpg` : resolved || "/assets/packages/taj-dawn.webp");
  }, [base, resolved]);

  const img = (
    <img
      src={currentSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onClick={onClick}
      onError={() => {
        if (currentSrc !== "/assets/packages/taj-dawn.webp") {
          setCurrentSrc("/assets/packages/taj-dawn.webp");
        }
      }}
    />
  );
  if (!base) return img;
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${base}-480.avif 480w, ${base}-960.avif 960w, ${base}-1600.avif 1600w`}
        sizes={GALLERY_SIZES}
      />
      <source
        type="image/webp"
        srcSet={`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`}
        sizes={GALLERY_SIZES}
      />
      {img}
    </picture>
  );
}

function getPackageImage(slug: string): string {
  if (slug.includes("sunrise")) return "/assets/packages/taj-sunrise.webp";
  if (slug.includes("gatimaan")) return "/assets/packages/gatimaan-express.webp";
  if (slug.includes("mathura") || slug.includes("vrindavan")) return "/assets/packages/mathura-vrindavan.webp";
  if (slug.includes("golden-triangle")) return "/assets/packages/golden-triangle.webp";
  if (slug.includes("overnight") || slug.includes("unhurried")) return "/assets/packages/agra-day.webp";
  return "/assets/packages/agra-day.webp";
}


const dossierTourPackages: TourPackage[] = (generatedPublishedTourPackages as any[])
  .filter((item) => item && (item.slug || item.packageCode || item.package_code) && item.name)
  .map(toDossierTourPackage);

export function PackagesPage({ language = "en" }: PackagesPageProps) {
  // Category Filter State
  const [activeCategory, setActiveCategory] = useState<PackageFilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [modalImage, setModalImage] = useState<{ url: string; title: string; caption?: string } | null>(null);
  
  const initialPackageList = useMemo(() => {
    const map = new Map<string, TourPackage>();
    for (const p of staticPackages) {
      map.set(p.slug, p);
    }
    for (const dp of dossierTourPackages) {
      map.set(dp.slug, dp);
    }
    return Array.from(map.values());
  }, []);

  const [packageList, setPackageList] = useState<TourPackage[]>(initialPackageList);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      const page = Number(new URLSearchParams(window.location.search).get("page"));
      return page > 0 ? page : 1;
    }
    return 1;
  });
  const itemsPerPage = 6;

  useEffect(() => {
    let isMounted = true;
    loadPublishedPackages()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          const map = new Map<string, TourPackage>();
          for (const dp of dossierTourPackages) {
            map.set(dp.slug, dp);
          }
          for (const p of items) {
            map.set(p.slug, p);
          }
          setPackageList(Array.from(map.values()));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      window.history.pushState({}, "", url.toString());
      const section = document.getElementById("packages-directory");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Enrich packages with metadata
  const enrichedPackages = useMemo<PackageCardData[]>(() => {
    return packageList.map((pkg) => {
      const meta = PACKAGE_METADATA[pkg.id] || PACKAGE_METADATA[pkg.slug] || {
        categories: [(pkg as any).category === "tour" ? "sightseeing" : "multiday"],
        badgeTag: "CURATED TOUR",
        badgeClass: "bg-primary text-on-primary",
        durationBadge: pkg.duration || "1 Day",
        durationIcon: "schedule",
        stops: pkg.places && pkg.places.length > 0 ? [...pkg.places] : [pkg.name],
        inclusions: pkg.includes && pkg.includes.length > 0 ? [...pkg.includes].slice(0, 3) : [
          "Private AC vehicle",
          "Dedicated verified chauffeur",
          "All highway tolls & parking fees included",
        ],
        suitedFor: "Travelers & Groups",
        recommendedFleet: "Sedan / Ertiga / Innova",
      };

      const fp = pkg.fleetPrices;
      const hasRecognizedFleet = Boolean(
        fp &&
        ((fp.sedan != null && Number(fp.sedan) > 0) ||
         (fp.ertiga != null && Number(fp.ertiga) > 0) ||
         (fp.innova != null && Number(fp.innova) > 0) ||
         (fp.tempo != null && Number(fp.tempo) > 0) ||
         (fp.urbania != null && Number(fp.urbania) > 0))
      );
      const vehiclePrices: { label: string; price: string }[] = hasRecognizedFleet && fp
        ? [
            ...(fp.sedan != null && Number(fp.sedan) > 0 ? [{ label: "Sedan", price: `₹${Number(fp.sedan).toLocaleString("en-IN")}` }] : []),
            ...(fp.ertiga != null && Number(fp.ertiga) > 0 ? [{ label: "Ertiga", price: `₹${Number(fp.ertiga).toLocaleString("en-IN")}` }] : []),
            ...(fp.innova != null && Number(fp.innova) > 0 ? [{ label: "Innova", price: `₹${Number(fp.innova).toLocaleString("en-IN")}` }] : []),
            ...(fp.tempo != null && Number(fp.tempo) > 0 ? [{ label: "Tempo", price: `₹${Number(fp.tempo).toLocaleString("en-IN")}` }] : []),
            ...(fp.urbania != null && Number(fp.urbania) > 0 ? [{ label: "Urbania", price: `₹${Number(fp.urbania).toLocaleString("en-IN")}` }] : []),
          ]
        : pkg.from != null && Number(pkg.from) > 0
        ? [{ label: "Starting From", price: `₹${Number(pkg.from).toLocaleString("en-IN")}` }]
        : [{ label: "All Vehicles", price: "On request" }];

      return {
        pkg,
        categories: meta.categories,
        badgeTag: meta.badgeTag,
        badgeClass: meta.badgeClass,
        durationBadge: meta.durationBadge,
        durationIcon: meta.durationIcon,
        stops: meta.stops,
        inclusions: meta.inclusions,
        vehiclePrices,
      };
    });
  }, [packageList]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedPackages.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.categories.includes(activeCategory);
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.pkg.name.toLowerCase().includes(q) ||
        item.pkg.blurb.toLowerCase().includes(q) ||
        item.stops.some((s) => s.toLowerCase().includes(q)) ||
        item.inclusions.some((inc) => inc.toLowerCase().includes(q))
      );
    });
  }, [enrichedPackages, activeCategory, searchQuery]);

  const displayedPackages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPackages.slice(start, start + itemsPerPage);
  }, [filteredPackages, currentPage, itemsPerPage]);

  // Structured Data (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        "@id": `${siteConfig.domain}/#service`,
        name: "Agra SK Baghel Tour and Travels Private Sightseeing Packages",
        serviceType: "Private Heritage & Outstation Tour Packages",
        provider: {
          "@type": "LocalBusiness",
          name: "Agra SK Baghel Tour and Travels",
          telephone: contact.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Near Taj Mahal, Taj Ganj",
            addressLocality: "Agra",
            addressRegion: "UP",
            postalCode: "282001",
            addressCountry: "IN",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteConfig.domain}/en/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Packages",
            item: `${siteConfig.domain}/en/packages/`,
          },
        ],
      },
      ...packageList.map((pkg: TourPackage) => ({
        "@type": "TouristTrip",
        name: pkg.name,
        description: pkg.blurb,
        touristType: "Cultural, Heritage & Sightseeing",
        itinerary: {
          "@type": "ItemList",
          numberOfItems: pkg.places?.length ?? 0,
          itemListElement: (pkg.places ?? []).map((place: string, idx: number) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: place,
          })),
        },
        offers: {
          "@type": "Offer",
          price: pkg.from,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
      })),
      {
        "@type": "FAQPage",
        mainEntity: PACKAGES_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* TOP ARCHITECTURAL HERO INTRO */}
      <section className="relative bg-surface-container-low overflow-hidden border-b border-border-warm/60">
        {/* Subtle architectural lattice watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full text-on-surface" preserveAspectRatio="none" viewBox="0 0 100 100">
            <pattern height="20" id="mughal-lattice-hero" patternUnits="userSpaceOnUse" width="20">
              <path d="M 0 10 L 10 0 L 20 10 L 10 20 Z" fill="none" stroke="currentColor" strokeWidth="0.75"></path>
              <circle cx="10" cy="10" fill="currentColor" r="1.5"></circle>
            </pattern>
            <rect fill="url(#mughal-lattice-hero)" height="100%" width="100%"></rect>
          </svg>
        </div>

        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin pt-space-xl pb-space-2xl relative z-10">
          {/* Breadcrumb Bar */}
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm mb-space-lg" aria-label="Breadcrumb">
            <a className="hover:text-primary transition-colors" href="/">Home</a>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-primary font-semibold">Tour Packages</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-sandstone-wash w-fit">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-terracotta-sandstone font-semibold">
                  Agra Tour &amp; Sightseeing Desk
                </span>
              </div>
              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal leading-[1.12]">
                Agra Local Sightseeing Taxi <br className="hidden sm:inline" />
                <span className="italic font-normal text-terracotta-sandstone">&amp; Tour Packages</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Hire a local sightseeing taxi in Agra. Low-cost customized day packages covering Taj Mahal, Agra Fort, Baby Taj, and Mehtab Bagh with professional local driver-guides.
              </p>
            </div>

          </div>

          {/* Trust Ribbon Mosaic (Frosted Glass Bento) */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-3">
            <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xs border border-white/60">
              <span className="material-symbols-outlined text-primary text-icon-22">explore</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">6 Signature Packages</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Same-Day to Multi-Day</div>
              </div>
            </div>
            <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xs border border-white/60">
              <span className="material-symbols-outlined text-success-jade text-icon-22">verified_user</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">0% Shopping Traps</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Direct monuments only</div>
              </div>
            </div>
            <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xs border border-white/60">
              <span className="material-symbols-outlined text-primary text-icon-22">badge</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">Govt-Approved Guides</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Licensed ASI historians</div>
              </div>
            </div>
            <div className="glass-card-frosted p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xs border border-white/60">
              <span className="material-symbols-outlined text-primary text-icon-22">directions_car</span>
              <div>
                <div className="font-title-sm text-xs font-bold text-ink-charcoal">Doorstep Pickup</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">Hotel &amp; Cantt Station</div>
              </div>
            </div>
          </div>

          {/* High-Intent Local Sightseeing Editorial Section (Phase 9) */}
          <div className="mt-8 pt-6 border-t border-border-warm/40 grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            <div className="glass-card-frosted p-6 sm:p-8 rounded-3xl border border-white/60 shadow-xs flex flex-col gap-2.5">
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-bold">
                Custom Same Day Taj Mahal Tour Package by Car
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Maximize your time in the city with our curated <strong className="text-on-surface font-semibold">local sightseeing taxi in agra</strong> packages. Skip the chaotic local transport and enjoy a personalized, chauffeur-driven journey around the region's architectural marvels. Our custom itineraries are crafted to give you a stress-free experience, starting directly from your location in Agra.
              </p>
            </div>
            <div className="glass-card-frosted p-6 sm:p-8 rounded-3xl border border-white/60 shadow-xs flex flex-col gap-2.5">
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal font-bold">
                Comprehensive Cab Booking Agra Fort and Taj Mahal
              </h2>
              <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-1.5">
                <p>Our tour plans cover all core attractions with flexible timings:</p>
                <ul className="space-y-1 text-on-surface text-sm">
                  <li>• <strong className="text-primary font-semibold">Taj Mahal Sunrise Tour Package by Car:</strong> Witness the morning light over the ivory monument with convenient early doorstep pickup from any Agra hotel.</li>
                  <li>• <strong className="text-primary font-semibold">Historic Fort Tours:</strong> Reliable <strong className="font-semibold">cab booking agra fort and taj mahal</strong> including drops to the lesser-known gems like Baby Taj.</li>
                  <li>• <strong className="text-primary font-semibold">Panoramic Sunset Views:</strong> Experience the perfect <strong className="font-semibold">mehtab bagh sunset taxi agra</strong> itinerary from across the Yamuna River.</li>
                  <li>• <strong className="text-primary font-semibold">Station Pickups:</strong> Direct, reliable <strong className="font-semibold">agra cantt railway station taxi service</strong> timed with Gatimaan and Shatabdi arrivals.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & TAB NAVIGATION BAR (Compact -20%) */}
      {/* The header is fixed at the shared --header height; matching it here avoids a
          reserved-looking gap when this section enters its sticky state. */}
      <section className="bg-surface-container py-3 border-b border-border-warm/60 sticky top-[var(--header)] z-30 backdrop-blur-md bg-surface-container/95">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin flex flex-wrap items-center justify-between gap-space-md">
          {/* Filter Segmented Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-high rounded-xl">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "all"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("all"); setCurrentPage(1); }}
              type="button"
            >
              All Packages ({packageList.length})
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "sightseeing"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("sightseeing"); setCurrentPage(1); }}
              type="button"
            >
              Taj &amp; Agra Sightseeing
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "dawn"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("dawn"); setCurrentPage(1); }}
              type="button"
            >
              Dawn &amp; Fast-Track
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "pilgrimage"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("pilgrimage"); setCurrentPage(1); }}
              type="button"
            >
              Pilgrimage Circuits
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "excursion"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("excursion"); setCurrentPage(1); }}
              type="button"
            >
              Day Excursions
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === "multiday"
                ? "bg-ink-charcoal text-ivory-surface shadow-xs font-semibold"
                : "text-on-surface hover:bg-surface-container-lowest"
                }`}
              onClick={() => { setActiveCategory("multiday"); setCurrentPage(1); }}
              type="button"
            >
              Multi-Day Golden Triangle
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-2 text-icon-16">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tour, monument, temple..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 text-on-surface text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* LATEST PUBLISHED PACKAGES & LOCAL SIGHTSEEING SHOWCASE */}
      {activeCategory === "all" && !searchQuery && currentPage === 1 && (
        <div className="flex flex-col gap-space-lg w-full">
          <LatestPackagesSection />
          <LatestToursSection />
        </div>
      )}

      {/* CURATED PACKAGES CATALOG GRID (Compact -20%) */}
      <section id="packages-directory" className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-6">
          <div>
            <span className="font-label-caps text-body-sm text-primary uppercase font-bold tracking-widest">
              Handpicked Itineraries
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">Curated North India Tours</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-on-surface-variant font-medium">
              Showing <strong className="text-on-surface">{filteredPackages.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredPackages.length)}</strong> of <strong className="text-on-surface">{filteredPackages.length}</strong> tours
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="text-primary hover:underline text-xs font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedPackages.map((item) => {
            const { pkg } = item;
            const packageDetailUrl = `/en/packages/${pkg.slug}/`;
            const fromParam = encodeURIComponent(pkg.source || "Agra");
            const toParam = encodeURIComponent(pkg.destination || pkg.name);
            const bookStep1Url = `/book.html?category=tour_package&product=${encodeURIComponent(pkg.slug)}&from=${fromParam}&to=${toParam}`;
            const whatsappPackageUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
              `Hello Agra SK Baghel Tour and Travels, I am interested in the ${pkg.name}.`
            )}`;

            const images: Array<{ url: string; caption: string; alt: string }> =
              pkg.gallery && pkg.gallery.length > 0
                ? pkg.gallery.map((g, i) => ({
                    url: resolveCatalogMediaUrl(g.url),
                    caption: g.caption || `${pkg.name} — Photo ${i + 1}`,
                    alt: g.alt || `${pkg.name} view ${i + 1}`,
                  }))
                : [
                    {
                      url: resolveCatalogMediaUrl(pkg.image),
                      caption: `${pkg.name} signature route`,
                      alt: pkg.name,
                    },
                  ];
            const currentImgIdx = activeImageIndices[pkg.id] ?? 0;
            const activeImg = images[currentImgIdx] ?? images[0];

            return (
              <article
                key={pkg.id}
                className="flex flex-col glass-card-frosted rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-white/60"
              >
                {/* Main Image Showcase Stage */}
                <div className="relative aspect-[16/10] sm:h-48 w-full bg-surface-container overflow-hidden group">
                  <PackagePhoto
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    alt={activeImg.alt}
                    url={activeImg.url}
                    onClick={() =>
                      setModalImage({
                        url: activeImg.url,
                        title: pkg.name,
                        caption: activeImg.caption,
                      })
                    }
                  />

                  {/* Top Badges: Category & Kicker */}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-label-caps font-label-caps uppercase tracking-wider shadow-xs font-bold ${item.badgeClass}`}>
                      {item.badgeTag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-ink-charcoal/90 text-ivory-surface text-label-caps font-label-caps uppercase tracking-wider backdrop-blur-sm font-semibold">
                      {pkg.kicker}
                    </span>
                  </div>

                  {/* Top Right: Expand Lightbox Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setModalImage({
                        url: activeImg.url,
                        title: pkg.name,
                        caption: activeImg.caption,
                      })
                    }
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-ink-charcoal/70 hover:bg-ink-charcoal text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-xs"
                    aria-label="View photo in high-resolution lightbox"
                    title="Expand photo lightbox"
                  >
                    <span className="material-symbols-outlined text-icon-14">zoom_in</span>
                  </button>

                  {/* Bottom Overlay: Photo Caption & Image Counter */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-charcoal/90 via-ink-charcoal/40 to-transparent p-2.5 pt-6 flex items-end justify-between">
                    <span className="text-label-caps text-white/95 font-medium truncate max-w-[70%] drop-shadow-xs text-[11px]">
                      {activeImg.caption}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono tracking-wider backdrop-blur-xs font-semibold">
                        {currentImgIdx + 1} / {images.length}
                      </span>
                      <div className="px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-ink-charcoal text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-icon-12">{item.durationIcon}</span>
                        <span>{item.durationBadge}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Image Interactive Thumbnails Strip */}
                {images.length > 1 && (
                  <div className="p-2 bg-surface-container-low/80 border-b border-border-warm/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndices((prev) => ({ ...prev, [pkg.id]: idx }))}
                        className={`relative w-12 h-9 rounded overflow-hidden shrink-0 transition-all border ${
                          currentImgIdx === idx
                            ? "ring-2 ring-primary border-primary scale-[1.03] shadow-xs"
                            : "opacity-65 hover:opacity-100 border-border-warm/60"
                        }`}
                        title={img.caption}
                        aria-label={`View photo ${idx + 1}: ${img.caption}`}
                      >
                        <PackagePhoto url={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <span className="text-label-caps text-on-surface-variant font-label-caps ml-auto pr-1 shrink-0 font-semibold text-[10px]">
                      {images.length} Real Photos
                    </span>
                  </div>
                )}

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <a href={packageDetailUrl} className="group">
                      <h3 className="font-headline-sm text-base sm:text-headline-lg-mobile text-ink-charcoal font-bold leading-snug group-hover:text-primary transition-colors">
                        {pkg.name}
                      </h3>
                    </a>
                    <div className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <span className="material-symbols-outlined text-icon-14">route</span>
                      <span>{pkg.source || "Agra"} → {pkg.destination || pkg.name}</span>
                    </div>
                    <p className="font-body-sm text-body-md text-on-surface-variant line-clamp-2 leading-relaxed">
                      {pkg.blurb}
                    </p>
                  </div>

                  {/* Key Monument Stops pills */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                      Key Monument Stops
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.stops.map((stop, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 bg-sandstone-wash rounded font-label-caps text-label-caps text-on-surface font-medium"
                        >
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions List */}
                  <div className="space-y-1 text-on-surface-variant font-body-sm text-label-lg pt-0.5">
                    {item.inclusions.map((inc, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-icon-14 shrink-0">check_circle</span>
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing & CTAs */}
                  <div className="pt-2 mt-auto flex flex-col gap-2 bg-surface-container-low p-2.5 sm:p-3 rounded-lg border border-border-warm/60">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant block">Sedan Starting</span>
                        <span className="font-price-display text-lg text-primary leading-none font-bold">
                          {pkg.from != null && Number(pkg.from) > 0 ? `₹${Number(pkg.from).toLocaleString("en-IN")}` : "Custom Quote"}
                        </span>
                        {pkg.from != null && Number(pkg.from) > 0 && (
                          <span className="font-body-sm text-body-sm text-on-surface-variant"> / group</span>
                        )}
                      </div>
                      <div className="text-right font-label-caps text-label-caps text-on-surface-variant space-y-0.5">
                        {item.vehiclePrices.map((vp, vIdx) => (
                          <div key={vIdx}>{vp.label}: {vp.price}</div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <a
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-warm text-on-surface text-xs font-semibold transition-colors"
                        href={packageDetailUrl}
                      >
                        <span>Details</span>
                      </a>
                      <a
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-900 border border-white/10 transition-colors active:scale-[0.98]"
                        style={{ color: "#ffffff" }}
                        href={whatsappPackageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp</span>
                      </a>
                      <a
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-terracotta-deep text-white text-xs font-semibold hover:bg-terracotta-sunlit transition-colors shadow-xs"
                        href={bookStep1Url}
                      >
                        <span>Book Now</span>
                        <span className="material-symbols-outlined text-icon-14">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {filteredPackages.length > itemsPerPage && (
          <Pagination
            totalItems={filteredPackages.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            className="mt-8"
            showFirstLastButtons={true}
            pageButtonLimit={5}
          />
        )}
      </section>

      {/* LIVE CATALOG — trips published from the operations desk appear here
          automatically (single source of trips with the backend CMS). */}
      <LiveCatalogSection />

      {/* PACKAGE COMPARISON & FLEET DECISION MATRIX (Compact -20%) */}
      <section className="bg-surface-container-low py-8 sm:py-10 border-t border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-3xl mx-auto mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase font-bold tracking-widest">
              Executive Comparison
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">
              Package &amp; Fleet Decision Matrix
            </h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Compare durations, monument highlights, recommended vehicle choices, and fixed honest pricing side-by-side.
            </p>
          </div>
          {/* Matrix Table Container */}
          <div className="overflow-x-auto bg-surface-container-lowest rounded-xl shadow-xs border border-border-warm">
            <table className="w-full text-left font-body-sm text-xs text-on-surface">
              <thead className="bg-surface-container font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider border-b border-border-warm">
                <tr>
                  <th className="py-2.5 px-3">Tour Circuit</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Key Monuments Covered</th>
                  <th className="py-2.5 px-3">Starting Fare</th>
                  <th className="py-2.5 px-3">Best Suited For</th>
                  <th className="py-2.5 px-3">Recommended Fleet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/50">
                {packageList.map((pkg: TourPackage, idx: number) => {
                  const meta = PACKAGE_METADATA[pkg.id] || PACKAGE_METADATA[pkg.slug] || {
                    suitedFor: "Sightseeing Travelers",
                    recommendedFleet: "Sedan / Innova",
                  };
                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-sandstone-wash/40 transition-colors ${idx % 2 === 1 ? "bg-sandstone-wash/20" : ""
                        }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-ink-charcoal">
                        <a href={`/en/packages/${pkg.slug}/`} className="hover:text-primary transition-colors">
                          {pkg.name}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{pkg.duration}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant max-w-[220px] truncate" title={(meta.stops || pkg.places || []).join(", ")}>
                        {(meta.stops || pkg.places || []).slice(0, 3).join(", ") || "Taj Mahal, Agra Fort"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-primary">
                        {pkg.from != null && Number(pkg.from) > 0 ? `₹${Number(pkg.from).toLocaleString("en-IN")}` : "On request"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-sandstone-wash text-ink-charcoal font-label-caps text-label-caps">
                          {meta.suitedFor}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-secondary text-body-md">{meta.recommendedFleet}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* THE HONEST HERITAGE CHARTER (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="flex flex-col gap-1 text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center justify-center gap-1 text-primary font-label-caps text-body-sm uppercase font-bold tracking-widest">
            <span className="material-symbols-outlined text-icon-15">verified</span> 100% Transparent Chauffeur Ethics
          </div>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">The Honest Heritage Charter</h2>
          <p className="font-body-md text-xs text-on-surface-variant">
            No unexpected baggage surcharges, no hidden highway entry cess, and an absolute zero tolerance policy toward unwanted tourist emporium detours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Included Column */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success-jade/10 text-success-jade flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-icon-18">task_alt</span>
              </div>
              <div>
                <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Always Included in Your Quote</h3>
                <p className="font-body-sm text-label-lg text-on-surface-variant">Full contractual transparency backed by booking receipt</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 font-body-md text-xs text-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-icon-16 mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Clean Commercial AC Vehicle:</strong>
                  <p className="text-on-surface-variant text-body-md">Deeply sanitized interior, functional climate control, ample boot luggage space.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-icon-16 mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Police-Verified Professional Chauffeur:</strong>
                  <p className="text-on-surface-variant text-body-md">Uniformed, non-smoking, courteous, and thoroughly route-trained on Yamuna &amp; Braj corridors.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-icon-16 mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">All Tolls, Fuel &amp; Parking Included:</strong>
                  <p className="text-on-surface-variant text-body-md">No demanding loose cash at monument parking stands or highway expressway booths.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-icon-16 mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Interstate Border Passenger Taxes:</strong>
                  <p className="text-on-surface-variant text-body-md">Pre-paid UP, Rajasthan, and Delhi commercial tourist entry permits.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-success-jade shrink-0 text-icon-16 mt-0.5">check_circle</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Complimentary Hydration:</strong>
                  <p className="text-on-surface-variant text-body-md">Sealed chilled mineral water bottles and route tissue packs in every car.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Excluded / Transparent Clarifications Column */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-icon-18">receipt_long</span>
              </div>
              <div>
                <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Transparent Exclusions</h3>
                <p className="font-body-sm text-label-lg text-on-surface-variant">Pay direct or book separately with zero markup</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 font-body-md text-xs text-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-icon-16 mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">ASI Monument Entrance Tickets:</strong>
                  <p className="text-on-surface-variant text-body-md">Payable directly via the Archaeological Survey of India QR portal or ticket counter (e.g., Taj Mahal ₹50 Indian / ₹1,100 Foreigner).</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-icon-16 mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">ASI Licensed Guide Fees (Optional):</strong>
                  <p className="text-on-surface-variant text-body-md">Govt-approved multilingual guides can be arranged upon request at fixed official tariffs (approx ₹1,200–₹1,800).</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-icon-16 mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Personal Dining &amp; Hotel Stays:</strong>
                  <p className="text-on-surface-variant text-body-md">Lunches, dinners, and accommodation are traveler's choice unless booking all-inclusive packages.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-icon-16 mt-0.5">info</span>
                <div>
                  <strong className="font-semibold text-ink-charcoal">Driver Night Allowance past 10:00 PM:</strong>
                  <p className="text-on-surface-variant text-body-md">A nominal ₹300 night charge applies strictly if tours extend past 10:00 PM for late-night highway transits.</p>
                </div>
              </li>
            </ul>
            {/* Zero Commission Callout Banner */}
            <div className="mt-auto p-2.5 rounded-lg bg-sandstone-wash flex items-center gap-2 border border-border-warm">
              <span className="material-symbols-outlined text-primary text-icon-20 shrink-0">article_shortcut</span>
              <p className="font-body-sm text-label-lg text-on-surface font-medium">
                <span className="font-bold text-primary">Strict Zero-Commission Shopping Promise:</span> Our chauffeurs never divert you to overpriced marble emporiums or craft bazaars unless you specifically request an artisan visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (SIMPLE 3-STEP BOOKING - Compact -20%) */}
      <section className="bg-surface-container py-8 sm:py-10 border-t border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <span className="font-label-caps text-body-sm text-primary uppercase font-bold tracking-widest">
              Frictionless Process
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal mt-1">Reserve in Three Simple Steps</h2>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              From enquiry to chauffeur doorstep arrival in Agra or Delhi within hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                01
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Choose Circuit &amp; Vehicle</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant">
                Select your favored heritage itinerary, vehicle class (Dzire, Ertiga, Crysta, or Tempo), and travel date via our online engine or direct WhatsApp.
              </p>
              <div className="font-label-caps text-body-sm text-primary mt-auto flex items-center gap-1 font-bold">
                <span>INSTANT QUOTE RESPONSE</span> →
              </div>
            </div>
            {/* Step 2 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                02
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">28% Advance Deposit</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant">
                Secure vehicle custody via UPI, Google Pay, or direct Bank Transfer. An instant booking voucher with full operator details and booking receipt is dispatched.
              </p>
              <div className="font-label-caps text-body-sm text-success-jade mt-auto flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-icon-14">lock</span>
                <span>SECURE ALLOCATION GUARANTEE</span>
              </div>
            </div>
            {/* Step 3 */}
            <div className="bg-surface-container-lowest p-3.5 sm:p-4.5 rounded-xl shadow-xs border border-border-warm flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sandstone-wash text-primary flex items-center justify-center font-headline-sm text-sm font-bold">
                03
              </div>
              <h3 className="font-title-lg text-sm sm:text-base text-ink-charcoal font-semibold">Doorstep Chauffeur Arrival</h3>
              <p className="font-body-sm text-body-md text-on-surface-variant">
                Receive chauffeur contact and cab registration number 2 hours prior to start. Chauffeur arrives at your hotel porch or station platform with your name placard.
              </p>
              <div className="font-label-caps text-body-sm text-primary mt-auto flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-icon-14">done_all</span>
                <span>BALANCE PAID AT TRIP END</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (Compact -20%) */}
      <section className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin py-8 sm:py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="font-label-caps text-body-sm text-primary uppercase font-bold tracking-widest">
              Concierge Answers
            </span>
            <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">Frequently Asked Questions</h2>
            <p className="font-body-md text-xs text-on-surface-variant">
              Everything you need to know about monument timings, multilingual guides, luggage capacities, and cancellation policies.
            </p>
            <div className="p-3 bg-sandstone-wash rounded-xl mt-2 flex flex-col gap-1 border border-border-warm">
              <span className="font-label-caps text-label-caps text-primary font-bold">UNSURE ABOUT FRIDAY TAJ CLOSING?</span>
              <p className="font-body-sm text-label-lg text-on-surface">
                Please note: The Taj Mahal is closed every Friday for general visitors. Our Friday itineraries swap to Agra Fort, Fatehpur Sikri, and Mathura.
              </p>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col gap-2" id="package-faq-accordion">
            {PACKAGES_FAQS.map((faq, fIdx) => (
              <details
                key={fIdx}
                className="group bg-surface-container-lowest rounded-xl p-3 sm:p-3.5 shadow-2xs border border-border-warm open:shadow-xs transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-title-md text-xs sm:text-title-lg text-ink-charcoal font-semibold select-none">
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform text-icon-18">
                    expand_more
                  </span>
                </summary>
                <div className="pt-2 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* DIRECT DISPATCH & CUSTOM ITINERARY INQUIRY DESK */}
      <section className="bg-ink-charcoal text-ivory-surface py-space-3xl relative overflow-hidden" id="custom-quote">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
            {/* Left Column Info */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-ink-slate text-gold-accent w-fit font-label-caps text-label-caps uppercase tracking-widest">
                <span className="material-symbols-outlined text-icon-16">headset_mic</span>
                <span>24×7 Custom Tour Planning Desk</span>
              </div>
              <h2 className="font-headline-hero text-headline-hero text-ivory-surface leading-tight">
                Need a custom multi-city itinerary or group tour?
              </h2>
              <p className="font-body-lg text-body-lg text-secondary-container max-w-xl leading-relaxed">
                From multi-day wedding travel to multi-week Rajasthan heritage loops, our Agra dispatch desk plans personalized turn-by-turn routes with verified commercial tourist vehicles.
              </p>
              {/* Trust Badges Row */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-xs text-secondary-container font-label-caps text-label-caps">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ink-slate/60 border border-warm/10">
                  <span className="material-symbols-outlined text-gold-accent text-icon-18">bolt</span>
                  <span>15-Minute Response</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ink-slate/60 border border-warm/10">
                  <span className="material-symbols-outlined text-gold-accent text-icon-18">directions_car</span>
                  <span>Tailored Fleet Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column Dedicated Luxury Concierge Box */}
            <div className="lg:col-span-5">
              <div className="bg-ink-slate/80 p-space-xl rounded-xl border border-warm/10 shadow-xl flex flex-col gap-space-md backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-warm/10 pb-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps text-gold-accent uppercase tracking-wider block">
                      Direct Chauffeur Dispatch
                    </span>
                    <h3 className="font-title-lg text-title-lg text-ivory-surface font-semibold">
                      Connect With Our Supervisor
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-primary text-icon-28">support_agent</span>
                </div>
                {/* Contact Channels */}
                <div className="flex flex-col gap-space-sm">
                  {/* Call Card */}
                  <a
                    className="flex items-center justify-between p-space-md rounded-lg bg-terracotta-deep hover:bg-terracotta-sunlit text-white transition-colors shadow-sm group"
                    href={`tel:${contact.phone}`}
                  >
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-full bg-ink-charcoal/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-icon-20">call</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-label-lg text-label-lg font-bold">Call {contact.phoneDisplay}</span>
                        <span className="font-body-sm text-body-sm opacity-90">Immediate 24×7 Call Dispatch</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-icon-20 transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </a>
                  {/* WhatsApp Card */}
                  <a
                    className="flex items-center justify-between p-space-md rounded-lg bg-black hover:bg-neutral-900 text-white transition-colors border border-white/10 group shadow-sm active:scale-[0.98]"
                    style={{ color: "#ffffff" }}
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      "Hello Agra SK Baghel Tour and Travels, I would like a custom tour quote."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                        <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-label-lg text-label-lg font-bold text-white" style={{ color: "#ffffff" }}>WhatsApp Direct Quote</span>
                        <span className="font-body-sm text-body-sm text-neutral-300">
                          Route estimates &amp; vehicle photos in 15 mins
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-white text-icon-20 transition-transform group-hover:translate-x-1">
                      open_in_new
                    </span>
                  </a>
                </div>
                {/* Operating Assurance Badge */}
                <div className="pt-space-xs flex items-center justify-center gap-1.5 text-center font-label-caps text-label-caps text-secondary-container border-t border-warm/10">
                  <span className="w-2 h-2 rounded-full bg-success-jade"></span>
                  <span>Available 24 hours · Taj Ganj Agra Headquarters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Resolution Photo Lightbox Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-border-warm/40 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
              <PackagePhoto url={modalImage.url} alt={modalImage.title} className="w-full h-full object-contain" eager />
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Close high-res lightbox"
              >
                <span className="material-symbols-outlined text-icon-18">close</span>
              </button>
            </div>
            <div className="p-4 bg-surface-container flex items-center justify-between gap-3">
              <div>
                <h4 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">{modalImage.title}</h4>
                {modalImage.caption && (
                  <p className="text-xs text-on-surface-variant mt-0.5">{modalImage.caption}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackagesPage;
