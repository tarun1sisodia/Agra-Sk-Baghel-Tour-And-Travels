/**
 * CoverflowCarousel — 3D Perspective Sightseeing & Packages Carousel (Phase R5.6)
 *
 * Displays the 6 curated tour packages in an interactive 3D coverflow showcase:
 * 1. Same Day Agra Taj Mahal Tour (₹3,499)
 * 2. Taj Mahal Sunrise Tour (₹12,999)
 * 3. Mathura & Vrindavan Darshan (₹4,200)
 * 4. Same Day Agra by Gatimaan Train (₹14,999)
 * 5. Agra Overnight Experience (₹7,800)
 * 6. Golden Triangle Tour (₹18,500)
 *
 * Left column: Active package kicker, title, blurb, monument pills, all-inclusive fare,
 * and WhatsApp + details CTAs.
 * Right column: 3D perspective stage with cover reflections, glass badges, arrow navigation,
 * and pagination indicator dots.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { packages, type Package } from "../../data/catalogue";
import { contact } from "../../data/contact";
import { formatInr } from "../../fares";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

export function CoverflowCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [stageWidth, setStageWidth] = useState(320);
  const stageRef = useRef<HTMLDivElement>(null);
  const total = packages.length;

  // Measure stage card width dynamically
  useEffect(() => {
    function updateWidth() {
      if (stageRef.current) {
        const measured = stageRef.current.offsetWidth;
        // Card width clamp between 240px and 360px based on container
        const cardW = Math.max(220, Math.min(360, measured * 0.55));
        setStageWidth(cardW);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth, { passive: true });
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  // Active tour package
  const activePackage: Package = packages[activeIndex] ?? packages[0];
  const waText = encodeURIComponent(
    `Hello, I would like to inquire about the ${activePackage.name} tour package (₹${formatInr(activePackage.from)}).`
  );
  const waUrl = `https://wa.me/${contact.whatsapp}?text=${waText}`;

  return (
    <section
      className="home-section section--navy section--coverflow"
      id="packages-coverflow-section"
      aria-labelledby="coverflow-heading"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="coverflow-split">
        {/* Left Column: Synchronized Package Details */}
        <div className="coverflow-details-column">
          <p className="eyebrow eyebrow-light">— {activePackage.kicker.toUpperCase()}</p>
          <h2 className="coverflow-detail-title" id="coverflow-heading">
            {activePackage.name}
          </h2>
          <p className="coverflow-detail-blurb">{activePackage.blurb}</p>

          {/* Places pills */}
          <div className="coverflow-places-pills" aria-label="Destinations covered">
            {activePackage.places.map((place: string) => (
              <span className="coverflow-pill" key={place}>
                {place}
              </span>
            ))}
          </div>

          {/* Fare display */}
          <div className="coverflow-fare-wrap">
            <span className="coverflow-fare-label">All-inclusive starting fare</span>
            <p className="coverflow-fare">₹{formatInr(activePackage.from)}</p>
          </div>

          {/* Action CTAs */}
          <div className="coverflow-actions">
            <a
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-title-md text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              style={{ color: "#ffffff" }}
              href={waUrl}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
              <span className="text-white" style={{ color: "#ffffff" }}>WhatsApp Inquiry</span>
            </a>
            <a
              className="button button-outline button-light"
              href={`/en/packages/${activePackage.slug}/`}
            >
              <span>Package details</span>
              <span aria-hidden="true"> ↗</span>
            </a>
            <a className="text-link text-link-light" href="/en/packages/">
              <span>All tour packages</span>
              <span aria-hidden="true"> ↗</span>
            </a>
          </div>
        </div>

        {/* Right Column: 3D Coverflow Stage */}
        <div className="coverflow-stage-column" ref={stageRef}>
          <div
            className="coverflow-container"
            role="region"
            aria-roledescription="carousel"
            aria-label="Sightseeing & tour packages 3D coverflow"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="coverflow-frame">
              <div className="coverflow-track">
                {packages.map((pkg, index) => {
                  // Calculate wrapped offset from active index: -2, -1, 0, 1, 2...
                  let offset = (index - activeIndex) % total;
                  if (offset > total / 2) offset -= total;
                  if (offset < -total / 2) offset += total;

                  const distance = Math.abs(offset);
                  const isCenter = distance < 0.35;
                  const pitch = stageWidth * 0.76;
                  const ramp = Math.pow(distance, 0.65);
                  const tilt = Math.min(48 * ramp, 76) * (offset === 0 ? 0 : offset > 0 ? 1 : -1);

                  // 3D Transform calculations
                  const translateX = offset * pitch;
                  const translateZ = -0.55 * stageWidth * ramp;
                  const rotateY = -tilt;
                  const opacity = Math.max(0.2, 1 - 0.22 * distance);
                  const zIndex = 100 - Math.round(distance * 10);

                  const cardStyle: React.CSSProperties = {
                    transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                    opacity: opacity,
                    zIndex: zIndex,
                  };

                  return (
                    <article
                      className={`coverflow-card ${isCenter ? "is-center" : ""}`}
                      key={pkg.id}
                      style={cardStyle}
                      onClick={() => setActiveIndex(index)}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${index + 1} of ${total}: ${pkg.name}`}
                      tabIndex={isCenter ? 0 : -1}
                    >
                      {/* Top floating pill badge */}
                      <div className="coverflow-card-badge">
                        <span className="coverflow-card-badge-kicker">
                          {pkg.kicker.toUpperCase()}
                        </span>
                        <span className="coverflow-card-badge-sep" aria-hidden="true">
                          •
                        </span>
                        <span className="coverflow-card-badge-fare">
                          ₹{formatInr(pkg.from)}
                        </span>
                      </div>

                      {/* Package cover image */}
                      <img
                        className="coverflow-card-img"
                        src={pkg.image}
                        alt={`${pkg.name} — ${pkg.places.slice(0, 3).join(" · ")}`}
                        loading={index === 0 ? "eager" : "lazy"}
                        draggable={false}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes("/assets/packages/taj-dawn.webp")) {
                            target.src = "/assets/packages/taj-dawn.webp";
                          }
                        }}
                      />

                      {/* Bottom glass reflection gradient */}
                      <div className="coverflow-card-glass">
                        <h3 className="coverflow-card-heading">{pkg.name}</h3>
                        <p className="coverflow-card-sub">
                          {pkg.places.slice(0, 4).join(" · ")}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Navigation Chevrons */}
            <button
              type="button"
              className="coverflow-nav coverflow-nav--prev"
              onClick={handlePrev}
              aria-label="Previous tour package"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="coverflow-nav coverflow-nav--next"
              onClick={handleNext}
              aria-label="Next tour package"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {/* Pagination Dots */}
            <div
              className="coverflow-pagination"
              role="tablist"
              aria-label="Tour package slide indicators"
            >
              {packages.map((pkg, idx) => (
                <button
                  type="button"
                  key={pkg.id}
                  className={`coverflow-dot ${idx === activeIndex ? "is-active" : ""}`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Go to tour package ${idx + 1}: ${pkg.name}`}
                  aria-selected={idx === activeIndex}
                  role="tab"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
