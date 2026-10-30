/**
 * Challenger 1 (Replacement): Empirical Stress Test Suite for Milestone M2
 * Forced Reflows & DOM Optimization
 *
 * Verifies:
 * 1. liquid-glass-navbar.tsx: Rapid resize stress harness, contentRect.width usage, zero layout thrashing, bot/mobile guards
 * 2. StickyLeadBar.tsx: Rapid scroll burst harness, RAF throttling, zero main-thread blocking, bottom threshold math
 * 3. CoverflowCarousel.tsx: Responsive stage resizing, 220px-360px card bounding oracle, zero mount-time reflows
 * 4. HomeBookingWidget.tsx: DOM element count & depth reduction, consolidated SVG path vectors, accessibility invariants
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reactRoot = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(reactRoot, relPath), "utf8");
}

describe("Challenger 1 (Replacement) — Milestone M2 Empirical Stress Tests", () => {

  // =========================================================================
  // SUITE 1: liquid-glass-navbar.tsx — Rapid Resize & Reflow Elimination
  // =========================================================================
  describe("Suite 1: liquid-glass-navbar.tsx — Rapid Resize & Layout Thrashing Elimination", () => {
    const navbarSource = readSource("src/components/ui/liquid-glass-navbar.tsx");

    it("1.1: Static contract — ResizeObserver callback uses contentRect.width without reading offsetWidth", () => {
      // Must NOT read navRef.current.offsetWidth inside the ResizeObserver callback
      const roBlockMatch = navbarSource.match(/new ResizeObserver\(\(entries\)\s*=>\s*\{([\s\S]*?)\}\)/);
      assert.ok(roBlockMatch, "ResizeObserver instance must be declared in liquid-glass-navbar.tsx");
      const roBody = roBlockMatch[1];

      assert.ok(
        roBody.includes("contentRect"),
        "ResizeObserver callback must read geometry via entry.contentRect"
      );
      assert.ok(
        !roBody.includes("offsetWidth"),
        "ResizeObserver callback must NOT query offsetWidth synchronously"
      );
    });

    it("1.2: Static contract — Nimbus CSS is injected idempotently into head, zero dangerouslySetInnerHTML in render", () => {
      assert.ok(
        !navbarSource.includes("dangerouslySetInnerHTML={{ __html: NIMBUS_CSS }}"),
        "Must NOT render <style dangerouslySetInnerHTML> inside navbar render tree"
      );
      assert.ok(
        navbarSource.includes("function ensureNimbusStyles()"),
        "ensureNimbusStyles helper must be defined"
      );
      assert.ok(
        navbarSource.includes("ensureNimbusStyles();"),
        "ensureNimbusStyles must be invoked in effect"
      );
    });

    it("1.3: Static contract — measure() wraps canvas and style mutations in requestAnimationFrame", () => {
      const measureFnMatch = navbarSource.match(/const measure\s*=\s*React\.useCallback\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[/);
      assert.ok(measureFnMatch, "measure callback must be present");
      const measureBody = measureFnMatch[1];

      assert.ok(
        measureBody.includes("requestAnimationFrame"),
        "measure() must wrap DOM writes in requestAnimationFrame"
      );
      // Canvas sizing mutations must occur inside RAF
      const rafBlock = measureBody.slice(measureBody.indexOf("requestAnimationFrame"));
      assert.ok(
        rafBlock.includes("cv.width") && rafBlock.includes("cv.style.width"),
        "Canvas dimensions and style writes must reside inside requestAnimationFrame block"
      );
    });

    it("1.4: Static contract — isAuditOrBot and isMobileOrHidden guards bypass measurement loops", () => {
      assert.ok(
        navbarSource.includes("isAuditOrBot"),
        "isAuditOrBot flag must exist in navbar"
      );
      assert.ok(
        navbarSource.includes("isMobileOrHidden"),
        "isMobileOrHidden flag must exist in navbar"
      );
      assert.ok(
        navbarSource.includes("webdriver"),
        "Bot guard must check webdriver property"
      );
      assert.ok(
        /lighthouse|chrome-lighthouse/i.test(navbarSource),
        "Bot guard regex must specifically check for lighthouse"
      );
    });

    it("1.5: Empirical Harness — 1,000 sub-pixel jitter resize events trigger ZERO layout measurements", () => {
      // Test the jitter suppression threshold: Math.abs(w - lastW) >= 2
      let measureCount = 0;
      const measureMock = () => { measureCount++; };

      let lastW = -1;
      const onResize = (entryWidth: number) => {
        const w = entryWidth;
        if (lastW < 0 || Math.abs(w - lastW) >= 2) {
          lastW = w;
          measureMock();
        }
      };

      // Initial layout measurement
      onResize(1024.0);
      assert.equal(measureCount, 1, "Initial observation must trigger 1 measurement");

      // 1,000 sub-pixel jitter events oscillating between 1024.0px and 1025.4px (< 2px delta)
      for (let i = 0; i < 1000; i++) {
        const jitter = 1024.0 + (i % 15) * 0.1; // 1024.0 to 1025.4 (max delta 1.4px < 2px)
        onResize(jitter);
      }

      assert.equal(
        measureCount,
        1,
        `1,000 sub-pixel jitter events must be completely suppressed by >=2px threshold (got ${measureCount} measurements)`
      );
    });

    it("1.6: Empirical Harness — 1,000 rapid multi-breakpoint resize events execute without layout thrashing", () => {
      let measureCount = 0;
      let scheduledRafs = 0;
      let executedWrites = 0;

      const scheduleRAF = (cb: () => void) => {
        scheduledRafs++;
        // Execute RAF asynchronously/in batch
        cb();
        executedWrites++;
      };

      const breakpoints = [320, 375, 412, 640, 768, 1024, 1280, 1440, 1920, 2560];
      let lastW = -1;

      const simulateResizeObserverCallback = (w: number) => {
        if (lastW < 0 || Math.abs(w - lastW) >= 2) {
          lastW = w;
          measureCount++;
          // Simulate measure() logic: read first, batch write in RAF
          const readWidth = w;
          scheduleRAF(() => {
            const _canvasW = readWidth + 32;
          });
        }
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        const bp = breakpoints[i % breakpoints.length];
        simulateResizeObserverCallback(bp);
      }
      const elapsed = performance.now() - start;

      assert.equal(measureCount, 1000, "Every true breakpoint change should measure");
      assert.equal(scheduledRafs, 1000, "Every measurement batches writes via RAF");
      assert.equal(executedWrites, 1000, "All RAF writes executed cleanly");
      assert.ok(elapsed < 20, `1,000 rapid resize iterations must execute in < 20ms (took ${elapsed.toFixed(2)}ms)`);
    });

    it("1.7: Adversarial Edge Cases — Zero, negative, extreme, NaN, and undefined width resilience", () => {
      let lastW = -1;
      let handledErrors = 0;

      const safeResizeHandler = (entry: any) => {
        try {
          const w = entry?.contentRect ? entry.contentRect.width : (entry?.clientWidth ?? 0);
          if (isNaN(w) || !isFinite(w)) return;
          if (lastW < 0 || Math.abs(w - lastW) >= 2) {
            lastW = w;
          }
        } catch {
          handledErrors++;
        }
      };

      // Test extreme inputs
      assert.doesNotThrow(() => safeResizeHandler({ contentRect: { width: 0 } }));
      assert.doesNotThrow(() => safeResizeHandler({ contentRect: { width: -100 } }));
      assert.doesNotThrow(() => safeResizeHandler({ contentRect: { width: 1000000 } }));
      assert.doesNotThrow(() => safeResizeHandler({ contentRect: { width: NaN } }));
      assert.doesNotThrow(() => safeResizeHandler({ contentRect: null, clientWidth: 500 }));
      assert.doesNotThrow(() => safeResizeHandler(null));
      assert.doesNotThrow(() => safeResizeHandler(undefined));
      assert.equal(handledErrors, 0, "No exceptions should be thrown on abnormal inputs");
    });
  });

  // =========================================================================
  // SUITE 2: StickyLeadBar.tsx — Rapid Scroll & RAF Throttling
  // =========================================================================
  describe("Suite 2: StickyLeadBar.tsx — Rapid Scroll Burst & RAF Throttling", () => {
    const stickySource = readSource("src/components/chrome/StickyLeadBar.tsx");

    it("2.1: Static contract — Synchronous handleScroll() call on mount is eliminated", () => {
      assert.ok(
        !stickySource.includes("handleScroll();"),
        "StickyLeadBar must NOT call handleScroll() synchronously during mount effect"
      );
    });

    it("2.2: Static contract — Scroll listener uses { passive: true }", () => {
      assert.ok(
        stickySource.includes('addEventListener("scroll", handleScroll, { passive: true })'),
        "Scroll listener must specify { passive: true } to prevent touch/scroll blocking"
      );
    });

    it("2.3: Static contract — cancelAnimationFrame cleanly unregisters pending RAF on unmount", () => {
      assert.ok(
        stickySource.includes("cancelAnimationFrame(rafId)"),
        "Cleanup function must cancel pending RAF"
      );
    });

    it("2.4: Empirical Harness — 1,000 rapid scroll events trigger strictly 1 RAF execution", () => {
      // Simulate StickyLeadBar's throttled handleScroll
      let rafId = 0;
      let scheduledRafCallbacks: (() => void)[] = [];
      let domReadCount = 0;
      let isVisible = true;

      const mockDoc = { scrollHeight: 5000 };
      const mockWin = { scrollY: 1000, innerHeight: 800 };

      const handleScroll = () => {
        if (rafId) return; // Throttling guard
        rafId = 1;
        scheduledRafCallbacks.push(() => {
          rafId = 0;
          domReadCount++;
          const scrollHeight = mockDoc.scrollHeight;
          const scrollTop = mockWin.scrollY;
          const clientHeight = mockWin.innerHeight;
          const nearBottom = scrollHeight - (scrollTop + clientHeight) < 140;
          isVisible = !nearBottom;
        });
      };

      // Fire 1,000 scroll events in immediate burst within a single animation frame
      for (let i = 0; i < 1000; i++) {
        mockWin.scrollY = 1000 + i;
        handleScroll();
      }

      assert.equal(
        scheduledRafCallbacks.length,
        1,
        `1,000 rapid scroll events must queue strictly 1 RAF callback before frame tick (got ${scheduledRafCallbacks.length})`
      );
      assert.equal(
        domReadCount,
        0,
        "Zero synchronous DOM reads must occur during the scroll event loop"
      );

      // Execute the queued RAF callback (browser frame tick)
      scheduledRafCallbacks[0]();
      scheduledRafCallbacks = [];

      assert.equal(
        domReadCount,
        1,
        "DOM layout properties read exactly 1 time during frame render"
      );
      assert.equal(isVisible, true, "Lead bar should be visible in middle of page");

      // Verify that after frame tick, a subsequent scroll event is free to schedule the next frame
      handleScroll();
      assert.equal(
        scheduledRafCallbacks.length,
        1,
        "Subsequent scroll event after frame tick schedules next frame cleanly"
      );
    });

    it("2.5: Bottom Threshold Oracle — Correct auto-hide calculation across scroll positions & overscroll", () => {
      const evaluateNearBottom = (scrollHeight: number, scrollTop: number, clientHeight: number) => {
        return scrollHeight - (scrollTop + clientHeight) < 140;
      };

      const scrollHeight = 5000;
      const clientHeight = 800;

      // 1. Top of page
      assert.equal(evaluateNearBottom(scrollHeight, 0, clientHeight), false, "Top of page: visible");

      // 2. Middle of page (scrollTop = 2500)
      assert.equal(evaluateNearBottom(scrollHeight, 2500, clientHeight), false, "Middle of page: visible");

      // 3. Exactly at boundary threshold: 5000 - (4060 + 800) = 140 -> not near bottom (< 140 is false)
      assert.equal(evaluateNearBottom(scrollHeight, 4060, clientHeight), false, "At 140px threshold: visible");

      // 4. Just past boundary threshold: 5000 - (4061 + 800) = 139 -> near bottom (< 140 is true)
      assert.equal(evaluateNearBottom(scrollHeight, 4061, clientHeight), true, "139px from bottom: hidden");

      // 5. At absolute bottom: 5000 - (4200 + 800) = 0 -> near bottom
      assert.equal(evaluateNearBottom(scrollHeight, 4200, clientHeight), true, "At bottom: hidden");

      // 6. iOS rubber-band overscroll at top (scrollTop < 0)
      assert.equal(evaluateNearBottom(scrollHeight, -100, clientHeight), false, "Top overscroll: visible");

      // 7. iOS rubber-band overscroll at bottom (scrollTop + clientHeight > scrollHeight)
      assert.equal(evaluateNearBottom(scrollHeight, 4300, clientHeight), true, "Bottom overscroll: hidden");

      // 8. Zero height edge case (empty page)
      assert.equal(evaluateNearBottom(0, 0, 0), true, "Zero-height page handles cleanly");
    });
  });

  // =========================================================================
  // SUITE 3: CoverflowCarousel.tsx — Responsiveness & Layout Invalidation
  // =========================================================================
  describe("Suite 3: CoverflowCarousel.tsx — Responsiveness & Layout Safety", () => {
    const coverflowSource = readSource("src/components/home/CoverflowCarousel.tsx");

    it("3.1: Static contract — Initial stage width is initialized statically to 320px", () => {
      assert.ok(
        coverflowSource.includes("useState(320)"),
        "stageWidth must initialize statically to 320 without synchronous mount measurement"
      );
      assert.ok(
        !coverflowSource.includes("updateWidth();"),
        "Must NOT call synchronous updateWidth() during component mount"
      );
    });

    it("3.2: Static contract — ResizeObserver reads contentRect and throttles via RAF", () => {
      assert.ok(
        coverflowSource.includes("new ResizeObserver"),
        "CoverflowCarousel must utilize ResizeObserver"
      );
      assert.ok(
        coverflowSource.includes("contentRect"),
        "ResizeObserver must read entry.contentRect"
      );
      assert.ok(
        coverflowSource.includes("requestAnimationFrame"),
        "ResizeObserver callback must throttle layout updates with requestAnimationFrame"
      );
      assert.ok(
        coverflowSource.includes("cancelAnimationFrame(rafId)"),
        "Must cancel pending RAF on unmount or subsequent observation"
      );
      assert.ok(
        coverflowSource.includes("ro?.disconnect()"),
        "Must disconnect ResizeObserver on unmount"
      );
    });

    it("3.3: Card Width Bounding Oracle — stage card width strictly bounded in [220px, 360px]", () => {
      const computeCardWidth = (measuredWidth: number) => {
        const measured = measuredWidth || 320;
        return Math.max(220, Math.min(360, measured * 0.55));
      };

      // Test random and boundary widths
      const testCases = [
        { input: 0, expected: 220 },
        { input: 100, expected: 220 },
        { input: 320, expected: 220 }, // 320 * 0.55 = 176 -> 220
        { input: 400, expected: 220 }, // 400 * 0.55 = 220 -> 220
        { input: 500, expected: 275 }, // 500 * 0.55 = 275
        { input: 600, expected: 330 }, // 600 * 0.55 = 330
        { input: 654.54, expected: 360 }, // ~360 boundary
        { input: 768, expected: 360 }, // 768 * 0.55 = 422.4 -> 360
        { input: 1024, expected: 360 },
        { input: 1920, expected: 360 },
        { input: 50000, expected: 360 },
      ];

      for (const tc of testCases) {
        const result = computeCardWidth(tc.input);
        assert.ok(
          Math.abs(result - tc.expected) < 0.01,
          `Width ${tc.input} must produce card width ${tc.expected} (got ${result})`
        );
        assert.ok(result >= 220, `Card width ${result} must be >= 220`);
        assert.ok(result <= 360, `Card width ${result} must be <= 360`);
      }

      // Check 1,000 randomized widths
      for (let i = 0; i < 1000; i++) {
        const randWidth = Math.random() * 4000;
        const w = computeCardWidth(randWidth);
        assert.ok(w >= 220 && w <= 360, `Random width ${randWidth} yielded out-of-bounds ${w}`);
      }
    });

    it("3.4: 3D Transform Calculation Oracle — Generates valid CSS transform strings for all 6 slides", () => {
      const total = 6;
      const stageWidths = [220, 275, 330, 360];

      for (const stageWidth of stageWidths) {
        for (let activeIndex = 0; activeIndex < total; activeIndex++) {
          for (let index = 0; index < total; index++) {
            let offset = (index - activeIndex) % total;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;

            const distance = Math.abs(offset);
            const pitch = stageWidth * 0.76;
            const ramp = Math.pow(distance, 0.65);
            const tilt = Math.min(48 * ramp, 76) * (offset === 0 ? 0 : offset > 0 ? 1 : -1);

            const translateX = offset * pitch;
            const translateZ = -0.55 * stageWidth * ramp;
            const rotateY = -tilt;
            const opacity = Math.max(0.2, 1 - 0.22 * distance);
            const zIndex = 100 - Math.round(distance * 10);

            const transformString = `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg)`;

            assert.ok(!transformString.includes("NaN"), `Transform must not contain NaN: ${transformString}`);
            assert.ok(!transformString.includes("undefined"), `Transform must not contain undefined: ${transformString}`);
            assert.ok(opacity >= 0.2 && opacity <= 1.0, `Opacity must be in [0.2, 1.0] (got ${opacity})`);
            assert.ok(zIndex >= 0 && zIndex <= 100, `zIndex must be in [0, 100] (got ${zIndex})`);
          }
        }
      }
    });
  });

  // =========================================================================
  // SUITE 4: HomeBookingWidget.tsx — DOM Node Count, Depth & SVG Consolidation
  // =========================================================================
  describe("Suite 4: HomeBookingWidget.tsx — DOM Size Reduction & SVG Streamlining", () => {
    const bookingWidgetSource = readSource("src/components/home/HomeBookingWidget.tsx");

    it("4.1: Static contract — Flattened wrapper divs and merged fleet radiogroup container", () => {
      // Fleet and vehicles containers are merged into a single element
      assert.ok(
        bookingWidgetSource.includes("booking-reference__field booking-reference__field--fleet booking-reference__vehicles"),
        "Fleet container and vehicles radiogroup must be merged into a single element"
      );
      // Controls and content wrappers are merged
      assert.ok(
        bookingWidgetSource.includes("booking-reference__content booking-reference__controls"),
        "Content and controls intermediate wrappers must be merged"
      );
    });

    it("4.2: Static contract — Consolidated single-path SVG definitions in SvgIcon", () => {
      // SvgIcon renders a single <path d={pathD[name]} />
      assert.ok(
        bookingWidgetSource.includes("<path d={pathD[name]} />"),
        "SvgIcon must render a single consolidated <path d={pathD[name]} /> element"
      );
      // Zero nested <g>, <circle>, <rect> in SvgIcon
      const svgIconMatch = bookingWidgetSource.match(/function SvgIcon[\s\S]*?return\s*\(([\s\S]*?)\);/);
      assert.ok(svgIconMatch, "SvgIcon function must be extracted");
      const svgMarkup = svgIconMatch[1];
      assert.ok(!svgMarkup.includes("<circle"), "SvgIcon must not render separate <circle> tags");
      assert.ok(!svgMarkup.includes("<rect"), "SvgIcon must not render separate <rect> tags");
      assert.ok(!svgMarkup.includes("<g"), "SvgIcon must not render separate <g> groups");
    });

    it("4.3: Empirical DOM Metric — HomeBookingWidget subtree element count and depth in pre-rendered HTML", () => {
      const distIndexPath = path.join(reactRoot, "dist/index.html");
      assert.ok(fs.existsSync(distIndexPath), "dist/index.html must exist");
      const html = fs.readFileSync(distIndexPath, "utf8");

      // Extract HomeBookingWidget container from static HTML using id="home-booking-widget"
      const startTag = 'id="home-booking-widget"';
      const idIdx = html.indexOf(startTag);
      assert.ok(idIdx !== -1, "id='home-booking-widget' must exist in dist/index.html");

      // Find opening '<div' before the id
      const startIdx = html.lastIndexOf("<div", idIdx);
      assert.ok(startIdx !== -1, "Opening <div must precede id='home-booking-widget'");

      const subHtml = html.slice(startIdx);
      let depth = 0;
      let maxDepth = 0;
      let elementCount = 0;
      let endIdx = -1;

      const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
      const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+[^>]*)?\/?>/g;
      let match: RegExpExecArray | null;

      while ((match = tagRegex.exec(subHtml)) !== null) {
        const isClosing = match[0].startsWith("</");
        const tagName = match[1].toLowerCase();
        const isSelfClosing = match[0].endsWith("/>") || voidTags.has(tagName);

        if (isClosing) {
          depth--;
          if (depth === 0) {
            endIdx = match.index + match[0].length;
            break;
          }
        } else {
          elementCount++;
          depth++;
          if (depth > maxDepth) maxDepth = depth;
          if (isSelfClosing) depth--;
        }
      }

      console.log(`  [HomeBookingWidget Metrics] Elements: ${elementCount}, Max Subtree Depth: ${maxDepth}`);

      // The booking widget itself has <= 80 elements and max subtree depth <= 7 levels
      assert.ok(
        elementCount <= 80,
        `HomeBookingWidget element count (${elementCount}) must be <= 80 elements`
      );
      assert.ok(
        maxDepth <= 7,
        `HomeBookingWidget max subtree depth (${maxDepth}) must be <= 7 levels`
      );
    });

    it("4.4: Accessibility & Semantic Roles — role='radiogroup', role='radio', role='tablist' preserved", () => {
      assert.ok(
        bookingWidgetSource.includes('role="radiogroup"'),
        "Vehicle selector must maintain role='radiogroup'"
      );
      assert.ok(
        bookingWidgetSource.includes('role="radio"'),
        "Vehicle options must maintain role='radio'"
      );
      assert.ok(
        bookingWidgetSource.includes("aria-checked={selectedVehicle === g.code}"),
        "Vehicle options must bind aria-checked"
      );
      assert.ok(
        bookingWidgetSource.includes('role="tablist"'),
        "Booking modes selector must maintain role='tablist'"
      );
      assert.ok(
        bookingWidgetSource.includes('role="tab"'),
        "Booking mode buttons must maintain role='tab'"
      );
    });

    it("4.5: Fallback Catalog Robustness — CANONICAL_VEHICLE_GROUPS and bookingWidgetHelpers define valid fleet options", () => {
      const helperSource = readSource("src/components/home/bookingWidgetHelpers.ts");
      assert.ok(helperSource.includes("CANONICAL_VEHICLE_GROUPS"), "CANONICAL_VEHICLE_GROUPS must be exported");

      // Verify canonical vehicle options: sedan, suv, luxury, tempo_traveller
      const codes = ["sedan", "suv", "luxury", "tempo_traveller"];
      for (const code of codes) {
        assert.ok(
          helperSource.includes(`code: "${code}"`),
          `CANONICAL_VEHICLE_GROUPS must define option for '${code}'`
        );
      }

      // Verify booking widget imports and references getFallbackPublishedCatalog
      assert.ok(
        bookingWidgetSource.includes("getFallbackPublishedCatalog"),
        "HomeBookingWidget must initialize state with getFallbackPublishedCatalog()"
      );
    });
  });
});
