import { describe, expect, it } from "vitest";
import { CreateRentalEnquirySchema, AdminRentalQuerySchema } from "../../src/modules/rental-enquiries/rental-enquiry.schema.js";
import { createRentalEnquiryService } from "../../src/modules/rental-enquiries/rental-enquiry.service.js";
import { createMemoryRepositories } from "../../src/db/memory.js";
import { systemClock } from "../../src/shared/clock.js";
import type { FareCatalogRepository, VehicleModelEntity, VehicleGroupEntity } from "../../src/modules/fare-catalog/fare-catalog.repository.js";

const MOCK_GROUPS: VehicleGroupEntity[] = [
  {
    id: "10000000-0000-0000-0001-000000000001",
    code: "sedan",
    name: "Sedan",
    driver_allowance_per_day: 500,
    one_way_night_charge: 0,
    round_trip_halt_per_night: 0,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0001-000000000002",
    code: "suv",
    name: "SUV",
    driver_allowance_per_day: 500,
    one_way_night_charge: 0,
    round_trip_halt_per_night: 0,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0001-000000000003",
    code: "luxury",
    name: "Luxury",
    driver_allowance_per_day: 500,
    one_way_night_charge: 0,
    round_trip_halt_per_night: 0,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0001-000000000004",
    code: "tempo_traveller",
    name: "Tempo Traveller",
    driver_allowance_per_day: 700,
    one_way_night_charge: 0,
    round_trip_halt_per_night: 0,
    sort_order: 4,
    is_active: true,
  },
];

const MOCK_MODELS: VehicleModelEntity[] = [
  {
    id: "10000000-0000-0000-0002-000000000001",
    vehicle_group_id: "10000000-0000-0000-0001-000000000001",
    group_code: "sedan",
    group_name: "Sedan",
    make: "Maruti",
    model_name: "Dzire",
    display_name: "Maruti Dzire",
    passenger_capacity: 4,
    luggage_capacity: 2,
    image_url: "/assets/fleet/sedan.webp",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0002-000000000004",
    vehicle_group_id: "10000000-0000-0000-0001-000000000002",
    group_code: "suv",
    group_name: "SUV",
    make: "Toyota",
    model_name: "Innova Crysta",
    display_name: "Innova Crysta",
    passenger_capacity: 7,
    luggage_capacity: 4,
    image_url: "/assets/fleet/innova.webp",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0002-000000000099",
    vehicle_group_id: "10000000-0000-0000-0001-000000000002",
    group_code: "suv",
    group_name: "SUV",
    make: "Test",
    model_name: "Inactive SUV",
    display_name: "Inactive SUV",
    passenger_capacity: 6,
    luggage_capacity: 2,
    image_url: null,
    sort_order: 99,
    is_active: false, // inactive!
  },
];

function createMockFareCatalogRepo(): FareCatalogRepository {
  return {
    async getVehicleGroups() {
      return MOCK_GROUPS;
    },
    async getVehicleModels() {
      return MOCK_MODELS;
    },
    async getVehicleModelById(id: string) {
      return MOCK_MODELS.find((m) => m.id === id) || null;
    },
  } as unknown as FareCatalogRepository;
}

describe("Rental Enquiry Suite — Canonical Groups & Models", () => {
  const clock = systemClock;

  describe("Schema Validation", () => {
    it("accepts a valid request with vehicleGroupCode and vehicleModelId", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "Vikram Singh",
        phone: "+91 98765 43210",
        email: "vikram@example.com",
        vehicleGroupCode: "suv",
        vehicleModelId: "10000000-0000-0000-0002-000000000004",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-03",
        pickupLocation: "Agra Cantt Railway Station",
        destinationOrItinerary: "Agra to Mathura & Vrindavan",
        passengers: 5,
        withDriver: true,
        note: "Need roof carrier if possible",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Vikram Singh");
        expect(parsed.data.phone).toBe("+919876543210");
        expect(parsed.data.vehicleGroupCode).toBe("suv");
        expect(parsed.data.vehicleModelId).toBe("10000000-0000-0000-0002-000000000004");
        expect(parsed.data.destinationOrItinerary).toBe("Agra to Mathura & Vrindavan");
        expect(parsed.data.passengers).toBe(5);
      }
    });

    it("accepts a group-only request with empty vehicleModelId ('Any suitable model')", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "Pooja Sharma",
        phone: "9876543210",
        vehicleGroupCode: "sedan",
        vehicleModelId: "",
        pickupDate: "2026-11-05",
        returnDate: "2026-11-05",
        pickupLocation: "Hotel Taj Ganj",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.vehicleGroupCode).toBe("sedan");
        expect(parsed.data.vehicleModelId).toBeNull();
      }
    });

    it("accepts legacy submissions with carTier", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "Legacy User",
        phone: "9876543210",
        carTier: "ertiga",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-02",
        pickupLocation: "Agra Airport",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.carTier).toBe("ertiga");
      }
    });

    it("rejects when neither vehicleGroupCode nor carTier is provided", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "No Vehicle",
        phone: "9876543210",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-02",
        pickupLocation: "Agra Cantt",
      });

      expect(parsed.success).toBe(false);
    });

    it("rejects when returnDate is before pickupDate", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "Time Traveler",
        phone: "9876543210",
        vehicleGroupCode: "sedan",
        pickupDate: "2026-11-05",
        returnDate: "2026-11-04",
        pickupLocation: "Agra Fort",
      });

      expect(parsed.success).toBe(false);
    });

    it("rejects honeypot website field", () => {
      const parsed = CreateRentalEnquirySchema.safeParse({
        name: "Spam Bot",
        phone: "9876543210",
        vehicleGroupCode: "sedan",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-02",
        pickupLocation: "Agra",
        website: "http://spam.example.com",
      });

      expect(parsed.success).toBe(false);
    });

    it("parses valid admin query parameters", () => {
      const query = AdminRentalQuerySchema.safeParse({
        status: "new",
        car: "suv",
        group: "suv",
        q: "Vikram",
        page: "2",
        limit: "25",
      });

      expect(query.success).toBe(true);
      if (query.success) {
        expect(query.data.status).toBe("new");
        expect(query.data.group).toBe("suv");
        expect(query.data.page).toBe(2);
        expect(query.data.limit).toBe(25);
      }
    });
  });

  describe("Service Validation & Persistence against Canonical Fleet", () => {
    it("persists a valid canonical model and group selection", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: mockCatalogRepo });

      const created = await service.create({
        name: "Anand Verma",
        phone: "+919876543210",
        email: "anand@example.com",
        vehicleGroupCode: "suv",
        vehicleModelId: "10000000-0000-0000-0002-000000000004", // Innova Crysta
        pickupDate: "2026-11-10",
        returnDate: "2026-11-12",
        pickupLocation: "Fatehabad Road Hotel",
        destinationOrItinerary: "Agra - Fatehpur Sikri - Mathura",
        passengers: 6,
        withDriver: true,
        note: "Senior citizens traveling",
      });

      expect(created.id).toBeDefined();
      expect(created.ref).toMatch(/^RNT-\d{4}-\d+$/);
      expect(created.vehicleGroupCode).toBe("suv");
      expect(created.vehicleModelId).toBe("10000000-0000-0000-0002-000000000004");
      expect(created.vehicleModelName).toBe("Innova Crysta");
      expect(created.destinationOrItinerary).toBe("Agra - Fatehpur Sikri - Mathura");
      expect(created.passengers).toBe(6);
      expect(created.withDriver).toBe(true);

      // Verify retrieval from DB
      const retrieved = await db.rentalEnquiries.getById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.vehicleGroupCode).toBe("suv");
      expect(retrieved?.vehicleModelId).toBe("10000000-0000-0000-0002-000000000004");
    });

    it("persists a group-only selection without fabricating a model ID", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: mockCatalogRepo });

      const created = await service.create({
        name: "Flexible Traveler",
        phone: "+919876543210",
        vehicleGroupCode: "tempo_traveller",
        vehicleModelId: null,
        pickupDate: "2026-11-15",
        returnDate: "2026-11-18",
        pickupLocation: "Agra Cantt",
        destinationOrItinerary: "Agra to Rajasthan",
        withDriver: true,
      });

      expect(created.vehicleGroupCode).toBe("tempo_traveller");
      expect(created.vehicleModelId).toBeNull();
    });

    it("rejects unknown or nonexistent vehicle model IDs", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: mockCatalogRepo });

      await expect(
        service.create({
          name: "Unknown Car",
          phone: "+919876543210",
          vehicleGroupCode: "sedan",
          vehicleModelId: "00000000-0000-0000-0000-000000000000",
          pickupDate: "2026-11-10",
          returnDate: "2026-11-11",
          pickupLocation: "Agra",
          withDriver: true,
        })
      ).rejects.toThrow(/was not found or is currently inactive/);
    });

    it("rejects inactive vehicle models", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: mockCatalogRepo });

      await expect(
        service.create({
          name: "Inactive Car",
          phone: "+919876543210",
          vehicleGroupCode: "suv",
          vehicleModelId: "10000000-0000-0000-0002-000000000099", // inactive SUV
          pickupDate: "2026-11-10",
          returnDate: "2026-11-11",
          pickupLocation: "Agra",
          withDriver: true,
        })
      ).rejects.toThrow(/was not found or is currently inactive/);
    });

    it("rejects mismatched vehicle group and model combinations", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: mockCatalogRepo });

      // Dzire is in sedan group, but passed with luxury group
      await expect(
        service.create({
          name: "Mismatched Vehicle",
          phone: "+919876543210",
          vehicleGroupCode: "luxury",
          vehicleModelId: "10000000-0000-0000-0002-000000000001", // Dzire (sedan)
          pickupDate: "2026-11-10",
          returnDate: "2026-11-11",
          pickupLocation: "Agra",
          withDriver: true,
        })
      ).rejects.toThrow(/does not belong to the "luxury" group/);
    });

    it("rejects group-only submission if the vehicle group is inactive in the live catalog", async () => {
      const db = createMemoryRepositories();
      const mockCatalogRepo = createMockFareCatalogRepo();
      // Simulate luxury group being marked inactive
      const customCatalogRepo = {
        ...mockCatalogRepo,
        async getVehicleGroups() {
          return MOCK_GROUPS.map((g) => (g.code === "luxury" ? { ...g, is_active: false } : g));
        },
      } as FareCatalogRepository;

      const service = createRentalEnquiryService({ db, clock, fareCatalogRepo: customCatalogRepo });

      await expect(
        service.create({
          name: "Luxury Fan",
          phone: "+919876543210",
          vehicleGroupCode: "luxury",
          vehicleModelId: null,
          pickupDate: "2026-11-10",
          returnDate: "2026-11-11",
          pickupLocation: "Agra",
          withDriver: true,
        })
      ).rejects.toThrow(/Vehicle group "luxury" was not found or is currently inactive/);
    });

    it("preserves historical records and allows status updates", async () => {
      const db = createMemoryRepositories();
      const service = createRentalEnquiryService({ db, clock });

      const created = await service.create({
        name: "Historical Customer",
        phone: "+919876543210",
        vehicleGroupCode: "sedan",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-02",
        pickupLocation: "Taj Ganj",
        withDriver: true,
      });

      expect(created.status).toBe("new");

      const updated = await service.update(created.id, {
        status: "contacted",
        note: "Called customer, confirmed Taj Mahal sunrise tour.",
      });

      expect(updated.status).toBe("contacted");
      expect(updated.notes).toContain("Called customer, confirmed Taj Mahal sunrise tour.");

      // Ensure new fields are not dropped during status/note updates
      expect(updated.vehicleGroupCode).toBe("sedan");
      expect(updated.pickupLocation).toBe("Taj Ganj");
    });

    it("filters enquiries by vehicle group and search term in admin list", async () => {
      const db = createMemoryRepositories();
      const service = createRentalEnquiryService({ db, clock });

      await service.create({
        name: "Aman Gupta",
        phone: "+919876543210",
        vehicleGroupCode: "sedan",
        pickupDate: "2026-11-01",
        returnDate: "2026-11-02",
        pickupLocation: "Agra Station",
        withDriver: true,
      });

      await service.create({
        name: "Rohit Sharma",
        phone: "+919876543211",
        vehicleGroupCode: "suv",
        pickupDate: "2026-11-03",
        returnDate: "2026-11-04",
        pickupLocation: "Agra Airport",
        withDriver: true,
      });

      const suvOnly = await service.list({ vehicleGroupCode: "suv" });
      expect(suvOnly.items.length).toBe(1);
      expect(suvOnly.items[0]?.name).toBe("Rohit Sharma");

      const searchResult = await service.list({ q: "Aman" });
      expect(searchResult.items.length).toBe(1);
      expect(searchResult.items[0]?.name).toBe("Aman Gupta");
    });
  });
});
