import { describe, it, expect, beforeEach } from "vitest";
import { createTestApp } from "../helpers.js";
import { getLatestReleaseAttempt, resetLatestReleaseAttempt } from "../../src/shared/deploy-hook.js";
import type { CatalogMediaRecord } from "../../src/types/domain.js";

const SUPER_ADMIN_AUTH = { authorization: "Bearer test-super_admin" };
const CONTENT_AUTH = { authorization: "Bearer test-content_editor" };

function mockMedia(override: Partial<CatalogMediaRecord> & { id: string; catalogItemId: string; storagePath: string }): CatalogMediaRecord {
  return {
    mediaType: "image",
    altText: "Image description",
    caption: null,
    sortOrder: 0,
    status: "published",
    sourceType: "admin_upload",
    copyrightOwner: null,
    mimeType: "image/webp",
    sizeBytes: 1000,
    contentBase64: null,
    createdBy: "test-admin",
    approvedBy: "test-admin",
    publishedAt: null,
    createdAt: new Date().toISOString(),
    ...override,
  };
}

describe("Phase D — Dynamic Catalog Publishing & SEO Integration", () => {
  beforeEach(() => {
    resetLatestReleaseAttempt();
  });

  it("blocks publishing a package when required media is missing (422 MISSING_REQUIRED_MEDIA)", async () => {
    const { app, db } = await createTestApp();

    // 1. Create a draft tour package with no media
    const item = await db.catalog.create({
      id: "pkg-test-no-media-001",
      type: "package",
      slug: "agra-sunrise-package-no-media",
      title: "Agra Sunrise Tour Package",
      shortDescription: "Sunrise visit to the Taj Mahal.",
      description: "Complete sunrise itinerary with guide and private vehicle.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra -> Taj Mahal -> Agra Fort",
      startingPriceInr: 2500,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: ["Taj Mahal", "Agra Fort"],
      tripType: "local-tour",
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Attempt to publish without media
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error?.code).toBe("MISSING_REQUIRED_MEDIA");
    expect(body.error?.message).toContain("a valid designated cover image");

    // Verify item remains draft
    const inDb = await db.catalog.getById(item.id);
    expect(inDb?.status).toBe("draft");
    expect(inDb?.publishedAt).toBeNull();
  });

  it("blocks publishing when media exists but none is designated as cover (sortOrder !== 0) or is only video", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-test-no-cover-001",
      type: "package",
      slug: "agra-no-cover-test",
      title: "Agra No Cover Test",
      shortDescription: "No cover test.",
      description: "Complete description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 2500,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: [],
      tripType: null,
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Attach video only
    await db.media.create(
      mockMedia({
        id: "med-video-01",
        catalogItemId: item.id,
        mediaType: "video",
        storagePath: "/assets/videos/taj.mp4",
        sortOrder: 0,
        status: "draft",
      }),
    );

    const resVideoOnly = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(resVideoOnly.statusCode).toBe(422);
    expect(JSON.parse(resVideoOnly.body).error?.code).toBe("MISSING_REQUIRED_MEDIA");

    // Now attach an image, but with sortOrder: 2 (no sortOrder: 0)
    await db.media.create(
      mockMedia({
        id: "med-image-no-cover-01",
        catalogItemId: item.id,
        mediaType: "image",
        storagePath: "/assets/packages/taj-2.webp",
        sortOrder: 2,
        status: "draft",
      }),
    );

    const resNoSort0 = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(resNoSort0.statusCode).toBe(422);
    expect(JSON.parse(resNoSort0.body).error?.code).toBe("MISSING_REQUIRED_MEDIA");
    expect(JSON.parse(resNoSort0.body).error?.message).toContain("sortOrder: 0");
  });

  it("blocks publishing an item with an unsafe or invalid SEO slug (422 INVALID_SLUG)", async () => {
    const { app, db } = await createTestApp();

    // 1. Create a draft with double hyphen slug
    const item = await db.catalog.create({
      id: "pkg-test-bad-slug-001",
      type: "package",
      slug: "agra--invalid-slug",
      title: "Bad Slug Tour Package",
      shortDescription: "Bad slug test.",
      description: "Description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 2000,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: [],
      tripType: null,
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Attach media so it doesn't fail on missing media
    await db.media.create(
      mockMedia({
        id: "med-bad-slug-01",
        catalogItemId: item.id,
        storagePath: "/assets/packages/taj-dawn.webp",
        status: "draft",
      }),
    );

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error?.code).toBe("INVALID_SLUG");
  });

  it("successfully publishes a package with media, promotes media to published, and updates release status", async () => {
    const { app, db } = await createTestApp();

    // 1. Create draft package
    const item = await db.catalog.create({
      id: "pkg-valid-pub-001",
      type: "package",
      slug: "taj-dawn-excursion",
      title: "Taj Dawn Excursion",
      shortDescription: "Early morning private tour of Taj Mahal.",
      description: "Private AC car and approved guide for sunrise.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra -> Taj Mahal",
      startingPriceInr: 3200,
      distanceKm: null,
      availability: "available",
      seatsLeft: 5,
      stops: ["Taj Mahal"],
      tripType: "local-tour",
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Attach cover image
    const mediaCover = await db.media.create(
      mockMedia({
        id: "med-cov-001",
        catalogItemId: item.id,
        storagePath: "/assets/packages/taj-dawn.webp",
        status: "draft",
        sortOrder: 0,
      }),
    );

    // 3. Attach gallery image (packages allow up to 12 images)
    const mediaGallery = await db.media.create(
      mockMedia({
        id: "med-gal-001",
        catalogItemId: item.id,
        storagePath: "/assets/places/gallery/agra-fort-01.jpg",
        status: "draft",
        sortOrder: 1,
      }),
    );

    // 4. Publish the package
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("published");
    expect(body.data.publishedAt).toBeTruthy();

    // 5. Verify attached draft media was synchronized to 'published'
    const updatedCover = await db.media.getById(mediaCover.id);
    const updatedGallery = await db.media.getById(mediaGallery.id);
    expect(updatedCover?.status).toBe("published");
    expect(updatedGallery?.status).toBe("published");

    // 6. Verify deploy hook attempt was recorded
    const releaseAttempt = getLatestReleaseAttempt();
    expect(releaseAttempt).toBeDefined();
    expect(releaseAttempt?.reason).toBe("catalog-publish");
  });

  it("supports unpublish endpoint, reverting item to draft without losing media", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-unpub-test-001",
      type: "tour",
      slug: "fatehpur-sikri-day-tour",
      title: "Fatehpur Sikri Day Tour",
      shortDescription: "Day trip to the Mughal ghost city.",
      description: "Full day tour covering Buland Darwaza and Salim Chishti tomb.",
      status: "published",
      durationText: "8 hours",
      routeSummary: "Agra -> Fatehpur Sikri",
      startingPriceInr: 2200,
      distanceKm: 80,
      availability: "available",
      seatsLeft: null,
      stops: ["Buland Darwaza"],
      tripType: "local-tour",
      version: 2,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/unpublish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("draft");

    const inDb = await db.catalog.getById(item.id);
    expect(inDb?.status).toBe("draft");
  });

  it("supports archive endpoint, transitioning item to archived", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-archive-test-001",
      type: "package",
      slug: "retired-monsoon-package",
      title: "Monsoon Special Package",
      shortDescription: "Retired package.",
      description: "No longer active.",
      status: "published",
      durationText: "2 days",
      routeSummary: "Agra",
      startingPriceInr: 5000,
      distanceKm: null,
      availability: "unavailable",
      seatsLeft: 0,
      stops: [],
      tripType: null,
      version: 3,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/archive`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("archived");

    const inDb = await db.catalog.getById(item.id);
    expect(inDb?.status).toBe("archived");
  });

  it("enforces multi-image gallery limit of 12 for packages and tours", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-gallery-limit-001",
      type: "package",
      slug: "golden-triangle-gallery-test",
      title: "Golden Triangle Luxury Package",
      shortDescription: "Tour Delhi, Agra and Jaipur.",
      description: "Delhi, Agra and Jaipur circuit.",
      status: "draft",
      durationText: "4 days",
      routeSummary: "Delhi -> Agra -> Jaipur",
      startingPriceInr: 12000,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: ["Delhi", "Agra", "Jaipur"],
      tripType: "round-trip",
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed 12 images
    for (let i = 0; i < 12; i++) {
      await db.media.create(
        mockMedia({
          id: `med-gt-${i}`,
          catalogItemId: item.id,
          storagePath: `/assets/gallery/photo-${i}.webp`,
          sortOrder: i,
        }),
      );
    }

    // Attempt to attach 13th image via API
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/media`,
      headers: CONTENT_AUTH,
      payload: {
        storagePath: "assets/gallery/photo-13.webp",
        mediaType: "image",
        altText: "13th image should be rejected",
      },
    });

    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error?.code).toBe("MEDIA_LIMIT_REACHED");
  });

  it("includes published package in public manifest and excludes drafts and archived records", async () => {
    const { app, db } = await createTestApp();

    // 1. Published package with cover and gallery
    const pubItem = await db.catalog.create({
      id: "pkg-manifest-pub-001",
      type: "package",
      slug: "taj-dawn-manifest-test",
      title: "Taj Dawn Manifest Test",
      shortDescription: "Sunrise visit to the Taj Mahal.",
      description: "Comprehensive Taj Mahal dawn tour.",
      status: "published",
      durationText: "1 day",
      routeSummary: "Agra -> Taj Mahal",
      startingPriceInr: 2800,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: ["Taj Mahal"],
      tripType: "local-tour",
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.media.create(
      mockMedia({
        id: "med-manifest-cov-01",
        catalogItemId: pubItem.id,
        storagePath: "/assets/packages/taj-dawn.webp",
        sortOrder: 0,
      }),
    );

    // 2. Draft package (must not appear)
    await db.catalog.create({
      id: "pkg-manifest-draft-001",
      type: "package",
      slug: "secret-draft-package",
      title: "Draft Package",
      shortDescription: "Draft.",
      description: "Draft description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 9999,
      distanceKm: null,
      availability: "available",
      seatsLeft: null,
      stops: [],
      tripType: null,
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Archived package (must not appear)
    await db.catalog.create({
      id: "pkg-manifest-archived-001",
      type: "package",
      slug: "archived-old-package",
      title: "Archived Package",
      shortDescription: "Archived.",
      description: "Archived description.",
      status: "archived",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 9999,
      distanceKm: null,
      availability: "unavailable",
      seatsLeft: null,
      stops: [],
      tripType: null,
      version: 1,
      createdBy: "test-admin",
      updatedBy: "test-admin",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/manifest",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const manifest = body.data;

    // Published item is included with authoritative starting price and image
    const found = manifest.packages?.find((p: any) => p.slug === "taj-dawn-manifest-test");
    expect(found).toBeDefined();
    expect(found.title).toBe("Taj Dawn Manifest Test");
    expect(found.startingPriceInr).toBe(2800);
    expect(found.image).toBe("/assets/packages/taj-dawn.webp");
    expect(found.gallery?.length).toBeGreaterThanOrEqual(1);

    // Draft and archived items are strictly excluded
    expect(manifest.packages?.find((p: any) => p.slug === "secret-draft-package")).toBeUndefined();
    expect(manifest.packages?.find((p: any) => p.slug === "archived-old-package")).toBeUndefined();
  });
});
