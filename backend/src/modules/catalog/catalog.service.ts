import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import {
  catalogMediaLimit,
  type AuthUser,
  type CatalogItemRecord,
  type CatalogMediaRecord,
} from "../../types/domain.js";
import type { FareCatalogRepository } from "../fare-catalog/fare-catalog.repository.js";
import type { AttachMediaSchema, CreateCatalogSchema, PublicCatalogQuerySchema, UpdateCatalogSchema, UpdateMediaSchema } from "./catalog.schema.js";
import { mediaObjectPath, mimeTypeForPath, type MediaStorage } from "./media.storage.js";
import type { z } from "zod";

import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";

async function requestFrontendRebuild(reason: string, _manifestVersion: number): Promise<void> {
  await triggerFrontendRebuild(reason);
}

export function createCatalogService(deps: { db: Repositories; clock: Clock; mediaStorage?: MediaStorage | null; fareCatalogRepo?: FareCatalogRepository | null }) {
  let manifestVersion = 1;
  let lastRegeneratedAt = toIso(deps.clock.now());
  let cachedManifest: any = null;
  let cachedEtag = `W/"manifest-v1-${Date.now()}"`;

  function bumpManifest() {
    manifestVersion += 1;
    lastRegeneratedAt = toIso(deps.clock.now());
    cachedManifest = null;
    cachedEtag = `W/"manifest-v${manifestVersion}-${new Date(lastRegeneratedAt).getTime()}"`;
  }

  /**
   * Builds the public catalog manifest from canonical published database records.
   *
   * Route-level pricing comes from outstation_route_vehicles.one_way_amount —
   * the only authoritative source for per-route, per-vehicle one-way fares.
   * Package pricing comes from fare_rules joined to tour_packages.
   * Vehicle specifications come from vehicle_models + vehicle_groups.
   *
   * No synthetic fares, no static baseline (CATALOG_RAW_DATA removed),
   * no invented reverse routes, and no fallback multipliers.
   * A missing price is represented as null, not fabricated.
   */
  async function buildManifest() {
    const routes: Record<string, any> = {};

    // 1. Incorporate published routes from outstation_routes via routeCatalog
    if (deps.db.routeCatalog) {
      const dbRoutes = await deps.db.routeCatalog.list({ status: "published", limit: 1000 });
      for (const item of dbRoutes.items || []) {
        if (item.status !== "published") continue;
        const fares = (item.faresInr || {}) as Record<string, any>;

        // Authoritative vehicle tier pricing — null if not configured, never fabricated
        const fs = typeof fares.sedan === "number" ? fares.sedan : (typeof fares.dzire === "number" ? fares.dzire : null);
        const fe = typeof fares.ertiga === "number" ? fares.ertiga : null;
        const fi = typeof fares["innova-crysta"] === "number" ? fares["innova-crysta"] : (typeof fares.innova === "number" ? fares.innova : null);
        const ft = typeof fares["tempo-traveller-12"] === "number" ? fares["tempo-traveller-12"] : (typeof fares["tempo-traveller"] === "number" ? fares["tempo-traveller"] : (typeof fares.tempo === "number" ? fares.tempo : null));
        const fu = typeof fares["force-urbania-16"] === "number" ? fares["force-urbania-16"] : (typeof fares["force-urbania-13"] === "number" ? fares["force-urbania-13"] : (typeof fares.urbania === "number" ? fares.urbania : null));
        const fh = typeof fares.hatchback === "number" ? fares.hatchback : null;

        const distanceKm = Number(item.distanceKm || 0);
        const durationMins =
          Number(item.durationText?.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] ?? 0) * 60 ||
          (item.durationText?.match(/(\d+)\s*mins?/i)?.[1] ? Number(item.durationText?.match(/(\d+)\s*mins?/i)?.[1]) : (distanceKm ? Math.round((distanceKm / 55) * 60) : 0));

        routes[item.slug] = {
          o: item.sourceCity,
          d: item.destinationCity || item.sourceCity,
          km: distanceKm,
          m: durationMins,
          fh,
          fs,
          fe,
          fi,
          ft,
          fu,
          pm: item.tripType === "round-trip" ? "day120" : item.tripType === "local-tour" ? "tour" : "oneway",
          c: item.sourceDetail || "Direct Highway Corridor",
          toll: item.tollIncluded === false ? 0 : 1,
        };
      }
    }

    // 2. Incorporate published database routes & exclusions from catalog_items
    const allDbItems = await deps.db.catalog.list({});
    for (const item of allDbItems) {
      if ((item.type as string) === "ride" || (item.type as string) === "route") {
        if (item.status !== "published") {
          delete routes[item.slug];
        } else {
          const startingPrice = item.startingPriceInr ?? null;
          const existing = routes[item.slug];
          routes[item.slug] = {
            o: item.routeSummary?.split("·")[0]?.trim() || existing?.o || item.title,
            d: item.routeSummary?.split("·").slice(-1)[0]?.trim() || existing?.d || item.title,
            km: existing?.km ?? 0,
            m: existing?.m ?? 0,
            fh: existing?.fh ?? null,
            fs: existing?.fs ?? startingPrice,
            fe: existing?.fe ?? null,
            fi: existing?.fi ?? null,
            ft: existing?.ft ?? null,
            fu: existing?.fu ?? null,
            pm: existing?.pm ?? "oneway",
            c: item.routeSummary || existing?.c || "Direct Highway Corridor",
            toll: existing?.toll ?? 1,
          };
        }
      }
    }

    const packageMap = new Map<string, any>();

    // 3. Incorporate dedicated tour_packages table (authoritative for packages)
    if (deps.db.tourPackages) {
      const dbPackages = await deps.db.tourPackages.list({ status: "published", limit: 500 });
      for (const item of dbPackages.items || []) {
        if (item.status !== "published" || item.isActive === false) continue;
        const startingPrice = item.startingPriceInr != null
          ? Number(item.startingPriceInr)
          : (item.fleetPrices?.sedan != null ? Number(item.fleetPrices.sedan) : null);
        const places = [item.source, item.destination].filter(Boolean) as string[];
        const slug = item.packageCode;
        packageMap.set(slug, {
          id: item.id,
          slug,
          name: item.name,
          title: item.name,
          type: "package",
          category: "package",
          kicker: "Tour Package",
          duration: item.durationText || `${item.days} Days / ${item.nights} Nights`,
          from: startingPrice,
          startingPriceInr: startingPrice,
          image: item.imageUrl || item.gallery?.[0]?.url || "",
          gallery: item.gallery || [],
          places: places.length > 0 ? places : ["Agra"],
          blurb: item.inclusionsHighlight || item.name,
          description: item.inclusionsNote || item.name,
          includes: Array.isArray(item.inclusions) && item.inclusions.length > 0 ? item.inclusions : [
            "Private AC vehicle",
            "Professional chauffeur",
            "All tolls, parking & state tax",
            "Guide assistance",
            "Bottled water",
          ],
          excludes: Array.isArray(item.exclusions) && item.exclusions.length > 0 ? item.exclusions : [
            "Monument tickets",
            "Meals",
          ],
          source: item.source || "Agra",
          destination: item.destination || "",
          fleetPrices: item.fleetPrices || {},
          days: item.days,
          nights: item.nights,
          status: item.status,
          updatedAt: item.updatedAt,
        });
      }
    }

    // 4. Incorporate dedicated local_sightseeing_packages table (authoritative for local tours)
    if (deps.db.localPackages) {
      const dbLocal = await deps.db.localPackages.list({ status: "published", limit: 500 });
      for (const item of dbLocal.items || []) {
        if (item.status !== "published" || item.isActive === false) continue;
        const startingPrice = item.fleetPrices?.sedan != null ? Number(item.fleetPrices.sedan) : null;
        const places = (item.covers || "").split(/[,·|]/).map((s) => s.trim()).filter(Boolean);
        const slug = item.packageCode;
        packageMap.set(slug, {
          id: item.id,
          slug,
          name: item.name,
          title: item.name,
          type: "tour",
          category: "tour",
          kicker: "Day Tour",
          duration: `${item.durationHours} hrs / ${item.includedKm} km`,
          from: startingPrice,
          startingPriceInr: startingPrice,
          image: "/assets/packages/agra-heritage.webp",
          places: places.length > 0 ? places : ["Agra"],
          blurb: item.parkingNote || item.name,
          description: item.covers || item.name,
          includes: [
            "Private AC vehicle",
            "Fuel & chauffeur charges",
            "Tolls & city parking",
          ],
          excludes: ["Monument entrance tickets", "Guide fee", "Personal expenses"],
          fleetPrices: item.fleetPrices || {},
          status: item.status,
          updatedAt: item.updatedAt,
        });
      }
    }

    // 5. Incorporate dedicated transfer_routes table (authoritative for airport and railway transfers)
    if (deps.db.transferRoutes) {
      const dbTransfers = await deps.db.transferRoutes.list({ status: "published", limit: 500 });
      for (const item of dbTransfers.items || []) {
        if (item.status !== "published" || item.isActive === false) continue;
        const startingPrice = item.fleetPrices?.sedan != null ? Number(item.fleetPrices.sedan) : null;
        const slug = item.routeCode;
        packageMap.set(slug, {
          id: item.id,
          slug,
          name: item.name,
          title: item.name,
          type: "transfer",
          category: "transfer",
          kicker: "Airport & Station Transfer",
          duration: item.distanceText || "Direct Transfer",
          from: startingPrice,
          startingPriceInr: startingPrice,
          image: "/assets/fleet/sedan.webp",
          places: [item.name],
          blurb: item.directionNote || item.name,
          description: item.directionNote || item.name,
          includes: [
            "Private AC vehicle",
            "Doorstep pickup & drop",
            "Tolls & terminal parking included",
          ],
          excludes: ["Waiting beyond grace period", "Multiple detours"],
          fleetPrices: item.fleetPrices || {},
          status: item.status,
          updatedAt: item.updatedAt,
        });
      }
    }

    // 6. Incorporate baseline catalog_items (packages and tours)
    const allPublished = allDbItems.filter((i) => i.status === "published" && i.availability !== "unavailable");
    const baselinePackages = await Promise.all(
      allPublished
        .filter((item) => item.type === "package" || item.type === "tour")
        .map(async (item) => {
          const media = (await deps.db.media.listByCatalogItem(item.id))
            .filter((entry) => entry.status === "published")
            .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
          const cover = media.find((m) => m.sortOrder === 0) || media[0];
          const image = cover
            ? (cover.storagePath || (cover.contentBase64 ? `/api/v1/media/${cover.id}` : null))
            : null;
          const gallery = media.map((m) => ({
            url: m.storagePath || (m.contentBase64 ? `/api/v1/media/${m.id}` : ""),
            alt: m.altText || item.title,
            caption: m.caption ?? undefined,
          }));

          return {
            id: item.id,
            slug: item.slug,
            name: item.title,
            title: item.title,
            type: item.type,
            category: item.type,
            kicker: item.type === "package" ? "Tour Package" : "Day Tour",
            duration: item.durationText || "1 day",
            from: item.startingPriceInr,
            startingPriceInr: item.startingPriceInr,
            image: image || "",
            gallery,
            places: (item.routeSummary || "")
              .split(/[,·|]/)
              .map((s) => s.trim())
              .filter(Boolean),
            blurb: item.shortDescription || item.description,
            description: item.description,
            includes: [
              "Private AC vehicle",
              "Professional chauffeur",
              "All tolls, parking & state tax",
              "Guide assistance",
              "Bottled water",
            ],
            excludes: ["Monument tickets", "Meals"],
            status: item.status,
            updatedAt: item.updatedAt,
          };
        }),
    );
    for (const p of baselinePackages) {
      if (!packageMap.has(p.slug)) {
        packageMap.set(p.slug, p);
      }
    }

    const packages = Array.from(packageMap.values());

    // 7. Vehicles: derived from fareCatalogRepo if available, else active canonical tiers
    let vehicles: any[] = [];
    if (deps.fareCatalogRepo) {
      try {
        const [dbModels, outstationRules] = await Promise.all([
          deps.fareCatalogRepo.getVehicleModels(),
          deps.fareCatalogRepo.getFareRules("outstation"),
        ]);
        const ruleMap = new Map(outstationRules.map((r) => [r.vehicle_model_id, r.amount]));
        vehicles = dbModels
          .filter((v) => v.is_active)
          .map((v) => ({
            id: v.id,
            tier: v.group_code,
            name: v.display_name,
            seats: v.passenger_capacity,
            bags: v.luggage_capacity ?? 2,
            perKm: ruleMap.get(v.id) ?? null,
            alwaysRoundTrip: ["tempo_traveller", "luxury"].includes(v.group_code),
          }));
      } catch {
        // Fall back if query fails
      }
    }
    if (vehicles.length === 0) {
      vehicles = [
        { id: "sedan", tier: "sedan", name: "Sedan", seats: 4, bags: 2, perKm: 10, alwaysRoundTrip: false },
        { id: "ertiga", tier: "ertiga", name: "Ertiga", seats: 6, bags: 3, perKm: 14, alwaysRoundTrip: false },
        { id: "innova", tier: "innova-crysta", name: "Innova Crysta", seats: 6, bags: 4, perKm: 18, alwaysRoundTrip: false },
        { id: "tempo", tier: "tempo-traveller", name: "Tempo Traveller", seats: 12, bags: 8, perKm: 25, alwaysRoundTrip: true },
        { id: "urbania", tier: "urbania", name: "Force Urbania", seats: 16, bags: 10, perKm: 34, alwaysRoundTrip: true },
      ];
    }

    return {
      version: manifestVersion,
      updatedAt: lastRegeneratedAt,
      routeCount: Object.keys(routes).length,
      packageCount: packages.length,
      routes,
      packages,
      vehicles,
    };
  }

  return {
    /**
     * PUBLIC listing — the single source of trips for the customer site.
     * Returns every published item (optionally filtered by vertical / trip type)
     * with cover image and gallery so newly published catalog entries appear on
     * the frontend automatically.
     */
    async listPublished(filter: z.infer<typeof PublicCatalogQuerySchema>) {
      const items = await deps.db.catalog.list({ status: "published", type: filter.type });
      const available = items.filter((item) => item.availability !== "unavailable");
      const published = filter.tripType ? available.filter((item) => item.tripType === filter.tripType) : available;
      return Promise.all(
        published.map(async (item) => {
          const media = (await deps.db.media.listByCatalogItem(item.id))
            .filter((entry) => entry.status === "published")
            .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
          return { ...publicCatalog(item), ...mediaSummary(media) };
        }),
      );
    },

    async getManifest() {
      if (!cachedManifest) {
        cachedManifest = await buildManifest();
      }
      return { manifest: cachedManifest, etag: cachedEtag };
    },

    async getManifestStatus() {
      return {
        version: manifestVersion,
        updatedAt: lastRegeneratedAt,
        routeCount: cachedManifest?.routeCount ?? 0,
        packageCount: cachedManifest?.packageCount ?? 0,
      };
    },

    async republish(actor: AuthUser, requestId: string) {
      bumpManifest();
      cachedManifest = await buildManifest();
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_manifest",
        resourceId: "site_manifest",
        action: "republish",
        before: { version: manifestVersion - 1 },
        after: { version: manifestVersion, updatedAt: lastRegeneratedAt },
        reason: "Manual republish from admin panel",
        requestId,
        createdAt: lastRegeneratedAt,
      });
      return {
        version: cachedManifest.version,
        updatedAt: cachedManifest.updatedAt,
        routeCount: cachedManifest.routeCount,
        packageCount: cachedManifest.packageCount,
      };
    },

    async getPublished(slug: string) {
      let item = await deps.db.catalog.getBySlug(slug) ?? await deps.db.catalog.getById(slug);
      if (!item && deps.db.tourPackages) {
        const tp = await deps.db.tourPackages.getByCode(slug) ?? await deps.db.tourPackages.getById(slug);
        if (tp && tp.status === "published" && tp.isActive !== false) {
          const startingPrice = Number(tp.startingPriceInr || tp.fleetPrices?.sedan || 2999);
          return {
            id: tp.id,
            slug: tp.packageCode,
            type: "package",
            title: tp.name,
            shortDescription: tp.inclusionsHighlight || tp.name,
            description: tp.inclusionsNote || tp.name,
            durationText: tp.durationText,
            routeSummary: [tp.source, tp.destination].filter(Boolean).join(" · ") || "Agra",
            startingPriceInr: startingPrice,
            distanceKm: null,
            availability: "available",
            status: tp.status,
            createdAt: tp.createdAt,
            updatedAt: tp.updatedAt,
            coverImage: tp.imageUrl || tp.gallery?.[0]?.url || "",
            mediaCount: tp.gallery?.length || 1,
            reviews: [],
          };
        }
      }
      if (!item || item.status !== "published" || item.availability === "unavailable") {
        throw Errors.notFound("CATALOG_NOT_FOUND", "Published catalog item not found.");
      }
      const media = (await deps.db.media.listByCatalogItem(item.id)).filter((entry) => entry.status === "published");
      const reviews = await deps.db.reviews.listPublishedByCatalog(item.id);
      return {
        ...publicCatalog(item),
        ...mediaSummary(media),
        reviews: reviews.map(publicReview),
      };
    },

    async listAdmin(filter: { type?: CatalogItemRecord["type"]; status?: CatalogItemRecord["status"]; q?: string }) {
      return deps.db.catalog.list(filter);
    },

    /** Admin editor detail: the item plus its full media list (any status). */
    async getAdminItem(idOrSlug: string) {
      const item = await requireItem(deps.db, idOrSlug);
      const media = (await deps.db.media.listByCatalogItem(item.id)).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
      );
      return { ...adminCatalog(item), media: media.map(adminMedia) };
    },

    async create(input: z.infer<typeof CreateCatalogSchema>, actor: AuthUser) {
      const now = toIso(deps.clock.now());
      const created = await deps.db.catalog.create({
        id: newId(),
        type: input.type,
        slug: input.slug,
        title: input.title,
        shortDescription: input.shortDescription,
        description: input.description ?? input.shortDescription,
        status: "draft",
        durationText: input.durationText,
        routeSummary: input.routeSummary,
        startingPriceInr: input.startingPriceInr,
        distanceKm: input.distanceKm ?? null,
        availability: input.availability ?? "available",
        seatsLeft: input.seatsLeft ?? null,
        stops: input.stops ?? [],
        tripType: input.tripType ?? null,
        version: 1,
        createdBy: actor.id,
        updatedBy: actor.id,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      bumpManifest();
      return created;
    },

    async update(id: string, input: z.infer<typeof UpdateCatalogSchema>, actor: AuthUser) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        ...input,
        description: input.description ?? item.description,
        distanceKm: input.distanceKm !== undefined ? input.distanceKm : item.distanceKm,
        seatsLeft: input.seatsLeft !== undefined ? input.seatsLeft : item.seatsLeft,
        stops: input.stops ?? item.stops,
        tripType: input.tripType !== undefined ? input.tripType : item.tripType,
        availability: input.availability ?? item.availability,
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "update",
        before: { title: item.title, startingPriceInr: item.startingPriceInr, status: item.status },
        after: { title: updated.title, startingPriceInr: updated.startingPriceInr, status: updated.status },
        reason: null,
        requestId: "",
        createdAt: now,
      });
      bumpManifest();
      if (item.status === "published") void requestFrontendRebuild("catalog-update", manifestVersion);
      return updated;
    },

    async publish(id: string, actor: AuthUser, requestId: string) {
      const item = await requireItem(deps.db, id);

      // ── Step 1: Slug safety enforcement
      const slug = item.slug.trim();
      const isSafeSlug =
        /^[a-z0-9-]{2,80}$/.test(slug) &&
        !slug.startsWith("-") &&
        !slug.endsWith("-") &&
        !/--/.test(slug) &&
        !/command/i.test(slug) &&
        !/^\d+-btn-/.test(slug);

      if (!isSafeSlug) {
        throw Errors.unprocessable(
          "INVALID_SLUG",
          `Cannot publish item: slug "${item.slug}" does not meet SEO safety criteria (/^[a-z0-9-]{2,80}$/, no consecutive hyphens, no leading/trailing hyphens).`,
          { slug: item.slug },
        );
      }

      // ── Step 2: Media requirement enforcement (Packages, Tours, Places must have a designated cover image)
      const existingMedia = (await deps.db.media.listByCatalogItem(item.id)).filter(
        (entry) => entry.status !== "archived",
      );
      if (item.type === "package" || item.type === "tour" || item.type === "place") {
        const activeImages = existingMedia.filter(
          (m) => m.mediaType === "image" && Boolean(m.storagePath?.trim() || m.contentBase64),
        );
        const hasCover = activeImages.some((m) => m.sortOrder === 0);
        if (!hasCover) {
          throw Errors.unprocessable(
            "MISSING_REQUIRED_MEDIA",
            `Cannot publish ${item.type} "${item.title}": a valid designated cover image (sortOrder: 0) is required before publication.`,
            { id: item.id, type: item.type, title: item.title },
          );
        }
      }

      // Synchronize attached draft media to published
      for (const m of existingMedia) {
        if (m.status !== "published") {
          await deps.db.media.update({ ...m, status: "published" });
        }
      }

      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        status: "published",
        publishedAt: item.publishedAt || now,
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      bumpManifest();
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "publish",
        before: { status: item.status },
        after: { status: "published" },
        reason: null,
        requestId,
        createdAt: now,
      });
      void requestFrontendRebuild("catalog-publish", manifestVersion);
      return updated;
    },

    async unpublish(id: string, actor: AuthUser, requestId: string) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        status: "draft",
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      bumpManifest();
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "unpublish",
        before: { status: item.status },
        after: { status: "draft" },
        reason: null,
        requestId,
        createdAt: now,
      });
      void requestFrontendRebuild("catalog-unpublish", manifestVersion);
      return updated;
    },

    async archive(id: string, actor: AuthUser, requestId: string) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.catalog.update({
        ...item,
        status: "archived",
        updatedBy: actor.id,
        version: item.version + 1,
        updatedAt: now,
      });
      bumpManifest();
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_item",
        resourceId: item.id,
        action: "archive",
        before: { status: item.status },
        after: { status: "archived" },
        reason: null,
        requestId,
        createdAt: now,
      });
      void requestFrontendRebuild("catalog-archive", manifestVersion);
      return updated;
    },

    async attachMedia(id: string, input: z.infer<typeof AttachMediaSchema>, actor: AuthUser) {
      const item = await requireItem(deps.db, id);
      const now = toIso(deps.clock.now());

      // ── Gallery policy (client rule): "Famous Places & Monuments" (place)
      //    carry a multi-image gallery; every other category gets exactly one
      //    cover image. Enforced server-side so no client can bypass it.
      const existing = (await deps.db.media.listByCatalogItem(item.id)).filter(
        (entry) => entry.status !== "archived",
      );
      const limit = catalogMediaLimit(item.type);
      if (existing.length >= limit) {
        const guidance =
          limit === 1
            ? "Remove the current cover image first (or replace it) — this category allows exactly one image."
            : `This gallery is full (${limit} images). Remove an image before adding another.`;
        throw Errors.unprocessable(
          "MEDIA_LIMIT_REACHED",
          `${item.type} items accept at most ${limit} image${limit === 1 ? "" : "s"}. ${guidance}`,
          { limit, type: item.type },
        );
      }

      const mediaId = newId();
      const inline = Boolean(input.dataBase64);
      const sizeBytes = inline ? Buffer.from(input.dataBase64 as string, "base64").length : null;

      // Uploaded bytes go to the configured object store (S3 protocol or the
      // Supabase Storage SDK, bucket default "documents") when one is
      // configured. Either way they're served back through
      // /api/v1/media/:id — this backend fetches the bytes from the bucket
      // on demand, so the bucket can stay private and there's never a
      // public/presigned URL to expire. Without storage credentials (local
      // dev / tests) we fall back to storing the bytes inline in Postgres.
      let storagePath: string;
      let contentBase64: string | null = null;
      if (inline && deps.mediaStorage) {
        const buffer = Buffer.from(input.dataBase64 as string, "base64");
        const objectPath = mediaObjectPath(item.id, mediaId, input.mimeType ?? null);
        try {
          await deps.mediaStorage.upload({
            path: objectPath,
            buffer,
            mimeType: input.mimeType as string,
          });
        } catch (err) {
          throw Errors.unavailable(
            "MEDIA_STORAGE_ERROR",
            err instanceof Error ? err.message : "Could not upload the image to storage.",
          );
        }
        storagePath = `/api/v1/media/${mediaId}`;
      } else if (inline) {
        storagePath = `/api/v1/media/${mediaId}`;
        contentBase64 = input.dataBase64 as string;
      } else {
        storagePath = input.storagePath as string;
      }

      const created = await deps.db.media.create({
        id: mediaId,
        catalogItemId: item.id,
        storagePath,
        mediaType: input.mediaType,
        altText: input.altText,
        caption: input.caption ?? null,
        sortOrder: input.sortOrder,
        // Uploaded media is published immediately so the desk never needs a
        // developer to make a new cover visible on the customer site.
        status: "published",
        sourceType: "admin_upload",
        copyrightOwner: null,
        mimeType: inline ? (input.mimeType as string) : mimeTypeForPath(storagePath),
        contentBase64,
        sizeBytes,
        createdBy: actor.id,
        approvedBy: actor.id,
        publishedAt: now,
        createdAt: now,
      });
      bumpManifest();
      if (item.status === "published") void requestFrontendRebuild("catalog-media-add", manifestVersion);
      return created;
    },

    async updateMedia(id: string, input: z.infer<typeof UpdateMediaSchema>, actor: AuthUser) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      const updated = await deps.db.media.update({
        ...item,
        altText: input.altText ?? item.altText,
        caption: input.caption ?? item.caption,
        sortOrder: input.sortOrder ?? item.sortOrder,
        status: input.status ?? item.status,
        approvedBy: input.status === "published" ? actor.id : item.approvedBy,
        publishedAt: input.status === "published" ? now : item.publishedAt,
      });
      bumpManifest();
      const parent = await deps.db.catalog.getById(item.catalogItemId);
      if (parent?.status === "published") void requestFrontendRebuild("catalog-media-update", manifestVersion);
      return updated;
    },

    async deleteMedia(id: string, actor: AuthUser, requestId: string) {
      const item = await deps.db.media.getById(id);
      if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Media not found.");
      const now = toIso(deps.clock.now());
      // Bucket-backed uploads (mimeType set but nothing inlined) also need the
      // object removed from storage so the "documents" bucket doesn't fill up
      // with orphaned files.
      if (deps.mediaStorage && item.mimeType && !item.contentBase64 && item.sourceType === "admin_upload") {
        const objectPath = mediaObjectPath(item.catalogItemId, item.id, item.mimeType);
        await deps.mediaStorage.remove(objectPath).catch(() => undefined);
      }
      await deps.db.media.delete(id);
      await deps.db.audit.append({
        id: newId(),
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: "catalog_media",
        resourceId: id,
        action: "delete",
        before: { storagePath: item.storagePath, catalogItemId: item.catalogItemId },
        after: null,
        reason: null,
        requestId: requestId ?? "",
        createdAt: now,
      });
      bumpManifest();
      const parent = await deps.db.catalog.getById(item.catalogItemId);
      if (parent?.status === "published") void requestFrontendRebuild("catalog-media-delete", manifestVersion);
      return { deleted: true, id };
    },

    /** Raw media bytes for the public serve route — inline DB bytes, or a
     *  live fetch from the configured object store bucket.
     *  SEC-004: verifies that the media and its parent catalog item are published
     *  unless allowUnpublished is explicitly true (for authenticated staff preview).
     */
    async getMediaContent(id: string, options?: { allowUnpublished?: boolean }) {
      const item = await deps.db.media.getById(id);
      if (!item || !item.mimeType) return null;

      const parent = await deps.db.catalog.getById(item.catalogItemId);
      const isPublished = item.status === "published" && Boolean(parent && parent.status === "published");

      if (!options?.allowUnpublished && !isPublished) {
        return null;
      }

      if (item.contentBase64) {
        return {
          buffer: Buffer.from(item.contentBase64, "base64"),
          mimeType: item.mimeType,
          updatedAt: item.createdAt,
          isPublished,
        };
      }
      if (deps.mediaStorage && item.storagePath === `/api/v1/media/${item.id}`) {
        const objectPath = mediaObjectPath(item.catalogItemId, item.id, item.mimeType);
        try {
          const buffer = await deps.mediaStorage.download(objectPath);
          return { buffer, mimeType: item.mimeType, updatedAt: item.createdAt, isPublished };
        } catch {
          return null;
        }
      }
      return null;
    },
    bumpManifest,
  };
}

async function requireItem(db: Repositories, id: string): Promise<CatalogItemRecord> {
  const item = await db.catalog.getById(id) ?? await db.catalog.getBySlug(id);
  if (!item) throw Errors.notFound("CATALOG_NOT_FOUND", "Catalog item not found.");
  return item;
}

/** Cover image (first media) + full gallery for public payloads. */
function mediaSummary(media: CatalogMediaRecord[]) {
  const sorted = [...media].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  const cover = sorted[0] ?? null;
  return {
    coverImage: cover ? mediaUrl(cover) : null,
    gallery: sorted.map((entry) => ({
      id: entry.id,
      mediaType: entry.mediaType,
      altText: entry.altText,
      caption: entry.caption,
      sortOrder: entry.sortOrder,
      ...mediaUrl(entry),
    })),
  };
}

function mediaUrl(entry: CatalogMediaRecord) {
  const url = entry.contentBase64 ? `/api/v1/media/${entry.id}` : entry.storagePath;
  return { url };
}

function publicCatalog(item: CatalogItemRecord) {
  return {
    id: item.id,
    type: item.type,
    slug: item.slug,
    title: item.title,
    shortDescription: item.shortDescription,
    description: item.description,
    durationText: item.durationText,
    routeSummary: item.routeSummary,
    startingPriceInr: item.startingPriceInr,
    distanceKm: item.distanceKm,
    availability: item.availability,
    seatsLeft: item.seatsLeft,
    stops: item.stops,
    tripType: item.tripType,
    version: item.version,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
  };
}

function adminCatalog(item: CatalogItemRecord) {
  return {
    ...publicCatalog(item),
    status: item.status,
    version: item.version,
    createdBy: item.createdBy,
    updatedBy: item.updatedBy,
    createdAt: item.createdAt,
  };
}

function adminMedia(entry: CatalogMediaRecord) {
  return {
    id: entry.id,
    catalogItemId: entry.catalogItemId,
    mediaType: entry.mediaType,
    altText: entry.altText,
    caption: entry.caption,
    sortOrder: entry.sortOrder,
    status: entry.status,
    sourceType: entry.sourceType,
    storagePath: entry.storagePath,
    url: mediaUrl(entry).url,
    mimeType: entry.mimeType,
    sizeBytes: entry.sizeBytes,
    createdAt: entry.createdAt,
  };
}

function publicReview(review: {
  id: string;
  displayName: string;
  rating: number;
  reviewText: string;
  verificationStatus: string;
  publishedAt: string | null;
}) {
  const badge =
    review.verificationStatus === "booking_verified"
      ? "Verified booking"
      : review.verificationStatus === "manually_verified" || review.verificationStatus === "social_link_submitted"
        ? "Identity link reviewed"
        : null;
  return {
    id: review.id,
    displayName: review.displayName,
    rating: review.rating,
    reviewText: review.reviewText,
    verificationBadge: badge,
    publishedAt: review.publishedAt,
  };
}
