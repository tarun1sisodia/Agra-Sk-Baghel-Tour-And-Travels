#!/usr/bin/env node

/**
 * Render-live check for the deployed customer site (Agra SK Baghel Tour & Travels).
 *
 * Verifies that key pages of the production render are actually LIVE:
 * each URL must resolve (after redirects) to HTTP 200, contain the brand
 * name, and must NOT be the 404 recovery page. Exits 0 only when every
 * checked page renders correctly.
 *
 * Usage:
 *   node scripts/verify-render-live.mjs
 *   RENDER_BASE_URL='https://agraskbagheltourandtravels.com' node scripts/verify-render-live.mjs
 */

const baseUrl = (process.env.RENDER_BASE_URL || "https://agraskbagheltourandtravels.com").replace(/\/$/, "");
const timeoutMs = Number.parseInt(process.env.RENDER_CHECK_TIMEOUT_MS || "20000", 10);
const attempts = Math.max(1, Number.parseInt(process.env.RENDER_CHECK_ATTEMPTS || "2", 10));
const brand = "Agra SK Baghel Tour & Travels";

const pages = [
  "/",
  "/en/routes/",
  "/en/fleet/",
  "/en/monuments/",
  "/en/agra-to-delhi-taxi/",
  "/en/vehicles/sedan/",
  "/en/packages/exclusive-tour-of-agra-for-1-day/",
];

async function checkPage(path) {
  const url = `${baseUrl}${path}`;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "ArenaAI-render-live-check/1.0" },
      });
      const html = await response.text();
      clearTimeout(timer);

      const problems = [];
      if (response.status !== 200) problems.push(`HTTP ${response.status}`);
      if (/404 Page Not Found/i.test(html)) problems.push("renders the 404 page");
      if (!html.includes(brand)) problems.push(`brand name "${brand}" missing`);
      if (!/<h1[\s>]/i.test(html)) problems.push("no H1 rendered");

      return { path, url: response.url, status: response.status, ok: problems.length === 0, problems };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timer);
    }
  }
  return { path, url, status: 0, ok: false, problems: [lastError] };
}

const results = [];
for (const path of pages) {
  results.push(await checkPage(path));
}

for (const result of results) {
  const mark = result.ok ? "✅ LIVE" : "❌ DOWN";
  console.log(`${mark} ${result.path} -> HTTP ${result.status}${result.problems.length ? ` (${result.problems.join("; ")})` : ""}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\nRender-live summary: ${results.length - failed.length}/${results.length} pages live on ${baseUrl}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import("node:fs");
  const status = failed.length === 0 ? "✅ LIVE" : "❌ NOT LIVE";
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Render live status: ${status}\n\nChecked ${results.length} pages on ${baseUrl}: ${results.length - failed.length} live, ${failed.length} down.\n`
  );
}

process.exit(failed.length === 0 ? 0 : 1);
