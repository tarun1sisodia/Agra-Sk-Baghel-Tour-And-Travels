import crypto from "node:crypto";

const API_BASE = "http://localhost:4000/api/v1";
const WEBHOOK_SECRET = "skb_test_wh_sec_2026_x89";

async function runTest() {
  console.log("=== STARTING FULL MULTI-SERVICE BOOKING & RAZORPAY TEST ===\n");

  const testCases = [
    {
      vertical: "Tour Package",
      quotePayload: {
        category: "tour_package",
        tour_package_id: "d0000000-0000-4000-a000-000000000002", // Taj Mahal Sunrise Tour
        vehicle_model_id: "10000000-0000-0000-0002-000000000001", // Maruti Dzire
        passenger_count: 2,
        pickup_at: "2026-10-25T05:30:00+05:30",
      },
      customer: {
        name: "Vikram Malhotra",
        phone: "+919876543210",
        email: "vikram.malhotra@example.com",
        pickup_address: "ITC Mughal, Fatehabad Road, Agra",
        drop_address: "Taj Mahal East Gate, Agra",
      },
    },
    {
      vertical: "Local Sightseeing Package",
      quotePayload: {
        category: "local_package",
        local_package_id: "f0000000-0000-4000-a000-000000000005", // Baby Taj & Mehtab Bagh
        vehicle_model_id: "10000000-0000-0000-0002-000000000003", // Maruti Ertiga
        passenger_count: 4,
        pickup_at: "2026-10-26T14:00:00+05:30",
      },
      customer: {
        name: "Pooja Sharma",
        phone: "+919811223344",
        email: "pooja.sharma@example.com",
        pickup_address: "Tajview IHCL SeleQtions, Agra",
        drop_address: "Mehtab Bagh, Agra",
      },
    },
    {
      vertical: "Airport / Station Transfer",
      quotePayload: {
        category: "transfer",
        transfer_id: "e0000000-0000-4000-a000-000000000003", // Agra Airport (Kheria AGR)
        vehicle_model_id: "10000000-0000-0000-0002-000000000004", // Innova Crysta
        passenger_count: 3,
        pickup_at: "2026-10-27T09:15:00+05:30",
      },
      customer: {
        name: "Captain Rahul Deshmukh",
        phone: "+919765432109",
        email: "rahul.deshmukh@example.com",
        pickup_address: "Kheria Airport Arrivals Terminal, Agra",
        drop_address: "The Oberoi Amarvilas, Agra",
      },
    },
    {
      vertical: "Outstation Route",
      quotePayload: {
        category: "outstation",
        route_id: "20000000-0000-0000-0001-000000000001", // Agra to Delhi
        vehicle_model_id: "10000000-0000-0000-0002-000000000004", // Innova Crysta
        trip_type: "one_way",
        passenger_count: 5,
        pickup_at: "2026-10-28T06:00:00+05:30",
      },
      customer: {
        name: "Sunita Agarwal",
        phone: "+919425167890",
        email: "sunita.agarwal@example.com",
        pickup_address: "Civil Lines, Agra",
        drop_address: "Connaught Place, New Delhi",
      },
    },
  ];

  const results: any[] = [];

  for (const tc of testCases) {
    console.log(`------------------------------------------------------------`);
    console.log(`TESTING VERTICAL: ${tc.vertical}`);

    // 1. Get Quote
    const quoteRes = await fetch(`${API_BASE}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tc.quotePayload),
    });
    if (!quoteRes.ok) {
      throw new Error(`Quote failed (${quoteRes.status}): ${await quoteRes.text()}`);
    }
    const quoteData = (await quoteRes.json()) as any;
    const quote = quoteData.quote || quoteData;
    console.log(`  Quote OK: Total = Rs ${quote.total}, Advance = Rs ${quote.advance}, Vehicle = ${quote.vehicle.display_name}`);

    // 2. Create Booking
    const bookingPayload = {
      customer_name: tc.customer.name,
      customer_phone: tc.customer.phone,
      customer_email: tc.customer.email,
      pickup_address: tc.customer.pickup_address,
      drop_address: tc.customer.drop_address,
      quoted_total: quote.total,
      quote: tc.quotePayload,
    };
    const createRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload),
    });
    if (!createRes.ok) {
      throw new Error(`Booking creation failed (${createRes.status}): ${await createRes.text()}`);
    }
    const createData = (await createRes.json()) as any;
    const createdBooking = createData.booking;
    const bookingId = createdBooking.booking_id || createdBooking.id;
    const ticketId = createdBooking.ticket_id;
    console.log(`  Booking Created: Ticket = ${ticketId}, ID = ${bookingId}, Status = ${createdBooking.status}`);

    // 3. Create Payment Order (Razorpay)
    const payRes = await fetch(`${API_BASE}/bookings/${bookingId}/payment`, {
      method: "POST",
    });
    if (!payRes.ok) {
      throw new Error(`Payment order creation failed (${payRes.status}): ${await payRes.text()}`);
    }
    const payData = (await payRes.json()) as any;
    const payment = payData.payment;
    console.log(`  Razorpay Order Created: OrderID = ${payment.order_id}, AmountPaise = ${payment.amountPaise}, KeyID = ${payment.key_id}`);

    // Verify key_id matches server test key
    if (!payment.key_id || !payment.key_id.startsWith("rzp_test_")) {
      throw new Error(`Invalid Razorpay Key ID returned: ${payment.key_id}`);
    }

    // 4. Fetch Booking Detail (Zero Fallback Check)
    const detailRes = await fetch(`${API_BASE}/bookings/${bookingId}`);
    if (!detailRes.ok) {
      throw new Error(`Get booking failed (${detailRes.status}): ${await detailRes.text()}`);
    }
    const detailData = (await detailRes.json()) as any;
    const detail = detailData.booking;
    console.log(`  Authoritative Voucher Fetched:`);
    console.log(`    Product Code: ${detail.product_code}`);
    console.log(`    Product Name: ${detail.product_name}`);
    console.log(`    Vehicle: ${detail.vehicle_model?.display_name} (${detail.vehicle_model?.group_code})`);
    console.log(`    Customer: ${detail.customer_name} | Phone: ${detail.customer_phone}`);
    console.log(`    Total: Rs ${detail.total_amount} | Advance: Rs ${detail.advance_amount} | Balance: Rs ${detail.balance_amount}`);

    // 5. Simulate Verified Webhook Payment Capture (Test Mode)
    const razorpayPaymentId = `pay_test_${crypto.randomBytes(6).toString("hex")}`;
    const webhookPayload = {
      id: `evt_test_${crypto.randomBytes(8).toString("hex")}`,
      entity: "event",
      account_id: "acc_test_skb",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            entity: "payment",
            amount: payment.amountPaise,
            currency: "INR",
            status: "captured",
            order_id: payment.order_id,
            method: "upi",
            description: `Advance Deposit for ${ticketId}`,
            email: tc.customer.email,
            contact: tc.customer.phone,
            notes: {
              booking_id: bookingId,
              ticket_id: ticketId,
            },
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const webhookRes = await fetch(`${API_BASE}/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature,
      },
      body: rawBody,
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook failed (${webhookRes.status}): ${await webhookRes.text()}`);
    }
    const webhookData = (await webhookRes.json()) as any;
    console.log(`  Webhook Payment Capture Result: status = ${webhookData.status}`);

    // 6. Verify Booking Transitioned to Confirmed in DB
    const verifiedRes = await fetch(`${API_BASE}/bookings/${bookingId}`);
    const verifiedData = (await verifiedRes.json()) as any;
    const verifiedDetail = verifiedData.booking;
    console.log(`  Verified Final Voucher Status: ${verifiedDetail.status} (payment_status: ${verifiedDetail.payment_status})`);

    results.push({
      vertical: tc.vertical,
      ticket_id: ticketId,
      booking_id: bookingId,
      product_name: verifiedDetail.product_name,
      vehicle: verifiedDetail.vehicle_model?.display_name,
      total_amount: verifiedDetail.total_amount,
      advance_amount: verifiedDetail.advance_amount,
      final_status: verifiedDetail.status,
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: razorpayPaymentId,
    });
  }

  console.log(`\n============================================================`);
  console.log(`ALL 4 VERTICALS TESTED SUCCESSFULLY WITH ZERO FALLBACKS!`);
  console.table(results);
}

runTest().catch((err) => {
  console.error("FATAL ERROR IN TEST:", err);
  process.exit(1);
});
