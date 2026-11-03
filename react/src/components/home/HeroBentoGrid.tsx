import { webpSrcSet, PACKAGE_CARD_SIZES } from "@/utils/packageImage";
import { useEffect, useRef, useState } from "react";

export interface DestinationSlide {
  caption: string;
  image: string;
  alt: string;
}

export const MAIN_CELL_SLIDES: readonly DestinationSlide[] = [
  {
    caption: "Taj Mahal · Dawn in Agra",
    image: "/assets/packages/taj-dawn.webp",
    alt: "Majestic Taj Mahal at sunrise in Agra"
  },
  {
    caption: "Agra Fort · Mughal Heritage",
    image: "/assets/packages/agra-fort.webp",
    alt: "Historic red sandstone Agra Fort"
  },
  {
    caption: "Fatehpur Sikri · Buland Darwaza",
    image: "/assets/destinations/fatehpur-sikri.webp",
    alt: "Buland Darwaza at Fatehpur Sikri near Agra"
  },
  {
    caption: "Amber Palace · Golden Triangle",
    image: "/assets/packages/golden-triangle.webp",
    alt: "Historic Amber Palace Fort in Jaipur"
  }
] as const;

export const SUB_TOP_SLIDES: readonly DestinationSlide[] = [
  {
    caption: "India Gate · New Delhi",
    image: "/assets/destinations/delhi-india-gate.webp",
    alt: "India Gate memorial boulevard in New Delhi"
  },
  {
    caption: "Hawa Mahal · Pink City Jaipur",
    image: "/assets/destinations/jaipur-hawa-mahal.webp",
    alt: "Intricate pink sandstone Hawa Mahal in Jaipur"
  },
  {
    caption: "Red Fort · Old Delhi",
    image: "/assets/destinations/delhi-red-fort.webp",
    alt: "Historic Red Fort Lal Qila in Old Delhi"
  },
  {
    caption: "Akshardham Temple · New Delhi",
    image: "/assets/images/akshardham.webp",
    alt: "Akshardham Temple architecture in New Delhi"
  }
] as const;

export const SUB_BOTTOM_SLIDES: readonly DestinationSlide[] = [
  {
    caption: "Mathura · Sacred Yamuna Ghats",
    image: "/assets/packages/mathura.webp",
    alt: "Sacred Ghats and Temples of Mathura and Vrindavan"
  },
  {
    caption: "Prem Mandir · Vrindavan",
    image: "/assets/destinations/vrindavan-prem-mandir.webp",
    alt: "Illuminated Prem Mandir temple in Vrindavan, Mathura"
  },
  {
    caption: "Manali & Solang · Himachal Hills",
    image: "/assets/destinations/himachal-manali.webp",
    alt: "Snow-capped peaks and Solang Valley in Manali, Himachal"
  },
  {
    caption: "The Ridge · Shimla Hills",
    image: "/assets/destinations/himachal-shimla.webp",
    alt: "The Ridge and Christ Church in Shimla, Himachal Pradesh"
  }
] as const;

interface HeroBentoGridProps {
  onMainLandmarkChange?: (caption: string) => void;
}

export function HeroBentoGrid({ onMainLandmarkChange }: HeroBentoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mainIdx, setMainIdx] = useState(0);
  const [subTopIdx, setSubTopIdx] = useState(0);
  const [subBottomIdx, setSubBottomIdx] = useState(0);

  // Notify parent of main landmark change
  useEffect(() => {
    onMainLandmarkChange?.(MAIN_CELL_SLIDES[mainIdx].caption);
  }, [mainIdx, onMainLandmarkChange]);

  useEffect(() => {
    // Honor accessibility preferences
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let isVisible = true;
    let isIntersecting = true;

    // IntersectionObserver to pause when hero is off-screen
    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
        },
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    // VisibilityChange to pause when tab is inactive
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const INTERVAL_TIME = 8000;
    const timers: number[] = [];

    // Helper to start staggered cycles
    const setupCycle = (
      initialDelay: number,
      setSlide: React.Dispatch<React.SetStateAction<number>>,
      slideCount: number
    ) => {
      const launch = window.setTimeout(() => {
        if (isVisible && isIntersecting) {
          setSlide((prev) => (prev + 1) % slideCount);
        }
        const loop = window.setInterval(() => {
          if (isVisible && isIntersecting) {
            setSlide((prev) => (prev + 1) % slideCount);
          }
        }, INTERVAL_TIME);
        timers.push(loop);
      }, initialDelay);
      timers.push(launch);
    };

    // Staggered offsets: 0s (Main), 2.6s (Sub-Top), 5.2s (Sub-Bottom)
    setupCycle(INTERVAL_TIME, setMainIdx, MAIN_CELL_SLIDES.length);
    setupCycle(2600, setSubTopIdx, SUB_TOP_SLIDES.length);
    setupCycle(5200, setSubBottomIdx, SUB_BOTTOM_SLIDES.length);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (observer && containerRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="hero-bento-grid"
      className="hero-bento-grid"
      aria-hidden="true"
    >
      {/* 1. Main Stage Tile (Iconic Agra & Heritage) */}
      <div className="bento-tile bento-tile--main">
        {MAIN_CELL_SLIDES.map((item, idx) => {
          const isActive = idx === mainIdx;
          return (
            <div
              key={item.image}
              className={`bento-slide ${isActive ? "is-active" : ""}`}
              data-caption={item.caption}
            >
              <img
                className="hero-media"
                src={item.image}
                alt={item.alt}
                width="1600"
                height="900"
                fetchPriority={idx === 0 ? "high" : "auto"}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
        <div className="bento-tile-tag">
          {MAIN_CELL_SLIDES[mainIdx].caption}
        </div>
      </div>

      {/* 2. Top Perspective Tile (Capital Marvels & Royal Pink City) */}
      <div className="bento-tile bento-tile--sub-top">
        {SUB_TOP_SLIDES.map((item, idx) => {
          const isActive = idx === subTopIdx;
          return (
            <div
              key={item.image}
              className={`bento-slide ${isActive ? "is-active" : ""}`}
              data-caption={item.caption}
            >
              <img
                className="hero-media"
                src={item.image}
                srcSet={webpSrcSet(item.image)}
                sizes={PACKAGE_CARD_SIZES}
                alt={item.alt}
                width="800"
                height="600"
                loading="lazy"
              />
            </div>
          );
        })}
        <div className="bento-tile-tag">
          {SUB_TOP_SLIDES[subTopIdx].caption}
        </div>
      </div>

      {/* 3. Bottom Perspective Tile (Sacred Ghats & Hill Escapes) */}
      <div className="bento-tile bento-tile--sub-bottom">
        {SUB_BOTTOM_SLIDES.map((item, idx) => {
          const isActive = idx === subBottomIdx;
          return (
            <div
              key={item.image}
              className={`bento-slide ${isActive ? "is-active" : ""}`}
              data-caption={item.caption}
            >
              <img
                className="hero-media"
                src={item.image}
                srcSet={webpSrcSet(item.image)}
                sizes={PACKAGE_CARD_SIZES}
                alt={item.alt}
                width="800"
                height="600"
                loading="lazy"
              />
            </div>
          );
        })}
        <div className="bento-tile-tag">
          {SUB_BOTTOM_SLIDES[subBottomIdx].caption}
        </div>
      </div>
    </div>
  );
}
