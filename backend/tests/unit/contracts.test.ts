import { describe, it, expect } from "vitest";
import {
  BookingCreateResponse,
  BookingDetailResponse,
  PaymentOrderResponse,
  PublishedCatalogResponse,
  PublishedProductDetail,
  PublicReviewItem,
  PublicGalleryItem,
  PublishEventItem,
  AdminAuditLogItem,
} from "../../src/contracts/fare-system.js";

describe("Phase 1 Contract Synchronizations & Validation", () => {
  it("validates BookingCreateResponse structure", () => {
    const valid = {
      booking_id: "00000000-0000-0000-0000-000000000001",
      ticket_id: "SKB-20261012-0001",
      guest_access_token: "tok_secret_12345",
      status: "pending_payment",
      total_amount: 3500,
      advance_amount: 980,
      balance_amount: 2520,
      fare_breakdown: {
        category: "outstation",
        vehicle: {
          vehicle_model_id: "00000000-0000-0000-0000-000000000002",
          display_name: "Maruti Dzire",
          group_code: "sedan",
          passenger_capacity: 4,
        },
        currency: "INR",
        lines: [{ code: "base_fare", label: "Base fare", amount: 3500 }],
        total: 3500,
        advance: 980,
        balance: 2520,
        messages: [],
        details: {},
      },
    };

    const parsed = BookingCreateResponse.safeParse(valid);
    expect(parsed.success).toBe(true);

    const detail = {
      ...valid,
      category: "outstation",
      product_code: "agra-to-delhi",
      product_name: "Agra to Delhi",
      customer_name: "Rahul Sharma",
      customer_phone: "9876543210",
      pickup_address: "Taj Ganj, Agra",
      pickup_at: "2026-10-12T10:00:00+05:30",
      passenger_count: 2,
      vehicle_model: {
        id: "00000000-0000-0000-0000-000000000002",
        display_name: "Maruti Dzire",
        group_code: "sedan",
      },
      payment_status: "pending",
      created_at: "2026-10-10T12:00:00.000Z",
    };
    expect(BookingDetailResponse.safeParse(detail).success).toBe(true);
  });

  it("validates PublishedCatalogResponse and PublishedProductDetail", () => {
    const catalog = {
      products: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          category: "outstation",
          code: "agra-to-delhi",
          name: "Agra to Delhi",
          description: "Expressway taxi",
          image_url: "/assets/agra-delhi.webp",
          starting_price_inr: 2500,
          status: "published",
          distance_km: 230,
          duration_minutes: 240,
        },
      ],
      groups: [
        {
          group_code: "sedan",
          name: "Sedan",
          driver_allowance_per_day: 500,
          one_way_night_charge: 250,
          round_trip_halt_per_night: 0,
          sort_order: 1,
        },
      ],
      vehicles: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          group_code: "sedan",
          make: "Maruti",
          model_name: "Dzire",
          display_name: "Maruti Dzire",
          passenger_capacity: 4,
          luggage_capacity: 2,
          image_url: "/assets/dzire.webp",
        },
      ],
    };

    expect(PublishedCatalogResponse.safeParse(catalog).success).toBe(true);

    const productDetail = {
      ...catalog.products[0],
      gallery: ["/assets/img1.webp", "/assets/img2.webp"],
      inclusions: ["Toll tax included", "State permit"],
      exclusions: ["Parking charges extra"],
      highlights: "Direct Yamuna Expressway route",
      notes: "Driver will meet at your hotel",
      related_products: [],
    };

    expect(PublishedProductDetail.safeParse(productDetail).success).toBe(true);
  });

  it("validates PaymentOrderResponse", () => {
    const payment = {
      payment_id: "00000000-0000-0000-0000-000000000001",
      order_id: "order_K8dG91k2s8A1",
      currency: "INR",
      amount_paise: 98000,
      key_id: "rzp_test_12345",
      customer_name: "Rahul Sharma",
      customer_phone: "9876543210",
      customer_email: "rahul@example.com",
    };

    expect(PaymentOrderResponse.safeParse(payment).success).toBe(true);
  });

  it("validates PublicReviewItem and PublicGalleryItem", () => {
    const review = {
      id: "00000000-0000-0000-0000-000000000001",
      author_name: "Priya Singh",
      rating: 5,
      review_text: "Smooth journey to Delhi, courteous driver.",
      trip_summary: "Agra to Delhi • Innova Crysta",
      social_platform: "instagram",
      social_url: "https://instagram.com/priyatravels",
      submitted_at: "2026-10-10T12:00:00.000Z",
    };
    expect(PublicReviewItem.safeParse(review).success).toBe(true);

    const gallery = {
      id: "00000000-0000-0000-0000-000000000001",
      image_url: "https://cdn.example.com/photo.webp",
      caption: "Sunrise at Taj Mahal",
      author_name: "Priya Singh",
    };
    expect(PublicGalleryItem.safeParse(gallery).success).toBe(true);
  });

  it("validates AdminAuditLogItem and PublishEventItem", () => {
    const audit = {
      id: "00000000-0000-0000-0000-000000000001",
      actor_id: "00000000-0000-0000-0000-000000000002",
      actor_role: "super_admin",
      action: "UPDATE_FARE_SETTING",
      entity_type: "fare_settings",
      entity_id: "advance_percent",
      before_state: { value: 20 },
      after_state: { value: 28 },
      created_at: "2026-10-10T12:00:00.000Z",
    };
    expect(AdminAuditLogItem.safeParse(audit).success).toBe(true);

    const pubEvent = {
      id: "00000000-0000-0000-0000-000000000001",
      entity_type: "outstation_route",
      entity_id: "00000000-0000-0000-0000-000000000002",
      event_type: "route_published",
      status: "succeeded",
      attempt_count: 1,
      created_at: "2026-10-10T12:00:00.000Z",
      updated_at: "2026-10-10T12:01:00.000Z",
    };
    expect(PublishEventItem.safeParse(pubEvent).success).toBe(true);
  });
});

describe("Phase 6 Contract C-FLEET-PRICING-001: FleetPriceOption", () => {
  it("validates FleetPriceOption across all canonical 5 vehicle tiers", async () => {
    const { FleetPriceOptionSchema, isValidFleetPriceOption } = await import(
      "../../src/contracts/fleet-pricing.js"
    );
    const { VEHICLE_TIERS } = await import("../../src/contracts/vehicle-tiers.js");

    for (const tier of VEHICLE_TIERS) {
      const option = {
        fleetCode: tier,
        fleetName: tier.toUpperCase(),
        price: 3500,
        advanceAmount: 980,
        currency: "INR" as const,
        pricingType: "per-km-route" as const,
        displayLabel: "Starting from ₹12/km",
        priceSource: "fare_rules" as const,
        breakdown: {
          billedKm: 250,
          driverAllowance: 500,
          nightAllowance: 0,
          tollNote: "Tolls & parking extra as actual",
        },
      };

      const parsed = FleetPriceOptionSchema.safeParse(option);
      expect(parsed.success).toBe(true);
      expect(isValidFleetPriceOption(option)).toBe(true);
    }
  });

  it("exports FleetPriceOption and schema from root contracts index", async () => {
    const index = await import("../../src/contracts/index.js");
    expect(index.FleetPriceOptionSchema).toBeDefined();
    expect(index.isValidFleetPriceOption).toBeDefined();
    expect(index.FLEET_PRICING_TYPES).toContain("fixed-package");
    expect(index.FLEET_PRICE_SOURCES).toContain("tour_packages");
  });

  it("rejects non-canonical fleet codes and legacy short keys", async () => {
    const { FleetPriceOptionSchema } = await import(
      "../../src/contracts/fleet-pricing.js"
    );

    const invalidShortInnova = {
      fleetCode: "innova", // legacy short key must be rejected at API/presentation boundary
      fleetName: "Innova",
      price: 4500,
      advanceAmount: 1260,
      currency: "INR",
      pricingType: "fixed-package",
      displayLabel: "Full day package",
      priceSource: "tour_packages",
    };
    expect(FleetPriceOptionSchema.safeParse(invalidShortInnova).success).toBe(false);

    const invalidShortTempo = {
      fleetCode: "tempo",
      fleetName: "Tempo Traveller",
      price: 8500,
      advanceAmount: 2380,
      currency: "INR",
      pricingType: "fixed-package",
      displayLabel: "Full day package",
      priceSource: "tour_packages",
    };
    expect(FleetPriceOptionSchema.safeParse(invalidShortTempo).success).toBe(false);

    const invalidTier = {
      fleetCode: "luxury_suv",
      fleetName: "Luxury",
      price: 6000,
      advanceAmount: 1680,
      currency: "INR",
      pricingType: "per-km-route",
      displayLabel: "Hourly package",
      priceSource: "fare_rules",
    };
    expect(FleetPriceOptionSchema.safeParse(invalidTier).success).toBe(false);
  });

  it("rejects negative monetary amounts and non-INR currency", async () => {
    const { FleetPriceOptionSchema } = await import(
      "../../src/contracts/fleet-pricing.js"
    );

    const negativePrice = {
      fleetCode: "sedan",
      fleetName: "Sedan",
      price: -100,
      advanceAmount: 500,
      currency: "INR",
      pricingType: "per-km-route",
      displayLabel: "Outstation drop",
      priceSource: "fare_rules",
    };
    expect(FleetPriceOptionSchema.safeParse(negativePrice).success).toBe(false);

    const negativeAdvance = {
      fleetCode: "sedan",
      fleetName: "Sedan",
      price: 3000,
      advanceAmount: -500,
      currency: "INR",
      pricingType: "per-km-route",
      displayLabel: "Outstation drop",
      priceSource: "fare_rules",
    };
    expect(FleetPriceOptionSchema.safeParse(negativeAdvance).success).toBe(false);

    const invalidCurrency = {
      fleetCode: "sedan",
      fleetName: "Sedan",
      price: 3000,
      advanceAmount: 500,
      currency: "USD",
      pricingType: "per-km-route",
      displayLabel: "Outstation drop",
      priceSource: "fare_rules",
    };
    expect(FleetPriceOptionSchema.safeParse(invalidCurrency).success).toBe(false);
  });

  it("rejects invalid pricing types and price sources", async () => {
    const { FleetPriceOptionSchema } = await import(
      "../../src/contracts/fleet-pricing.js"
    );

    const invalidPricingType = {
      fleetCode: "sedan",
      fleetName: "Sedan",
      price: 3000,
      advanceAmount: 500,
      currency: "INR",
      pricingType: "dynamic-auction", // not allowed
      displayLabel: "Outstation drop",
      priceSource: "fare_rules",
    };
    expect(FleetPriceOptionSchema.safeParse(invalidPricingType).success).toBe(false);

    const invalidPriceSource = {
      fleetCode: "sedan",
      fleetName: "Sedan",
      price: 3000,
      advanceAmount: 500,
      currency: "INR",
      pricingType: "per-km-route",
      displayLabel: "Outstation drop",
      priceSource: "hardcoded_json", // not allowed
    };
    expect(FleetPriceOptionSchema.safeParse(invalidPriceSource).success).toBe(false);
  });
});
