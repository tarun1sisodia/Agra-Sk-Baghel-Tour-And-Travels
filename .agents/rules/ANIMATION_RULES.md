# Animation Verification Rules — Agra SK Baghel Tour & Travels

> **Core Mandate:**
> **"Fast content + subtle motion + real HTML + excellent accessibility"**  
> *Rather than:* Lots of JavaScript + huge animations + content hidden inside effects.

This rule file is the **mandatory pre-implementation gate** before adding or modifying any animation across the website.

---

## 1. SEO & AI-SEO Safety Rules (Zero Crawler Obstruction)

- [ ] **1. Real HTML Text in Initial DOM:**
  - All critical headings (`<h1>`, `<h2>`, `<h3>`), paragraphs, fares, route names, vehicle specs, and contact details must exist as raw, semantic HTML in the initial server-rendered DOM.
  - Never render core SEO copy through JavaScript after page load.
  - Never place important text solely inside canvas, images, SVG text, or video.
- [ ] **2. No Content Hiding:**
  - Never set `display: none` or `visibility: hidden` on crawlable content for animation entry.
  - Never lock text behind opacity 0 without immediate raw HTML readability for search engine crawlers.
  - If using CSS fade-up, use GPU-friendly animations (`animation: fade-up ... forwards`) or progressive enhancement where raw HTML is fully legible without JS.
- [ ] **3. No Fake/Duplicate Text for Effects:**
  - Do not create duplicate headings or paragraphs in the DOM just to achieve split-text or rolling effects that could dilute keyword density or confuse screen readers (use `aria-hidden="true"` for decorative duplicates).

---

## 2. Performance & Payload Rules (Zero Bloat)

- [ ] **1. Vanilla Only (<3KB Budget):**
  - Zero heavy third-party animation libraries (no GSAP, Framer Motion, Three.js, Anime.js, or full Lottie).
  - All interactive motion must reside in the lightweight, modular `js/motion.js` engine (<3KB).
- [ ] **2. GPU Acceleration Only (Zero Reflows):**
  - Animate ONLY `transform` and `opacity`.
  - NEVER animate properties that trigger browser layout recalculation: `top`, `left`, `right`, `bottom`, `width`, `height`, `margin`, `padding`, or `font-size`.
  - Use `will-change: transform` sparingly on active scrolling elements only.
- [ ] **3. Viewport-Bounded Execution:**
  - All scroll-triggered effects must use `IntersectionObserver` to unobserve elements after entry or only calculate offsets for elements currently in viewport.
  - Scroll listeners must be `passive: true` and throttled via `window.requestAnimationFrame`.

---

## 3. Accessibility & Reduced-Motion Rules

- [ ] **1. Strict `prefers-reduced-motion` Compliance:**
  - Every animation, transition, floating shape, parallax transform, and particle effect MUST have an immediate zero-motion fallback:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transform: none !important;
      }
    }
    ```
  - In `js/motion.js`, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at initialization and bypass parallax / scrambler loops.
- [ ] **2. Focus States & Readability:**
  - Focus outlines must remain crisp and accessible (`:focus-visible` with 2px gold ring).
  - Animations must never obscure contrast ratios (all text must maintain WCAG 2.2 AA contrast: 4.5:1 for body, 3:1 for large text).

---

## 4. UI & Layout Integrity Rules

- [ ] **1. Form Fields & Placeholders:**
  - Never place floating labels inside input fields if placeholders exist.
  - Labels must remain static and top-aligned above inputs (`display: block; position: static !important;`).
- [ ] **2. Navigation & Critical Paths:**
  - Navigation links, booking buttons, Call buttons, and WhatsApp buttons must never depend on animation to become clickable.
  - `<noscript>` navigation must remain fully functional.
- [ ] **3. No Excessive Motion:**
  - Avoid animating every element independently.
  - Group card reveals into subtle, staggered entries (maximum 3–4 items staggered by 40–80ms).
  - Hover elevation should stay subtle (3px to 6px upward with soft shadow).

---

## 5. Pre-Commit Verification Gate

Before committing any animation change, run:

1. **Build Gate:** `python3 scripts/render_pages.py` (must succeed with 0 errors).
2. **Crawl Gate:** `python3 scripts/check_links.py` (must pass 102/102 URLs OK).
3. **HTML Inspection:** Verify `curl -s http://localhost:4173/` contains all real text in raw HTML.
4. **Reduced Motion Test:** Emulate `prefers-reduced-motion: reduce` and verify zero jitter or broken layouts.
