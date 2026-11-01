# Razorpay Payment Flow — Quick Reference

## 1. Database State Machine

### `bookings` Table

| Status | Description | Trigger |
|--------|-------------|---------|
| `draft` | Initial booking record created | `POST /api/v1/bookings` |
| `pending_payment` | Razorpay Order created; awaiting 28% advance | `POST /api/v1/payments/create-order` |
| `paid_confirmed` | 28% advance captured; 72% balance payable to driver | Webhook `payment.captured` or `POST /api/v1/payments/verify` |
| `in_transit` | Customer on trip | `super_admin` updates via `PATCH /api/v1/admin/bookings/:id/status` |
| `completed` | Trip finished & 72% cash balance collected by driver | `super_admin` updates status + `balance_collected_by_driver = true` |
| `cancelled` | Cancelled by user, admin, or 30m expiry worker | Expiry worker or Admin action |
| `refunded` | Advance refunded via Razorpay | `POST /api/v1/admin/payments/:id/refund` |

### `payments` Table

| Status | `reconciliation_status` | Meaning |
|--------|-------------------------|---------|
| `pending` | `pending` | Razorpay Order created (`amount_paise = advance_amount * 100`) |
| `captured` | `matched` | Verified payment captured; `verified_at` and `payment_method` populated |
| `failed` | `pending` | Payment failed at gateway |
| `needs_review` | `needs_review` | Amount/currency mismatch or payment arrived after booking cancellation |
| `refunded` | `matched` | Refund processed via Razorpay |

---

## 2. Quick Verification SQL Queries

```sql
-- Verify all captured payments are reconciled with timestamp and method
SELECT id, booking_id, provider_order_id, provider_payment_id, amount_paise, payment_method, reconciliation_status, verified_at
FROM payments
WHERE status = 'captured';

-- Check for any payments flagged for manual super_admin review
SELECT p.id, p.booking_id, b.ticket_id, p.amount_paise, p.failure_reason, p.created_at
FROM payments p
JOIN bookings b ON b.id = p.booking_id
WHERE p.status = 'needs_review';
```
