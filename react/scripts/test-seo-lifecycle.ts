import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateSitemapXml,
  getSitemapEntries,
  HINDI_INDEXING_ENABLED,
  CANONICAL_DOMAIN,
} from "./generate-sitemap.ts";
import { inspectSeoHtml, findDuplicateIntros } from "./seo-content-guardrails.ts";

const jsonLdSource = readFileSync(
  join(fileURLToPath(new URL("..", import.meta.url)), "src/components/seo/JsonLd.tsx"),
  "utf8",
);
assert.match(jsonLdSource, /availability\?: "InStock" \| "LimitedAvailability" \| "OutOfStock"/);
assert.match(jsonLdSource, /options\.offers\.availability \|\| "InStock"/);
assert.doesNotMatch(
  jsonLdSource,
  /availability:\s*"https:\/\/schema\.org\/InStock"/,
  "Structured data must not hard-code InStock for every item.",
);

const sitemap = generateSitemapXml([
  { path: "/en/packages/current/", priority: 0.85, changefreq: "weekly", lastmod: "2026-09-27", hiPath: "/hi/packages/current/" },
  { path: "/en/packages/unchanged/", priority: 0.85, changefreq: "weekly" },
]);
assert.match(sitemap, /<lastmod>2026-09-27<\/lastmod>/);
assert.equal((sitemap.match(/<lastmod>/g) ?? []).length, 1, "Sitemap must omit unknown lastmod values.");
if (HINDI_INDEXING_ENABLED) {
  assert.match(sitemap, /hreflang="hi-IN"/, "Hindi alternates are emitted when Hindi indexing is enabled.");
} else {
  assert.doesNotMatch(sitemap, /hreflang="hi-IN"/, "Hindi alternates must be omitted until Hindi pages are ready.");
}
assert.ok(sitemap.includes(CANONICAL_DOMAIN), "Sitemap must use the configured canonical origin.");
const sitemapEntries = getSitemapEntries();
assert.ok(sitemapEntries.length < 100, `Sitemap should contain only rendered canonical routes, found ${sitemapEntries.length}.`);
assert.equal(sitemapEntries.some((entry) => entry.path.includes("/vehicles/innova/")), false, "Vehicle aliases must stay redirect-only.");
assert.equal(sitemapEntries.some((entry) => entry.path === "/en/agra-to-mathura-taxi-service/"), false, "Redirected legacy taxi aliases must stay out of the sitemap.");
assert.equal(
  sitemapEntries.find((entry) => entry.path === "/en/agra-to-delhi-taxi/")?.hiPath,
  HINDI_INDEXING_ENABLED ? "/hi/agra-se-delhi-taxi/" : undefined,
);
assert.equal(sitemapEntries.some((entry) => entry.path === "/en/"), false, "Duplicate /en/ homepage must not be in the sitemap.");

const quality = inspectSeoHtml(
  "/en/example/",
  '<html><head><title>Example page</title><meta name="description" content="A useful answer."><link rel="canonical" href="https://agraskbagheltourandtravels.com/en/example/"></head><body><main><h1>Example page</h1><p>Answer content with enough detail for a deterministic fixture.</p><a href="/en/routes/">Routes</a><a href="/en/contact/">Contact</a><a href="/en/faq/">FAQ</a></main></body></html>',
  "https://agraskbagheltourandtravels.com",
);
assert.equal(quality.findings.filter((finding) => finding.severity === "error").length, 0);
assert.equal(findDuplicateIntros([{ path: "/a/", intro: "Same intro" }, { path: "/b/", intro: "Same intro" }]).length, 1);

console.log("SEO lifecycle checks passed.");
