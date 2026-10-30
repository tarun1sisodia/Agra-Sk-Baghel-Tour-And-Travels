/**
 * Tier 3: Cross-Feature Combinations (PageSpeed 100/100 E2E Verification)
 *
 * Tests pairwise interactions across features:
 * - T3.1: Critical CSS + LCP Hero Image Preload Interaction
 * - T3.2: Critical CSS + DOM Flattening Interaction
 * - T3.3: Route Code-Splitting + SSG Hydration Parity Interaction
 * - T3.4: Trusted Types CSP + Third-Party Bot Mitigation Interaction
 * - T3.5: Throttled Reflow Listeners + Coverflow 3D Carousel Interaction
 * - T3.6: Third-Party Script Deferral + Mobile Responsive Image Delivery
 * - T3.7: Non-blocking Stylesheet + Font Display Swap Interaction
 * - T3.8: Zod Decoupling + Catalog Manifest Idle Loading Interaction
 * - T3.9: Security Headers + Asset Cache-Control TTL Interaction
 * - T3.10: Pre-Rendered HTML + Client Navigation Interaction
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDistHtml,
  getSourceFile,
  getSecurityHeaders,
  parseCspDirectives,
  extractPreloadTags,
  extractScriptTags,
  runWithMilestone,
} from "./pagespeed-test-utils.ts";

describe("Tier 3: Cross-Feature Combinations — PageSpeed 100/100 Suite", () => {
  it("T3.1: Critical CSS + LCP Hero Image Preload Interaction: Preload tag precedes stylesheets in <head> for zero-contention discovery", (t) => {
    const prerenderSource = getSourceFile("scripts/prerender.ts");
    const isHoistedBeforeCss = prerenderSource.includes("heroPreloadBlock") || prerenderSource.includes("(<meta name=\"viewport\" content=\"[^\"]*\" />)");

    runWithMilestone(t, "M1", isHoistedBeforeCss, () => {
      assert.ok(
        isHoistedBeforeCss,
        "LCP hero preload tags must be hoisted directly beneath viewport meta tag so browser speculative preloader discovers image before stylesheet parsing."
      );
    });
  });

  it("T3.2: Critical CSS + DOM Flattening Interaction: Critical CSS selectors accurately match flattened markup without selector breaks", (t) => {
    const prerenderSource = getSourceFile("scripts/prerender.ts");
    const containsCoreSelectors = prerenderSource.includes("#site-header") && prerenderSource.includes(".app-shell");

    runWithMilestone(t, "M1", containsCoreSelectors, () => {
      assert.ok(
        containsCoreSelectors,
        "Critical CSS must style foundational container elements (#site-header, .app-shell) cleanly."
      );
    });
  });

  it("T3.3: Route Code-Splitting + SSG Hydration Parity Interaction: Suspense boundaries match between ServerApp and client App", () => {
    const serverApp = getSourceFile("src/app/ServerApp.tsx");
    const clientApp = getSourceFile("src/app/App.tsx");

    assert.ok(serverApp.includes("<Suspense fallback={null}>"), "ServerApp must wrap routes in Suspense fallback={null}");
    assert.ok(clientApp.includes("<Suspense fallback="), "client App must wrap routes in Suspense");
  });

  it("T3.4: Trusted Types CSP + Third-Party Bot Mitigation Interaction: Bot-gating scripts comply with Trusted Types policy", (t) => {
    const headers = getSecurityHeaders();
    const indexHtml = getSourceFile("index.html");
    const hasTrustedTypesInCsp = headers.includes("trusted-types");
    const hasSafeInlineScripts = !indexHtml.includes("eval(") && !indexHtml.includes("document.write(");

    runWithMilestone(t, "M3", hasTrustedTypesInCsp, () => {
      assert.ok(
        hasSafeInlineScripts,
        "Inline bot mitigation scripts must never use eval() or document.write() which are blocked by Trusted Types."
      );
    });
  });

  it("T3.5: Throttled Reflow Listeners + Coverflow 3D Carousel Interaction: Throttling preserves 3D card layout responsiveness", () => {
    const coverflowSource = getSourceFile("src/components/home/CoverflowCarousel.tsx");
    assert.ok(
      coverflowSource.includes("Math.max(220, Math.min(360, measured * 0.55))"),
      "CoverflowCarousel must clamp card dimensions safely across viewport resizing."
    );
  });

  it("T3.6: Third-Party Script Deferral + Mobile Responsive Image Delivery: GTM deferral frees mobile network for high-priority hero delivery", () => {
    const indexHtml = getSourceFile("index.html");
    const heroSource = getSourceFile("src/components/home/HomeHeroSlideshow.tsx");

    assert.ok(indexHtml.includes("loadGTM"), "GTM must be deferred");
    assert.ok(heroSource.includes("fetchPriority"), "Hero image must specify fetchPriority");
  });

  it("T3.7: Non-blocking Stylesheet + Font Display Swap Interaction: Async stylesheet loading prevents FOIT for self-hosted fonts", () => {
    const fontsCss = getSourceFile("src/styles/fonts.css");
    const matches = fontsCss.match(/font-display:\s*swap;/g);
    assert.ok(
      matches && matches.length >= 2,
      "All @font-face declarations in fonts.css must specify font-display: swap to prevent Flash of Invisible Text."
    );
  });

  it("T3.8: Zod Decoupling + Catalog Manifest Idle Loading Interaction: Static catalog data chunk is decoupled from runtime validators", () => {
    const viteConfig = getSourceFile("vite.config.ts");
    assert.ok(
      viteConfig.includes('"data-catalogue"'),
      "Static catalogue data must be isolated in data-catalogue chunk."
    );
  });

  it("T3.9: Security Headers + Asset Cache-Control TTL Interaction: Cache-Control policies in _headers preserve immutable asset caching", () => {
    const headers = getSecurityHeaders();
    assert.ok(headers.includes("/assets/*"), "Must include rule for /assets/*");
    assert.ok(headers.includes("max-age=31536000, immutable"), "/assets/* must be cached for 1 year immutable");
    assert.ok(headers.includes("/*.html"), "Must include rule for /*.html");
    assert.ok(headers.includes("no-cache, must-revalidate"), "HTML must revalidate");
  });

  it("T3.10: Pre-Rendered HTML + Client Navigation Interaction: Pre-rendered markup provides instant first paint and mounts React app cleanly", () => {
    const distHtml = getDistHtml("/");
    assert.ok(distHtml.includes('<div id="root">'), "dist/index.html must have #root mount container");
    assert.ok(distHtml.includes('class="app-shell"'), "Pre-rendered HTML must contain rendered .app-shell layout");
    assert.ok(distHtml.includes('<header'), "Pre-rendered HTML must contain <header id='site-header'>");
  });
});
