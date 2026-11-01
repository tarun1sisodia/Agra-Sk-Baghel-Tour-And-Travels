// Test script to verify transfer creation flow
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "../helpers.js";

describe("Transfer Creation E2E", () => {
    let app: any;
    let token: string;

    beforeAll(async () => {
        app = await createTestApp();

        // Login as admin to get token
        const loginRes = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: {
                email: "skbagheltravels@gmail.com",
                password: "Tarun@123",
            },
        });

        const loginData = JSON.parse(loginRes.payload);
        token = loginData.data.token;
    });

    afterAll(async () => {
        await app.close();
    });

    it("should create a transfer route", async () => {
        const createRes = await app.inject({
            method: "POST",
            url: "/api/v1/ops/admin/transfer-routes",
            headers: {
                Authorization: `Bearer ${token}`,
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
                Authorization: `Bearer ${token}`,
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
