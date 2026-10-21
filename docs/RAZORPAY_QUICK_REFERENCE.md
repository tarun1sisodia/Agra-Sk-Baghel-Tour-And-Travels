# Razorpay Payment Flow - Quick Reference

## 📊 Database State Machine

### Bookings Table (`bookings`)

| Status | Description | How to Reach |
|--------|-------------|--------------|
| `pending_payment` | Booking created, waiting for payment | User clicks "Pay Now" |
| `confirmed` | Payment captured, booking confirmed | Webhook `payment.captured` |
| `cancelled` | Booking cancelled by user/admin | Admin action or user request |
| `driver_assigned` | Driver assigned to booking | Admin assigns driver |
| `in_transit` | Trip in progress | Driver starts trip |
| `completed` | Trip completed | Driver marks complete |

### Payments Table (`payments`)

| Status | Description | Razorpay Dashboard |
|--------|-------------|-------------------|
| `pending` | Order created, waiting for payment | Order created |
| `captured` | Payment received | Payment captured |
| `failed` | Payment failed | Payment failed |
| `needs_review` | Discrepancy detected | Manual review needed |
| `refunded` | Full refund issued | Refunded |
| `partially_refunded` | Partial refund issued | Partially refunded |

---

## 🔐 Security Checks Implemented

### 1. Webhook Signature Verification
- **Location:** [`payments.service.ts:392`](../backend/src/modules/payments/payments.service.ts:392)
- **What:** Verifies `X-Razorpay-Signature` header using HMAC-SHA256
- **Protection:** Prevents fake payment confirmations

### 2. Timestamp Validation
- **Location:** [`payments.service.ts:403`](../backend/src/modules/payments/payments.service.ts:403)
- **What:** Rejects webhooks older than 5 minutes
- **Protection:** Prevents replay attacks

### 3. Amount Validation
- **Location:** [`payments.service.ts:338`](../backend/src/modules/payments/payments.service.ts:338)
- **What:** Compares webhook amount with order amount
- **Protection:** Prevents partial payment fraud

### 4. Currency Validation
- **Location:** [`payments.service.ts:343`](../backend/src/modules/payments/payments.service.ts:343)
- **What:** Verifies currency is INR
- **Protection:** Prevents wrong-currency charges

### 5. Booking Ownership
- **Location:** [`payments.service.ts:56`](../backend/src/modules/payments/payments.service.ts:56)
- **What:** Verifies user owns the booking
- **Protection:** Prevents IDOR attacks

### 6. Phone Validation
- **Location:** [`payments.service.ts:75`](../backend/src/modules/payments/payments.service.ts:75)
- **What:** Validates Indian phone format (6-9, 10 digits)
- **Protection:** Prevents invalid contact data

### 7. Advance Percentage Validation
- **Location:** [`payments.service.ts:88`](../backend/src/modules/payments/payments.service.ts:88)
- **What:** Validates advance is 25-50% of total
- **Protection:** Prevents unusual payment patterns

### 8. Fraud Detection
- **Location:** [`payments.service.ts:106`](../backend/src/modules/payments/payments.service.ts:106)
- **What:** Logs warnings for suspicious patterns
- **Protection:** Early fraud detection

### 9. Idempotency
- **Location:** [`payments.service.ts:183`](../backend/src/modules/payments/payments.service.ts:183)
- **What:** Prevents double-charging on retries
- **Protection:** Payment safety

### 10. Cancelled Booking Protection
- **Location:** [`payments.service.ts:366`](../backend/src/modules/payments/payments.service.ts:366)
- **What:** Rejects payments on cancelled bookings
- **Protection:** Prevents fraud on cancelled trips

---

## 🔄 Payment Flow

### Step 1: Create Booking
```
POST /api/v1/bookings
{
  "ticket_id": "AGR-20261021-ABC123",
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "total_amount": 15000,      // ₹15,000
  "advance_amount": 4200,     // ₹4,200 (28%)
  "status": "pending_payment"
}
```

**Database:**
```sql
INSERT INTO bookings (..., status) VALUES (..., 'pending_payment');
```

### Step 2: Create Razorpay Order
```
POST /api/v1/payments/create-order
Authorization: Bearer <token>
{
  "booking_id": "uuid-here"
}
```

**Backend:**
1. Validates booking ownership
2. Validates phone format
3. Validates advance percentage
4. Creates Razorpay order via API
5. Returns `{order_id, amount, key_id}`

**Database:**
```sql
INSERT INTO payments (booking_id, provider_order_id, amount_paise, status)
VALUES (..., 'order_XXXX', 420000, 'pending');
```

### Step 3: Customer Completes Payment
Customer uses Razorpay Checkout to pay ₹4,200.

### Step 4: Webhook Confirmation (SOURCE OF TRUTH)
```
POST /api/v1/payments/webhooks/razorpay
X-Razorpay-Signature: <HMAC-SHA256>
X-Razorpay-Signature-Timestamp: <unix-timestamp>
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_XXXX",
        "order_id": "order_XXXX",
        "amount": 420000,
        "currency": "INR",
        "method": "upi"
      }
    }
  }
}
```

**Backend:**
1. ✅ Verify HMAC signature
2. ✅ Verify timestamp (not older than 5 min)
3. ✅ Verify amount matches order
4. ✅ Verify currency is INR
5. ✅ Verify booking not cancelled
6. ✅ Mark payment `captured`
7. ✅ Update booking `confirmed`
8. ✅ Send confirmation email

**Database:**
```sql
UPDATE payments 
SET status = 'captured', 
    provider_payment_id = 'pay_XXXX',
    payment_method = 'upi',
    verified_at = NOW(),
    reconciliation_status = 'matched'
WHERE id = ...;

UPDATE bookings 
SET status = 'confirmed', 
    updated_at = NOW() 
WHERE id = ...;
```

---

## 📋 What Shows Where

### After Payment Completes

**Database (`bookings` table):**
| Column | Value |
|--------|-------|
| `status` | `confirmed` |
| `updated_at` | `2026-10-21T11:46:00Z` |

**Database (`payments` table):**
| Column | Value |
|--------|-------|
| `status` | `captured` |
| `provider_payment_id` | `pay_XXXX` |
| `payment_method` | `upi` |
| `verified_at` | `2026-10-21T11:46:00Z` |
| `reconciliation_status` | `matched` |

**Razorpay Dashboard:**
- Order: `PAID`
- Payment: `CAPTURED`
- Reference: `AGR-20261021-ABC123`

**Customer Email:**
- Subject: "Confirmed: Your Chauffeur Booking Voucher [AGR-20261021-ABC123]"
- Body: Shows ticket ID, service, vehicle, pickup, tariff breakdown
- Attachment: PDF voucher

---

## 🔍 Fraud Detection Patterns

The system logs warnings for:

1. **Long Payment Delay**
   - Warning: "Payment delay of X hours exceeds normal pattern"
   - Trigger: Payment made > 60 minutes after booking

2. **Suspiciously Round Amounts**
   - Warning: "Payment amount ₹X is suspiciously round (potential test payment)"
   - Trigger: Amount is multiple of ₹10,000

3. **Extended Pending Status**
   - Warning: "Booking has been pending payment for X hours"
   - Trigger: Booking stuck in `pending_payment` > 24 hours

---

## 🛡️ Environment Variables (Required)

```bash
# Razorpay Keys (from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_live_XXXXX          # Public (in Checkout.js)
RAZORPAY_KEY_SECRET=XXXXX               # Server-only (HMAC signing)
RAZORPAY_WEBHOOK_SECRET=XXXXX           # Different from key secret!

# Webhook URL (in Razorpay Dashboard)
https://your-domain.com/api/v1/payments/webhooks/razorpay
```

---

## 📝 Testing Checklist

### Test 1: Valid Payment
1. Create booking with advance ₹4,200
2. Call `/api/v1/payments/create-order`
3. Verify Razorpay order created
4. Simulate webhook `payment.captured`
5. Verify booking status = `confirmed`
6. Verify payment status = `captured`

### Test 2: Amount Mismatch
1. Create booking with advance ₹4,200
2. Simulate webhook with `amount: 100000` (₹1,000)
3. Verify status = `needs_review`
4. Verify booking stays `pending_payment`

### Test 3: Cancelled Booking
1. Create booking
2. Cancel via admin panel
3. Simulate webhook `payment.captured`
4. Verify status = `needs_review`
5. Verify booking stays `cancelled`

### Test 4: Invalid Signature
1. Simulate webhook with wrong signature
2. Verify HTTP 400 error
3. Verify no state changes

### Test 5: Old Timestamp
1. Simulate webhook with timestamp 10 minutes old
2. Verify HTTP 400 error
3. Verify no state changes

---

## 🚀 Next Steps

1. **Review this document** with your team
2. **Test all scenarios** in Razorpay test mode
3. **Configure webhook URL** in Razorpay Dashboard
4. **Set up monitoring** for `needs_review` payments
5. **Deploy to production** with live keys
6. **Monitor first 100 payments** manually

---

**Questions?** Check [`docs/PAYMENT_SECURITY.md`](../docs/PAYMENT_SECURITY.md) for detailed security documentation.
