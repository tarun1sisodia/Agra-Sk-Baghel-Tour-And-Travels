import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_DOMAIN, HINDI_INDEXING_ENABLED } from "./generate-sitemap.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(scriptDir, "..", "dist");

async function walkHtml(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    // Asset directories may contain defensive index.html files that are not route documents.
    if (item.isDirectory() && item.name.toLowerCase() !== "assets") found.push(...await walkHtml(path));
    else if (item.isFile() && item.name.toLowerCase().endsWith(".html")) found.push(path);
  }
  return found;
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp("\\b" + name + "=[\"\']([^\"\']*)[\"\']", "i"));
  return match?.[1];
}

function tags(html: string, pattern: RegExp): string[] {
  return Array.from(html.matchAll(pattern), (match) => match[0]);
}

function assertPublicHttpsUrl(value: string, description: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(description + " is not an absolute URL: " + value); }
  assert.equal(url.protocol, "https:", description + " must use HTTPS.");
  assert.equal(url.origin, CANONICAL_DOMAIN, description + " must use the canonical origin.");
  assert.equal(url.search, "", description + " must not contain a query string.");
  assert.equal(url.hash, "", description + " must not contain a fragment.");
  assert.equal(/workers\.dev|localhost|127\.0\.0\.1/i.test(url.hostname), false, description + " must not use a preview or loopback hostname.");
  return url;
}

function artifactPathForUrl(url: URL): string {
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") return join(distDir, "index.html");
  if (pathname.endsWith(".html")) return join(distDir, pathname.slice(1));
  const relativePath = pathname.replace(/^\/+|\/+$/g, "");
  return join(distDir, relativePath, "index.html");
}

async function assertArtifactExists(url: URL, description: string): Promise<string> {
  const path = artifactPathForUrl(url);
  try { await access(path); } catch { throw new Error(description + " has no built HTML artifact: " + url.href); }
  return path;
}

async function main(): Promise<void> {
  const sitemapPath = join(distDir, "sitemap.xml");
  const robotsPath = join(distDir, "robots.txt");
  const sitemap = await readFile(sitemapPath, "utf8");
  const robots = await readFile(robotsPath, "utf8");

  assert.ok(robots.split(/\r?\n/).some((line) => line.trim() === "Sitemap: " + CANONICAL_DOMAIN + "/sitemap.xml"),
    "robots.txt must reference the canonical sitemap URL.");
  assert.equal(/workers\.dev|localhost|127\.0\.0\.1/i.test(robots), false, "robots.txt must not reference a preview or loopback host.");

  const locValues = Array.from(sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi), (match) => match[1]!.trim());
  assert.ok(locValues.length > 0, "The sitemap must contain at least one URL.");
  assert.equal(new Set(locValues).size, locValues.length, "Sitemap loc URLs must be unique.");
  const alternateLinks = Array.from(sitemap.matchAll(/hreflang=["\']([^"\']+)["\']\s+href=["\']([^"\']+)["\']/gi), (match) => ({
    language: match[1]!,
    href: match[2]!,
  }));
  if (!HINDI_INDEXING_ENABLED) {
    assert.equal(alternateLinks.some((entry) => entry.language === "hi-IN"), false, "Hindi alternates must remain disabled until Hindi pages are deployable.");
    assert.equal(locValues.some((loc) => new URL(loc).pathname === "/hi/" || new URL(loc).pathname.startsWith("/hi/")), false, "Hindi URLs must not be indexed while Hindi indexing is disabled.");
  }

  const sitemapUrls = locValues.map((value) => assertPublicHttpsUrl(value, "Sitemap loc URL"));
  const sitemapArtifacts = new Map<string, string>();
  for (const url of sitemapUrls) {
    const path = await assertArtifactExists(url, "Sitemap URL");
    sitemapArtifacts.set(url.href, path);
    const html = await readFile(path, "utf8");
    const canonicalTags = tags(html, /<link\b[^>]*\brel=["\']canonical["\'][^>]*>/gi);
    assert.equal(canonicalTags.length, 1, "Indexable sitemap artifact must contain exactly one canonical tag: " + url.href);
    const canonicalValue = attribute(canonicalTags[0]!, "href");
    assert.ok(canonicalValue, "Canonical tag must have an href: " + url.href);
    assert.equal(assertPublicHttpsUrl(canonicalValue, "Canonical URL").href, url.href, "Sitemap URL and page canonical must match.");
    const robotsTags = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi);
    const robotsContent = robotsTags.map((tag) => attribute(tag, "content") ?? "").join(" ");
    assert.equal(/noindex/i.test(robotsContent), false, "Sitemap must not include a noindex page: " + url.href);
  }

  for (const alternate of alternateLinks) {
    const url = assertPublicHttpsUrl(alternate.href, "Sitemap hreflang URL");
    const artifact = await assertArtifactExists(url, "Sitemap hreflang alternate");
    const html = await readFile(artifact, "utf8");
    assert.equal(/noindex/i.test(tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi).map((tag) => attribute(tag, "content") ?? "").join(" ")), false, "Sitemap alternate must be indexable: " + url.href);
  }

  const htmlFiles = await walkHtml(distDir);
  assert.ok(htmlFiles.length > 0, "No HTML output was found in dist.");
  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const relPath = relative(distDir, path).split(sep).join("/");
    const canonicalTags = tags(html, /<link\b[^>]*\brel=["\']canonical["\'][^>]*>/gi);
    assert.equal(canonicalTags.length, 1, "Every prerendered HTML artifact must contain exactly one canonical tag: " + relPath);
    const canonicalValue = attribute(canonicalTags[0]!, "href");
    assert.ok(canonicalValue, "Canonical tag must have an href: " + relPath);
    assertPublicHttpsUrl(canonicalValue, "Canonical URL in " + relPath);
    assert.equal(/workers\.dev|localhost|127\.0\.0\.1/i.test(canonicalValue), false, "Canonical URL must not contain a preview host: " + relPath);
    const pageRobots = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi).map((tag) => attribute(tag, "content") ?? "").join(" ");
    const indexable = !/noindex/i.test(pageRobots);
    const ogUrlTags = tags(html, /<meta\b[^>]*\bproperty=["\']og:url["\'][^>]*>/gi);
    if (indexable) {
      assert.equal(ogUrlTags.length, 1, "Every indexable HTML artifact must contain exactly one og:url tag: " + relPath);
      const ogValue = attribute(ogUrlTags[0]!, "content");
      assert.ok(ogValue, "og:url must have content: " + relPath);
      assert.equal(assertPublicHttpsUrl(ogValue, "og:url in " + relPath).href, canonicalValue, "og:url must match canonical URL: " + relPath);
    }
    const alternateTags = tags(html, /<link\b[^>]*\bhreflang=["\'][^"\']+["\'][^>]*>/gi);
    for (const tag of alternateTags) {
      const href = attribute(tag, "href");
      if (href) assertPublicHttpsUrl(href, "HTML hreflang in " + relPath);
    }
    if (!HINDI_INDEXING_ENABLED) {
      assert.equal(alternateTags.some((tag) => attribute(tag, "hreflang") === "hi-IN"), false, "HTML must not advertise Hindi alternates while Hindi indexing is disabled: " + relPath);
    }
  }

  console.log("SEO artifact checks passed: " + htmlFiles.length + " HTML files, " + sitemapUrls.length + " sitemap URLs, canonical origin " + CANONICAL_DOMAIN + ".");
}

main().catch((error) => {
  console.error("SEO artifact validation failed:", error);
  process.exitCode = 1;
});