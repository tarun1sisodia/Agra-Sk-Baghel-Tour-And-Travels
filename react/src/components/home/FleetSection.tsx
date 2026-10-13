/**
 * @file FleetSection.tsx — Legacy fleet showcase component.
 * @note Main homepage renders the canonical interactive "Choose your vehicle" section inline.
 * This component is maintained for compatibility, consuming live fleet data from the canonical contract.
 */
import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../config";
import { fetchLiveFleet, type PublicFleetVehicle } from "../../services/catalog";

interface FleetSectionProps {
  language?: SupportedLanguage;
}

const FLEET_IMAGE_MAP: Record<string, string> = {
  sedan: "/assets/fleet/sedan.webp",
  ertiga: "/assets/fleet/ertiga.webp",
  innova: "/assets/fleet/innova.webp",
  "innova-crysta": "/assets/fleet/innova.webp",
  tempo: "/assets/fleet/tempo.webp",
  "tempo-traveller": "/assets/fleet/tempo.webp",
  urbania: "/assets/fleet/urbania.webp",
};

export function FleetSection({ language = "en" }: FleetSectionProps) {
  const [fleet, setFleet] = useState<PublicFleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLiveFleet()
      .then((data) => {
        if (!active) return;
        if (data && data.length > 0) {
          setFleet(data);
          setError(false);
        } else {
          setFleet([]);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const langPrefix = `/${language}`;
  const activeVehicles = fleet.filter((v) => v.active !== false);

  return (
    <section className="home-section fleet-section" aria-labelledby="fleet-heading">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fleet</p>
            <h2 id="fleet-heading">
              Choose your comfort.<br />
              <i>Bring your people.</i>
            </h2>
          </div>
          <a className="text-link" href={`${langPrefix}/fleet/`}>
            Full fleet ↗
          </a>
        </div>

        {loading ? (
          <div className="fleet-grid" aria-busy="true" aria-label="Loading fleet options">
            {Array.from({ length: 3 }).map((_, idx) => (
              <article key={idx} className="vehicle-card animate-pulse">
                <div className="vehicle-photo bg-surface-container-high h-[200px]" />
                <div className="vehicle-body p-4">
                  <div className="h-5 w-28 bg-surface-container-high rounded mb-2" />
                  <div className="h-4 w-20 bg-surface-container-low rounded mb-4" />
                  <div className="h-8 bg-surface-container-low rounded" />
                </div>
              </article>
            ))}
          </div>
        ) : activeVehicles.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-surface-container-lowest border border-border-warm/60">
            <p className="text-body-md text-on-surface-variant mb-3">
              Fleet availability and active dispatch tariffs are currently being refreshed.
            </p>
            <a className="vehicle-action-link inline-flex" href="https://wa.me/919762817598">
              <span>Connect on WhatsApp for immediate vehicle dispatch ↗</span>
            </a>
          </div>
        ) : (
          <div className="fleet-grid">
            {activeVehicles.map((v) => {
              const img = FLEET_IMAGE_MAP[v.tier] || FLEET_IMAGE_MAP[v.id] || "/assets/fleet/sedan.webp";
              const rateDisplay = v.perKm > 0 ? `₹${v.perKm}/km` : "On request";

              return (
                <article className="vehicle-card" key={v.id || v.tier}>
                  <div className="vehicle-photo">
                    <img
                      src={img}
                      alt={`${v.name} taxi in Agra`}
                      width="480"
                      height="300"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="vehicle-photo-tag">
                      <b>{v.name}</b>
                    </div>
                  </div>
                  <div className="vehicle-body">
                    <h3>{v.name}</h3>
                    <div className="vehicle-specs" aria-label="Vehicle features">
                      <span className="vehicle-spec-pill">{v.seats} Seats</span>
                      <span className="vehicle-spec-pill">{v.bags} Bags</span>
                    </div>
                    <div className="vehicle-cta">
                      <div className="vehicle-price">
                        <span className="vehicle-price-label">Outstation rate</span>
                        <span className="vehicle-price-val">{rateDisplay}</span>
                      </div>
                      <a className="vehicle-action-link" href={`${langPrefix}/book?vehicle=${encodeURIComponent(v.tier || v.id)}`}>
                        <span>Choose this car</span>
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
