import { API_BASE_URL, getCustomerAuthToken, formatResult } from "./common.mjs";

export async function runCustomerFlowVerification(targetUrl = API_BASE_URL) {
  console.log("\n\x1b[1m\x1b[32m=== RUNNING CUSTOMER CLEAN FARE & BOOKING VERIFICATION ===\x1b[0m");
  console.log(`Target API: ${targetUrl}`);

  const authToken = await getCustomerAuthToken();
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  let passedCount = 0;
  let totalCount = 0;

  async function testOp(name, fn) {
    totalCount++;
    const start = Date.now();
    try {
      const details = await fn();
      formatResult(name, true, Date.now() - start, details);
      passedCount++;
    } catch (err) {
      formatResult(name, false, Date.now() - start, err.message);
    }
  }

  // 1. Health Probe
  await testOp("Customer: Liveness Check (/api/v1/health)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return `Version: ${json.data?.version || json.version || "ok"}`;
  });

  // 2. Readiness Probe
  await testOp("Customer: Database Readiness (/api/v1/ready)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/ready`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return `Store: ${json.data?.store || json.store || "ready"}`;
  });

  // 3. Published Catalog
  let sampleRoute = null;
  let sampleVehicleModelId = null;
  await testOp("Customer: Published Product Catalog (/api/v1/catalog)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/catalog`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const products = json.products || [];
    const vehicles = json.vehicles || [];
    if (products.length > 0) sampleRoute = products.find(p => p.category === "routes" || p.category === "outstation") || products[0];
    if (vehicles.length > 0) sampleVehicleModelId = vehicles[0].id;
    return `${products.length} products, ${vehicles.length} vehicle models available`;
  });

  // 4. Quotes Options Matrix
  if (sampleRoute) {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await testOp(`Customer: Multi-Vehicle Options Matrix (/api/v1/quotes/options)`, async () => {
      const payload = {
        category: "outstation",
        route_id: sampleRoute.id,
        trip_type: "one_way",
        pickup_at: tomorrow,
        passenger_count: 2,
      };
      const res = await fetch(`${targetUrl}/api/v1/quotes/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const groups = json.groups || [];
      return `${groups.length} vehicle groups calculated for ${json.product?.name || sampleRoute.name}`;
    });
  }

  // 5. Authoritative Single Quote
  let activeQuote = null;
  if (sampleRoute && sampleVehicleModelId) {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await testOp(`Customer: Single Quote Calculation (/api/v1/quotes)`, async () => {
      const payload = {
        category: "outstation",
        route_id: sampleRoute.id,
        vehicle_model_id: sampleVehicleModelId,
        trip_type: "one_way",
        pickup_at: tomorrow,
        passenger_count: 2,
      };
      const res = await fetch(`${targetUrl}/api/v1/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      activeQuote = json;
      return `Total: ₹${json.total}, Advance: ₹${json.advance}, Balance: ₹${json.balance} (${json.vehicle?.display_name})`;
    });
  }

  // 6. Clean Booking Creation
  let createdBooking = null;
  if (activeQuote && sampleRoute && sampleVehicleModelId) {
    await testOp(`Customer: Create Booking from Quote (/api/v1/bookings)`, async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const bookingPayload = {
        quote: {
          category: "outstation",
          route_id: sampleRoute.id,
          vehicle_model_id: sampleVehicleModelId,
          trip_type: "one_way",
          pickup_at: tomorrow,
          passenger_count: 2,
        },
        quoted_total: activeQuote.total,
        customer_name: "Verification Test User",
        customer_phone: "+919876543210",
        customer_email: "test.verification@example.com",
        pickup_address: "Taj East Gate Road, Taj Ganj, Agra",
        drop_address: "Indira Gandhi International Airport Terminal 3, New Delhi",
        special_notes: "Automated verification test run",
      };

      const res = await fetch(`${targetUrl}/api/v1/bookings`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(bookingPayload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`HTTP ${res.status}: ${errJson.message || errJson.error || "failed"}`);
      }
      const json = await res.json();
      createdBooking = json.booking || json;
      return `Ticket ID: ${createdBooking.ticket_id || createdBooking.ticketId || createdBooking.id}`;
    });
  }

  // 7. Booking Details Lookup
  if (createdBooking) {
    const bookingId = createdBooking.id || createdBooking.booking_id;
    await testOp(`Customer: Get Booking Details (${bookingId})`, async () => {
      const res = await fetch(`${targetUrl}/api/v1/bookings/${bookingId}`, {
        method: "GET",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const b = json.booking || json;
      return `Status: ${b.status}, Customer: ${b.customer_name || b.customerName}`;
    });

    // 8. PDF Confirmation Voucher
    await testOp(`Customer: Download PDF Voucher (/api/v1/bookings/:id/pdf)`, async () => {
      const res = await fetch(`${targetUrl}/api/v1/bookings/${bookingId}/pdf`, {
        method: "GET",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("pdf")) {
        throw new Error(`Expected application/pdf, received ${contentType}`);
      }
      return `PDF Voucher Generated: ${buffer.byteLength} bytes`;
    });
  }

  // 9. Public Reviews
  await testOp("Customer: Public Reviews Showcase (/api/v1/public/reviews)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/public/reviews`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const reviews = json.reviews || json.data || [];
    return `${reviews.length} approved public reviews`;
  });

  // 10. Public Gallery
  await testOp("Customer: Public Gallery (/api/v1/public/gallery)", async () => {
    const res = await fetch(`${targetUrl}/api/v1/public/gallery`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const gallery = json.gallery || json.data || [];
    return `${gallery.length} verified traveler photos`;
  });

  console.log(`\nCustomer Flow Verification: ${passedCount}/${totalCount} passed.\n`);
  return { passedCount, totalCount };
}

if (process.argv[1]?.endsWith("test-customer-flow.mjs")) {
  runCustomerFlowVerification().catch((e) => {
    console.error("Verification execution error:", e);
    process.exit(1);
  });
}
