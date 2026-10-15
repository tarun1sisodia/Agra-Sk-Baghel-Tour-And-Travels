import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import { localTomorrow } from "../../fares";
import { fetchPublishedCatalog } from "../../services/cleanFareApi";
import type {
  PublishedCatalogResponse,
  PublishedProductSummary,
} from "../../contracts/fare-system.js";
import { contact } from "../../data/contact";

const modes = [
  { id: "oneway", label: "One Way", icon: "car" },
  { id: "round", label: "Round Trip", icon: "swap" },
  { id: "local", label: "Local Tour", icon: "pin" },
] as const;
import {
  BookingMode,
  CanonicalVehicleGroupCode,
  IconName,
  VehicleGroupOption,
  CANONICAL_VEHICLE_GROUPS,
  ActiveVehicleGroup,
  PublishedLocalTour,
  ParsedRoute,
  deriveActiveVehicleGroups,
  parseRouteCities,
  findMatchingOutstationRoute,
  buildCustomEnquiryHref,
  buildWhatsAppCustomEnquiryHref,
  buildBookingHref,
} from "./bookingWidgetHelpers";

export type {
  BookingMode,
  CanonicalVehicleGroupCode,
  IconName,
  VehicleGroupOption,
  ActiveVehicleGroup,
  PublishedLocalTour,
  ParsedRoute,
};
export {
  CANONICAL_VEHICLE_GROUPS,
  deriveActiveVehicleGroups,
  parseRouteCities,
  findMatchingOutstationRoute,
  buildCustomEnquiryHref,
  buildWhatsAppCustomEnquiryHref,
  buildBookingHref,
};

function SvgIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    car: <><path d="M4 15.5h16l-1.2-5.1a2 2 0 0 0-1.95-1.55H7.15A2 2 0 0 0 5.2 10.4L4 15.5Z" /><path d="M3 15.5v2.3M21 15.5v2.3M6.5 18v1M17.5 18v1M7 13h.01M17 13h.01" /></>,
    swap: <><path d="M5 7h13M15 4l3 3-3 3M19 17H6M9 14l-3 3 3 3" /></>,
    pin: <><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16" /></>,
    sedan: <><path d="M4 15.5h16l-1.2-5.1a2 2 0 0 0-1.95-1.55H7.15A2 2 0 0 0 5.2 10.4L4 15.5Z" /><path d="M3 15.5v2.3M21 15.5v2.3M7 13h.01M17 13h.01" /></>,
    van: <><path d="M3 16V8.5A1.5 1.5 0 0 1 4.5 7h11.8a2 2 0 0 1 1.7.95L21 12v4H3Z" /><path d="M7 10h2M12 10h2M4 16v2M20 16v2M7 18h.01M17 18h.01" /></>,
    bus: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M5 12h14M8 16h.01M16 16h.01M8 7h8" /></>,
    shield: <><path d="m12 3 7 3v5c0 4.4-2.95 7.8-7 10-4.05-2.2-7-5.6-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    rupee: <><path d="M7 5h10M7 9h8M8 5c5 0 6 2 6 4 0 3-3 4-7 4l6 6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    support: <><path d="M5 13v-2a7 7 0 0 1 14 0v2" /><path d="M5 13H3v4h3v-4M19 13h2v4h-3v-4M12 20h3" /></>,
    arrow: <><path d="M4 12h15M14 7l5 5-5 5" /></>,
  };
  return <svg className="booking-svg-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function CityInput({
  id,
  label,
  value,
  onChange,
  onFocus,
  suggestions,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  suggestions: string[];
}) {
  const [focused, setFocused] = useState(false);
  const normalizedValue = value.trim().toLowerCase();
  const filtered = suggestions
    .filter((item) => !normalizedValue || item.toLowerCase().includes(normalizedValue))
    .slice(0, 6);

  return (
    <div className="booking-reference__text-input-wrap">
      <SvgIcon name="pin" size={20} />
      <input
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocus();
        }}
        onBlur={() => setTimeout(() => setFocused(false), 250)}
        placeholder="Enter city or location"
        autoComplete="off"
      />
      {focused && filtered.length > 0 && (
        <div className="booking-reference__suggestions" role="listbox" aria-label={`${label} suggestions`}>
          {filtered.map((item) => (
            <button
              type="button"
              role="option"
              key={item}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(item);
                setFocused(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="home-booking-error" role="alert">{children}</p> : null;
}

export function HomeBookingWidget() {
  const [mode, setMode] = useState<BookingMode>("oneway");
  const [origin, setOrigin] = useState("Agra");
  const [destination, setDestination] = useState("Delhi");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<CanonicalVehicleGroupCode>("sedan");
  const [localTourCode, setLocalTourCode] = useState<string>("");
  const [catalog, setCatalog] = useState<PublishedCatalogResponse | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tomorrow = localTomorrow();
    setPickupDate(tomorrow);
    setReturnDate(tomorrow);
    setMinDate(tomorrow);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveCatalog() {
      setIsLoadingCatalog(true);
      setCatalogError(null);
      try {
        const data = await fetchPublishedCatalog();
        if (!isMounted) return;
        setCatalog(data);

        // Pre-select first local tour if available
        const localItems = (data.products || []).filter((p) => p.category === "local_package");
        if (localItems.length > 0) {
          setLocalTourCode(localItems[0].code);
        }
      } catch (err) {
        console.error("Failed to fetch published catalog for home booking widget:", err);
        if (isMounted) {
          setCatalog(null);
          setCatalogError(err instanceof Error ? err.message : "Failed to load live catalog");
        }
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    }
    loadLiveCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Outstation routes derived strictly from live catalog
  const outstationRoutes = useMemo<ParsedRoute[]>(() => {
    const prods = (catalog?.products || []).filter((p) => p.category === "outstation");
    return prods.map(parseRouteCities);
  }, [catalog]);

  // Derived suggestions strictly from active routes — never from static suggestions
  const publishedOrigins = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const r of outstationRoutes) {
      if (r.origin) set.add(r.origin);
    }
    return Array.from(set);
  }, [outstationRoutes]);

  const publishedDestinations = useMemo<string[]>(() => {
    const set = new Set<string>();
    const currentOrigin = origin.trim().toLowerCase();
    for (const r of outstationRoutes) {
      if (!currentOrigin || r.origin.toLowerCase() === currentOrigin) {
        if (r.destination) set.add(r.destination);
      }
    }
    if (set.size === 0) {
      for (const r of outstationRoutes) {
        if (r.destination) set.add(r.destination);
      }
    }
    return Array.from(set);
  }, [outstationRoutes, origin]);

  // Exact or smart matched outstation route
  const matchedRoute = useMemo<ParsedRoute | null>(() => {
    return findMatchingOutstationRoute(outstationRoutes, origin, destination);
  }, [outstationRoutes, origin, destination]);

  // Local sightseeing packages from live catalog
  const publishedTours = useMemo<PublishedLocalTour[]>(() => {
    const localItems = (catalog?.products || []).filter((p) => p.category === "local_package");
    return localItems.map((p) => {
      const durationText = p.duration_minutes
        ? `${Math.round(p.duration_minutes / 60)} Hours${p.distance_km ? ` / ${p.distance_km} KM` : ""}`
        : (p.distance_km ? `${p.distance_km} KM` : "Day Tour");
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        durationText,
        covers: p.description || "Agra Monuments & Local Heritage",
        description: p.description || "",
        image: p.image_url || "/assets/booking/agra-fort.webp",
        startingPrice: p.starting_price_inr,
      };
    });
  }, [catalog]);

  const selectedTour = publishedTours.find((tour) => tour.code === localTourCode) ?? publishedTours[0];
  const thumbSrc = selectedTour?.image || "/assets/booking/agra-fort.webp";

  // Vehicle groups strictly derived from live catalog groups with active models
  const vehicleGroups = useMemo<ActiveVehicleGroup[]>(() => {
    return deriveActiveVehicleGroups(catalog);
  }, [catalog]);

  useEffect(() => {
    if (vehicleGroups.length > 0 && !vehicleGroups.some((g) => g.code === selectedVehicle)) {
      setSelectedVehicle(vehicleGroups[0].code);
    }
  }, [vehicleGroups, selectedVehicle]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();

    if (isLoadingCatalog) {
      next.catalog = "Live catalog is loading. Please wait.";
      setErrors(next);
      return false;
    }

    if (catalogError || !catalog) {
      next.catalog = "Live inventory is currently unavailable. Please contact our 24/7 desk.";
      setErrors(next);
      return false;
    }

    if (vehicleGroups.length === 0) {
      next.vehicle = "No vehicle classes currently available.";
      setErrors(next);
      return false;
    }

    if (mode !== "local") {
      if (!origin.trim()) next.origin = "Enter pickup location.";
      if (!destination.trim()) next.destination = "Enter destination.";
      if (origin.trim() && destination.trim() && !matchedRoute) {
        next.route = `No direct published corridor between ${origin} and ${destination}.`;
      }
    } else {
      if (!selectedTour && publishedTours.length > 0) next.localTour = "Select a local tour.";
      if (publishedTours.length === 0) next.localTour = "No local tours published currently.";
    }

    if (!activePickupDate) next.pickupDate = mode === "local" ? "Select tour date." : "Select pickup date.";
    if (mode === "round" && (!activeReturnDate || activeReturnDate < activePickupDate)) {
      next.returnDate = "Return date must be on or after pickup date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function customEnquiryHref(): string {
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();
    return buildCustomEnquiryHref({
      origin,
      destination,
      mode,
      pickupDate: activePickupDate,
      returnDate: activeReturnDate,
      selectedVehicle,
    });
  }

  function whatsappCustomEnquiryHref(): string {
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();
    return buildWhatsAppCustomEnquiryHref({
      origin,
      destination,
      mode,
      pickupDate: activePickupDate,
      returnDate: activeReturnDate,
      selectedVehicle,
      whatsappNumber: contact.whatsapp,
    });
  }

  function bookingHref(): string {
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();
    return buildBookingHref({
      mode,
      origin,
      destination,
      matchedRoute,
      localTourCode: selectedTour?.code ?? localTourCode,
      selectedVehicle,
      pickupDate: activePickupDate,
      returnDate: activeReturnDate,
    });
  }

  return (
    <div id="home-booking-widget" className={`booking-reference booking-reference--${mode}`}>
      <picture>
        <source
          type="image/avif"
          srcSet="/assets/booking/taj-mahal-480.avif 480w, /assets/booking/taj-mahal-768.avif 768w"
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 384px"
        />
        <img
          className="booking-reference__hero"
          src="/assets/booking/taj-mahal-480.webp"
          srcSet="/assets/booking/taj-mahal-480.webp 480w, /assets/booking/taj-mahal-768.webp 768w, /assets/booking/taj-mahal.webp 1200w"
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 384px"
          width={384}
          height={256}
          loading="lazy"
          decoding="async"
          alt="Taj Mahal in Agra"
        />
      </picture>
      <div className="booking-reference__veil" aria-hidden="true" />
      <div className="booking-reference__content">
        <div className="booking-reference__tabs" role="tablist" aria-label="Booking type">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={`booking-reference__tab ${mode === item.id ? "is-active" : ""}`}
              onClick={() => { setMode(item.id); setErrors({}); }}
            >
              <SvgIcon name={item.icon as IconName} size={15} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="booking-reference__controls">
          <div className="booking-reference__fields-row">
            {mode === "local" ? (
              <div className="booking-reference__field booking-reference__field--tour">
                <label htmlFor="home-local-tour">Select Local Tour</label>
                {isLoadingCatalog ? (
                  <div className="booking-reference__select booking-reference__select--with-icon">
                    <span className="booking-reference__thumb skeleton-loader" />
                    <span style={{ fontSize: "13px", color: "#746b63" }}>Loading published tours…</span>
                  </div>
                ) : publishedTours.length > 0 ? (
                  <div className="booking-reference__select booking-reference__select--with-icon">
                    <span className="booking-reference__thumb">
                      <img src={thumbSrc} alt="" width={44} height={44} loading="lazy" decoding="async" />
                    </span>
                    <select
                      id="home-local-tour"
                      value={selectedTour?.code ?? localTourCode}
                      onChange={(event) => {
                        setLocalTourCode(event.target.value);
                        setErrors({});
                      }}
                    >
                      {publishedTours.map((tour) => (
                        <option key={tour.code} value={tour.code}>
                          {tour.name} {tour.startingPrice ? `(From ₹${tour.startingPrice.toLocaleString("en-IN")})` : `(${tour.durationText})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="booking-reference__empty-notice">
                    <span>No local sightseeing packages published currently. Reach us for custom day tours.</span>
                  </div>
                )}
                <FieldError>{errors.localTour}</FieldError>
              </div>
            ) : (
              <>
                <div className="booking-reference__field booking-reference__field--origin">
                  <label htmlFor="home-origin">From</label>
                  <CityInput
                    id="home-origin"
                    label="Pickup origin city"
                    value={origin}
                    onChange={setOrigin}
                    onFocus={() => setErrors({})}
                    suggestions={publishedOrigins}
                  />
                  <FieldError>{errors.origin}</FieldError>
                </div>
                <div className="booking-reference__field booking-reference__field--destination">
                  <label htmlFor="home-destination">To</label>
                  <CityInput
                    id="home-destination"
                    label="Destination city"
                    value={destination}
                    onChange={setDestination}
                    onFocus={() => setErrors({})}
                    suggestions={publishedDestinations}
                  />
                  <FieldError>{errors.destination}</FieldError>
                </div>
              </>
            )}

            <div className="booking-reference__field booking-reference__field--date">
              <label htmlFor="home-pickup-date">{mode === "local" ? "Tour Date" : "Pickup Date"}</label>
              <div
                className="booking-reference__date-control"
                onClick={() => {
                  try { pickupInputRef.current?.showPicker(); } catch { pickupInputRef.current?.focus(); }
                }}
              >
                <SvgIcon name="calendar" size={18} />
                <input
                  ref={pickupInputRef}
                  id="home-pickup-date"
                  type="date"
                  aria-label={mode === "local" ? "Tour Date" : "Pickup Date"}
                  value={pickupDate}
                  min={minDate || undefined}
                  onChange={(event) => {
                    const val = event.target.value;
                    setPickupDate(val);
                    if (returnDate && returnDate < val) setReturnDate(val);
                    setErrors((prev) => {
                      const c = { ...prev };
                      delete c.pickupDate;
                      return c;
                    });
                  }}
                />
              </div>
              <FieldError>{errors.pickupDate}</FieldError>
            </div>

            {mode === "round" && (
              <div className="booking-reference__field booking-reference__field--return">
                <label htmlFor="home-return-date">Return Date</label>
                <div
                  className="booking-reference__date-control"
                  onClick={() => {
                    try { returnInputRef.current?.showPicker(); } catch { returnInputRef.current?.focus(); }
                  }}
                >
                  <SvgIcon name="calendar" size={18} />
                  <input
                    ref={returnInputRef}
                    id="home-return-date"
                    type="date"
                    aria-label="Return Date"
                    value={returnDate}
                    min={pickupDate || minDate || undefined}
                    onChange={(event) => {
                      const val = event.target.value;
                      setReturnDate(val);
                      setErrors((prev) => {
                        const c = { ...prev };
                        delete c.returnDate;
                        return c;
                      });
                    }}
                  />
                </div>
                <FieldError>{errors.returnDate}</FieldError>
              </div>
            )}
          </div>

          {mode !== "local" && (
            <div className="booking-reference__route-info" style={{ minHeight: "18px", marginTop: "-4px" }}>
              {isLoadingCatalog ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#746b63", fontSize: "11px", fontWeight: 500 }}>
                  <span className="booking-reference__thumb skeleton-loader" style={{ width: "12px", height: "12px" }} />
                  <span>Connecting to live fleet and routes…</span>
                </div>
              ) : catalogError ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#c84a20", fontSize: "11px", fontWeight: 600 }}>
                  <SvgIcon name="shield" size={14} />
                  <span>Live fleet catalog unavailable. Please call dispatch directly or try again later.</span>
                </div>
              ) : matchedRoute ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#a63e14", fontSize: "11px", fontWeight: 600 }}>
                  <SvgIcon name="car" size={14} />
                  <span>
                    Direct Route • {matchedRoute.distanceKm ? `${matchedRoute.distanceKm} km • ` : ""}
                    {matchedRoute.startingPrice ? `From ₹${matchedRoute.startingPrice.toLocaleString("en-IN")}` : "Available for instant booking"}
                  </span>
                </div>
              ) : origin.trim() && destination.trim() ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#746b63", fontSize: "11px", fontWeight: 500 }}>
                  <SvgIcon name="pin" size={14} />
                  <span>
                    No direct route for {origin} → {destination}. Custom charter enquiry available:{" "}
                    <a
                      href={whatsappCustomEnquiryHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#a63e14", fontWeight: 600, textDecoration: "underline" }}
                    >
                      WhatsApp Quote
                    </a>
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <FieldError>{errors.route || errors.catalog || errors.vehicle}</FieldError>

          <div className="booking-reference__bottom-row">
            <div className="booking-reference__field booking-reference__field--fleet">
              <label>Vehicle Class</label>
              {isLoadingCatalog ? (
                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#746b63" }}>
                  <span>Loading available fleet…</span>
                </div>
              ) : catalogError ? (
                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#c84a20" }}>
                  <span>Fleet currently unavailable</span>
                </div>
              ) : vehicleGroups.length === 0 ? (
                <div style={{ padding: "8px 12px", fontSize: "12px", color: "#746b63" }}>
                  <span>No vehicle classes currently available</span>
                </div>
              ) : (
                <div
                  className="booking-reference__vehicles"
                  role="radiogroup"
                  aria-label="Vehicle type"
                  style={{ gridTemplateColumns: `repeat(${vehicleGroups.length}, minmax(0, 1fr))` }}
                >
                  {vehicleGroups.map((g) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedVehicle === g.code}
                      className={`booking-reference__vehicle ${selectedVehicle === g.code ? "is-active" : ""}`}
                      key={g.code}
                      onClick={() => setSelectedVehicle(g.code)}
                    >
                      <SvgIcon name={g.icon} size={22} />
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="booking-reference__action">
              {isLoadingCatalog ? (
                <button
                  type="button"
                  className="booking-reference__search"
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                >
                  <span>Loading Fleet…</span>
                </button>
              ) : catalogError ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="booking-reference__search"
                  style={{ textDecoration: "none", backgroundColor: "#8a2b0e" }}
                >
                  <span>Call 24/7 Desk</span>
                  <SvgIcon name="support" size={18} />
                </a>
              ) : mode !== "local" && origin.trim() && destination.trim() && !matchedRoute ? (
                <a
                  href={customEnquiryHref()}
                  className="booking-reference__search"
                  style={{ textDecoration: "none", backgroundColor: "#181d27" }}
                >
                  <span>Enquire Custom Route</span>
                  <SvgIcon name="arrow" size={18} />
                </a>
              ) : mode === "local" && publishedTours.length === 0 ? (
                <a
                  href={`/contact.html?serviceType=local-tour&date=${encodeURIComponent(pickupDate || localTomorrow())}`}
                  className="booking-reference__search"
                  style={{ textDecoration: "none", backgroundColor: "#181d27" }}
                >
                  <span>Enquire Day Tour</span>
                  <SvgIcon name="arrow" size={18} />
                </a>
              ) : (
                <button
                  type="button"
                  className="booking-reference__search"
                  disabled={vehicleGroups.length === 0}
                  onClick={() => {
                    if (!validate()) return;
                    window.location.href = bookingHref();
                  }}
                >
                  <span>Book Now</span>
                  <SvgIcon name="arrow" size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {mode === "local" && publishedTours.length > 0 && (
          <div className="booking-reference__tour-cards" aria-label="Available local sightseeing packages">
            {publishedTours.slice(0, 4).map((tour) => {
              const isCardActive = (selectedTour?.code === tour.code) || (localTourCode === tour.code);
              return (
                <button
                  type="button"
                  key={tour.code}
                  className={`booking-reference__tour-card ${isCardActive ? "is-active" : ""}`}
                  onClick={() => {
                    setLocalTourCode(tour.code);
                    setErrors({});
                  }}
                >
                  <img src={tour.image} alt="" width={56} height={56} loading="lazy" decoding="async" />
                  <span>
                    <strong>{tour.name}</strong>
                    <small>{tour.durationText}</small>
                    <em>{tour.startingPrice ? `From ₹${tour.startingPrice.toLocaleString("en-IN")}` : tour.covers}</em>
                  </span>
                  <i aria-hidden="true">{isCardActive ? "●" : "○"}</i>
                </button>
              );
            })}
          </div>
        )}

        <div className="booking-reference__trust">
          <span><SvgIcon name="shield" size={15} /> Verified Drivers</span>
          <span><SvgIcon name="rupee" size={15} /> Transparent Pricing</span>
          <span><SvgIcon name="clock" size={15} /> On-Time Pickup</span>
          <span><SvgIcon name="support" size={15} /> 24/7 Support</span>
        </div>
      </div>
    </div>
  );
}
