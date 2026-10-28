import { useEffect, useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import { ReviewsMarquee } from "../components/home/ReviewsMarquee";
import { FamousPlacesSection } from "../components/home/FamousPlacesSection";
import { HomeHeroSlideshow } from "../components/home/HomeHeroSlideshow";
import { WhatsAppIcon } from "../components/icons";
import { HomeBookingWidget } from "../components/home/HomeBookingWidget";
import { FleetSection } from "../components/home/FleetSection";
import { useCustomerAuth } from "../auth/customerAuth";
import {
  fetchFeaturedPromo,
  type FeaturedPromo,
  createInquiry,
  formatInquiryPhone,
  sanitizeInquiryName,
} from "../services/api";
import { fetchLiveFleet, type PublicFleetVehicle } from "../services/catalog";
import {
  loadRoutesManifest,
  loadPublishedPackages,
  fetchPublishedTransferRoutes,
  fetchPublishedLocalTransfers,
  type CompressedRoute,
} from "../services/catalogManifest";
import { packages as staticPackages, type TourPackage } from "../data";
import { onUserInteractionOrIdle } from "../utils/deferredRevalidation";


export interface HomePageProps {
  language?: SupportedLanguage;
}

export function HomePage({ language = "en" }: HomePageProps) {
  const { user, loading: authLoading, configured, signInWithGoogle } = useCustomerAuth();
  const [accountPromptDismissed, setAccountPromptDismissed] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("arenaai:account-prompt-dismissed") !== "1") {
        setAccountPromptDismissed(false);
      }
    } catch { /* optional preference */ }
  }, []);
  const text = "Agra to Anywhere";
  const [tripType, setTripType] = useState<"oneway" | "round" | "local">("oneway");
  const [origin, setOrigin] = useState("Agra");
  const [destination, setDestination] = useState("Delhi");
  const [selectedVehicle, setSelectedVehicle] = useState<"sedan" | "ertiga" | "innova" | "tempo" | "urbania">("sedan");
  const [couponCopied, setCouponCopied] = useState(false);
  const [featuredPromo, setFeaturedPromo] = useState<FeaturedPromo | null>(null);

  useEffect(() => {
    let mounted = true;
    const cleanup = onUserInteractionOrIdle(() => {
      fetchFeaturedPromo()
        .then((p) => {
          if (mounted) setFeaturedPromo(p);
        })
        .catch(() => undefined);
    }, 8000);

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const [liveFleet, setLiveFleet] = useState<PublicFleetVehicle[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [manifestRoutes, setManifestRoutes] = useState<Record<string, CompressedRoute>>({});
  const [routesLoading, setRoutesLoading] = useState(true);
  const [publishedPackages, setPublishedPackages] = useState<TourPackage[]>(() => [...staticPackages]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [transferRoutes, setTransferRoutes] = useState<any[]>([]);
  const [localPackages, setLocalPackages] = useState<any[]>([]);
  const [popularTripMode, setPopularTripMode] = useState<"oneway" | "round">("oneway");

  useEffect(() => {
    let active = true;
    fetchLiveFleet()
      .then((f) => {
        if (active && f.length > 0) setLiveFleet(f);
      })
      .catch(() => { })
      .finally(() => {
        if (active) setFleetLoading(false);
      });

    loadRoutesManifest()
      .then((m) => {
        if (active && m) setManifestRoutes(m);
      })
      .catch(() => { })
      .finally(() => {
        if (active) setRoutesLoading(false);
      });

    loadPublishedPackages()
      .then((pkgs) => {
        if (active && pkgs) setPublishedPackages(pkgs);
      })
      .catch(() => { })
      .finally(() => {
        if (active) setPackagesLoading(false);
      });

    fetchPublishedTransferRoutes()
      .then((transfers) => {
        if (active && transfers && transfers.length > 0) setTransferRoutes(transfers);
      })
      .catch(() => { });

    fetchPublishedLocalTransfers()
      .then((locals) => {
        if (active && locals && locals.length > 0) setLocalPackages(locals);
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, []);

  const popularRoutesList = useMemo(() => {
    const entries = Object.entries(manifestRoutes);
    if (entries.length === 0) return [];

    // Prioritize canonical primary corridors in order
    const prioritySlugs = ["agra-to-delhi", "agra-to-jaipur", "agra-to-mathura", "agra-to-lucknow"];
    const sorted = [...entries].sort(([slugA], [slugB]) => {
      const idxA = prioritySlugs.indexOf(slugA);
      const idxB = prioritySlugs.indexOf(slugB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return sorted.slice(0, 4).map(([slug, item]) => {
      const durationHrs = Math.floor(item.m / 60);
      const durationMins = item.m % 60;
      return {
        slug,
        from: item.o,
        to: item.d,
        badge: item.c ? item.c.split("->")[0]?.trim() : "Outstation Corridor",
        km: `${item.km} km`,
        time: `${durationHrs}h${durationMins ? ` ${durationMins}m` : ""}`,
        note: item.c || "Direct Highway Corridor",
        price: item.fs && item.fs > 0 ? item.fs : null,
        icon: "directions_car",
      };
    });
  }, [manifestRoutes]);

  const sedanRate = useMemo(() => {
    const found = liveFleet.find((f) => f.tier === "sedan" || f.id === "sedan");
    return found && found.perKm && found.perKm > 0 ? found.perKm : null;
  }, [liveFleet]);

  const tempoRate = useMemo(() => {
    const found = liveFleet.find((f) => f.tier === "tempo" || f.id === "tempo" || f.id === "tempo-traveller");
    return found && found.perKm && found.perKm > 0 ? found.perKm : null;
  }, [liveFleet]);

  // Authoritative dynamic pricing badges for Cab & Tour Services — zero guessed fallbacks
  const cabServiceTags = useMemo(() => {
    const delhiRoute = Object.values(manifestRoutes).find((r) => r.d?.toLowerCase().includes("delhi") || r.o?.toLowerCase().includes("delhi"));
    const jaipurRoute = Object.values(manifestRoutes).find((r) => r.d?.toLowerCase().includes("jaipur") || r.o?.toLowerCase().includes("jaipur"));
    const delhiDropTag = delhiRoute?.fs ? `Delhi ₹${delhiRoute.fs.toLocaleString("en-IN")}` : "Delhi Express Drop";
    const jaipurDropTag = jaipurRoute?.fs ? `Jaipur ₹${jaipurRoute.fs.toLocaleString("en-IN")}` : "Jaipur Corridor";

    const roundTripTag1 = sedanRate ? `From ₹${sedanRate}/km` : "Transparent ₹/km";
    const roundTripTag2 = "300 km/day minimum";

    const standardLocal = localPackages.find((p) => p.slug?.includes("standard") || p.durationHours === 8 || p.packageCode === "agra-8h-80km");
    const extendedLocal = localPackages.find((p) => p.slug?.includes("extended") || p.durationHours === 12);
    const p8Price = standardLocal?.fleetPrices?.sedan ?? standardLocal?.fleetPrices?.dzire ?? standardLocal?.from ?? null;
    const p12Price = extendedLocal?.fleetPrices?.sedan ?? extendedLocal?.fleetPrices?.dzire ?? extendedLocal?.from ?? null;
    const localTag1 = p8Price ? `8h / 80km ₹${p8Price.toLocaleString("en-IN")}` : "8h / 80km Local Sightseeing";
    const localTag2 = p12Price ? `12h / 120km ₹${p12Price.toLocaleString("en-IN")}` : "12h / 120km Extended Tour";

    const agraCanttTransfer = transferRoutes.find((t) => t.slug?.includes("cantt") || t.routeCode?.includes("cantt") || t.routeCode === "agra-cantt-to-hotel");
    const delhiIgiTransfer = transferRoutes.find((t) => t.slug?.includes("delhi-igi") || t.routeCode?.includes("delhi-igi"));
    const canttPrice = agraCanttTransfer?.fleetPrices?.sedan ?? agraCanttTransfer?.starting_price_inr ?? null;
    const igiPrice = delhiIgiTransfer?.fleetPrices?.sedan ?? delhiRoute?.fs ?? null;
    const transferTag1 = canttPrice ? `Agra Cantt ₹${canttPrice.toLocaleString("en-IN")}` : "Agra Cantt Station Drop";
    const transferTag2 = igiPrice ? `Delhi IGI ₹${igiPrice.toLocaleString("en-IN")}` : "Delhi Airport Transfer";

    const tempoTag1 = tempoRate ? `From ₹${tempoRate}/km` : "9–26 Seater Fleet";
    const tempoTag2 = "Chilled AC • Pushback";

    const sameDayTour = publishedPackages.find((p) => p.slug?.includes("same-day") || p.days === 1);
    const triangleTour = publishedPackages.find((p) => p.slug?.includes("triangle") || (p.days != null && p.days > 1));
    const sameDayPrice = sameDayTour?.from ? Number(sameDayTour.from) : null;
    const trianglePrice = triangleTour?.from ? Number(triangleTour.from) : null;
    const tourTag1 = sameDayPrice ? `Same Day ₹${sameDayPrice.toLocaleString("en-IN")}` : "Same Day Excursions";
    const tourTag2 = trianglePrice ? `Triangle ₹${trianglePrice.toLocaleString("en-IN")}` : "Golden Triangle Package";

    return {
      oneway: [delhiDropTag, jaipurDropTag],
      roundtrip: [roundTripTag1, roundTripTag2],
      local: [localTag1, localTag2],
      transfers: [transferTag1, transferTag2],
      tempo: [tempoTag1, tempoTag2],
      tours: [tourTag1, tourTag2],
    };
  }, [manifestRoutes, transferRoutes, localPackages, publishedPackages, sedanRate, tempoRate]);

  // Authoritative dynamic pricing badges for Direct Charters & Transfers section — zero hardcoded numbers
  const directTransferPrices = useMemo(() => {
    const agraCantt = transferRoutes.find((t) => t.slug?.includes("cantt") || t.routeCode?.includes("cantt") || t.routeCode === "agra-cantt-to-hotel");
    const delhiIgi = transferRoutes.find((t) => t.slug?.includes("delhi-igi") || t.routeCode?.includes("delhi-igi"));
    const kheria = transferRoutes.find((t) => t.slug?.includes("kheria") || t.routeCode?.includes("kheria"));
    const standardLocal = localPackages.find((p) => p.slug?.includes("standard") || p.durationHours === 8 || p.packageCode === "agra-8h-80km");
    const extendedLocal = localPackages.find((p) => p.slug?.includes("extended") || p.durationHours === 12);
    const delhiRoute = Object.values(manifestRoutes).find((r) => r.d?.toLowerCase().includes("delhi") || r.o?.toLowerCase().includes("delhi"));

    const canttPrice = agraCantt?.fleetPrices?.sedan ?? agraCantt?.starting_price_inr ?? null;
    const igiPrice = delhiIgi?.fleetPrices?.sedan ?? delhiRoute?.fs ?? null;
    const kheriaPrice = kheria?.fleetPrices?.sedan ?? null;
    const standardPrice = standardLocal?.fleetPrices?.sedan ?? standardLocal?.fleetPrices?.dzire ?? standardLocal?.from ?? null;
    const extendedPrice = extendedLocal?.fleetPrices?.sedan ?? extendedLocal?.fleetPrices?.dzire ?? extendedLocal?.from ?? null;

    return {
      cantt: canttPrice ? `From ₹${canttPrice.toLocaleString("en-IN")}` : "On request",
      delhiIgi: igiPrice ? `From ₹${igiPrice.toLocaleString("en-IN")}` : "On request",
      kheria: kheriaPrice ? `From ₹${kheriaPrice.toLocaleString("en-IN")}` : "On request",
      standardLocal: standardPrice ? `From ₹${standardPrice.toLocaleString("en-IN")}` : "On request",
      extendedLocal: extendedPrice ? `From ₹${extendedPrice.toLocaleString("en-IN")}` : "On request",
      tajGuide: canttPrice ? `Cab from ₹${canttPrice.toLocaleString("en-IN")}` : "On request",
    };
  }, [transferRoutes, localPackages, manifestRoutes]);

  const copyCoupon = () => {
    if (featuredPromo && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(featuredPromo.code);
      setCouponCopied(true);
      setTimeout(() => setCouponCopied(false), 2500);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inquirySubmitting) return;
    setInquirySubmitting(true);
    setInquiryError(null);
    try {
      const cleanName = sanitizeInquiryName(inquiryName);
      const cleanPhone = formatInquiryPhone(inquiryPhone);
      const message = `Travel Date: ${inquiryDate || "Flexible"}, Route: ${origin} to ${destination} (${tripType}), Vehicle: ${selectedVehicle}. Notes: ${inquiryNotes || "None"}`;
      await createInquiry({
        name: cleanName,
        phone: cleanPhone,
        message: message.slice(0, 2000),
        tripInterest: `Homepage inquiry: ${origin} to ${destination}`,
      });
      setInquirySubmitted(true);
    } catch (err: any) {
      setInquiryError(err?.message || "Failed to submit inquiry. Please call us directly at +91 97628 17598.");
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">

      {!authLoading && configured && !user && !accountPromptDismissed && (
        <aside className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 rounded-xl shadow-2xl border border-border-warm bg-surface-container-lowest p-4 animate-in slide-in-from-bottom duration-300" aria-label="Optional account sign-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-midnight">Save your trips</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Sign in with Google to find pending and previous bookings later. You can also do this at checkout.</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss account reminder"
              onClick={() => { setAccountPromptDismissed(true); try { window.localStorage.setItem("arenaai:account-prompt-dismissed", "1"); } catch { } }}
              className="text-on-surface-variant hover:text-ink-midnight min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center rounded-md shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={() => void signInWithGoogle().catch(() => { })} className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-container transition-colors">Continue with Google</button>
            <button type="button" onClick={() => { setAccountPromptDismissed(true); try { window.localStorage.setItem("arenaai:account-prompt-dismissed", "1"); } catch { } }} className="rounded-lg px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">Dismiss</button>
          </div>
        </aside>
      )}

      {/* ── MAIN HOMEPAGE CONTENT ── */}
      <main id="main-content" className="w-full relative z-20">
        {/* ── HERO ── Full-Bleed Cinematic Taj Mahal Hero (100vw edge-to-edge) with Centered Typography */}
        <section className="relative w-full min-h-[520px] lg:min-h-[580px] flex flex-col justify-center items-center pt-24 sm:pt-32 pb-20 bg-ink-midnight text-on-primary overflow-hidden">
          <HomeHeroSlideshow />
          {/* Cinematic lighting gradient overlay: ensures 100% crisp text legibility while keeping the majestic monument vividly visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-midnight/70 via-ink-midnight/35 to-ink-midnight/80 z-0 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-surface via-surface/40 to-transparent z-0 pointer-events-none" />

          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-5">
            {/* Live Operational Dispatch Glass Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Agra Hub Dispatch • 24/7 Verified Chauffeur Fleet</span>
            </div>

            {/* 100% SEO-Safe Headline with Handwriting Flourish */}
            <h1 className="font-headline-hero text-headline-hero font-normal leading-[1.12] w-full max-w-4xl">
              {/* Semantic HTML text for search crawlers & screen readers */}
              <span className="sr-only">Premium Taxi Service & Tour Packages in Agra</span>

              <div aria-hidden="true" className="select-none flex flex-col items-center gap-1.5 w-full">
                {/* Line 1: Agra to Anywhere */}
                <div
                  className="text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] drop-shadow-[0_6px_28px_rgba(0,0,0,0.7)] overflow-visible pb-0.5"
                  aria-label={text}
                >
                  {text.split("").map((letter, index) => (
                    <span
                      key={`${letter}-${index}`}
                      className="inline-block font-serif italic text-4xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/85"
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </span>
                  ))}
                </div>

                {/* Line 2: in first-class comfort. in luminous light white/champagne */}
                <div className="relative w-full max-w-xl mt-1 flex flex-col items-center">
                  <div
                    className="font-serif italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-3xl sm:text-5xl md:text-6xl"
                    style={{
                      lineHeight: 1.15,
                      fontFamily: "'Playfair Display', 'EB Garamond', Georgia, serif",
                    }}
                  >
                    in first-class comfort.
                  </div>

                  {/* Cursive flourish underline stroke in luminous white silk */}
                  <svg
                    viewBox="0 0 520 24"
                    className="w-full max-w-[420px] h-auto overflow-visible mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 14 C120 18, 300 6, 500 12"
                      stroke="url(#underlineWhiteSilk)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underlineWhiteSilk" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="75%" stopColor="#F5F2EB" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </h1>

            <p className="font-body-lg text-body-lg text-ivory-surface max-w-2xl leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Explore local monuments or plan outstation trips with Agra's trusted travel partner. Doorstep pickup across Agra, Taj Mahal sunrise tours by car, and transparent per-km billing.
            </p>

            {/* Direct CTAs with 48px touch targets */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[48px] rounded-full bg-primary hover:bg-primary-container text-white font-label-lg shadow-lg hover:shadow-xl transition-all font-semibold active:scale-[0.98] border border-white/20"
                href="tel:+919762817598"
              >
                <span className="material-symbols-outlined text-icon-18">call</span>
                <span className="text-white">Call +91 97628 17598</span>
              </a>
              <a
                className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[48px] rounded-full bg-black/80 hover:bg-black text-white font-label-lg shadow-lg hover:shadow-xl transition-all font-semibold active:scale-[0.98] border border-white/25 backdrop-blur-md"
                style={{ color: "#ffffff" }}
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Book taxi directly on WhatsApp (opens in new window)"
              >
                <WhatsAppIcon className="w-[18px] h-[18px] shrink-0 text-white" />
                <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Booking</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── FLOATING FROSTED GLASS BOOKING DOCK ── */}
        <section className="relative z-30 w-full -mt-12 sm:-mt-16 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto" aria-label="Book your taxi">
          <div className="rounded-3xl glass-card-frosted p-2.5 sm:p-5 shadow-[0_20px_50px_rgba(15,19,26,0.12)] border border-white/80">
            <HomeBookingWidget />
          </div>
        </section>

        {/* ── GLASS TRUST BANNER ── Spans 100% full width with smooth marquee */}
        <div className="w-full bg-surface-container-low/90 backdrop-blur-md border-y border-border-warm/50 py-3.5 overflow-hidden relative z-20 mt-8">
          {/* Left edge fade gradient mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-surface-container-low via-surface-container-low/90 to-transparent z-10" />
          {/* Right edge fade gradient mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-surface-container-low via-surface-container-low/90 to-transparent z-10" />

          <div className="animate-marquee flex items-center gap-10 text-on-surface whitespace-nowrap">
            {[...Array(2)].flatMap(() => [
              { icon: "verified_user", title: "Govt-Registered", sub: "Tourist Vehicle Permit" },
              { icon: "badge", title: "Verified Chauffeurs", sub: "Police Background Check" },
              { icon: "receipt_long", title: "Tax Invoice", sub: "Available on request" },
              { icon: "verified", title: "Top-Rated Service", sub: "Verified Customer Reviews" },
              { icon: "support_agent", title: "24×7 Dispatch", sub: "Live Agra Control Desk" },
            ]).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 shrink-0 px-4">
                <span className="material-symbols-outlined text-primary text-icon-20">{item.icon}</span>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md font-bold leading-tight text-ink-midnight">{item.title}</span>
                  <span className="font-label-caps text-label-sm text-on-surface-variant">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BRAND AUTHORITY & LOCAL AGRA HUB SECTION ── */}
        <section className="w-full py-space-3xl bg-surface-container-low border-y border-border-warm/40" aria-labelledby="brand-overview-heading">
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            <div className="max-w-3xl mx-auto text-center mb-space-xl">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary font-bold">Trusted Local Operator</span>
              <h2 id="brand-overview-heading" className="font-headline-lg text-headline-lg text-on-surface mt-2">
                Your Trusted Partner for Local Sightseeing and Outstation Cab Booking in Agra
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Direct origin-Agra transport services with verified chauffeurs, transparent per-km billing, and 24/7 client dispatch.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg max-w-5xl mx-auto text-on-surface-variant font-body-md text-body-md leading-relaxed">
              <div className="p-space-xl rounded-3xl glass-card-frosted shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <p>
                  Welcome to <strong className="text-on-surface font-semibold">Agra SK Baghel Tour and Travels</strong>, your premier companion for local sightseeing and outstation cab booking in Agra. Whether you need a hassle-free drop from <strong className="text-on-surface font-semibold">Agra Cantt railway station taxi service</strong>, an early morning <strong className="text-on-surface font-semibold">taj mahal sunrise tour package by car</strong>, or a comfortable family outstation trip, our well-maintained fleet and expert local chauffeurs ensure a smooth ride. We specialize in custom travel itineraries originating from Agra to anywhere across India, delivering unmatched safety, pocket-friendly transparent billing, and 24/7 client support.
                </p>
                <div className="mt-4 pt-4 border-t border-border-warm/40 flex items-center justify-between text-primary font-semibold">
                  <a href="/en/packages/" className="inline-flex items-center gap-1 hover:underline">
                    Explore Local Sightseeing Packages <span className="material-symbols-outlined text-icon-16">east</span>
                  </a>
                </div>
              </div>
              <div className="p-space-xl rounded-3xl glass-card-frosted shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <p>
                  Finding a reliable <strong className="text-on-surface font-semibold">car rental in agra with a driver</strong> shouldn't be complicated. We offer clean, air-conditioned options ranging from economical family cars to luxury executive vehicles. As a leading name in <strong className="text-on-surface font-semibold">agra tour and travels</strong>, we prioritize punctuality, clean vehicle cabins, and professional local driver-guides who know the routes perfectly. Book your <strong className="text-on-surface font-semibold">local sightseeing taxi in agra</strong> today and experience the city of love without transit stress.
                </p>
                <div className="mt-4 pt-4 border-t border-border-warm/40 flex items-center justify-between text-primary font-semibold">
                  <a href="/en/routes/" className="inline-flex items-center gap-1 hover:underline">
                    Explore Outstation Taxi Routes <span className="material-symbols-outlined text-icon-16">east</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── POPULAR ROUTES ── Dynamic published routes with One-Way / Round-Trip mode */}
        <section
          className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
        >
          {/* Section header: centred with mode toggle */}
          <div className="mb-space-lg text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Popular Outstation Routes</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
              Verified published intercity corridors with transparent expressway billing.
            </p>

            {/* One-Way vs Round-Trip Selector */}
            <div className="inline-flex items-center p-1.5 rounded-full glass-pill bg-surface-container/80 border border-border-warm/60 mt-4 shadow-xs">
              <button
                type="button"
                onClick={() => setPopularTripMode("oneway")}
                className={`px-4 py-1.5 rounded-full font-label-caps text-xs uppercase tracking-wider font-bold transition-all ${popularTripMode === "oneway"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface hover:text-primary"
                  }`}
              >
                One-Way Drop
              </button>
              <button
                type="button"
                onClick={() => setPopularTripMode("round")}
                className={`px-4 py-1.5 rounded-full font-label-caps text-xs uppercase tracking-wider font-bold transition-all ${popularTripMode === "round"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface hover:text-primary"
                  }`}
              >
                Round-Trip Tour (300 km/day)
              </button>
            </div>
          </div>

          {/* Horizontal route rows wrapped in Frosted Glass */}
          <div className="p-4 sm:p-6 rounded-3xl glass-card-frosted shadow-md divide-y divide-border-warm/40">
            {routesLoading && popularRoutesList.length === 0 ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="py-4 animate-pulse flex items-center justify-between">
                  <div className="h-6 w-48 bg-surface-container rounded" />
                  <div className="h-6 w-20 bg-surface-container rounded" />
                </div>
              ))
            ) : popularRoutesList.length > 0 ? (
              popularRoutesList.map((route) => (
                <div key={route.slug} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 group">
                  {/* Route identity */}
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="material-symbols-outlined text-on-surface-variant text-icon-22 shrink-0">{route.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-title-md text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {route.from} → {route.to}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sandstone-wash text-primary font-label-caps text-label-caps uppercase font-bold shrink-0">
                          {route.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-body-sm text-label-lg text-on-surface-variant">
                        <span>{route.km}</span>
                        <span className="w-1 h-1 rounded-full bg-on-surface-variant/40" />
                        <span>{route.time}</span>
                        <span className="w-1 h-1 rounded-full bg-on-surface-variant/40" />
                        <span className="truncate">{route.note}</span>
                      </div>
                    </div>
                  </div>
                  {/* Price + CTA */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="font-label-caps text-label-caps text-on-surface-variant block">
                        {popularTripMode === "oneway" ? "Sedan One-Way" : "Round-Trip Rate"}
                      </span>
                      <span className="font-price-display text-lg font-bold text-primary">
                        {popularTripMode === "oneway"
                          ? (route.price ? `₹${route.price.toLocaleString("en-IN")}` : "On request")
                          : (sedanRate ? `Round-trip • ₹${sedanRate}/km basis` : "Round-trip • On request")}
                      </span>
                    </div>
                    <a
                      className="min-h-[44px] px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md font-bold transition-all duration-200 whitespace-nowrap active:scale-[0.98] shadow-xs inline-flex items-center justify-center"
                      href={`/book?category=outstation&from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&route=${encodeURIComponent(route.slug)}&trip=${popularTripMode === "oneway" ? "one-way" : "round-trip"}`}
                      aria-label={`Book cab from ${route.from} to ${route.to}`}
                    >
                      <span className="text-white font-bold">Book ↗</span>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-surface-container-low rounded-xl p-6">
                <p className="text-on-surface-variant">No outstation routes currently configured.</p>
                <a href="/en/routes/" className="text-primary font-semibold hover:underline mt-2 inline-block">Browse all destinations ↗</a>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <a
              className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
              href="/en/routes/"
            >
              <span>View All Published Routes</span>
              <span className="material-symbols-outlined text-icon-16">east</span>
            </a>
          </div>
        </section>

        {/* ── SERVICES ── 2-col feature layout, NO numbered markers (content is not a sequence) */}
        <section
          className="w-full py-space-3xl bg-ink-midnight text-ivory-surface texture"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            {/* Single eyebrow for this page (1 of 3 allowed) */}
            <div className="mb-space-xl reveal">
              <span className="font-label-caps text-label-caps text-terracotta-sunlit uppercase tracking-widest block mb-2">
                Cab Services
              </span>
              <h2 className="font-headline-lg text-headline-lg text-ivory-surface hero-line max-w-xl">
                Cab &amp; Tour Services
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-warm/15 rule">
              {[
                {
                  icon: "directions_car",
                  title: "One-Way Outstation Drop",
                  body: "Fixed one-way fares with expressway tolls and driver allowance included. Zero return fare.",
                  tags: cabServiceTags.oneway,
                  href: "/routes",
                },
                {
                  icon: "sync_alt",
                  title: "Outstation Round-Trip",
                  body: "Multi-day cab rentals with 300 km/day billing. Driver night charges included.",
                  tags: cabServiceTags.roundtrip,
                  href: "/book",
                },
                {
                  icon: "account_balance",
                  title: "Local Sightseeing",
                  body: "8-hour (80 km) and 12-hour (120 km) packages for Taj Mahal, Agra Fort, and local markets.",
                  tags: cabServiceTags.local,
                  href: "/packages",
                },
                {
                  icon: "flight_takeoff",
                  title: "Airport & Station Transfers",
                  body: "On-time pickup and drop at Delhi IGI Airport, Agra Cantt, and railway stations.",
                  tags: cabServiceTags.transfers,
                  href: "/book",
                },
                {
                  icon: "airport_shuttle",
                  title: "Tempo Traveller & Urbania",
                  body: "9 to 26-seater group vehicles with pushback seats, rear AC, and separate luggage bay.",
                  tags: cabServiceTags.tempo,
                  href: "/fleet",
                },
                {
                  icon: "wb_twilight",
                  title: "Curated Tour Packages",
                  body: "Same-day Agra circuits and Golden Triangle routes with licensed tour guide options.",
                  tags: cabServiceTags.tours,
                  href: "/packages",
                },
              ].map((svc, idx) => (
                <div
                  key={svc.title}
                  style={{ "--reveal-delay": `${(idx % 2) * 100}ms` } as React.CSSProperties}
                  className="bg-ink-midnight p-5 sm:p-6 flex flex-col gap-3 hover:bg-ink-charcoal transition-colors lift reveal"
                >
                  <span className="material-symbols-outlined text-terracotta-sunlit text-icon-24">{svc.icon}</span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-ivory-surface font-normal mb-1">{svc.title}</h3>
                    <p className="font-body-sm text-body-md text-ivory-surface/65 leading-relaxed">{svc.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {svc.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-border-warm/10 text-ivory-surface/70 font-label-caps text-label-caps">{t}</span>
                    ))}
                  </div>
                  <a
                    className="inline-flex items-center gap-1 font-label-lg text-label-md text-terracotta-sunlit hover:text-gold-accent transition-colors font-semibold self-start sweep"
                    href={svc.href}
                    aria-label={`Learn more about ${svc.title}`}
                  >
                    <span>Learn more</span>
                    <span className="material-symbols-outlined text-icon-13" aria-hidden="true">arrow_forward</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FLEET ── Canonical Fleet Showcase (Sedan, SUV, Luxury, Tempo Traveller) ── */}
        <FleetSection language={language} />

        {/* ── TOUR PACKAGES ── 3-col card grid (different from routes & services above) */}
        <section
          className="w-full py-space-3xl bg-surface-container-low"
          id="tours"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            {/* Second eyebrow (2 of 3 allowed, separated by 2 sections) */}
            <div className="mb-space-xl flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">Guided Tours</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Guided tours from Agra</h2>
              </div>
              <a
                className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:text-primary-container font-semibold transition-colors"
                href="/en/packages/"
              >
                <span>All packages</span>
                <span className="material-symbols-outlined text-icon-16">east</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {packagesLoading && publishedPackages.length === 0 ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl h-64 animate-pulse border border-border-warm/30" />
                ))
              ) : publishedPackages.length > 0 ? (
                publishedPackages.slice(0, 3).map((pkg) => {
                  const duration = pkg.duration || `${pkg.days ?? 1} Day Tour`;
                  const fromPrice = pkg.from && Number(pkg.from) > 0 ? `From ₹${Number(pkg.from).toLocaleString("en-IN")}` : "On request";
                  const image = pkg.image || (pkg.gallery && pkg.gallery[0] ? pkg.gallery[0].url : "/assets/packages/taj-dawn.webp");
                  const stops = (pkg.places && pkg.places.length > 0)
                    ? pkg.places.slice(0, 3)
                    : (pkg.includes && pkg.includes.length > 0)
                      ? pkg.includes.slice(0, 3)
                      : [];

                  return (
                    <div key={pkg.slug || pkg.id} className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all border border-border-warm/40">
                      <div className="relative h-40 w-full overflow-hidden bg-surface-container">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={image}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                          width={384}
                          height={160}
                          loading="lazy"
                          decoding="async"
                          alt={pkg.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/assets/packages/taj-dawn.webp";
                          }}
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-ink-midnight/80 text-tertiary-fixed font-label-caps text-label-caps uppercase font-bold backdrop-blur-sm">
                          {pkg.kicker || duration}
                        </span>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-terracotta-deep text-white font-price-display text-sm font-bold">
                          {fromPrice}
                        </div>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col gap-2">
                        <h3 className="font-title-md text-title-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">{pkg.name}</h3>
                        <p className="font-body-sm text-body-md text-on-surface-variant leading-relaxed line-clamp-2">{pkg.blurb}</p>
                        {stops.length > 0 && (
                          <ul className="space-y-1 mt-1">
                            {stops.map((item) => (
                              <li key={item} className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                                <span className="w-1 h-1 rounded-full bg-gold-accent shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        <a
                          className="mt-auto pt-2 border-t border-border-warm/40 inline-flex items-center gap-1 font-label-lg text-label-md text-primary hover:text-primary-container font-bold transition-colors min-h-[44px] py-2"
                          href={`/en/packages/${encodeURIComponent(pkg.slug)}/`}
                          aria-label={`View tour: ${pkg.name}`}
                        >
                          <span>View Tour</span>
                          <span className="material-symbols-outlined text-icon-13">east</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center bg-surface-container rounded-xl p-6">
                  <p className="text-on-surface-variant">No tours currently published. Check our complete packages catalogue.</p>
                  <a href="/en/packages/" className="text-primary font-semibold hover:underline mt-2 inline-block">View all packages ↗</a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── FAMOUS PLACES & HERITAGE LANDMARKS ── Multi-image high-res Unsplash gallery */}
        <FamousPlacesSection />

        {/* ── REVIEWS MARQUEE ── LOCKED, no changes */}
        <ReviewsMarquee />

        {/* ── BENEFITS + COUPON ── 21st.dev Modern Motion Bento Layout ── */}
        <section
          className="w-full py-space-3xl max-w-[1280px] mx-auto px-margin-mobile lg:px-margin"
        >
          <div className="mb-space-xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">
              Why Choose Us
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Why book with us.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-lg">
              Direct dispatch from Taj Ganj, Agra. Transparent pricing, verified drivers, and zero surprises.
            </p>
          </div>

          {/* Accessible benefit grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md mb-space-xl">
            {[
              {
                icon: "touch_app",
                title: "Confirmed in 2 Minutes",
                desc: "Instant booking via website or WhatsApp. Fast SMS confirmation with driver details — no middlemen.",
                badge: "Fast Booking",
              },
              {
                icon: "price_check",
                title: "Zero Hidden Fees",
                desc: "All expressway tolls, state permits, and fuel charges included upfront. No return-trip charges on one-way rides.",
                badge: "Toll-Inclusive",
              },
              {
                icon: "schedule",
                title: "Punctual Every Time",
                desc: "Live train and flight delay tracking. Your cab arrives 15 minutes before scheduled pickup time.",
                badge: "Live Tracking",
              },
              {
                icon: "policy",
                title: "Verified Drivers",
                desc: "Commercial driver license, police background check, and minimum 5 years highway driving experience.",
                badge: "Police-Verified",
              },
              {
                icon: "garage",
                title: "Sedan to 26-Seater",
                desc: "Spotless AC Dzire, Ertiga, Innova Crysta, and 9–26 seat Tempo Travellers and luxury Urbania.",
                badge: "Clean AC Fleet",
              },
              {
                icon: "support_agent",
                title: "24×7 Local Dispatch",
                desc: "Direct phone and WhatsApp support from our Taj Ganj dispatch office in Agra. Real humans, not bots.",
                badge: "Taj Ganj Office",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border flex flex-col gap-3 group transition-all duration-300 bg-ink-charcoal text-ivory-surface border-border-warm/20 hover:border-gold-accent/40 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 bg-primary text-white">
                    <span className="material-symbols-outlined text-icon-20">{item.icon}</span>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase font-bold px-2 py-0.5 rounded-full bg-gold-accent/15 text-gold-accent border border-gold-accent/30">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-ivory-surface">
                  {item.title}
                </h3>
                <p className="font-body-sm text-body-md leading-relaxed text-ivory-surface/75">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Promo coupon — interactive 21st.dev strip (rendered only when active broadcast promo exists) */}
          {featuredPromo && (
            <div
              className="bg-sandstone-wash rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-space-md border border-border-warm/60 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-icon-20 text-white">confirmation_number</span>
                </div>
                <div>
                  <h3 className="font-title-md text-headline-sm text-on-surface font-bold">
                    Flat ₹{featuredPromo.discountAmount} off with {featuredPromo.code}
                  </h3>
                  <p className="font-body-sm text-body-md text-on-surface-variant mt-0.5">
                    {featuredPromo.description} (Min total: ₹{featuredPromo.minTotal.toLocaleString("en-IN")})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg border border-border-warm/40 shadow-sm shrink-0">
                <span className="font-label-caps text-label-caps text-on-surface-variant font-semibold">Coupon:</span>
                <code className="font-title-md font-bold text-primary tracking-wider text-xs">{featuredPromo.code}</code>
                <button
                  type="button"
                  onClick={copyCoupon}
                  className="text-label-lg px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-caps transition-all font-bold shadow-xs active:scale-[0.98] inline-flex items-center gap-1 cursor-pointer"
                >
                  {couponCopied ? (
                    <>
                      <span className="material-symbols-outlined text-icon-13 text-white">check</span>
                      <span className="text-white">Copied!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-icon-13 text-white">content_copy</span>
                      <span className="text-white">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Quick Directory: Transfers, Local Packages & Monument Guides */}
        <section className="w-full py-8 bg-surface-container-low/70 border-t border-border-warm/50">
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="font-label-caps text-body-sm text-primary uppercase tracking-widest font-bold block mb-1">
                  Direct Charters &amp; Transfers
                </span>
                <h3 className="font-headline-sm text-base sm:text-headline-lg-mobile text-on-surface font-bold">
                  Popular Station Drops, Airport Transfers &amp; Heritage Guides
                </h3>
              </div>
              <a href="/en/packages/" className="text-xs text-primary font-bold hover:underline shrink-0">
                View All Packages →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <a href="/book?category=transfer&product=agra-cantt-to-hotel" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Agra Cantt Drop</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.cantt}</span>
              </a>
              <a href="/book?category=transfer&product=delhi-igi-airport" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Delhi IGI Transfer</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.delhiIgi}</span>
              </a>
              <a href="/book?category=transfer&product=kheria-airport-transfer" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Agra Airport (AGR)</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.kheria}</span>
              </a>
              <a href="/book?category=local_package&product=agra-8h-80km" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Agra 8Hr / 80KM</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.standardLocal}</span>
              </a>
              <a href="/book?category=local_package&product=agra-12h-city" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Agra 12Hr City Tour</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.extendedLocal}</span>
              </a>
              <a href="/book?category=local_package&product=agra-8h-80km" className="p-2.5 rounded-lg bg-surface-container-lowest border border-border-warm/60 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <span className="font-bold text-ink-charcoal truncate">Taj Mahal Guide</span>
                <span className="text-primary font-semibold mt-1">{directTransferPrices.tajGuide}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── CONTACT / INQUIRY ── 2-col layout (same as hero split, but this is the CTA section) */}
        {/* Third eyebrow (3 of 3 allowed) */}
        <section
          className="w-full py-space-3xl bg-surface-container-low"
        >
          <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest block mb-2">Contact</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    Your driver is a call away.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                    Based in Taj Ganj, beside the Taj Mahal. 24×7 dispatch for airport drops, outstation cabs, and custom sightseeing.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <a className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40" href="tel:+919762817598">
                    <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-icon-18">call</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">Call 24×7</span>
                      <span className="font-title-md text-title-lg text-on-surface font-bold">+91 97628 17598</span>
                    </div>
                  </a>
                  <a className="p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center gap-3 shadow-sm border border-border-warm/40" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                      <WhatsAppIcon className="w-[18px] h-[18px] shrink-0" />
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">WhatsApp</span>
                      <span className="font-title-md text-title-lg text-on-surface font-bold">Chat with Support</span>
                    </div>
                  </a>
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest flex items-center gap-3 shadow-sm border border-border-warm/40 sm:col-span-2">
                    <div className="w-9 h-9 rounded-full bg-sandstone-wash flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-icon-18">pin_drop</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-body-sm text-on-surface-variant block uppercase font-bold">Office</span>
                      <span className="font-title-md text-title-lg text-on-surface font-medium">Taj Ganj, Agra 282001</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — inquiry form with backend persistence */}
              <div className="lg:col-span-7">
                <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-xl shadow-md border border-border-warm/40">
                  <h3 className="font-headline-sm text-headline-sm font-normal text-on-surface mb-1">Send a booking inquiry</h3>
                  <p className="font-body-sm text-label-md text-on-surface-variant mb-space-md">
                    Inquiries are saved directly to our dispatch desk. You'll receive a verified quote in under 5 minutes.
                  </p>

                  {inquirySubmitted ? (
                    <div className="p-4 sm:p-5 rounded-lg bg-sandstone-wash border border-border-warm text-center flex flex-col items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-success-jade text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-icon-22 text-white">check</span>
                      </div>
                      <h4 className="font-headline-sm text-sm sm:text-base text-ink-charcoal font-bold">
                        Inquiry Received &amp; Saved
                      </h4>
                      <p className="font-body-sm text-xs text-on-surface-variant max-w-md">
                        Thank you, {inquiryName}! Your request has been logged in our Taj Ganj dispatch inbox. Our concierge desk will contact you at {inquiryPhone} shortly.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <a
                          href={`https://wa.me/919762817598?text=${encodeURIComponent(`Hello Agra SK Baghel Tour and Travels, following up on my booking inquiry for ${origin} to ${destination} on ${inquiryDate}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#ffffff" }}
                          className="px-3.5 py-2 rounded-lg bg-black text-white font-label-caps text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                          <span className="text-white" style={{ color: "#ffffff" }}>Open in WhatsApp (Optional)</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setInquirySubmitted(false);
                            setInquiryNotes("");
                          }}
                          className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-xs font-bold transition-colors cursor-pointer"
                        >
                          Submit Another Inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-3">
                      {inquiryError && (
                        <div className="p-2.5 rounded-lg bg-error-container/20 border border-error text-error font-body-sm text-xs">
                          {inquiryError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="homepage-inquiry-name" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Full Name</label>
                          <input
                            id="homepage-inquiry-name"
                            type="text"
                            required
                            value={inquiryName}
                            onChange={(e) => setInquiryName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                          />
                        </div>
                        <div>
                          <label htmlFor="homepage-inquiry-phone" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Phone / WhatsApp</label>
                          <input
                            id="homepage-inquiry-phone"
                            type="tel"
                            required
                            value={inquiryPhone}
                            onChange={(e) => setInquiryPhone(e.target.value)}
                            placeholder="+91 97628 17598"
                            className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="homepage-inquiry-date" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Travel Date</label>
                        <input
                          id="homepage-inquiry-date"
                          type="date"
                          required
                          value={inquiryDate}
                          onChange={(e) => setInquiryDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="homepage-inquiry-notes" className="font-label-caps text-body-sm text-on-surface-variant uppercase font-semibold block mb-1">Itinerary & Pickup Details</label>
                        <textarea
                          id="homepage-inquiry-notes"
                          rows={3}
                          value={inquiryNotes}
                          onChange={(e) => setInquiryNotes(e.target.value)}
                          placeholder="Pick-up hotel, destination, monument preferences, or special requests..."
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-border-warm/50 text-on-surface focus:outline-none focus:border-primary text-xs resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={inquirySubmitting}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-title-md text-xs font-semibold transition-all shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-icon-16 text-white">
                          {inquirySubmitting ? "hourglass_top" : "send"}
                        </span>
                        <span className="text-white">
                          {inquirySubmitting ? "Saving to Dispatch Desk..." : "Send Booking Inquiry to Dispatch Desk"}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
