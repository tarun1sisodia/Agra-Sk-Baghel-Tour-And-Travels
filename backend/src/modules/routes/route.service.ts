/**
 * @file route.service.ts — Business logic for intercity highway routes, corridor fares, and lifecycle states.
 * @usage Called by RouteController; interacts with PostgreSQL 'routes' table and triggers rebuild hooks.
 */

import type { Repositories } from "../../db/types.js";
import type { RouteCatalogRecord } from "../../db/route-catalog-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { OUTSTATION_RULES, VEHICLES } from "../fares/fare.catalogue.js";
import type { CreateRouteInput, UpdateRouteInput } from "./route.schema.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 74);
}

/**
 * Generates an SEO-canonical slug for a highway route.
 * @param type - Trip type ('one-way' | 'round-trip')
 * @param source - Origin city name
 * @param destination - Destination city name
 * @returns Formatted slug string e.g. "agra-to-delhi-taxi"
 * @caller RouteController, Admin route creation form
 * @destination Database slug uniqueness check
 */
export function makeRouteSlug(type: string, source: string, destination: string): string {
  const s = slugify(source);
  const d = slugify(destination);
  return `${s}-to-${d}-${type === "round-trip" ? "round-trip-" : ""}taxi`.replace(/--+/g, "-");
}

function toRecord(input: CreateRouteInput, now: string, id = newId()): RouteCatalogRecord {
  return {
    id,
    tripType: input.trip_type,
    sourceCity: input.source_city,
    sourceDetail: input.source_detail ?? null,
    destinationCity: input.destination_city ?? null,
    slug: input.slug,
    distanceKm: input.distance_km ?? null,
    durationText: input.duration_text ?? null,
    availableFleets: input.available_fleets,
    faresInr: input.fares_inr,
    driverChargeInr: input.driver_charge_inr,
    nightHaltInr: input.night_halt_inr,
    tollIncluded: input.toll_included,
    tollAmountInr: input.toll_amount_inr ?? null,
    interstateCharges: input.interstate_charges,
    minKmPerDay: input.min_km_per_day,
    stops: input.stops,
    usePerKm: input.use_per_km,
    perKmRateOverride: input.per_km_rate_override ?? null,
    highway: input.highway ?? null,
    allInclusiveNote: input.all_inclusive_note ?? null,
    status: "draft",
    needsReview: input.needs_review,
    createdAt: now,
    updatedAt: now,
  };
}

export function createRouteService(deps: { db: Repositories; clock: Clock; bumpManifest?: () => void }) {
  return {
    /**
     * Lists routes with pagination and filters.
     * @param query - Filter by trip_type, status, or search query
     */
    async list(query: { trip_type?: string; status?: string; q?: string; page?: number; limit?: number }) {
      return deps.db.routeCatalog.list({
        tripType: query.trip_type as any,
        status: query.status as any,
        q: query.q,
        page: query.page,
        limit: query.limit,
      });
    },

    /**
     * Fetches a single route by its UUID.
     * @param id - Route UUID
     */
    async get(id: string) {
      const item = await deps.db.routeCatalog.getById(id);
      if (!item) throw Errors.notFound("ROUTE_NOT_FOUND", "Highway route not found.");
      return item;
    },

    /**
     * Fetches a single published route by its public slug.
     * @param slug - Route slug
     */
    async getBySlug(slug: string) {
      const item = await deps.db.routeCatalog.getBySlug(slug);
      if (!item) throw Errors.notFound("ROUTE_NOT_FOUND", "Highway route not found.");
      return item;
    },

    /**
     * Checks if a route slug is available.
     * @param slug - Desired route slug
     */
    async checkSlug(slug: string) {
      const item = await deps.db.routeCatalog.getBySlug(slug);
      return { available: !item };
    },

    /**
     * Returns vehicle fleet reference data.
     */
    async fleets() {
      return VEHICLES.map((v) => ({
        id: v.id,
        name: v.name,
        seats: v.seats,
        bags: v.bags,
        perKm: v.perKm,
      }));
    },

    /**
     * Suggests fares based on distance and standard fleet rates.
     */
    async suggestFares(input: { trip_type: "one-way" | "round-trip"; distance_km: number }) {
      const billedKm =
        input.trip_type === "round-trip"
          ? Math.max(input.distance_km * OUTSTATION_RULES.sameDayRoundMultiplier, OUTSTATION_RULES.minKmPerDay)
          : input.distance_km;
      return Object.fromEntries(VEHICLES.map((v) => [v.id, Math.round(billedKm * v.perKm)]));
    },

    /**
     * Creates a new highway route in draft state.
     * @param input - Validated route creation payload
     */
    async create(input: CreateRouteInput) {
      const now = toIso(deps.clock.now());
      const existing = await deps.db.routeCatalog.getBySlug(input.slug);
      if (existing) throw Errors.conflict("ROUTE_SLUG_TAKEN", "Route slug is already in use.");
      const record = await deps.db.routeCatalog.create(toRecord(input, now));
      deps.bumpManifest?.();
      return record;
    },

    /**
     * Updates an existing highway route.
     * @param id - Route UUID
     * @param input - Partial route update payload
     */
    async update(id: string, input: UpdateRouteInput) {
      const current = await this.get(id);
      if (input.slug && input.slug !== current.slug) {
        throw Errors.unprocessable("ROUTE_SLUG_IMMUTABLE", "Slug cannot be changed after creation — it is the canonical URL.");
      }
      const now = toIso(deps.clock.now());
      const merged = {
        ...current,
        updatedAt: now,
        tripType: input.trip_type ?? current.tripType,
        sourceCity: input.source_city ?? current.sourceCity,
        sourceDetail: input.source_detail === undefined ? current.sourceDetail : input.source_detail,
        destinationCity: input.destination_city === undefined ? current.destinationCity : input.destination_city,
        distanceKm: input.distance_km === undefined ? current.distanceKm : input.distance_km,
        durationText: input.duration_text === undefined ? current.durationText : input.duration_text,
        availableFleets: input.available_fleets ?? current.availableFleets,
        faresInr: input.fares_inr ?? current.faresInr,
        driverChargeInr: input.driver_charge_inr ?? current.driverChargeInr,
        nightHaltInr: input.night_halt_inr ?? current.nightHaltInr,
        tollIncluded: input.toll_included ?? current.tollIncluded,
        tollAmountInr: input.toll_amount_inr === undefined ? current.tollAmountInr : input.toll_amount_inr,
        interstateCharges: input.interstate_charges ?? current.interstateCharges,
        minKmPerDay: input.min_km_per_day ?? current.minKmPerDay,
        stops: input.stops ?? current.stops,
        usePerKm: input.use_per_km ?? current.usePerKm,
        perKmRateOverride: input.per_km_rate_override === undefined ? current.perKmRateOverride : input.per_km_rate_override,
        highway: input.highway === undefined ? current.highway : input.highway,
        allInclusiveNote: input.all_inclusive_note === undefined ? current.allInclusiveNote : input.all_inclusive_note,
        needsReview: input.needs_review ?? current.needsReview,
      } as RouteCatalogRecord;

      const updated = await deps.db.routeCatalog.update(merged);
      deps.bumpManifest?.();
      return updated;
    },

    /**
     * Publishes a draft or archived route to make it live.
     * @param id - Route UUID
     */
    async publish(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.transaction(async (tx) => {
        const res = await tx.routeCatalog.update({
          ...item,
          status: "published",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "outstation_route",
          entityId: item.id,
          eventType: "published",
        });
        return res;
      });
      deps.bumpManifest?.();
      return updated;
    },

    /**
     * Archives an active route.
     * @param id - Route UUID
     */
    async archive(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      const updated = await deps.db.transaction(async (tx) => {
        const res = await tx.routeCatalog.update({
          ...item,
          status: "archived",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "outstation_route",
          entityId: item.id,
          eventType: "archived",
        });
        return res;
      });
      deps.bumpManifest?.();
      return updated;
    },

    /**
     * Hard-deletes a draft or archived route.
     * @param id - Route UUID
     */
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status === "published") {
        throw Errors.unprocessable("ROUTE_PUBLISHED_CANNOT_DELETE", "Cannot delete a published route. Archive it first.");
      }
      await deps.db.routeCatalog.delete(id);
      deps.bumpManifest?.();
    },
  };
}
