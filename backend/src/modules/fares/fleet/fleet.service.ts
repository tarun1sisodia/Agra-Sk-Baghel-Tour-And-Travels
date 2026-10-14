import { toCanonicalTierKey } from "../../../contracts/vehicle-tiers.js";
import type { Repositories } from "../../../db/types.js";
import { VEHICLES } from "../fare.catalogue.js";
import type { FleetGroup, FleetQueryResult, PublicFleetVehicle } from "./fleet.types.js";

/**
 * Resolves the live fleet configuration by reading default catalogue specifications
 * and merging active database fare rules (with desk-side vehicle edits for name, seats, bags, perKm, active),
 * as well as canonical vehicle_groups and vehicle_models from the database.
 */
export async function resolveFleet(
  db?: Repositories,
  defaultVersion: string = "2026-09-13",
): Promise<FleetQueryResult> {
  const base: PublicFleetVehicle[] = VEHICLES.map((v) => ({
    id: v.id,
    tier: v.tier,
    name: v.name,
    seats: v.seats,
    bags: v.bags,
    perKm: v.perKm,
    active: true,
  }));

  if (!db) {
    return { version: defaultVersion, vehicles: base };
  }

  let groups: FleetGroup[] | undefined;
  if (db.pool) {
    try {
      const groupsRes = await db.pool.query(
        "SELECT id, code, name, sort_order, is_active FROM vehicle_groups WHERE is_active = true ORDER BY sort_order ASC, name ASC",
      );
      const modelsRes = await db.pool.query(
        "SELECT id, vehicle_group_id, make, model_name, display_name, passenger_capacity, luggage_capacity, image_url, sort_order, is_active FROM vehicle_models WHERE is_active = true ORDER BY sort_order ASC, display_name ASC",
      );
      const rulesRes = await db.pool.query(
        "SELECT vehicle_model_id, amount FROM fare_rules WHERE category = 'outstation' AND is_active = true",
      );
      const ruleMap = new Map<string, number>(
        rulesRes.rows.map((r: any) => [String(r.vehicle_model_id), Number(r.amount)]),
      );

      groups = groupsRes.rows.map((g: any) => {
        const vList = modelsRes.rows
          .filter((m: any) => m.vehicle_group_id === g.id)
          .map((m: any) => ({
            id: String(m.id),
            make: String(m.make),
            modelName: String(m.model_name),
            displayName: String(m.display_name),
            groupCode: String(g.code),
            groupName: String(g.name),
            seats: Number(m.passenger_capacity),
            bags: Number(m.luggage_capacity ?? 2),
            perKm: ruleMap.get(String(m.id)) ?? null,
            imageUrl: m.image_url ? String(m.image_url) : null,
            active: Boolean(m.is_active),
          }));
        return {
          id: String(g.id),
          code: String(g.code),
          name: String(g.name),
          sortOrder: Number(g.sort_order),
          vehicles: vList,
        };
      });
    } catch {
      // Ignore if pool or tables not accessible
    }
  }

  const rule = await db.fareRules.getActive();
  const cfgVehicles =
    rule && Array.isArray((rule.config as Record<string, unknown>).vehicles)
      ? ((rule.config as Record<string, unknown>).vehicles as Array<Record<string, unknown>>)
      : [];

  const vehicles = base.map((v) => {
    // C-ENUM-001: override keys are normalized to canonical tier keys, so
    // desk-side entries keyed by historical short ids (innova/tempo) still match.
    const override = cfgVehicles.find((ov) => {
      const key = toCanonicalTierKey(String(ov.tier ?? ov.id ?? ""));
      return key !== undefined && key === v.tier;
    });

    if (!override) return v;

    return {
      ...v,
      name:
        typeof override.name === "string" && override.name.trim()
          ? override.name.trim()
          : v.name,
      seats:
        typeof override.seats === "number" && override.seats > 0
          ? Math.floor(override.seats)
          : v.seats,
      bags:
        typeof override.bags === "number" && override.bags >= 0
          ? Math.floor(override.bags)
          : v.bags,
      perKm:
        typeof override.perKm === "number" && override.perKm > 0
          ? override.perKm
          : v.perKm,
      active: typeof override.active === "boolean" ? override.active : v.active,
    };
  });

  return {
    version: rule?.version ?? defaultVersion,
    vehicles,
    groups,
  };
}

