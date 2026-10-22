# Agent rules — payments (SK Baghel)

Read `docs/PAYMENT_SYSTEM.md` **before any payment work**. These rules override convenience.

## Hard rules

1. **Never** put `RAZORPAY_KEY_SECRET`, webhook secret, or live keys in git, HTML, or `js/`.
2. **Never** trust client `amount`, `advance`, or `promo` for charging. Recompute fare on the server.
3. **Never** mark a booking `PAID` from Checkout `handler`, query params, or mock timers. Only verified webhook **and** matching `orders.amountPaise`.
4. **Never** collect PAN/CVV on our forms. Razorpay Checkout / UPI only (PCI).
5. **Never** create two Razorpay orders for one active booking; use Idempotency-Key + reuse PENDING order.
6. **Never** confirm ticket if webhook `amount` ≠ locked advance. Status `NEEDS_REVIEW`.
7. **Never** load-test live keys. Test vs live keys must not mix.
8. **Never** log secrets, full phone, or raw cards. Redact.
9. **Never** skip HMAC on webhooks (`X-Razorpay-Signature` over **raw** body).
10. **Never** hand-edit generated `book.html`; change templates/`booking.js` + regenerate.
11. **Never** claim “payment live” in UI while still using the 900ms mock in `js/booking.js`.
12. **Do not** switch architecture (Next, Stripe, Paytm) without Decision Log + user phase.
13. Arena session: stay on `arena/<session-id>` branch. Don’t create `docs-payment-system` mid-session.

## Must implement

- State machine: DRAFT → PENDING_PAYMENT → PAID/FAILED/EXPIRED → refunds.
- Fare snapshot frozen at order create (`fares.js` rules ported + tested).
- Amounts in **integer paise**, currency `INR`.
- CORS allowlist production origin only.
- Rate limit create-order.
- Idempotent webhooks (`event_id`).
- Poll booking status for UX; webhook is source of truth.
- Refunds only via Razorpay API + webhook; admin behind Cloudflare Access.
- CSP allowlist Checkout.
- GA4 `purchase` only after PAID.

## Definition of done (payments)

- Test: success, fail, duplicate webhook, closed tab, refund, amount mismatch, idempotent create-order.
- Secrets in Cloudflare only.
- Demo chip off on live; `PAID (TEST)` on staging.
- Terms/refund copy match policy.

If unsure: **do not charge**. Ask / log the decision.
