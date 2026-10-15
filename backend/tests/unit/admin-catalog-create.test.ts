import { describe, it, expect, vi } from "vitest";
import { CreateTourPackageSchema } from "../../src/modules/tour-packages/tour-packages.schema.js";
import { CreateLocalPackageSchema } from "../../src/modules/local-packages/local-packages.schema.js";
import { CreateTransferRouteSchema } from "../../src/modules/transfer-routes/transfer-routes.schema.js";
import { createTourPackagesController } from "../../src/modules/tour-packages/tour-packages.controller.js";
import { createLocalPackagesController } from "../../src/modules/local-packages/local-packages.controller.js";
import { createTransferRoutesController } from "../../src/modules/transfer-routes/transfer-routes.controller.js";
describe("Admin Catalog Creation & Backend Contract Tests", () => {

  describe("Tour Package Creation Schema Validation", () => {
    it("validates a complete, valid tour package payload", () => {
      const payload = {
        name: "Same Day Taj Mahal & Agra Fort Tour",
        package_code: "same-day-taj-agra-tour",
        duration_text: "1 Day (12-14 Hours)",
        days: 1,
        nights: 0,
        base_tier_code: "sedan",
        starting_price_inr: 2500,
        fleet_prices: {
          sedan: 2500,
          ertiga: 3200,
          "innova-crysta": 4200,
          "tempo-traveller": 6500,
        },
        night_charge_inr: 0,
        source: "Agra",
        destination: "Taj Mahal, Agra Fort",
        inclusions: ["AC Vehicle", "Chauffeur", "Fuel & Tolls"],
        exclusions: ["Monument Tickets", "Meals"],
        inclusions_highlight: "Private AC Cab, Fuel, Chauffeur, Sightseeing",
        inclusions_note: "Parking at actuals",
        image_url: "/assets/packages/taj-dawn.webp",
        gallery: [{ url: "/assets/packages/taj-dawn.webp", caption: "Taj Sunrise", alt: "Taj Sunrise" }],
      };

      const parsed = CreateTourPackageSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Same Day Taj Mahal & Agra Fort Tour");
        expect(parsed.data.package_code).toBe("same-day-taj-agra-tour");
        expect(parsed.data.starting_price_inr).toBe(2500);
        expect(parsed.data.fleet_prices.sedan).toBe(2500);
      }
    });

    it("rejects tour package with invalid slug pattern or negative price", () => {
      const invalid = {
        name: "Test",
        package_code: "123-btn-bad",
        duration_text: "1 Day",
        days: 1,
        nights: 0,
        starting_price_inr: -500,
        fleet_prices: { sedan: 2000 },
      };

      const parsed = CreateTourPackageSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("Local Sightseeing Package Creation Schema Validation", () => {
    it("validates a complete, valid local sightseeing package payload", () => {
      const payload = {
        name: "Agra Full Day Heritage Tour 8Hr / 80KM",
        package_code: "agra-8hr-80km-heritage",
        duration_hours: 8,
        included_km: 80,
        covers: "Taj Mahal, Agra Fort, Mehtab Bagh, Baby Taj",
        parking_note: "Monument entry fees & parking at actuals",
        fleet_prices: {
          sedan: 1800,
          ertiga: 2400,
          "innova-crysta": 3200,
        },
        extra_rates: {
          sedan: { per_km: 12, per_hr: 150 },
          ertiga: { per_km: 15, per_hr: 200 },
          "innova-crysta": { per_km: 18, per_hr: 250 },
        },
        night_charge_inr: 0,
      };

      const parsed = CreateLocalPackageSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.duration_hours).toBe(8);
        expect(parsed.data.included_km).toBe(80);
        expect(parsed.data.fleet_prices.sedan).toBe(1800);
      }
    });

    it("rejects local package with 0 hours or insufficient km", () => {
      const invalid = {
        name: "Invalid Local",
        package_code: "invalid-local",
        duration_hours: 0,
        included_km: 5,
        covers: "City",
        fleet_prices: { sedan: 1000 },
      };

      const parsed = CreateLocalPackageSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("Transfer Route Creation Schema Validation", () => {
    it("validates a complete, valid transfer route payload", () => {
      const payload = {
        name: "Agra Cantt Railway Station to Fatehabad Road Hotels",
        route_code: "agra-cantt-to-fatehabad-hotels",
        distance_text: "~10–12 km",
        direction_note: "Agra Cantt Railway Station (AGC)",
        fleet_prices: {
          sedan: 750,
          ertiga: 1100,
          "innova-crysta": 1600,
        },
        night_charge_inr: 200,
      };

      const parsed = CreateTransferRouteSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.route_code).toBe("agra-cantt-to-fatehabad-hotels");
        expect(parsed.data.fleet_prices.sedan).toBe(750);
        expect(parsed.data.night_charge_inr).toBe(200);
      }
    });

    it("rejects transfer route with empty fleet prices or invalid slug", () => {
      const invalid = {
        name: "Invalid Transfer",
        route_code: "INVALID_SLUG_UPPER",
        fleet_prices: {},
      };

      const parsed = CreateTransferRouteSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("Controller Create Endpoints (201 Created Response Contract)", () => {
    it("tourPackagesController.create invokes service.create and responds with 201", async () => {
      const mockService = {
        create: vi.fn().mockResolvedValue({
          id: "tp-uuid-1",
          name: "Agra Tour",
          packageCode: "agra-tour",
          status: "draft",
          isActive: true,
        }),
      };
      const controller = createTourPackagesController(mockService as any);

      const request: any = {
        user: { id: "admin-1", role: "super_admin" },
        body: {
          name: "Agra Tour",
          package_code: "agra-tour",
          duration_text: "1 Day",
          days: 1,
          nights: 0,
          starting_price_inr: 2000,
          fleet_prices: { sedan: 2000 },
        },
      };

      const reply: any = {
        status: vi.fn().mockReturnThis(),
        code: vi.fn().mockReturnThis(),
        send: vi.fn().mockImplementation((val) => val),
      };

      await controller.create(request, reply);
      expect(mockService.create).toHaveBeenCalledOnce();
      expect(reply.status).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: "tp-uuid-1", status: "draft" }),
        })
      );
    });

    it("localPackagesController.create invokes service.create and responds with 201", async () => {
      const mockService = {
        create: vi.fn().mockResolvedValue({
          id: "lp-uuid-1",
          name: "Local Tour",
          packageCode: "local-tour",
          status: "draft",
          isActive: true,
        }),
      };
      const controller = createLocalPackagesController(mockService as any);

      const request: any = {
        user: { id: "admin-1", role: "super_admin" },
        body: {
          name: "Local Tour",
          package_code: "local-tour",
          duration_hours: 8,
          included_km: 80,
          covers: "Taj Mahal",
          fleet_prices: { sedan: 1800 },
        },
      };

      const reply: any = {
        status: vi.fn().mockReturnThis(),
        code: vi.fn().mockReturnThis(),
        send: vi.fn().mockImplementation((val) => val),
      };

      await controller.create(request, reply);
      expect(mockService.create).toHaveBeenCalledOnce();
      expect(reply.status).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: "lp-uuid-1", status: "draft" }),
        })
      );
    });

    it("transferRoutesController.create invokes service.create and responds with 201", async () => {
      const mockService = {
        create: vi.fn().mockResolvedValue({
          id: "tr-uuid-1",
          name: "Station Transfer",
          routeCode: "station-transfer",
          status: "draft",
          isActive: true,
        }),
      };
      const controller = createTransferRoutesController(mockService as any);

      const request: any = {
        user: { id: "admin-1", role: "super_admin" },
        body: {
          name: "Station Transfer",
          route_code: "station-transfer",
          distance_text: "15 km",
          direction_note: "Station",
          fleet_prices: { sedan: 700 },
        },
      };

      const reply: any = {
        status: vi.fn().mockReturnThis(),
        code: vi.fn().mockReturnThis(),
        send: vi.fn().mockImplementation((val) => val),
      };

      await controller.create(request, reply);
      expect(mockService.create).toHaveBeenCalledOnce();
      expect(reply.status).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: "tr-uuid-1", status: "draft" }),
        })
      );
    });
  });
});
