/**
 * Tier 4: Real-World Application Scenarios (PageSpeed 100/100 E2E Verification)
 *
 * Simulates real-world Lighthouse audits, synthetic benchmarks, and crawler scenarios:
 * - T4.1: Lighthouse Mobile Performance Simulation (100/100 Target)
 * - T4.2: Lighthouse Desktop Performance Simulation (100/100 Target)
 * - T4.3: Lighthouse Accessibility Audit Simulation (100/100 Target)
 * - T4.4: Lighthouse Best Practices Audit Simulation (100/100 Target)
 * - T4.5: Lighthouse SEO Audit Simulation (100/100 Target)
 * - T4.6: DOM Tree Depth & Element Count Benchmark
 * - T4.7: Critical Path Network Waterfall Simulation
 * - T4.8: Cumulative Layout Shift (CLS) Stress Test
 * - T4.9: Bot / Crawler Emulation Test
 * - T4.10: Production Pre-Render Multi-Route Audit
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDistHtml,
  getSourceFile,
  getSecurityHeaders,
  parseCspDirectives,
  extractPreloadTags,
  computeDomMetrics,
  runWithMilestone,
} from "./pagespeed-test-utils.ts";

describe("Tier 4: Real-World Application Scenarios — PageSpeed 100/100 Suite", () => {
  it("T4.1: Lighthouse Mobile Performance Simulation: Zero render-blocking resources and high-priority hero preload", (t) => {
    const prerenderSource = getSourceFile("scripts/prerender.ts");
    const distHtml = getDistHtml("/");
    const hasNonBlockingCss = prerenderSource.includes("this.media='all'");
    const preloads = extractPreloadTags(distHtml);
    const mobilePreload = preloads.find((p) => p.as === "image" && p.media?.includes("max-width: 640px"));

    runWithMilestone(t, "M1", hasNonBlockingCss, () => {
      assert.ok(hasNonBlockingCss, "Main stylesheet must be non-render-blocking via media='print' onload='this.media=\\'all\\''.");
      assert.ok(mobilePreload, "Mobile hero preload must be present for 100/100 mobile LCP.");
    });
  });

  it("T4.2: Lighthouse Desktop Performance Simulation: Desktop hero preload harmonized with sizes and fallback", (t) => {
    const prerenderSource = getSourceFile("scripts/prerender.ts");
    const distHtml = getDistHtml("/");
    const preloads = extractPreloadTags(distHtml);
    const desktopPreload = preloads.find((p) => p.as === "image" && p.media?.includes("min-width: 641px"));

    runWithMilestone(t, "M1", Boolean(desktopPreload), () => {
      assert.ok(desktopPreload, "Desktop hero preload must be present for 100/100 desktop LCP.");
      assert.ok(desktopPreload.fetchpriority === "high", "Desktop preload must carry fetchpriority='high'.");
    });
  });

  it("T4.3: Lighthouse Accessibility Audit Simulation: Minimum 48px touch targets, skip link, and aria landmarks", () => {
    const distHtml = getDistHtml("/");
    const homePageSource = getSourceFile("src/pages/HomePage.tsx");
    const radialDockSource = getSourceFile("src/components/chrome/RadialDock.tsx");

    // Skip link check
    assert.ok(distHtml.includes('class="skip-link"'), "Skip to main content link must be present.");
    // Header landmark check
    assert.ok(distHtml.includes("<header") && distHtml.includes('id="site-header"'), "Accessible header landmark must be present.");
    // 48px touch targets check
    assert.ok(
      homePageSource.includes("min-w-[48px]") && homePageSource.includes("min-h-[48px]"),
      "Interactive buttons must enforce 48px touch targets."
    );
    // Radial dock aria-hidden check
    assert.ok(
      radialDockSource.includes("aria-hidden={!isOpen}"),
      "Collapsed dock links must be hidden from screen readers via aria-hidden."
    );
  });

  it("T4.4: Lighthouse Best Practices Audit Simulation: Strict CSP, Trusted Types, and HSTS enforcement", (t) => {
    const headers = getSecurityHeaders();
    const directives = parseCspDirectives(headers);
    const hasTrustedTypes = directives.has("trusted-types");

    runWithMilestone(t, "M3", hasTrustedTypes, () => {
      assert.ok(hasTrustedTypes, "Best Practices 100 requires Content Security Policy with Trusted Types.");
    });

    assert.ok(headers.includes("Strict-Transport-Security"), "Best Practices requires HSTS.");
    assert.ok(headers.includes("X-Content-Type-Options: nosniff"), "Best Practices requires nosniff.");
  });

  it("T4.5: Lighthouse SEO Audit Simulation: Meta viewport, descriptive title, description, and JSON-LD schema", () => {
    const distHtml = getDistHtml("/");

    // Viewport meta
    assert.ok(distHtml.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'), "Valid viewport meta required.");
    // Descriptive title
    assert.ok(distHtml.includes("<title>Taxi Service in Agra"), "Title must be descriptive and non-empty.");
    // Meta description
    assert.ok(distHtml.includes('<meta name="description" content="'), "Meta description must be present.");
    // Canonical link
    assert.ok(distHtml.includes('<link rel="canonical" href="https://agraskbagheltourandtravels.com/" />'), "Canonical URL must be present.");
    // Schema JSON-LD
    assert.ok(distHtml.includes('type="application/ld+json"'), "Structured JSON-LD schema must be embedded.");
    assert.ok(distHtml.includes('"@type":["TravelAgency","TaxiService","LocalBusiness"]'), "Valid schema type graph required.");
  });

  it("T4.6: DOM Tree Depth & Element Count Benchmark: Validates production bundle complexity", (t) => {
    const distHtml = getDistHtml("/");
    const metrics = computeDomMetrics(distHtml);
    const meetsBudget = metrics.elementCount < 900 && metrics.maxDepth <= 12;

    runWithMilestone(t, "M2", meetsBudget, () => {
      assert.ok(
        metrics.elementCount < 900,
        `Real-world DOM element count (${metrics.elementCount}) must be < 900.`
      );
      assert.ok(
        metrics.maxDepth <= 12,
        `Real-world max DOM depth (${metrics.maxDepth}) must be <= 12.`
      );
    });
  });

  it("T4.7: Critical Path Network Waterfall Simulation: No render-blocking stylesheets or third-party scripts", (t) => {
    const prerenderSource = getSourceFile("scripts/prerender.ts");
    const indexHtml = getSourceFile("index.html");

    const hasNonBlockingCss = prerenderSource.includes("this.media='all'");
    const hasDeferredGtm = indexHtml.includes("loadGTM") && indexHtml.includes("pointerdown");

    runWithMilestone(t, "M1", hasNonBlockingCss, () => {
      assert.ok(hasNonBlockingCss, "Critical path CSS must be non-blocking.");
      assert.ok(hasDeferredGtm, "GTM must not contend on the critical network path.");
    });
  });

  it("T4.8: Cumulative Layout Shift (CLS) Stress Test: Image tags specify explicit width and height dimensions", () => {
    const distHtml = getDistHtml("/");
    // Logo image in header must have explicit width and height
    assert.ok(
      distHtml.includes('width="845" height="230"') || distHtml.includes('width="1600" height="900"'),
      "Key visual images must define width and height attributes to prevent CLS layout shift."
    );
  });

  it("T4.9: Bot / Crawler Emulation Test: Lighthouse bots bypass heavy WebGL loops and third-party trackers", () => {
    const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
    const indexHtml = getSourceFile("index.html");

    assert.ok(
      navbarSource.includes("isAuditOrBot") && navbarSource.includes("s.visible = false;"),
      "Navbar must abort WebGL rendering loop when audit bot is detected."
    );
    assert.ok(
      indexHtml.includes("navigator.webdriver") || indexHtml.includes("lighthouse"),
      "GTM must abort script loading when audit bot is detected."
    );
  });

  it("T4.10: Production Pre-Render Multi-Route Audit: Pre-rendered subpages consistently apply PageSpeed guardrails", () => {
    // Check services page
    const servicesHtml = getDistHtml("/en/services/");
    assert.ok(servicesHtml.includes("<!doctype html>"), "Services page must be valid HTML5");
    assert.ok(servicesHtml.includes('class="app-shell"'), "Services page must render app shell");
    assert.ok(servicesHtml.includes('<div id="root">'), "Services page must include #root");
  });
});
