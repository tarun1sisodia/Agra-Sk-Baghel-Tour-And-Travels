import os
import sys

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

from openai import OpenAI

client = OpenAI(
    base_url="https://bedrock-mantle.eu-north-1.api.aws/v1",
    api_key=token,
)

prompt = """
You are the Principal Payments Architect and Security Specialist auditing SK Baghel Tour & Travels (ArenaAI).

The user asked to benchmark our entire Razorpay payment integration against standard industry practices and the reference guide:
"A Complete Guide to Razorpay Payment Gateway Integration: From Scratch to Verification" (by Anuj Gupta).

### Reference Guide Model & Standard Requirements:
1. Setup & Keys: Key ID & Key Secret isolation, environment variables, test mode vs live mode.
2. Server-Authoritative Order Creation: `razorpay.orders.create` with amount in subunits (paise), currency ("INR"), receipt tracking. Client must NEVER calculate price.
3. Frontend Checkout Modal: `checkout.js`, passing `order_id`, prefill info, `handler` callback with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
4. Cryptographic Payment Verification: HMAC SHA256 of `order_id + "|" + payment_id` using `RAZORPAY_KEY_SECRET`. Must use `crypto.timingSafeEqual`.
5. Webhooks & Dual-Channel Capture: Server-to-server webhook endpoint verifying `X-Razorpay-Signature` against raw body buffer for events (`payment.captured`, `payment.failed`, `refund.processed`), ensuring state changes are durable even if customer closes browser.
6. Idempotency & Database Integrity: Preventing double charges, duplicate processing, race conditions, atomic database transactions.

---

### Our Actual Implementation in ArenaAI:

#### 1. Server Routes & Architecture (`backend/src/modules/payments/payments.routes.ts`):
- `POST /api/v1/bookings/:id/payment` (Rate limited: 60/min, authenticated customer guard) -> creates Razorpay Order.
- `POST /api/v1/bookings/:id/verify-payment` (Rate limited: 60/min, authenticated customer guard) -> client-side signature verification.
- `POST /api/v1/payments/webhooks/razorpay` & `POST /api/v1/payments/webhooks/:provider` (Rate limited: 120/min) -> server-to-server webhooks.

#### 2. Payment Service & Security (`backend/src/modules/payments/payments.service.ts`):
- **Server Authoritative Fare**: Amount comes directly from DB `booking.advance_amount` in INR -> converted to paise (`* 100`). Frontend cannot modify price.
- **Order Creation**: Calls Razorpay API `orders.create` with `amount`, `currency: "INR"`, `receipt: booking.ticket_id`. Persists `provider_order_id` in `payments` table.
- **Client Signature Verification**:
  ```ts
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto.createHmac("sha256", this.keySecret).update(body).digest("hex");
  const valid = expectedSignature.length === params.razorpaySignature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(params.razorpaySignature));
  ```
- **Webhook Verification & Preservation of Raw Bytes**:
  - `backend/src/middlewares/rawBody.ts` preserves the unmutated `request.rawBody` buffer.
  - Webhook verifies `X-Razorpay-Signature` HMAC SHA256 against raw buffer with `crypto.timingSafeEqual`.
  - Deduplication via `payment_webhook_events` table (`UNIQUE (provider, event_id)`).
  - Handles `payment.captured`, `payment.failed`, currency mismatch (`needs_review`), amount mismatch (`needs_review`), cancelled booking collision (`needs_review`).
- **Post-Payment Isolation**:
  - Branded voucher email sent via Resend with Idempotency-Key.
  - Wrapped in isolated error boundary so email provider issues NEVER revert or crash confirmed bookings.
  - Freemail detection fallback to `onboarding@resend.dev` in dev/staging.

#### 3. Database Layer & Concurrency (`backend/src/modules/payments/payments.repository.ts`, `migrations/0038`):
- PostgreSQL `payments` table:
  - `unique index payments_one_pending_per_booking on payments (booking_id) where status = 'pending'` -> prevents race condition of multiple pending checkouts per booking.
- PostgreSQL `payment_webhook_events` table:
  - `unique (provider, event_id)` -> idempotency at the database constraint level.
- `processCaptured()`:
  - Atomic transaction (`BEGIN ... COMMIT / ROLLBACK`):
    - Updates `payments SET status = 'captured', provider_payment_id = $1`
    - Updates `bookings SET status = 'confirmed' WHERE id = $1 AND status = 'pending_payment'`
    - Updates `payment_webhook_events SET processed = true`

#### 4. Frontend Integration (`react/src/features/booking/clean/CleanBookingPage.tsx`, `cleanFareApi.ts`):
- Clean 4-step booking flow.
- Mandatory Supabase customer auth gate on Step 4 before payment.
- Dynamically loads `checkout.js`.
- Initiates checkout with server-returned `providerOrderId` and prefilled customer details.
- Handles modal dismissal and payment error states with visible feedback.
- On success, invokes `verifyBookingPayment` with Bearer token, then redirects to `/booking/confirmation?id=...`.

---

### Your Task:
Please generate a comprehensive, objective, and professional architectural rating report:
1. **Executive Benchmark Summary**: Compare ArenaAI's implementation against standard tutorial implementations (like Anuj Gupta's guide) and enterprise production standards.
2. **Detailed Aspect-by-Aspect Rating (Score each 1 to 10 with clear justification)**:
   - **Aspect 1: Architectural Design & Separation of Concerns**
   - **Aspect 2: Cryptographic Security, Tamper-Proofing & Timing Attack Prevention**
   - **Aspect 3: Dual-Channel Capture & Reliability (Browser Callback + Server Webhook)**
   - **Aspect 4: Database Integrity, Concurrency & Idempotency**
   - **Aspect 5: Error Isolation & Fault Tolerance (Failure Boundaries)**
   - **Aspect 6: Frontend UX & Auth Alignment**
3. **Overall System Score & Maturity Level** (e.g. Prototype vs MVP vs Production Grade vs Enterprise Tier).
4. **Where ArenaAI Significantly Exceeds Basic Reference Guides**: Specific advanced patterns implemented in ArenaAI that basic tutorials ignore.
5. **Remaining Gaps or Recommendations**: Any remaining items (e.g., automated webhook retry queue, admin manual reconciliation UI, test vs live key validation) to achieve a 10/10 perfect score.
"""

print("Querying Qwen Coder on Amazon Bedrock Mantle...")
response = client.chat.completions.create(
    model="qwen.qwen3-coder-next",
    messages=[
        {"role": "system", "content": "You are Qwen, a Principal Payments Architect and Cloud Security Specialist."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.2,
    max_tokens=4000,
)

report = response.choices[0].message.content
print("\n--- REPORT FROM QWEN CODER ---\n")
print(report)

output_path = "docs/QWEN_RAZORPAY_ARCHITECTURE_RATING_REPORT.md"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(report)

print(f"\nReport written to {output_path}")
