import { useEffect, useState, useMemo } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";
import photoCredits from "../data/package-photo-credits.json";
import { mapTourPackage } from "../data/tourPackage";
import { PackagePhotoCredits } from "../components/catalog/PackagePhotoCredits";
import { type TourPackage, type TourPackageGalleryImage } from "../data";
import { WhatsAppIcon } from "../components/icons";
import { resolveCatalogMediaUrl } from "../services/catalog";
import { fetchLiveTourPackageBySlug } from "../services/catalogManifest";
import { GroupedVehicleSection } from "../components/fleet/GroupedVehicleSection";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema, buildTouristTripSchema, buildGraphSchema } from "../components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "../components/seo/SeoHead";

export type NormalizedTourPackage = TourPackage;

export interface TourPackageTemplateProps {
  language?: SupportedLanguage;
  pkg: unknown;
}

interface ItineraryItem {
  time: string;
  title: string;
  desc: string;
}

const TOUR_FAQS = [
  { q: "Where does this tour start?", a: "These itineraries start at an agreed hotel or railway-station pickup point in Agra. Delhi or another city’s pickup is a separate arrangement; mention it when enquiring." },
  { q: "Are tickets, guides, meals and hotels included?", a: "Not automatically. Read the inclusions and exclusions for this itinerary. Monument tickets, a licensed guide, meals, local shuttles and accommodation are separate unless specifically confirmed in the written quotation." },
  { q: "Can we change the order of visits?", a: "Yes, discuss your priorities, mobility needs and onward train time with the travel desk. The route is adjusted for traffic, opening hours and temple darshan windows. Taj Mahal sightseeing is closed on Fridays. No queue bypass, wildlife sighting or sunrise colour is guaranteed." },
  { q: "Do I need to pay to enquire?", a: "No. Send your travel date, number of passengers and preferred pickup point. An enquiry does not create a paid booking. The vehicle, availability, inclusions and quotation must be agreed before booking or payment." },
];


export function TourPackageTemplate({ language = "en", pkg }: TourPackageTemplateProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [livePackage, setLivePackage] = useState<TourPackage | null>(null);
  const baselinePackage = useMemo(() => mapTourPackage(pkg), [pkg]);
  const activePkg = livePackage?.slug === baselinePackage.slug ? livePackage : baselinePackage;

  useEffect(() => {
    const slug = baselinePackage.slug;
    if (!slug || typeof window === "undefined") return;
    let mounted = true;
    fetchLiveTourPackageBySlug(slug).then((fresh) => {
      if (mounted && fresh) setLivePackage(fresh);
    });
    return () => { mounted = false; };
  }, [baselinePackage.slug]);

  // Normalize package properties
  const packageName = activePkg.name || "Signature Heritage Tour";
  const packageKicker = activePkg.kicker || "Private sightseeing";
  const packageDuration = activePkg.duration || "Private sightseeing";
  const packageBlurb = activePkg.blurb || "A private sightseeing itinerary with an Agra pickup.";
  const packageSlug = activePkg.slug || activePkg.id || "tour-package";
  const packageSource = activePkg.source || "Agra";
  const packageDestination = activePkg.destination || packageName;

  // Resolve starting gross price and 28% token
  const grossPrice = activePkg.from ?? 0;
  const advanceAmount = Math.round(grossPrice * 0.28);
  const balanceAmount = grossPrice - advanceAmount;

  // Normalized gallery list
  const galleryItems = useMemo<TourPackageGalleryImage[]>(() => {
    if (activePkg.gallery && Array.isArray(activePkg.gallery) && activePkg.gallery.length > 0) {
      const items = activePkg.gallery.map((item: any) => typeof item === "string" ? { url: item, caption: "Tour View" } : item);
      return items;
    }
    if (activePkg.image) return [{ url: activePkg.image, caption: "Signature Tour View" }];
    return [];
  }, [activePkg]);

  const selectedPhoto = galleryItems[selectedImageIndex ?? 0] || galleryItems[0];
  const mainImg = resolveCatalogMediaUrl(selectedPhoto?.url || activePkg.image);
  const mainPhoto = photoCredits.find((photo) => photo.path === mainImg);
  const supportingPhotos = galleryItems.slice(1, 3);

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
    const placesList = activePkg.places && activePkg.places.length > 0 ? activePkg.places : [packageSource, packageDestination];
    return placesList.map((place: string, idx: number) => ({
      time: `Stop 0${idx + 1}`,
      title: place,
      desc: `Visit ${place} as part of your agreed private itinerary.`,
    }));
  }, [activePkg, packageSource, packageDestination]);

  const packageIncludes = activePkg.includes.length ? activePkg.includes : ["Confirm the vehicle and included services with the travel desk."];
  const packageExcludes = activePkg.excludes.length ? activePkg.excludes : ["Tickets, meals, guides and accommodation unless included in the written quotation."];

  const bookStep1Url = `/book.html?category=tour_package&product=${encodeURIComponent(packageSlug)}&from=${encodeURIComponent(packageSource)}&to=${encodeURIComponent(packageDestination)}`;
  const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    grossPrice > 0
      ? `Hello Agra SK Baghel Tour and Travels, I wish to reserve the tour package "${packageName}" (Starting ₹${grossPrice.toLocaleString("en-IN")}).`
      : `Hello Agra SK Baghel Tour and Travels, I am interested in the tour package "${packageName}". My date is ___ and group size is ___.`
  )}`;

  const canonicalUrl = `${CANONICAL_DOMAIN}/en/packages/${packageSlug}/`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Packages", url: "/en/packages/" },
    { name: packageName, url: canonicalUrl },
  ]);

  const faqSchema = buildFaqSchema(TOUR_FAQS.map((faq) => ({ question: faq.q, answer: faq.a })));

  const tripSchema = buildTouristTripSchema({
    name: packageName,
    description: packageBlurb,
    touristType: ["Private Sightseeing"],
    itinerary: timelineStops.map((stop) => ({
      name: stop.title,
      description: stop.desc,
    })),
    ...(grossPrice > 0 ? { offers: {
      price: grossPrice,
      priceCurrency: "INR",
      availability: "InStock" as const,
    } } : {}),
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
            <span>Agra travel desk · Enquiries welcome</span>
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
              Private AC vehicle · Agra pickup
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

          {/* Only display photographs actually provided for this itinerary. */}
          <div className={`grid grid-cols-1 md:grid-cols-12 gap-space-md mt-space-md ${supportingPhotos.length ? "" : "max-w-3xl w-full"}`}>
            <div className={`${supportingPhotos.length ? "md:col-span-8" : "md:col-span-12"} relative rounded-xl overflow-hidden h-72 sm:h-96 lg:h-[460px] bg-surface-container`}>
              <img className="w-full h-full object-cover" alt={selectedPhoto?.alt || packageName} src={mainImg}
                width={mainPhoto?.width || 640} height={mainPhoto?.height || 400} fetchPriority="high" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-ivory-surface">
                <p className="text-body-sm text-ivory-surface">{selectedPhoto?.caption || packageName}</p>
              </div>
            </div>
            {supportingPhotos.length > 0 && <div className="md:col-span-4 grid grid-cols-1 gap-space-md">
              {supportingPhotos.map((photo) => {
                const credit = photoCredits.find((entry) => entry.path === photo.url);
                return <div key={photo.url} className="relative rounded-xl overflow-hidden h-52 lg:h-full bg-surface-container">
                  <img className="w-full h-full object-cover" src={resolveCatalogMediaUrl(photo.url)} alt={photo.alt || packageName}
                    width={credit?.width || 500} height={credit?.height || 333} loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-charcoal/85 via-transparent to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-body-sm text-ivory-surface">{photo.caption}</p>
                </div>;
              })}
            </div>}
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
                    aria-label={`View photo ${idx + 1}: ${g.alt || packageName}`}
                    aria-pressed={isSelected}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${isSelected ? "border-primary ring-2 ring-primary/50 scale-102" : "border-border-warm opacity-80 hover:opacity-100"
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
                {galleryItems.length} Destination Photo{galleryItems.length > 1 ? "s" : ""}
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
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Your Private Tour</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {packageBlurb} Travel at your group’s pace, with time for sightseeing and breaks. Confirm any route changes before departure.
              </p>
              {activePkg.planningNote && <div className="p-3.5 rounded-lg bg-sandstone-wash border border-border-warm text-body-sm text-on-surface-variant">
                <h3 className="font-semibold text-on-surface mb-2">Before you travel</h3>
                <p>{activePkg.planningNote}</p>
              </div>}
              <div className="bg-surface-container rounded-xl p-space-md flex items-start gap-space-sm border border-border-warm/60">
                <span className="material-symbols-outlined text-gold-accent text-icon-24 shrink-0 mt-0.5">hotel_class</span>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">Plan around your group</span>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Agree your pickup point, sightseeing priorities and rest breaks in advance. Travel times and stop order depend on road conditions and opening hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Chapter 02: Inclusions & Exclusions */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">02.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Inclusions & Exclusions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {/* Included */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-success-jade">
                    <span className="material-symbols-outlined text-icon-22">check_circle</span>
                    <span className="font-title-md text-title-md font-semibold text-on-surface">Included in this itinerary</span>
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
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Visitor Guidelines</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">badge</span>
                  <span className="font-title-md text-on-surface font-semibold">Carry appropriate ID</span>
                  <p className="text-body-sm text-secondary">Check current ticketing and identification requirements for each attraction.</p>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">event_busy</span>
                  <span className="font-title-md text-on-surface font-semibold">Check opening times</span>
                  <p className="text-body-sm text-secondary">Check date-specific monument and temple hours. Taj Mahal sightseeing is closed on Fridays.</p>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low border border-border-warm/50 flex flex-col gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-icon-24">no_backpack</span>
                  <span className="font-title-md text-on-surface font-semibold">Bags and cameras</span>
                  <p className="text-body-sm text-secondary">Bag, camera and mobile restrictions vary by site. Check before leaving the car.</p>
                </div>
              </div>
            </div>

            {/* Chapter 04: Hour-by-Hour Timeline */}
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="text-terracotta-sandstone font-headline-sm text-headline-sm font-serif">04.</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-serif">Suggested Itinerary</h2>
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
                  Plan This Tour
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-hero text-headline-hero text-ink-charcoal font-serif font-semibold">
                    {grossPrice > 0 ? `₹${grossPrice.toLocaleString("en-IN")}` : "Make it your trip"}
                  </span>
                  {grossPrice > 0 && <span className="text-body-md text-on-surface-variant font-medium">Starting fare</span>}
                </div>
                {grossPrice > 0 ? (
                  <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-surface border border-border-warm/60 text-body-sm text-secondary">
                    <span className="material-symbols-outlined text-success-jade text-icon-20">verified</span>
                    <span>Pay only <strong>₹{advanceAmount.toLocaleString("en-IN")}</strong> now (28% advance token). Balance ₹{balanceAmount.toLocaleString("en-IN")} on drop.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-surface border border-border-warm/60 text-body-sm text-secondary">
                    <span className="material-symbols-outlined text-terracotta-sandstone text-icon-20">info</span>
                    <span>Tell us your travel date, group size and pickup point. We will confirm the itinerary, vehicle and inclusions before any booking or payment.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-space-sm">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-deep text-white py-3.5 rounded-lg text-label-lg font-semibold hover:bg-terracotta-sunlit transition-all shadow-md text-center"
                  href={grossPrice > 0 ? bookStep1Url : `/en/contact/?package=${encodeURIComponent(packageSlug)}`}
                >
                  <span className="material-symbols-outlined text-icon-20">calendar_month</span>
                  <span>{grossPrice > 0 ? "Reserve This Package" : "Enquire About This Tour"}</span>
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
                  <span>Written terms confirmed before booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18">check</span>
                  <span>Private air-conditioned chauffeur vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-jade text-icon-18">check</span>
                  <span>No compulsory shopping stops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GROUP-BASED VEHICLE SECTION */}
      {grossPrice > 0 && <section className="w-full bg-surface-container-low py-space-3xl border-t border-b border-border-warm/30">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <GroupedVehicleSection
            title={`Select Vehicle for ${packageName}`}
            subtitle="Transparent group-based package rates. Air-conditioned travel, parking receipts, and dedicated chauffeur custody included."
            category="tour_package"
            productCode={packageSlug}
            productName={packageName}
            originName={packageSource}
            destinationName={packageDestination}
            fares={activePkg.fleetPrices}
          />
        </div>
      </section>}

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
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pb-6">
        <PackagePhotoCredits urls={galleryItems.map((image) => image.url)} />
      </div>
    </div>
  );
}
