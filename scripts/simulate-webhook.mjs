#!/usr/bin/env node

/**
 * Agra SK Baghel Tour & Travels — Localhost Razorpay Webhook Simulator
 *
 * Use this script to simulate the Razorpay `payment.captured` webhook on localhost
 * so that a test booking transitions to `paid_confirmed` without needing a public tunnel.
 *
 * Usage:
 *   node scripts/simulate-webhook.mjs <providerOrderId> <amountPaise> [paymentId]
 *
 * Example:
 *   node scripts/simulate-webhook.mjs order_xyz123 100000
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function getEnvSecret() {
  const envPaths = [
    path.resolve(process.cwd(), "backend/.env"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      const match = content.match(/RAZORPAY_WEBHOOK_SECRET=([^\r\n]+)/);
      if (match && match[1]?.trim()) {
        return match[1].trim().replace(/^['"]|['"]$/g, "");
      }
      const secretMatch = content.match(/RAZORPAY_KEY_SECRET=([^\r\n]+)/);
      if (secretMatch && secretMatch[1]?.trim()) {
        return secretMatch[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
  return "whsec_razorpay_test";
}

const providerOrderId = process.argv[2];
const amountPaise = process.argv[3] ? Number(process.argv[3]) : 100000;
const providerPaymentId = process.argv[4] || `pay_test_${Date.now()}`;

if (!providerOrderId) {
  console.log("\x1b[33m%s\x1b[0m", "Usage: node scripts/simulate-webhook.mjs <providerOrderId> [amountPaise] [providerPaymentId]");
  console.log("Example: node scripts/simulate-webhook.mjs order_test_12345 100000");
  process.exit(1);
}

const secret = getEnvSecret();
console.log(`\x1b[36m[Webhook Simulator]\x1b[0m Simulating payment for Order: ${providerOrderId}`);
console.log(`  • Amount (Paise):    ${amountPaise} (₹${amountPaise / 100})`);
console.log(`  • Payment ID:        ${providerPaymentId}`);
console.log(`  • Using Secret:      ${secret.slice(0, 4)}... (len: ${secret.length})`);

const payload = {
  entity: "event",
  account_id: "acc_test",
  event: "payment.captured",
  contains: ["payment"],
  payload: {
    payment: {
      entity: {
        id: providerPaymentId,
        entity: "payment",
        amount: amountPaise,
        currency: "INR",
        status: "captured",
        order_id: providerOrderId,
        method: "card",
        fee: 0,
        tax: 0,
      },
    },
  },
  created_at: Math.floor(Date.now() / 1000),
};

const rawBody = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

const targetUrl = "http://localhost:4000/api/v1/payments/webhooks/razorpay";
console.log(`  • Posting to:        ${targetUrl}`);

try {
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature,
    },
    body: rawBody,
  });

  const json = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log("\x1b[32m%s\x1b[0m", `\n✅ Webhook delivered successfully! Status: ${res.status}`);
    console.log("Response:", json);
    console.log("\nBooking should now be 'paid_confirmed' on the customer voucher screen.");
  } else {
    console.error("\x1b[31m%s\x1b[0m", `\n❌ Webhook delivery rejected with status ${res.status}`);
    console.error("Response:", json);
  }
} catch (err) {
  console.error("\x1b[31m%s\x1b[0m", `\n❌ Failed to connect to ${targetUrl}. Is the backend running?`);
  console.error(err.message);
}
