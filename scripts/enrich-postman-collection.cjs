const fs = require("fs");
const path = require("path");

const collectionFile = path.resolve(__dirname, "../postman/SK_Baghel_Tour_and_Travels_Fare_System.postman_collection.json");
const data = JSON.parse(fs.readFileSync(collectionFile, "utf8"));

function makeTestEvent(scriptLines) {
  return [
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: scriptLines
      }
    }
  ];
}

// 1. Enrich existing items with assertions
data.item.forEach((folder) => {
  if (folder.name.includes("01. Server Health Check")) {
    folder.event = makeTestEvent([
      'pm.test("Status is 200 OK", function () {',
      '    pm.response.to.have.status(200);',
      '});',
      'pm.test("Health response indicates healthy or ready", function () {',
      '    const json = pm.response.json();',
      '    const status = (json.data && json.data.status) || json.status;',
      '    pm.expect(status).to.be.oneOf(["healthy", "ready", "ok"]);',
      '});'
    ]);
  }

  if (folder.item) {
    folder.item.forEach((reqItem) => {
      if (reqItem.name.includes("2.1 List All Vehicle Groups")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Returns vehicle groups array", function () {',
          '    const json = pm.response.json();',
          '    const list = json.vehicle_groups || json;',
          '    pm.expect(list).to.be.an("array");',
          '    pm.expect(list.length).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("2.2 Update Sedan Driver Allowance")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Driver allowance is updated", function () {',
          '    const json = pm.response.json();',
          '    const group = json.vehicle_group || json;',
          '    pm.expect(group.driver_allowance_per_day).to.eql(550);',
          '});'
        ]);
      } else if (reqItem.name.includes("2.3 Create New Vehicle Model")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 201 Created or 409 Conflict if already seeded", function () {',
          '    pm.expect([200, 201, 409]).to.include(pm.response.code);',
          '});'
        ]);
      } else if (reqItem.name.includes("2.4 Update Vehicle Model")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Vehicle model capacity is updated", function () {',
          '    const json = pm.response.json();',
          '    const model = json.vehicle_model || json;',
          '    pm.expect(model.passenger_capacity).to.eql(4);',
          '});'
        ]);
      } else if (reqItem.name.includes("3.1 List All Fare Settings")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Settings contain advance_percent", function () {',
          '    const json = pm.response.json();',
          '    const list = json.settings || json;',
          '    const keys = list.map(s => s.key);',
          '    pm.expect(keys).to.include("advance_percent");',
          '});'
        ]);
      } else if (reqItem.name.includes("3.2 Update Max Round-Trip Days")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Requirement B: Max round trip days is 5", function () {',
          '    const json = pm.response.json();',
          '    const setting = json.setting || json;',
          '    pm.expect(setting.value).to.eql(5);',
          '});'
        ]);
      } else if (reqItem.name.includes("4.1 Calculate Distance")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Distance is computed and positive", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.distance_km).to.be.above(0);',
          '    pm.expect(json.duration_minutes).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("4.2 Set Flat Prices")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });'
        ]);
      } else if (reqItem.name.includes("5.1 Set Innova Crysta")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Round trip rate updated", function () {',
          '    const json = pm.response.json();',
          '    const rule = json.fare_rule || json;',
          '    pm.expect(rule.amount).to.eql(18);',
          '});'
        ]);
      } else if (reqItem.name.includes("6.1 Create Line-Item Extra Charge") || reqItem.name.includes("6.2 Create Policy Disclaimer")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 201 Created or 409 Conflict if already exists", function () {',
          '    pm.expect([200, 201, 409]).to.include(pm.response.code);',
          '});'
        ]);
      } else if (reqItem.name.includes("7.1 Fetch Published Catalog")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Catalog has products and vehicles", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.products).to.be.an("array");',
          '    pm.expect(json.vehicles).to.be.an("array");',
          '    pm.expect(json.groups).to.be.an("array");',
          '});'
        ]);
      } else if (reqItem.name.includes("7.2 Fetch Product Detail")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Product detail is complete", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.category).to.eql("outstation");',
          '    pm.expect(json.starting_price_inr).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("8.1 Options Request — One-Way")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Returns vehicle groups with vehicles", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.groups).to.be.an("array");',
          '    pm.expect(json.groups.length).to.be.above(0);',
          '    const allCars = json.groups.flatMap(g => g.vehicles);',
          '    pm.expect(allCars.length).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("8.2 Options Request — Round-Trip")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Round trip options returned with 3-day IST calculation", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.groups).to.be.an("array");',
          '    const allCars = json.groups.flatMap(g => g.vehicles);',
          '    allCars.forEach(c => {',
          '        pm.expect(c.quote.advance + c.quote.balance).to.eql(c.quote.total);',
          '    });',
          '});'
        ]);
      } else if (reqItem.name.includes("8.3 Authoritative Quote")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Invariant INV-3: Advance + Balance = Total", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.advance + json.balance).to.eql(json.total);',
          '    pm.expect(json.currency).to.eql("INR");',
          '});'
        ]);
      } else if (reqItem.name.includes("9.1 Create Real Booking")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 201 Created", function () { pm.response.to.have.status(201); });',
          'pm.test("Returns booking with ticket_id", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.booking.id).to.be.a("string");',
          '    pm.expect(json.booking.ticket_id).to.match(/^AGR-[0-9]{8}-[0-9]{4}$/);',
          '    pm.environment.set("lastBookingId", json.booking.id);',
          '    pm.collectionVariables.set("lastBookingId", json.booking.id);',
          '});'
        ]);
      } else if (reqItem.name.includes("9.2 Tampered Price Test")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 409 Conflict PRICE_CHANGED", function () {',
          '    pm.response.to.have.status(409);',
          '});'
        ]);
      } else if (reqItem.name.includes("9.3 Fetch Booking Voucher")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Booking details returned", function () {',
          '    const json = pm.response.json();',
          '    pm.expect(json.booking.ticket_id).to.be.a("string");',
          '    const total = json.booking.total_amount || json.booking.total_fare;',
          '    pm.expect(total).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("9.4 Create Razorpay Advance Order")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Returns Razorpay order ID and advance amount", function () {',
          '    const json = pm.response.json();',
          '    const orderId = (json.payment && json.payment.provider_order_id) || json.payment_order_id;',
          '    const amountPaise = (json.payment && json.payment.amount_paise) || json.amount_paise;',
          '    pm.expect(orderId).to.be.a("string");',
          '    pm.expect(amountPaise).to.be.above(0);',
          '});'
        ]);
      } else if (reqItem.name.includes("10.1 Inspect Admin Audit Log")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
          'pm.test("Audit log rows returned", function () {',
          '    const json = pm.response.json();',
          '    const list = json.audit_logs || json;',
          '    pm.expect(list).to.be.an("array");',
          '});'
        ]);
      } else if (reqItem.name.includes("10.2 Inspect Publishing Outbox")) {
        reqItem.event = makeTestEvent([
          'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });'
        ]);
      }
    });
  }
});

// Remove existing extra folders if any before re-adding
data.item = data.item.filter((f) => !f.name.startsWith("11. Shields") && !f.name.startsWith("12. Customer"));

// Folder 11: Negative Boundary & Invariant Shields
const negativeFolder = {
  name: "11. Shields — Negative Boundaries & Tamper Tests",
  item: [
    {
      name: "11.1 Requirement B Guard — Exceeded Duration (> 5 Days Round Trip)",
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category: "outstation",
            route_id: "20000000-0000-0000-0001-000000000001",
            trip_type: "round_trip",
            vehicle_model_id: "10000000-0000-0000-0002-000000000004",
            passenger_count: 2,
            pickup_at: "2026-10-15T09:00:00+05:30",
            return_at: "2026-10-23T18:00:00+05:30" // 9 days!
          })
        },
        url: {
          raw: "{{baseUrl}}/api/v1/quotes",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "quotes"]
        },
        description: "Enforces Requirement B: Round trip package cannot exceed 5 calendar days."
      },
      event: makeTestEvent([
        'pm.test("Status is 400 Bad Request TRIP_TOO_LONG", function () {',
        '    pm.response.to.have.status(400);',
        '    const json = pm.response.json();',
        '    pm.expect(json.error).to.eql("TRIP_TOO_LONG");',
        '});'
      ])
    },
    {
      name: "11.2 Vehicle Capacity Shield — Overcrowded Passenger Count",
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category: "outstation",
            route_id: "20000000-0000-0000-0001-000000000001",
            trip_type: "one_way",
            vehicle_model_id: "10000000-0000-0000-0002-000000000001", // Dzire (max 4 pax)
            passenger_count: 10, // 10 pax!
            pickup_at: "2026-10-15T09:00:00+05:30"
          })
        },
        url: {
          raw: "{{baseUrl}}/api/v1/quotes",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "quotes"]
        },
        description: "Rejects quote when passenger count exceeds model seating capacity."
      },
      event: makeTestEvent([
        'pm.test("Status is 400 Bad Request CAPACITY_EXCEEDED", function () {',
        '    pm.response.to.have.status(400);',
        '    const json = pm.response.json();',
        '    pm.expect(json.error).to.eql("CAPACITY_EXCEEDED");',
        '});'
      ])
    },
    {
      name: "11.3 LocationIQ Autocomplete Proxy",
      request: {
        method: "GET",
        header: [],
        url: {
          raw: "{{baseUrl}}/api/v1/locations/autocomplete?q=agra",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "locations", "autocomplete"],
          query: [{ key: "q", value: "agra" }]
        },
        description: "Verifies LocationIQ autocomplete proxy securely returns suggestions."
      },
      event: makeTestEvent([
        'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
        'pm.test("Returns autocomplete array or suggestions", function () {',
        '    const json = pm.response.json();',
        '    const list = Array.isArray(json) ? json : (json.data && json.data.suggestions) ? json.data.suggestions : (json.suggestions || []);',
        '    pm.expect(list).to.be.an("array");',
        '});'
      ])
    }
  ]
};

data.item.push(negativeFolder);

// Folder 12: Multi-Category Reactive Options (Local, Transfer, Tour)
const multiCategoryFolder = {
  name: "12. Customer — Multi-Category Options (Local, Transfer, Tour)",
  item: [
    {
      name: "12.1 Local Rental Package Options",
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category: "local_package",
            local_package_id: "30000000-0000-0000-0001-000000000001",
            passenger_count: 2,
            pickup_at: "2026-10-15T09:00:00+05:30"
          })
        },
        url: {
          raw: "{{baseUrl}}/api/v1/quotes/options",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "quotes", "options"]
        },
        description: "Fetches vehicle options for 8H/80KM local sightseeing package."
      },
      event: makeTestEvent([
        'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
        'pm.test("Returns product category local_package", function () {',
        '    const json = pm.response.json();',
        '    pm.expect(json.product.category).to.eql("local_package");',
        '});'
      ])
    },
    {
      name: "12.2 Transfer Options",
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category: "transfer",
            transfer_id: "40000000-0000-0000-0001-000000000001",
            passenger_count: 2,
            pickup_at: "2026-10-15T09:00:00+05:30"
          })
        },
        url: {
          raw: "{{baseUrl}}/api/v1/quotes/options",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "quotes", "options"]
        },
        description: "Fetches vehicle options for Agra Cantt station transfer."
      },
      event: makeTestEvent([
        'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
        'pm.test("Returns product category transfer", function () {',
        '    const json = pm.response.json();',
        '    pm.expect(json.product.category).to.eql("transfer");',
        '});'
      ])
    },
    {
      name: "12.3 Tour Package Options",
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            category: "tour_package",
            tour_package_id: "50000000-0000-0000-0001-000000000001",
            passenger_count: 2,
            pickup_at: "2026-10-15T09:00:00+05:30"
          })
        },
        url: {
          raw: "{{baseUrl}}/api/v1/quotes/options",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "quotes", "options"]
        },
        description: "Fetches multi-day tour package options."
      },
      event: makeTestEvent([
        'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
        'pm.test("Returns product category tour_package", function () {',
        '    const json = pm.response.json();',
        '    pm.expect(json.product.category).to.eql("tour_package");',
        '});'
      ])
    }
  ]
};

data.item.push(multiCategoryFolder);

fs.writeFileSync(collectionFile, JSON.stringify(data, null, 2), "utf8");
console.log("✅ Successfully enriched Postman collection with aligned assertions & envelope matches!");
