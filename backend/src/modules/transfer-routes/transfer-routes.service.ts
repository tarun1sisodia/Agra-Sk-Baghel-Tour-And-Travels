// backend/src/modules/transfer-routes/transfer-routes.service.ts
import type { Repositories } from "../../db/types.js";
import type { TransferRouteRecord } from "../../db/dossier-types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type {
  CreateTransferRouteInput,
  UpdateTransferRouteInput,
} from "./transfer-routes.schema.js";

function toRecord(input: CreateTransferRouteInput, now: string, id = newId()): TransferRouteRecord {
  return {
    id,
    routeCode: input.route_code,
    name: input.name,
    distanceText: input.distance_text ?? null,
    directionNote: input.direction_note ?? null,
    fleetPrices: input.fleet_prices,
    usePerKm: input.use_per_km,
    nightChargeInr: input.night_charge_inr,
    status: input.status ?? "draft",
    isActive: input.is_active,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTransferRoutesService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list(query: { status?: string; q?: string; page?: number; limit?: number }) {
      return deps.db.transferRoutes.list(query as any);
    },
    async get(id: string) {
      const item = await deps.db.transferRoutes.getById(id);
      if (!item) throw Errors.notFound("TRANSFER_ROUTE_NOT_FOUND", "Transfer route not found.");
      return item;
    },
    async getByCode(code: string) {
      const item = await deps.db.transferRoutes.getByCode(code);
      if (!item) throw Errors.notFound("TRANSFER_ROUTE_NOT_FOUND", "Transfer route not found.");
      return item;
    },
    async checkCode(code: string) {
      return { available: !(await deps.db.transferRoutes.getByCode(code)) };
    },
    async create(input: CreateTransferRouteInput) {
      const existing = await deps.db.transferRoutes.getByCode(input.route_code);
      if (existing) throw Errors.conflict("ROUTE_CODE_TAKEN", "Route code is already in use.");
      const now = toIso(deps.clock.now());
      const record = toRecord(input, now);
      return deps.db.transaction(async (tx) => {
        const item = await tx.transferRoutes.create(record);
        if (item.status === "published") {
          await tx.publishEvents.enqueue({
            entityType: "transfer",
            entityId: item.id,
            eventType: "published",
          });
        }
        return item;
      });
    },
    async update(id: string, input: UpdateTransferRouteInput) {
      const current = await this.get(id);
      if (input.route_code && input.route_code !== current.routeCode) {
        throw Errors.unprocessable(
          "ROUTE_CODE_IMMUTABLE",
          "Route code cannot change after creation — it forms the public URL."
        );
      }
      const now = toIso(deps.clock.now());
      const priceEdited =
        input.fleet_prices !== undefined &&
        JSON.stringify(input.fleet_prices) !== JSON.stringify(current.fleetPrices);

      const merged: TransferRouteRecord = {
        ...current,
        name: input.name ?? current.name,
        distanceText: input.distance_text === undefined ? current.distanceText : input.distance_text,
        directionNote: input.direction_note === undefined ? current.directionNote : input.direction_note,
        fleetPrices: input.fleet_prices ?? current.fleetPrices,
        usePerKm: input.use_per_km !== undefined ? input.use_per_km : current.usePerKm,
        nightChargeInr: input.night_charge_inr !== undefined ? input.night_charge_inr : current.nightChargeInr,
        status: input.status ?? current.status,
        isActive: input.is_active !== undefined ? input.is_active : current.isActive,
        updatedAt: now,
      };

      return deps.db.transaction(async (tx) => {
        const updated = await tx.transferRoutes.update(merged);
        if (current.status === "published" && priceEdited) {
          await tx.publishEvents.enqueue({
            entityType: "transfer",
            entityId: current.id,
            eventType: "price_changed",
          });
        }
        return updated;
      });
    },
    async publish(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      return deps.db.transaction(async (tx) => {
        const updated = await tx.transferRoutes.update({
          ...item,
          status: "published",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "transfer",
          entityId: item.id,
          eventType: "published",
        });
        return updated;
      });
    },
    async archive(id: string) {
      const item = await this.get(id);
      const now = toIso(deps.clock.now());
      return deps.db.transaction(async (tx) => {
        const updated = await tx.transferRoutes.update({
          ...item,
          status: "archived",
          updatedAt: now,
        });
        await tx.publishEvents.enqueue({
          entityType: "transfer",
          entityId: item.id,
          eventType: "archived",
        });
        return updated;
      });
    },
    async remove(id: string) {
      const item = await this.get(id);
      if (item.status !== "draft") {
        throw Errors.unprocessable(
          "TRANSFER_ARCHIVE_INSTEAD",
          "Published transfer routes cannot be deleted; archive instead."
        );
      }
      return deps.db.transferRoutes.delete(id);
    },
  };
}
