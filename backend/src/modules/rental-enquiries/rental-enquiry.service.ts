import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { AppError, Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { FareCatalogRepository } from "../fare-catalog/fare-catalog.repository.js";
import { CreateRentalEnquirySchema, type CreateRentalEnquiryInput } from "./rental-enquiry.schema.js";
import type { CanonicalVehicleGroup, RentalCarTier } from "../../types/domain.js";

const VALID_GROUPS: Set<string> = new Set(["sedan", "suv", "luxury", "tempo_traveller"]);

function mapGroupToLegacyTier(groupCode?: string | null): RentalCarTier {
  switch (groupCode) {
    case "sedan": return "sedan";
    case "suv": return "ertiga";
    case "luxury": return "innova";
    case "tempo_traveller": return "tempo";
    default: return "sedan";
  }
}

function mapLegacyTierToGroup(tier?: string | null): CanonicalVehicleGroup {
  switch (tier) {
    case "sedan": return "sedan";
    case "ertiga":
    case "innova": return "suv";
    case "urbania": return "luxury";
    case "tempo": return "tempo_traveller";
    default: return "sedan";
  }
}

export function createRentalEnquiryService(deps: {
  db: Repositories;
  clock: Clock;
  fareCatalogRepo?: FareCatalogRepository | null;
}) {
  return {
    async create(rawInput: CreateRentalEnquiryInput) {
      const input = CreateRentalEnquirySchema.parse(rawInput);
      const now = deps.clock.now();

      // Resolve vehicleGroupCode
      const groupCode: CanonicalVehicleGroup =
        input.vehicleGroupCode ||
        (input.carTier ? mapLegacyTierToGroup(input.carTier) : "sedan");

      if (!VALID_GROUPS.has(groupCode)) {
        throw new AppError("INVALID_VEHICLE_GROUP", `Vehicle group "${groupCode}" is not recognized.`, 400);
      }

      // Validate group and model against canonical fleet repository if available
      let validatedModelId: string | null = null;
      let modelDisplayName: string | null = null;
      let groupDisplayName: string | null = null;

      if (deps.fareCatalogRepo) {
        const liveGroups = await deps.fareCatalogRepo.getVehicleGroups();
        const activeGroup = liveGroups.find((g) => g.code === groupCode && g.is_active);
        if (!activeGroup) {
          throw new AppError(
            "INVALID_VEHICLE_GROUP",
            `Vehicle group "${groupCode}" was not found or is currently inactive.`,
            400
          );
        }
        groupDisplayName = activeGroup.name;

        // If a specific model is selected, validate it against canonical fleet
        if (input.vehicleModelId) {
          const model = await deps.fareCatalogRepo.getVehicleModelById(input.vehicleModelId);
          if (!model || !model.is_active) {
            throw new AppError(
              "INVALID_VEHICLE_MODEL",
              "Selected vehicle model was not found or is currently inactive.",
              400
            );
          }
          if (model.group_code !== groupCode) {
            throw new AppError(
              "VEHICLE_GROUP_MISMATCH",
              `Selected vehicle model "${model.display_name}" does not belong to the "${groupCode}" group.`,
              400
            );
          }
          validatedModelId = model.id;
          modelDisplayName = model.display_name;
          if (model.group_name) {
            groupDisplayName = model.group_name;
          }
        }
      } else if (input.vehicleModelId) {
        // If fareCatalogRepo is not provided (e.g. lightweight unit test environment), accept valid UUID
        validatedModelId = input.vehicleModelId;
      }

      // Ensure backward-compatible legacy car_tier fallback
      const legacyCarTier: RentalCarTier = input.carTier || mapGroupToLegacyTier(groupCode);

      const created = await deps.db.rentalEnquiries.create({
        id: newId(),
        ref: `RNT-${now.getUTCFullYear()}-${String(Date.now()).slice(-6)}`,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        carTier: legacyCarTier,
        vehicleGroupCode: groupCode,
        vehicleModelId: validatedModelId,
        vehicleModelName: modelDisplayName,
        vehicleGroupName: groupDisplayName,
        destinationOrItinerary: input.destinationOrItinerary || null,
        passengers: input.passengers ?? null,
        pickupDate: input.pickupDate,
        returnDate: input.returnDate,
        pickupLocation: input.pickupLocation,
        withDriver: input.withDriver ?? true,
        note: input.note || null,
        status: "new",
        notes: [],
        createdAt: toIso(now),
        updatedAt: toIso(now),
      });

      return created;
    },

    async list(filter: Parameters<Repositories["rentalEnquiries"]["list"]>[0]) {
      return deps.db.rentalEnquiries.list(filter);
    },

    async update(id: string, updates: { status?: string; note?: string }) {
      const current = await deps.db.rentalEnquiries.getById(id);
      if (!current) throw Errors.notFound("RENTAL_ENQUIRY_NOT_FOUND", "Rental request not found.");
      if (updates.status) current.status = updates.status as typeof current.status;
      if (updates.note) current.notes = [...current.notes, updates.note];
      current.updatedAt = toIso(deps.clock.now());
      return deps.db.rentalEnquiries.update(current);
    },
  };
}
