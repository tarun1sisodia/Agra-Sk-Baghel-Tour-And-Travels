import { useState, useCallback } from "react";
import { cities, vehicles } from "../../data/catalogue";
import {
  findRoute,
  calcFare,
  formatInr,
  localTomorrow,
  localPackages,
  type LocalPackageKey,
  type CalcFareParams,
} from "../../fares";
import type { VehicleId } from "../../data";

type TripTab = "one-way" | "round" | "local";

const TAB_LABELS: Record<TripTab, string> = {
  "one-way": "One-Way",
  round: "Round-Trip",
  local: "Local Tour",
};

const LOCAL_PACKAGE_OPTIONS: { key: LocalPackageKey; shortLabel: string }[] = [
  { key: "8hr-80km", shortLabel: "8 hrs / 80 km" },
  { key: "12hr-120km", shortLabel: "12 hrs / 120 km" },
  { key: "airport-transfer", shortLabel: "Airport / Station" },
];

const VEHICLE_ICONS: Partial<Record<VehicleId, string>> = {
  sedan: "🚗",
  ertiga: "🚙",
  innova: "🛻",
  tempo: "🚐",
  urbania: "🚌",
};

export function HeroFareWidget() {
  const [tab, setTab] = useState<TripTab>("one-way");
  const [from, setFrom] = useState("agra");
  const [to, setTo] = useState("delhi");
  const [localKey, setLocalKey] = useState<LocalPackageKey>("8hr-80km");
  const [vehicleId, setVehicleId] = useState<VehicleId>("sedan");
  const [date, setDate] = useState(localTomorrow());
  const [passengers, setPassengers] = useState(2);

  // Derived live fare quote (pure, no side effects)
  const fareParams: CalcFareParams =
    tab === "local"
      ? { vehicleId, localPackageKey: localKey }
      : { from, to, vehicleId, tripType: tab === "round" ? "round" : "one-way" };

  const quote = calcFare(fareParams);

  // Build booking URL for the book.html funnel
  const buildBookingUrl = useCallback(() => {
    if (tab === "local") {
      return `/book.html?trip=local&pkg=${localKey}&vehicle=${vehicleId}&date=${date}&pax=${passengers}`;
    }
    return `/book.html?from=${from}&to=${to}&trip=${tab}&vehicle=${vehicleId}&date=${date}&pax=${passengers}`;
  }, [tab, from, to, localKey, vehicleId, date, passengers]);

  // Show appropriate fare summary card
  const showFare = quote !== null;
  const fareTotal = quote?.total ?? 0;
  const fareAdvance = quote?.advance ?? 0;
  const fareDuration = quote?.duration ?? "";
  const fareKm = quote?.km ?? null;

  return (
    <div className="hfw" role="search" aria-label="Quick fare calculator">
      {/* Tab bar */}
      <div className="hfw-tabs" role="tablist" aria-label="Trip type">
        {(Object.keys(TAB_LABELS) as TripTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            id={`hfw-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`hfw-panel-${t}`}
            className={`hfw-tab${tab === t ? " is-active" : ""}`}
            type="button"
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Input panel */}
      <div
        id={`hfw-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`hfw-tab-${tab}`}
        className="hfw-body"
      >
        {tab !== "local" ? (
          /* One-Way / Round-Trip inputs */
          <div className="hfw-row">
            <label className="hfw-field">
              <span className="hfw-label">From</span>
              <select
                id="hfw-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="Pickup city"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="hfw-swap"
              aria-label="Swap pickup and drop cities"
              onClick={() => { setFrom(to); setTo(from); }}
              title="Swap cities"
            >
              ⇆
            </button>

            <label className="hfw-field">
              <span className="hfw-label">To</span>
              <select
                id="hfw-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="Drop city"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="hfw-field hfw-field--date">
              <span className="hfw-label">Date</span>
              <input
                id="hfw-date"
                type="date"
                value={date}
                min={localTomorrow()}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Travel date"
              />
            </label>
          </div>
        ) : (
          /* Local Tour inputs */
          <div className="hfw-row">
            <label className="hfw-field hfw-field--wide">
              <span className="hfw-label">Package</span>
              <select
                id="hfw-local-pkg"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value as LocalPackageKey)}
                aria-label="Local tour package"
              >
                {LOCAL_PACKAGE_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.shortLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="hfw-field hfw-field--date">
              <span className="hfw-label">Date</span>
              <input
                id="hfw-local-date"
                type="date"
                value={date}
                min={localTomorrow()}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Tour date"
              />
            </label>
          </div>
        )}

        {/* Vehicle selector row */}
        <div className="hfw-vehicles" role="group" aria-label="Choose vehicle">
          {vehicles.slice(0, 4).map((v) => (
            <button
              key={v.id}
              type="button"
              className={`hfw-veh${vehicleId === v.id ? " is-active" : ""}`}
              aria-pressed={vehicleId === v.id}
              onClick={() => setVehicleId(v.id)}
              title={v.suitable}
            >
              <span className="hfw-veh-icon" aria-hidden="true">{VEHICLE_ICONS[v.id]}</span>
              <span className="hfw-veh-name">{v.name}</span>
              <span className="hfw-veh-seats">{v.seats}+1</span>
            </button>
          ))}
        </div>

        {/* Live fare summary strip */}
        {showFare && (
          <div className="hfw-quote" aria-live="polite" aria-atomic="true">
            <div className="hfw-quote-main">
              <span className="hfw-quote-total">{formatInr(fareTotal)}</span>
              {fareAdvance < fareTotal && (
                <span className="hfw-quote-advance">
                  Book now with {formatInr(fareAdvance)} advance
                </span>
              )}
            </div>
            <div className="hfw-quote-meta">
              {fareDuration && <span>{fareDuration}</span>}
              {fareKm && <span>{fareKm} km</span>}
              {tab === "round" && <span className="hfw-quote-badge">Round-Trip</span>}
            </div>
          </div>
        )}

        {/* CTA */}
        <a
          href={buildBookingUrl()}
          className="hfw-cta button button-primary"
          id="hfw-book-btn"
          aria-label={`Book ${TAB_LABELS[tab]} for ${showFare ? formatInr(fareTotal) : "calculated fare"}`}
        >
          {showFare ? `Book at ${formatInr(fareTotal)} ↗` : "Check fare & Book ↗"}
        </a>
      </div>
    </div>
  );
}
