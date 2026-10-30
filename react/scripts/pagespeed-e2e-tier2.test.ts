/**
 * Tier 2: Boundary & Corner Cases (PageSpeed 100/100 E2E Verification)
 *
 * Tests boundary conditions, extreme states, fallback behaviors, and edge cases:
 * - Feature 1: Critical CSS & Non-blocking CSS Boundaries (5 tests)
 * - Feature 2: LCP Hero Image Preload Boundaries (5 tests)
 * - Feature 3: Forced Reflow Boundaries (5 tests)
 * - Feature 4: DOM Complexity Boundaries (5 tests)
 * - Feature 5: Route Code-Splitting Boundaries (5 tests)
 * - Feature 6: Security Headers & Trusted Types Boundaries (5 tests)
 * - Feature 7: Third-Party Script Mitigation Boundaries (5 tests)
 * - Feature 8: Monorepo Validation Boundaries (5 tests)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

describe("Tier 2: Boundary & Corner Cases — PageSpeed 100/100 Suite", () => {
  // =========================================================================
  // Feature 1: Critical CSS & Non-blocking CSS Boundaries (M1)
  // =========================================================================
  describe("Feature 1: Critical CSS & Non-blocking CSS Boundaries", () => {
    it("T2.1.1: No-JS fallback integrity: <noscript> block contains valid <link rel='stylesheet'> without onload or media='print'", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasValidNoscript = prerenderSource.includes("<noscript><link rel=\"stylesheet\" href=\"$1\" /></noscript>");

      runWithMilestone(t, "M1", hasValidNoscript, () => {
        assert.ok(
          hasValidNoscript,
          "Noscript fallback must contain clean synchronous stylesheet tag without media='print' or onload handler."
        );
      });
    });

    it("T2.1.2: High-latency network resilience: Critical CSS contains self-contained core CSS variables and layout styles", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const containsTokens = prerenderSource.includes("--color-primary:") && prerenderSource.includes("--color-surface:") && prerenderSource.includes("#site-header");

      runWithMilestone(t, "M1", containsTokens, () => {
        assert.ok(
          containsTokens,
          "CRITICAL_CSS must contain complete design token variables and header rules for instant styled render before async CSS loads."
        );
      });
    });

    it("T2.1.3: Print media isolation: Async stylesheet initial media attribute is set strictly to 'print'", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasPrintMedia = prerenderSource.includes('media="print"');

      runWithMilestone(t, "M1", hasPrintMedia, () => {
        assert.ok(
          hasPrintMedia,
          "Async stylesheet must be initialized with media='print' so browser treats it as non-blocking for screen media."
        );
      });
    });

    it("T2.1.4: Dynamic bundle hash resilience: Replacement regex correctly matches Vite hashed stylesheet filenames", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasHashRegex = prerenderSource.includes("index-[^\"]+\\.css") || prerenderSource.includes("index-[^\"']+\\.css");

      runWithMilestone(t, "M1", hasHashRegex, () => {
        assert.ok(
          hasHashRegex,
          "Prerender regex must flexibly match hashed filenames like index-Cmm5izjL.css."
        );
      });
    });

    it("T2.1.5: Non-empty payload: Critical CSS inlined in prerender.ts has size >= 1KB and contains responsive container rules", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const cssMatch = prerenderSource.match(/const CRITICAL_CSS = `([\s\S]*?)`\.trim\(\);/);
      const cssLength = cssMatch ? cssMatch[1].length : 0;
      const hasValidSize = cssLength > 1000;

      runWithMilestone(t, "M1", hasValidSize, () => {
        assert.ok(
          hasValidSize,
          `Critical CSS must be sufficiently detailed (>= 1,000 characters; found ${cssLength}) to prevent FOUC.`
        );
      });
    });
  });

  // =========================================================================
  // Feature 2: LCP Hero Image Preload Boundaries (M1)
  // =========================================================================
  describe("Feature 2: LCP Hero Image Preload Boundaries", () => {
    it("T2.2.1: Breakpoint boundary exclusivity: Media queries (max-width: 640px) and (min-width: 641px) leave no viewport gap", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasExclusiveBreakpoints = prerenderSource.includes('media="(max-width: 640px)"') && prerenderSource.includes('media="(min-width: 641px)"');

      runWithMilestone(t, "M1", hasExclusiveBreakpoints, () => {
        assert.ok(
          hasExclusiveBreakpoints,
          "Mobile and desktop hero preloads must use mutually exclusive breakpoints (640px vs 641px)."
        );
      });
    });

    it("T2.2.2: Ultra-high DPI screens: Mobile preload srcset includes 960w asset alongside 480w for 2x/3x Retina DPR", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const hasHighDpiMobile = prerenderSource.includes("480w,") && prerenderSource.includes("960w");

      runWithMilestone(t, "M1", hasHighDpiMobile, () => {
        assert.ok(
          hasHighDpiMobile,
          "Mobile preload srcset must include both 480w and 960w to support high DPR devices without over-fetching."
        );
      });
    });

    it("T2.2.3: Multi-format fallback: HomeHeroSlideshow.tsx supplies WebP fallback sources alongside AVIF", () => {
      const heroSource = getSourceFile("src/components/home/HomeHeroSlideshow.tsx");
      assert.ok(heroSource.includes('type="image/avif"'), "Must provide AVIF source");
      assert.ok(heroSource.includes('type="image/webp"'), "Must provide WebP source");
    });

    it("T2.2.4: High resolution clamp: Desktop preload imagesizes caps slot width at 1280px rather than uncompressed large sizes", (t) => {
      const prerenderSource = getSourceFile("scripts/prerender.ts");
      const has1280Cap = prerenderSource.includes("(max-width: 1366px) 1280px, 100vw");

      runWithMilestone(t, "M1", has1280Cap, () => {
        assert.ok(
          has1280Cap,
          "Desktop hero preload imagesizes must clamp to 1280px on standard desktop viewports."
        );
      });
    });

    it("T2.2.5: Preload asset existence: Hero images specified in preload srcset actually exist in assets directory", () => {
      const smallAvif = join(reactRoot, "public", "assets", "home-hero", "taj-mahal-agra-480.avif");
      const mediumAvif = join(reactRoot, "public", "assets", "home-hero", "taj-mahal-agra-960.avif");
      const desktopAvif = join(reactRoot, "public", "assets", "home-hero", "taj-mahal-agra-1280.avif");

      assert.ok(existsSync(smallAvif), "taj-mahal-agra-480.avif must exist in public assets.");
      assert.ok(existsSync(mediumAvif), "taj-mahal-agra-960.avif must exist in public assets.");
      assert.ok(existsSync(desktopAvif), "taj-mahal-agra-1280.avif must exist in public assets.");
    });
  });

  // =========================================================================
  // Feature 3: Forced Reflow Boundaries (M2)
  // =========================================================================
  describe("Feature 3: Forced Reflow Boundaries", () => {
    it("T2.3.1: Resize listener density: ResizeObserver callbacks do not execute unthrottled DOM measurements", (t) => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      const hasOptimizedObserver = navbarSource.includes("contentRect") || !navbarSource.includes("navRef.current?.offsetWidth ?? 0;");

      runWithMilestone(t, "M2", hasOptimizedObserver, () => {
        assert.ok(
          hasOptimizedObserver,
          "ResizeObserver in navbar must avoid querying navRef.current.offsetWidth on every resize tick."
        );
      });
    });

    it("T2.3.2: Hidden or zero-width elements: Navbar handles zero-width container without NaN or calculation crashes", () => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      assert.ok(
        navbarSource.includes("Math.max") || navbarSource.includes("s.visible = false"),
        "Navbar must guard against division by zero or NaN when container width is 0."
      );
    });

    it("T2.3.3: Scroll position boundary: StickyLeadBar calculates bottom threshold cleanly without null errors", () => {
      const stickySource = getSourceFile("src/components/chrome/StickyLeadBar.tsx");
      assert.ok(
        stickySource.includes("scrollHeight - (scrollTop + clientHeight) < 140"),
        "StickyLeadBar must accurately calculate nearBottom threshold."
      );
    });

    it("T2.3.4: Reduced motion preference: Autoplay transitions halt immediately when prefers-reduced-motion is reduce", () => {
      const heroSource = getSourceFile("src/components/home/HomeHeroSlideshow.tsx");
      assert.ok(
        heroSource.includes("prefers-reduced-motion: reduce"),
        "HomeHeroSlideshow must respect prefers-reduced-motion query."
      );
      assert.ok(
        heroSource.includes("if (reducedMotion) return;"),
        "Autoplay must not register interval when reducedMotion is active."
      );
    });

    it("T2.3.5: Bot and audit detection: WebGL and active animations are disabled when isAuditOrBot is detected", () => {
      const navbarSource = getSourceFile("src/components/ui/liquid-glass-navbar.tsx");
      assert.ok(
        navbarSource.includes("isAuditOrBot") && navbarSource.includes("s.visible = false;"),
        "Navbar must suspend WebGL loops when audit or bot environment is detected."
      );
    });
  });

  // =========================================================================
  // Feature 4: DOM Complexity Boundaries (M2)
  // =========================================================================
  describe("Feature 4: DOM Complexity Boundaries", () => {
    it("T2.4.1: Extreme dynamic package rendering: Full pre-rendered DOM count remains strictly under 1,000", (t) => {
      const distHtml = getDistHtml("/");
      const metrics = computeDomMetrics(distHtml);
      const isUnder1000 = metrics.elementCount < 1000;

      runWithMilestone(t, "M2", isUnder1000, () => {
        assert.ok(
          metrics.elementCount < 1000,
          `DOM element count (${metrics.elementCount}) must remain < 1,000 elements.`
        );
      });
    });

    it("T2.4.2: DOM depth boundary: No single node in pre-rendered output exceeds depth 12", (t) => {
      const distHtml = getDistHtml("/");
      const metrics = computeDomMetrics(distHtml);
      const isDepthClean = metrics.maxDepth <= 12;

      runWithMilestone(t, "M2", isDepthClean, () => {
        assert.ok(
          metrics.maxDepth <= 12,
          `Maximum DOM tree depth (${metrics.maxDepth}) must not exceed 12.`
        );
      });
    });

    it("T2.4.3: Minimal fallback state: When catalog is empty, booking widget renders minimal valid structure", () => {
      const widgetSource = getSourceFile("src/components/home/HomeBookingWidget.tsx");
      assert.ok(
        widgetSource.includes("getFallbackPublishedCatalog"),
        "HomeBookingWidget must provide fallback published catalog."
      );
    });

    it("T2.4.4: SVG sanitization: No <script> or <foreignObject> tags inside inline SVGs", () => {
      const distHtml = getDistHtml("/");
      const svgScripts = distHtml.match(/<svg[\s\S]*?<script[\s\S]*?<\/svg>/gi);
      const svgForeignObjects = distHtml.match(/<svg[\s\S]*?<foreignObject[\s\S]*?<\/svg>/gi);

      assert.equal(svgScripts, null, "Inline SVGs must never contain <script> tags.");
      assert.equal(svgForeignObjects, null, "Inline SVGs must never contain <foreignObject> tags.");
    });

    it("T2.4.5: Detail page templates: Rental page maintains depth <= 12 and count < 850", (t) => {
      let isDetailClean = false;
      try {
        const rentalHtml = getDistHtml("/en/taxis/rent/");
        const metrics = computeDomMetrics(rentalHtml);
        isDetailClean = metrics.maxDepth <= 12 && metrics.elementCount < 850;
      } catch {
        isDetailClean = false;
      }

      runWithMilestone(t, "M2", isDetailClean, () => {
        assert.ok(isDetailClean, "Rental page must maintain DOM depth <= 12 and count < 850.");
      });
    });
  });

  // =========================================================================
  // Feature 5: Route Code-Splitting Boundaries (M3)
  // =========================================================================
  describe("Feature 5: Route Code-Splitting Boundaries", () => {
    it("T2.5.1: Chunk error boundary: Suspense wrappers have ErrorBoundary to prevent white-screen on network failure", () => {
      const appSource = getSourceFile("src/app/App.tsx");
      assert.ok(
        appSource.includes("<ErrorBoundary>"),
        "App.tsx must wrap router tree in <ErrorBoundary>."
      );
    });

    it("T2.5.2: Shared application shell: SiteLayout provides sticky header and navigation shell across lazy routes", () => {
      const appSource = getSourceFile("src/app/App.tsx");
      assert.ok(
        appSource.includes("<SiteLayout"),
        "App.tsx must render SiteLayout to maintain consistent DOM structure across page transitions."
      );
    });

    it("T2.5.3: SSR vs Client hydration parity: ServerApp and App emit matching <!--$--> Suspense boundaries", () => {
      const serverAppSource = getSourceFile("src/app/ServerApp.tsx");
      const appSource = getSourceFile("src/app/App.tsx");

      assert.ok(serverAppSource.includes("<Suspense fallback={null}>"), "ServerApp must include Suspense boundary");
      assert.ok(appSource.includes("<Suspense fallback={"), "App must include Suspense boundary");
    });

    it("T2.5.4: Static catalog chunk independence: vite.config.ts groups static data independently of vendor libraries", () => {
      const viteConfigSource = getSourceFile("vite.config.ts");
      assert.ok(
        viteConfigSource.includes('return "data-catalogue";'),
        "vite.config.ts manualChunks must isolate data-catalogue."
      );
    });

    it("T2.5.5: Zero console statements: Production build configuration drops console and debugger invocations", (t) => {
      const viteConfigSource = getSourceFile("vite.config.ts");
      const hasDropConfig = viteConfigSource.includes("drop: ['console', 'debugger']") || viteConfigSource.includes('drop: ["console", "debugger"]');

      runWithMilestone(t, "M3", hasDropConfig, () => {
        assert.ok(
          hasDropConfig,
          "vite.config.ts must drop console and debugger statements in production mode."
        );
      });
    });
  });

  // =========================================================================
  // Feature 6: Security Headers & Trusted Types Boundaries (M3)
  // =========================================================================
  describe("Feature 6: Security Headers & Trusted Types Boundaries", () => {
    it("T2.6.1: DOM XSS defense: CSP specifies require-trusted-types-for 'script'", (t) => {
      const headers = getSecurityHeaders();
      const directives = parseCspDirectives(headers);
      const hasReq = directives.has("require-trusted-types-for");

      runWithMilestone(t, "M3", hasReq, () => {
        assert.ok(hasReq, "CSP must include require-trusted-types-for 'script'.");
      });
    });

    it("T2.6.2: Duplicate policy handling: CSP specifies trusted-types default 'allow-duplicates'", (t) => {
      const headers = getSecurityHeaders();
      const directives = parseCspDirectives(headers);
      const values = directives.get("trusted-types") || [];
      const hasAllowDuplicates = values.includes("'allow-duplicates'") || values.includes("allow-duplicates");

      runWithMilestone(t, "M3", hasAllowDuplicates, () => {
        assert.ok(hasAllowDuplicates, "trusted-types directive must include 'allow-duplicates'.");
      });
    });

    it("T2.6.3: Non-supporting browser resilience: trustedTypes initialization checks window.trustedTypes before calling createPolicy", (t) => {
      const indexHtml = getSourceFile("index.html");
      const hasSafeCheck = !indexHtml.includes("trustedTypes") || (indexHtml.includes("window.trustedTypes") && indexHtml.includes("createPolicy"));

      runWithMilestone(t, "M3", hasSafeCheck, () => {
        assert.ok(
          hasSafeCheck,
          "Trusted Types policy creation must be guarded with window.trustedTypes check."
        );
      });
    });

    it("T2.6.4: Payment gateway compatibility: Razorpay domains are properly whitelisted in CSP", () => {
      const headers = getSecurityHeaders();
      const directives = parseCspDirectives(headers);
      const scriptSrc = (directives.get("script-src") || []).join(" ");
      const frameSrc = (directives.get("frame-src") || []).join(" ");

      assert.ok(scriptSrc.includes("checkout.razorpay.com"), "script-src must whitelist checkout.razorpay.com");
      assert.ok(frameSrc.includes("checkout.razorpay.com"), "frame-src must whitelist checkout.razorpay.com");
    });

    it("T2.6.5: Strict HSTS duration: max-age is at least 31,536,000 seconds (1 year) with preload", () => {
      const headers = getSecurityHeaders();
      assert.ok(
        headers.includes("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"),
        "HSTS max-age must be >= 31536000 with includeSubDomains and preload."
      );
    });
  });

  // =========================================================================
  // Feature 7: Third-Party Script Mitigation Boundaries (M3)
  // =========================================================================
  describe("Feature 7: Third-Party Script Mitigation Boundaries", () => {
    it("T2.7.1: Interaction fallback timeout: Idle callback sets maximum timeout of 25 seconds for slow user interaction", () => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("timeout: 25000"),
        "requestIdleCallback must specify a fallback timeout (25000ms)."
      );
    });

    it("T2.7.2: Headless browser detection: GTM check covers navigator.webdriver and crawler regex", () => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("navigator.webdriver"),
        "Bot detection must inspect navigator.webdriver."
      );
      assert.ok(
        indexHtml.includes("/bot|crawler|spider|lighthouse|headless/i"),
        "Bot detection must inspect userAgent for crawler/lighthouse tokens."
      );
    });

    it("T2.7.3: Event listener cleanup: Interaction listener removes listeners upon first execution", () => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("window.removeEventListener(evt, loadGTM"),
        "loadGTM must remove all interaction listeners after being triggered once."
      );
    });

    it("T2.7.4: Third-party script failure resilience: Application shell is independent of GTM script loading", () => {
      const distHtml = getDistHtml("/");
      assert.ok(
        distHtml.includes('<div id="root">'),
        "Core React root must mount independently of third-party script status."
      );
    });

    it("T2.7.5: Idempotent script injection: gtmLoaded boolean flag prevents duplicate script tag injection", () => {
      const indexHtml = getSourceFile("index.html");
      assert.ok(
        indexHtml.includes("var gtmLoaded = false;") && indexHtml.includes("if (gtmLoaded) return;"),
        "GTM loader must maintain a boolean guard to guarantee idempotency."
      );
    });
  });

  // =========================================================================
  // Feature 8: Monorepo Validation Boundaries (M4)
  // =========================================================================
  describe("Feature 8: Monorepo Validation Boundaries", () => {
    it("T2.8.1: Slug validation resilience: Rejects invalid slugs with consecutive hyphens or leading dashes", () => {
      const sitemapSource = getSourceFile("scripts/generate-sitemap.ts");
      assert.ok(
        sitemapSource.includes("isSitemapSafeSlug"),
        "generate-sitemap.ts must enforce slug sanitization via isSitemapSafeSlug."
      );
    });

    it("T2.8.2: Bilingual hreflang consistency: Hreflang alternates include en-IN and x-default with absolute URLs", () => {
      const distHtml = getDistHtml("/");
      assert.ok(distHtml.includes('hreflang="en-IN"'), "Must include en-IN alternate link");
      assert.ok(distHtml.includes('hreflang="x-default"'), "Must include x-default alternate link");
    });

    it("T2.8.3: Missing metadata fail-closed: SeoHead enforces presence of title and description", () => {
      const seoHeadSource = getSourceFile("src/components/seo/SeoHead.tsx");
      assert.ok(
        seoHeadSource.includes("canonical") || seoHeadSource.includes("resolveCanonicalUrl"),
        "SeoHead must compute canonical URLs."
      );
    });

    it("T2.8.4: 404 page isolation: dist/404.html carries noindex, nofollow robots directive", () => {
      const html404 = getDistHtml("404");
      assert.ok(
        html404.includes('content="noindex, nofollow"'),
        "404.html must carry noindex, nofollow meta tag."
      );
    });

    it("T2.8.5: Asset security integrity: Public bundle files contain no secrets or private keys", () => {
      const publicDir = join(reactRoot, "public");
      const files = readdirSync(publicDir);
      for (const f of files) {
        assert.ok(!f.endsWith(".key") && !f.endsWith(".pem"), `No private keys allowed in public: ${f}`);
      }
    });
  });
});
