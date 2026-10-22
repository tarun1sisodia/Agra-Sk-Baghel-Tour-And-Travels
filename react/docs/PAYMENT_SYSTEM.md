# Payment system — SK Baghel Tour & Travels

**Status:** Specification only. Live Razorpay is **out of scope** until this document is followed end-to-end.  
**Canonical product:** Agra SK Baghel Tour & Travels (`book.html` 5-step flow: Route → Vehicle → Details → Advance → Ticket).  
**Gateway:** Razorpay (India). **Frontend host:** Cloudflare (Workers / Pages + custom domain). **Backend:** Cloudflare Workers + D1/KV **or** a small VPS/cloud API.  
**Session branch note:** Arena sessions stay on `arena/<session-id>`. Do not invent a `docs-payment-system` git branch inside an Arena session; keep this file on the session branch and merge to `main`.

This file is the **source of truth** for money movement. If code and this doc disagree, **stop and update the doc first**.

---

## 0. Why payments fail in the real world

Companies like Paytm, Amazon Pay, Razorpay, Stripe do not “charge a card”. They run a **distributed ledger of intents** with:

- Idempotency (same click twice ≠ two charges)
- Dual control (browser never decides “paid”)
- Webhooks as the **source of truth**, not the browser return URL
- Reconciliation (gateway settlement vs your DB vs bank)
- Partial capture, refunds, chargebacks, disputes, delayed success
- Clock skew, duplicate webhooks, out-of-order events
- PCI-DSS: you never see PAN/CVV if you use hosted checkout
- Regulatory: RBI, NPCI UPI, GST invoices, KYC, T+ N settlement

**Rule:** the browser may **start** a payment. Only a **verified webhook** (HMAC) plus **server-side order lookup** may mark a booking `PAID`.

---

## 1. Current product seam (what already exists)

| Piece | Today | After payments |
|---|---|---|
| Fare | `js/fares.js` client-only | **Recompute on server** from the same rules; never trust client totals |
| Advance | `SKB.advanceOf` ≈ 28% min ₹500, round to 100s | Same formula in a shared module (Python or TS). Server amount wins |
| Promo | Client `SKB.promoCodes` | Server-side promo table; lock discount at order create |
| Pay step | `#pay-form` mock 900ms, random `AGR-xxx` | Create **Razorpay Order** for `advance` paise; Checkout.js; webhook confirms |
| Ticket | Client `sessionStorage` `skb-booking` | Server booking id `AGR-…`; ticket only after `payment.captured` |
| Host | Static MPA / Cloudflare | Static site + **Payments Worker** (or API) |

Do **not** put Razorpay **key secret** in `js/`. Key id (`rzp_live_…` / `rzp_test_…`) is public. Secret lives in Cloudflare secrets / env.

---

## 2. Recommended architecture

```
[ Cloudflare Pages / Workers static ]
        | HTTPS only, CSP
        v
[ book.html ] --HTTPS--> [ Payments Worker / API ]
                              |
           create booking draft (PENDING_PAYMENT)
           recompute fare + advance (INR paise)
           create Razorpay Order (receipt = booking_id)
           return { order_id, amount, currency, key_id }
                              |
[ Checkout.js / UPI intent ]  |
                              v
                    Razorpay (UPI / card / netbanking / wallet)
                              |
              success URL  +  webhook  (webhook WINS)
                              v
                    verify signature
                    mark PAID / FAILED / REFUNDED
                    emit WhatsApp/email (n8n later)
```

### 2.1 Why a Worker / microservice

Static HTML cannot:

- Hold `RAZORPAY_KEY_SECRET`
- Create Orders (amount is server-authoritative)
- Verify webhooks
- Persist bookings
- Issue refunds
- Idempotency keys

**Minimum backend:** one Cloudflare Worker `pay.agraskbagheltourandtravels.com` + **D1** (SQL) + **KV** (idempotency) + **Queues** (webhook retry processing).

If Workers limits hurt (long webhooks, PDF invoices, GST), add a small API on Fly.io / Railway / a Mumbai VM. Frontend still talks only to **your** API, never Razorpay secret.

### 2.2 Trust boundary

| Trusted | Untrusted |
|---|---|
| Webhook body + `X-Razorpay-Signature` | Query params on `/book.html?payment=ok` |
| Server fare engine | Client `fare.advance` |
| DB `orders.amount` | Checkout `handler` callback |
| Razorpay Dashboard settlement | User-typed coupon after order create |

---

## 3. Money model (must match taxi ops)

### 3.1 Two-part fare (product truth)

- **Advance now** — charged via Razorpay (booking guarantee).
- **Balance to driver** — cash/UPI **offline**. Do **not** create a second Order unless the owner later asks for full prepay.

Night allowance, round-trip `×1.85`, package add-ons, promo: included in **total** before `advanceOf`.

### 3.2 Currency & units

- Currency: `INR` only for v1.
- Razorpay amounts are **integer paise**. ₹1,200.00 → `120000`.
- Never send floats. Round **once** on the server: `paise = Math.round(rupees * 100)`.
- Display with `en-IN` grouping; store integers.

### 3.3 Order vs Payment vs Settlement vs Booking

| Entity | Owner | Meaning |
|---|---|---|
| `bookings` | You | Trip + guest + fare snapshot |
| `orders` | You + Razorpay `order_id` | Intent to collect `advance` |
| `payments` | Razorpay `payment_id` | Actual money movement |
| `refunds` | Razorpay `refund_id` | Partial/full return |
| `ledger` | You | Append-only events for audit |
| Settlement | Razorpay → bank | T+2-ish; **not** “paid” for the guest |

A booking is `CONFIRMED` only when:

1. Razorpay order amount **equals** locked `advance_paise`
2. Payment status `captured` (not just `authorized` unless you capture)
3. Signature verified
4. Idempotent apply (second webhook no-ops)

---

## 4. Booking + payment state machine

```
DRAFT  →  PENDING_PAYMENT  →  PAID  →  CONFIRMED
                │               │
                │               ├→ PARTIALLY_REFUNDED
                │               └→ REFUNDED → CANCELLED
                ├→ FAILED
                ├→ EXPIRED (order timeout / 15–30 min)
                └→ CANCELLED (user abandoned)
```

**Never skip.** Do not jump `DRAFT → CONFIRMED` from the frontend.

### 4.1 Terminal vs retryable

| Status | User action | System |
|---|---|---|
| `PENDING_PAYMENT` | Open Checkout again **same** `order_id` if still valid | Do not create a second order unless expired |
| `FAILED` | New order (new `order_id`) | Keep failed payment rows |
| `EXPIRED` | New order | Old order_id dead |
| `PAID` | Ticket; no edit of fare | Immutable fare snapshot |
| `CONFIRMED` | Ops / driver assign | Separate ops table |

---

## 5. Razorpay implementation template

### 5.1 Accounts & keys

1. Razorpay KYC (business, bank, GSTIN, PAN) — **client supplies**.
2. Test mode first (`rzp_test_`). Live only after webhook + refund drills.
3. Keys:
   - `RAZORPAY_KEY_ID` — public, Checkout
   - `RAZORPAY_KEY_SECRET` — Worker secret, never git
   - `RAZORPAY_WEBHOOK_SECRET` — **different** from key secret; Dashboard → Webhooks
4. Rotate secrets without downtime: dual-secret window.

### 5.2 Create order (API)

`POST /v1/payments/create-order` (your API)

**Auth:** none for v1 guest booking **or** short-lived booking session token (recommended: signed cookie / JWT 30 min, HttpOnly, Secure, SameSite=Lax).

**Input (untrusted):** route, vehicle, date, time, tripType, packageId, promo, name, phone, pickup.

**Server:**

1. Validate phone (E.164 India `^[6-9]\d{9}$` after strip).
2. Recompute fare with **server** catalogue (port `fares.js` rules).
3. Apply promo from **DB**; reject if minTotal not met.
4. Insert `bookings` (`PENDING_PAYMENT`) + fare snapshot JSON.
5. Idempotency: header `Idempotency-Key: <uuid from client>`. KV: key → `order_id`. Replay returns same order.
6. `POST https://api.razorpay.com/v1/orders` with Basic auth `key_id:key_secret`:

```json
{
  "amount": 420000,
  "currency": "INR",
  "receipt": "AGR-20260907-8F3A",
  "payment_capture": 1,
  "notes": {
    "booking_id": "AGR-20260907-8F3A",
    "route": "agra-delhi",
    "vehicle": "innova"
  }
}
```

7. Store `razorpay_order_id`, `amountPaise`, `currency`.
8. Return `{ key_id, order_id, amount, currency, booking_id, name, description }`.

**Never** let the client pass `amount`.

### 5.3 Checkout (frontend)

Replace mock `#pay-form` submit:

```js
const order = await fetch("/api/payments/create-order", {
  method: "POST",
  credentials: "include",
  headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
  body: JSON.stringify(bookingPayload),
}).then((r) => r.json());

const rzp = new Razorpay({
  key: order.key_id,
  amount: order.amount,
  currency: order.currency,
  order_id: order.order_id,
  name: "SK Baghel Tour & Travels",
  description: "Advance for " + order.booking_id,
  prefill: { name, contact: phone },
  theme: { color: "#0B1F3A" },
  handler: function (res) {
    // OPTIONAL UX only — still wait for webhook / poll
    pollBooking(order.booking_id);
  },
  modal: { ondismiss: function () { /* stay PENDING */ } },
});
rzp.open();
```

Load Checkout from Razorpay CDN with SRI if possible; CSP `script-src` allowlist.

**Do not** confirm ticket in `handler`. Call `POST /v1/payments/verify` **and** poll `GET /v1/bookings/:id` until `PAID` or timeout (~2 min) with “Payment received — confirming…” copy.

### 5.4 Optional payment.signature verify (browser return)

Razorpay sends `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.

Server: `HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)` hex-compare **timing-safe**.

This is **necessary but not sufficient**. Webhook still required (user may close tab).

### 5.5 Webhooks (source of truth)

Dashboard URL: `https://pay.agraskbagheltourandtravels.com/webhooks/razorpay`  
Events (minimum):

- `order.paid`
- `payment.captured`
- `payment.failed`
- `payment.authorized` (if not auto-capture)
- `refund.created` / `refund.processed` / `refund.failed`
- `payment.dispute.created` (if enabled)

**Verify:** `HMAC_SHA256(raw_body, WEBHOOK_SECRET)` vs `X-Razorpay-Signature`. Use **raw bytes**, not re-serialized JSON.

**Idempotency:** store `x-razorpay-event-id` or `payload.id`. Duplicate → `200 OK` no-op.

**Always 200** after persist (or 5xx only if you want Razorpay retry). Process async via Queue if work is heavy.

**Out of order:** `refund` before you saw `captured` — upsert payment then apply refund.

### 5.6 Capture mode

Use `payment_capture: 1` (auto-capture) for advance. Authorization-only is extra complexity (RBI windows). Skip until you need delayed capture.

---

## 6. Data model (D1 / Postgres)

### 6.1 Tables

**bookings**

- `id` TEXT PK (`AGR-` + date + Crockford base32)
- `status` TEXT
- `guest_name`, `phone_e164`, `pickup`, `note`
- `route_from`, `route_to`, `vehicle_id`, `package_id`, `trip_type`
- `travel_date`, `travel_time`
- `fare_snapshot` JSON (total, advance, remaining, night, promo, km)
- `advance_paise` INT, `total_paise` INT, `currency` TEXT
- `promo_code` TEXT NULL
- `created_at`, `updated_at`, `paid_at`, `expires_at`

**orders**

- `id` TEXT PK
- `booking_id` FK
- `razorpay_order_id` UNIQUE
- `amountPaise`, `currency`, `status`
- `idempotency_key` UNIQUE

**payments**

- `razorpay_payment_id` PK
- `order_id`, `booking_id`
- `method` (upi/card/netbanking/wallet)
- `status`, `amountPaise`, `fee_paise`, `tax_paise`
- `email`, `contact` (PII — encrypt or truncate)
- `raw_last_event` JSON (or store in object storage, not git)

**refunds**

- `razorpay_refund_id` PK
- `payment_id`, `amountPaise`, `status`, `reason`

**ledger** (append-only)

- `id`, `booking_id`, `type`, `amountPaise`, `meta_json`, `created_at`

**webhook_events**

- `event_id` PK, `event_type`, `received_at`, `processed_at`, `payload_hash`

**idempotency_keys**

- `key` PK, `response_json`, `created_at` (TTL 24h)

PII: phone/name — encrypt at rest if using third-party DB; Cloudflare D1: restrict dashboard access; never log full PAN (you won’t have it).

### 6.2 Fare snapshot

Lock numbers at order create. Later catalogue price changes **must not** change a pending/paid booking.

---

## 7. Security checklist (non-negotiable)

### 7.1 Secrets

- No secrets in repo, HTML, `wrangler.jsonc` committed values, or client JS.
- Cloudflare `wrangler secret put RAZORPAY_KEY_SECRET`
- Separate **test** and **live** Worker environments.
- GitHub Actions: OIDC / encrypted secrets; never echo.

### 7.2 Transport

- HTTPS only; HSTS.
- API CORS: allow **only** `https://agraskbagheltourandtravels.com` (and `www`). Not `*`.
- Cloudflare: WAF, bot fight, rate limit `/api/payments/*` (e.g. 10 req / 10 min / IP + phone).

### 7.3 PCI

- Use Razorpay Checkout / UPI intent. **Never** collect card numbers on our forms.
- SAQ-A style: hosted fields only. Do not store CVV/PAN.

### 7.4 Webhook security

- Signature required.
- Reject if timestamp skew > 5 min (if header present).
- Replay cache.
- IP allowlist is **optional** (Razorpay IPs change) — signature is mandatory.

### 7.5 Amount integrity

- Compare webhook `amount` == `orders.amountPaise`.
- Compare `currency == INR`.
- Compare `order_id` belongs to `booking_id` in notes **and** DB.
- If mismatch: status `NEEDS_REVIEW`, alert, **do not** auto-confirm.

### 7.6 IDOR

- `GET /bookings/:id` requires knowledge of unguessable id **and** phone last-4 or session.
- Do not enumerate `AGR-001`.

### 7.7 XSS / ticket page

- Ticket HTML: escape guest name. WhatsApp deep links: `encodeURIComponent`.

### 7.8 CSP (Pages)

- `default-src 'self'`
- `script-src 'self' https://checkout.razorpay.com`
- `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com`
- `frame-src https://api.razorpay.com https://checkout.razorpay.com`
- `img-src 'self' data: https:`

### 7.9 Logging

- Log `booking_id`, `order_id`, `payment_id`, status.
- **Never** log secrets, full webhook HMAC, card last4 beyond what Razorpay sends if not needed.
- Redact phone to last 4 in logs.

### 7.10 Admin refunds

- Separate admin Worker with Cloudflare Access (email allowlist).
- Dual control for refunds > ₹5,000 (two-person or owner OTP).
- All refunds via Razorpay API, then webhook updates DB — don’t mark refunded only in UI.

---

## 8. Cloudflare hosting

### 8.1 Frontend

- Pages or Workers static assets for the existing SSG.
- Custom domain + Universal SSL.
- `book.html` stays `noindex`.

### 8.2 Backend on Cloudflare

| Need | Product |
|---|---|
| API + webhooks | Worker |
| SQL | D1 |
| Idempotency / rate | KV |
| Secrets | Worker secrets |
| Async | Queues |
| Files (tickets PDF) | R2 |
| Auth admin | Cloudflare Access |

Workers **can** host the payment API. Constraints: CPU time, 100ms–30s limits depending on plan, no arbitrary TCP. Razorpay REST over `fetch` is fine.

If you later need PDF/GST heavy jobs: queue to a cloud VM.

### 8.3 Preview vs production

- Preview: `rzp_test_` only. Block live keys on `*.pages.dev`.
- Production: live keys only on apex domain.

---

## 9. Scenarios companies actually handle

Implement tests for **each**. Missing one = money bugs.

### 9.1 Happy path

User pays UPI → `payment.captured` + `order.paid` → booking PAID → ticket → WhatsApp.

### 9.2 Double click / retry
z
Two submits: same Idempotency-Key → one Order. Two keys quickly: detect open `PENDING` order for same booking; reuse.

### 9.3 Webhook before browser handler

User paid, closed modal. Webhook marks PAID. Browser poll shows ticket. **OK.**

### 9.4 Browser success, webhook delayed

Show “Confirming payment…” not ticket. Poll 2–5s. If timeout: “We’ve received a response from the bank. If money is debited, ticket will appear within 15 minutes / WhatsApp.” Never invent `PAID`.

### 9.5 Payment failed then success

Same order, second attempt. Store both payment rows. Latest captured wins.

### 9.6 User paid wrong amount

Should be impossible if Checkout bound to order. If webhook amount ≠ order: freeze `NEEDS_REVIEW`.

### 9.7 Promo fraud

Client sends `promo=VIP100`. Server ignores unless DB rule + minTotal + usage cap (per phone). Recalc after lock.

### 9.8 Fare tampering

Client sends `advance: 1`. Server ignores.

### 9.9 Expired order

Razorpay orders expire (~6 months default but **you** expire booking in 15–30 min). After expiry, new order. Do not accept late captured payment without review (rare).

### 9.10 Refunds

- Full: cancel trip, refund advance, status REFUNDED.
- Partial: weather / no-show policy (client decision).
- Refund API idempotent. Wait `refund.processed`.
- UPI refunds can take T+3–7. UI: `REFUND_PENDING`.

### 9.11 Chargeback / dispute

Mark `DISPUTED`, pause trip, owner notified. Do not auto-refund twice.

### 9.12 Settlement mismatch

Weekly job: Razorpay settlements API vs sum(`payments.captured`). Diff → alert.

### 9.13 Test vs live mixup

Reject `pay_test` ids on live env and vice versa.

### 9.14 Network partition

Webhook 5xx → Razorpay retries. Your handler must be idempotent.

### 9.15 Clock / timezone

Travel date is **IST calendar date**, not UTC `toISOString` slice (already a bug class in `fares.js` comments). Payments timestamps: store UTC ISO.

### 9.16 International cards / 3DS

Razorpay handles 3DS. User may sit on bank page 10 min. Keep order PENDING.

### 9.17 UPI collect vs intent

Prefer Checkout UPI. Collect (VPA) has extra failure modes; skip v1.

### 9.18 Wallets / netbanking pending

Some methods `authorized` then fail. Only `captured` confirms.

### 9.19 Partial capture (do not use v1)

If ever: remaining uncaptured auto-voids. Document or avoid.

### 9.20 Duplicate webhooks different event ids same payment

Dedupe on `payment_id` + new status monotonic (don’t go PAID → FAILED).

### 9.21 Booking edit after pay

Forbidden. New booking + refund old.

### 9.22 Driver balance

Never mark remaining as paid in Razorpay. Ops cash collection is out of band.

### 9.23 GST invoice

If GSTIN: invoice on **captured** amount (advance), not full fare, unless full prepay. Consult CA. Store HSN/SAC later.

### 9.24 RBI tokenization

Razorpay-managed. Don’t store tokens yourself.

### 9.25 Sanctions / blocked BINs

Razorpay declines. Map to FAILED + user message from `error.description` **without** leaking internal codes.

### 9.26 Load test

Never load-test **live**. Use test keys. Rate-limit create-order.

### 9.27 Staff “mark paid” without money

Admin override requires reason + audit log + owner role. Default **off**.

### 9.28 Replay of old success URL

Verify signature + current booking status. If already PAID, show ticket. If order cancelled, ignore.

### 9.29 Phone change mid-pay

Lock guest fields at order create.

### 9.30 Multi-tab

sessionStorage today is tab-scoped. Server booking id in URL `?b=` after create-order so tabs converge.

---

## 10. Frontend template (replace mock)

Keep 5 steps. Step 4:

1. Show **server** advance (after create-order).
2. Methods: UPI / Cards / Netbanking via Checkout (don’t fake radio that bypasses Razorpay).
3. Demo chip **off** in live; **on** in test (`PAID (TEST)`).
4. Step 5 ticket: `PAID` only from API. Remaining “to driver”.
5. `skb-booking` may cache UX; **source of truth is API**.

GA4: `begin_checkout`, `add_payment_info`, `purchase` with **real** `value` = advance rupees, `transaction_id` = booking id. No `_demo` suffix in live.

---

## 11. Backend API sketch

| Method | Path | Notes |
|---|---|---|
| POST | `/v1/bookings/quote` | Recompute fare, no side effects |
| POST | `/v1/payments/create-order` | Idempotent |
| POST | `/v1/payments/verify` | Signature from Checkout |
| GET | `/v1/bookings/:id` | Status poll |
| POST | `/webhooks/razorpay` | Raw body |
| POST | `/v1/admin/refunds` | Access-gated |

Errors: `application/problem+json`, no stack traces.

---

## 12. Testing protocol (zero-miss)

1. Razorpay test cards / UPI test (docs). Success, failure, 3DS.
2. Webhook local: Stripe-style — use Razorpay Dashboard “send test webhook” + `cloudflared` tunnel.
3. Contract tests: signature valid/invalid, amount mismatch, duplicate event.
4. Chaos: drop webhook, then replay.
5. Refund full/partial.
6. Idempotency-Key replay.
7. Fare golden tests: port `fares.js` vectors (one-way, round, night, promo, package).
8. Never production-charge during QA.

Go-live gate: 10 successful **test** bookings, 2 failed, 1 refund, 1 duplicate webhook, 1 closed-tab success — all DB-correct.

---

## 13. Legal / ops

- Terms + Privacy: cancellation, refund SLA, advance non-refundable window (client decision).
- Display GST if registered.
- Support phone on failed payment page.
- Daily owner digest: PAID count, rupees, failures.

---

## 14. What not to build (v1)

- Crypto, international settlement, split payouts to drivers
- Storing cards
- Client-side “paid” flag
- Shared Razorpay secret in n8n without vault
- Auto-refund without policy

---

## 15. Maintained GitHub / upstream references

Use these as **implementation references**, not copy-paste secrets.

| Repo | Why |
|---|---|
| [razorpay/razorpay-node](https://github.com/razorpay/razorpay-node) | Official Node SDK; orders, payments, refunds, webhooks |
| [razorpay/razorpay-python](https://github.com/razorpay/razorpay-python) | If API is Python |
| [razorpay/razorpay-web-sample-integration](https://github.com/razorpay/razorpay-web-sample-integration) | Checkout + order sample |
| [razorpay/razorpay-java](https://github.com/razorpay/razorpay-java) | If JVM later |
| [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) | Wrangler, secrets, D1 |
| [cloudflare/workers-rs](https://github.com/cloudflare/workers-rs) / Hono [honojs/hono](https://github.com/honojs/hono) | Small Worker API framework (Hono is well maintained) |
| [stripe/stripe-node](https://github.com/stripe/stripe-node) | Gold-standard webhook/idempotency patterns (adapt, don’t use Stripe for INR UPI) |
| [adyen-examples](https://github.com/adyen-examples) | Enterprise session + webhook discipline |
| [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) | Payment, session, CSRF, secrets |
| [cloudflare/serverless-registry](https://github.com/cloudflare) workers templates | D1 + KV |

Razorpay docs (read before coding): Orders, Payments, Webhooks, Refunds, Checkout, Test cards, Signature verification.

---

## 16. Rollout plan

1. Port fare engine to server; golden tests vs `js/fares.js`.
2. D1 schema + Worker skeleton (quote + create-order + webhook no-op).
3. Test keys + Checkout on staging domain.
4. Webhook tunnel + all scenarios in §9.
5. Legal copy; remove “demo” chip on live.
6. Live keys; ₹1 real payment by owner; refund it.
7. Enable on `book.html`.
8. Monitor 14 days.

---

## 17. Decision log hooks

Before coding payments, log in `04_PROGRESS_TRACKER.md`:

- Advance still 28%?
- Full prepay option? (default no)
- Refund policy
- Cloudflare-only vs extra VPS
- GST invoicing yes/no

Until then, **do not** charge real money.
