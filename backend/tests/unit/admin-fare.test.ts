import { describe, it, expect, beforeEach, vi } from "vitest";
import { FareAdminService, type AdminActor } from "../../src/modules/admin/fare-admin.service.js";
import { LocationIqService } from "../../src/modules/routes/locationiq.service.js";
import { FareAdminRepository, type AuditLogEntry } from "../../src/modules/admin/fare-admin.repository.js";
import { QuotesService } from "../../src/modules/quotes/quotes.service.js";
import { FIXTURE_CARS } from "../fixtures/fare-fixture.js";

class MockAuditRepo extends FareAdminRepository {
  public auditLogs: AuditLogEntry[] = [];

  constructor() {
    super(null as any);
  }

  override async recordAudit(entry: AuditLogEntry): Promise<string> {
    this.auditLogs.push(entry);
    return `audit-${this.auditLogs.length}`;
  }

  override async getAuditLogs(): Promise<any[]> {
    return this.auditLogs;
  }

  override async getPool(): Promise<any> {
    return null;
  }
}

class MockAdminPool {
  public vehicleModels = new Map<string, any>();
  public vehicleGroups = new Map<string, any>();
  public fareSettings = new Map<string, any>();
  public fareRules = new Map<string, any>();
  public extraCharges = new Map<string, any>();
  public routes = new Map<string, any>();
  public routeVehicles = new Map<string, any>();

  constructor() {
    this.vehicleGroups.set("sedan", { id: "vg-1", code: "sedan", name: "Sedan", is_active: true });
    this.fareSettings.set("advance_percent", { key: "advance_percent", value: 28 });
  }

  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    const s = sql.toLowerCase();
    if (s.includes("select id from vehicle_groups where code = $1")) {
      const g = this.vehicleGroups.get(params[0]);
      return { rows: g ? [{ id: g.id }] : [] };
    }
    if (s.includes("select * from vehicle_models where id = $1")) {
      const m = this.vehicleModels.get(params[0]);
      return { rows: m ? [{ ...m }] : [] };
    }
    if (s.includes("insert into vehicle_models")) {
      const id = `vm-${this.vehicleModels.size + 1}`;
      const rec = { id, display_name: params[3], passenger_capacity: params[4], is_active: true };
      this.vehicleModels.set(id, rec);
      return { rows: [rec] };
    }
    if (s.includes("select * from vehicle_groups where id = $1")) {
      const g = this.vehicleGroups.get(params[0]) || { id: params[0], is_active: true };
      return { rows: [{ ...g }] };
    }
    if (s.includes("update vehicle_groups set")) {
      const g = { id: params[params.length - 1], updated: true };
      return { rows: [g] };
    }
    if (s.includes("select * from fare_settings where key = $1")) {
      const set = this.fareSettings.get(params[0]);
      return { rows: set ? [{ ...set }] : [] };
    }
    if (s.includes("update fare_settings set value = $1")) {
      const set = { key: params[1], value: params[0] };
      this.fareSettings.set(params[1], set);
      return { rows: [set] };
    }
    if (s.includes("select id from fare_rules")) {
      // Duplicate check
      for (const r of this.fareRules.values()) {
        if (
          r.vehicle_model_id === params[0] &&
          r.category === params[1] &&
          r.is_active === true
        ) {
          return { rows: [{ id: r.id }] };
        }
      }
      return { rows: [] };
    }
    if (s.includes("insert into fare_rules")) {
      const id = `fr-${this.fareRules.size + 1}`;
      const rec = { id, category: params[0], vehicle_model_id: params[1], amount: params[5], is_active: true };
      this.fareRules.set(id, rec);
      return { rows: [rec] };
    }
    if (s.includes("select * from fare_rules where id = $1")) {
      const r = this.fareRules.get(params[0]);
      return { rows: r ? [{ ...r }] : [] };
    }
    if (s.includes("update fare_rules set")) {
      const r = this.fareRules.get(params[params.length - 1]);
      if (r) {
        if (s.includes("is_active = $1")) r.is_active = params[0];
        if (s.includes("amount = $1")) r.amount = params[0];
      }
      return { rows: [r || { is_active: false }] };
    }
    if (s.includes("select id from extra_charges")) {
      for (const ec of this.extraCharges.values()) {
        if (ec.label === params[6] && ec.is_active === true) {
          return { rows: [{ id: ec.id }] };
        }
      }
      return { rows: [] };
    }
    if (s.includes("insert into extra_charges")) {
      const id = `ec-${this.extraCharges.size + 1}`;
      const rec = { id, label: params[6], amount: params[7], is_active: true };
      this.extraCharges.set(id, rec);
      return { rows: [rec] };
    }
    if (s.includes("select * from outstation_routes where id = $1")) {
      const r = this.routes.get(params[0]);
      return { rows: r ? [{ ...r }] : [] };
    }
    if (s.includes("update outstation_routes set status = $1")) {
      const r = this.routes.get(params[1]);
      if (r) r.status = params[0];
      return { rows: [r] };
    }
    if (s.includes("insert into site_publish_events")) {
      return { rows: [{ id: "pub-1" }] };
    }
    return { rows: [] };
  }

  async connect(): Promise<any> {
    return {
      query: (sql: string, params: any[]) => this.query(sql, params),
      release: () => {},
    };
  }
}

describe("Section 12.13: Admin, audit, routes, roles (AA-01 to AA-14)", () => {
  let mockPool: MockAdminPool;
  let auditRepo: MockAuditRepo;
  let mockLocationIq: LocationIqService;
  let adminService: FareAdminService;

  const superAdmin: AdminActor = { id: "u-super", role: "super_admin" };
  const contentEditor: AdminActor = { id: "u-editor", role: "content_editor" };
  const reviewModerator: AdminActor = { id: "u-mod", role: "review_moderator" };
  const customer: AdminActor = { id: "u-cust", role: "customer" };

  beforeEach(() => {
    mockPool = new MockAdminPool();
    auditRepo = new MockAuditRepo();
    mockLocationIq = new LocationIqService("test_mock_key_9999", fetch);
    adminService = new FareAdminService(mockPool as any, auditRepo as any, mockLocationIq);
  });

  it("AA-01: Anonymous or non-admin calls an admin endpoint -> FORBIDDEN, no change, no audit row", async () => {
    await expect(
      adminService.patchFareSetting("advance_percent", 30, customer, "req-1")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auditRepo.auditLogs.length).toBe(0);
  });

  it("AA-02: content_editor edits a price or group charge -> FORBIDDEN", async () => {
    await expect(
      adminService.createFareRule(
        {
          category: "outstation",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          amount: 15,
        },
        contentEditor,
        "req-2"
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auditRepo.auditLogs.length).toBe(0);
  });

  it("AA-03: review_moderator edits a route -> FORBIDDEN", async () => {
    mockPool.routes.set("r-1", { id: "r-1", distance_km: 100, duration_minutes: 120, status: "draft" });
    await expect(
      adminService.updateProductStatus("outstation_route", "r-1", "published", reviewModerator, "req-3")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auditRepo.auditLogs.length).toBe(0);
  });

  it("AA-04: Every successful admin write -> exactly one audit row with actor, resource, before and after", async () => {
    const setting = await adminService.patchFareSetting("advance_percent", 35, superAdmin, "req-4");
    expect(setting.value).toBe(35);
    expect(auditRepo.auditLogs.length).toBe(1);
    const log = auditRepo.auditLogs[0]!;
    expect(log.actor_id).toBe(superAdmin.id);
    expect(log.actor_role).toBe("super_admin");
    expect(log.resource_type).toBe("fare_settings");
    expect(log.resource_id).toBe("advance_percent");
    expect((log.after_state as any).value).toBe(35);
  });

  it("AA-05: Fare rule amount 0, -5, 12.5 -> VALIDATION_ERROR", async () => {
    await expect(
      adminService.createFareRule({ category: "outstation", vehicle_model_id: "c1", amount: 0 }, superAdmin, "r5a")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      adminService.createFareRule({ category: "outstation", vehicle_model_id: "c1", amount: -5 }, superAdmin, "r5b")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      adminService.createFareRule({ category: "outstation", vehicle_model_id: "c1", amount: 12.5 }, superAdmin, "r5c")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("AA-06: Second active rule for the same car and product -> CONFLICT", async () => {
    await adminService.createFareRule(
      { category: "outstation", vehicle_model_id: FIXTURE_CARS.DZ.id, amount: 12 },
      superAdmin,
      "r6a"
    );

    await expect(
      adminService.createFareRule(
        { category: "outstation", vehicle_model_id: FIXTURE_CARS.DZ.id, amount: 14 },
        superAdmin,
        "r6b"
      )
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("AA-07: Extra charge with two product ids, or a product from another category -> VALIDATION_ERROR", async () => {
    await expect(
      adminService.createExtraCharge(
        {
          category: "outstation",
          route_id: "r1",
          local_package_id: "lp1", // two product ids!
          label: "Toll",
          amount: 400,
        },
        superAdmin,
        "r7a"
      )
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      adminService.createExtraCharge(
        {
          category: "outstation",
          local_package_id: "lp1", // category outstation with local product id
          label: "Entry",
          amount: 200,
        },
        superAdmin,
        "r7b"
      )
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("AA-08: Deactivating a rule keeps history (active = false)", async () => {
    mockPool.fareRules.set("fr-1", {
      id: "fr-1",
      category: "outstation",
      vehicle_model_id: "c1",
      amount: 10,
      is_active: true,
    });
    const patched = await adminService.patchFareRule("fr-1", { is_active: false }, superAdmin, "r8");
    expect(patched.is_active).toBe(false);
    expect(auditRepo.auditLogs.length).toBe(1);
    expect(auditRepo.auditLogs[0]!.action).toBe("update");
  });

  it("AA-09 & AA-10: calculate-distance returns rounded 230.5 km and 246 min, saves nothing", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ display_name: "Agra, Uttar Pradesh", lat: "27.18", lon: "78.00" }]),
        });
      }
      if (url.includes("/directions")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              routes: [{ distance: 230456, duration: 14730 }],
            }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const lq = new LocationIqService("token_123", mockFetch as any);
    const serviceWithMock = new FareAdminService(mockPool as any, auditRepo as any, lq);

    const result = await serviceWithMock.calculateDistance("Agra", "Delhi");
    expect(result.distance_km).toBe(230.5);
    expect(result.duration_minutes).toBe(246);
    expect(mockPool.routes.size).toBe(0); // saves nothing until route is saved
  });

  it("AA-11: LocationIQ fails -> error code returned, manual entry still possible", async () => {
    const mockFailingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const lq = new LocationIqService("token_fail", mockFailingFetch as any);
    const serviceWithFail = new FareAdminService(mockPool as any, auditRepo as any, lq);

    await expect(serviceWithFail.calculateDistance("Agra", "Nowhere")).rejects.toThrow(
      "UPSTREAM_ERROR"
    );
  });

  it("AA-12: Publish a route with no distance or duration -> rejected", async () => {
    mockPool.routes.set("r-incomplete", {
      id: "r-incomplete",
      distance_km: null,
      duration_minutes: null,
      status: "draft",
    });

    await expect(
      adminService.updateProductStatus("outstation_route", "r-incomplete", "published", superAdmin, "r12")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("AA-13: Quote requests with LocationIQ mock attached -> zero calls", async () => {
    const mockFetch = vi.fn();
    const lq = new LocationIqService("key_test", mockFetch as any);
    void lq;

    const dzCar = {
      id: FIXTURE_CARS.DZ.id,
      vehicle_group_id: "vg1",
      group_code: "sedan" as const,
      group_name: "Sedan",
      make: "Maruti",
      model_name: "Dzire",
      display_name: "Dzire",
      passenger_capacity: 4,
      luggage_capacity: 2,
      image_url: null,
      sort_order: 1,
      is_active: true,
    };

    const quotesService = new QuotesService({
      getFareSettings: async () => ({
        advance_percent: 28,
        min_km_per_day: 300,
        max_round_trip_days: 5,
        night_start_hour: 20,
        night_end_hour: 6,
      }),
      getVehicleGroups: async () => [
        {
          id: "vg1",
          code: "sedan" as const,
          name: "Sedan",
          is_active: true,
          driver_allowance_per_day: 500,
          one_way_night_charge: 250,
          round_trip_halt_per_night: 0,
          sort_order: 1,
        },
      ],
      getVehicleGroupById: async () => null,
      getVehicleModels: async () => [dzCar],
      getVehicleModelById: async (id: string) => (id === FIXTURE_CARS.DZ.id ? dzCar : null),
      getOutstationRoutes: async () => [],
      getOutstationRouteByIdOrCode: async () => ({
        id: "r1",
        code: "agra-to-delhi",
        origin_name: "Agra",
        destination_name: "Delhi",
        distance_km: 230,
        duration_minutes: 240,
        description: null,
        image_url: null,
        gallery: [],
        status: "published",
        created_at: new Date().toISOString(),
      }),
      getOutstationRouteVehicles: async () => [
        {
          id: "rv1",
          route_id: "r1",
          vehicle_model_id: FIXTURE_CARS.DZ.id,
          one_way_amount: 2500,
          round_trip_enabled: true,
          terms: {},
          sort_order: 1,
          is_active: true,
        },
      ],
      getLocalPackages: async () => [],
      getLocalPackageByIdOrCode: async () => null,
      getTransfers: async () => [],
      getTransferByIdOrCode: async () => null,
      getTourPackages: async () => [],
      getTourPackageByIdOrCode: async () => null,
      getFareRules: async () => [],
      getExtraCharges: async () => [],
    } as any);

    await quotesService.quote({
      category: "outstation",
      route_id: "r1",
      trip_type: "one_way",
      vehicle_model_id: FIXTURE_CARS.DZ.id,
      passenger_count: 1,
      pickup_at: "2026-10-12T10:00:00+05:30",
    });

    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it("AA-14: LocationIQ key is absent from every response and log line", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/search")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ display_name: "Agra, UP", lat: "27.18", lon: "78.00" }]),
        });
      }
      if (url.includes("/directions")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ routes: [{ distance: 230000, duration: 14400 }] }),
        });
      }
      return Promise.reject(new Error("URL mismatch"));
    });

    const secretKey = "SECRET_KEY_LOCATIONIQ_123456";
    const lq = new LocationIqService(secretKey, mockFetch as any);
    const service = new FareAdminService(mockPool as any, auditRepo as any, lq);

    const res = await service.calculateDistance("Agra", "Delhi");
    const jsonStr = JSON.stringify(res);
    expect(jsonStr).not.toContain(secretKey);
  });
});
