import { useEffect, useRef, useState, type ReactNode } from "react";
import { type VehicleId } from "../../data/catalogue";
import { STATIC_DESTINATIONS } from "../search/LocationCombobox";
import { localTomorrow } from "../../fares";
import { fetchPublishedLocalTransfers } from "../../services/catalogManifest";

const modes = [
  { id: "oneway", label: "One Way", icon: "car" },
  { id: "round", label: "Round Trip", icon: "swap" },
  { id: "local", label: "Local Tour", icon: "pin" },
] as const;
type BookingMode = (typeof modes)[number]["id"];

const fleetIds: VehicleId[] = ["sedan", "ertiga", "innova", "tempo", "urbania"];
const fleetLabels: Record<VehicleId, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  innova: "Crysta",
  tempo: "Tempo",
  urbania: "Urbania",
};

export interface PublishedLocalTour {
  id: string;
  code: string;
  name: string;
  durationText: string;
  covers?: string;
  description?: string;
  image: string;
  startingPrice: number | null;
}

type IconName = "car" | "swap" | "pin" | "calendar" | "sedan" | "van" | "bus" | "shield" | "rupee" | "clock" | "support" | "arrow";
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

function CityInput({ id, label, value, onChange, onFocus }: { id: string; label: string; value: string; onChange: (value: string) => void; onFocus: () => void }) {
  const [focused, setFocused] = useState(false);
  const suggestions = STATIC_DESTINATIONS.filter((item) => item.name.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 5);
  return (
    <div className="booking-reference__text-input-wrap">
      <SvgIcon name="pin" size={20} />
      <input
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => { setFocused(true); onFocus(); }}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder="Enter city or location"
        autoComplete="off"
      />
      {focused && value && suggestions.length > 0 && (
        <div className="booking-reference__suggestions" role="listbox" aria-label={`${label} suggestions`}>
          {suggestions.map((item) => (
            <button
              type="button"
              role="option"
              key={item.id}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(item.name);
                setFocused(false);
              }}
            >
              {item.name}
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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>("sedan");
  const [localTourCode, setLocalTourCode] = useState<string>("");
  const [publishedTours, setPublishedTours] = useState<PublishedLocalTour[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
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
    async function loadCanonicalTours() {
      setIsLoadingTours(true);
      try {
        const raw = await fetchPublishedLocalTransfers();
        if (!isMounted) return;
        const mapped: PublishedLocalTour[] = (raw || [])
          .filter((t: any) => t && t.status !== "draft" && t.isActive !== false)
          .map((t: any) => {
            const code = t.packageCode || t.code || t.slug || t.id;
            const starting = t.fleetPrices?.dzire ?? t.fleetPrices?.sedan ?? t.starting_price_inr ?? null;
            return {
              id: t.id,
              code: String(code),
              name: String(t.name || t.title || "Agra Local Sightseeing"),
              durationText: t.durationHours ? `${t.durationHours} Hours / ${t.includedKm ?? 80} KM` : (t.durationText || t.duration || "Day Tour"),
              covers: t.covers || t.note || "Agra Monuments & Local Heritage",
              description: t.description || "",
              image: t.image || t.image_url || "/assets/booking/agra-fort.webp",
              startingPrice: starting != null ? Number(starting) : null,
            };
          });
        setPublishedTours(mapped);
        if (mapped.length > 0) {
          setLocalTourCode(mapped[0].code);
        }
      } catch {
        if (isMounted) setPublishedTours([]);
      } finally {
        if (isMounted) setIsLoadingTours(false);
      }
    }
    loadCanonicalTours();
    return () => { isMounted = false; };
  }, []);

  const selectedTour = publishedTours.find((tour) => tour.code === localTourCode) ?? publishedTours[0];
  const thumbSrc = selectedTour?.image || "/assets/booking/agra-fort.webp";

  function validate(): boolean {
    const next: Record<string, string> = {};
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();
    if (mode !== "local") {
      if (!origin.trim()) next.origin = "Enter pickup location.";
      if (!destination.trim()) next.destination = "Enter destination.";
    } else {
      if (!selectedTour && publishedTours.length > 0) next.localTour = "Select a local tour.";
      if (publishedTours.length === 0 && !isLoadingTours) next.localTour = "No local tours published yet.";
    }
    if (!activePickupDate) next.pickupDate = mode === "local" ? "Select tour date." : "Select pickup date.";
    if (mode === "round" && (!activeReturnDate || activeReturnDate < activePickupDate)) {
      next.returnDate = "Return date must be on or after pickup date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function bookingHref(): string {
    const activePickupDate = pickupDate || localTomorrow();
    const activeReturnDate = returnDate || localTomorrow();
    if (mode === "local") {
      const tourCode = selectedTour?.code ?? localTourCode;
      return `/book.html?category=local_package&product=${encodeURIComponent(tourCode)}&car=${encodeURIComponent(selectedVehicle)}&date=${encodeURIComponent(activePickupDate)}`;
    }
    const trip = mode === "round" ? "round_trip" : "one_way";
    return `/book.html?category=outstation&from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&car=${encodeURIComponent(selectedVehicle)}&trip=${trip}&date=${encodeURIComponent(activePickupDate)}${mode === "round" ? `&return_date=${encodeURIComponent(activeReturnDate)}` : ""}`;
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
                {isLoadingTours ? (
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
                          {tour.name} {tour.startingPrice ? `(From ₹${tour.startingPrice})` : `(${tour.durationText})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="booking-reference__empty-notice">
                    <span>No scheduled tours published. Reach us for custom local trips.</span>
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
                      setReturnDate(event.target.value);
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

          <div className="booking-reference__bottom-row">
            <div className="booking-reference__field booking-reference__field--fleet">
              <label>Vehicle Model</label>
              <div className="booking-reference__vehicles" role="radiogroup" aria-label="Vehicle type">
                {fleetIds.map((id) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedVehicle === id}
                    className={`booking-reference__vehicle ${selectedVehicle === id ? "is-active" : ""}`}
                    key={id}
                    onClick={() => setSelectedVehicle(id)}
                  >
                    <SvgIcon
                      name={id === "urbania" ? "bus" : id === "tempo" || id === "innova" ? "van" : id === "sedan" ? "sedan" : "car"}
                      size={22}
                    />
                    <span>{fleetLabels[id]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-reference__action">
              <button
                type="button"
                className="booking-reference__search"
                onClick={() => {
                  if (!validate()) return;
                  window.location.href = bookingHref();
                }}
              >
                <span>Book Now</span>
                <SvgIcon name="arrow" size={18} />
              </button>
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
                    <em>{tour.startingPrice ? `From ₹${tour.startingPrice}` : tour.covers}</em>
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
