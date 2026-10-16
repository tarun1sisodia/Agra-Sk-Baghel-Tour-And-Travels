// backend/src/modules/local-packages/local-packages.service.ts
import type { Repositories } from "../../db/types.js";
import type { LocalSightseeingPackageRecord } from "../../db/dossier-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type {
  CreateLocalPackageInput,
  UpdateLocalPackageInput,
} from "./local-packages.schema.js";

function toRecord(input: CreateLocalPackageInput, now: string, id = newId()): LocalSightseeingPackageRecord {
  return {
    id,
    packageCode: input.package_code,
    name: input.name,
    durationHours: input.duration_hours,
    includedKm: input.included_km,
    covers: input.covers,
    parkingNote: input.parking_note ?? null,
    fleetPrices: input.fleet_prices,
    usePerKm: input.use_per_km,
    extraRates: input.extra_rates ?? null,
    nightChargeInr: input.night_charge_inr,
    status: input.status ?? "draft",
    isActive: input.is_active,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLocalPackagesService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list(query: { status?: string; q?: string; page?: number; limit?: number }) {
      return deps.db.localPackages.list(query as any);
    },
    async get(id: string) {
      const item = await deps.db.localPackages.getById(id);
      if (!item) throw Errors.notFound("LOCAL_PACKAGE_NOT_FOUND", "Local package not found.");
      return item;
    },
    async getByCode(code: string) {
      const item = await deps.db.localPackages.getByCode(code);
      if (!item) throw Errors.notFound("LOCAL_PACKAGE_NOT_FOUND", "Local package not found.");
      return item;
    },
    async checkCode(code: string) {
      return { available: !(await deps.db.localPackages.getByCode(code)) };
    },
    async create(input: CreateLocalPackageInput) {
      const existing = await deps.db.localPackages.getByCode(input.package_code);
      if (existing) throw Errors.conflict("PACKAGE_CODE_TAKEN", "Package code is already in use.");
      const now = toIso(deps.clock.now());
      const item = await deps.db.localPackages.create(toRecord(input, now));
      if (item.status === "published") {
        await deps.db.publishEvents?.enqueue({
          entityType: "local_package",
          entityId: item.id,
          eventType: "published",
        });
        await triggerFrontendRebuild({
          reason: "local-package-published",
          entityType: "local_package",
          entityId: item.id,
          slug: item.packageCode,
        });
      }
      return item;
    },
    async update(id: string, input: UpdateLocalPackageInput) {
      const current = await this.get(id);
      if (input.package_code && input.package_code !== current.packageCode) {
        throw Errors.unprocessable(
          "PACKAGE_CODE_IMMUTABLE",
          "Package code cannot change after creation — it forms the public URL."
        );
      }
      const now = toIso(deps.clock.now());
      const priceEdited =
        (input.fleet_prices !== undefined && JSON.stringify(input.fleet_prices) !== JSON.stringify(current.fleetPrices)) ||
        (input.extra_rates !== undefined && JSON.stringify(input.extra_rates) !== JSON.stringify(current.extraRates));

      const merged: LocalSightseeingPackageRecord = {
        ...current,
        name: input.name ?? current.name,
        durationHours: input.duration_hours ?? current.durationHours,
        includedKm: input.included_km ?? current.includedKm,
        covers: input.covers ?? current.covers,
        parkingNote: input.parking_note === undefined ? current.parkingNote : input.parking_note,
        fleetPrices: input.fleet_prices ?? current.fleetPrices,
        usePerKm: input.use_per_km !== undefined ? input.use_per_km : current.usePerKm,
        extraRates: input.extra_rates === undefined ? current.extraRates : input.extra_rates,
        nightChargeInr: input.night_charge_inr !== undefined ? input.night_charge_inr : current.nightChargeInr,
        status: input.status ?? current.status,
        isActive: input.is_active !== undefined ? input.is_active : current.isActive,
        updatedAt: now,
      };

      const updated = await deps.db.localPackages.update(merged);
      if (current.status === "published" && priceEdited) {
        await deps.db.publishEvents?.enqueue({
          entityType: "local_package",
          entityId: current.id,
          eventType: "price_changed",
        });
        await triggerFrontendRebuild({
          reason: "local-package-price-edited",
          entityType: "local_package",
          entityId: current.id,
          slug: current.packageCode,
        });
      }
      return updated;
    },
    async publish(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.localPackages.update({
        ...item,
        status: "published",
        updatedAt: toIso(deps.clock.now()),
      });
      await deps.db.publishEvents?.enqueue({
        entityType: "local_package",
        entityId: item.id,
        eventType: "published",
      });
      await triggerFrontendRebuild({
        reason: "local-package-publish",
        entityType: "local_package",
        entityId: item.id,
        slug: item.packageCode,
      });
      return updated;
    },
    async archive(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.localPackages.update({
        ...item,
        status: "archived",
        updatedAt: toIso(deps.clock.now()),
      });
      await deps.db.publishEvents?.enqueue({
        entityType: "local_package",
        entityId: item.id,
        eventType: "archived",
      });
      await triggerFrontendRebuild({
        reason: "local-package-archive",
        entityType: "local_package",
        entityId: item.id,
        slug: item.packageCode,
      });
      return updated;
    },
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status !== "draft") {
        throw Errors.unprocessable(
          "LOCAL_PACKAGE_ARCHIVE_INSTEAD",
          "Published packages cannot be deleted; archive instead."
        );
      }
      return deps.db.localPackages.delete(id);
    },
  };
}
