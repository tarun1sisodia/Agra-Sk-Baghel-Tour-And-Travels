// Mobile performance budget gate for the customer site, using the public
// PageSpeed Insights API (same Lighthouse engine CI uses). Fails the build
// when the homepage regresses past the agreed budgets.
//
// Budgets (from the performance plan):
//   performance score >= 90, LCP <= 2500 ms, TBT <= 300 ms (mobile)

const BASE_URL = process.env.RENDER_BASE_URL || "https://agraskbagheltourandtravels.com";
const URL_TO_CHECK = process.env.PERF_CHECK_URL || BASE_URL;

const BUDGETS = {
  performance: 90, // score 0-100
  lcpMs: 2500,
  tbtMs: 300,
};

async function main() {
  const apiUrl =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
    encodeURIComponent(URL_TO_CHECK) +
    "&strategy=mobile&category=performance";

  console.log(`Fetching mobile Lighthouse (PSI) for ${URL_TO_CHECK} ...`);
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const text = await res.text();
    console.error(`PSI API failed (${res.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }
  const data = await res.json();
  const lh = data.lighthouseResult;
  const perf = Math.round((lh.categories.performance?.score ?? 0) * 100);
  const lcp = lh.audits["largest-contentful-paint"]?.numericValue ?? Infinity;
  const tbt = lh.audits["total-blocking-time"]?.numericValue ?? Infinity;

  console.log(`mobile performance: ${perf}/100 (budget >= ${BUDGETS.performance})`);
  console.log(`LCP: ${Math.round(lcp)} ms (budget <= ${BUDGETS.lcpMs} ms)`);
  console.log(`TBT: ${Math.round(tbt)} ms (budget <= ${BUDGETS.tbtMs} ms)`);

  const failures = [];
  if (perf < BUDGETS.performance) failures.push(`performance ${perf} < ${BUDGETS.performance}`);
  if (lcp > BUDGETS.lcpMs) failures.push(`LCP ${Math.round(lcp)} ms > ${BUDGETS.lcpMs} ms`);
  if (tbt > BUDGETS.tbtMs) failures.push(`TBT ${Math.round(tbt)} ms > ${BUDGETS.tbtMs} ms`);

  if (failures.length) {
    console.error(`\nPERF BUDGET FAILED: ${failures.join("; ")}`);
    process.exit(1);
  }
  console.log("\nPERF BUDGET PASSED");
}

main().catch((err) => {
  console.error("perf budget check error:", err);
  process.exit(1);
});
