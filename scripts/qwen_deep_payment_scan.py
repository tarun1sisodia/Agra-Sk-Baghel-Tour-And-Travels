import os
import sys
from openai import OpenAI

def get_bearer_token():
    token = os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
    if not token and sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as key:
                token, _ = winreg.QueryValueEx(key, "AWS_BEARER_TOKEN_BEDROCK")
        except Exception:
            pass
    return token

token = get_bearer_token()
if not token:
    raise ValueError("AWS_BEARER_TOKEN_BEDROCK is not set.")

client = OpenAI(
    base_url="https://bedrock-mantle.eu-north-1.api.aws/v1",
    api_key=token,
)

prompt = """# SYSTEM AUDIT & ARCHITECTURAL DIRECTIVE: ZERO-FALLBACK ROBUST PAYMENT & BOOKING SYSTEM

## 1. INCIDENT & BACKGROUND CONTEXT
The customer booking frontend (deployed at `https://skbagheltravels-customer.coccoder999.workers.dev`) allows customers to book outstation cabs, sightseeing packages, transfers, and tours.
When a customer fills in their details and clicks "Book", the user experiences:
1. The Razorpay payment modal never opens.
2. The user is redirected to `https://skbagheltravels-customer.coccoder999.workers.dev/booking/confirmation?id=bac64ac7-d2b8-4d5e-b876-b83b48b51942`.
3. The confirmation page fails to render booking details, displaying:
   "Booking Details Unavailable"
   "Failed to fetch"

## 2. CLIENT MANDATE & ARCHITECTURAL PRINCIPLE
The product owner has explicitly identified a critical anti-pattern:
"What I think is that you have written fallbacks for handling this payment system. Which is bad, because we know and we defined the rules and all functions, data required to process a booking. There are very small hidden and stupid fallbacks and logics applied that make it fail. Or it is possible that the service I am trying to book has invalid data that is failing."

WE NEED A ZERO-COMPROMISE, SERVER-AUTHORITATIVE, CONTRACT-STRICT PAYMENT SYSTEM:
- NO silent swallows or premature redirects on payment failures.
- NO fragile or missing CORS headers breaking browser fetch preflights (`x-guest-token`, `Authorization`).
- NO disconnect between authenticated Supabase users and guest checkout.
- NO database foreign key crashes or 500 crashes during booking detail resolution.
- NO guessing or client-side pricing computation: server calculates, issues quote, verifies quote hash, and issues Razorpay order.

## 3. CODEBASE INVENTORY TO AUDIT
Here is the exact code across the monorepo for the payment and booking lifecycle:

### A. Frontend Booking Checkout (`react/src/features/booking/clean/CleanBookingPage.tsx`)
```ts
// Booking submission:
const bookingPayload = {
  category: selectedService.category,
  product_id: selectedService.id,
  vehicle_model_id: selectedVehicle.id,
  customer_name: customer.name.trim(),
  customer_phone: customer.phone.trim(),
  customer_email: customer.email.trim() || undefined,
  pickup_address: pickupAddress.trim(),
  drop_address: dropAddress.trim() || undefined,
  pickup_at: pickupDateTimeIso,
  passenger_count: passengers,
  quote_hash: authoritativeQuote.quote_hash,
  flight_train_number: customer.flight_train_number.trim() || undefined,
  special_notes: customer.notes.trim() || undefined,
};

const bookingRes = await createBooking(bookingPayload, accessToken);
sessionStorage.setItem(`arenaai:guest_token:${bookingRes.booking_id}`, bookingRes.guest_access_token);
sessionStorage.setItem("arenaai:last_booking_id", bookingRes.booking_id);

// Razorpay launch:
try {
  const paymentRes = await createBookingPayment(bookingRes.booking_id, bookingRes.guest_access_token);
  const scriptReady = await loadRazorpayScript();
  if (scriptReady && window.Razorpay) {
    const rzp = new window.Razorpay({
      key: paymentRes.key_id,
      order_id: paymentRes.order_id,
      amount: paymentRes.amount_paise,
      currency: "INR",
      name: "Agra SK Baghel Tour & Travels",
      description: `Advance Deposit for ${bookingRes.ticket_id}`,
      prefill: { name: customer.name, contact: customer.phone, email: customer.email },
      theme: { color: "#9F3C16" },
      modal: {
        ondismiss: () => { window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`; }
      },
      handler: async (response) => {
        await verifyBookingPayment(bookingRes.booking_id, response, bookingRes.guest_access_token);
        window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
      }
    });
    rzp.open();
  }
} catch (payErr) {
  // CRITICAL ISSUE: Silent catch redirects to confirmation immediately, bypassing payment modal!
  console.warn("Payment initiation deferred:", payErr);
  window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
}
```

### B. Client API Service (`react/src/services/cleanFareApi.ts`)
```ts
export async function createBookingPayment(bookingId: string, guestToken?: string, accessToken?: string) {
  const headers: Record<string, string> = {};
  if (guestToken) headers["x-guest-token"] = guestToken;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return apiRequest(`/api/v1/bookings/${bookingId}/payment`, { method: "POST", headers });
}

export async function fetchBookingById(id: string, guestToken?: string, accessToken?: string) {
  const headers: Record<string, string> = {};
  if (guestToken) headers["x-guest-token"] = guestToken;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return apiRequest(`/api/v1/bookings/${id}`, { method: "GET", headers });
}
```

### C. Backend CORS & Server (`backend/src/app.ts`)
```ts
allowedHeaders: [
  "Content-Type", "Authorization", "X-Booking-Token", "x-booking-token",
  "X-Guest-Token", "x-guest-token", "X-Booking-Intent-Secret", "X-Request-Id",
  "X-Correlation-Id", "X-Razorpay-Signature"
]
```

### D. Backend Bookings & Payments Routes (`backend/src/modules/bookings/` & `payments/`)
- `POST /api/v1/bookings`: Validates `CreateBookingRequest`, verifies quote hash, creates booking in `bookings` table, generates secure 32-byte `guest_access_token`.
- `POST /api/v1/bookings/:id/payment`: Validates booking state, checks booking is `pending_payment`, contacts Razorpay API (`razorpay.orders.create({ amount: advance_amount * 100, currency: "INR", receipt: booking.ticket_id })`), inserts row into `payments` table (`status: 'created'`), returns `{ order_id, amount_paise, key_id, currency }`.
- `POST /api/v1/bookings/:id/verify-payment`: Validates client Razorpay signature (`crypto.createHmac("sha256", secret).update(`${order_id}|${payment_id}`).digest("hex")`), updates payment to `captured`, updates booking to `confirmed`.
- `POST /api/v1/payments/webhook`: Authoritative Razorpay webhook handler for `payment.captured`, `order.paid`, and `payment.failed` with signature verification.

### E. PostgreSQL Database Schema (`fare-system-clean-rebuild.sql`)
```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null unique,
  user_id uuid references profiles(id),
  guest_access_token text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  category text not null check (category in ('outstation','local_package','transfer','tour_package')),
  vehicle_model_id uuid not null references vehicle_models(id),
  passenger_count int not null,
  route_id uuid references outstation_routes(id),
  local_package_id uuid references local_packages(id),
  transfer_id uuid references transfers(id),
  tour_package_id uuid references tour_packages(id),
  trip_type text,
  pickup_at timestamptz not null,
  return_at timestamptz,
  pickup_address text not null,
  drop_address text,
  flight_train_number text,
  special_notes text,
  fare_breakdown jsonb not null,
  total_amount int not null check (total_amount > 0),
  advance_amount int not null check (advance_amount >= 0 and advance_amount <= total_amount),
  balance_amount int generated always as (total_amount - advance_amount) stored,
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','driver_assigned','in_transit','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount int not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created','authorized','captured','failed','refunded')),
  method text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 4. YOUR TASK: SCAN, AUDIT, AND DELIVER THE FINAL PRODUCTION BLUEPRINT
Analyze all layers and provide a complete, rigorous architectural blueprint:
1. **Root Cause Analysis**: Exactly why the customer saw "Failed to fetch" on confirmation and why Razorpay failed to open.
2. **Identification of Fragile Fallbacks**: Point out every hidden fallback, silent redirect, or degraded logic in the checkout and payment path that should be eradicated.
3. **Strict Validation & Data Integrity**: Specify exact data validations required for Outstation, Local Packages, Airport Transfers, and Tour Packages before payment is created.
4. **Resilient Frontend Checkout Flow**: Define the error-handling and state machine for `CleanBookingPage` so payment errors are surfaced directly to the user (e.g. inline alerts, retry buttons) instead of silently skipping payment and redirecting to confirmation.
5. **Security, CORS, and Session Parity**: Define how guest tokens, Supabase JWT bearer tokens, and CORS policies must coordinate so authorized access is guaranteed without breaking preflight.
6. **Definitive Code Solutions**: Provide production-ready TypeScript/SQL snippets for the fixes.
"""

print("Executing Qwen 3 Coder deep payment & architecture scan...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen 3 Coder Next, an elite software architect and security auditor specializing in high-reliability financial transactions, distributed systems, PostgreSQL, and full-stack React/Fastify architectures."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.15,
    max_tokens=4096,
)

content = response.choices[0].message.content
print("\nScan completed successfully. Output length:", len(content))

output_path = os.path.join("docs", "QWEN_PAYMENT_SYSTEM_DEEP_SCAN_REPORT.md")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Report written to {output_path}")
