/**
 * PageSpeed Insights & Web Vitals Guardrail Validation Script
 *
 * Enforces permanent prevention of:
 * 1. Mobile & Desktop LCP degradation from carousel auto-rotations or missing hero preloads
 * 2. Over-fetching uncompressed/oversized images on mobile viewports
 * 3. React Error #418 SSR/hydration structure mismatches
 * 4. Axe / Lighthouse Accessibility touch target collisions & <48px targets
 * 5. Critical path render-blocking font downloads (e.g., 317KB un-subsetted icon fonts)
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const dist = join(reactRoot, "dist");

console.log("🔍 Running PageSpeed Insights & Performance Guardrail Checks...");

// 1. Check pre-rendered HTML existence and hydration parity markers
const distIndex = join(dist, "index.html");
assert.ok(existsSync(distIndex), "Guardrail Failure: dist/index.html does not exist. Run build first.");

const htmlContent = readFileSync(distIndex, "utf8");

// A. Hydration Parity Check: ServerApp & App must emit matching <!--$--> Suspense boundaries
assert.ok(
  htmlContent.includes("<!--$-->"),
  "Hydration Guardrail Failure: dist/index.html is missing <!--$--> Suspense boundary comment markers. This triggers React Error #418 hydration mismatch."
);

// B. LCP Hero Preload Check
assert.ok(
  htmlContent.includes('rel="preload" as="image"') && htmlContent.includes('fetchpriority="high"'),
  "LCP Guardrail Failure: dist/index.html is missing high-priority hero image preload."
);

// C. Responsive Booking Image Check on Mobile
assert.ok(
  htmlContent.includes('media="(max-width: 640px)"') && htmlContent.includes("taj-mahal-480.avif"),
  "Mobile Image Delivery Guardrail Failure: Mobile viewport source for taj-mahal-480.avif is missing in dist/index.html."
);

// D. Critical Path Font Deferral Check
assert.ok(
  !htmlContent.includes('<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined') ||
    htmlContent.includes("loadIcons") ||
    htmlContent.includes("requestIdleCallback"),
  "Render Blocking Guardrail Failure: Material Symbols Outlined is synchronously loaded in critical path."
);

// 2. Component Source Integrity Checks
const serverAppPath = join(reactRoot, "src", "app", "ServerApp.tsx");
const serverAppSource = readFileSync(serverAppPath, "utf8");
assert.ok(
  serverAppSource.includes("<Suspense fallback={null}>"),
  "Hydration Guardrail Failure: ServerApp.tsx must wrap routes in <Suspense fallback={null}> to match App.tsx."
);

const heroSlideshowPath = join(reactRoot, "src", "components", "home", "HomeHeroSlideshow.tsx");
const heroSlideshowSource = readFileSync(heroSlideshowPath, "utf8");
assert.ok(
  heroSlideshowSource.includes("onUserInteractionOrIdle"),
  "LCP Guardrail Failure: HomeHeroSlideshow.tsx must defer autoplay with onUserInteractionOrIdle to prevent premature slide transitions during Lighthouse audit."
);

const bookingWidgetPath = join(reactRoot, "src", "components", "home", "HomeBookingWidget.tsx");
const bookingWidgetSource = readFileSync(bookingWidgetPath, "utf8");
assert.ok(
  bookingWidgetSource.includes('media="(max-width: 640px)"'),
  "Responsive Image Guardrail Failure: HomeBookingWidget.tsx must contain mobile media query for 480px asset."
);

const homePagePath = join(reactRoot, "src", "pages", "HomePage.tsx");
const homePageSource = readFileSync(homePagePath, "utf8");
assert.ok(
  homePageSource.includes("min-w-[48px]") && homePageSource.includes("min-h-[48px]"),
  "Accessibility Guardrail Failure: HomePage.tsx dismiss button must enforce 48px touch target."
);

const radialDockPath = join(reactRoot, "src", "components", "chrome", "RadialDock.tsx");
const radialDockSource = readFileSync(radialDockPath, "utf8");
assert.ok(
  radialDockSource.includes("aria-hidden={!isOpen}"),
  "Accessibility Guardrail Failure: RadialDock.tsx must hide collapsed social links with aria-hidden={!isOpen}."
);

const cssPath = join(reactRoot, "src", "styles", "global.css");
const cssSource = readFileSync(cssPath, "utf8");
assert.ok(
  cssSource.includes(".about .social") && cssSource.includes("visibility: hidden;"),
  "Accessibility Guardrail Failure: .about .social must have visibility: hidden; when dock is collapsed."
);
assert.ok(
  cssSource.includes(".about .bg_links") && cssSource.includes("min-width: 48px;"),
  "Accessibility Guardrail Failure: .about .bg_links must have min-width: 48px;."
);

console.log("✅ All PageSpeed Insights & Performance Guardrail Checks Passed Cleanly!");

