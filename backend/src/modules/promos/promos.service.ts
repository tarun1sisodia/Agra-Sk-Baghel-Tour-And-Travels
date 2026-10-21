import { randomUUID } from "node:crypto";
import type { Repositories } from "../../db/types.js";
import { AppError, Errors } from "../../shared/errors.js";
import type { PromoCodeRecord } from "../../types/domain.js";
import { CreatePromoSchema, UpdatePromoSchema, type CreatePromoInput, type UpdatePromoInput } from "./promos.schema.js";

export type FeaturedPromoResponse = {
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  allowGroupVehicles: boolean;
};

export function createPromosService(deps: { db: Repositories }) {
  const { db } = deps;

  return {
    async list(): Promise<PromoCodeRecord[]> {
      return db.promos.list();
    },

    async get(id: string): Promise<PromoCodeRecord> {
      const promo = await db.promos.getById(id);
      if (!promo) {
        throw Errors.notFound("PROMO_NOT_FOUND", "Promo code not found.");
      }
      return promo;
    },

    async getFeatured(): Promise<FeaturedPromoResponse | null> {
      const promo = await db.promos.getFeatured();
      if (!promo) return null;
      return {
        code: promo.code,
        discountAmount: promo.discountAmount,
        minTotal: promo.minTotal,
        description: promo.description,
        allowGroupVehicles: promo.allowGroupVehicles,
      };
    },

    async create(rawInput: CreatePromoInput): Promise<PromoCodeRecord> {
      const input = CreatePromoSchema.parse(rawInput);
      const code = input.code.trim().toUpperCase();
      const existing = await db.promos.getByCode(code);
      if (existing) {
        throw Errors.conflict("PROMO_EXISTS", `Promo code "${code}" already exists.`);
      }

      if (input.isBroadcast) {
        const all = await db.promos.list();
        const otherBroadcast = all.find((p) => p.isBroadcast);
        if (otherBroadcast) {
          throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
        }
      }

      const record: PromoCodeRecord = {
        id: randomUUID(),
        code,
        discountAmount: input.discountAmount,
        minTotal: input.minTotal ?? 0,
        description: input.description,
        isActive: input.isActive ?? true,
        maxRedemptions: input.maxRedemptions ?? null,
        redemptionCount: 0,
        validFrom: input.validFrom ?? null,
        validTo: input.validTo ?? null,
        allowGroupVehicles: input.allowGroupVehicles ?? false,
        isBroadcast: input.isBroadcast ?? false,
      };

      try {
        return await db.promos.create(record);
      } catch (err: any) {
        if (
          err?.code === "23505" &&
          (err?.constraint === "idx_promo_codes_single_broadcast" ||
            String(err?.message).includes("idx_promo_codes_single_broadcast"))
        ) {
          throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
        }
        throw err;
      }
    },

    async update(id: string, rawInput: UpdatePromoInput): Promise<PromoCodeRecord> {
      const input = UpdatePromoSchema.parse(rawInput);
      const existing = await db.promos.getById(id);
      if (!existing) {
        throw Errors.notFound("PROMO_NOT_FOUND", "Promo code not found.");
      }

      if (input.code && input.code.trim().toUpperCase() !== existing.code) {
        const codeConflict = await db.promos.getByCode(input.code.trim().toUpperCase());
        if (codeConflict && codeConflict.id !== id) {
          throw Errors.conflict("PROMO_EXISTS", `Promo code "${input.code}" already exists.`);
        }
      }

      if (input.isBroadcast) {
        const all = await db.promos.list();
        const otherBroadcast = all.find((p) => p.isBroadcast && p.id !== id);
        if (otherBroadcast) {
          throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
        }
      }

      const updated: PromoCodeRecord = {
        ...existing,
        code: input.code ? input.code.trim().toUpperCase() : existing.code,
        discountAmount: input.discountAmount !== undefined ? input.discountAmount : existing.discountAmount,
        minTotal: input.minTotal !== undefined ? input.minTotal : existing.minTotal,
        description: input.description !== undefined ? input.description : existing.description,
        isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
        maxRedemptions: input.maxRedemptions !== undefined ? input.maxRedemptions : existing.maxRedemptions,
        validFrom: input.validFrom !== undefined ? input.validFrom : existing.validFrom,
        validTo: input.validTo !== undefined ? input.validTo : existing.validTo,
        allowGroupVehicles:
          input.allowGroupVehicles !== undefined ? input.allowGroupVehicles : existing.allowGroupVehicles,
        isBroadcast: input.isBroadcast !== undefined ? input.isBroadcast : existing.isBroadcast,
      };

      try {
        return await db.promos.update(updated);
      } catch (err: any) {
        if (
          err?.code === "23505" &&
          (err?.constraint === "idx_promo_codes_single_broadcast" ||
            String(err?.message).includes("idx_promo_codes_single_broadcast"))
        ) {
          throw new AppError("BROADCAST_CONFLICT", "Another code is already broadcast. Turn it off first.", 409);
        }
        throw err;
      }
    },

    async remove(id: string): Promise<void> {
      const existing = await db.promos.getById(id);
      if (!existing) {
        throw Errors.notFound("PROMO_NOT_FOUND", "Promo code not found.");
      }
      await db.promos.delete(id);
    },
  };
}
