const url = process.argv[2] || 'https://agraskbagheltourandtravels.com';
const strategy = process.argv[3] || 'mobile';

async function check() {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  console.log(`Fetching PSI for ${url} (${strategy})...`);
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const errText = await res.text();
    console.error(`PSI API failed (${res.status}): ${errText}`);
    process.exit(1);
  }
  const data = await res.json();
  const cats = data.lighthouseResult.categories;
  console.log(`\n=== PSI RESULTS: ${strategy.toUpperCase()} ===`);
  for (const [k, v] of Object.entries(cats)) {
    console.log(`  ${k.padEnd(16)}: ${Math.round(v.score * 100)} / 100`);
  }

  console.log(`\nAudits not at 100% (score < 1):`);
  const audits = data.lighthouseResult.audits;
  for (const [id, audit] of Object.entries(audits)) {
    if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
      console.log(`\n- [${Math.round(audit.score * 100)}] ${id}: ${audit.title}`);
      if (audit.displayValue) console.log(`    Value: ${audit.displayValue}`);
      if (audit.explanation) console.log(`    Explanation: ${audit.explanation}`);
      if (audit.details && audit.details.items && audit.details.items.length) {
        console.log(`    Items (${audit.details.items.length}):`);
        for (const item of audit.details.items.slice(0, 5)) {
          console.log(`      *`, JSON.stringify(item));
        }
      }
    }
  }
}

check().catch(console.error);
