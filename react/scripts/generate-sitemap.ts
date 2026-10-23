/**
 * XML Sitemap & Robots Generator (Step R5.27)
 *
 * Generates valid Schema-compliant XML sitemaps with:
 * 1. Fully-qualified canonical URLs for all indexable bilingual routes.
 * 2. Multi-language xhtml:link hreflang alternates (en-IN, hi-IN, x-default).
 * 3. Source-owned lastmod timestamps (YYYY-MM-DD) when available, crawl priorities and change frequencies.
 * 4. Robots.txt directing crawlers to the sitemap while guarding noindex routes.
 *
 * Outputs to dist/react/sitemap.xml, react/dist/sitemap.xml, react/public/sitemap.xml,
 * and workspace roots.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_LANDING_SLUGS } from "../src/data/seoLandingSlugs.ts";
import {
  isHindiIndexingEnabled,
  resolveSiteOrigin,
  type SiteOriginMode,
} from "../src/config/siteOrigin.ts";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = dirname(__filename);
const reactRoot = join(scriptsDir, "..");

const configuredOrigin = process.env.VITE_SITE_URL?.trim();
const SITE_ORIGIN_MODE: SiteOriginMode =
  process.env.VITE_SITE_MODE === "preview" || (configuredOrigin && (configuredOrigin.includes(".workers.dev") || configuredOrigin.includes(".pages.dev")))
    ? "preview"
    : process.env.VITE_SITE_MODE === "production" ||
      process.env.CF_PAGES_BRANCH === "main" ||
      process.env.RELEASE_BUILD === "1"
    ? "production"
    : process.env.CF_PAGES_BRANCH
    ? "preview"
    : "development";

export const CANONICAL_DOMAIN = resolveSiteOrigin(process.env.VITE_SITE_URL, SITE_ORIGIN_MODE);
export const HINDI_INDEXING_ENABLED = isHindiIndexingEnabled(process.env.VITE_HINDI_INDEXING_ENABLED);

export interface SitemapEntry {
  path: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly";
  /** Set only from a real content update timestamp, never from build time. */
  lastmod?: string;
  enPath?: string;
  hiPath?: string;
}

// Legacy redirect stubs must never be advertised as canonical sitemap URLs,
// even if an old catalog snapshot still contains their slug.
const REDIRECT_ONLY_PATHS = new Set(["/en/agra-to-mathura-taxi-service/"]);

export function isSitemapSafeSlug(slug: unknown): slug is string {
  if (typeof slug !== "string") return false;
  const s = slug.trim();
  if (!/^[a-z0-9-]{2,80}$/.test(s)) return false;
  if (/^\d+-btn-/.test(s)) return false;
  if (/command/i.test(s)) return false;
  if (/--/.test(s)) return false;
  if (s.startsWith("-") || s.endsWith("-")) return false;
  return true;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPublishedCatalogEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-catalog.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      type?: string;
      slug?: string;
      status?: string;
      updatedAt?: string | null;
      publishedAt?: string | null;
    }>;
    return snapshot
      .filter((item) => (!item.status || item.status === "published") && (item.type === "package" || item.type === "tour" || item.type === "transfer") && isSitemapSafeSlug(item.slug))
      .map((item) => {
        const prefix = item.type === "tour" ? "local-packages" : item.type === "transfer" ? "transfers" : "packages";
        return {
          path: `/en/${prefix}/${item.slug}/`,
          hiPath: `/hi/${prefix}/${item.slug}/`,
          enPath: `/en/${prefix}/${item.slug}/`,
          priority: 0.85,
          changefreq: "weekly" as const,
          lastmod: (item.updatedAt || item.publishedAt || undefined)?.slice(0, 10),
        };
      });
  } catch {
    return [];
  }
}

function getPublishedRouteEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-routes.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{ slug?: string; status?: string; updatedAt?: string | null }>;
    return snapshot
      .filter((item) => (!item.status || item.status === "published") && isSitemapSafeSlug(item.slug))
      .map((item) => ({
        path: `/en/${item.slug}/`,
        hiPath: `/hi/${item.slug}/`,
        enPath: `/en/${item.slug}/`,
        priority: 0.85,
        changefreq: "weekly" as const,
        lastmod: item.updatedAt?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

function getPublishedTourPackageEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-tour-packages.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      packageCode?: string;
      package_code?: string;
      status?: string;
      updatedAt?: string | null;
      updated_at?: string | null;
      publishedAt?: string | null;
    }>;
    return snapshot
      .map((item) => ({ item, slug: String(item.slug ?? item.packageCode ?? item.package_code ?? "") }))
      .filter(({ item, slug }) => {
        if (!isSitemapSafeSlug(slug)) return false;
        if (item.status && item.status !== "published") return false;
        return true;
      })
      .map(({ item, slug }) => ({
        path: `/en/packages/${slug}/`,
        hiPath: `/hi/packages/${slug}/`,
        enPath: `/en/packages/${slug}/`,
        priority: item.status === "archived" ? 0.6 : 0.8,
        changefreq: (item.status === "archived" ? "monthly" : "weekly"),
        lastmod: (item.updatedAt || item.updated_at || item.publishedAt || undefined)?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

function getPublishedTransferRouteEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-transfer-routes.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      routeCode?: string;
      route_code?: string;
      status?: string;
      updatedAt?: string | null;
      updated_at?: string | null;
    }>;
    return snapshot
      .map((item) => ({ item, slug: String(item.slug ?? item.routeCode ?? item.route_code ?? "") }))
      .filter(({ item, slug }) => {
        if (!isSitemapSafeSlug(slug)) return false;
        if (item.status && item.status !== "published") return false;
        return true;
      })
      .map(({ item, slug }) => ({
        path: `/en/transfers/${slug}/`,
        hiPath: `/hi/transfers/${slug}/`,
        enPath: `/en/transfers/${slug}/`,
        priority: item.status === "archived" ? 0.6 : 0.7,
        changefreq: (item.status === "archived" ? "monthly" : "weekly"),
        lastmod: (item.updatedAt || item.updated_at || undefined)?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

function getPublishedLocalPackageEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-local-packages.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
      slug?: string;
      packageCode?: string;
      package_code?: string;
      status?: string;
      updatedAt?: string | null;
      updated_at?: string | null;
    }>;
    return snapshot
      .map((item) => ({ item, slug: String(item.slug ?? item.packageCode ?? item.package_code ?? "") }))
      .filter(({ item, slug }) => {
        if (!isSitemapSafeSlug(slug)) return false;
        if (item.status && item.status !== "published") return false;
        return true;
      })
      .map(({ item, slug }) => ({
        path: `/en/local-packages/${slug}/`,
        hiPath: `/hi/local-packages/${slug}/`,
        enPath: `/en/local-packages/${slug}/`,
        priority: item.status === "archived" ? 0.6 : 0.7,
        changefreq: (item.status === "archived" ? "monthly" : "weekly"),
        lastmod: (item.updatedAt || item.updated_at || undefined)?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

function getPublishedMonumentEntries(): SitemapEntry[] {
  const snapshotPath = join(reactRoot, "src", "data", "generated-published-content.json");
  if (!existsSync(snapshotPath)) return [];
  try {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
      monuments?: Array<{
        name?: string;
        slug?: string;
        monumentCode?: string;
        monument_code?: string;
        status?: string;
        updatedAt?: string | null;
        updated_at?: string | null;
      }>;
    };
    const list = Array.isArray(snapshot.monuments) ? snapshot.monuments : [];
    return list
      .map((item) => {
        const rawSlug = item.slug ?? item.monumentCode ?? item.monument_code ?? (item.name ? slugify(item.name) : "");
        return { item, slug: String(rawSlug) };
      })
      .filter(({ item, slug }) => {
        if (!isSitemapSafeSlug(slug)) return false;
        if (item.status && item.status !== "published") return false;
        return true;
      })
      .map(({ item, slug }) => ({
        path: `/en/monuments/${slug}/`,
        hiPath: `/hi/monuments/${slug}/`,
        enPath: `/en/monuments/${slug}/`,
        priority: 0.5,
        changefreq: "monthly" as const,
        lastmod: (item.updatedAt || item.updated_at || undefined)?.slice(0, 10),
      }));
  } catch {
    return [];
  }
}

// Public marketing hubs. Privacy and terms use their standalone canonical URLs below.
const hubSlugs = [
  "services",
  "routes",
  "packages",
  "monuments",
  "fleet",
  "about",
  "contact",
  "faq",
];

// 5 Fleet Vehicles
const vehicleSlugs = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
];

// 6 Tour Packages
const packageSlugs = [
  "taj-mahal-sunrise-tour",
  "agra-sightseeing",
  "agra-unhurried",
  "mathura-vrindavan",
  "gatimaan-express-agra-tour",
  "golden-triangle",
];

// 8 Route Pairs (English and Hindi transliterated pairs)
const routePairs: Array<{ en: string; hi: string }> = [
  { en: "agra-to-delhi-taxi", hi: "agra-se-delhi-taxi" },
  { en: "delhi-to-agra-taxi", hi: "delhi-se-agra-taxi" },
  { en: "agra-to-jaipur-taxi", hi: "agra-se-jaipur-taxi" },
  { en: "delhi-to-jaipur-taxi", hi: "delhi-se-jaipur-taxi" },
  { en: "agra-to-gwalior-taxi", hi: "agra-se-gwalior-taxi" },
  { en: "agra-to-lucknow-taxi", hi: "agra-se-lucknow-taxi" },
  { en: "agra-to-mathura-taxi", hi: "agra-se-mathura-taxi" },
  { en: "agra-sightseeing-taxi", hi: "agra-darshan-taxi" },
];

export function getSitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    // 1. Home Pages
    {
      path: "/",
      priority: 1.0,
      changefreq: "daily",
      enPath: "/",
      hiPath: "/hi/",
    },
  ];

  // 2. Hubs (English)
  for (const hub of hubSlugs) {
    entries.push({
      path: `/en/${hub}/`,
      priority: 0.9,
      changefreq: "weekly",
      enPath: `/en/${hub}/`,
      hiPath: `/hi/${hub}/`,
    });
  }

  // Public legal pages used by the website footer and Google OAuth verification.
  for (const path of ["/privacy-policy/", "/terms-and-conditions/"]) {
    entries.push({
      path,
      priority: 0.7,
      changefreq: "monthly",
      enPath: path,
    });
  }

  // 2b. Taxi Rental
  entries.push({
    path: "/en/taxis/rent/",
    priority: 0.9,
    changefreq: "weekly",
    enPath: "/en/taxis/rent/",
    hiPath: "/hi/taxis/rent/",
  });

  // 3. Vehicles (English)
  for (const veh of vehicleSlugs) {
    entries.push({
      path: `/en/vehicles/${veh}/`,
      priority: 0.85,
      changefreq: "weekly",
      enPath: `/en/vehicles/${veh}/`,
      hiPath: `/hi/vehicles/${veh}/`,
    });
  }

  // 4. Packages (English)
  for (const pkg of packageSlugs) {
    entries.push({
      path: `/en/packages/${pkg}/`,
      priority: 0.85,
      changefreq: "weekly",
      enPath: `/en/packages/${pkg}/`,
      hiPath: `/hi/packages/${pkg}/`,
    });
  }

  // 5. Routes (English)
  const existingPaths = new Set(entries.map((e) => e.path));
  for (const pair of routePairs) {
    const p = `/en/${pair.en}/`;
    if (!existingPaths.has(p)) {
      existingPaths.add(p);
      entries.push({
        path: p,
        priority: 0.85,
        changefreq: "weekly",
        enPath: p,
        hiPath: `/hi/${pair.hi}/`,
      });
    }
  }

  for (const slug of SEO_LANDING_SLUGS) {
    const p = `/en/${slug}/`;
    if (!existingPaths.has(p)) {
      existingPaths.add(p);
      entries.push({ path: p, priority: 0.9, changefreq: "weekly", enPath: p, hiPath: `/hi/${slug}/` });
    }
  }

  // Only catalog items that are included in the SSG snapshot are eligible for
  // the sitemap. This keeps unpublished/draft items out and prevents the old
  // locality inventory from becoming a thin-content indexation expansion.
  for (const entry of getPublishedCatalogEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedRouteEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedTourPackageEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedTransferRouteEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedLocalPackageEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }
  for (const entry of getPublishedMonumentEntries()) {
    if (!existingPaths.has(entry.path)) {
      existingPaths.add(entry.path);
      entries.push(entry);
    }
  }

  const canonicalEntries = entries.filter((entry) => !REDIRECT_ONLY_PATHS.has(entry.path));
  return HINDI_INDEXING_ENABLED
    ? canonicalEntries
    : canonicalEntries.map((entry) => ({ ...entry, hiPath: undefined }));
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const xmlUrls = entries.map((entry) => {
    const loc = `${CANONICAL_DOMAIN}${entry.path}`;
    const enUrl = entry.enPath ? `${CANONICAL_DOMAIN}${entry.enPath}` : loc;
    const lines = [
      "  <url>",
      `    <loc>${loc}</loc>`,
      ...(entry.lastmod ? [`    <lastmod>${entry.lastmod}</lastmod>`] : []),
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority.toFixed(2)}</priority>`,
      `    <xhtml:link rel="alternate" hreflang="en-IN" href="${enUrl}" />`,
      ...(HINDI_INDEXING_ENABLED && entry.hiPath
        ? [`    <xhtml:link rel="alternate" hreflang="hi-IN" href="${CANONICAL_DOMAIN}${entry.hiPath}" />`]
        : []),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
      "  </url>",
    ];
    return lines.join("\n");
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlUrls}
</urlset>
`;
}

export function generateRobotsTxt(): string {
  return `# Robots.txt — Agra SK Baghel Tour and Travels Agra
User-agent: *
Allow: /
Disallow: /book.html
Disallow: /404.html
Disallow: /design-guide/

# Sitemaps
Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml
`;
}

function hasBuiltArtifact(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const artifact = pathname.endsWith(".html")
    ? join(reactRoot, "dist", cleanPath)
    : join(reactRoot, "dist", cleanPath, "index.html");
  return existsSync(artifact);
}

export async function generateSitemapAndRobots(options: { requireBuiltArtifacts?: boolean } = {}): Promise<{
  entriesCount: number;
  sitemapPath: string;
  robotsPath: string;
}> {
  const allEntries = getSitemapEntries();
  const entries = options.requireBuiltArtifacts
    ? allEntries.filter((entry) => {
        const englishBuilt = hasBuiltArtifact(entry.path);
        const hindiBuilt = !HINDI_INDEXING_ENABLED || !entry.hiPath || hasBuiltArtifact(entry.hiPath);
        if (!englishBuilt || !hindiBuilt) {
          console.warn(`⚠️ Sitemap skipped URL without a built HTML artifact: ${entry.path}`);
          return false;
        }
        return true;
      })
    : allEntries;
  const sitemapXml = generateSitemapXml(entries);
  const robotsTxt = generateRobotsTxt();

  // Target destinations — the build only ever writes inside this application.
  // `dist` is the deployable Cloudflare Pages output; `public` keeps the
  // tracked source copy in sync for Vite's publicDir copy step. Writing to the
  // repository root or to a root `dist/` was historical static-site behaviour and
  // made every build dirty tracked files outside the app.
  const destinations = [
    join(reactRoot, "dist"),
    join(reactRoot, "public"),
  ];

  for (const destDir of destinations) {
    try {
      await mkdir(destDir, { recursive: true });
      await writeFile(join(destDir, "sitemap.xml"), sitemapXml, "utf8");
      await writeFile(join(destDir, "robots.txt"), robotsTxt, "utf8");
    } catch (e) {
      console.warn(`Warning writing sitemap to ${destDir}:`, e);
    }
  }

  console.log(
    `✅ Generated sitemap.xml (${entries.length} URLs with source-owned lastmod values where available, priorities & xhtml:link alternates) ` +
    `and robots.txt pointing to ${CANONICAL_DOMAIN}/sitemap.xml`
  );

  return {
    entriesCount: entries.length,
    sitemapPath: join(reactRoot, "dist", "sitemap.xml"),
    robotsPath: join(reactRoot, "dist", "robots.txt"),
  };
}

// Execute directly if run via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generateSitemapAndRobots().catch((err) => {
    console.error("❌ Sitemap generation failed:", err);
    process.exit(1);
  });
}
