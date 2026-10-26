import { ErrorBoundary } from "../components/ErrorBoundary";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/HomePage";
import { RentalPage } from "../pages/RentalPage";
import { ServicesPage } from "../pages/ServicesPage";
import { RoutesPage } from "../pages/RoutesPage";
import { PackagesPage } from "../pages/PackagesPage";
import { FleetPage } from "../pages/FleetPage";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { FaqPage } from "../pages/FaqPage";
import { TermsPage } from "../pages/TermsPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RouteDetailPage } from "../pages/RouteDetailPage";
import { PackageDetailPage } from "../pages/PackageDetailPage";
import { VehicleDetailPage } from "../pages/VehicleDetailPage";
import { BookingPage } from "../features/booking/BookingPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import type { CategoryCode } from "../contracts/fare-system";
import { CustomerAuthProvider } from "../auth/customerAuth";
import { AuthCallbackPage } from "../pages/AuthCallbackPage";
import { MyBookingsPage } from "../pages/MyBookingsPage";
import { PaymentResumePage } from "../pages/PaymentResumePage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";
import { LoginPage } from "../pages/LoginPage";
import { ReviewPage } from "../pages/ReviewPage";
import { MarketingPage } from "../pages/MarketingPage";
import { SeoLandingPage } from "../pages/SeoLandingPage";
import { SEO_LANDING_SLUGS, SEO_ROUTE_METADATA, type SeoLandingSlug } from "../data/seoLandingSlugs";
import { titleCaseSlug } from "../utils/format";
import { marketingHubs } from "./routes";
import { SeoHead } from "../components/seo/SeoHead";
import { packages, routes, vehicles, type Route } from "../data/catalogue";
import { toDossierTourPackage } from "../services/catalogManifest";
import LivePackageDetailPage from "../pages/LivePackageDetailPage";
import generatedPublishedCatalog from "../data/generated-published-catalog.json";
import generatedPublishedRoutes from "../data/generated-published-routes.json";
import generatedCatalog from "../data/generated-catalog.json";
import generatedPublishedTourPackages from "../data/generated-published-tour-packages.json";
import generatedPublishedTransferRoutes from "../data/generated-published-transfer-routes.json";
import generatedPublishedLocalPackages from "../data/generated-published-local-packages.json";
import generatedPublishedContent from "../data/generated-published-content.json";
import type { PublicCatalogItem } from "../services/catalog";
import DossierTourPackagePage, { type DossierTourPackageItem } from "../pages/DossierTourPackagePage";
import TransferDetailPage, { type DossierTransferRouteItem } from "../pages/TransferDetailPage";
import LocalPackageDetailPage, { type DossierLocalPackageItem } from "../pages/LocalPackageDetailPage";
import MonumentDetailPage, { type DossierMonumentItem } from "../pages/MonumentDetailPage";
import { MonumentsPage } from "../pages/MonumentsPage";

type GeneratedCatalogItem = {
  slug: string;
  title: string;
  shortDescription: string;
  coverImage?: { url?: string } | null;
  [key: string]: unknown;
};
type GeneratedRouteItem = {
  slug?: string;
  sourceCity?: string;
  destinationCity?: string | null;
  distanceKm?: number | null;
  durationText?: string | null;
  tripType?: string;
  tollIncluded?: boolean;
  faresInr?: Record<string, number>;
  [key: string]: unknown;
};

const publishedCatalog = (generatedPublishedCatalog as unknown as GeneratedCatalogItem[]).filter(
  (item) => Boolean(item && item.slug && item.title),
);
const publishedRoutes = (generatedPublishedRoutes as unknown as GeneratedRouteItem[]).filter(
  (item) => Boolean(item && item.slug && item.sourceCity),
);
const publishedTourPackages = (generatedPublishedTourPackages as unknown as DossierTourPackageItem[]).filter(
  (item) => Boolean(item && item.slug && item.name),
);
const publishedTransferRoutes = (generatedPublishedTransferRoutes as unknown as DossierTransferRouteItem[]).filter(
  (item) => Boolean(item && item.slug && item.name),
);
const publishedLocalPackages = (generatedPublishedLocalPackages as unknown as DossierLocalPackageItem[]).filter(
  (item) => Boolean(item && item.slug && item.name),
);
const publishedMonuments = (
  (generatedPublishedContent as { monuments?: DossierMonumentItem[] })?.monuments ?? []
).filter((item) => Boolean(item && item.name));

export function toDossierTransferRoute(item: DossierTransferRouteItem): Route {
  const fares = item.fleetPrices ?? {};
  return {
    id: String(item.slug),
    from: "agra",
    to: String(item.slug),
    origin: "Agra",
    destination: String(item.name),
    km: 20,
    duration: String(item.distanceText ?? "Direct Transfer"),
    kind: "one-way",
    pricingModel: "oneway",
    corridor: String(item.directionNote ?? "Express Point-to-Point Transfer"),
    toll: 1,
    fares: {
      sedan: Number(fares.sedan ?? 800),
      ertiga: Number(fares.ertiga ?? 900),
      innova: Number(fares.innova ?? 1100),
      tempo: Number(fares.tempo ?? 2200),
      urbania: Number(fares.urbania ?? 3500),
    },
  };
}

function toFrontendRoute(item: GeneratedRouteItem): Route {
  const fares = item.faresInr ?? {};
  return {
    id: String(item.slug),
    from: String(item.sourceCity).toLowerCase().replaceAll(" ", "-"),
    to: String(item.destinationCity ?? "sightseeing").toLowerCase().replaceAll(" ", "-"),
    origin: String(item.sourceCity),
    destination: String(item.destinationCity ?? "Local sightseeing"),
    km: Number(item.distanceKm ?? 0),
    duration: String(item.durationText ?? "Flexible duration"),
    kind: item.tripType === "local-tour" ? "local" : "one-way",
    pricingModel: item.tripType,
    toll: item.tollIncluded === false ? 0 : 1,
    fares: {
      sedan: Number(fares.sedan ?? 0),
      ertiga: Number(fares.ertiga ?? 0),
      innova: Number(fares.innova ?? 0),
      tempo: Number(fares.tempo ?? 0),
      urbania: Number(fares.urbania ?? 0),
    },
  };
}

export function getMarketingPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const localizedSegments = segments[0] === "en" || segments[0] === "hi" ? segments.slice(1) : segments;
  const rawSegment = localizedSegments.at(-1)?.replace(/\.html$/, "") ?? "home";
  const routeAliases: Record<string, string> = {
    "privacy-policy": "privacy",
    "terms-and-conditions": "terms",
    "terms-of-service": "terms",
  };
  const lastSegment = routeAliases[rawSegment] ?? rawSegment;
  return { language: "en" as const, section: lastSegment };
}

export interface SeoMetadata {
  title: string;
  description: string;
  ogImage?: string;
  keywords?: string[];
}

function getSeoBase(
  pathname: string,
  section: string,
  language: "en" | "hi",
  isBooking: boolean,
  dynamicItem?: Pick<GeneratedCatalogItem, "title" | "shortDescription" | "coverImage">,
  dynamicRoute?: Route,
  dossierTourPackage?: DossierTourPackageItem,
  dossierTransferRoute?: DossierTransferRouteItem,
  dossierLocalPackage?: DossierLocalPackageItem,
  dossierMonument?: DossierMonumentItem,
): SeoMetadata {
  if (SEO_LANDING_SLUGS.includes(section as SeoLandingSlug)) {
    const customMeta = SEO_ROUTE_METADATA[section];
    if (customMeta) {
      return {
        title: customMeta.title,
        description: customMeta.description,
        ogImage: "/assets/brand/og-banner.webp",
        keywords: [customMeta.title, `${section.replace(/-/g, " ")}`, "Agra taxi", "Agra cab booking"],
      };
    }
    const labels: Record<string, string> = {
      "tempo-traveller-on-rent-agra": "Tempo Traveller on Rent in Agra | 12–24 Seater, ₹25/km",
      "same-day-agra-tour-from-delhi": "Same Day Agra Tour from Delhi | Private Car",
      "delhi-to-agra-taxi": "Delhi to Agra Taxi | One-Way ₹3,499 | Agra SK Baghel Tour and Travels",
      "taj-mahal-taxi-service": "Taj Mahal Taxi Service Agra | One-Day & Full-Day Cabs",
    };
    const title = labels[section] || `${titleCaseSlug(section)} | Agra SK Baghel Tour and Travels`;
    return { title, description: `${title}. Verified drivers, transparent fare confirmation and easy phone or WhatsApp booking.`, ogImage: "/assets/brand/og-banner.webp", keywords: [title, "Agra taxi", "Agra cab booking"] };
  }
  if (isBooking) {
    return {
      title: "Book a ride | Agra SK Baghel Tour and Travels",
      description: "Compare vehicles and prepare a transparent mock booking from Agra.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi booking", "Agra cab reservation", "online taxi booking Agra"],
    };
  }
  const resolvedDynamicItem = dynamicItem ?? (pathname.includes("/packages/")
    ? publishedCatalog.find((item) => pathname.replace(/\/$/, "").endsWith(`/packages/${item.slug}`))
    : undefined);
  const resolvedDynamicRoute = dynamicRoute ?? (() => {
    const item = publishedRoutes.find((entry) => pathname.replace(/\/$/, "").endsWith(`/${entry.slug}`));
    return item ? toFrontendRoute(item) : undefined;
  })();

  const resolvedDossierTour = dossierTourPackage ?? (pathname.includes("/packages/")
    ? publishedTourPackages.find((item) => pathname.replace(/\/$/, "").endsWith(`/packages/${item.slug}`))
    : undefined);

  const resolvedDossierTransfer = dossierTransferRoute ?? (pathname.includes("/transfers/")
    ? publishedTransferRoutes.find((item) => pathname.replace(/\/$/, "").endsWith(`/transfers/${item.slug}`))
    : undefined);

  const resolvedDossierLocal = dossierLocalPackage ?? (pathname.includes("/local-packages/")
    ? publishedLocalPackages.find((item) => pathname.replace(/\/$/, "").endsWith(`/local-packages/${item.slug}`))
    : undefined);

  const resolvedDossierMonument = dossierMonument ?? (pathname.includes("/monuments/")
    ? publishedMonuments.find((item) => {
        const slug = item.slug ?? item.monumentCode ?? (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "");
        return pathname.replace(/\/$/, "").endsWith(`/monuments/${slug}`);
      })
    : undefined);

  if (resolvedDossierTour) {
    const fare = Number(resolvedDossierTour.startingPriceInr || resolvedDossierTour.fleetPrices?.sedan || 0);
    const priceSuffix = fare > 0 ? ` @ ₹${fare.toLocaleString("en-IN")} | Agra SK Baghel Tour and Travels` : " | Agra SK Baghel Tour and Travels";
    const maxName = Math.max(10, 60 - priceSuffix.length);
    const titleName = resolvedDossierTour.name.length > maxName ? `${resolvedDossierTour.name.slice(0, maxName - 1).trimEnd()}…` : resolvedDossierTour.name;
    const descPrefix = fare > 0 ? `${resolvedDossierTour.name} from ₹${fare.toLocaleString("en-IN")}. ` : `${resolvedDossierTour.name}. `;
    return {
      title: `${titleName}${priceSuffix}`,
      description: `${descPrefix}${resolvedDossierTour.inclusionsHighlight || "Private sanitized AC cab, dedicated verified chauffeur & monument sightseeing."}`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [resolvedDossierTour.name, "Agra tour package", "private guided tour Agra", "Agra SK Baghel Tour & Travels"],
    };
  }

  if (resolvedDossierTransfer) {
    const fare = Number(resolvedDossierTransfer.fleetPrices?.sedan ?? 0);
    const priceSuffix = fare > 0 ? ` Taxi @ ₹${fare.toLocaleString("en-IN")} | Agra SK Baghel Tour and Travels` : " Taxi | Agra SK Baghel Tour and Travels";
    const maxName = Math.max(10, 60 - priceSuffix.length);
    const titleName = resolvedDossierTransfer.name.length > maxName ? `${resolvedDossierTransfer.name.slice(0, maxName - 1).trimEnd()}…` : resolvedDossierTransfer.name;
    const descPrefix = fare > 0 ? `${resolvedDossierTransfer.name} from ₹${fare.toLocaleString("en-IN")}. ` : `${resolvedDossierTransfer.name}. `;
    return {
      title: `${titleName}${priceSuffix}`,
      description: `${descPrefix}${resolvedDossierTransfer.directionNote || "Doorstep pickup, zero surge pricing, verified commercial chauffeur & delay tracking."}`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [resolvedDossierTransfer.name, "Agra airport transfer", "Agra station taxi", "Agra SK Baghel Tour & Travels"],
    };
  }

  if (resolvedDossierLocal) {
    const fare = Number(resolvedDossierLocal.fleetPrices?.sedan ?? 0);
    const priceSuffix = fare > 0 ? ` @ ₹${fare.toLocaleString("en-IN")} | Agra SK Baghel Tour and Travels` : " | Agra SK Baghel Tour and Travels";
    const maxName = Math.max(10, 60 - priceSuffix.length);
    const titleName = resolvedDossierLocal.name.length > maxName ? `${resolvedDossierLocal.name.slice(0, maxName - 1).trimEnd()}…` : resolvedDossierLocal.name;
    const descPrefix = fare > 0 ? `${resolvedDossierLocal.name} from ₹${fare.toLocaleString("en-IN")} ` : `${resolvedDossierLocal.name} `;
    return {
      title: `${titleName}${priceSuffix}`,
      description: `${descPrefix}(${resolvedDossierLocal.durationHours} hrs / ${resolvedDossierLocal.includedKm} km). Covering ${resolvedDossierLocal.covers}. AC cab with driver.`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [resolvedDossierLocal.name, "Agra local sightseeing cab", "Agra full day taxi", "Agra SK Baghel Tour & Travels"],
    };
  }

  if (resolvedDossierMonument) {
    const fare = 800;
    const priceSuffix = ` Cab Tour @ ₹${fare} | Agra SK Baghel Tour and Travels`;
    const maxName = Math.max(10, 60 - priceSuffix.length);
    const titleName = resolvedDossierMonument.name.length > maxName ? `${resolvedDossierMonument.name.slice(0, maxName - 1).trimEnd()}…` : resolvedDossierMonument.name;
    return {
      title: `${titleName}${priceSuffix}`,
      description: `Visit ${resolvedDossierMonument.name} in Agra (${resolvedDossierMonument.visitingHours}). ${resolvedDossierMonument.closedNote}. Book private AC cab from ₹${fare} with verified driver.`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [resolvedDossierMonument.name, `${resolvedDossierMonument.name} timings`, "Agra monument taxi", "Agra SK Baghel Tour & Travels"],
    };
  }

  if (resolvedDynamicItem) {
    return {
      title: `${resolvedDynamicItem.title} — Private Tour & Fares | Agra SK Baghel Tour and Travels`,
      description: resolvedDynamicItem.shortDescription,
      ogImage: resolvedDynamicItem.coverImage?.url || "/assets/brand/og-banner.webp",
      keywords: [resolvedDynamicItem.title, "Agra tour package", "private taxi Agra", "Agra SK Baghel Tour and Travels"],
    };
  }
  if (resolvedDynamicRoute) {
    const from = resolvedDynamicRoute.origin ?? resolvedDynamicRoute.from;
    const to = resolvedDynamicRoute.destination ?? resolvedDynamicRoute.to;
    return {
      title: `${from} to ${to} Taxi Fare | Agra SK Baghel Tour and Travels`,
      description: `${resolvedDynamicRoute.duration} private taxi from ${from} to ${to}, with transparent fares and verified drivers.`,
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} fare`, "Agra outstation cab"],
    };
  }
  const path = pathname.replace(/\/$/, "");
  const vehicle =
    path.includes("/vehicles/") &&
    vehicles.find((item) =>
      path.endsWith(item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id)
    );
  const tour = path.includes("/packages/") && packages.find((item) => path.endsWith(item.slug));
  const route = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return path.includes(`${from}-taxi`) || path.includes(`${hindiFrom}-taxi`);
  });

  if (vehicle) {
    return {
      title: `${vehicle.name} Hire in Agra — Fares & Booking | Agra SK Baghel Tour and Travels`,
      description: `${vehicle.blurb} Compare seats (${vehicle.seats}), luggage (${vehicle.bags}), outstation rate from ₹${vehicle.perKm}/km, local & transfers.`,
      ogImage: vehicle.image,
      keywords: [vehicle.name, `${vehicle.name} Agra`, `${vehicle.name} rental`, "Agra taxi fleet", "outstation cab Agra"],
    };
  }

  if (tour) {
    return {
      title: `${tour.name} — Private Tour Package & Fares | Agra SK Baghel Tour and Travels`,
      description: `${tour.blurb} 100% private sanitized AC cab, verified guide, transparent all-inclusive fares. Book online or call 24x7.`,
      ogImage: tour.image,
      keywords: [tour.name, `${tour.name} Agra`, "Taj Mahal private tour", "Agra tour package", "sightseeing cab Agra"],
    };
  }

  if (route) {
    const from = route.from[0].toUpperCase() + route.from.slice(1);
    const to = route.to[0].toUpperCase() + route.to.slice(1);
    return {
      title: `${from} to ${to} Taxi Fare | Agra SK Baghel Tour and Travels`,
      description: `${route.duration} private taxi from ${from} to ${to}, with transparent fares across our fleet.`,
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} cab fare`, "outstation taxi Agra", "expressway cab"],
    };
  }

  if (section === "home") {
    return {
      title: "Agra Taxi & Cab Booking | Agra SK Baghel Tour and Travels",
      description: "Book an Agra taxi, Tempo Traveller or Innova. Agra to Delhi from ₹3,499. Call or WhatsApp to confirm. Transparent fares and clear booking terms.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi service", "Agra cab booking", "Agra to Delhi cab", "Tempo Traveller Agra", "Taj Mahal tours", "Agra SK Baghel Tour and Travels"],
    };
  }

  if (section === "services") {
    return {
      title: "Taxi Services in Agra | Outstation, Local & Airport Cabs | Agra SK Baghel Tour and Travels",
      description: "Complete guide to Agra taxi services: One-way outstation cabs to Delhi & Jaipur from ₹3,499, local sightseeing packages from ₹1,900, Tempo Travellers, and 24x7 airport transfers.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi services", "outstation cabs Agra", "local sightseeing Agra", "airport transfers Agra", "tempo traveller rental"],
    };
  }

  if (section === "routes") {
    return {
      title: "Agra Outstation Taxi Routes & Fares Directory | Agra SK Baghel Tour and Travels",
      description: "Outstation cab network from Agra to Delhi, Jaipur, Mathura, Gwalior & Lucknow. Live route calculator, distance matrix, expressway tolls included from ₹3,499.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra outstation taxi routes", "Agra to Delhi taxi fare", "Agra to Jaipur cab", "highway tolls included"],
    };
  }

  if (section === "packages") {
    return {
      title: "Agra Tour Packages & Taj Mahal Sightseeing Circuits | Agra SK Baghel Tour and Travels",
      description: "Curated private tour packages: Taj Mahal Sunrise tour, Mathura Vrindavan, Gatimaan train package & Golden Triangle. Multi-currency switcher, transparent all-inclusive fares.",
      ogImage: "/assets/packages/taj-dawn.webp",
      keywords: ["Agra tour packages", "Taj Mahal sunrise tour", "Mathura Vrindavan tour", "Golden Triangle package", "private tour guide"],
    };
  }

  if (section === "monuments") {
    return {
      title: "Monuments of Agra — Visiting Guides & Transport | Agra SK Baghel Tour and Travels",
      description: "Taj Mahal, Agra Fort, Fatehpur Sikri — visiting hours, guides, and transport priced through the published corridor engine.",
      ogImage: "/assets/places/agra-taj-mahal.webp",
      keywords: ["Monuments of Agra", "Taj Mahal guide", "Agra Fort", "Fatehpur Sikri", "Agra sightseeing monuments"],
    };
  }

  if (section === "fleet") {
    return {
      title: "Our Fleet — Sedan, Ertiga, Innova Crysta & Tempo Traveller | Agra SK Baghel Tour and Travels",
      description: "Explore our sanitized, chauffeur-driven Agra cab fleet: Dzire sedan, Ertiga MPV, Innova Crysta, Tempo Traveller & Urbania van. Transparent per-km rates & flat transfers.",
      ogImage: "/assets/fleet/innova.webp",
      keywords: ["Agra cab fleet", "Dzire taxi Agra", "Ertiga rental", "Innova Crysta Agra", "Tempo Traveller", "Force Urbania"],
    };
  }

  if (section === "about") {
    return {
      title: "About Us — Agra SK Baghel Tour and Travels Agra | 15+ Years Heritage",
      description: "Founded in Taj Ganj, Agra. Over 15 years of trusted chauffeur-driven outstation cabs, verified drivers, and transparent zero-commission heritage tours.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["About Agra SK Baghel Tour and Travels", "Agra travel desk", "Taj Ganj taxi service", "verified drivers Agra", "heritage tours"],
    };
  }

  if (section === "contact") {
    return {
      title: "Contact Us — Agra SK Baghel Tour and Travels Agra | 24×7 Travel Desk",
      description: "Get in touch with our 24×7 Taj Ganj dispatch desk for outstation cabs, sunrise Taj Mahal tours, and luxury group travel in Agra. Call +91 97628 17598.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Contact Agra SK Baghel Tour and Travels", "Agra taxi phone number", "Taj Ganj dispatch desk", "24x7 cab booking"],
    };
  }

  if (section === "faq") {
    return {
      title: "Frequently Asked Questions (FAQs) — Cab Booking & Fares | Agra SK Baghel Tour and Travels Agra",
      description: "Find clear answers about outstation taxi rules, 300 km/day minimums, Yamuna Expressway toll inclusions, night allowances, and our 24-hr refund policy.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi FAQ", "cab booking questions", "outstation 300km rule", "night allowance taxi", "cancellation refund policy"],
    };
  }

  if (section === "terms") {
    return {
      title: "Terms & Conditions — Agra SK Baghel Tour and Travels Agra | Cancellation Policy",
      description: "Review our transparent commercial terms: 24-hr cab cancellation with 100% refund, 6-tier tour schedule, 300 km/day outstation rules, and Agra jurisdiction.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Terms and conditions", "Agra taxi cancellation policy", "tour refund schedule", "commercial terms"],
    };
  }

  if (section === "privacy") {
    return {
      title: "Privacy Policy — Agra SK Baghel Tour and Travels Agra | Data Protection",
      description: "Learn how we handle Google Sign-In, travel and booking information, service providers, retention, and privacy requests.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Privacy policy", "DPDP Act 2023", "passenger data protection", "confidentiality"],
    };
  }

  if (section === "rent" || pathname.includes("/taxis/rent") || pathname.includes("/rent")) {
    return {
      title: "Rent a Taxi in Agra | Canonical Fleet, Tempo Travellers & Sedans | Agra SK Baghel",
      description: "Rent verified taxis in Agra with dedicated chauffeurs. Browse Sedans, SUVs, Luxury and Tempo Travellers. Transparent call-first quotes and doorstep pickup.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi rental", "rent a cab Agra", "Agra car rental with driver", "Tempo Traveller rental Agra"],
    };
  }

  if (section === "404") {
    return {
      title: "404 Page Not Found — Agra SK Baghel Tour and Travels Agra",
      description: "Uncharted route — let us guide you back. Search verified Agra cabs, outstation routes and private tour packages.",
      ogImage: "/assets/brand/og-banner.webp",
    };
  }

  return {
    title: `${section.replaceAll("-", " ")} | Agra SK Baghel Tour and Travels`,
    description: "Agra taxi, outstation cabs, Tempo Travellers and private tours with transparent fares.",
    ogImage: "/assets/brand/og-banner.webp",
  };
}

function clampSeoText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function getSeo(
  pathname: string,
  section: string,
  language: "en" | "hi",
  isBooking: boolean,
  dynamicItem?: Pick<GeneratedCatalogItem, "title" | "shortDescription" | "coverImage">,
  dynamicRoute?: Route,
  dossierTourPackage?: DossierTourPackageItem,
  dossierTransferRoute?: DossierTransferRouteItem,
  dossierLocalPackage?: DossierLocalPackageItem,
  dossierMonument?: DossierMonumentItem,
): SeoMetadata {
  const metadata = getSeoBase(
    pathname,
    section,
    language,
    isBooking,
    dynamicItem,
    dynamicRoute,
    dossierTourPackage,
    dossierTransferRoute,
    dossierLocalPackage,
    dossierMonument,
  );
  return {
    ...metadata,
    title: clampSeoText(metadata.title, 60),
    description: clampSeoText(metadata.description, 155),
  };
}

export interface AppProps {
  pathname?: string;
}

export function ServerApp({ pathname: propPathname }: AppProps = {}) {
  const pathname = propPathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const { language, section } = getMarketingPath(pathname);
  const isHome =
    pathname === "/" ||
    pathname === "/hi/" ||
    pathname === "/hi" ||
    pathname === "/en/" ||
    pathname === "/en" ||
    pathname === "/index.html" ||
    section === "home";
  const isMarketingHub = marketingHubs.includes(section as (typeof marketingHubs)[number]);
  const isSeoLanding = SEO_LANDING_SLUGS.includes(section as SeoLandingSlug);
  const cleanPath = pathname.replace(/\/$/, "");
  const isAuthCallback = cleanPath === "/auth/callback";
  const isMyBookings = cleanPath === "/my-bookings";
  const isPaymentResume = cleanPath === "/payment/resume";
  const isBookingConfirmation =
    cleanPath === "/booking/confirmation" ||
    cleanPath === "/booking/confirmation.html" ||
    cleanPath === "/booking-confirmation";
  const isLegacyLegalAlias = cleanPath === "/en/privacy" || cleanPath === "/en/terms";
  const isLogin = cleanPath === "/login" || cleanPath === "/auth/login";
  const isReview = cleanPath === "/review" || /^\/review\/[^/]+$/i.test(cleanPath);
  const isPrivateCustomerPage = isAuthCallback || isMyBookings || isPaymentResume || isBookingConfirmation || isLogin || isReview;
  const isBooking =
    !isBookingConfirmation &&
    (cleanPath.endsWith("book.html") ||
      section === "book" ||
      section === "booking" ||
      cleanPath === "/book" ||
      cleanPath === "/booking" ||
      cleanPath === "/en/book" ||
      cleanPath === "/hi/book");

  const matchedRoute = routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return pathname.includes(`${from}-taxi`) || pathname.includes(`${hindiFrom}-taxi`);
  });
  const dynamicRouteItem = publishedRoutes.find((item) => pathname.replace(/\/$/, "").endsWith(`/${item.slug}`));
  const catalogRouteMatch = !dynamicRouteItem
    ? ((generatedCatalog as any)?.routes as Route[] || []).find((item) => {
        const taxiSlug = `${item.from}-to-${item.to}-taxi`;
        return (
          pathname.replace(/\/$/, "").endsWith(`/${taxiSlug}`) ||
          pathname.replace(/\/$/, "").endsWith(`/${item.id}`)
        );
      })
    : undefined;
  const dynamicRoute = dynamicRouteItem ? toFrontendRoute(dynamicRouteItem) : catalogRouteMatch;

  const matchedPackage = pathname.includes("/packages/") && packages.find((item) => {
    const p = pathname.replace(/\/$/, "");
    const itemSlug = item.slug || (item as any).packageCode || (item as any).package_code;
    return itemSlug && (p.endsWith(`/${itemSlug}`) || p.endsWith(itemSlug));
  });
  const dynamicPackage = pathname.includes("/packages/")
    ? publishedCatalog.find((item) => {
        const itemSlug = item.slug || (item as any).packageCode || (item as any).package_code;
        return itemSlug && pathname.replace(/\/$/, "").endsWith(`/packages/${itemSlug}`);
      })
    : undefined;

  // Phase 6 Dossier Resolvers
  const dossierTourPackage = pathname.includes("/packages/")
    ? publishedTourPackages.find((item) => {
        const itemSlug = item.slug || (item as any).packageCode || (item as any).package_code;
        return itemSlug && pathname.replace(/\/$/, "").endsWith(`/packages/${itemSlug}`);
      })
    : undefined;

  const dossierTransferRoute = pathname.includes("/transfers/")
    ? publishedTransferRoutes.find((item) => pathname.replace(/\/$/, "").endsWith(`/transfers/${item.slug}`))
    : undefined;

  const dossierLocalPackage = pathname.includes("/local-packages/")
    ? publishedLocalPackages.find((item) => pathname.replace(/\/$/, "").endsWith(`/local-packages/${item.slug}`))
    : undefined;

  const dossierMonument = pathname.includes("/monuments/")
    ? publishedMonuments.find((item) => {
        const slug = item.slug ?? item.monumentCode ?? (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "");
        return pathname.replace(/\/$/, "").endsWith(`/monuments/${slug}`);
      })
    : undefined;

  const matchedVehicle =
    (pathname.includes("/vehicles/") || pathname.includes("/fleet/")) &&
    vehicles.find((item) => {
      const p = pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const slug = item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id;
      return p.endsWith(`/${slug}`) || p.endsWith(slug) || p.endsWith(`/${item.id}`) || p.endsWith(item.id);
    });

  const normalizedPath = pathname.replace(/^\/(?:en|hi)(?=\/|$)/, "").replace(/\/$/, "");
  const cleanProductMatch = (() => {
    const taxiMatch = normalizedPath.match(/^\/(?:taxi|taxis)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (taxiMatch && taxiMatch[1].toLowerCase() !== "rent") return { category: "outstation" as CategoryCode, code: taxiMatch[1] };

    const sightseeingMatch = normalizedPath.match(/^\/(?:local-sightseeing|local-packages|local-package)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (sightseeingMatch) return { category: "local_package" as CategoryCode, code: sightseeingMatch[1] };

    const transferMatch = normalizedPath.match(/^\/(?:transfers|transfer)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (transferMatch) return { category: "transfer" as CategoryCode, code: transferMatch[1] };

    const tourMatch = normalizedPath.match(/^\/(?:tours|tour|packages|package)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (tourMatch) return { category: "tour_package" as CategoryCode, code: tourMatch[1] };

    return null;
  })();

  const isRental =
    section === "rent" ||
    section === "rental" ||
    section === "taxi-rental" ||
    cleanPath === "/rent" ||
    cleanPath === "/rental" ||
    cleanPath === "/taxi-rental" ||
    cleanPath === "/taxis/rent" ||
    cleanPath === "/en/rent" ||
    cleanPath === "/en/rental" ||
    cleanPath === "/en/taxi-rental" ||
    cleanPath === "/en/taxis/rent" ||
    cleanPath === "/hi/taxis/rent" ||
    cleanPath === "/hi/rent";

  const isKnownRoute =
    isHome ||
    isBooking ||
    isPrivateCustomerPage ||
    isMarketingHub ||
    isRental ||
    Boolean(cleanProductMatch) ||
    section === "monuments" ||
    cleanPath === "/monuments" ||
    cleanPath === "/en/monuments" ||
    Boolean(matchedRoute) ||
    Boolean(dynamicRoute) ||
    Boolean(matchedPackage) ||
    Boolean(dynamicPackage) ||
    Boolean(dossierTourPackage) ||
    Boolean(dossierTransferRoute) ||
    Boolean(dossierLocalPackage) ||
    Boolean(dossierMonument) ||
    Boolean(matchedVehicle) ||
    isSeoLanding ||
    packages.some((item) => pathname.endsWith(item.slug) || pathname.endsWith(item.slug + "/"));

  const is404 =
    !isKnownRoute ||
    section === "404" ||
    pathname.endsWith("/404") ||
    pathname.endsWith("/404.html") ||
    pathname.endsWith("/404/");

  const effectiveSection = is404 ? "404" : isHome ? "home" : section;
  const {
    title: pageTitle,
    description: pageDescription,
    ogImage: pageOgImage,
    keywords: pageKeywords,
  } = getSeo(
    pathname,
    effectiveSection,
    language,
    isBooking,
    dynamicPackage,
    dynamicRoute,
    dossierTourPackage,
    dossierTransferRoute,
    dossierLocalPackage,
    dossierMonument,
  );

  return (
    <ErrorBoundary>
      <CustomerAuthProvider>
        <SeoHead
          language={language}
          pathname={pathname}
          title={pageTitle}
          description={pageDescription}
          ogImage={pageOgImage}
          keywords={pageKeywords}
          noindex={isBooking || isPrivateCustomerPage || isLegacyLegalAlias || is404}
        />
        <SiteLayout currentPath={pathname}>
          {is404 ? (
            <NotFoundPage language={language} />
          ) : isAuthCallback ? (
            <AuthCallbackPage />
          ) : isMyBookings ? (
            <MyBookingsPage />
          ) : isPaymentResume ? (
            <PaymentResumePage />
          ) : isBookingConfirmation ? (
            <BookingConfirmationPage />
          ) : isLogin ? (
            <LoginPage />
          ) : isReview ? (
            <ReviewPage />
          ) : isBooking ? (
            <BookingPage />
          ) : isHome ? (
            <HomePage language={language} />
          ) : matchedRoute ? (
            <RouteDetailPage language={language} route={matchedRoute} />
          ) : dynamicRoute ? (
            <RouteDetailPage language={language} route={dynamicRoute} />
          ) : matchedPackage ? (
            <PackageDetailPage language={language} pkg={matchedPackage} />
          ) : dossierTourPackage ? (
            <PackageDetailPage language={language} pkg={toDossierTourPackage(dossierTourPackage)} />
          ) : dynamicPackage ? (
            <LivePackageDetailPage slug={dynamicPackage.slug} initialItem={dynamicPackage as unknown as PublicCatalogItem} />
          ) : dossierTransferRoute ? (
            <TransferDetailPage language={language} item={dossierTransferRoute} />
          ) : dossierLocalPackage ? (
            <LocalPackageDetailPage language={language} item={dossierLocalPackage} />
          ) : dossierMonument ? (
            <MonumentDetailPage language={language} item={dossierMonument} />
          ) : isRental ? (
            <RentalPage language={language} />
          ) : cleanProductMatch ? (
            <ProductDetailPage category={cleanProductMatch.category} code={cleanProductMatch.code} />
          ) : matchedVehicle ? (
            <VehicleDetailPage language={language} vehicle={matchedVehicle} />
          ) : isSeoLanding ? (
            <SeoLandingPage slug={section as SeoLandingSlug} />
          ) : section === "services" ? (
            <ServicesPage language={language} />
          ) : section === "routes" ? (
            <RoutesPage language={language} />
          ) : section === "packages" ? (
            <PackagesPage language={language} />
          ) : section === "monuments" || cleanPath === "/monuments" || cleanPath === "/en/monuments" ? (
            <MonumentsPage language={language} />
          ) : section === "fleet" ? (
            <FleetPage language={language} />
          ) : section === "about" ? (
            <AboutPage language={language} />
          ) : section === "contact" ? (
            <ContactPage language={language} />
          ) : section === "faq" ? (
            <FaqPage language={language} />
          ) : section === "terms" ? (
            <TermsPage language={language} />
          ) : section === "privacy" ? (
            <PrivacyPage language={language} />
          ) : isMarketingHub || pathname.startsWith("/en/") || pathname.startsWith("/hi/") ? (
            <MarketingPage language={language} section={section} />
          ) : (
            <NotFoundPage language={language} />
          )}
        </SiteLayout>
      </CustomerAuthProvider>
    </ErrorBoundary>
  );
}

export default ServerApp;
export { ServerApp as App };
