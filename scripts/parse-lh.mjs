import fs from 'node:fs';

const filePath = process.argv[2] || 'lh_mobile.json';

if (!fs.existsSync(filePath)) {
  console.error(`File ${filePath} does not exist.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`\n======================================================`);
console.log(`LIGHTHOUSE REPORT FOR: ${data.finalDisplayedUrl || data.finalUrl}`);
console.log(`Device: ${data.configSettings?.formFactor || 'unknown'}`);
console.log(`======================================================\n`);

const cats = data.categories;
console.log(`--- CATEGORY SCORES ---`);
for (const [id, cat] of Object.entries(cats)) {
  const score = Math.round(cat.score * 100);
  console.log(`  ${cat.title.padEnd(20)}: ${score} / 100`);
}

console.log(`\n--- AUDITS WITH DEDUCTIONS (Score < 100) ---`);
const audits = data.audits;
let failedCount = 0;

for (const [id, audit] of Object.entries(audits)) {
  // Only look at audits that count towards scoring or are failures
  if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
    failedCount++;
    const s = Math.round(audit.score * 100);
    console.log(`\n[${s}/100] ${id} - ${audit.title}`);
    if (audit.displayValue) console.log(`  Value: ${audit.displayValue}`);
    if (audit.explanation) console.log(`  Explanation: ${audit.explanation}`);
    if (audit.details?.items?.length) {
      console.log(`  Items (${audit.details.items.length}):`);
      for (const item of audit.details.items.slice(0, 10)) {
        if (typeof item === 'object') {
          const itemSummary = Object.entries(item)
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? (v?.url || v?.snippet || JSON.stringify(v)) : v}`)
            .join(' | ');
          console.log(`    - ${itemSummary.slice(0, 200)}`);
        } else {
          console.log(`    - ${item}`);
        }
      }
    }
  }
}

if (failedCount === 0) {
  console.log(`  None! All applicable audits scored 100%.`);
}
