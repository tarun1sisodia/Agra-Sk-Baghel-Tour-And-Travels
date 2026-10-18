import assert from "node:assert/strict";
import test from "node:test";
import { createBooking } from "../src/services/cleanFareApi.ts";

test("createBooking always preserves Content-Type: application/json when custom headers are passed", async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedHeaders: Record<string, string> = {};
  let capturedBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    capturedHeaders = (init?.headers as Record<string, string>) || {};
    capturedBody = init?.body;
    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: "11111111-1111-4111-a111-111111111111",
          ticket_id: "AGR-20261018-9999",
          guest_access_token: "guest_tok_abc",
          status: "pending_payment",
          total_amount: 5000,
          advance_amount: 1400,
          balance_amount: 3600,
          fare_breakdown: {},
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const mockPayload: any = {
    customer_name: "Test Customer",
    customer_phone: "+919876543210",
    customer_email: "test@example.com",
    pickup_address: "Tajganj, Agra",
    drop_address: "Delhi Airport",
    quoted_total: 5000,
    quote: {
      category: "outstation",
      route_id: "20000000-0000-0000-0001-000000000001",
      vehicle_model_id: "10000000-0000-0000-0002-000000000001",
      trip_type: "one_way",
      passenger_count: 2,
      pickup_at: "2026-10-25T10:00:00+05:30",
    },
  };

  // Test 1: With accessToken
  await createBooking(mockPayload, "sample_access_token_123");
  assert.equal(
    capturedHeaders["Content-Type"],
    "application/json",
    "Content-Type must be application/json when accessToken is provided"
  );
  assert.equal(
    capturedHeaders["Authorization"],
    "Bearer sample_access_token_123",
    "Authorization header must be set"
  );
  assert.equal(typeof capturedBody, "string");

  // Test 2: Anonymous booking (no accessToken)
  await createBooking(mockPayload, null);
  assert.equal(
    capturedHeaders["Content-Type"],
    "application/json",
    "Content-Type must be application/json for anonymous booking"
  );
  assert.equal(
    capturedHeaders["Authorization"],
    undefined,
    "Authorization header should not be set for anonymous booking"
  );
});
