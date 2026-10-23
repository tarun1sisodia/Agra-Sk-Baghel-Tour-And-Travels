import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_DOMAIN, HINDI_INDEXING_ENABLED } from "./generate-sitemap.ts";
import { HOME_HERO_SLIDES } from "../src/data/homeHeroSlides.ts";

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

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith("#x")) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    return namedEntities[name.toLowerCase()] ?? entity;
  });
}

function assertPublicHttpsUrl(value: string, description: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(description + " is not an absolute URL: " + value); }
  assert.equal(url.protocol, "https:", description + " must use HTTPS.");
  assert.equal(url.origin, CANONICAL_DOMAIN, description + " must use the canonical origin.");
  assert.equal(url.search, "", description + " must not contain a query string.");
  assert.equal(url.hash, "", description + " must not contain a fragment.");
  const isApprovedWorkersDev = CANONICAL_DOMAIN.includes(".workers.dev");
  const disallowedPattern = isApprovedWorkersDev ? /localhost|127\.0\.0\.1/i : /workers\.dev|localhost|127\.0\.0\.1/i;
  assert.equal(disallowedPattern.test(url.hostname), false, description + " must not use a preview or loopback hostname.");
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
  const isApprovedWorkersDev = CANONICAL_DOMAIN.includes(".workers.dev");
  const disallowedRobotsPattern = isApprovedWorkersDev ? /localhost|127\.0\.0\.1/i : /workers\.dev|localhost|127\.0\.0\.1/i;
  assert.equal(disallowedRobotsPattern.test(robots), false, "robots.txt must not reference a preview or loopback host.");

  const locValues = Array.from(sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi), (match) => match[1]!.trim());
  assert.ok(locValues.length > 0, "The sitemap must contain at least one URL.");
  assert.equal(new Set(locValues).size, locValues.length, "Sitemap loc URLs must be unique.");
  for (const alias of ["/en/privacy/", "/en/terms/", "/en/agra-to-mathura-taxi-service/"]) {
    assert.equal(locValues.some((loc) => new URL(loc).pathname === alias), false,
      "A redirected legacy alias must not be listed in the sitemap: " + alias);
  }
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
  const indexableTitles = new Map<string, string>();
  for (const url of sitemapUrls) {
    const path = await assertArtifactExists(url, "Sitemap URL");
    sitemapArtifacts.set(url.href, path);
    const html = await readFile(path, "utf8");
    const titleTags = tags(html, /<title>[\s\S]*?<\/title>/gi);
    assert.equal(titleTags.length, 1, "Indexable sitemap artifact must contain exactly one title: " + url.href);
    const title = decodeHtmlEntities(titleTags[0]!.replace(/^<title>|<\/title>$/gi, "")).trim();
    assert.ok(title.length > 0 && title.length <= 60, "Indexable page title must contain 1–60 characters: " + url.href);
    indexableTitles.set(url.href, title);
    const canonicalTags = tags(html, /<link\b[^>]*\brel=["\']canonical["\'][^>]*>/gi);
    assert.equal(canonicalTags.length, 1, "Indexable sitemap artifact must contain exactly one canonical tag: " + url.href);
    const canonicalValue = attribute(canonicalTags[0]!, "href");
    assert.ok(canonicalValue, "Canonical tag must have an href: " + url.href);
    assert.equal(assertPublicHttpsUrl(canonicalValue, "Canonical URL").href, url.href, "Sitemap URL and page canonical must match.");
    const robotsTags = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi);
    const robotsContent = robotsTags.map((tag) => attribute(tag, "content") ?? "").join(" ");
    assert.equal(/noindex/i.test(robotsContent), false, "Sitemap must not include a noindex page: " + url.href);
  }
  assert.equal(new Set(indexableTitles.values()).size, indexableTitles.size,
    "Indexable sitemap pages must have distinct titles.");

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
    assert.equal(disallowedRobotsPattern.test(canonicalValue), false, "Canonical URL must not contain a preview host: " + relPath);
    const pageRobots = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi).map((tag) => attribute(tag, "content") ?? "").join(" ");
    const indexable = !/noindex/i.test(pageRobots);
    if (indexable) {
      for (const imageTag of tags(html, /<img\b[^>]*>/gi)) {
        const alt = attribute(imageTag, "alt");
        const src = attribute(imageTag, "src") ?? "";
        // The initial hero is inside an aria-hidden picture and is intentionally decorative.
        assert.ok(alt?.trim() || src.startsWith("/assets/home-hero/"),
          "Indexable page image must have meaningful alt text or be an approved decorative hero: " + relPath + " " + src);
      }
    }
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

  const privateUtilityPaths = [
    "/auth/callback/",
    "/auth/login/",
    "/booking/confirmation/",
    "/login/",
    "/my-bookings/",
    "/payment/resume/",
    "/book.html",
    "/book/",
    "/en/book/",
  ];
  for (const pathname of privateUtilityPaths) {
    const artifact = await assertArtifactExists(new URL(pathname, CANONICAL_DOMAIN), "Private utility route");
    const html = await readFile(artifact, "utf8");
    const robotsContent = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi)
      .map((tag) => attribute(tag, "content") ?? "")
      .join(" ");
    assert.match(robotsContent, /noindex/i, "Private utility route must be noindex: " + pathname);
  }

  for (const pathname of ["/en/privacy/", "/en/terms/"]) {
    const artifact = await assertArtifactExists(new URL(pathname, CANONICAL_DOMAIN), "Legacy legal alias");
    const html = await readFile(artifact, "utf8");
    const robotsContent = tags(html, /<meta\b[^>]*\bname=["\']robots["\'][^>]*>/gi)
      .map((tag) => attribute(tag, "content") ?? "")
      .join(" ");
    assert.match(robotsContent, /noindex/i, "Legacy legal alias must be noindex: " + pathname);
  }

  const redirectRules = await readFile(join(distDir, "_redirects"), "utf8");
  for (const rule of [
    "/en/privacy /privacy-policy/ 301",
    "/en/terms /terms-and-conditions/ 301",
    "/en/agra-to-mathura-taxi-service /en/agra-to-mathura-taxi/ 301",
  ]) {
    assert.ok(redirectRules.split(/\r?\n/).includes(rule), "Missing Cloudflare Pages redirect: " + rule);
  }

  const homeHtml = await readFile(join(distDir, "index.html"), "utf8");
  for (const href of ["/favicon.ico", "/icon-192.png", "/apple-touch-icon.png"]) {
    assert.ok(homeHtml.includes(`href="${href}"`), "Homepage must reference icon asset: " + href);
    await access(join(distDir, href.slice(1)));
  }
  const firstHero = HOME_HERO_SLIDES[0];
  assert.ok(firstHero, "The homepage needs a first hero slide for preload validation.");
  const imagePreloads = tags(homeHtml, /<link\b[^>]*\brel=["\']preload["\'][^>]*\bas=["\']image["\'][^>]*>/gi);
  const mobileHeroPreload = imagePreloads.find((tag) => attribute(tag, "media") === "(max-width: 640px)");
  assert.ok(mobileHeroPreload, "Homepage must preload the mobile hero image.");
  assert.equal(attribute(mobileHeroPreload, "href"), firstHero.avif.small, "Mobile hero preload must use the initial slide's small AVIF.");
  assert.equal(attribute(mobileHeroPreload, "type"), "image/avif", "Mobile hero preload must declare AVIF.");
  assert.equal(attribute(mobileHeroPreload, "imagesrcset"), `${firstHero.avif.small} 480w, ${firstHero.avif.medium} 960w`,
    "Mobile hero preload must match the rendered AVIF srcset.");
  const desktopHeroPreload = imagePreloads.find((tag) => attribute(tag, "media") === "(min-width: 641px)");
  assert.ok(desktopHeroPreload, "Homepage must preload the desktop hero image.");
  assert.equal(attribute(desktopHeroPreload, "href"), firstHero.avif.medium, "Desktop hero preload must use the initial slide's medium AVIF.");

  const monumentsIndex = await readFile(artifactPathForUrl(new URL("/en/monuments/", CANONICAL_DOMAIN)), "utf8");
  const monumentLinks = Array.from(
    monumentsIndex.matchAll(/href=["\'](\/en\/monuments\/[a-z0-9-]+\/["\'])/gi),
    (match) => match[1]!.slice(0, -1),
  );
  assert.ok(monumentLinks.length > 0, "The monuments index must link to at least one published monument detail.");
  for (const href of monumentLinks) {
    await assertArtifactExists(new URL(href, CANONICAL_DOMAIN), "Published monument card link");
  }

  const contactHtml = await readFile(artifactPathForUrl(new URL("/en/contact/", CANONICAL_DOMAIN)), "utf8");
  assert.match(contactHtml, /<iframe\b[^>]*title="Map of the Taj Ganj area[^\"]*"[^>]*loading="lazy"/i,
    "The contact map must be titled and lazy-loaded.");

  const termsHtml = await readFile(artifactPathForUrl(new URL("/terms-and-conditions/", CANONICAL_DOMAIN)), "utf8");
  assert.match(termsHtml, /<p class="mt-1[^\"]*">Refund timeline:/i,
    "Applicable cancellation slabs must show their refund timeline visibly.");

  const notFoundHtml = await readFile(join(distDir, "404.html"), "utf8");
  assert.match(notFoundHtml, /href="tel:\+919762817598"/i, "The 404 page must include a direct call action.");
  assert.match(notFoundHtml, /https:\/\/wa\.me\/919762817598\?text=/i, "The 404 page must include a prefilled WhatsApp action.");
  for (const pathname of [
    "/",
    "/en/packages/taj-mahal-sunrise-tour/",
    "/en/agra-to-delhi-taxi/",
    "/en/agra-to-jaipur-taxi/",
    "/en/fleet/",
    "/en/packages/",
    "/en/contact/",
  ]) {
    assert.ok(notFoundHtml.includes(`href="${pathname}"`), "404 recovery links must use the intended route: " + pathname);
    await assertArtifactExists(new URL(pathname, CANONICAL_DOMAIN), "404 recovery target");
  }

  console.log("SEO artifact checks passed: " + htmlFiles.length + " HTML files, " + sitemapUrls.length + " sitemap URLs, canonical origin " + CANONICAL_DOMAIN + ".");
}

main().catch((error) => {
  console.error("SEO artifact validation failed:", error);
  process.exitCode = 1;
});
