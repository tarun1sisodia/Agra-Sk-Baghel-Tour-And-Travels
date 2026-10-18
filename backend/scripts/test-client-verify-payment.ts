import crypto from "node:crypto";

const API_BASE = "http://localhost:4000/api/v1";
// Read key secret from backend config or use fallback test secret
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "skb_test_secret_99";

async function testClientVerification() {
  console.log("=== TESTING CLIENT PAYMENT VERIFICATION ENDPOINT (/verify-payment) ===\n");

  // 1. Get Quote for Outstation Round Trip
  const quoteRes = await fetch(`${API_BASE}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "outstation",
      route_id: "20000000-0000-0000-0001-000000000001", // Agra to Delhi
      vehicle_model_id: "10000000-0000-0000-0002-000000000001", // Maruti Dzire
      trip_type: "round_trip",
      passenger_count: 3,
      pickup_at: "2026-10-30T07:00:00+05:30",
      return_at: "2026-10-31T20:00:00+05:30",
    }),
  });
  if (!quoteRes.ok) throw new Error(`Quote failed: ${await quoteRes.text()}`);
  const quote = (await quoteRes.json()) as any;
  const quoteData = quote.quote || quote;
  console.log(`Quote: Total = Rs ${quoteData.total}, Advance = Rs ${quoteData.advance}`);

  // 2. Create Booking
  const bookingRes = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Aakash Singhal",
      customer_phone: "+919833445566",
      customer_email: "aakash.singhal@example.com",
      pickup_address: "Tajganj, Agra",
      drop_address: "Aerocity, New Delhi",
      quoted_total: quoteData.total,
      quote: {
        category: "outstation",
        route_id: "20000000-0000-0000-0001-000000000001",
        vehicle_model_id: "10000000-0000-0000-0002-000000000001",
        trip_type: "round_trip",
        passenger_count: 3,
        pickup_at: "2026-10-30T07:00:00+05:30",
        return_at: "2026-10-31T20:00:00+05:30",
      },
    }),
  });
  if (!bookingRes.ok) throw new Error(`Booking creation failed: ${await bookingRes.text()}`);
  const { booking } = (await bookingRes.json()) as any;
  console.log(`Booking created: ID = ${booking.id}, Ticket = ${booking.ticket_id}`);

  // 3. Create Payment Order
  const payRes = await fetch(`${API_BASE}/bookings/${booking.id}/payment`, {
    method: "POST",
  });
  if (!payRes.ok) throw new Error(`Payment order creation failed: ${await payRes.text()}`);
  const { payment } = (await payRes.json()) as any;
  console.log(`Payment order created: OrderID = ${payment.order_id}, AmountPaise = ${payment.amount_paise}`);

  // 4. Simulate Client Verification with Razorpay Netbanking Signature
  const razorpayPaymentId = `pay_test_${crypto.randomBytes(6).toString("hex")}`;
  const generatedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${payment.order_id}|${razorpayPaymentId}`)
    .digest("hex");

  console.log(`Submitting client verification: payment_id = ${razorpayPaymentId}`);
  const verifyRes = await fetch(`${API_BASE}/bookings/${booking.id}/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: payment.order_id,
      razorpay_signature: generatedSignature,
    }),
  });

  if (!verifyRes.ok) throw new Error(`Client verification failed: ${await verifyRes.text()}`);
  const verifyData = (await verifyRes.json()) as any;
  console.log(`Client verification SUCCESS:`, verifyData);

  // 5. Query Final Booking Status
  const checkRes = await fetch(`${API_BASE}/bookings/${booking.id}`);
  const checkData = (await checkRes.json()) as any;
  console.log(`Final Booking Status: ${checkData.booking.status}, Payment Status: ${checkData.booking.payment_status}`);

  if (checkData.booking.status === "confirmed" && checkData.booking.payment_status === "confirmed") {
    console.log("\n>>> PASS: CLIENT VERIFICATION ENDPOINT VERIFIED IN LIVE DATABASE! <<<");
  } else {
    throw new Error(`Unexpected final status: ${checkData.booking.status}`);
  }
}

testClientVerification().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
