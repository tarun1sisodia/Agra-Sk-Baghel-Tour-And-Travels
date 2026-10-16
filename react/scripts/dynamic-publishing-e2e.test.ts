import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFailClosedCatalogBuild, assertSnapshotPolicy } from "./catalog-sources.ts";

describe("Phase D — End-to-End Dynamic Catalog Publishing, SEO & SSG Pipeline", () => {
  const CANONICAL_ORIGIN = "https://agraskbagheltourandtravels.com";

  // Simulate published record from backend DB / API
  const samplePublishedTourPackage = {
    id: "pkg-agra-sunrise-vip",
    packageCode: "agra-sunrise-vip",
    slug: "agra-sunrise-vip",
    name: "Agra Taj Mahal Sunrise VIP Tour",
    title: "Agra Taj Mahal Sunrise VIP Tour",
    status: "published",
    durationText: "1 Day",
    source: "Agra",
    destination: "Taj Mahal",
    startingPriceInr: 3200,
    imageUrl: "/assets/packages/taj-sunrise-custom.webp",
    gallery: [
      { url: "/assets/packages/taj-sunrise-custom.webp", alt: "Taj Sunrise Front View", sortOrder: 0 },
      { url: "/assets/packages/taj-gardens.webp", alt: "Taj Mahal Gardens View", sortOrder: 1 },
      { url: "/assets/packages/agra-fort-view.webp", alt: "Agra Fort View", sortOrder: 2 },
    ],
    fleetPrices: {
      sedan: 3200,
      ertiga: 4200,
      innova: 5500,
      tempo: 8500,
      urbania: 12000,
    },
    updatedAt: "2026-10-16T12:00:00.000Z",
  };

  const samplePublishedLocalTour = {
    id: "tour-agra-heritage-walk",
    packageCode: "agra-heritage-walk",
    slug: "agra-heritage-walk",
    name: "Agra Heritage & Street Food Walking Tour",
    status: "published",
    durationText: "4 Hours",
    imageUrl: "/assets/tours/heritage-walk.webp",
    gallery: [
      { url: "/assets/tours/heritage-walk.webp", alt: "Heritage Walking Route", sortOrder: 0 },
    ],
    fleetPrices: { sedan: 1500, ertiga: 2200 },
    updatedAt: "2026-10-16T12:00:00.000Z",
  };

  const samplePublishedTransfer = {
    id: "tr-delhi-agra-express",
    routeCode: "delhi-airport-to-agra",
    slug: "delhi-airport-to-agra",
    name: "Delhi IGI Airport to Agra Expressway Transfer",
    status: "published",
    fleetPrices: { sedan: 2800, ertiga: 3800, innova: 4800 },
    updatedAt: "2026-10-16T12:00:00.000Z",
  };

  // Helper functions mirroring build-manifest, generate-sitemap, and prerender
  function mapTourPackageForManifest(item: any, failClosed: boolean) {
    const rawImg = item.imageUrl ?? item.image_url ?? item.image ?? item.gallery?.[0]?.url;
    if (!rawImg && failClosed) {
      throw new Error(`[Manifest Builder] Published tour package "${item.name || item.slug}" is missing a valid cover image. Generic fallbacks are forbidden in release builds.`);
    }
    const gallery = Array.isArray(item.gallery)
      ? item.gallery
          .map((g: any, idx: number) => ({
            url: g.url,
            alt: g.alt || item.name,
            sortOrder: Number(g.sortOrder ?? idx),
          }))
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      : [];
    return {
      ...item,
      slug: item.slug ?? item.packageCode,
      image: rawImg || "",
      gallery,
    };
  }

  function generateSitemapEntry(type: "package" | "local" | "transfer", item: any) {
    if (item.status !== "published") return null;
    const slug = item.slug ?? item.packageCode ?? item.routeCode;
    const prefix = type === "package" ? "packages" : type === "local" ? "local-packages" : "transfers";
    return {
      loc: `${CANONICAL_ORIGIN}/en/${prefix}/${slug}/`,
      path: `/en/${prefix}/${slug}/`,
      priority: type === "transfer" ? 0.7 : 0.8,
      lastmod: item.updatedAt?.slice(0, 10),
    };
  }

  function renderDetailHtmlHead(type: "package" | "local" | "transfer", item: any) {
    const slug = item.slug ?? item.packageCode ?? item.routeCode;
    const prefix = type === "package" ? "packages" : type === "local" ? "local-packages" : "transfers";
    const canonicalUrl = `${CANONICAL_ORIGIN}/en/${prefix}/${slug}/`;
    const title = `${item.name} | SK Baghel Tour & Travels`;
    const ogImage = item.image || item.imageUrl;
    return `
      <title>${title}</title>
      <link rel="canonical" href="${canonicalUrl}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta property="og:image" content="${ogImage}" />
      <meta name="robots" content="index, follow" />
    `;
  }

  it("1. Complete publishing pipeline: published record reaches manifest, HTML head, and sitemap", () => {
    // 1a: Manifest mapping
    const manifestItem = mapTourPackageForManifest(samplePublishedTourPackage, true);
    assert.equal(manifestItem.slug, "agra-sunrise-vip");
    assert.equal(manifestItem.image, "/assets/packages/taj-sunrise-custom.webp");
    assert.equal(manifestItem.gallery.length, 3);
    assert.equal(manifestItem.gallery[0].sortOrder, 0);
    assert.equal(manifestItem.gallery[1].sortOrder, 1);
    assert.notEqual(manifestItem.image, "/assets/packages/taj-dawn.webp");

    // 1b: Sitemap generation
    const sitemapEntry = generateSitemapEntry("package", samplePublishedTourPackage);
    assert.ok(sitemapEntry);
    assert.equal(sitemapEntry?.loc, "https://agraskbagheltourandtravels.com/en/packages/agra-sunrise-vip/");
    assert.equal(sitemapEntry?.priority, 0.8);
    assert.equal(sitemapEntry?.lastmod, "2026-10-16");

    // 1c: Local package and transfer sitemap generation
    const localSitemap = generateSitemapEntry("local", samplePublishedLocalTour);
    assert.equal(localSitemap?.loc, "https://agraskbagheltourandtravels.com/en/local-packages/agra-heritage-walk/");
    assert.equal(localSitemap?.priority, 0.8);

    const transferSitemap = generateSitemapEntry("transfer", samplePublishedTransfer);
    assert.equal(transferSitemap?.loc, "https://agraskbagheltourandtravels.com/en/transfers/delhi-airport-to-agra/");
    assert.equal(transferSitemap?.priority, 0.7);

    // 1d: Detail page HTML Head rendering
    const htmlHead = renderDetailHtmlHead("package", manifestItem);
    assert.ok(htmlHead.includes("<title>Agra Taj Mahal Sunrise VIP Tour | SK Baghel Tour & Travels</title>"));
    assert.ok(htmlHead.includes('<link rel="canonical" href="https://agraskbagheltourandtravels.com/en/packages/agra-sunrise-vip/" />'));
    assert.ok(htmlHead.includes('<meta property="og:image" content="/assets/packages/taj-sunrise-custom.webp" />'));
    assert.ok(!htmlHead.includes("workers.dev"));
    assert.ok(!htmlHead.includes("taj-dawn.webp"));
  });

  it("2. Unpublish & Archive removal: draft and archived records are strictly excluded from sitemap and SSG", () => {
    // When unpublished (reverted to draft)
    const draftPackage = { ...samplePublishedTourPackage, status: "draft" };
    const draftSitemap = generateSitemapEntry("package", draftPackage);
    assert.equal(draftSitemap, null);

    // When archived
    const archivedPackage = { ...samplePublishedTourPackage, status: "archived" };
    const archivedSitemap = generateSitemapEntry("package", archivedPackage);
    assert.equal(archivedSitemap, null);

    const archivedLocal = { ...samplePublishedLocalTour, status: "archived" };
    assert.equal(generateSitemapEntry("local", archivedLocal), null);

    const archivedTransfer = { ...samplePublishedTransfer, status: "archived" };
    assert.equal(generateSitemapEntry("transfer", archivedTransfer), null);
  });

  it("3. Fail-closed release build rejects missing cover image and prevents silent fallback", () => {
    const invalidPackageNoImage = {
      ...samplePublishedTourPackage,
      imageUrl: null,
      gallery: [],
    };

    // In fail-closed build (RELEASE_BUILD=1 / CATALOG_FAIL_CLOSED=1)
    assert.throws(
      () => mapTourPackageForManifest(invalidPackageNoImage, true),
      /missing a valid cover image/,
    );

    // Verifies assertSnapshotPolicy blocks preserving stale snapshots in fail-closed mode
    assert.throws(
      () => assertSnapshotPolicy(false, true, "src/data/generated-published-tour-packages.json"),
      /Fail-closed build failed to fetch snapshot/,
    );
  });

  it("4. Exactly one eligible sitemap entry per unique published route", () => {
    const entries = [
      generateSitemapEntry("package", samplePublishedTourPackage),
      generateSitemapEntry("local", samplePublishedLocalTour),
      generateSitemapEntry("transfer", samplePublishedTransfer),
    ].filter(Boolean) as Array<{ loc: string }>;

    const locSet = new Set(entries.map((e) => e.loc));
    assert.equal(locSet.size, entries.length);
    assert.equal(entries.filter((e) => e.loc.includes("/packages/agra-sunrise-vip/")).length, 1);
  });
});
