import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { HOME_HERO_SLIDES } from "../../data/homeHeroSlides";
import { onUserInteractionOrIdle } from "../../utils/deferredRevalidation";

const AUTOPLAY_MS = 6000;
const HOLD_STEP_MS = 520;

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

export function HomeHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const isInViewportRef = useRef(true);
  const touchStartXRef = useRef<number | null>(null);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((previous) => wrapIndex(previous + direction, HOME_HERO_SLIDES.length));
  }, []);

  const stopHolding = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startHolding = useCallback(
    (direction: -1 | 1) => {
      stopHolding();
      move(direction);
      holdTimerRef.current = window.setInterval(() => move(direction), HOLD_STEP_MS);
    },
    [move, stopHolding]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let timer: number | null = null;
    // Defer autoplay start so the initial hero slide remains the stable LCP element
    const cleanup = onUserInteractionOrIdle(() => {
      timer = window.setInterval(() => {
        if (isVisibleRef.current && isInViewportRef.current && holdTimerRef.current === null) {
          move(1);
        }
      }, AUTOPLAY_MS);
    }, 12000);

    return () => {
      cleanup();
      if (timer !== null) window.clearInterval(timer);
    };
  }, [move, reducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewportRef.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    if (rootRef.current) observer.observe(rootRef.current);

    const onVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (document.hidden) stopHolding();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopHolding();
    };
  }, [stopHolding]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    stopHolding();
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX === null || endX === undefined) return;
    const delta = endX - startX;
    if (Math.abs(delta) >= 36) move(delta < 0 ? 1 : -1);
  };

  const slide = HOME_HERO_SLIDES[activeIndex] ?? HOME_HERO_SLIDES[0];

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-0"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured destinations in India"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerUp={stopHolding}
      onPointerCancel={stopHolding}
      onPointerLeave={stopHolding}
    >
      <picture className="absolute inset-0 block pointer-events-none" aria-hidden="true">
        <source
          type="image/avif"
          media="(max-width: 640px)"
          srcSet={`${slide.avif.small} 480w, ${slide.avif.medium} 960w`}
          sizes="100vw"
        />
        <source
          type="image/avif"
          srcSet={`${slide.avif.medium} 960w, ${slide.avif.desktop ? `${slide.avif.desktop} 1280w, ` : ""}${slide.avif.large} 1600w`}
          sizes="(max-width: 1366px) 1280px, 100vw"
        />
        <source
          type="image/webp"
          media="(max-width: 640px)"
          srcSet={`${slide.webp.small} 480w, ${slide.webp.medium} 960w`}
          sizes="100vw"
        />
        <source
          type="image/webp"
          srcSet={`${slide.webp.medium} 960w, ${slide.webp.desktop ? `${slide.webp.desktop} 1280w, ` : ""}${slide.webp.large} 1600w`}
          sizes="(max-width: 1366px) 1280px, 100vw"
        />
        <img
          src={slide.webp.large}
          alt={slide.alt || "Chauffeur taxi service and tour in Agra"}
          fetchPriority={activeIndex === 0 ? "high" : "auto"}
          decoding="async"
          width={1600}
          height={900}
          className="h-full w-full object-cover opacity-80 contrast-105 brightness-100 transition-opacity duration-700"
          style={{ objectPosition: slide.objectPosition ?? "center 35%" }}
        />
      </picture>

      {!reducedMotion && (
        <>
          <div
            className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-w-resize"
            role="button"
            tabIndex={-1}
            aria-label="Previous featured destination"
            onPointerDown={() => startHolding(-1)}
          />
          <div
            className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-e-resize"
            role="button"
            tabIndex={-1}
            aria-label="Next featured destination"
            onPointerDown={() => startHolding(1)}
          />
        </>
      )}

      <span className="sr-only" aria-live="polite">
        {slide.caption}
      </span>
    </div>
  );
}
