import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/HomePage";
import { CustomerAuthProvider } from "../auth/customerAuth";

const RentalPage = lazy(() => import("../pages/RentalPage").then((m) => ({ default: m.RentalPage })));
const ServicesPage = lazy(() => import("../pages/ServicesPage").then((m) => ({ default: m.ServicesPage })));
const RoutesPage = lazy(() => import("../pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));
const PackagesPage = lazy(() => import("../pages/PackagesPage").then((m) => ({ default: m.PackagesPage })));
const FleetPage = lazy(() => import("../pages/FleetPage").then((m) => ({ default: m.FleetPage })));
const AboutPage = lazy(() => import("../pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import("../pages/FaqPage").then((m) => ({ default: m.FaqPage })));
const TermsPage = lazy(() => import("../pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const RouteDetailPage = lazy(() => import("../pages/RouteDetailPage").then((m) => ({ default: m.RouteDetailPage })));
const PackageDetailPage = lazy(() => import("../pages/PackageDetailPage").then((m) => ({ default: m.PackageDetailPage })));
const DynamicPackageDetailPage = lazy(() => import("../pages/DynamicPackageDetailPage").then((m) => ({ default: m.DynamicPackageDetailPage })));
const VehicleDetailPage = lazy(() => import("../pages/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage })));
const BookingPage = lazy(() => import("../features/booking/BookingPage").then((m) => ({ default: m.BookingPage })));
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
import type { CategoryCode } from "../contracts/fare-system";
const MarketingPage = lazy(() => import("../pages/MarketingPage").then((m) => ({ default: m.MarketingPage })));
const SeoLandingPage = lazy(() => import("../pages/SeoLandingPage").then((m) => ({ default: m.SeoLandingPage })));
const AuthCallbackPage = lazy(() => import("../pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })));
const MyBookingsPage = lazy(() => import("../pages/MyBookingsPage").then((m) => ({ default: m.MyBookingsPage })));
const PaymentResumePage = lazy(() => import("../pages/PaymentResumePage").then((m) => ({ default: m.PaymentResumePage })));
const BookingConfirmationPage = lazy(() => import("../pages/BookingConfirmationPage").then((m) => ({ default: m.BookingConfirmationPage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const ReviewPage = lazy(() => import("../pages/ReviewPage").then((m) => ({ default: m.ReviewPage })));
const MonumentsPage = lazy(() => import("../pages/MonumentsPage").then((m) => ({ default: m.MonumentsPage })));
const TransferDetailPage = lazy(() => import("../pages/TransferDetailPage").then((m) => ({ default: m.TransferDetailPage })));
const LocalPackageDetailPage = lazy(() => import("../pages/LocalPackageDetailPage").then((m) => ({ default: m.LocalPackageDetailPage })));
const MonumentDetailPage = lazy(() => import("../pages/MonumentDetailPage").then((m) => ({ default: m.MonumentDetailPage })));
import generatedPublishedTransferRoutes from "../data/generated-published-transfer-routes.json";
import generatedPublishedLocalPackages from "../data/generated-published-local-packages.json";
import generatedPublishedContent from "../data/generated-published-content.json";
import type { DossierTransferRouteItem } from "../pages/TransferDetailPage";
import type { DossierLocalPackageItem } from "../pages/LocalPackageDetailPage";
import type { DossierMonumentItem } from "../pages/MonumentDetailPage";
import { SEO_LANDING_SLUGS, SEO_ROUTE_METADATA, type SeoLandingSlug } from "../data/seoLandingSlugs";
import { titleCaseSlug } from "../utils/format";
import { marketingHubs } from "./routes";
import { SeoHead } from "../components/seo/SeoHead";
import { packages, routes, vehicles, type Route, type TourPackage } from "../data/catalogue";
import { fetchCatalogManifest, loadRoutesManifest, loadPublishedPackages, toDossierTourPackage } from "../services/catalogManifest";
import generatedPublishedTourPackages from "../data/generated-published-tour-packages.json";
import generatedPublishedRoutes from "../data/generated-published-routes.json";
import generatedCatalog from "../data/generated-catalog.json";
import { useScrollReveal } from "../utils/scrollReveal";
import { onUserInteractionOrIdle } from "../utils/deferredRevalidation";
import { installConversionAnalytics } from "../services/analytics";

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

export function getSeo(
  pathname: string,
  section: string,
  language: "en" | "hi",
  isBooking: boolean,
  activeRoute?: Route | null,
): SeoMetadata {
  if (SEO_LANDING_SLUGS.includes(section as SeoLandingSlug)) {
    const customMeta = SEO_ROUTE_METADATA[section];
    if (customMeta) {
      return {
        title: customMeta.title.slice(0, 58),
        description: customMeta.description.slice(0, 155),
        ogImage: "/assets/brand/og-banner.webp",
        keywords: [customMeta.title, `${section.replace(/-/g, " ")}`, "Agra taxi", "Agra cab booking"],
      };
    }
    const title = `${titleCaseSlug(section)} | SK Baghel Travels`.slice(0, 58);
    return {
      title,
      description: `${title}. Verified drivers, transparent fare confirmation and easy phone or WhatsApp booking.`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [title, "Agra taxi", "Agra cab booking"]
    };
  }
  if (isBooking) {
    return {
      title: "Book a Ride in Agra | SK Baghel Travels",
      description: "Compare vehicles and reserve verified outstation and local taxis in Agra with transparent fares and 28% advance deposit.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi booking", "Agra cab reservation", "online taxi booking Agra"],
    };
  }
  if (activeRoute) {
    const from = activeRoute.origin || (activeRoute.from ? activeRoute.from[0].toUpperCase() + activeRoute.from.slice(1) : "Agra");
    const to = activeRoute.destination || (activeRoute.to ? activeRoute.to[0].toUpperCase() + activeRoute.to.slice(1) : "Delhi");
    return {
      title: `${from} to ${to} Taxi Fare | SK Baghel Travels`.slice(0, 58),
      description: `Book private taxi from ${from} to ${to} (${activeRoute.duration || "expressway"}). Verified chauffeurs, clean AC fleet, transparent fares from Agra.`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} cab fare`, "outstation taxi Agra", "expressway cab"],
    };
  }
  const path = pathname.replace(/\/$/, "");
  const vehicle =
    path.includes("/vehicles/") &&
    vehicles.find((item) =>
      path.endsWith(item.id === "innova" ? "innova-crysta" : item.id === "tempo" ? "tempo-traveller" : item.id)
    );
  const tour = path.includes("/packages/") && packages.find((item) => path.endsWith(item.slug));
  const monument = path.includes("/monuments/") &&
    (((generatedPublishedContent as any)?.monuments || []) as DossierMonumentItem[]).find((item) => {
      const slug = item.slug ?? item.monumentCode ?? (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "");
      return path.endsWith(`/${slug}`) || path.endsWith(slug);
    });
  const isEntityDetailPath =
    path.includes("/packages/") ||
    path.includes("/monuments/") ||
    path.includes("/vehicles/") ||
    path.includes("/fleet/") ||
    path.includes("/transfers/") ||
    path.includes("/local-packages/");
  const route = !isEntityDetailPath && routes.find((item) => {
    const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
    const hindiFrom = item.from === "agra" && item.to === "agra" ? "agra-darshan" : `${item.from}-se-${item.to}`;
    return (
      path.includes(`${from}-taxi`) ||
      path.includes(`${hindiFrom}-taxi`) ||
      path.includes(`/${item.id}/`) ||
      path.endsWith(`/${item.id}`) ||
      path.replace(/\/$/, "").endsWith(`/${item.id}`)
    );
  });

  if (monument) {
    return {
      title: (monument.metaTitle || `${monument.name} Tour & Cab Booking | SK Baghel`).slice(0, 58),
      description: (monument.metaDescription || `Visit ${monument.name} in Agra (${monument.visitingHours}). ${monument.closedNote}. Book private AC cab with verified chauffeur.`).slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [monument.name, `${monument.name} timings`, "Agra monument taxi", "Agra SK Baghel Tour & Travels"],
    };
  }

  if (vehicle) {
    return {
      title: `${vehicle.name} Hire in Agra | SK Baghel Travels`.slice(0, 58),
      description: `${vehicle.blurb} Compare seats (${vehicle.seats}), luggage (${vehicle.bags}), outstation rate from ₹${vehicle.perKm}/km.`.slice(0, 155),
      ogImage: vehicle.image,
      keywords: [vehicle.name, `${vehicle.name} Agra`, `${vehicle.name} rental`, "Agra taxi fleet", "outstation cab Agra"],
    };
  }

  if (tour) {
    return {
      title: `${tour.name} | SK Baghel Travels`.slice(0, 58),
      description: `${tour.blurb} 100% private sanitized AC cab, verified guide, transparent all-inclusive fares.`.slice(0, 155),
      ogImage: tour.image,
      keywords: [tour.name, `${tour.name} Agra`, "Taj Mahal private tour", "Agra tour package", "sightseeing cab Agra"],
    };
  }

  if (route) {
    const from = route.from[0].toUpperCase() + route.from.slice(1);
    const to = route.to[0].toUpperCase() + route.to.slice(1);
    return {
      title: `${from} to ${to} Taxi Fare | SK Baghel Travels`.slice(0, 58),
      description: `Book private taxi from ${from} to ${to} (${route.duration || "expressway"}). Verified chauffeurs, clean AC fleet, transparent fares.`.slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: [`${from} to ${to} taxi`, `${from} to ${to} cab fare`, "outstation taxi Agra", "expressway cab"],
    };
  }

  if (section === "home") {
    return {
      title: "Taxi Service in Agra | SK Baghel Tour & Travels",
      description: "Book reliable taxi service in Agra for local sightseeing and outstation tours. Chauffeur-driven Sedans, Innova and Tempo Travellers. Call +91 97628 17598.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["taxi service in agra", "cab booking in agra", "car rental in agra", "agra tour and travels", "local sightseeing taxi in agra", "agra cantt railway station taxi service", "best taxi in agra tour", "agra car rental with driver", "Agra SK Baghel Tour and Travels"],
    };
  }

  if (
    section === "rent" ||
    section === "rental" ||
    section === "taxi-rental" ||
    pathname.includes("/taxis/rent") ||
    pathname.includes("/rent") ||
    pathname.includes("/rental")
  ) {
    return {
      title: "Rent a Taxi in Agra Fleet | SK Baghel Travels",
      description: "Rent verified taxis in Agra with dedicated chauffeurs. Browse Sedans, SUVs, Luxury and Tempo Travellers. Transparent call-first quotes and doorstep pickup.",
      ogImage: "/assets/fleet/innova.webp",
      keywords: ["Agra taxi rental", "rent a cab Agra", "Agra car rental with driver", "Tempo Traveller rental Agra", "taxi rental Agra"],
    };
  }

  if (section === "services") {
    return {
      title: "Taxi Services in Agra | SK Baghel Tour & Travels",
      description: "Agra taxi services: One-way outstation cabs to Delhi and Jaipur from ₹3,499, local sightseeing packages from ₹1,900, Tempo Travellers, and 24x7 transfers.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi services", "outstation cabs Agra", "local sightseeing Agra", "airport transfers Agra", "tempo traveller rental"],
    };
  }

  if (section === "routes") {
    return {
      title: "Outstation Taxi Service Agra | SK Baghel Travels",
      description: "Book outstation taxi service from Agra. One-way and round-trip transfers to Delhi, Jaipur, Mathura, Vrindavan, and Lucknow at lowest guaranteed rates.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["outstation taxi service from agra", "agra to delhi taxi one way", "agra to jaipur cab fare", "agra to mathura vrindavan tour taxi", "agra to delhi airport cab booking", "outstation cab booking agra"],
    };
  }

  if (section === "packages") {
    return {
      title: "Local Sightseeing Taxi Agra | SK Baghel Travels",
      description: "Hire a local sightseeing taxi in Agra. Low-cost customized day packages covering Taj Mahal, Agra Fort and Mehtab Bagh with expert local driver-guides.",
      ogImage: "/assets/packages/taj-dawn.webp",
      keywords: ["agra local sightseeing taxi", "same day taj mahal tour package", "taj mahal sunrise tour package by car", "agra one day tour taxi fare", "agra tour and travels local package"],
    };
  }

  if (section === "monuments") {
    return {
      title: "Monuments of Agra Guide & Cabs | SK Baghel",
      description: "Visiting hours, ticket guidelines & private AC cab transfers for Taj Mahal, Agra Fort, Fatehpur Sikri and Mehtab Bagh with transparent rates.",
      ogImage: "/assets/places/agra-taj-mahal.webp",
      keywords: ["Monuments of Agra", "Taj Mahal guide", "Agra Fort", "Fatehpur Sikri", "Agra sightseeing monuments"],
    };
  }

  if (section === "fleet") {
    return {
      title: "Tempo Traveller & Cab Booking Agra | SK Baghel",
      description: "Rent Tempo Travellers (9-26 seats) or hire Innova Crysta in Agra for outstation and sightseeing. Chauffeur-driven luxury cabs at budget-friendly rates.",
      ogImage: "/assets/fleet/innova.webp",
      keywords: ["innova crysta rental in agra", "tempo traveller booking agra", "9 12 16 seater tempo traveller agra", "ertiga taxi booking agra", "suv cab service agra"],
    };
  }

  if (section === "about") {
    return {
      title: "About Us — Agra Taxi Desk | SK Baghel Travels",
      description: "Founded in Taj Ganj, Agra. Over 15 years of trusted chauffeur-driven outstation cabs, verified drivers, and transparent zero-commission heritage tours.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["About Agra SK Baghel Tour and Travels", "Agra travel desk", "Taj Ganj taxi service", "verified drivers Agra", "heritage tours"],
    };
  }

  if (section === "contact") {
    return {
      title: "Contact Us — Agra Cabs 24x7 | SK Baghel Travels",
      description: "Get in touch with our 24×7 Taj Ganj dispatch desk for outstation cabs, sunrise Taj Mahal tours, and luxury group travel in Agra. Call +91 97628 17598.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Contact Agra SK Baghel Tour and Travels", "Agra taxi phone number", "Taj Ganj dispatch desk", "24x7 cab booking"],
    };
  }

  if (section === "faq") {
    return {
      title: "Agra Taxi FAQs & Fare Rules | SK Baghel Travels",
      description: "Find clear answers about outstation taxi rules, 300 km/day minimums, Yamuna Expressway toll inclusions, night allowances, and our 24-hr refund policy.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Agra taxi FAQ", "cab booking questions", "outstation 300km rule", "night allowance taxi", "cancellation refund policy"],
    };
  }

  if (section === "terms") {
    return {
      title: "Terms & Conditions | SK Baghel Tour and Travels",
      description: "Review our transparent commercial terms: 24-hr cab cancellation with 100% refund, 6-tier tour schedule, 300 km/day outstation rules, and Agra jurisdiction.".slice(0, 155),
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Terms and conditions", "Agra taxi cancellation policy", "tour refund schedule", "commercial terms"],
    };
  }

  if (section === "privacy") {
    return {
      title: "Privacy Policy | Agra SK Baghel Tour and Travels",
      description: "Learn how we handle Google Sign-In, travel and booking information, service providers, retention, and privacy requests under DPDP Act 2023.",
      ogImage: "/assets/brand/og-banner.webp",
      keywords: ["Privacy policy", "DPDP Act 2023", "passenger data protection", "confidentiality"],
    };
  }

  if (section === "404") {
    return {
      title: "404 Page Not Found | SK Baghel Tour and Travels",
      description: "Uncharted route — let us guide you back. Search verified Agra cabs, outstation routes and private tour packages with Agra SK Baghel Tour & Travels.",
      ogImage: "/assets/brand/og-banner.webp",
    };
  }

  return {
    title: `${titleCaseSlug(section)} | SK Baghel Travels`.slice(0, 58),
    description: "Agra taxi, outstation cabs, Tempo Travellers and private tours with transparent fares from Agra SK Baghel Tour & Travels.".slice(0, 155),
    ogImage: "/assets/brand/og-banner.webp",
  };
}

export interface AppProps {
  pathname?: string;
}

export function App({ pathname: propPathname }: AppProps = {}) {
  const pathname = propPathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  useScrollReveal([pathname]);
  useEffect(() => installConversionAnalytics(), []);
  useEffect(() => {
    if (typeof window !== "undefined") void fetchCatalogManifest();
  }, []);
  const { language, section } = getMarketingPath(pathname);
  const isHome =
    pathname === "/" ||
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
  const isPrivateCustomerPage = isAuthCallback || isMyBookings || isPaymentResume || isLogin || isBookingConfirmation || isReview;
  const isBooking =
    !isBookingConfirmation &&
    (cleanPath.endsWith("book.html") ||
      section === "book" ||
      section === "booking" ||
      cleanPath === "/book" ||
      cleanPath === "/booking" ||
      cleanPath === "/en/book");

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

  const normalizedPath = pathname.replace(/^\/(?:en|hi)(?=\/|$)/, "").replace(/\/$/, "");
  const cleanProductMatch = useMemo<{ category: CategoryCode; code: string } | null>(() => {
    const taxiMatch = normalizedPath.match(/^\/(?:taxi|taxis)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (taxiMatch && taxiMatch[1].toLowerCase() !== "rent") return { category: "outstation", code: taxiMatch[1] };

    const sightseeingMatch = normalizedPath.match(/^\/(?:local-sightseeing|local-packages|local-package)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (sightseeingMatch) return { category: "local_package", code: sightseeingMatch[1] };

    const transferMatch = normalizedPath.match(/^\/(?:transfers|transfer)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (transferMatch) return { category: "transfer", code: transferMatch[1] };

    const tourMatch = normalizedPath.match(/^\/(?:tours|tour|packages|package)\/([a-z0-9_-]+)(?:\.html)?$/i);
    if (tourMatch) return { category: "tour_package", code: tourMatch[1] };

    return null;
  }, [normalizedPath]);

  const [manifestRoute, setManifestRoute] = useState<Route | null>(null);

  const initialTourPackages = useMemo<TourPackage[]>(() => {
    const map = new Map<string, TourPackage>();
    for (const p of packages) map.set(p.slug, p);
    for (const item of (generatedPublishedTourPackages as any[])) {
      const mapped = toDossierTourPackage(item);
      map.set(mapped.slug, mapped);
    }
    return Array.from(map.values());
  }, []);

  const [publishedPackages, setPublishedPackages] = useState<TourPackage[]>(initialTourPackages);

  useEffect(() => {
    let isMounted = true;
    const loadPackages = () => {
      loadPublishedPackages().then((items) => {
        if (isMounted && items && items.length > 0) {
          const map = new Map<string, TourPackage>();
          for (const p of initialTourPackages) map.set(p.slug, p);
          for (const p of items) map.set(p.slug, p);
          setPublishedPackages(Array.from(map.values()));
        }
      }).catch(() => {});
    };

    const cleanup = onUserInteractionOrIdle(loadPackages, 8000);
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [initialTourPackages]);

  const isEntityDetailPathLocal =
    pathname.includes("/packages/") ||
    pathname.includes("/monuments/") ||
    pathname.includes("/vehicles/") ||
    pathname.includes("/fleet/") ||
    pathname.includes("/transfers/") ||
    pathname.includes("/local-packages/");

  const matchedRoute = useMemo<Route | null>(() => {
    if (isEntityDetailPathLocal) return null;
    // 1. Static routes match
    const staticMatch = routes.find((item) => {
      const from = item.from === "agra" && item.to === "agra" ? "agra-sightseeing" : `${item.from}-to-${item.to}`;
      return (
        pathname.includes(`${from}-taxi`) ||
        pathname.includes(`/${item.id}/`) ||
        pathname.endsWith(`/${item.id}`) ||
        cleanPath.endsWith(`/${item.id}`) ||
        section === item.id
      );
    });
    if (staticMatch) return staticMatch;

    // 2. Published admin routes match (including synthesized reverse routes)
    const cleanSection = section.replace(/\.html$/, "");
    const published = (generatedPublishedRoutes as any[]).find((entry) => {
      const slug = String(entry.slug);
      return (
        slug === cleanSection ||
        pathname.includes(`/${slug}/`) ||
        pathname.endsWith(`/${slug}`) ||
        cleanPath.endsWith(`/${slug}`)
      );
    });
    if (published) {
      const fares = published.faresInr ?? published.fares_inr ?? {};
      const distanceKm = Number(published.distanceKm ?? published.distance_km ?? 200);
      const durationText = String(published.durationText ?? published.duration_text ?? "3h 30m");
      const source = String(published.sourceCity ?? published.source_city ?? "Agra");
      const dest = String(published.destinationCity ?? published.destination_city ?? "Delhi");
      return {
        id: String(published.slug),
        from: source.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        to: dest.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        origin: source,
        destination: dest,
        km: distanceKm,
        duration: durationText,
        kind: published.tripType === "round-trip" ? "local" : "one-way",
        fares: {
          ...(Number(fares.sedan) > 0 ? { sedan: Number(fares.sedan) } : {}),
          ...(Number(fares.ertiga) > 0 ? { ertiga: Number(fares.ertiga) } : {}),
          ...(Number(fares.innova) > 0 ? { innova: Number(fares.innova) } : {}),
          ...(Number(fares.tempo) > 0 ? { tempo: Number(fares.tempo) } : {}),
          ...(Number(fares.urbania) > 0 ? { urbania: Number(fares.urbania) } : {}),
        },
      } as Route;
    }

    // 3. Backend catalog routes match
    const catalogRoutes = (generatedCatalog as any)?.routes || [];
    const catMatch = catalogRoutes.find((item: any) => {
      const taxiSlug = `${item.from}-to-${item.to}-taxi`;
      return (
        item.id === cleanSection ||
        taxiSlug === cleanSection ||
        pathname.includes(`/${taxiSlug}/`) ||
        pathname.endsWith(`/${taxiSlug}`) ||
        cleanPath.endsWith(`/${taxiSlug}`) ||
        pathname.includes(`/${item.id}/`) ||
        pathname.endsWith(`/${item.id}`) ||
        cleanPath.endsWith(`/${item.id}`)
      );
    });
    if (catMatch) return catMatch;

    return null;
  }, [pathname, cleanPath, section]);

  const activeRoute = manifestRoute || matchedRoute;

  useEffect(() => {
    if (isHome || isBooking || isMarketingHub || isEntityDetailPathLocal) return;
    const cleanSection = section.replace(/\.html$/, "");
    let isMounted = true;
    loadRoutesManifest()
      .then((data) => {
        if (!data || !isMounted) return;
        const entry = (data as any)[cleanSection] || (data as any)[cleanPath.replace(/^\/(?:en|hi)\//, "").replace(/\/$/, "")];
        if (entry) {
          const durationHrs = Math.floor(entry.m / 60);
          const durationMins = entry.m % 60;
          const durationStr = `${durationHrs}h${durationMins ? ` ${durationMins}m` : ""}`;
          const base: Partial<Route> = matchedRoute || {};
          setManifestRoute({
            ...base,
            id: matchedRoute?.id || cleanSection,
            from: entry.o,
            to: entry.d,
            km: entry.km > 0 ? entry.km : (matchedRoute?.km || 0),
            duration: durationStr,
            kind: entry.pm === "day120" ? "local" : "one-way",
            fares: {
              sedan: entry.fs || 0,
              ertiga: entry.fe || 0,
              innova: entry.fi || 0,
              tempo: entry.ft > 100 ? entry.ft : 0,
              urbania: entry.fu > 100 ? entry.fu : 0,
            },
          } as Route);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [section, pathname, matchedRoute, isHome, isBooking, isMarketingHub]);

  const dossierTourPackage = pathname.includes("/packages/")
    ? (generatedPublishedTourPackages as any[]).find((item) => {
        const itemSlug = item.slug || item.packageCode || item.package_code;
        return itemSlug && pathname.replace(/\/$/, "").endsWith(`/packages/${itemSlug}`);
      })
    : undefined;

  const matchedPackage = pathname.includes("/packages/") && publishedPackages.find((item) => {
    const p = pathname.replace(/\/$/, "");
    const itemSlug = item.slug || (item as any).packageCode || (item as any).package_code;
    return itemSlug && (p.endsWith(`/${itemSlug}`) || p.endsWith(itemSlug));
  });

  // Live catalog detail: any /packages/<slug> that is not in initial lists is
  // resolved dynamically against the backend catalog at runtime (single source of trips).
  const livePackageSlug =
    !matchedPackage &&
    !dossierTourPackage &&
    /\/packages\/[a-z0-9-]+/i.test(pathname.replace(/\.html$/, ""))
      ? (pathname.replace(/\/$/, "").replace(/\.html$/, "").match(/\/packages\/([a-z0-9-]+)/i)?.[1] ?? null)
      : null;

  const dossierTransferRoute = pathname.includes("/transfers/")
    ? (generatedPublishedTransferRoutes as unknown as DossierTransferRouteItem[]).find((item) =>
        pathname.replace(/\/$/, "").endsWith(`/transfers/${item.slug}`)
      )
    : undefined;

  const dossierLocalPackage = pathname.includes("/local-packages/")
    ? (generatedPublishedLocalPackages as unknown as DossierLocalPackageItem[]).find((item) =>
        pathname.replace(/\/$/, "").endsWith(`/local-packages/${item.slug}`)
      )
    : undefined;

  const dossierMonument = pathname.includes("/monuments/")
    ? (((generatedPublishedContent as any)?.monuments || []) as DossierMonumentItem[]).find((item) => {
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

  const isKnownRoute =
    isHome ||
    isBooking ||
    isPrivateCustomerPage ||
    isMarketingHub ||
    isRental ||
    Boolean(activeRoute) ||
    Boolean(dossierTourPackage) ||
    Boolean(matchedPackage) ||
    Boolean(livePackageSlug) ||
    Boolean(dossierTransferRoute) ||
    Boolean(dossierLocalPackage) ||
    Boolean(dossierMonument) ||
    Boolean(cleanProductMatch) ||
    section === "monuments" ||
    cleanPath === "/monuments" ||
    cleanPath === "/en/monuments" ||
    Boolean(matchedVehicle) ||
    isSeoLanding ||
    publishedPackages.some((item) => pathname.endsWith(item.slug) || pathname.endsWith(item.slug + "/"));

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
  } = getSeo(pathname, effectiveSection, language, isBooking, activeRoute);

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
          <Suspense fallback={null}>
            {is404 ? (
              <NotFoundPage language={language} />
            ) : isAuthCallback ? (
              <AuthCallbackPage />
            ) : isMyBookings ? (
              <MyBookingsPage />
            ) : isPaymentResume ? (
              <PaymentResumePage />
            ) : isLogin ? (
              <LoginPage />
            ) : isBookingConfirmation ? (
              <BookingConfirmationPage />
            ) : isReview ? (
              <ReviewPage />
            ) : isBooking ? (
              <BookingPage />
            ) : isHome ? (
              <HomePage language={language} />
            ) : activeRoute ? (
              <RouteDetailPage language={language} route={activeRoute} />
            ) : matchedPackage ? (
              <PackageDetailPage language={language} pkg={matchedPackage} />
            ) : dossierTourPackage ? (
              <PackageDetailPage language={language} pkg={toDossierTourPackage(dossierTourPackage)} />
            ) : livePackageSlug ? (
              <DynamicPackageDetailPage language={language} slug={livePackageSlug} />
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
            ) : isMarketingHub || pathname.startsWith("/en/") ? (
              <MarketingPage language={language} section={section} />
            ) : (
              <NotFoundPage language={language} />
            )}
          </Suspense>
        </SiteLayout>
      </CustomerAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
