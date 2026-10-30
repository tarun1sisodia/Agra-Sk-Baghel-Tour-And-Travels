/**
 * Static HTML Pre-Renderer / SSG Build Script (Step R5.26)
 *
 * Pre-renders all bilingual URLs into fully-formed static HTML files.
 * Ensures primary copy, navigation, schema, and fares are 100% crawlable
 * by search engines and viewable without client-side JavaScript.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { generateSitemapAndRobots, isSitemapSafeSlug, HINDI_INDEXING_ENABLED, CANONICAL_DOMAIN } from "./generate-sitemap.ts";
import { assertBuildSafeSeo, inspectSeoHtml } from "./seo-content-guardrails.ts";
import { SEO_LANDING_SLUGS } from "../src/data/seoLandingSlugs.ts";
import { FLEETS } from "../src/data/fleets.ts";
import { HOME_HERO_SLIDES } from "../src/data/homeHeroSlides.ts";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");
const dist = join(reactRoot, "dist");

// HTML attribute escaping helper
function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Critical above-the-fold CSS for 100/100 PageSpeed with 0ms render-blocking duration and 0 CLS
const CRITICAL_CSS = `
:root {
  --color-primary: #9f3c16;
  --color-primary-container: #bf542c;
  --color-primary-fixed: #ffdbcf;
  --color-on-primary: #ffffff;
  --color-white: #ffffff;
  --color-terracotta-sandstone: #C85A32;
  --color-terracotta-sunlit: #D97746;
  --color-terracotta-deep: #B4502A;
  --color-gold-accent: #D99A3E;
  --color-gold-bronze: #8C5E14;
  --color-ink: #171310;
  --color-ink-midnight: #0F131A;
  --color-ink-charcoal: #181D27;
  --color-surface: #fdf8f5;
  --color-ivory-surface: #FDF8F5;
  --color-sandstone-wash: #F5EBE1;
  --color-border-warm: #E9DFD5;
  --color-surface-container-low: #f8f3f0;
  --color-surface-container: #f2edea;
  --color-background: #fdf8f5;
  --color-foreground: #1c1b1a;
  --color-on-surface: #1c1b1a;
  --color-on-surface-variant: #57423b;
  --font-headline-hero: "EB Garamond", serif;
  --font-headline-lg: "EB Garamond", serif;
  --font-body-md: "Plus Jakarta Sans", sans-serif;
  --font-body-lg: "Plus Jakarta Sans", sans-serif;
  --font-ui: "Plus Jakarta Sans", sans-serif;
  --bg: #fdf8f5;
  --surface: #ffffff;
  --text: #1c1b1a;
  --gold: #e5a044;
  --radius: 6px;
  --radius-card: 10px;
}
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html {
  -webkit-text-size-adjust: 100%;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  scrollbar-gutter: stable;
  scroll-behavior: auto;
  overflow-y: scroll;
}
body {
  margin: 0;
  min-width: 320px;
  background-color: #fdf8f5;
  color: #1c1b1a;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}
a { color: inherit; text-decoration: none; }
img, picture, svg { display: block; max-width: 100%; }
button, input, select { font-family: inherit; font-size: inherit; }
.skip-link {
  position: fixed; left: 20px; top: 14px; z-index: 3000; transform: translateY(-200%);
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;
  background: #e5a044; color: #0a0a0a; font-weight: 600; font-size: 13.5px;
  border-radius: 6px; text-decoration: none; transition: transform 180ms ease;
}
.skip-link:focus, .skip-link:focus-visible { transform: translateY(0); outline: 2px solid #f3c36c; outline-offset: 3px; }
.skip-link-icon { font-size: 14px; font-weight: 700; line-height: 1; }
.app-shell { min-height: 100vh; }
#site-header {
  position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 64px; z-index: 50;
  background: rgba(253, 248, 245, 0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(233, 223, 213, 0.3); box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03);
}
#site-header .h-16 {
  height: 64px; max-width: 80rem; margin: 0 auto; padding: 0 0.75rem;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
}
@media (min-width: 640px) { #site-header .h-16 { padding: 0 1.5rem; } }
@media (min-width: 1024px) { #site-header .h-16 { padding: 0 2rem; } }
#site-header img { height: 40px; width: auto; max-width: min(58vw, 250px); object-fit: contain; }
@media (min-width: 640px) { #site-header img { height: 44px; } }
.pt-16 { padding-top: 4rem; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.hidden { display: none; }
@media (min-width: 640px) { .sm\\:inline-flex { display: inline-flex; } .sm\\:flex { display: flex; } .sm\\:hidden { display: none; } }
@media (min-width: 1024px) { .lg\\:inline-flex { display: inline-flex; } .lg\\:flex { display: flex; } }
@media (min-width: 1280px) { .xl\\:inline-flex { display: inline-flex; } .xl\\:flex { display: flex; } .xl\\:hidden { display: none; } }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.shrink-0 { flex-shrink: 0; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.inset-0 { inset: 0; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.max-w-4xl { max-width: 56rem; }
.max-w-5xl { max-width: 64rem; }
.max-w-6xl { max-width: 72rem; }
.max-w-7xl { max-width: 80rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
.pt-24 { padding-top: 6rem; }
.pb-20 { padding-bottom: 5rem; }
@media (min-width: 640px) { .sm\\:pt-32 { padding-top: 8rem; } .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; } .sm\\:p-5 { padding: 1.25rem; } }
@media (min-width: 1024px) { .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; } }
.gap-1\\.5 { gap: 0.375rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-5 { gap: 1.25rem; }
.overflow-hidden { overflow: hidden; }
.pointer-events-none { pointer-events: none; }
.select-none { user-select: none; }
.text-center { text-align: center; }
.rounded-full { border-radius: 9999px; }
.rounded-md { border-radius: 0.375rem; }
.rounded-3xl { border-radius: 1.5rem; }
.border { border: 1px solid currentColor; }
.shadow-xs { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.min-h-screen { min-height: 100vh; }
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-50 { z-index: 50; }
.bg-ink-midnight { background-color: #0F131A; }
.text-on-primary, .text-white { color: #ffffff; }
section.min-h-\\[520px\\], .min-h-\\[520px\\] { min-height: 520px; }
@media (min-width: 1024px) { section.lg\\:min-h-\\[580px\\], .lg\\:min-h-\\[580px\\] { min-height: 580px; } }
.object-cover { object-fit: cover; }
.opacity-80 { opacity: 0.8; }
.contrast-105 { filter: contrast(1.05); }
.brightness-100 { filter: brightness(1); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.font-headline-hero { font-family: "EB Garamond", Georgia, serif; }
.text-headline-hero { font-size: clamp(2.25rem, 5vw, 4.25rem); line-height: 1.12; }
.text-ivory-surface { color: #FDF8F5; }
.font-body-lg { font-family: "Plus Jakarta Sans", sans-serif; font-size: 1.125rem; }
.font-body-md { font-family: "Plus Jakarta Sans", sans-serif; font-size: 1rem; }
.leading-relaxed { line-height: 1.625; }
.bg-primary { background-color: #9f3c16; }
.bg-black\\/80 { background-color: rgba(0, 0, 0, 0.8); }
.text-primary { color: #9f3c16; }
.min-h-\\[48px\\] { min-height: 48px; }
.min-w-\\[48px\\] { min-width: 48px; }
.min-w-\\[44px\\] { min-width: 44px; }
.min-h-\\[44px\\] { min-height: 44px; }
.glass-card-frosted { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 20px 50px rgba(15, 19, 26, 0.12); }
.-mt-12 { margin-top: -3rem; }
@media (min-width: 640px) { .sm\\:-mt-16 { margin-top: -4rem; } }
.booking-reference { position: relative; border-radius: 20px; background: #ffffff; overflow: hidden; }
.booking-reference__hero { position: absolute; inset: 0 0 0 auto; z-index: -2; width: 31%; height: 100%; object-fit: cover; object-position: center; }
.booking-reference__veil { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, #fff 0%, #fff 59%, rgba(255,255,255,.94) 70%, rgba(255,255,255,.16) 100%); }
.booking-reference__content { position: relative; z-index: 1; width: 100%; padding: 22px 27px 0; }
.booking-reference__tabs { display: inline-flex; gap: 0; padding: 4px; border-radius: 9999px; background: rgba(241, 238, 235, 0.85); backdrop-filter: blur(8px); }
.booking-reference__tab { display: inline-flex; min-width: 125px; height: 42px; align-items: center; justify-content: center; gap: 8px; padding: 0 18px; border-radius: 9999px; color: #574d47; font: 700 12px/1 'Plus Jakarta Sans', sans-serif; cursor: pointer; border: 0; background: transparent; }
.booking-reference__tab.is-active { color: #fff; background: #ac3d12; box-shadow: 0 4px 10px rgba(172,61,18,.2); }
.booking-reference__controls { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
.booking-reference__fields-row { display: grid; gap: 12px; width: 100%; align-items: start; }
.booking-reference--oneway .booking-reference__fields-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.booking-reference--round .booking-reference__fields-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.booking-reference--local .booking-reference__fields-row { grid-template-columns: 2fr 1fr; }
@media (max-width: 768px) {
  .booking-reference__fields-row, .booking-reference--oneway .booking-reference__fields-row, .booking-reference--round .booking-reference__fields-row, .booking-reference--local .booking-reference__fields-row { grid-template-columns: 1fr; }
  .booking-reference__hero { display: none; }
  .booking-reference__veil { background: #ffffff; }
}
.booking-reference__field { min-width: 0; display: flex; flex-direction: column; }
.booking-reference__field > label { display: block; margin: 0 0 7px 2px; color: #665c55; font: 700 10px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .07em; text-transform: uppercase; }
.booking-reference__text-input-wrap, .booking-reference__date-control { position: relative; display: flex; width: 100%; height: 52px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #e2ddd8; border-radius: 12px; background: #fff; color: #29231f; }
.booking-reference__text-input-wrap input, .booking-reference__date-control input { width: 100%; height: 100%; border: 0; outline: 0; background: transparent; font-size: 14px; color: inherit; }
.booking-reference__bottom-row { display: flex; gap: 14px; align-items: flex-end; margin-top: 4px; }
@media (max-width: 768px) { .booking-reference__bottom-row { flex-direction: column; align-items: stretch; } }
.booking-reference__field--fleet { flex: 1; }
.booking-reference__vehicles { display: grid; gap: 8px; }
.booking-reference__vehicle { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 52px; padding: 6px 4px; border: 1px solid #e2ddd8; border-radius: 10px; background: #fff; cursor: pointer; font-size: 11px; font-weight: 600; color: #574d47; }
.booking-reference__vehicle.is-active { border-color: #ac3d12; color: #ac3d12; background: rgba(172, 61, 18, 0.05); }
.booking-reference__action { flex-shrink: 0; }
.booking-reference__search { height: 52px; padding: 0 28px; border-radius: 12px; border: 0; background: #ac3d12; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 7px 18px rgba(172, 61, 18, 0.25); }
@media (max-width: 768px) { .booking-reference__search { width: 100%; } }
.booking-reference__trust { display: flex; width: calc(100% + 54px); min-height: 40px; align-items: center; justify-content: space-between; gap: 14px; margin: 16px 0 0 -27px; padding: 0 27px; border-top: 1px solid #eee9e5; background: rgba(250, 248, 245, 0.82); color: #746b63; font: 600 10px/1 'Plus Jakarta Sans', sans-serif; flex-wrap: wrap; }
.booking-reference__trust span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
`.trim();

// Ensure public assets exist in dist
async function ensureAssets(): Promise<void> {
  const publicAssets = join(reactRoot, "public", "assets");
  const distAssets = join(dist, "assets");
  if (existsSync(publicAssets) && !existsSync(distAssets)) {
    await cp(publicAssets, distAssets, { recursive: true });
  }
  const publicFonts = join(reactRoot, "public", "fonts");
  const distFonts = join(dist, "fonts");
  if (existsSync(publicFonts) && !existsSync(distFonts)) {
    await cp(publicFonts, distFonts, { recursive: true });
  }
}

// Manifest of all core marketing, detail, and utility routes
const hubRoutes = [
  "services",
  "routes",
  "packages",
  "monuments",
  "fleet",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms",
];

const vehicleRoutes = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
];

const packageRoutes = [
  "taj-mahal-sunrise-tour",
  "agra-sightseeing",
  "agra-unhurried",
  "mathura-vrindavan",
  "gatimaan-express-agra-tour",
  "golden-triangle",
];

function getPublishedPackageRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  const livePath = join(reactRoot, "src", "data", "live-catalog.snapshot.json");
  try {
    let raw: any = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, "utf8")) : null;
    if ((!raw || (Array.isArray(raw) && raw.length === 0)) && existsSync(livePath)) {
      raw = JSON.parse(readFileSync(livePath, "utf8"));
    }
    const snapshot = (Array.isArray(raw) ? raw : raw?.data?.packages ?? raw?.packages ?? []) as Array<{ type?: string; slug?: string }>;
    return snapshot
      .filter((item) => (item.type === "package" || item.type === "tour" || item.type === "transfer") && isSitemapSafeSlug(item.slug))
      .map((item) => {
        const prefix = item.type === "tour" ? "local-packages" : item.type === "transfer" ? "transfers" : "packages";
        return `/en/${prefix}/${item.slug}/`;
      });
  } catch {
    return [];
  }
}

const REDIRECT_SLUGS = new Set([
  "agra-to-delhi",
  "agra-to-mathura-taxi-service",
  "agra-to-delhi-airport-cab-booking",
  "agra-cantt-railway-station-taxi-service",
]);

function getPublishedRoutePages(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-routes.json");
  const livePath = join(reactRoot, "src", "data", "live-catalog.snapshot.json");
  try {
    let snapshot: Array<{ slug?: string }> = [];
    if (existsSync(snapshotPath)) {
      const raw = JSON.parse(readFileSync(snapshotPath, "utf8"));
      if (Array.isArray(raw) && raw.length > 0) {
        snapshot = raw;
      }
    }
    if (snapshot.length === 0 && existsSync(livePath)) {
      const raw = JSON.parse(readFileSync(livePath, "utf8"));
      snapshot = (Array.isArray(raw) ? raw : Object.keys(raw?.data?.routes ?? raw?.routes ?? {}).map((slug) => ({ slug }))) as Array<{ slug?: string }>;
    }
    return snapshot
      .filter((item) => isSitemapSafeSlug(item.slug) && !REDIRECT_SLUGS.has(item.slug))
      .map((item) => `/en/${item.slug}/`);
  } catch {
    return [];
  }
}

function getPublishedTourPackageRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-tour-packages.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      packageCode?: string;
      package_code?: string;
      status?: string;
    }>;
    return snapshot
      .filter((item) => !item.status || item.status === "published")
      .map((item) => item.slug ?? item.packageCode ?? item.package_code)
      .filter(isSitemapSafeSlug)
      .map((slug) => `/en/packages/${slug}/`);
  } catch {
    return [];
  }
}

function getPublishedTransferRouteRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-transfer-routes.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      routeCode?: string;
      route_code?: string;
      status?: string;
    }>;
    return snapshot
      .filter((item) => !item.status || item.status === "published")
      .map((item) => item.slug ?? item.routeCode ?? item.route_code)
      .filter(isSitemapSafeSlug)
      .map((slug) => `/en/transfers/${slug}/`);
  } catch {
    return [];
  }
}

function getPublishedLocalPackageRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-local-packages.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      packageCode?: string;
      package_code?: string;
      status?: string;
    }>;
    return snapshot
      .filter((item) => !item.status || item.status === "published")
      .map((item) => item.slug ?? item.packageCode ?? item.package_code)
      .filter(isSitemapSafeSlug)
      .map((slug) => `/en/local-packages/${slug}/`);
  } catch {
    return [];
  }
}

function getPublishedMonumentRoutes(): string[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-content.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
      monuments?: Array<{
        name?: string;
        slug?: string;
        monumentCode?: string;
        monument_code?: string;
        status?: string;
      }>;
    };
    const list = Array.isArray(snapshot.monuments) ? snapshot.monuments : [];
    return list
      .filter((item) => !item.status || item.status === "published")
      .map((item) => item.slug ?? item.monumentCode ?? item.monument_code ?? (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : undefined))
      .filter(isSitemapSafeSlug)
      .map((slug) => `/en/monuments/${slug}/`);
  } catch {
    return [];
  }
}

const routePairs = [
  "agra-to-delhi-taxi",
  "delhi-to-agra-taxi",
  "agra-to-jaipur-taxi",
  "delhi-to-jaipur-taxi",
  "agra-to-gwalior-taxi",
  "agra-to-lucknow-taxi",
  "agra-to-mathura-taxi",
  "agra-sightseeing-taxi",
];

const hindiRoutePairs = [
  "agra-se-delhi-taxi",
  "delhi-se-agra-taxi",
  "agra-se-jaipur-taxi",
  "delhi-se-jaipur-taxi",
  "agra-se-gwalior-taxi",
  "agra-se-lucknow-taxi",
  "agra-se-mathura-taxi",
  "agra-darshan-taxi",
];

// Full manifest of static paths to render (English only)
const routesToRender: string[] = Array.from(new Set([
  // Root & Home
  "/",
  "/en/",

  // Canonical public legal URLs for customers and Google OAuth verification
  "/privacy-policy/",
  "/terms-and-conditions/",

  // Booking Funnel & 404 Recovery
  "/book.html",
  "/book/",
  "/en/book/",
  "/login/",
  "/auth/login/",
  "/auth/callback/",
  "/my-bookings/",
  "/payment/resume/",
  "/booking/confirmation/",
  "/404.html",
  "/en/404/",

  // English Hubs (9)
  ...hubRoutes.map((hub) => `/en/${hub}/`),
  "/en/taxis/rent/",

  // Fleet / Vehicles (5)
  ...vehicleRoutes.map((v) => `/en/vehicles/${v}/`),

  // Tour Packages (6)
  ...packageRoutes.map((p) => `/en/packages/${p}/`),
  ...getPublishedPackageRoutes(),
  ...getPublishedRoutePages(),
  ...getPublishedTourPackageRoutes(),
  ...getPublishedTransferRouteRoutes(),
  ...getPublishedLocalPackageRoutes(),
  ...getPublishedMonumentRoutes(),

  // English Routes (8)
  ...routePairs.map((r) => `/en/${r}/`),
  ...SEO_LANDING_SLUGS.map((slug) => `/en/${slug}/`),
]));

// Compatibility HTML redirect stubs for backward compatibility
const redirectStubs = [
  { from: "en/privacy/", to: "/privacy-policy/" },
  { from: "en/terms/", to: "/terms-and-conditions/" },
  { from: "en/agra-to-mathura-taxi-service/", to: "/en/agra-to-mathura-taxi/" },
  { from: "en/agra-to-delhi/", to: "/en/agra-to-delhi-taxi/" },
  { from: "en/agra-to-delhi-airport-cab-booking/", to: "/en/agra-to-delhi-airport-taxi/" },
  { from: "en/agra-cantt-railway-station-taxi-service/", to: "/en/agra-cantt-station-transfer/" },
  { from: "services.html", to: "/en/services/" },
  { from: "routes.html", to: "/en/routes/" },
  { from: "packages.html", to: "/en/packages/" },
  { from: "fleet.html", to: "/en/fleet/" },
  { from: "about.html", to: "/en/about/" },
  { from: "contact.html", to: "/en/contact/" },
  { from: "faq.html", to: "/en/faq/" },
  { from: "privacy.html", to: "/en/privacy/" },
  { from: "terms.html", to: "/en/terms/" },
  { from: "en/index.html", to: "/" },
  { from: "en/agra-delhi/", to: "/en/agra-to-delhi-taxi/" },
  { from: "en/vehicles/innova/", to: "/en/vehicles/innova-crysta/" },
  { from: "en/vehicles/tempo/", to: "/en/vehicles/tempo-traveller/" },
  { from: "en/15-btn-pac-agra-to-chandigarh-taxi-services/", to: "/en/agra-to-chandigarh-taxi/" },
  { from: "rent.html", to: "/en/taxis/rent/" },
  { from: "rental.html", to: "/en/taxis/rent/" },
  { from: "taxi-rental.html", to: "/en/taxis/rent/" },
  { from: "rent/", to: "/en/taxis/rent/" },
  { from: "rental/", to: "/en/taxis/rent/" },
  { from: "taxi-rental/", to: "/en/taxis/rent/" },
  { from: "en/rent/", to: "/en/taxis/rent/" },
  { from: "en/rental/", to: "/en/taxis/rent/" },
  { from: "en/taxi-rental/", to: "/en/taxis/rent/" },
];

function generateRedirectHtml(targetUrl: string, canonicalDomain: string): string {
  const fullCanonical = `${canonicalDomain}${targetUrl}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta http-equiv="refresh" content="0; url=${targetUrl}" />
    <link rel="canonical" href="${fullCanonical}" />
    <title>Redirecting…</title>
    <script>location.replace(${JSON.stringify(targetUrl)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>…</p>
  </body>
</html>
`;
}

export async function prerender(): Promise<void> {
  const startTime = Date.now();
  console.log("🚀 Starting Static HTML Pre-Renderer (SSG)...");

  await ensureAssets();

  const indexPath = join(dist, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(`dist/index.html not found at ${indexPath}. Run vite build first.`);
  }
  let baseTemplate = await readFile(indexPath, "utf8");
  // Critical CSS inlining + non-render-blocking stylesheet loading:
  // Inline critical above-the-fold layout styles into <style id="critical-css"> in <head>
  // and load main bundle asynchronously using media="print" onload="this.media='all'" with noscript fallback.
  baseTemplate = baseTemplate.replace(
    /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
    `<style id="critical-css">\n${CRITICAL_CSS}\n    </style>\n    <link rel="preload" as="style" href="$1" />\n    <link rel="stylesheet" href="$1" media="print" onload="this.media='all'" />\n    <noscript><link rel="stylesheet" href="$1" /></noscript>`
  );

  // Tokenized review invitations are served by the explicit Pages Function at
  // functions/review/[[token]].ts. Keep a shell at its rewrite target without
  // placing a real customer token in the public build.
  await mkdir(join(dist, "review"), { recursive: true });
  const reviewShell = baseTemplate
    .replace(/<title>.*?<\/title>/, "<title>Customer Reviews | Agra SK Baghel Travels</title>")
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      '<meta name="description" content="Read authentic traveler reviews for Agra SK Baghel Tour and Travels. Verified ratings on private Taj Mahal tours, outstation cabs & Tempo Travellers." />',
    )
    .replace(
    "</head>",
    `<meta name="robots" content="noindex, nofollow" /><link rel="canonical" href="${CANONICAL_DOMAIN}/review" /></head>`,
  );
  await writeFile(join(dist, "review", "index.html"), reviewShell, "utf8");

  // Spin up Vite in middleware mode to load TypeScript/TSX modules with alias resolution
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    root: reactRoot,
  });

  try {
    // Load dynamic React App & SEO helpers
    const { default: App, getMarketingPath, getSeo } = await vite.ssrLoadModule("/src/app/ServerApp.tsx");
    const {
      CANONICAL_DOMAIN,
      normalizePath,
      resolveAbsoluteUrl,
      resolveHreflangAlternates,
    } = await vite.ssrLoadModule("/src/components/seo/SeoHead.tsx");

    let renderedCount = 0;
    let totalBytes = 0;

    // Unsplash hotlink guard (2026-10-01, PageSpeed): no full-size Unsplash
    // hotlinks (w>1200) may be added to source — self-host via public/images
    // (see hero-taj-sunrise.avif). Lazy w<=1200 gallery images are grandfathered.
    {
      const srcDir = join(reactRoot, "src");
      const offenders: string[] = [];
      const walk = async (dir: string): Promise<void> => {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const p = join(dir, entry.name);
          if (entry.isDirectory()) { await walk(p); continue; }
          if (!/\.(tsx?|css)$/.test(entry.name)) continue;
          const text = await readFile(p, "utf8");
          const re = /images\.unsplash\.com\/[^"'`\s]*[?&]w=(\d+)/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(text))) {
            if (parseInt(m[1], 10) > 1200) offenders.push(`${p}: w=${m[1]}`);
          }
        }
      };
      await walk(srcDir);
      assert.ok(
        offenders.length === 0,
        `Unsplash guard: full-size hotlinks (w>1200) must be self-hosted:\n${offenders.join("\n")}`
      );
    }

    for (const route of routesToRender) {
      const isBooking = route.endsWith("book.html") || route.includes("/book");
      const is404 = route.includes("404");
      const { language, section } = getMarketingPath(route);
      const isDisabledHindiPage = language === "hi" && !HINDI_INDEXING_ENABLED;
      const effectiveLanguage = isDisabledHindiPage ? "en" : language;
      const effectiveSection = is404 ? "404" : (route === "/" || route === "/en/" || route === "/hi/") ? "home" : section;
      const seo = getSeo(route, effectiveSection, effectiveLanguage, isBooking);

      // Render React component tree to string
      const appHtml = renderToString(createElement(App, { pathname: route }));

      // Calculate path depth and relative prefix for asset resolution
      const depth = route.endsWith(".html") ? 0 : route.split("/").filter(Boolean).length;
      const prefix = "../".repeat(Math.max(depth, 0));

      // Resolve SEO tags
      const normalizedPath = normalizePath(route);
      const canonicalPath = normalizedPath === "/en/" ? "/" : normalizedPath;
      const canonicalUrl = `${CANONICAL_DOMAIN}${canonicalPath}`;
      const privateUtilityPath = normalizedPath.replace(/\/+$/, "");
      const isPrivateUtilityPage = [
        "/auth/callback",
        "/auth/login",
        "/booking/confirmation",
        "/login",
        "/my-bookings",
        "/payment/resume",
      ].includes(privateUtilityPath);
      const isLegacyLegalAlias = privateUtilityPath === "/en/privacy" || privateUtilityPath === "/en/terms";
      const effectiveNoindex = isBooking || isPrivateUtilityPage || isLegacyLegalAlias || is404 || isDisabledHindiPage;
      const alternates = resolveHreflangAlternates(route, effectiveNoindex);
      const robotsContent = effectiveNoindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

      const ogImageUrl = resolveAbsoluteUrl(seo.ogImage);
      const ogLocale = effectiveLanguage === "hi" ? "hi_IN" : "en_IN";
      const ogLocaleAlt = HINDI_INDEXING_ENABLED
        ? (effectiveLanguage === "hi" ? "en_IN" : "hi_IN")
        : undefined;

      // Build consolidated <head> metadata block
      const headTags = [
        `<title>${escapeHtml(seo.title)}</title>`,
        `<meta name="description" content="${escapeHtml(seo.description)}" />`,
        seo.keywords?.length ? `<meta name="keywords" content="${escapeHtml(seo.keywords.join(", "))}" />` : "",
        `<meta name="robots" content="${robotsContent}" />`,
        `<link rel="canonical" href="${canonicalUrl}" />`,
        ...alternates.map((alt: { hreflang: string; href: string }) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`),
        `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
        `<meta property="og:url" content="${canonicalUrl}" />`,
        `<meta property="og:image" content="${ogImageUrl}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:image:alt" content="${escapeHtml(seo.title)}" />`,
        `<meta property="og:locale" content="${ogLocale}" />`,
        ogLocaleAlt ? `<meta property="og:locale:alternate" content="${ogLocaleAlt}" />` : "",
        `<meta property="og:site_name" content="Agra SK Baghel Tour and Travels" />`,
        `<meta property="og:type" content="website" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
        `<meta name="twitter:image" content="${ogImageUrl}" />`,
        `<meta name="twitter:image:alt" content="${escapeHtml(seo.title)}" />`,
        `<meta name="twitter:site" content="@skbagheltravels" />`,
        `<meta name="twitter:creator" content="@skbagheltravels" />`,
        `<meta name="geo.region" content="IN-UP" />`,
        `<meta name="geo.placename" content="Agra" />`,
        `<meta name="geo.position" content="27.1632;78.0322" />`,
        `<meta name="ICBM" content="27.1632, 78.0322" />`,
      ].filter(Boolean).join("\n    ");

      // Inject into base template
      let html = baseTemplate;

      // 1. Set html lang attribute
      html = html.replace(/<html lang="[^"]*"/, `<html lang="${effectiveLanguage === "hi" ? "hi-IN" : "en-IN"}" dir="ltr"`);

      // Extract hoisted head elements (React 19 emits hoisted links at the start of appHtml)
      let cleanAppHtml = appHtml;
      const hoistedTags: string[] = [];

      const hoistedLinkRegex = /<link rel="preload"[^>]*>/g;
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = hoistedLinkRegex.exec(cleanAppHtml)) !== null) {
        hoistedTags.push(linkMatch[0]);
      }
      cleanAppHtml = cleanAppHtml.replace(hoistedLinkRegex, "");

      const firstHero = HOME_HERO_SLIDES[0];
      const isHomepageRoute = ["/", "/en/", "/hi/"].includes(route);
      const heroPreloadTags = firstHero && isHomepageRoute
        ? [
            `<link rel="preload" as="image" href="${escapeHtml(firstHero.avif.small)}" imagesrcset="${escapeHtml(`${firstHero.avif.small} 480w, ${firstHero.avif.medium} 960w`)}" imagesizes="100vw" type="image/avif" media="(max-width: 640px)" fetchpriority="high" />`,
            `<link rel="preload" as="image" href="${escapeHtml(firstHero.avif.medium)}" imagesrcset="${escapeHtml(`${firstHero.avif.medium} 960w, ${firstHero.avif.desktop ? `${firstHero.avif.desktop} 1280w, ` : ""}${firstHero.avif.large} 1600w`)}" imagesizes="(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw" type="image/avif" media="(min-width: 641px)" fetchpriority="high" />`,
          ]
        : [];

      // Hoist hero preload tags immediately after viewport meta tag for fastest speculative preloader discovery
      if (heroPreloadTags.length > 0) {
        const heroPreloadBlock = "\n    " + heroPreloadTags.join("\n    ");
        html = html.replace(
          /(<meta name="viewport"[^>]*>)/i,
          `$1${heroPreloadBlock}`
        );
      }

      // 2. Replace title and generic meta description with full metadata block
      const fullHeadTags = [headTags, ...hoistedTags].filter(Boolean).join("\n    ");
      html = html.replace(/<title>.*?<\/title>/, fullHeadTags);
      html = html.replace(/<meta name="description" content="[^"]*" \/>\s*/, "");

      // 3. Inject pre-rendered React markup into #root
      // Fail loudly if the template was already prerendered (stale dist/index.html)
      // — a silent no-op here produces pages missing all React markup.
      assert.ok(
        html.includes('<div id="root"></div>'),
        `Prerender: dist/index.html is missing the empty <div id="root"></div> mount point. ` +
        `Run vite build before prerender.ts (do not run prerender twice on the same dist).`
      );
      html = html.replace('<div id="root"></div>', `<div id="root">${cleanAppHtml}</div>`);

      // 4. Update only the accessibility fallback; preserve GTM's noscript iframe
      html = html.replace(
        /<noscript id="js-fallback">[\s\S]*?<\/noscript>/,
        `<noscript id="js-fallback"><p style="position:static;padding:12px;background:#fff3cd;color:#856404;margin:0;text-align:center;font-size:14px;">JavaScript is recommended for dynamic calculations and interactive booking. Call us 24×7 at <a href="tel:+919762817598" style="color:#b8941f;font-weight:700;">+91 97628 17598</a>.</p></noscript>`
      );

      // 5. Ensure relative assets work correctly across directory depths if requested
      if (prefix) {
        html = html.replaceAll("./assets/", `${prefix}assets/`);
      }

      if (!isBooking && !is404) {
        const quality = inspectSeoHtml(route, html, CANONICAL_DOMAIN);
        for (const finding of quality.findings) {
          console.warn(`⚠️ SEO ${finding.severity} [${finding.code}] ${finding.path}: ${finding.message}`);
        }
        if (process.env.SEO_STRICT === "1") assertBuildSafeSeo(quality);
      }

      // Fleet registry guard (2026-10-01): the route widget must render exactly
      // the 5 canonical fleets — a drifted 6th "Hatchback" card must fail the build.
      if (route === "/en/routes/") {
        for (const fleet of FLEETS) {
          assert.ok(
            html.includes(`>${fleet.label}<`),
            `Fleet registry guard: prerendered ${route} is missing the "${fleet.label}" card.`
          );
        }
        assert.ok(
          !html.includes(">Hatchback<"),
          `Fleet registry guard: prerendered ${route} contains a bogus "Hatchback" card.`
        );
      }

      // CTA contrast guard (2026-10-01): these exact class pairs were measured
      // below WCAG AA 4.5:1 in production (#C85A32 on white = 4.23:1).
      // Use bg-terracotta-deep / text-gold-bronze instead — see theme.css.
      for (const badPair of ["bg-terracotta-sandstone text-white", "bg-terracotta-sandstone text-on-primary"]) {
        assert.ok(
          !html.includes(badPair),
          `Contrast guard: prerendered ${route} contains failing pair "${badPair}".`
        );
      }

      // Determine output file path
      const targetFile = route === "/"
        ? join(dist, "index.html")
        : route.endsWith(".html")
        ? join(dist, route.slice(1))
        : join(dist, route.slice(1), "index.html");

      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, html, "utf8");

      renderedCount++;
      totalBytes += Buffer.byteLength(html, "utf8");
    }

    // Generate compatibility redirect stubs
    let redirectCount = 0;
    for (const item of redirectStubs) {
      const redirectHtml = generateRedirectHtml(item.to, CANONICAL_DOMAIN);
      const targetFile = join(dist, item.from.endsWith("/") ? item.from.slice(0, -1) : item.from);
      const redirectOutput = targetFile.endsWith(".html") ? targetFile : join(targetFile, "index.html");
      await mkdir(dirname(redirectOutput), { recursive: true });
      await writeFile(redirectOutput, redirectHtml, "utf8");
      redirectCount++;
    }

    // Generate XML sitemap & robots.txt
    await generateSitemapAndRobots({ requireBuiltArtifacts: true });
    const callbackBase = (process.env.VITE_API_BASE_URL || "https://api.agraskbagheltourandtravels.com").replace(/\/$/, "");
    if (process.env.DEPLOY_CALLBACK_SECRET || process.env.DEPLOY_CALLBACK_URL) {
      try {
        const snapshotPath = join(reactRoot, "src", "data", "live-catalog.snapshot.json");
        const snapshot = existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, "utf8")) : null;
        const callbackUrl = process.env.DEPLOY_CALLBACK_URL || `${callbackBase}/api/public/outbox/deploy-callback`;
        const response = await fetch(callbackUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(process.env.DEPLOY_CALLBACK_SECRET ? { "x-deploy-callback-secret": process.env.DEPLOY_CALLBACK_SECRET } : {}),
          },
          body: JSON.stringify({ catalogVersion: snapshot?.data?.version ?? snapshot?.version ?? null }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) console.warn(`⚠️ Deploy callback returned HTTP ${response.status}.`);
      } catch (error) {
        console.warn(`⚠️ Deploy callback failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✅ SSG Pre-Rendering Complete: ${renderedCount} pages rendered + ${redirectCount} redirects written ` +
      `(${(totalBytes / 1024 / 1024).toFixed(2)} MB total) in ${elapsed}s.`
    );
  } finally {
    await vite.close();
  }
}

// Execute directly if run via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  prerender().catch((err) => {
    console.error("❌ SSG Pre-Renderer failed:", err);
    process.exit(1);
  });
}
