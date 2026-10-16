/**
 * SeoHead — Dynamic SEO Head & Metadata Manager (Step R5.24)
 *
 * Implements comprehensive SEO and social sharing metadata management:
 * 1. Document title, language tag (en-IN / hi-IN), and text direction (ltr)
 * 2. Meta description, robots index/follow directives (with noindex, nofollow guard)
 * 3. Fully qualified Canonical URL based on single source domain (https://agraskbagheltourandtravels.com)
 * 4. Bilingual Hreflang Alternates (en-IN, hi-IN, and x-default) with route-pair mapping
 * 5. Open Graph protocol tags (og:title, og:description, og:url, og:image, og:locale, og:locale:alternate, og:site_name, og:type)
 * 6. Twitter / X card tags (twitter:card, twitter:title, twitter:description, twitter:image, twitter:site, twitter:creator)
 * 7. Local Agra Geo tags (geo.region, geo.placename, geo.position, ICBM)
 * 8. Fallback Schema.org JSON-LD LocalBusiness & WebSite graph
 */

import React, { useEffect } from "react";
import { contact } from "../../data/contact";
import { isHindiIndexingEnabled, resolveSiteOrigin, type SiteOriginMode } from "../../config/siteOrigin";
import { JsonLd } from "./JsonLd";

const SITE_ORIGIN_MODE: SiteOriginMode =
  import.meta.env.VITE_SITE_MODE === "production"
    ? "production"
    : import.meta.env.MODE === "development"
    ? "development"
    : "preview";

export const CANONICAL_DOMAIN = resolveSiteOrigin(import.meta.env.VITE_SITE_URL, SITE_ORIGIN_MODE);
export const HINDI_INDEXING_ENABLED = isHindiIndexingEnabled(import.meta.env.VITE_HINDI_INDEXING_ENABLED);
export const DEFAULT_OG_IMAGE = `${CANONICAL_DOMAIN}/assets/brand/og-banner.webp`;

export interface HreflangAlternate {
  hreflang: "en-IN" | "hi-IN" | "x-default";
  href: string;
}

export interface SeoHeadProps {
  language: "en" | "hi";
  pathname: string;
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  keywords?: string | string[];
  author?: string;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  children?: React.ReactNode;
}

export const ROUTE_PAIRS: Array<{ en: string; hi: string }> = [
  { en: "agra-to-delhi-taxi", hi: "agra-se-delhi-taxi" },
  { en: "delhi-to-agra-taxi", hi: "delhi-se-agra-taxi" },
  { en: "agra-to-jaipur-taxi", hi: "agra-se-jaipur-taxi" },
  { en: "delhi-to-jaipur-taxi", hi: "delhi-se-jaipur-taxi" },
  { en: "agra-to-gwalior-taxi", hi: "agra-se-gwalior-taxi" },
  { en: "agra-to-lucknow-taxi", hi: "agra-se-lucknow-taxi" },
  { en: "agra-to-mathura-taxi", hi: "agra-se-mathura-taxi" },
  { en: "agra-sightseeing-taxi", hi: "agra-darshan-taxi" },
];

/**
 * Normalizes any relative or subpath pathname into a clean canonical path.
 * Strips `/ArenaAI` or trailing `.html` (except book.html/404.html) and enforces proper trailing slashes.
 */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/" || pathname === "/index.html") {
    return "/";
  }

  // Remove potential subpath prefix (e.g. /ArenaAI)
  let clean = pathname.replace(/^\/ArenaAI(?=\/|$)/, "");
  if (!clean || clean === "/" || clean === "/index.html") {
    return "/";
  }

  // Preserve specific standalone HTML filenames
  if (clean === "/book.html" || clean === "/404.html") {
    return clean;
  }

  // Strip .html suffix from directory-style routes
  clean = clean.replace(/\.html$/, "");

  // Ensure leading slash
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }

  // Ensure trailing slash for directory routes
  if (!clean.endsWith("/")) {
    clean = `${clean}/`;
  }

  return clean;
}

/**
 * Resolves a fully-qualified absolute URL from a path or relative URL.
 */
export function resolveAbsoluteUrl(urlOrPath?: string, defaultUrl = DEFAULT_OG_IMAGE): string {
  if (!urlOrPath) return defaultUrl;
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return urlOrPath;
  }
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${CANONICAL_DOMAIN}${cleanPath}`;
}

/**
 * Determines exact bilingual hreflang alternates (en-IN, hi-IN, x-default) for any route.
 */
export function resolveHreflangAlternates(pathname: string, noindex = false): HreflangAlternate[] {
  if (noindex) {
    // Noindex pages (like booking funnel or 404) should not declare hreflangs
    return [];
  }

  const clean = normalizePath(pathname);

  // Preserve compatibility routes but keep Hindi pages out of indexable metadata until
  // all advertised Hindi content and static artifacts are complete.
  if (!HINDI_INDEXING_ENABLED) {
    if (clean === "/hi/" || clean.startsWith("/hi/")) return [];

    let englishPath = clean === "/en/" ? "/" : clean;
    for (const pair of ROUTE_PAIRS) {
      if (
        clean.includes(`/${pair.en}/`) ||
        clean.includes(`/${pair.hi}/`) ||
        clean.endsWith(`/${pair.en}`) ||
        clean.endsWith(`/${pair.hi}`)
      ) {
        englishPath = `/en/${pair.en}/`;
        break;
      }
    }
    const href = `${CANONICAL_DOMAIN}${englishPath}`;
    return [
      { hreflang: "en-IN", href },
      { hreflang: "x-default", href },
    ];
  }

  // Home Route
  if (clean === "/" || clean === "/hi/" || clean === "/en/") {
    return [
      { hreflang: "en-IN", href: `${CANONICAL_DOMAIN}/` },
      { hreflang: "hi-IN", href: `${CANONICAL_DOMAIN}/hi/` },
      { hreflang: "x-default", href: `${CANONICAL_DOMAIN}/` },
    ];
  }

  // Check 1:1 bilingual route pairs (e.g. agra-to-delhi-taxi <-> agra-se-delhi-taxi)
  for (const pair of ROUTE_PAIRS) {
    if (
      clean.includes(`/${pair.en}/`) ||
      clean.includes(`/${pair.hi}/`) ||
      clean.endsWith(`/${pair.en}`) ||
      clean.endsWith(`/${pair.hi}`)
    ) {
      return [
        { hreflang: "en-IN", href: `${CANONICAL_DOMAIN}/en/${pair.en}/` },
        { hreflang: "hi-IN", href: `${CANONICAL_DOMAIN}/hi/${pair.hi}/` },
        { hreflang: "x-default", href: `${CANONICAL_DOMAIN}/en/${pair.en}/` },
      ];
    }
  }

  // Check General Bilingual Routes (/en/... <-> /hi/...)
  if (clean.startsWith("/hi/")) {
    const sub = clean.slice(3); // begins with /
    const enPath = `/en${sub}`;
    return [
      { hreflang: "en-IN", href: `${CANONICAL_DOMAIN}${enPath}` },
      { hreflang: "hi-IN", href: `${CANONICAL_DOMAIN}${clean}` },
      { hreflang: "x-default", href: `${CANONICAL_DOMAIN}${enPath}` },
    ];
  }

  if (clean.startsWith("/en/")) {
    const sub = clean.slice(3); // begins with /
    const hiPath = `/hi${sub}`;
    return [
      { hreflang: "en-IN", href: `${CANONICAL_DOMAIN}${clean}` },
      { hreflang: "hi-IN", href: `${CANONICAL_DOMAIN}${hiPath}` },
      { hreflang: "x-default", href: `${CANONICAL_DOMAIN}${clean}` },
    ];
  }

  // Fallback for non-prefixed routes
  return [
    { hreflang: "en-IN", href: `${CANONICAL_DOMAIN}${clean}` },
    { hreflang: "hi-IN", href: `${CANONICAL_DOMAIN}/hi${clean}` },
    { hreflang: "x-default", href: `${CANONICAL_DOMAIN}${clean}` },
  ];
}

export function SeoHead({
  language,
  pathname,
  title,
  description,
  canonicalUrl,
  ogImage,
  ogImageAlt,
  ogType = "website",
  noindex = false,
  keywords,
  author = "Agra SK Baghel Tour and Travels",
  schema,
  children,
}: SeoHeadProps) {
  const normalized = normalizePath(pathname);
  const canonicalPath = normalized === "/en/" ? "/" : normalized;
  const resolvedCanonical = canonicalUrl || `${CANONICAL_DOMAIN}${canonicalPath}`;
  const resolvedOgImage = resolveAbsoluteUrl(ogImage);
  const resolvedImageAlt = ogImageAlt || title;
  const isDisabledHindiPage =
    !HINDI_INDEXING_ENABLED && (language === "hi" || normalized === "/hi/" || normalized.startsWith("/hi/"));
  const effectiveNoindex = noindex || isDisabledHindiPage;
  const effectiveLanguage: "en" | "hi" = isDisabledHindiPage ? "en" : language;
  const alternates = resolveHreflangAlternates(pathname, effectiveNoindex);

  useEffect(() => {
    // 1. Synchronize HTML Language and Direction
    document.documentElement.lang = effectiveLanguage === "hi" ? "hi-IN" : "en-IN";
    document.documentElement.dir = "ltr";
    document.title = title;

    // Helper: Upsert Meta tag by name or property attribute
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper: Remove Meta tag if present
    const removeMeta = (attr: "name" | "property", key: string) => {
      const meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (meta && meta.parentElement) {
        meta.parentElement.removeChild(meta);
      }
    };

    // 2. Core Search Engine Directives
    setMeta("name", "description", description);
    setMeta(
      "name",
      "robots",
      effectiveNoindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
    setMeta(
      "name",
      "googlebot",
      effectiveNoindex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
    );
    setMeta("name", "author", author);
    setMeta("name", "theme-color", "#FAF7F0");

    // Local SEO & Geo Targeting (Taj Ganj, Agra)
    setMeta("name", "geo.region", "IN-UP");
    setMeta("name", "geo.placename", "Agra");
    setMeta("name", "geo.position", "27.1632;78.0322");
    setMeta("name", "ICBM", "27.1632, 78.0322");

    if (keywords) {
      const kwStr = Array.isArray(keywords) ? keywords.join(", ") : keywords;
      setMeta("name", "keywords", kwStr);
    } else {
      removeMeta("name", "keywords");
    }

    // 3. Canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = resolvedCanonical;

    // 4. Open Graph Social Graph
    setMeta("property", "og:site_name", "Agra SK Baghel Tour and Travels");
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", resolvedCanonical);
    setMeta("property", "og:image", resolvedOgImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", resolvedImageAlt);
    setMeta("property", "og:locale", effectiveLanguage === "hi" ? "hi_IN" : "en_IN");
    if (HINDI_INDEXING_ENABLED) {
      setMeta("property", "og:locale:alternate", effectiveLanguage === "hi" ? "en_IN" : "hi_IN");
    } else {
      removeMeta("property", "og:locale:alternate");
    }

    // 5. Twitter / X Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", resolvedOgImage);
    setMeta("name", "twitter:image:alt", resolvedImageAlt);
    setMeta("name", "twitter:site", "@SKBaghelTravels");
    setMeta("name", "twitter:creator", "@SKBaghelTravels");

    // 6. Bilingual Hreflang Alternates
    // First, remove existing hreflang tags to prevent duplicate or stale entries
    const existingHreflangs = document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach((el) => {
      if (el.parentElement) el.parentElement.removeChild(el);
    });

    if (!effectiveNoindex && alternates.length > 0) {
      for (const alt of alternates) {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.hreflang = alt.hreflang;
        link.href = alt.href;
        document.head.appendChild(link);
      }
    }
  }, [
    alternates,
    author,
    description,
    keywords,
    language,
    effectiveNoindex,
    ogType,
    resolvedCanonical,
    resolvedImageAlt,
    resolvedOgImage,
    title,
  ]);

  const defaultSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        "@id": `${CANONICAL_DOMAIN}/#business`,
        name: "Agra SK Baghel Tour and Travels",
        url: CANONICAL_DOMAIN,
        telephone: contact.phone,
        email: contact.email,
        image: resolvedOgImage,
        priceRange: "₹₹",
        areaServed: ["Agra", "Delhi", "Jaipur", "Mathura", "Gwalior", "Lucknow"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: contact.phone,
            contactType: "customer service",
            areaServed: "IN",
            availableLanguage: ["en-IN", "hi-IN"],
          },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressLocality: "Agra",
          addressRegion: "Uttar Pradesh",
          postalCode: "282001",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 27.1632,
          longitude: 78.0322,
        },
        openingHours: "Mo-Su 00:00-23:59",
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_DOMAIN}/#website`,
        name: "Agra SK Baghel Tour and Travels",
        url: CANONICAL_DOMAIN,
        inLanguage: effectiveLanguage === "hi" ? "hi-IN" : "en-IN",
      },
    ],
  };

  const schemaToInject = schema || defaultSchema;

  return (
    <>
      <JsonLd schema={schemaToInject} />
      {children}
    </>
  );
}

export default SeoHead;
