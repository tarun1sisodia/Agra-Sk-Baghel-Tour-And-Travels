import { describe, it, expect, beforeEach, vi } from "vitest";
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

    // 6. Verify atomic outbox event was enqueued and no duplicate direct deploy hook was fired
    expect(getLatestReleaseAttempt()).toBeNull();
    const pendingEvents = await db.publishEvents.listPending();
    const event = pendingEvents.find((e) => e.entity_id === item.id);
    expect(event).toBeDefined();
    expect(event?.entity_type).toBe("tour_package");
    expect(event?.event_type).toBe("published");
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

  it("admin catalog publish and unpublish actions enqueue durable site_publish_events records", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-outbox-001",
      type: "package",
      slug: "outbox-test-package",
      title: "Outbox Test Package",
      shortDescription: "Short description.",
      description: "Full description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 3000,
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

    await db.media.create(mockMedia({
      id: "med-outbox-cover",
      catalogItemId: item.id,
      storagePath: "/assets/packages/cover.webp",
      sortOrder: 0,
      status: "published",
    }));

    // 1. Publish item
    const pubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(pubRes.statusCode).toBe(200);

    const pendingAfterPub = await db.publishEvents?.listPending();
    expect(pendingAfterPub).toBeDefined();
    const pubEvent = pendingAfterPub?.find((e) => e.entity_id === item.id);
    expect(pubEvent).toBeDefined();
    expect(pubEvent?.entity_type).toBe("tour_package");
    expect(pubEvent?.event_type).toBe("published");
    expect(pubEvent?.status).toBe("pending");

    // 2. Unpublish item
    const unpubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/unpublish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(unpubRes.statusCode).toBe(200);

    const pendingAfterUnpub = await db.publishEvents?.listPending();
    const unpubEvent = pendingAfterUnpub?.find((e) => e.entity_id === item.id && e.event_type === "archived");
    expect(unpubEvent).toBeDefined();
    expect(unpubEvent?.entity_type).toBe("tour_package");
    expect(unpubEvent?.status).toBe("pending");
  });

  it("admin dedicated tour package, local package, and transfer mutations enqueue site_publish_events", async () => {
    const { app, db } = await createTestApp();

    // 1. Tour package
    const tp = await db.tourPackages.create({
      id: "11111111-1111-4111-8111-111111111111",
      packageCode: "tp-outbox-pkg",
      name: "Dedicated TP Outbox",
      durationText: "2 Days",
      days: 2,
      nights: 1,
      baseTierCode: "sedan",
      startingPriceInr: 4500,
      fleetPrices: { sedan: 4500, ertiga: 5500 },
      nightChargeInr: null,
      inclusionsHighlight: "Highlight",
      inclusionsNote: "Note",
      source: "Agra",
      destination: "Fatehpur Sikri",
      inclusions: ["Car"],
      exclusions: ["Tickets"],
      itinerary: [],
      imageUrl: "/assets/packages/tp.webp",
      gallery: [],
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tpPubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/tour-packages/${tp.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(tpPubRes.statusCode).toBe(200);

    const pendingTp = await db.publishEvents?.listPending();
    const tpEvent = pendingTp?.find((e) => e.entity_id === tp.id);
    expect(tpEvent).toBeDefined();
    expect(tpEvent?.entity_type).toBe("tour_package");
    expect(tpEvent?.event_type).toBe("published");

    // 2. Local sightseeing package
    const lp = await db.localPackages.create({
      id: "22222222-2222-4222-8222-222222222222",
      packageCode: "lp-outbox-tour",
      name: "Dedicated LP Outbox",
      durationHours: 4,
      includedKm: 40,
      covers: "Taj Mahal",
      parkingNote: null,
      fleetPrices: { sedan: 1200 },
      usePerKm: false,
      extraRates: null,
      nightChargeInr: null,
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const lpPubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/local-packages/${lp.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(lpPubRes.statusCode).toBe(200);

    const pendingLp = await db.publishEvents?.listPending();
    const lpEvent = pendingLp?.find((e) => e.entity_id === lp.id);
    expect(lpEvent).toBeDefined();
    expect(lpEvent?.entity_type).toBe("local_package");
    expect(lpEvent?.event_type).toBe("published");

    // 3. Transfer route
    const tr = await db.transferRoutes.create({
      id: "33333333-3333-4333-8333-333333333333",
      routeCode: "tr-outbox-transfer",
      name: "Dedicated TR Outbox",
      distanceText: "10 km",
      directionNote: null,
      fleetPrices: { sedan: 800 },
      usePerKm: false,
      nightChargeInr: null,
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const trPubRes = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/transfer-routes/${tr.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(trPubRes.statusCode).toBe(200);

    const pendingTr = await db.publishEvents?.listPending();
    const trEvent = pendingTr?.find((e) => e.entity_id === tr.id);
    expect(trEvent).toBeDefined();
    expect(trEvent?.entity_type).toBe("transfer");
    expect(trEvent?.event_type).toBe("published");
  });

  it("rolls back catalog mutation and media promotion atomically if outbox event enqueue fails", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-rollback-test-001",
      type: "package",
      slug: "atomic-rollback-tour",
      title: "Atomic Rollback Tour",
      shortDescription: "Testing atomic rollback on outbox failure.",
      description: "Testing atomic rollback on outbox failure full description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 3000,
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

    const cover = await db.media.create(
      mockMedia({
        id: "med-rb-cover",
        catalogItemId: item.id,
        storagePath: "/assets/packages/rb.webp",
        sortOrder: 0,
        status: "draft",
      }),
    );

    // Mock enqueue failure inside transaction
    const enqueueSpy = vi.spyOn(db.publishEvents, "enqueue").mockRejectedValue(new Error("DATABASE_OUTBOX_DISK_FULL"));

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(500);

    // Verify catalog item was rolled back to draft
    const catalogItemInDb = await db.catalog.getById(item.id);
    expect(catalogItemInDb?.status).toBe("draft");
    expect(catalogItemInDb?.publishedAt).toBeNull();

    // Verify media was rolled back to draft
    const mediaInDb = await db.media.getById(cover.id);
    expect(mediaInDb?.status).toBe("draft");

    // Verify no publish events persisted
    const pendingEvents = await db.publishEvents.listPending();
    expect(pendingEvents.find((e) => e.entity_id === item.id)).toBeUndefined();

    enqueueSpy.mockRestore();
  });

  it("rolls back tour package mutation if outbox event enqueue fails", async () => {
    const { app, db } = await createTestApp();

    const tp = await db.tourPackages.create({
      id: "44444444-4444-4444-8444-444444444444",
      packageCode: "tp-rollback-pkg",
      name: "Dedicated TP Rollback",
      durationText: "2 Days",
      days: 2,
      nights: 1,
      baseTierCode: "sedan",
      startingPriceInr: 4500,
      fleetPrices: { sedan: 4500 },
      nightChargeInr: null,
      inclusionsHighlight: "Highlight",
      inclusionsNote: "Note",
      source: "Agra",
      destination: "Fatehpur Sikri",
      inclusions: ["Car"],
      exclusions: ["Tickets"],
      itinerary: [],
      imageUrl: "/assets/packages/tp-rb.webp",
      gallery: [],
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const enqueueSpy = vi.spyOn(db.publishEvents, "enqueue").mockRejectedValue(new Error("OUTBOX_WRITE_ERROR"));

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/tour-packages/${tp.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(500);

    const tpInDb = await db.tourPackages.getById(tp.id);
    expect(tpInDb?.status).toBe("draft");

    enqueueSpy.mockRestore();
  });

  it("rolls back local package mutation if outbox event enqueue fails", async () => {
    const { app, db } = await createTestApp();

    const lp = await db.localPackages.create({
      id: "55555555-5555-4555-8555-555555555555",
      packageCode: "lp-rollback-tour",
      name: "Dedicated LP Rollback",
      durationHours: 4,
      includedKm: 40,
      covers: "Taj Mahal",
      parkingNote: null,
      fleetPrices: { sedan: 1200 },
      usePerKm: false,
      extraRates: null,
      nightChargeInr: null,
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const enqueueSpy = vi.spyOn(db.publishEvents, "enqueue").mockRejectedValue(new Error("OUTBOX_WRITE_ERROR"));

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/local-packages/${lp.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(500);

    const lpInDb = await db.localPackages.getById(lp.id);
    expect(lpInDb?.status).toBe("draft");

    enqueueSpy.mockRestore();
  });

  it("rolls back transfer route mutation if outbox event enqueue fails", async () => {
    const { app, db } = await createTestApp();

    const tr = await db.transferRoutes.create({
      id: "66666666-6666-4666-8666-666666666666",
      routeCode: "tr-rollback-transfer",
      name: "Dedicated TR Rollback",
      distanceText: "10 km",
      directionNote: null,
      fleetPrices: { sedan: 800 },
      usePerKm: false,
      nightChargeInr: null,
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const enqueueSpy = vi.spyOn(db.publishEvents, "enqueue").mockRejectedValue(new Error("OUTBOX_WRITE_ERROR"));

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/transfer-routes/${tr.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    expect(res.statusCode).toBe(500);

    const trInDb = await db.transferRoutes.getById(tr.id);
    expect(trInDb?.status).toBe("draft");

    enqueueSpy.mockRestore();
  });

  it("fails closed without committing mutation if publishEvents repository is missing", async () => {
    const { app, db } = await createTestApp();

    const item = await db.catalog.create({
      id: "pkg-missing-outbox-001",
      type: "package",
      slug: "missing-outbox-tour",
      title: "Missing Outbox Tour",
      shortDescription: "Short description.",
      description: "Full description.",
      status: "draft",
      durationText: "1 day",
      routeSummary: "Agra",
      startingPriceInr: 3000,
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

    await db.media.create(
      mockMedia({
        id: "med-mo-cover",
        catalogItemId: item.id,
        storagePath: "/assets/packages/mo.webp",
        sortOrder: 0,
        status: "draft",
      }),
    );

    // Sabotage publishEvents
    const originalPublishEvents = db.publishEvents;
    delete (db as any).publishEvents;

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/catalog/${item.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });

    // Restore immediately
    db.publishEvents = originalPublishEvents;

    expect(res.statusCode).toBe(500);

    const inDb = await db.catalog.getById(item.id);
    expect(inDb?.status).toBe("draft");
  });

  it("dispatches exactly one deployment attempt through the authoritative PublicationWorker, not duplicate direct calls", async () => {
    const { app, db } = await createTestApp();

    const tp = await db.tourPackages.create({
      id: "77777777-7777-4777-8777-777777777777",
      packageCode: "tp-single-dispatch",
      name: "Single Dispatch Tour",
      durationText: "1 Day",
      days: 1,
      nights: 0,
      baseTierCode: "sedan",
      startingPriceInr: 3500,
      fleetPrices: { sedan: 3500 },
      nightChargeInr: null,
      inclusionsHighlight: "Highlight",
      inclusionsNote: "Note",
      source: "Agra",
      destination: "Mathura",
      inclusions: ["Car"],
      exclusions: [],
      itinerary: [],
      imageUrl: "/assets/packages/single-dispatch.webp",
      gallery: [],
      status: "draft",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    resetLatestReleaseAttempt();

    // 1. Publish through service route
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/tour-packages/${tp.id}/publish`,
      headers: SUPER_ADMIN_AUTH,
    });
    expect(res.statusCode).toBe(200);

    // 2. Proves no direct deploy hook was triggered during mutation
    expect(getLatestReleaseAttempt()).toBeNull();

    // 3. Proves outbox event was created
    const pending = await db.publishEvents.listPending();
    const event = pending.find((e) => e.entity_id === tp.id);
    expect(event).toBeDefined();

    // 4. Now simulate worker processing the event
    const { PublicationWorker } = await import("../../src/modules/publishing/publication-worker.js");
    let fetchCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCount++;
      if (url.includes("pages.dev") || url.includes("cloudflare")) {
        return { ok: true, status: 200, json: async () => ({ id: "deploy-123" }), text: async () => "{}" };
      }
      return { ok: true, status: 200, text: async () => "<urlset></urlset>" };
    });

    const mockPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("SET status = 'triggered'")) {
          return { rows: [{ ...event, status: "triggered", deployment_ref: "deploy-123" }] };
        }
        if (sql.includes("SET status = 'succeeded'")) {
          return { rows: [{ ...event, status: "succeeded" }] };
        }
        return { rows: [] };
      }),
    };

    const worker = new PublicationWorker({
      pool: mockPool as any,
      deployHookUrl: "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/fake-hook",
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
      verifyFn: async () => true, // Verification passes
    });

    await worker.processEvent(event as any);

    // 5. Proves exactly ONE deploy hook dispatch occurred through authoritative worker
    const latestAttempt = getLatestReleaseAttempt();
    expect(latestAttempt).toBeDefined();
    expect(latestAttempt?.status).toBe("queued");
    expect(latestAttempt?.entityType).toBe("tour_package");
    expect(latestAttempt?.entityId).toBe(tp.id);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
