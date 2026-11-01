import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";
process.env.ALLOW_TEST_AUTH = "true";
process.env.PORT = "4000";
process.env.LOG_LEVEL = "silent";
process.env.RAZORPAY_KEY_ID = "rzp_test_local";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay_test";
process.env.PAYPAL_CLIENT_ID = "paypal_test_client";
process.env.PAYPAL_CLIENT_SECRET = "paypal_test_secret";
process.env.PAYPAL_WEBHOOK_SECRET = "whsec_paypal_test";
process.env.CARD_PROVIDER_SECRET = "card_test_secret";
process.env.CARD_WEBHOOK_SECRET = "whsec_card_test";
process.env.LOCATIONIQ_TOKEN = "";
process.env.FARE_RULES_VERSION = "2026-09-13";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default"],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
  },
});
