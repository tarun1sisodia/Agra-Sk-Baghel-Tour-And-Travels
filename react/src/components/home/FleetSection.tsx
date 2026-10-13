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

  useEffect(() => {
    let active = true;
    fetchLiveFleet()
      .then((data) => {
        if (active && data.length > 0) setFleet(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const langPrefix = `/${language}`;

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
        <div className="fleet-grid">
          {fleet
            .filter((v) => v.active !== false)
            .map((v) => {
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
      </div>
    </section>
  );
}
