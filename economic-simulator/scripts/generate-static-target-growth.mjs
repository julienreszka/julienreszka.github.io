// Generates a static HTML "spending cut needed to reach target growth" table and
// injects it into armey-curve.html between:
//   <!-- STATIC-TARGET-GROWTH-TABLE:START --> and <!-- STATIC-TARGET-GROWTH-TABLE:END -->
//
// Uses fallback-data.json (structural period, 2005–2023) + auto-fitted power law.
// Run with: node scripts/generate-static-target-growth.mjs [--period structural] [--target 3]

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gridSearch2D, EXCLUDED_NAMES } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i + 1] ? args[i + 1] : def; };
const PERIOD = getArg('--period', 'structural');
const TARGET = Number(getArg('--target', 3));

// ── Load fallback data ────────────────────────────────────────────────────────
const fallback = JSON.parse(readFileSync(join(root, 'fallback-data.json'), 'utf8'));

if (!fallback[PERIOD]) {
  console.error(`Period "${PERIOD}" not found in fallback-data.json. Available: ${Object.keys(fallback).join(', ')}`);
  process.exit(1);
}

const bucket = fallback[PERIOD];
const allRows = [...(bucket.developed ?? []), ...(bucket.developing ?? [])];
const dataPoints = allRows
  .filter(c => !EXCLUDED_NAMES.has(c.name))
  .map(c => ({ name: c.name, spending: c.spending, growth: c.growth }));

console.log(`Loaded ${dataPoints.length} countries for period "${PERIOD}"`);

// ── Auto-fit power law ────────────────────────────────────────────────────────
const cost = (fn) => {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n);
};

const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5],
  (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a)));

const predictFn = (x) => b0 * Math.pow(Math.max(x, 0.1), -alpha);

console.log(`Power law fit: g = ${b0.toFixed(2)} × s^(−${alpha.toFixed(3)})`);

// ── Model inversion via binary search ────────────────────────────────────────
function invertModel(targetGrowth) {
  const maxGrowth = predictFn(0.1);
  if (targetGrowth > maxGrowth) return null;
  const minGrowth = predictFn(99);
  if (targetGrowth < minGrowth) return null;
  let lo = 0.1, hi = 99;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (predictFn(mid) > targetGrowth) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const globalTargetSpending = invertModel(TARGET);
if (globalTargetSpending === null) {
  console.error(`Model cannot predict ${TARGET}% growth at any spending level. Try a lower target.`);
  process.exit(1);
}
console.log(`Model-implied target spending for ${TARGET}% growth: ${globalTargetSpending.toFixed(1)}%`);

// ── Period label ──────────────────────────────────────────────────────────────
const PERIOD_LABELS = {
  recent: '2018–2023',
  decade: '2014–2023',
  long: '2010–2023',
  structural: '2005–2023',
  extended: '1995–2023',
};
const periodRange = PERIOD_LABELS[PERIOD] ?? PERIOD;

// ── Compute rows ──────────────────────────────────────────────────────────────
const rows = dataPoints
  .filter(d => d.spending > 1)
  .map(d => {
    const requiredCut = d.spending - globalTargetSpending;
    return { name: d.name, spending: d.spending, growth: d.growth, requiredCut, targetSpending: globalTargetSpending };
  })
  .sort((a, b) => b.spending - a.spending);

console.log(`Table rows: ${rows.length} countries`);

// ── Build table HTML ──────────────────────────────────────────────────────────
const thead = `<thead><tr class="table-header-muted" style="font-size:0.82em;">
  <th style="text-align:left;padding:3px 8px">Country</th>
  <th style="text-align:right;padding:3px 8px;white-space:nowrap">Avg. spending %<br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${periodRange}</span></th>
  <th style="text-align:right;padding:3px 8px;white-space:nowrap">Avg. growth %<br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${periodRange}</span></th>
  <th style="text-align:right;padding:3px 8px;white-space:nowrap">Required cut to reach ${TARGET}%</th>
  <th style="text-align:right;padding:3px 8px;white-space:nowrap">Target spending %</th>
</tr></thead>`;

const tbody = rows.map(r => {
  let cutStr, cutColor, targetStr;
  if (r.requiredCut <= 0 || r.growth >= TARGET) {
    cutStr = 'already there'; cutColor = 'rgba(100,220,100,0.9)'; targetStr = r.targetSpending.toFixed(1) + '%';
  } else {
    const color = r.requiredCut >= 20 ? 'rgba(255,100,80,0.9)'
      : r.requiredCut >= 10 ? 'rgba(255,165,80,0.9)'
        : r.requiredCut >= 5 ? 'rgba(220,200,80,0.9)'
          : 'rgba(100,220,100,0.9)';
    cutStr = '\u2212' + r.requiredCut.toFixed(1) + ' pp';
    cutColor = color;
    targetStr = r.targetSpending.toFixed(1) + '%';
  }
  return `<tr style="font-size:0.83em;">
    <td style="padding:2px 8px">${r.name}</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap">${r.spending.toFixed(1)}%</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap">${r.growth.toFixed(2)}%</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap; color:${cutColor}; font-weight:600">${cutStr}</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap; opacity:0.7">${targetStr}</td>
  </tr>`;
}).join('\n');

const footNote = `<p style="font-size:0.78em; color:rgba(255,255,255,0.45); margin:4px 0 0;">Model-implied target spending: <strong>${globalTargetSpending.toFixed(1)}%</strong> of GDP (power law, ${periodRange})</p>`;

const tableHTML = `<table style="width:100%;border-collapse:collapse;">${thead}<tbody>${tbody}</tbody></table>${footNote}`;

// ── Inject into armey-curve.html ──────────────────────────────────────────────
const htmlPath = join(root, 'armey-curve.html');
const html = readFileSync(htmlPath, 'utf8');

const START_MARKER = '<!-- STATIC-TARGET-GROWTH-TABLE:START -->';
const END_MARKER = '<!-- STATIC-TARGET-GROWTH-TABLE:END -->';

const startIdx = html.indexOf(START_MARKER);
const endIdx = html.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found in armey-curve.html');
  process.exit(1);
}

// Preserve indentation of the start marker line
const lineStart = html.lastIndexOf('\n', startIdx) + 1;
const indent = html.slice(lineStart, startIdx);

const before = html.slice(0, startIdx + START_MARKER.length);
const after = html.slice(endIdx);

const indentedTable = tableHTML
  .split('\n')
  .map(line => line.trim() ? indent + line : line)
  .join('\n');

const newHtml = `${before}\n${indentedTable}\n${indent}${after}`;

writeFileSync(htmlPath, newHtml, 'utf8');
console.log(`\nInjected static target-growth table into armey-curve.html`);
console.log(`  Target: ${TARGET}% growth → ${globalTargetSpending.toFixed(1)}% spending`);
console.log(`  Rows: ${rows.length} countries, period: ${periodRange}`);
