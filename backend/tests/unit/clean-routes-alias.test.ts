import { describe, it, expect, vi } from "vitest";
import Fastify from "fastify";
import { registerQuotesRoutes } from "../../src/modules/quotes/quotes.routes.js";
import { registerFareCatalogRoutes } from "../../src/modules/fare-catalog/fare-catalog.routes.js";
import { registerBookingsRoutes } from "../../src/modules/bookings/bookings.routes.js";

describe("Clean API /api/v1 Canonical Route Aliases & Envelopes", () => {
  it("serves quotes options at both /quotes/options and /api/v1/quotes/options", async () => {
    const app = Fastify();
    const mockQuotesService = {
      quote: vi.fn(),
      options: vi.fn().mockResolvedValue({
        product: { category: "outstation", code: "del", name: "Agra to Delhi" },
        groups: [],
      }),
    } as any;

    registerQuotesRoutes(app, mockQuotesService);

    const validPayload = {
      category: "outstation",
      route_id: "00000000-0000-0000-0000-000000000001",
      trip_type: "one_way",
      passenger_count: 2,
      pickup_at: "2026-10-12T10:00:00+05:30",
    };

    // Test root route
    const res1 = await app.inject({
      method: "POST",
      url: "/quotes/options",
      payload: validPayload,
    });
    expect(res1.statusCode).toBe(200);
    expect(res1.json().product.code).toBe("del");

    // Test canonical /api/v1 alias
    const res2 = await app.inject({
      method: "POST",
      url: "/api/v1/quotes/options",
      payload: validPayload,
    });
    expect(res2.statusCode).toBe(200);
    expect(res2.json().product.code).toBe("del");
  });

  it("serves catalog at both /catalog and /api/v1/catalog", async () => {
    const app = Fastify();
    const mockRepo = {
      getPublishedCatalog: vi.fn().mockResolvedValue({
        products: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            category: "outstation",
            code: "agra-to-delhi",
            name: "Agra to Delhi",
            description: "Direct cab",
            image_url: null,
            starting_price_inr: 2500,
            status: "published",
          },
        ],
        groups: [],
        vehicles: [],
      }),
      getPublishedProductDetail: vi.fn().mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
        category: "outstation",
        code: "agra-to-delhi",
        name: "Agra to Delhi",
        description: "Direct cab",
        image_url: null,
        starting_price_inr: 2500,
        status: "published",
        gallery: [],
        inclusions: ["Tolls"],
        exclusions: ["Parking"],
        related_products: [],
      }),
    } as any;

    registerFareCatalogRoutes(app, mockRepo);

    // Test GET /catalog
    const cat1 = await app.inject({ method: "GET", url: "/catalog" });
    expect(cat1.statusCode).toBe(200);
    expect(cat1.json().products[0].code).toBe("agra-to-delhi");

    // Test GET /api/v1/catalog
    const cat2 = await app.inject({ method: "GET", url: "/api/v1/catalog" });
    expect(cat2.statusCode).toBe(200);
    expect(cat2.json().products[0].code).toBe("agra-to-delhi");

    // Test GET /catalog/outstation/agra-to-delhi
    const det1 = await app.inject({ method: "GET", url: "/catalog/outstation/agra-to-delhi" });
    expect(det1.statusCode).toBe(200);
    expect(det1.json().name).toBe("Agra to Delhi");

    // Test GET /api/v1/catalog/outstation/agra-to-delhi
    const det2 = await app.inject({ method: "GET", url: "/api/v1/catalog/outstation/agra-to-delhi" });
    expect(det2.statusCode).toBe(200);
    expect(det2.json().name).toBe("Agra to Delhi");
  });

  it("serves bookings at /api/v1/bookings and /api/v1/bookings/:id", async () => {
    const app = Fastify();
    const mockBookingsService = {
      createBooking: vi.fn().mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
        ticket_id: "SKB-20261012-0001",
        total_amount: 3500,
      }),
      getBookingById: vi.fn().mockResolvedValue({
        id: "00000000-0000-0000-0000-000000000001",
        ticket_id: "SKB-20261012-0001",
        status: "pending_payment",
      }),
      getBookingByTicketId: vi.fn().mockResolvedValue(null),
    } as any;

    registerBookingsRoutes(app, mockBookingsService);

    const getRes = await app.inject({
      method: "GET",
      url: "/api/v1/bookings/00000000-0000-0000-0000-000000000001",
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().booking.ticket_id).toBe("SKB-20261012-0001");
  });
});
