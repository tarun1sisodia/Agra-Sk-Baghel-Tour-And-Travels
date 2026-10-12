/**
 * PopularRoutes — Responsive 4-card grid of top outstation routes.
 *
 * Shows Agra→Delhi, Agra→Jaipur, Agra→Mathura, Agra→Gwalior with:
 * - Route graphic header (distance pill + duration badge)
 * - Starting price (sedan one-way)
 * - Key highlights (highway, toll policy)
 * - One-click Book link → /book.html query params
 * - Hover: subtle gold accent lift
 */

import { routes } from "../../data/catalogue";
import { formatInr } from "../../fares";

/** Curated route metadata for the 4 popular outstation routes */
const POPULAR_ROUTE_IDS = [
  "agra-delhi",
  "agra-jaipur",
  "agra-mathura",
  "agra-gwalior",
] as const;

type RouteId = (typeof POPULAR_ROUTE_IDS)[number];

const ROUTE_META: Record<
  RouteId,
  {
    emoji: string;
    highway: string;
    highlight: string;
    slug: string;
    tag: string;
  }
> = {
  "agra-delhi": {
    emoji: "🏛️",
    highway: "Yamuna Expressway",
    highlight: "Toll-inclusive one-way fare · IGI Airport transfers available",
    slug: "agra-to-delhi",
    tag: "Most Popular",
  },
  "agra-jaipur": {
    emoji: "🌸",
    highway: "NH-21 (Agra–Bikaner Highway)",
    highlight: "Fatehpur Sikri stopover en route · Rajasthan entry",
    slug: "agra-to-jaipur",
    tag: "Golden Triangle",
  },
  "agra-mathura": {
    emoji: "🪔",
    highway: "NH-19 Delhi–Agra Highway",
    highlight: "Temple aarti timings optimised · No night surcharge",
    slug: "agra-to-mathura",
    tag: "Pilgrimage",
  },
  "agra-gwalior": {
    emoji: "🏰",
    highway: "NH-44 (Agra–Gwalior Expressway)",
    highlight: "Gwalior Fort day-trip · MP tourism routes",
    slug: "agra-to-gwalior",
    tag: "Heritage",
  },
};

export function PopularRoutes() {
  const popularRoutes = POPULAR_ROUTE_IDS.map((id) => {
    const route = routes.find((r) => r.id === id);
    return route ? { route, meta: ROUTE_META[id] } : null;
  }).filter(Boolean) as { route: (typeof routes)[number]; meta: (typeof ROUTE_META)[RouteId] }[];

  return (
    <section
      className="home-section pop-routes-section"
      id="popular-routes"
      aria-labelledby="pop-routes-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Outstation Routes</p>
          <h2 id="pop-routes-heading">
            Popular routes
            <br />
            <i>from Agra.</i>
          </h2>
        </div>
        <a className="text-link" href="/en/routes/">
          All routes ↗
        </a>
      </div>

      <div className="pop-routes-grid">
        {popularRoutes.map(({ route, meta }) => {
          const fromName =
            route.from.charAt(0).toUpperCase() + route.from.slice(1);
          const toName =
            route.to.charAt(0).toUpperCase() + route.to.slice(1);
          const bookUrl = `/book.html?category=outstation&product=${route.id}&from=${route.from}&to=${route.to}&trip=one_way&car=sedan`;

          return (
            <article
              className="pop-route-card"
              key={route.id}
              aria-label={`${fromName} to ${toName} cab route`}
            >
              {/* Card header strip */}
              <div className="pop-route-header">
                <span className="pop-route-emoji" aria-hidden="true">
                  {meta.emoji}
                </span>
                <div className="pop-route-badges">
                  <span className="pop-route-badge pop-route-badge--tag">
                    {meta.tag}
                  </span>
                </div>
              </div>

              {/* Route name + distance row */}
              <div className="pop-route-name-row">
                <h3 className="pop-route-name">
                  {fromName}
                  <span className="pop-route-arrow" aria-hidden="true">→</span>
                  {toName}
                </h3>
              </div>

              {/* Distance + duration pills */}
              <div className="pop-route-pills">
                <span className="pop-route-pill">
                  <span aria-hidden="true">📍</span>
                  {route.km} km
                </span>
                <span className="pop-route-pill">
                  <span aria-hidden="true">⏱</span>
                  {route.duration}
                </span>
                <span className="pop-route-pill">
                  <span aria-hidden="true">🛣️</span>
                  {meta.highway}
                </span>
              </div>

              {/* Highlight text */}
              <p className="pop-route-highlight">{meta.highlight}</p>

              {/* Footer: price + CTA */}
              <div className="pop-route-footer">
                <div className="pop-route-price">
                  <span className="pop-route-from-label">Sedan from</span>
                  <strong className="pop-route-amount">
                    {formatInr(route.fares.sedan)}
                  </strong>
                </div>
                <a
                  href={bookUrl}
                  className="button button-primary pop-route-book"
                  id={`book-${route.id}`}
                  aria-label={`Book ${fromName} to ${toName} cab`}
                >
                  Book ↗
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
