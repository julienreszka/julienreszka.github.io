// Restore old World Bank fallback-data.json (pre-IMF commit) and merge in
// the IMF `latestSpending` / `latestYear` fields per country so the Freeze
// Scenario keeps using fresh IMF WEO numbers while every other view (R²,
// scatter, cut-gains, target-growth, etc.) uses the original WB data that
// produced R² ≈ 0.42.
//
// Run: node scripts/restore-wb-merge-imf-latest.mjs

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const OUT = join(root, 'fallback-data.json');

// Commit just before the IMF swap.
const PRE_IMF = '58199ae~1';

const oldRaw = execSync(`git show ${PRE_IMF}:economic-simulator/fallback-data.json`, {
  cwd: join(root, '..'),
  maxBuffer: 1024 * 1024 * 64,
}).toString();
const oldData = JSON.parse(oldRaw);

// Current file = IMF data with latestSpending/latestYear
const imfData = JSON.parse(readFileSync(OUT, 'utf8'));

// Build a name -> { latestSpending, latestYear } lookup from IMF data,
// preferring the structural bucket if the country appears in multiple periods.
const latestByName = new Map();
const periodPriority = ['structural', 'long', 'decade', 'recent'];
for (const period of periodPriority) {
  const bucket = imfData[period];
  if (!bucket) continue;
  for (const group of Object.values(bucket)) {
    if (!Array.isArray(group)) continue;
    for (const c of group) {
      if (latestByName.has(c.name)) continue;
      if (c.latestSpending != null) {
        latestByName.set(c.name, {
          latestSpending: c.latestSpending,
          latestYear: c.latestYear ?? null,
        });
      }
    }
  }
}

// Walk the old WB data and attach latestSpending/latestYear by name.
let attached = 0;
let total = 0;
for (const period of Object.keys(oldData)) {
  for (const group of Object.values(oldData[period])) {
    if (!Array.isArray(group)) continue;
    for (const c of group) {
      total++;
      const hit = latestByName.get(c.name);
      if (hit) {
        c.latestSpending = hit.latestSpending;
        c.latestYear = hit.latestYear;
        attached++;
      }
    }
  }
}

writeFileSync(OUT, JSON.stringify(oldData, null, 2));
console.log(`Restored WB fallback-data.json (${total} country-period rows).`);
console.log(`Merged IMF latestSpending/latestYear into ${attached} rows.`);
console.log(`Unmatched (no IMF entry): ${total - attached}`);
