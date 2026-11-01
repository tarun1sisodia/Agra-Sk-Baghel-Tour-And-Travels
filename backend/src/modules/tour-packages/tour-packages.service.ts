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

// Status transition rules: only super_admin can publish/archive
// draft -> published (via publish action or create with published status)
// draft -> archived (via archive action or create with archived status)
// published -> archived (via archive action)
// published -> published (no-op, allowed for status field updates)
// archived -> published (via publish action only)
// archived -> archived (no-op, allowed for status field updates)
type StatusTransition = {
  from: "draft" | "published" | "archived";
  to: "draft" | "published" | "archived";
  allowed: boolean;
  requiresSuperAdmin: boolean;
};

const ALLOWED_TRANSITIONS: StatusTransition[] = [
  { from: "draft", to: "draft", allowed: true, requiresSuperAdmin: false },
  { from: "draft", to: "published", allowed: true, requiresSuperAdmin: true },
  { from: "draft", to: "archived", allowed: true, requiresSuperAdmin: true },
  { from: "published", to: "draft", allowed: false, requiresSuperAdmin: false },
  { from: "published", to: "published", allowed: true, requiresSuperAdmin: false },
  { from: "published", to: "archived", allowed: true, requiresSuperAdmin: true },
  { from: "archived", to: "draft", allowed: false, requiresSuperAdmin: false },
  { from: "archived", to: "published", allowed: true, requiresSuperAdmin: true },
  { from: "archived", to: "archived", allowed: true, requiresSuperAdmin: false },
];

function validateStatusTransition(currentStatus: string, newStatus: string): { valid: boolean; error?: string; requiresSuperAdmin?: boolean } {
  const transition = ALLOWED_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === newStatus
  );
  if (!transition) {
    return {
      valid: false,
      error: `Invalid status transition from "${currentStatus}" to "${newStatus}".`,
    };
  }
  if (!transition.allowed) {
    return {
      valid: false,
      error: `Transition from "${currentStatus}" to "${newStatus}" is not allowed.`,
    };
  }
  return { valid: true, requiresSuperAdmin: transition.requiresSuperAdmin };
}

const MAX_CACHE_SIZE = 50; // Maximum number of media files to cache in memory
const MAX_FILE_SIZE = 5_000_000; // 5MB max file size for security

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
    fleetPrices: input.fleet_prices as Record<string, number>,
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
  bumpManifest?: () => void;
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
      const record = toRecord(input, now);
      const status = record.status ?? "draft";

      // Validate status transition - only super_admin can create with published/archived status
      if (status !== "draft") {
        const { valid, error } = validateStatusTransition("draft", status);
        if (!valid) {
          throw Errors.unprocessable("INVALID_STATUS_TRANSITION", error || "Invalid status transition");
        }
      }

      return deps.db.transaction(async (tx) => {
        const item = await tx.tourPackages.create(record);
        if (item.status === "published") {
          await tx.publishEvents.enqueue({
            entityType: "tour_package",
            entityId: item.id,
            eventType: "published",
          });
        }
        deps.bumpManifest?.();
        return item;
      });
    },
    async update(id: string, input: UpdateTourPackageInput) {
      const current = await this.get(id);
      if (input.package_code && input.package_code !== current.packageCode) {
        throw Errors.unprocessable(
          "PACKAGE_CODE_IMMUTABLE",
          "Package code cannot change after creation — it forms the public URL."
        );
      }

      // Validate status transition if status is being changed
      const newStatus = input.status ?? current.status;
      if (newStatus !== current.status) {
        const { valid, error } = validateStatusTransition(current.status, newStatus);
        if (!valid) {
          throw Errors.unprocessable("INVALID_STATUS_TRANSITION", error || "Invalid status transition");
        }
      }

      const now = toIso(deps.clock.now());
      const priceEdited =
        (input.starting_price_inr !== undefined && input.starting_price_inr !== current.startingPriceInr) ||
        (input.fleet_prices !== undefined && JSON.stringify(input.fleet_prices) !== JSON.stringify(current.fleetPrices));
      const contentEdited =
        priceEdited ||
        (input.name !== undefined && input.name !== current.name) ||
        (input.duration_text !== undefined && input.duration_text !== current.durationText) ||
        (input.days !== undefined && input.days !== current.days) ||
        (input.nights !== undefined && input.nights !== current.nights) ||
        (input.source !== undefined && input.source !== current.source) ||
        (input.destination !== undefined && input.destination !== current.destination) ||
        (input.inclusions !== undefined && JSON.stringify(input.inclusions) !== JSON.stringify(current.inclusions)) ||
        (input.exclusions !== undefined && JSON.stringify(input.exclusions) !== JSON.stringify(current.exclusions)) ||
        (input.itinerary !== undefined && JSON.stringify(input.itinerary) !== JSON.stringify(current.itinerary)) ||
        (input.image_url !== undefined && input.image_url !== current.imageUrl) ||
        (input.gallery !== undefined && JSON.stringify(input.gallery) !== JSON.stringify(current.gallery)) ||
        (input.inclusions_highlight !== undefined && input.inclusions_highlight !== current.inclusionsHighlight) ||
        (input.inclusions_note !== undefined && input.inclusions_note !== current.inclusionsNote);

      const merged: TourPackageRecord = {
        ...current,
        name: input.name ?? current.name,
        durationText: input.duration_text ?? current.durationText,
        days: input.days ?? current.days,
        nights: input.nights ?? current.nights,
        baseTierCode: input.base_tier_code ?? current.baseTierCode,
        startingPriceInr: input.starting_price_inr ?? current.startingPriceInr,
        fleetPrices: (input.fleet_prices ?? current.fleetPrices) as Record<string, number>,
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
        status: newStatus,
        isActive: input.is_active !== undefined ? input.is_active : current.isActive,
        updatedAt: now,
      };

      return deps.db.transaction(async (tx) => {
        const updated = await tx.tourPackages.update(merged);
        if (current.status === "published" && contentEdited) {
          await tx.publishEvents.enqueue({
            entityType: "tour_package",
            entityId: current.id,
            eventType: priceEdited ? "price_changed" : "updated",
          });
        }
        deps.bumpManifest?.();
        return updated;
      });
    },
    async publish(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      return deps.db.transaction(async (tx) => {
        const updated = await tx.tourPackages.update({
          ...item,
          status: "published",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "tour_package",
          entityId: item.id,
          eventType: "published",
        });
        deps.bumpManifest?.();
        return updated;
      });
    },
    async archive(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      return deps.db.transaction(async (tx) => {
        const updated = await tx.tourPackages.update({
          ...item,
          status: "archived",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "tour_package",
          entityId: item.id,
          eventType: "archived",
        });
        deps.bumpManifest?.();
        return updated;
      });
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
      const storagePath = `packages/${filename}`;
      let url = `/api/v1/tour-packages/media/${filename}`;
      // Enforce file size limit at upload time (same as download limit)
      if (buffer.length > MAX_FILE_SIZE) {
        throw Errors.unprocessable(
          "FILE_TOO_LARGE",
          `Image size (${Math.round(buffer.length / 1024)} KB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024} KB.`
        );
      }

      if (deps.mediaStorage) {
        try {
          await deps.mediaStorage.upload({
            path: storagePath,
            buffer,
            mimeType: input.mimeType,
          });
        } catch (err: any) {
          console.error(`[TourPackages] Remote media storage upload failed (${err?.message}); image will not be durable.`);
          // Don't return success if storage upload failed
          throw Errors.unprocessable(
            "STORAGE_UPLOAD_FAILED",
            `Image upload to storage failed. Please try again. Error: ${err?.message}`
          );
        }
      } else {
        // No storage configured - warn but allow in-memory fallback for development
        console.warn("[TourPackages] No media storage configured; images will only be available in server memory.");
      }

      // Keep cache for fast retrieval and local/fallback serving
      inMemoryMediaCache.set(filename, { buffer, mimeType: input.mimeType });

      return {
        url,
        alt: input.altText,
        caption: input.caption,
      };
    },
    async getMedia(filename: string) {
      // Security: Prevent path traversal attacks and ensure valid filename format
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes("..")) {
        return null;
      }

      const cached = inMemoryMediaCache.get(filename);
      if (cached) return cached;

      if (deps.mediaStorage) {
        try {
          const buffer = await deps.mediaStorage.download(`packages/${filename}`);

          // Security: Check file size before caching
          if (buffer.length > MAX_FILE_SIZE) {
            console.warn(`[TourPackages] Storage file ${filename} exceeds size limit (${buffer.length} bytes > ${MAX_FILE_SIZE} bytes)`);
            return null;
          }

          const ext = filename.split(".").pop()?.toLowerCase() || "";
          const mimeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            avif: "image/avif",
          };
          const mimeType = mimeMap[ext] || "application/octet-stream";

          // Enforce cache size limit (LRU eviction)
          if (inMemoryMediaCache.size >= MAX_CACHE_SIZE) {
            const firstKey = inMemoryMediaCache.keys().next().value;
            if (firstKey) inMemoryMediaCache.delete(firstKey);
          }

          inMemoryMediaCache.set(filename, { buffer, mimeType });
          return { buffer, mimeType };
        } catch (err: any) {
          console.error(`[TourPackages] Storage read failed for ${filename}: ${err?.message}`);
          return null;
        }
      }
      return null;
    },
  };
}
