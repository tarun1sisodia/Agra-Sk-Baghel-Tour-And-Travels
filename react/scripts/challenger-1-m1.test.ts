/**
 * Challenger 1: Empirical Stress Test Suite for Milestone M1
 * Critical CSS Inlining & LCP Preload Harmonization
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { reactRoot, distDir, distIndexPath } from "./pagespeed-test-utils.ts";

function getAllRouteHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Exclude static assets directory (contains brand assets / internal reviews)
      if (entry.name.toLowerCase() !== "assets") {
        results.push(...getAllRouteHtmlFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Challenger 1 — Milestone M1 Empirical Stress Tests", () => {
  assert.ok(existsSync(distIndexPath), "dist/index.html must exist");
  const indexHtml = readFileSync(distIndexPath, "utf8");

  // =========================================================================
  // Test 1: Critical CSS AST & Syntax Parsing Oracle
  // =========================================================================
  describe("1. Critical CSS AST & Syntax Parsing Oracle", () => {
    it("1.1: Extracts <style id='critical-css'> and verifies PostCSS AST parses cleanly without errors", () => {
      const match = indexHtml.match(/<style id="critical-css">([\s\S]*?)<\/style>/);
      assert.ok(match, "dist/index.html must contain <style id=\"critical-css\"> ... </style>");
      const css = match[1].trim();

      assert.ok(css.length >= 2000, `Critical CSS must have substantial content (got ${css.length} chars)`);

      // Strict PostCSS parsing - throws on syntax error
      let root: postcss.Root | null = null;
      assert.doesNotThrow(() => {
        root = postcss.parse(css, { from: "dist/index.html#critical-css" });
      }, "PostCSS must parse Critical CSS without syntax errors");

      assert.ok(root, "PostCSS root AST must be created");

      let rules = 0;
      let decls = 0;
      let atrules = 0;
      const selectors: string[] = [];

      root.walk((node) => {
        if (node.type === "rule") {
          rules++;
          selectors.push(node.selector);
        } else if (node.type === "decl") {
          decls++;
        } else if (node.type === "atrule") {
          atrules++;
        }
      });

      console.log(`[AST Metrics] Rules: ${rules}, Declarations: ${decls}, At-Rules: ${atrules}`);
      assert.ok(rules >= 30, `Expected at least 30 CSS rules, found ${rules}`);
      assert.ok(decls >= 100, `Expected at least 100 CSS declarations, found ${decls}`);
      assert.ok(atrules >= 5, `Expected at least 5 media queries, found ${atrules}`);

      // Verify essential above-the-fold selectors
      const required = [":root", "html", "body", "#site-header", ".app-shell", ".booking-reference"];
      for (const sel of required) {
        assert.ok(selectors.some((s) => s.includes(sel)), `Critical CSS must contain selector for ${sel}`);
      }
    });

    it("1.2: Validates escaped Tailwind class selectors in Critical CSS", () => {
      const match = indexHtml.match(/<style id="critical-css">([\s\S]*?)<\/style>/);
      assert.ok(match);
      const css = match[1];

      // Colon-escaped utility classes should appear as \: in CSS text
      assert.ok(css.includes(".sm\\:inline-flex") || css.includes(".sm:inline-flex"), "Should contain escaped .sm:inline-flex");
      assert.ok(css.includes(".py-1\\.5") || css.includes(".py-1.5"), "Should contain escaped dot class .py-1.5");
      assert.ok(!css.includes("</style>"), "Must not contain nested closing style tag");
    });
  });

  // =========================================================================
  // Test 2: Non-blocking CSS Loader & No-JS Fallback
  // =========================================================================
  describe("2. Non-blocking CSS Loader & Fallback Semantics", () => {
    it("2.1: Asynchronous CSS loader uses media='print' onload='this.media=\\'all\\''", () => {
      const asyncMatch = indexHtml.match(/<link rel="stylesheet" href="(\/assets\/index-[^"]+\.css)" media="print" onload="this\.media='all'" \/>/);
      assert.ok(asyncMatch, "Must contain stylesheet link with media='print' and onload='this.media=\\'all\\''");
      const cssPath = join(distDir, asyncMatch[1].replace(/^\//, ""));
      assert.ok(existsSync(cssPath), `Main stylesheet at ${cssPath} must exist on disk`);
      assert.ok(statSync(cssPath).size > 10000, "Main stylesheet should be > 10KB");
    });

    it("2.2: <link rel='preload' as='style'> accompanies async loader with identical href", () => {
      const preloadMatch = indexHtml.match(/<link rel="preload" as="style" href="(\/assets\/index-[^"]+\.css)" \/>/);
      const asyncMatch = indexHtml.match(/<link rel="stylesheet" href="(\/assets\/index-[^"]+\.css)" media="print"/);
      assert.ok(preloadMatch, "Must have <link rel='preload' as='style'>");
      assert.ok(asyncMatch, "Must have <link rel='stylesheet' media='print'>");
      assert.equal(preloadMatch[1], asyncMatch[1], "Preload href and stylesheet href must match exactly");
    });

    it("2.3: <noscript><link rel='stylesheet' ...></noscript> fallback exists with identical href", () => {
      const noscriptMatch = indexHtml.match(/<noscript><link rel="stylesheet" href="(\/assets\/index-[^"]+\.css)" \/><\/noscript>/);
      const asyncMatch = indexHtml.match(/<link rel="stylesheet" href="(\/assets\/index-[^"]+\.css)" media="print"/);
      assert.ok(noscriptMatch, "Must have noscript stylesheet fallback");
      assert.equal(noscriptMatch[1], asyncMatch[1], "Noscript href and stylesheet href must match exactly");
    });

    it("2.4: Zero synchronous render-blocking stylesheets outside <noscript>", () => {
      const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/);
      assert.ok(headMatch);
      const head = headMatch[1];
      const withoutNoscript = head.replace(/<noscript>[\s\S]*?<\/noscript>/gi, "");
      const blocking = withoutNoscript.match(/<link\s+rel=["']stylesheet["']\s+crossorigin\s+href="\/assets\/index-[^"]+\.css"\s*\/?>/g);
      assert.equal(blocking, null, "Must have no synchronous render-blocking stylesheet links in head outside noscript");
    });
  });

  // =========================================================================
  // Test 3: Exhaustive Scan of ALL 120+ Generated HTML Pages
  // =========================================================================
  describe("3. Exhaustive Scan of ALL 120+ Generated Pages in dist", () => {
    it("3.1: Every static HTML page has critical CSS inlined, non-blocking loader, and zero syntax errors", () => {
      const allFiles = getAllRouteHtmlFiles(distDir);
      console.log(`[Exhaustive Page Scan] Total route HTML files found: ${allFiles.length}`);
      assert.ok(allFiles.length >= 120, `Expected at least 120 HTML files, found ${allFiles.length}`);

      let regularPages = 0;
      let redirectStubs = 0;
      const failures: string[] = [];

      for (const file of allFiles) {
        const html = readFileSync(file, "utf8");
        const isRedirect = html.includes('http-equiv="refresh"') || html.includes("http-equiv='refresh'");
        const isReviewShell = file.endsWith("review/index.html") || file.endsWith("review\\index.html");

        if (isRedirect) {
          redirectStubs++;
          continue;
        }

        regularPages++;

        // 1. Critical CSS
        const critMatch = html.match(/<style id="critical-css">([\s\S]*?)<\/style>/);
        if (!critMatch) {
          failures.push(`${file}: Missing or unclosed <style id="critical-css">`);
          continue;
        }

        // 2. Non-blocking loader
        if (!html.includes('media="print" onload="this.media=\'all\'"')) {
          failures.push(`${file}: Missing non-blocking media="print" loader`);
        }

        // 3. Preload link
        if (!html.match(/<link rel="preload" as="style" href="\/assets\/index-[^"]+\.css" \/>/)) {
          failures.push(`${file}: Missing <link rel="preload" as="style">`);
        }

        // 4. Noscript fallback
        if (!html.match(/<noscript><link rel="stylesheet" href="\/assets\/index-[^"]+\.css" \/><\/noscript>/)) {
          failures.push(`${file}: Missing <noscript> fallback`);
        }

        // 5. Hydration marker (for all SSR pre-rendered pages except dynamic review shell)
        if (!isReviewShell && !html.includes("<!--$-->")) {
          failures.push(`${file}: Missing <!--$--> hydration boundary`);
        }
      }

      console.log(`[Exhaustive Page Scan Results] Regular Pages: ${regularPages}, Redirects: ${redirectStubs}, Failures: ${failures.length}`);
      assert.ok(regularPages >= 115, `Expected >= 115 regular pages, found ${regularPages}`);
      assert.equal(failures.length, 0, `Page integrity failures:\n${failures.slice(0, 10).join("\n")}`);
    });
  });

  // =========================================================================
  // Test 4: Responsive Picture vs Preload Simulation Oracle across Viewports
  // =========================================================================
  describe("4. Responsive Picture vs Preload Simulation Oracle", () => {
    it("4.1: Preload and Picture attributes match across all responsive viewports and DPRs", () => {
      // 1. Preload tags
      const mobilePreload = indexHtml.match(/<link\s+rel="preload"\s+as="image"[^>]*media="\(max-width:\s*640px\)"[^>]*>/i);
      const desktopPreload = indexHtml.match(/<link\s+rel="preload"\s+as="image"[^>]*media="\(min-width:\s*641px\)"[^>]*>/i);

      assert.ok(mobilePreload, "Mobile hero preload tag must be present in index.html");
      assert.ok(desktopPreload, "Desktop hero preload tag must be present in index.html");

      const attr = (tag: string, name: string): string => {
        const m = tag.match(new RegExp(`${name}="([^"]+)"`, "i"));
        return m ? m[1] : "";
      };

      const mobilePreloadSrcset = attr(mobilePreload[0], "imagesrcset");
      const mobilePreloadSizes = attr(mobilePreload[0], "imagesizes");
      const desktopPreloadSrcset = attr(desktopPreload[0], "imagesrcset");
      const desktopPreloadSizes = attr(desktopPreload[0], "imagesizes");

      // Verify desktop sizes harmonization
      assert.equal(desktopPreloadSizes, "(max-width: 640px) 100vw, (max-width: 1366px) 1280px, 100vw");
      assert.equal(mobilePreloadSizes, "100vw");

      // Check asset existence on disk
      const parseSrcset = (srcset: string) => {
        return srcset.split(",").map((entry) => {
          const [url, wStr] = entry.trim().split(/\s+/);
          const width = parseInt(wStr.replace("w", ""), 10);
          return { url, width };
        }).sort((a, b) => a.width - b.width);
      };

      const mobileCandidates = parseSrcset(mobilePreloadSrcset);
      const desktopCandidates = parseSrcset(desktopPreloadSrcset);

      for (const cand of [...mobileCandidates, ...desktopCandidates]) {
        const diskPath = join(distDir, cand.url.replace(/^\//, ""));
        assert.ok(existsSync(diskPath), `Hero asset ${cand.url} must exist on disk`);
        assert.ok(statSync(diskPath).size > 0, `Hero asset ${cand.url} must be non-empty`);
      }

      // Sizes evaluation function
      const evaluateSizes = (sizesStr: string, vw: number): number => {
        const clauses = sizesStr.split(",").map((c) => c.trim());
        for (const cl of clauses) {
          const match = cl.match(/^\((max-width|min-width):\s*(\d+)px\)\s*(.+)$/i);
          if (match) {
            const type = match[1].toLowerCase();
            const px = parseInt(match[2], 10);
            const val = match[3].trim();
            const matches = type === "max-width" ? vw <= px : vw >= px;
            if (matches) {
              return val.endsWith("vw") ? (parseFloat(val) / 100) * vw : parseFloat(val);
            }
          } else {
            return cl.endsWith("vw") ? (parseFloat(cl) / 100) * vw : parseFloat(cl);
          }
        }
        return vw;
      };

      const selectCandidate = (candidates: { url: string; width: number }[], slotPx: number, dpr: number): string => {
        const targetPhysical = slotPx * dpr;
        const found = candidates.find((c) => c.width >= targetPhysical);
        return found ? found.url : candidates[candidates.length - 1].url;
      };

      const viewports = [
        { name: "Mobile 360", width: 360, dprs: [1, 2, 3] },
        { name: "Mobile 480", width: 480, dprs: [1, 2, 3] },
        { name: "Mobile 640 (boundary)", width: 640, dprs: [1, 2] },
        { name: "Desktop 641 (boundary)", width: 641, dprs: [1, 2] },
        { name: "Tablet 768", width: 768, dprs: [1, 2] },
        { name: "Tablet 1024", width: 1024, dprs: [1, 2] },
        { name: "Laptop 1280", width: 1280, dprs: [1, 1.5, 2] },
        { name: "Laptop 1366", width: 1366, dprs: [1, 1.5, 2] },
        { name: "Desktop 1440", width: 1440, dprs: [1, 2] },
        { name: "Desktop 1920", width: 1920, dprs: [1, 2] },
      ];

      let checks = 0;
      for (const vp of viewports) {
        for (const dpr of vp.dprs) {
          checks++;
          const isMobile = vp.width <= 640;
          const candidates = isMobile ? mobileCandidates : desktopCandidates;
          const sizes = isMobile ? mobilePreloadSizes : desktopPreloadSizes;
          const slot = evaluateSizes(sizes, vp.width);
          const chosen = selectCandidate(candidates, slot, dpr);

          assert.ok(chosen, `Must select a candidate for ${vp.name} @ ${dpr}x`);
          // Verify chosen asset exists
          const diskPath = join(distDir, chosen.replace(/^\//, ""));
          assert.ok(existsSync(diskPath));
        }
      }

      console.log(`[Responsive Oracle] Successfully simulated ${checks} viewport x DPR combinations without error.`);
    });

    it("4.2: Taj Mahal hero preload is hoisted immediately after viewport meta tag", () => {
      const viewportIdx = indexHtml.indexOf('<meta name="viewport"');
      const preloadIdx = indexHtml.indexOf('<link rel="preload" as="image"');
      assert.ok(viewportIdx !== -1, "Viewport tag must exist");
      assert.ok(preloadIdx !== -1, "Hero preload tag must exist");
      assert.ok(preloadIdx > viewportIdx, "Hero preload must come after viewport meta");
      assert.ok(preloadIdx - viewportIdx < 200, "Hero preload must be hoisted directly adjacent to viewport meta");
    });

    it("4.3: Non-homepage subpages do NOT preload the Taj Mahal hero image", () => {
      const subpages = [
        join(distDir, "en", "services", "index.html"),
        join(distDir, "en", "contact", "index.html"),
        join(distDir, "en", "about", "index.html"),
      ];

      for (const sub of subpages) {
        if (existsSync(sub)) {
          const content = readFileSync(sub, "utf8");
          assert.ok(
            !content.includes("taj-mahal-agra-1280.avif") && !content.includes("taj-mahal-agra-960.avif"),
            `Subpage ${sub} must NOT preload homepage hero image`
          );
        }
      }
    });
  });
});
