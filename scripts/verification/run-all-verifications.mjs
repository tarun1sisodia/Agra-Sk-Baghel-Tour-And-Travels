#!/usr/bin/env node

/**
 * Agra SK Baghel Tour & Travels — Master Operations & API Cross-Verification Suite
 * Executes end-to-end operational verification across Customer Site, Admin Operations Desk,
 * Clean Fare Engine, and Legacy Decommission boundaries.
 */

import { API_BASE_URL } from "./common.mjs";
import { runCustomerFlowVerification } from "./test-customer-flow.mjs";
import { runAdminOperationsVerification } from "./test-admin-operations.mjs";
import { runLegacySafetyVerification } from "./test-legacy-safety.mjs";

async function main() {
  const targetUrl = process.env.API_BASE_URL || API_BASE_URL;
  console.log("\x1b[1m\x1b[36m============================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m AGRA SK BAGHEL TOUR & TRAVELS — VERIFICATION SUITE RUNNER  \x1b[0m");
  console.log("\x1b[1m\x1b[36m============================================================\x1b[0m");
  console.log(`Endpoint target: ${targetUrl}\n`);

  const results = [];

  try {
    const customer = await runCustomerFlowVerification(targetUrl);
    results.push({ suite: "Customer Clean Fare Flow", ...customer });
  } catch (err) {
    console.error("Customer suite crashed:", err);
    results.push({ suite: "Customer Clean Fare Flow", passedCount: 0, totalCount: 1 });
  }

  try {
    const admin = await runAdminOperationsVerification(targetUrl);
    results.push({ suite: "Admin Operations Desk", ...admin });
  } catch (err) {
    console.error("Admin suite crashed:", err);
    results.push({ suite: "Admin Operations Desk", passedCount: 0, totalCount: 1 });
  }

  try {
    const legacy = await runLegacySafetyVerification(targetUrl);
    results.push({ suite: "Legacy Safety & Decommission", ...legacy });
  } catch (err) {
    console.error("Legacy suite crashed:", err);
    results.push({ suite: "Legacy Safety & Decommission", passedCount: 0, totalCount: 1 });
  }

  console.log("\x1b[1m\x1b[36m------------------------------------------------------------\x1b[0m");
  console.log("\x1b[1mVERIFICATION SUMMARY:\x1b[0m");
  let grandPassed = 0;
  let grandTotal = 0;

  for (const r of results) {
    grandPassed += r.passedCount;
    grandTotal += r.totalCount;
    const ok = r.passedCount === r.totalCount;
    const status = ok ? "\x1b[32mPASSED\x1b[0m" : "\x1b[31mFAILED\x1b[0m";
    console.log(` • ${r.suite.padEnd(35)} : ${status} (${r.passedCount}/${r.totalCount})`);
  }

  console.log("\x1b[1m\x1b[36m------------------------------------------------------------\x1b[0m");
  console.log(`Total Operations Verified: ${grandPassed}/${grandTotal}`);

  if (grandPassed === grandTotal && grandTotal > 0) {
    console.log("\x1b[1m\x1b[32m✔ ALL CROSS-VERIFICATION TESTS PASSED SUCCESSFULLY.\x1b[0m\n");
    process.exit(0);
  } else {
    console.log("\x1b[1m\x1b[31m✖ SOME VERIFICATION TESTS FAILED. PLEASE REVIEW LOGS.\x1b[0m\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal verification error:", err);
  process.exit(1);
});
