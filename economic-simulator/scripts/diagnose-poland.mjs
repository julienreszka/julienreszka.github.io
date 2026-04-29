// Diagnose Poland's target-growth result across all periods.
// Finds which period/combination produces −31.4 pp at target=4% with adjustment on.
// Run with: node scripts/diagnose-poland.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gridSearch2D, EXCLUDED_NAMES, CONFLICT_NAMES, GDP_DIST_NAMES, EXT_FUNDED_NAMES } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const fallback = JSON.parse(readFileSync(join(root, 'fallback-data.json'), 'utf8'));

const TARGET = 4;
const PERIOD = 'structural';

// URL params: exres=1 exext=1 excon=1 exgdp=1 exse=0
const bucket = fallback[PERIOD];
const allRows = [...(bucket.developed ?? []), ...(bucket.developing ?? [])];
const dataPoints = allRows
  .filter(c => !EXCLUDED_NAMES.has(c.name))          // always excluded (conflict/aid)
  .filter(c => !c.resourceDependent)                   // exres=1
  .filter(c => !c.externallyFunded)                    // exext=1
  .filter(c => !CONFLICT_NAMES.has(c.name))            // excon=1
  .filter(c => !GDP_DIST_NAMES.has(c.name))            // exgdp=1
  // EXT_FUNDED_NAMES already covered by externallyFunded flag but apply anyway
  .filter(c => !EXT_FUNDED_NAMES.has(c.name))
  .map(c => ({ name: c.name, spending: c.spending, growth: c.growth }));

const poland = dataPoints.find(c => c.name === 'Poland');
console.log(`Period: ${PERIOD} (2005–2023), N=${dataPoints.length}`);
console.log(`Exclusions: resource-dependent, externally-funded, conflict, GDP-distorted`);
console.log(`Poland in dataset: ${poland ? 'yes' : 'NO'}\n`);
if (!poland) process.exit(1);

const cost = (fn) => {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n);
};
const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5],
  (b, a) => cost(x => b * Math.pow(Math.max(x, 0.1), -a)));
const predictFn = (x) => b0 * Math.pow(Math.max(x, 0.1), -alpha);

function invertModel(tg) {
  if (tg > predictFn(0.1)) return null;
  if (tg < predictFn(99)) return null;
  let lo = 0.1, hi = 99;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (predictFn(mid) > tg) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

console.log(`Power law: g = ${b0.toFixed(2)} × s^(−${alpha.toFixed(3)})`);
console.log(`Poland: spending=${poland.spending.toFixed(1)}%, growth=${poland.growth.toFixed(2)}%`);

for (const target of [3, 4, 5]) {
  const pred = predictFn(poland.spending);
  const residual = poland.growth - pred;
  const adjustedTarget = target - residual;
  const ts_adj = invertModel(adjustedTarget);
  const ts_raw = invertModel(target);
  const cut_adj = ts_adj !== null ? poland.spending - ts_adj : null;
  const cut_raw = ts_raw !== null ? poland.spending - ts_raw : null;
  const label_adj = poland.growth >= target ? 'no cut needed'
    : ts_adj === null ? 'impossible'
    : cut_adj <= 0 ? 'already there'
    : `−${cut_adj.toFixed(1)} pp → ${ts_adj.toFixed(1)}%`;
  const label_raw = poland.growth >= target ? 'no cut needed'
    : ts_raw === null ? 'impossible'
    : cut_raw <= 0 ? 'already there'
    : `−${cut_raw.toFixed(1)} pp → ${ts_raw.toFixed(1)}%`;
  console.log(`\nTarget ${target}%:`);
  console.log(`  predictFn(${poland.spending.toFixed(1)}) = ${pred.toFixed(3)}%,  residual = ${residual.toFixed(3)} pp`);
  console.log(`  Toggle OFF: ${label_raw}`);
  console.log(`  Toggle ON:  adjustedTarget=${adjustedTarget.toFixed(3)}%  →  ${label_adj}`);
}
