// Test script to verify transfer creation flow
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "../helpers.js";

describe("Transfer Creation E2E", () => {
    let app: any;

    beforeAll(async () => {
        // createTestApp returns { app, db, ... }; app is the Fastify instance.
        ({ app } = await createTestApp());
    });

    afterAll(async () => {
        await app.close();
    });

    it("should create a transfer route", async () => {
        const createRes = await app.inject({
            method: "POST",
            url: "/api/v1/ops/admin/transfer-routes",
            headers: {
                // Test-auth convention (ALLOW_TEST_AUTH is enabled in the test app).
                Authorization: "Bearer test-content_editor",
            },
            payload: {
                route_code: "test-delhi-airport-to-agra",
                name: "Test Delhi Airport to Agra",
                distance_text: "180 km",
                direction_note: "Delhi Airport to Agra",
                fleet_prices: {
                    sedan: 2500,
                    suv: 3200,
                    luxury: 4500,
                },
                use_per_km: false,
                night_charge_inr: 200,
                status: "published",
                is_active: true,
            },
        });

        expect(createRes.statusCode).toBe(201);

        const data = JSON.parse(createRes.payload);
        expect(data.data.id).toBeDefined();
        expect(data.data.routeCode).toBe("test-delhi-airport-to-agra");
        expect(data.data.name).toBe("Test Delhi Airport to Agra");
    });

    it("should list transfers in admin panel", async () => {
        const listRes = await app.inject({
            method: "GET",
            url: "/api/v1/ops/admin/transfer-routes",
            headers: {
                Authorization: "Bearer test-content_editor",
            },
            query: {
                status: "all",
                limit: 100,
            },
        });

        expect(listRes.statusCode).toBe(200);

        const data = JSON.parse(listRes.payload);
        expect(data.data.items).toBeInstanceOf(Array);
        expect(data.data.items.length).toBeGreaterThan(0);
    });

    it("should fetch transfer by code publicly", async () => {
        const getRes = await app.inject({
            method: "GET",
            url: "/api/v1/transfers/by-code/test-delhi-airport-to-agra",
        });

        expect(getRes.statusCode).toBe(200);

        const data = JSON.parse(getRes.payload);
        expect(data.data.id).toBeDefined();
        expect(data.data.routeCode).toBe("test-delhi-airport-to-agra");
    });

    it("should include transfer in public manifest", async () => {
        const manifestRes = await app.inject({
            method: "GET",
            url: "/api/v1/transfers",
        });

        expect(manifestRes.statusCode).toBe(200);

        const data = JSON.parse(manifestRes.payload);
        expect(Array.isArray(data.data)).toBe(true);

        const found = data.data.find((t: any) => t.routeCode === "test-delhi-airport-to-agra");
        expect(found).toBeDefined();
    });
});
