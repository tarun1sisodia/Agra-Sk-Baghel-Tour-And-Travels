/**
 * Master PageSpeed 100/100 E2E Test Suite Runner
 *
 * Executes all 4 Tiers:
 * - Tier 1: Feature Coverage (40 tests across Features 1-8)
 * - Tier 2: Boundary & Corner Cases (40 tests across Features 1-8)
 * - Tier 3: Cross-Feature Combinations (10 pairwise interaction tests)
 * - Tier 4: Real-World Application Scenarios (10 Lighthouse simulation tests)
 *
 * Total: 100 Tests validating production artifacts, critical path performance,
 * accessibility compliance, security headers, and bundle optimizations.
 *
 * Execution options:
 * - Single command: `node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts`
 * - Strict full audit: `PAGESPEED_STRICT=1 node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts`
 * - Milestone scoped: `PAGESPEED_MILESTONE=M1 node --experimental-strip-types --test react/scripts/pagespeed-e2e.test.ts`
 */

import "./pagespeed-e2e-tier1.test.ts";
import "./pagespeed-e2e-tier2.test.ts";
import "./pagespeed-e2e-tier3.test.ts";
import "./pagespeed-e2e-tier4.test.ts";
