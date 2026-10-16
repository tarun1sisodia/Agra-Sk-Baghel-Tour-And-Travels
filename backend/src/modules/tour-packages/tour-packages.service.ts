// backend/src/modules/tour-packages/tour-packages.service.ts
import type { Repositories } from "../../db/types.js";
import type { TourPackageRecord, PackageVehicleUpgradeRecord } from "../../db/dossier-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { MediaStorage } from "../catalog/media.storage.js";
import { mediaExtensionFor } from "../catalog/media.storage.js";
import type {
  CreateTourPackageInput,
  TourPackageUpgradeInput,
  UpdateTourPackageInput,
  UploadTourPackageImageInput,
} from "./tour-packages.schema.js";

const inMemoryMediaCache = new Map<string, { buffer: Buffer; mimeType: string }>();

function toRecord(input: CreateTourPackageInput, now: string, id = newId()): TourPackageRecord {
  return {
    id,
    packageCode: input.package_code,
    name: input.name,
    durationText: input.duration_text,
    days: input.days,
    nights: input.nights,
    baseTierCode: input.base_tier_code,
    startingPriceInr: input.starting_price_inr,
    fleetPrices: input.fleet_prices,
    nightChargeInr: input.night_charge_inr,
    inclusionsHighlight: input.inclusions_highlight ?? null,
    inclusionsNote: input.inclusions_note ?? null,
    source: input.source ?? "Agra",
    destination: input.destination ?? "",
    inclusions: input.inclusions ?? [],
    exclusions: input.exclusions ?? [],
    itinerary: input.itinerary ?? [],
    imageUrl: input.image_url ?? null,
    gallery: input.gallery ?? [],
    status: input.status ?? "draft",
    isActive: input.is_active,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTourPackagesService(deps: {
  db: Repositories;
  clock: Clock;
  mediaStorage?: MediaStorage | null;
}) {
  return {
    async list(query: { status?: string; q?: string; page?: number; limit?: number }) {
      return deps.db.tourPackages.list(query as any);
    },
    async get(id: string) {
      const item = await deps.db.tourPackages.getById(id);
      if (!item) throw Errors.notFound("TOUR_PACKAGE_NOT_FOUND", "Tour package not found.");
      return item;
    },
    async getByCode(code: string) {
      const item = await deps.db.tourPackages.getByCode(code);
      if (!item) throw Errors.notFound("TOUR_PACKAGE_NOT_FOUND", "Tour package not found.");
      return item;
    },
    async checkCode(code: string) {
      return { available: !(await deps.db.tourPackages.getByCode(code)) };
    },
    async create(input: CreateTourPackageInput) {
      const existing = await deps.db.tourPackages.getByCode(input.package_code);
      if (existing) throw Errors.conflict("PACKAGE_CODE_TAKEN", "Package code is already in use.");
      const now = toIso(deps.clock.now());
      const item = await deps.db.tourPackages.create(toRecord(input, now));
      if (item.status === "published") {
        await deps.db.publishEvents?.enqueue({
          entityType: "tour_package",
          entityId: item.id,
          eventType: "published",
        });
        await triggerFrontendRebuild({
          reason: "tour-package-published",
          entityType: "tour_package",
          entityId: item.id,
          slug: item.packageCode,
        });
      }
      return item;
    },
    async update(id: string, input: UpdateTourPackageInput) {
      const current = await this.get(id);
      if (input.package_code && input.package_code !== current.packageCode) {
        throw Errors.unprocessable(
          "PACKAGE_CODE_IMMUTABLE",
          "Package code cannot change after creation — it forms the public URL."
        );
      }
      const now = toIso(deps.clock.now());
      const priceEdited =
        (input.starting_price_inr !== undefined && input.starting_price_inr !== current.startingPriceInr) ||
        (input.fleet_prices !== undefined && JSON.stringify(input.fleet_prices) !== JSON.stringify(current.fleetPrices));
      const contentEdited =
        priceEdited ||
        (input.source !== undefined && input.source !== current.source) ||
        (input.destination !== undefined && input.destination !== current.destination) ||
        (input.inclusions !== undefined && JSON.stringify(input.inclusions) !== JSON.stringify(current.inclusions)) ||
        (input.exclusions !== undefined && JSON.stringify(input.exclusions) !== JSON.stringify(current.exclusions)) ||
        (input.itinerary !== undefined && JSON.stringify(input.itinerary) !== JSON.stringify(current.itinerary)) ||
        (input.image_url !== undefined && input.image_url !== current.imageUrl) ||
        (input.gallery !== undefined && JSON.stringify(input.gallery) !== JSON.stringify(current.gallery));

      const merged: TourPackageRecord = {
        ...current,
        name: input.name ?? current.name,
        durationText: input.duration_text ?? current.durationText,
        days: input.days ?? current.days,
        nights: input.nights ?? current.nights,
        baseTierCode: input.base_tier_code ?? current.baseTierCode,
        startingPriceInr: input.starting_price_inr ?? current.startingPriceInr,
        fleetPrices: input.fleet_prices ?? current.fleetPrices,
        nightChargeInr: input.night_charge_inr !== undefined ? input.night_charge_inr : current.nightChargeInr,
        inclusionsHighlight:
          input.inclusions_highlight === undefined ? current.inclusionsHighlight : input.inclusions_highlight,
        inclusionsNote: input.inclusions_note === undefined ? current.inclusionsNote : input.inclusions_note,
        source: input.source !== undefined ? input.source : (current.source ?? "Agra"),
        destination: input.destination !== undefined ? input.destination : (current.destination ?? ""),
        inclusions: input.inclusions !== undefined ? input.inclusions : (current.inclusions ?? []),
        exclusions: input.exclusions !== undefined ? input.exclusions : (current.exclusions ?? []),
        itinerary: input.itinerary !== undefined ? input.itinerary : (current.itinerary ?? []),
        imageUrl: input.image_url !== undefined ? input.image_url : current.imageUrl,
        gallery: input.gallery !== undefined ? input.gallery : (current.gallery ?? []),
        status: input.status ?? current.status,
        isActive: input.is_active !== undefined ? input.is_active : current.isActive,
        updatedAt: now,
      };

      const updated = await deps.db.tourPackages.update(merged);
      if (current.status === "published" && contentEdited) {
        await deps.db.publishEvents?.enqueue({
          entityType: "tour_package",
          entityId: current.id,
          eventType: priceEdited ? "price_changed" : "updated",
        });
        await triggerFrontendRebuild({
          reason: "tour-package-content-edited",
          entityType: "tour_package",
          entityId: current.id,
          slug: current.packageCode,
        });
      }
      return updated;
    },
    async publish(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.tourPackages.update({
        ...item,
        status: "published",
        updatedAt: toIso(deps.clock.now()),
      });
      await deps.db.publishEvents?.enqueue({
        entityType: "tour_package",
        entityId: item.id,
        eventType: "published",
      });
      await triggerFrontendRebuild({
        reason: "tour-package-publish",
        entityType: "tour_package",
        entityId: item.id,
        slug: item.packageCode,
      });
      return updated;
    },
    async archive(id: string) {
      const item = await this.get(id);
      const updated = await deps.db.tourPackages.update({
        ...item,
        status: "archived",
        updatedAt: toIso(deps.clock.now()),
      });
      await deps.db.publishEvents?.enqueue({
        entityType: "tour_package",
        entityId: item.id,
        eventType: "archived",
      });
      await triggerFrontendRebuild({
        reason: "tour-package-archive",
        entityType: "tour_package",
        entityId: item.id,
        slug: item.packageCode,
      });
      return updated;
    },
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status !== "draft") {
        throw Errors.unprocessable(
          "TOUR_ARCHIVE_INSTEAD",
          "Published tour packages cannot be deleted; archive instead."
        );
      }
      return deps.db.tourPackages.delete(id);
    },
    async listUpgrades(packageId?: string | null) {
      return deps.db.tourPackages.listUpgrades(packageId);
    },
    async saveUpgrade(input: TourPackageUpgradeInput) {
      const now = toIso(deps.clock.now());
      const record: PackageVehicleUpgradeRecord = {
        id: input.id ?? newId(),
        packageId: input.package_id ?? null,
        tierCode: input.tier_code,
        passengerNote: input.passenger_note ?? null,
        surchargeInr: input.surcharge_inr,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await deps.db.tourPackages.saveUpgrade(record);
      await triggerFrontendRebuild("upgrade-matrix-updated");
      return saved;
    },
    async deleteUpgrade(id: string) {
      const deleted = await deps.db.tourPackages.deleteUpgrade(id);
      if (!deleted) throw Errors.notFound("PACKAGE_UPGRADE_NOT_FOUND", "Package vehicle upgrade not found.");
      await triggerFrontendRebuild("upgrade-matrix-updated");
    },
    async uploadImage(input: UploadTourPackageImageInput) {
      const mediaId = newId();
      const ext = mediaExtensionFor(input.mimeType);
      const filename = `${mediaId}.${ext}`;
      const buffer = Buffer.from(input.dataBase64, "base64");

      inMemoryMediaCache.set(filename, { buffer, mimeType: input.mimeType });

      let url = `/api/v1/tour-packages/media/${filename}`;
      if (deps.mediaStorage) {
        try {
          await deps.mediaStorage.upload({
            path: `packages/${filename}`,
            buffer,
            mimeType: input.mimeType,
          });
          const publicUrl = deps.mediaStorage.getPublicUrl?.(`packages/${filename}`);
          if (publicUrl) url = publicUrl;
        } catch (err) {
          console.warn("[TourPackages] Remote media storage upload failed (image kept in cache):", err);
        }
      }

      return {
        url,
        alt: input.altText,
        caption: input.caption,
      };
    },
    async getMedia(filename: string) {
      const cached = inMemoryMediaCache.get(filename);
      if (cached) return cached;

      if (deps.mediaStorage) {
        try {
          const buffer = await deps.mediaStorage.download(`packages/${filename}`);
          const ext = filename.split(".").pop()?.toLowerCase() || "";
          const mimeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            avif: "image/avif",
          };
          const mimeType = mimeMap[ext] || "application/octet-stream";
          inMemoryMediaCache.set(filename, { buffer, mimeType });
          return { buffer, mimeType };
        } catch {
          return null;
        }
      }
      return null;
    },
  };
}
