**AUDIT REPORT: ARENA AI (AGRA SK BAGHEL TOUR & TRAVELS)**  
**Subject:** Critical Payment Integrity & Deployment Pipeline Failures  
**Date:** 2024-06-15  
**Auditor:** Qwen 3 Coder Next (Distributed Systems & Financial Integrity Specialist)  
**Classification:** **CRITICAL — BLOCKS PRODUCTION GO-LIVE**

---

## 1. EXECUTIVE SUMMARY & VERDICT

### ✅ Payment Integrity: **CRITICAL FAILURE — HIGH RISK OF FINANCIAL LOSS & RECONCILIATION BREAKDOWN**
- **Root Cause:** `processCaptured()` does **not** update reconciliation metadata (`reconciliation_status`, `verified_at`, `payment_method`) — rendering all 21 captured payments *unreconcilable*.
- **Business Impact:**  
  - All payments remain in `reconciliation_status = 'pending'` → **impossible to reconcile with Razorpay settlement reports**.  
  - Bank settlements in test mode *never occur* (Razorpay test mode does not settle), but **production will settle** — and without reconciliation, you risk **double-refunds, missed deposits, or fraud**.  
  - `verified_at` and `payment_method` being `NULL` breaks fraud detection, chargeback defense, and tax reporting.

### ✅ Publishing Outbox: **HIGH SEVERITY — DEPLOYMENT PIPELINE BROKEN**
- **Root Cause:**  
  - `outstation_routes` resolver referenced non-existent `fares_inr` column (now fixed, but *only after runtime catalog exposed live DB*).  
  - `PAGES_DEPLOY_HOOK_URL` missing → **no static site rebuilds triggered** → stale content on production CDN.  
  - Release tracking uses `builtAt` (file timestamp) instead of `git.commitSha` → **false-positive health checks** (e.g., stale build passes if file exists).
- **Business Impact:**  
  - Fleet/fares update *immediately* via `/api/v1/catalog` (live DB), but **static pages (SEO, PWA, SSR fallback) remain outdated**.  
  - Deployments silently fail → **inconsistent UX** (e.g., new route appears in app but not in web search).

> 🔴 **VERDICT: DO NOT PROCEED TO PRODUCTION UNTIL PAYMENT INTEGRITY PATCHES ARE APPLIED.**  
> Publishing fixes are urgent but non-critical for *payment processing*.

---

## 2. STEP-BY-STEP ROOT CAUSE ANALYSIS (PAYMENT INTEGRITY)

### 🔍 **Flaw #1: `verifyPayment()` does not enforce `status === 'captured'`**
- In `payments.service.ts`, after successful signature & Razorpay API verification:
  ```ts
  if (body.status === "failed") { ... return { status: "failed" }; }
  // ❌ NO ELSE IF FOR 'captured' — falls through to processCaptured() for ANY non-failed status!
  ```
- **Consequence:**  
  - Payments in `authorized` (not yet captured) or `pending` state trigger `processCaptured()` → **premature booking confirmation**.  
  - Razorpay may later fail the payment (e.g., customer dispute) → **confirmed booking without payment**.

### 🔍 **Flaw #2: `processCaptured()` omits reconciliation fields**
- In `payments.repository.ts`, `processCaptured()` only updates:
  ```sql
  UPDATE payments SET status = 'captured', provider_payment_id = $1, updated_at = NOW() ...
  ```
- **Missing critical fields:**
  - `reconciliation_status = 'matched'`  
  - `verified_at = NOW()`  
  - `payment_method = body.payment_method` (e.g., `card`, `upi`, `netbanking`)  
- **Consequence:**  
  - Reconciliation engine has no data to match Razorpay settlement CSVs → **manual reconciliation required** (error-prone).  
  - `verified_at` missing → cannot prove payment was verified at time of capture (critical for chargebacks).  
  - `payment_method` missing → cannot enforce fraud rules (e.g., block high-risk cards).

### 🔍 **Flaw #3: `processCaptured()` ignores booking cancellation state**
- `UPDATE bookings ... WHERE status = 'pending_payment'`  
- If booking is *cancelled* (status = `cancelled`), **0 rows updated** → payment still marked `captured`, but booking remains cancelled.  
- **Consequence:**  
  - Customer paid → payment shows `captured`, but booking is `cancelled` → **discrepancy in financial records**.  
  - May trigger duplicate refund attempts.

---

## 3. PRODUCTION-READY CODE PATCHES

### ✅ Patch 1: `backend/src/modules/payments/payments.service.ts`
**Fix:** Enforce `status === 'captured'` before calling `processCaptured()`, and capture `payment_method`.

```diff
async verifyPayment(params: {
    bookingId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    user?: any;
  }): Promise<{ status: string }> {
    // ... [existing ownership/signature checks] ...

    if (payment.status === "captured") {
      return { status: "already_captured" };
    }

    // ... [signature verification] ...

    if (this.keyId) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
        const res = await this.fetchImpl(`https://api.razorpay.com/v1/payments/${encodeURIComponent(params.razorpayPaymentId)}`, {
          method: "GET",
          headers: { Authorization: `Basic ${auth}` },
        });

        if (res.ok) {
          const body = (await res.json()) as any;
          if (body?.id) {
            // ... [existing order/currency/amount checks] ...

            if (body.status === "failed") {
              await this.deps.paymentsRepo.processFailed({
                paymentId: payment.id,
                reason: body.error_description || "payment_failed_at_gateway",
              });
              return { status: "failed" };
            }

+           // ✅ NEW: Enforce captured status before proceeding
+           if (body.status !== "captured") {
+             console.warn(`[payments] Payment ${params.razorpayPaymentId} is ${body.status}, skipping capture`);
+             return { status: body.status }; // e.g., "authorized", "pending"
+           }

+           // ✅ NEW: Capture payment_method for reconciliation
+           const paymentMethod = body.payment_method || null;

            // ✅ PASS payment_method to processCaptured
            await this.deps.paymentsRepo.processCaptured({
              paymentId: payment.id,
              bookingId: params.bookingId,
              providerPaymentId: params.razorpayPaymentId,
              webhookEventId: params.webhookEventId,
+             paymentMethod,
            });
            return { status: "captured" };
          }
        }
      } catch (err: any) {
        // ... [existing error handling] ...
      }
    }
    // ... [fallback] ...
  }
```

---

### ✅ Patch 2: `backend/src/modules/payments/payments.repository.ts`
**Fix:** Update `processCaptured()` to set reconciliation fields and handle cancelled bookings.

```diff
async processCaptured(params: {
    paymentId: string;
    bookingId: string;
    providerPaymentId: string;
    webhookEventId?: string;
+   paymentMethod?: string | null;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // ✅ NEW: Update reconciliation fields
      await client.query(
        `UPDATE payments 
         SET 
           status = 'captured', 
           provider_payment_id = $1,
+          reconciliation_status = 'matched',
+          verified_at = NOW(),
+          payment_method = COALESCE($3, payment_method),
           updated_at = NOW() 
         WHERE id = $2`,
-        [params.providerPaymentId, params.paymentId]
+        [params.providerPaymentId, params.paymentId, params.paymentMethod]
      );

+     // ✅ NEW: Only confirm booking if not cancelled
      await client.query(
-       `UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1 AND status = 'pending_payment'`,
+       `UPDATE bookings 
+        SET status = 'confirmed', updated_at = NOW() 
+        WHERE id = $1 
+          AND status IN ('pending_payment', 'payment_failed') -- allow retry from failed state
+          AND cancelled_at IS NULL`, -- ✅ prevent confirming cancelled bookings
        [params.bookingId]
      );

      if (params.webhookEventId) {
        await client.query(
          `UPDATE payment_webhook_events SET processed = true WHERE id = $1`,
          [params.webhookEventId]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
```

> 💡 **Why this works:**  
> - `reconciliation_status = 'matched'` + `verified_at` + `payment_method` → enables automated reconciliation.  
> - `cancelled_at IS NULL` check prevents confirming cancelled bookings.  
> - `status IN ('pending_payment', 'payment_failed')` allows retry after transient failures.

---

## 4. PUBLISHING OUTBOX & DEPLOYMENT PIPELINE ANALYSIS

### 🔍 Root Causes & Fixes

| Issue | Root Cause | Fix |
|-------|-------------|-----|
| **`fares_inr` column error** | Schema evolved to `outstation_route_vehicles.one_way_amount`, but outbox resolver still used old column. | ✅ **Already fixed** (per audit): `SELECT MIN(orv.one_way_amount) ...` |
| **`PAGES_DEPLOY_HOOK_URL` missing** | `.env` missing `PAGES_DEPLOY_HOOK_URL` → `fetch()` fails silently. | **Add to `.env`:**<br>`PAGES_DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/dns/...`<br>**Add error handling:**<br>```ts<br>if (!process.env.PAGES_DEPLOY_HOOK_URL) {<br>  this.logger.warn("PAGES_DEPLOY_HOOK_URL not set — static deploy skipped");<br>  return;<br>}<br>``` |
| **Release tracking uses `builtAt`** | `builtAt` is file timestamp → unchanged if build artifact is copied. | **Replace with `git.commitSha`:**<br>```ts<br>const commitSha = process.env.GIT_COMMIT_SHA || "unknown";<br>if (Date.now() - new Date(commitSha).getTime() > 1000 * 60 * 60 * 24) {<br>  throw new Error("Release is stale (GIT_COMMIT_SHA > 24h old)");<br>}<br>```<br>**Set `GIT_COMMIT_SHA` in CI:**<br>`GIT_COMMIT_SHA=$(git rev-parse HEAD)` |

### 📌 Critical Recommendation: **Decouple Live API from Static Deployments**
- **Current flaw:** `/api/v1/catalog` serves live DB → customers see new fares *before* static pages update.  
- **Risk:** SEO pages (e.g., `/en/agra-to-delhi/`) show old fares → **customer confusion & chargebacks**.  
- **Solution:**  
  1. Add `static_content_version` column to `outstation_routes`.  
  2. In `publication-worker.ts`, bump `static_content_version` on route/fare changes.  
  3. In `/api/v1/catalog`, filter by `static_content_version = current`.  
  4. Only update `static_content_version` *after* static deploy succeeds.

---

## 5. ACTION CHECKLIST FOR RAZORPAY GO-LIVE

| Priority | Action | Owner | Verification |
|----------|--------|-------|--------------|
| 🔴 **CRITICAL** | Apply `payments.service.ts` & `payments.repository.ts` patches | Backend Team | ✅ Run `npm test` for `verifyPayment` with `status="authorized"` → should *not* confirm booking. |
| 🔴 **CRITICAL** | Run reconciliation script to backfill `reconciliation_status = 'matched'`, `verified_at`, `payment_method` for existing captured payments | DBA | ✅ Query: `SELECT COUNT(*) FROM payments WHERE reconciliation_status = 'matched' AND verified_at IS NOT NULL AND payment_method IS NOT NULL` → should be 21. |
| 🔴 **CRITICAL** | Test in **Razorpay test mode** with `rzp_test_local` key → verify `processCaptured()` does *not* run (signature check skipped). | QA | ✅ Check logs: `[payments] Payment ... is authorized, skipping capture`. |
| 🟠 **HIGH** | Add `PAGES_DEPLOY_HOOK_URL` + error handling in `publication-worker.ts` | DevOps | ✅ Trigger route update → verify `200 OK` in Cloudflare logs. |
| 🟠 **HIGH** | Replace `builtAt` with `GIT_COMMIT_SHA` in release checks | DevOps | ✅ Deploy with old `GIT_COMMIT_SHA` → health check should fail. |
| 🟢 **MEDIUM** | Add `cancelled_at IS NULL` check in `processCaptured()` (already in patch) | Backend | ✅ Cancel booking → attempt capture → verify `0 bookings updated`. |
| 🟢 **MEDIUM** | Implement `static_content_version` for catalog/fleet (see Section 4) | Backend | ✅ Update fare → static page updates within 5 mins. |

---

## FINAL VERDICT

- **Payment System:** **UNSAFE FOR PRODUCTION** until patches are applied.  
- **Publishing System:** **OPERATIONAL BUT FRAGILE** — deploy hooks must be fixed to avoid stale content.  
- **Timeline:**  
  - **Patch deployment:** 24 hours (dev + test).  
  - **Reconciliation backfill:** 4 hours (DBA).  
  - **Go-live:** **48 hours** after patch deployment.

> **I will personally review the patched code before merge.**  
> **Do not proceed without reconciliation field updates — this is a financial integrity failure.**

— **Qwen 3 Coder Next**  
*Elite Distributed Systems & Financial Integrity Auditor*