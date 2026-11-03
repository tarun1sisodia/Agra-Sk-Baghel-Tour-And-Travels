import { describe, expect, it, vi } from "vitest";
import type { LocalSightseeingPackageRecord } from "../../src/db/dossier-types.js";

const db = vi.hoisted(() => ({
  calls: [] as Array<{ sql: string; params: unknown[] }>,
  row: null as Record<string, unknown> | null,
}));

// Exercise the repository SQL and parameter order without contacting production DB.
vi.mock("pg", () => ({
  default: {
    Pool: class {
      on() {}
      async query(sql: string, params: unknown[] = []) {
        db.calls.push({ sql, params });
        if (sql.includes("insert into local_packages")) {
          db.row = {
            id: params[0], code: params[1], name: params[2], duration_hours: params[3],
            included_km: params[4], covers: params[5], inclusions_note: params[6],
            status: params[7], created_at: params[8], updated_at: params[9],
            extra_rates: JSON.parse(String(params[10])), night_charge_inr: params[11], use_per_km: params[12],
          };
          return { rows: [{ id: params[0] }] };
        }
        if (sql.includes("update local_packages set")) {
          const byId = sql.includes("where id = $1::uuid");
          const offset = byId ? 0 : 1;
          db.row = {
            ...db.row,
            name: params[byId ? 2 : 1], duration_hours: params[byId ? 3 : 2],
            included_km: params[byId ? 4 : 3], covers: params[byId ? 5 : 4],
            inclusions_note: params[byId ? 6 : 5], status: params[byId ? 7 : 6],
            updated_at: params[byId ? 8 : 7],
            extra_rates: JSON.parse(String(params[9 - offset])),
            night_charge_inr: params[10 - offset], use_per_km: params[11 - offset],
          };
          return { rows: [{ id: db.row.id }] };
        }
        return { rows: db.row ? [db.row] : [] };
      }
    },
  },
}));

import { createPostgresRepositories } from "../../src/db/postgres.js";

const original: LocalSightseeingPackageRecord = {
  id: "30000000-0000-0000-0001-000000000001",
  packageCode: "agra-local-test",
  name: "Agra Local Test",
  durationHours: 8,
  includedKm: 80,
  covers: "Taj Mahal",
  parkingNote: null,
  fleetPrices: {},
  usePerKm: false,
  extraRates: { sedan: { per_km: 13, per_hr: 175 } },
  nightChargeInr: 225,
  status: "published",
  isActive: true,
  createdAt: "2026-10-16T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
};

describe("PostgreSQL local package surcharge persistence", () => {
  it("writes rates on create and update, then exposes the stored rates on read", async () => {
    db.calls.length = 0;
    db.row = null;
    const repos = await createPostgresRepositories("postgres://mock");
    await repos.localPackages.create(original);
    const insert = db.calls.find(({ sql }) => sql.includes("insert into local_packages"));
    expect(insert?.sql).toContain("extra_rates");
    expect(insert?.sql).toContain("extra_rates = excluded.extra_rates");
    expect(insert?.params[10]).toBe(JSON.stringify(original.extraRates));
    expect((await repos.localPackages.getByCode(original.packageCode))?.extraRates).toEqual(original.extraRates);

    const revised = { ...original, extraRates: { suv: { per_km: 19, per_hr: 240 } }, nightChargeInr: 0 };
    await repos.localPackages.update(revised);
    const update = db.calls.find(({ sql }) => sql.includes("update local_packages set"));
    expect(update?.sql).toContain("extra_rates = $10::jsonb");
    expect(update?.params[9]).toBe(JSON.stringify(revised.extraRates));
    expect((await repos.localPackages.getById(original.id))?.extraRates).toEqual(revised.extraRates);
    expect((await repos.localPackages.getById(original.id))?.nightChargeInr).toBe(0);
    const select = db.calls.find(({ sql }) => sql.includes("FROM local_packages lp"));
    expect(select?.sql).not.toMatch(/null as extra_rates/i);
  });
});
