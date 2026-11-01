import { rm } from "node:fs/promises";

// Set up test environment variables
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

// Cleanup temporary directories after all tests
const temporaryDirectories: string[] = [];

export async function cleanupTemporaryDirectories() {
    for (const directory of temporaryDirectories) {
        try {
            await rm(directory, { recursive: true, force: true });
        } catch {
            // Ignore errors during cleanup
        }
    }
}

export function trackTemporaryDirectory(dir: string) {
    temporaryDirectories.push(dir);
}
