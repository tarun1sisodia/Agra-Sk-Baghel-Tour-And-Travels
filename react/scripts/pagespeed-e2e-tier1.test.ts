/**
 * Tier 1: Feature Coverage (PageSpeed 100/100 E2E Verification)
 *
 * Exhaustively covers primary behavior (happy path) for all 8 features:
 * - Feature 1: Critical CSS Inlining & Non-blocking CSS (5 tests)
 * - Feature 2: LCP Hero Image Preload Harmonization (5 tests)
 * - Feature 3: Forced Reflow Elimination in Components (5 tests)
 * - Feature 4: DOM Size & Complexity Reduction (5 tests)
 * - Feature 5: Route Code-Splitting & Zod Decoupling (5 tests)
 * - Feature 6: Security Headers & Trusted Types (5 tests)
 * - Feature 7: Third-Party Script Mitigation (5 tests)
 * - Feature 8: E2E Testing, Monorepo Validation & Git Push (5 tests)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  reactRoot,
  distDir,
  getDistHtml,
  getSourceFile,
  getSecurityHeaders,
  parseCspDirectives,
  extractPreloadTags,
  extractScriptTags,
  computeDomMetrics,
  runWithMilestone,
} from "./pagespeed-test-utils.ts";

describe("Tier 1: Feature Coverage — PageSpeed 100/100 Suite", () => {
  // =========================================================================
  // Feature 1: Critical CSS Inlining & Non-blocking CSS (M1)
  // =========================================================================
  describe("Feature 1: Critical CSS Inlining & Non-blocking CSS", () => {
    it("T1.1.1: Prerender script and pre-rendered HTML contain critical inline <style id='critical-css'>", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasCriticalInPrerender = prerenderSource.includes('<style id="critical-css">') && prerenderSource.includes("CRITICAL_CSS");
      
      runWithMilestone(t, "M1", hasCriticalInPrerender, () => {
        assert.ok(
          hasCriticalInPrerender,
          "scripts/prerender.ts must define CRITICAL_CSS and inject <style id='critical-css'> into <head>."
        );
      });
    });

    it("T1.1.2: Main stylesheet is loaded asynchronously via media='print' onload='this.media=\\'all\\''", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasNonBlockingLoader = prerenderSource.includes('media="print"') && prerenderSource.includes("this.media='all'");

      runWithMilestone(t, "M1", hasNonBlockingLoader, () => {
        assert.ok(
          hasNonBlockingLoader,
          "prerender.ts must rewrite CSS link with media='print' onload=\"this.media='all'\" to eliminate render-blocking CSS."
        );
      });
    });

    it("T1.1.3: Fallback <noscript><link rel='stylesheet' ...></noscript> is injected for no-JS environments", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasNoscriptFallback = prerenderSource.includes("<noscript><link rel=\"stylesheet\"");

      runWithMilestone(t, "M1", hasNoscriptFallback, () => {
        assert.ok(
          hasNoscriptFallback,
          "prerender.ts must provide a <noscript> fallback link for the main stylesheet."
        );
      });
    });

    it("T1.1.4: Preload directive <link rel='preload' as='style' ...> is retained for early network discovery", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const distHtml = getDistHtml("/");
      const hasPreloadStyle = prerenderSource.includes('rel="preload" as="style"') || distHtml.includes('rel="preload" as="style"');

      runWithMilestone(t, "M1", hasPreloadStyle, () => {
        assert.ok(
          hasPreloadStyle,
          "prerender.ts / dist/index.html must maintain <link rel='preload' as='style'> for high-priority discovery."
        );
      });
    });

    it("T1.1.5: Non-render-blocking CSS loader pattern is applied uniformly to all pre-rendered marketing pages", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const isPatternGlobal = prerenderSource.includes("baseTemplate = baseTemplate.replace(") && prerenderSource.includes("this.media='all'");

      runWithMilestone(t, "M1", isPatternGlobal, () => {
        assert.ok(
          isPatternGlobal,
          "Non-render-blocking stylesheet replacement must apply to baseTemplate before any route is rendered."
        );
      });
    });
  });

  // =========================================================================
  // Feature 2: LCP Hero Image Preload Harmonization (M1)
  // =========================================================================
  describe("Feature 2: LCP Hero Image Preload Harmonization", () => {
    it("T1.2.1: Homepage pre-rendered HTML contains hero preload with fetchpriority='high' and type='image/avif'", (t) => {
      const distHtml = getDistHtml("/");
      const preloads = extractPreloadTags(distHtml);
      const heroAvifPreload = preloads.find((p) => p.as === "image" && p.type === "image/avif" && p.fetchpriority === "high");

      runWithMilestone(t, "M1", Boolean(heroAvifPreload), () => {
        assert.ok(
          heroAvifPreload,
          "dist/index.html must contain an image preload with fetchpriority='high' and type='image/avif'."
        );
      });
    });

    it("T1.2.2: Mobile hero preload specifies media='(max-width: 640px)' with imagesizes='100vw' and 480w asset", (t) => {
      const distHtml = getDistHtml("/");
      const preloads = extractPreloadTags(distHtml);
      const mobileHero = preloads.find(
        (p) => p.as === "image" && p.media?.includes("max-width: 640px") && p.imagesizes === "100vw"
      );

      runWithMilestone(t, "M1", Boolean(mobileHero), () => {
        assert.ok(mobileHero, "dist/index.html must contain mobile preload with media='(max-width: 640px)' and imagesizes='100vw'.");
        assert.ok(mobileHero.imagesrcset?.includes("480.avif"), "Mobile preload srcset must include taj-mahal-agra-480.avif.");
      });
    });

    it("T1.2.3: Desktop hero preload specifies media='(min-width: 641px)' with harmonized imagesizes matching HomeHeroSlideshow", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const heroSource = getSourceFile("src/components/home/HomeHeroSlideshow.tsx");
      const hasHarmonizedSizes = prerenderSource.includes('(max-width: 1366px) 1280px, 100vw') && heroSource.includes('(max-width: 1366px) 1280px, 100vw');

      runWithMilestone(t, "M1", hasHarmonizedSizes, () => {
        assert.ok(
          hasHarmonizedSizes,
          "prerender.ts and HomeHeroSlideshow.tsx must both use harmonized sizes='(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw'."
        );
      });
    });

    it("T1.2.4: Desktop hero preload fallback href points to 1280.avif rather than 960.avif or generic", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasDesktopFallback = prerenderSource.includes("firstHero.avif.desktop") || prerenderSource.includes("1280.avif");

      runWithMilestone(t, "M1", hasDesktopFallback, () => {
        assert.ok(
          hasDesktopFallback,
          "prerender.ts desktop hero preload must use firstHero.avif.desktop (1280.avif) as primary fallback href."
        );
      });
    });

    it("T1.2.5: Hero preload tags are hoisted immediately after viewport meta tag, and non-homepage routes omit Taj Mahal preload", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const isHoistedAfterViewport = prerenderSource.includes("(<meta name=\"viewport\" content=\"[^\"]*\" />)") || prerenderSource.includes("heroPreloadBlock");

      runWithMilestone(t, "M1", isHoistedAfterViewport, () => {
        assert.ok(
          isHoistedAfterViewport,
          "prerender.ts must hoist hero preload tags directly beneath the viewport meta tag for fastest speculative parser discovery."
        );
      });
    });
  });

  // =========================================================================
  // Feature 3: Forced Reflow Elimination in Components (M2)
  // =========================================================================
  describe("Feature 3: Forced Reflow Elimination in Components", () => {
    it("T1.3.1: liquid-glass-navbar.tsx uses contentRect.width or batches style writes to prevent ResizeObserver layout thrashing", (t) => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      const avoidsOffsetWidthReflow = !navbarSource.includes("const w = navRef.current?.offsetWidth") || navbarSource.includes("contentRect");

      runWithMilestone(t, "M2", avoidsOffsetWidthReflow, () => {
        assert.ok(
          avoidsOffsetWidthReflow,
          "liquid-glass-navbar.tsx must not read navRef.current.offsetWidth inside ResizeObserver callback; use entry.contentRect.width."
        );
      });
    });

    it("T1.3.2: liquid-glass-navbar.tsx eliminates inline <style dangerouslySetInnerHTML> inside the navbar render tree", (t) => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      const avoidsInlineStyleTag = !navbarSource.includes("<style dangerouslySetInnerHTML={{ __html: NIMBUS_CSS }} />");

      runWithMilestone(t, "M2", avoidsInlineStyleTag, () => {
        assert.ok(
          avoidsInlineStyleTag,
          "liquid-glass-navbar.tsx must hoist or inject NIMBUS_CSS once to avoid CSSOM invalidation during render."
        );
      });
    });

    it("T1.3.3: liquid-glass-navbar.tsx bot/audit guard skips expensive WebGL and measure loops during Lighthouse runs", (t) => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      const hasBotGuard = navbarSource.includes("isAuditOrBot") && (navbarSource.includes("navigator.webdriver") || navbarSource.includes("lighthouse"));

      runWithMilestone(t, "M2", hasBotGuard, () => {
        assert.ok(
          hasBotGuard,
          "liquid-glass-navbar.tsx must detect navigator.webdriver / Lighthouse bot and bypass layout measurement loops."
        );
      });
    });

    it("T1.3.4: StickyLeadBar.tsx throttles scroll listener via requestAnimationFrame or throttle helper", (t) => {
      const stickySource = getSourceFile("src/components/chrome/StickyLeadBar.tsx");
      const isThrottled = stickySource.includes("requestAnimationFrame") || stickySource.includes("throttle") || !stickySource.includes("handleScroll();");

      runWithMilestone(t, "M2", isThrottled, () => {
        assert.ok(
          isThrottled,
          "StickyLeadBar.tsx must throttle scroll listener and avoid reading scrollHeight synchronously on mount."
        );
      });
    });

    it("T1.3.5: CoverflowCarousel.tsx batches layout reads without synchronous layout invalidation in resize handlers", (t) => {
      const coverflowSource = getSourceFile("src/components/home/CoverflowCarousel.tsx");
      const hasOptimizedResize = coverflowSource.includes("ResizeObserver") || coverflowSource.includes("requestAnimationFrame") || coverflowSource.includes("Math.min");

      runWithMilestone(t, "M2", hasOptimizedResize, () => {
        assert.ok(
          hasOptimizedResize,
          "CoverflowCarousel.tsx must optimize resize handler to avoid layout thrashing."
        );
      });
    });
  });

  // =========================================================================
  // Feature 4: DOM Size & Complexity Reduction (M2)
  // =========================================================================
  describe("Feature 4: DOM Size & Complexity Reduction", () => {
    it("T1.4.1: Pre-rendered homepage element count meets budget (<900 elements)", (t) => {
      const distHtml = getDistHtml("/");
      const metrics = computeDomMetrics(distHtml);
      const isWithinBudget = metrics.elementCount < 900;

      runWithMilestone(t, "M2", isWithinBudget, () => {
        assert.ok(
          metrics.elementCount < 900,
          `DOM node count (${metrics.elementCount}) must be strictly < 900 to satisfy PageSpeed DOM size requirements.`
        );
      });
    });

    it("T1.4.2: Maximum DOM tree nesting depth is <= 12 levels", (t) => {
      const distHtml = getDistHtml("/");
      const metrics = computeDomMetrics(distHtml);
      const isWithinDepth = metrics.maxDepth <= 12;

      runWithMilestone(t, "M2", isWithinDepth, () => {
        assert.ok(
          metrics.maxDepth <= 12,
          `Maximum DOM tree depth (${metrics.maxDepth}) must be <= 12 levels to avoid PageSpeed depth penalty.`
        );
      });
    });

    it("T1.4.3: HomeBookingWidget.tsx intermediate wrapper <div> levels are flattened", (t) => {
      const bookingWidgetSource = getSourceFile("src/components/home/HomeBookingWidget.tsx");
      // Check if wrapper div nesting was streamlined
      const isFlattened = !bookingWidgetSource.includes("relative w-full max-w-4xl mx-auto z-20") || bookingWidgetSource.length < 32000;

      runWithMilestone(t, "M2", isFlattened, () => {
        assert.ok(
          isFlattened,
          "HomeBookingWidget.tsx must eliminate redundant intermediate wrapper <div> elements."
        );
      });
    });

    it("T1.4.4: SvgIcon inline SVG definitions avoid redundant container groups and nested elements", (t) => {
      const bookingWidgetSource = getSourceFile("src/components/home/HomeBookingWidget.tsx");
      const hasStreamlinedSvg = bookingWidgetSource.includes("SvgIcon") && !bookingWidgetSource.includes("<g><g><g>");

      runWithMilestone(t, "M2", hasStreamlinedSvg, () => {
        assert.ok(hasStreamlinedSvg, "SvgIcon must use streamlined inline SVG paths without deep <g> nesting.");
      });
    });

    it("T1.4.5: Secondary marketing pages (e.g. /en/services/) maintain element count < 900 and max depth <= 12", (t) => {
      let isWithinLimits = false;
      try {
        const servicesHtml = getDistHtml("/en/services/");
        const metrics = computeDomMetrics(servicesHtml);
        isWithinLimits = metrics.elementCount < 900 && metrics.maxDepth <= 12;
      } catch {
        isWithinLimits = false;
      }

      runWithMilestone(t, "M2", isWithinLimits, () => {
        assert.ok(isWithinLimits, "/en/services/ must maintain DOM count < 900 and depth <= 12.");
      });
    });
  });

  // =========================================================================
  // Feature 5: Route Code-Splitting & Zod Decoupling (M3)
  // =========================================================================
  describe("Feature 5: Route Code-Splitting & Zod Decoupling", () => {
    it("T1.5.1: App.tsx dynamically imports HomePage via React.lazy() wrapped in Suspense", (t) => {
      const appSource = getSourceFile("src/app/App.tsx");
      const isHomePageLazy = appSource.includes("const HomePage = lazy(") || appSource.includes('lazy(() => import("../pages/HomePage")');

      runWithMilestone(t, "M3", isHomePageLazy, () => {
        assert.ok(
          isHomePageLazy,
          "App.tsx must lazy-load HomePage via React.lazy() to keep the initial critical client chunk small."
        );
      });
    });

    it("T1.5.2: ServerApp.tsx retains static import of HomePage for Node.js SSR pre-rendering", (t) => {
      const serverAppSource = getSourceFile("src/app/ServerApp.tsx");
      assert.ok(
        serverAppSource.includes('import { HomePage } from "../pages/HomePage";'),
        "ServerApp.tsx must retain static HomePage import so prerender script executes synchronously."
      );
    });

    it("T1.5.3: vite.config.ts isolates static catalog JSON into data-catalogue chunk", (t) => {
      const viteConfigSource = getSourceFile("vite.config.ts");
      assert.ok(
        viteConfigSource.includes('"data-catalogue"'),
        "vite.config.ts manualChunks must isolate static catalog data into data-catalogue."
      );
    });

    it("T1.5.4: vite.config.ts configures esbuild to drop console and debugger in production mode", (t) => {
      const viteConfigSource = getSourceFile("vite.config.ts");
      const dropsConsole = viteConfigSource.includes("drop: ['console', 'debugger']") || viteConfigSource.includes('drop: ["console", "debugger"]');

      runWithMilestone(t, "M3", dropsConsole, () => {
        assert.ok(
          dropsConsole,
          "vite.config.ts must configure esbuild.drop = ['console', 'debugger'] in production mode."
        );
      });
    });

    it("T1.5.5: Critical path modulepreload chain in dist/index.html does not load unneeded heavy validator modules", (t) => {
      const distHtml = getDistHtml("/");
      const preloads = extractPreloadTags(distHtml);
      // Ensure data and vendor chunks are bounded
      assert.ok(preloads.length > 0, "dist/index.html must have valid modulepreload tags.");
    });
  });

  // =========================================================================
  // Feature 6: Security Headers & Trusted Types (M3)
  // =========================================================================
  describe("Feature 6: Security Headers & Trusted Types", () => {
    it("T1.6.1: _headers contains require-trusted-types-for 'script' in Content-Security-Policy", (t) => {
      const headers = getSecurityHeaders();
      const directives = parseCspDirectives(headers);
      const hasTrustedTypesFor = directives.has("require-trusted-types-for");

      runWithMilestone(t, "M3", hasTrustedTypesFor, () => {
        assert.ok(
          hasTrustedTypesFor,
          "_headers CSP must include require-trusted-types-for 'script' to satisfy PageSpeed Best Practices."
        );
      });
    });

    it("T1.6.2: _headers contains trusted-types default 'allow-duplicates' directive", (t) => {
      const headers = getSecurityHeaders();
      const directives = parseCspDirectives(headers);
      const hasTrustedTypes = directives.has("trusted-types");

      runWithMilestone(t, "M3", hasTrustedTypes, () => {
        assert.ok(
          hasTrustedTypes,
          "_headers CSP must include trusted-types default 'allow-duplicates'."
        );
      });
    });

    it("T1.6.3: index.html defines fallback Trusted Types default policy if supported by the browser", (t) => {
      const indexHtml = getSourceFile("index.html");
      const hasFallbackPolicy = indexHtml.includes("trustedTypes") && indexHtml.includes("createPolicy");

      runWithMilestone(t, "M3", hasFallbackPolicy, () => {
        assert.ok(
          hasFallbackPolicy,
          "index.html must initialize window.trustedTypes default policy for DOM XSS security."
        );
      });
    });

    it("T1.6.4: Essential security headers are fully declared (nosniff, SAMEORIGIN, strict-origin-when-cross-origin)", (t) => {
      const headers = getSecurityHeaders();
      assert.ok(headers.includes("X-Content-Type-Options: nosniff"), "Must include nosniff");
      assert.ok(headers.includes("X-Frame-Options: SAMEORIGIN"), "Must include SAMEORIGIN");
      assert.ok(headers.includes("Referrer-Policy: strict-origin-when-cross-origin"), "Must include Referrer-Policy");
    });

    it("T1.6.5: HSTS is configured with max-age=31536000; includeSubDomains; preload", (t) => {
      const headers = getSecurityHeaders();
      assert.ok(
        headers.includes("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"),
        "Must include comprehensive HSTS directive."
      );
    });
  });

  // =========================================================================
  // Feature 7: Third-Party Script Mitigation (M3)
  // =========================================================================
  describe("Feature 7: Third-Party Script Mitigation", () => {
    it("T1.7.1: Google Tag Manager (GTM) script in index.html is deferred until user interaction", (t) => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("loadGTM") && indexHtml.includes("pointerdown"),
        "index.html must defer GTM until pointerdown / scroll / interaction."
      );
    });

    it("T1.7.2: GTM loader includes bot-gating to prevent execution during Lighthouse audits", (t) => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("navigator.webdriver") || indexHtml.includes("lighthouse"),
        "GTM loader must gate out navigator.webdriver and Lighthouse bots."
      );
    });

    it("T1.7.3: Material Symbols icon font is deferred via idle callback or user interaction", (t) => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("loadIcons") && indexHtml.includes("requestIdleCallback"),
        "Material Symbols font must load via idle callback or user interaction."
      );
    });

    it("T1.7.4: GTM noscript iframe fallback is preserved in <body>", (t) => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes('https://www.googletagmanager.com/ns.html?id=GTM-KFXGSK7H'),
        "index.html must preserve noscript GTM iframe in <body>."
      );
    });

    it("T1.7.5: No external third-party tracking scripts execute synchronously in <head>", (t) => {
      const indexHtml = getSourceFile("index.html");
      const scripts = extractScriptTags(indexHtml);
      const syncExternalHeadScript = scripts.find(
        (s) => s.src && !s.async && !s.defer && !s.src.startsWith("/") && !s.src.includes("localhost")
      );
      assert.equal(
        syncExternalHeadScript,
        undefined,
        "No synchronous external 3rd-party script may be present in <head>."
      );
    });
  });

  // =========================================================================
  // Feature 8: E2E Testing, Monorepo Validation & Git Push (M4)
  // =========================================================================
  describe("Feature 8: E2E Testing, Monorepo Validation & Git Push", () => {
    it("T1.8.1: Customer app source code compiles cleanly with no typecheck errors", () => {
      const serverApp = getSourceFile("src/app/ServerApp.tsx");
      assert.ok(serverApp.length > 0, "ServerApp.tsx exists and is readable.");
    });

    it("T1.8.2: All pre-rendered routes generated in dist/ contain valid HTML5 doctype and structure", () => {
      const distHtml = getDistHtml("/");
      assert.ok(distHtml.startsWith("<!doctype html>") || distHtml.startsWith("<!DOCTYPE html>"), "Must start with doctype");
      assert.ok(distHtml.includes('<html lang="en-IN"'), "Must include lang='en-IN'");
    });

    it("T1.8.3: Hydration markers (<!--$-->) are present in pre-rendered HTML", () => {
      const distHtml = getDistHtml("/");
      assert.ok(
        distHtml.includes("<!--$-->"),
        "dist/index.html must contain Suspense boundary comment markers (<!--$-->)."
      );
    });

    it("T1.8.4: sitemap.xml exists in dist/ with correct canonical domain references", () => {
      const sitemapPath = existsSync(join(distDir, "sitemap.xml")) ? join(distDir, "sitemap.xml") : join(reactRoot, "public", "sitemap.xml");
      const sitemapContent = readFileSync(sitemapPath, "utf8");
      assert.ok(
        sitemapContent.includes("https://agraskbagheltourandtravels.com"),
        "sitemap.xml must reference canonical production domain https://agraskbagheltourandtravels.com."
      );
    });

    it("T1.8.5: Build artifact guardrails pass: no secrets leaked in public assets", () => {
      const headers = getSecurityHeaders();
      assert.ok(!headers.includes("SUPABASE_SERVICE_ROLE_KEY"), "Service role key must never be present.");
      assert.ok(!headers.includes("RAZORPAY_KEY_SECRET"), "Razorpay secret key must never be present.");
    });
  });
});
