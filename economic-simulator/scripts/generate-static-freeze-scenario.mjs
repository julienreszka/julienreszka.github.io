// Generates a static HTML "freeze scenario" block and injects it into
// armey-curve.html between:
//   <!-- STATIC-FREEZE-SCENARIO:START --> and <!-- STATIC-FREEZE-SCENARIO:END -->
//
// Computes how many years it takes to drive spending/GDP from its current level
// down to a target, given fixed real GDP growth (g) and real spending growth (s).
// Years = ln(target/current) / ln((1+s)/(1+g)).
//
// Uses fallback-data.json. Default scenario: g=2%, s=0%, target=30%, headline country=France.
// Run with: node scripts/generate-static-freeze-scenario.mjs
//   [--period structural] [--gdp 2] [--spend 0] [--target 30] [--country France]

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { EXCLUDED_NAMES } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i + 1] ? args[i + 1] : def; };
const PERIOD = getArg('--period', 'structural');
const GDP_G = Number(getArg('--gdp', 2)) / 100;
const SPEND_G = Number(getArg('--spend', 0)) / 100;
const TARGET = Number(getArg('--target', 30));
const HEADLINE_COUNTRY = getArg('--country', 'France');

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
  .filter(c => c.spending > 1)
  .map(c => ({ name: c.name, spending: c.spending, growth: c.growth }))
  .sort((a, b) => b.spending - a.spending);

console.log(`Loaded ${dataPoints.length} countries for period "${PERIOD}"`);

// ── Period label ──────────────────────────────────────────────────────────────
const PERIOD_LABELS = {
  recent: '2018–2023',
  decade: '2014–2023',
  long: '2010–2023',
  structural: '2005–2023',
  extended: '1995–2023',
};
const periodRange = PERIOD_LABELS[PERIOD] ?? PERIOD;

// ── Math ──────────────────────────────────────────────────────────────────────
const ratio = (1 + SPEND_G) / (1 + GDP_G);
function yearsTo(current, target) {
  if (current <= target) return 0;
  if (ratio >= 1) return Infinity;
  return Math.log(target / current) / Math.log(ratio);
}

// ── Headline ──────────────────────────────────────────────────────────────────
const sel = dataPoints.find(d => d.name === HEADLINE_COUNTRY) ?? dataPoints[0];
let headlineHtml = '';
if (sel) {
  const yrs = yearsTo(sel.spending, TARGET);
  const reach10 = sel.spending * Math.pow(ratio, 10);
  const reach20 = sel.spending * Math.pow(ratio, 20);
  let yrStr;
  if (yrs === 0) yrStr = '<span style="color:rgba(100,220,100,0.9)" data-i18n="js.freeze.already-at-target">already at or below target</span>';
  else if (!isFinite(yrs)) yrStr = '<span style="color:rgba(255,140,80,0.9)" data-i18n="js.freeze.never">never \u2014 spending grows \u2265 GDP</span>';
  else yrStr = '<strong>' + yrs.toFixed(1) + ' <span data-i18n="js.freeze.years">years</span></strong>';
  headlineHtml = `<p style="font-size:0.95em; margin:0 0 10px;">
    <strong>${sel.name}</strong>: ${sel.spending.toFixed(1)}% \u2192 ${TARGET.toFixed(1)}% <span data-i18n="js.freeze.in">in</span> ${yrStr}.
    <span style="opacity:0.75; font-size:0.92em;"><span data-i18n="js.freeze.after-10-years">After 10 years:</span> ${reach10.toFixed(1)}%. <span data-i18n="js.freeze.after-20-years">After 20 years:</span> ${reach20.toFixed(1)}%.</span>
  </p>`;
}

// ── Table rows ────────────────────────────────────────────────────────────────
const above = dataPoints.filter(d => d.spending > TARGET).slice(0, 30);
const tbody = above.map(d => {
  const yrs = yearsTo(d.spending, TARGET);
  const after10 = d.spending * Math.pow(ratio, 10);
  let yrStr, color;
  if (!isFinite(yrs)) { yrStr = '\u221E'; color = 'rgba(255,100,80,0.9)'; }
  else if (yrs <= 5) { yrStr = yrs.toFixed(1); color = 'rgba(100,220,100,0.9)'; }
  else if (yrs <= 10) { yrStr = yrs.toFixed(1); color = 'rgba(180,220,100,0.9)'; }
  else if (yrs <= 20) { yrStr = yrs.toFixed(1); color = 'rgba(255,200,80,0.9)'; }
  else { yrStr = yrs.toFixed(1); color = 'rgba(255,140,80,0.9)'; }
  return `<tr style="font-size:0.83em;">
    <td style="padding:2px 8px">${d.name}</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap">${d.spending.toFixed(1)}%</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap; color:${color}; font-weight:600">${yrStr}</td>
    <td style="padding:2px 8px; text-align:right; white-space:nowrap; opacity:0.7">${after10.toFixed(1)}%</td>
  </tr>`;
}).join('\n');

const tableHtml = above.length === 0
  ? '<p style="font-size:0.85em; color:rgba(255,255,255,0.5); font-style:italic;">No countries above target spending.</p>'
  : `<table style="width:100%;border-collapse:collapse;">
  <thead><tr class="table-header-muted" style="font-size:0.82em;">
    <th style="text-align:left;padding:3px 8px" data-i18n="table.cutgains.country">Country</th>
    <th style="text-align:right;padding:3px 8px;white-space:nowrap"><span data-i18n="table.col.avg-spending">Avg. spending %</span><br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${periodRange}</span></th>
    <th style="text-align:right;padding:3px 8px;white-space:nowrap" data-i18n="table.col.freeze-years-to-static">Years to ${TARGET.toFixed(1)}%</th>
    <th style="text-align:right;padding:3px 8px;white-space:nowrap" data-i18n="table.col.freeze-after-10">After 10 years</th>
  </tr></thead>
  <tbody>${tbody}</tbody>
</table>`;

const blockHtml = `${headlineHtml}${tableHtml}`;

// ── Inject into armey-curve.html ──────────────────────────────────────────────
const htmlPath = join(root, 'armey-curve.html');
const html = readFileSync(htmlPath, 'utf8');

const START_MARKER = '<!-- STATIC-FREEZE-SCENARIO:START -->';
const END_MARKER = '<!-- STATIC-FREEZE-SCENARIO:END -->';

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

const indentedBlock = blockHtml
  .split('\n')
  .map(line => line.trim() ? indent + line : line)
  .join('\n');

const newHtml = `${before}\n${indentedBlock}\n${indent}${after}`;
writeFileSync(htmlPath, newHtml, 'utf8');

console.log(`\nInjected static freeze-scenario into armey-curve.html`);
console.log(`  Scenario: GDP +${(GDP_G * 100).toFixed(1)}%, spending +${(SPEND_G * 100).toFixed(1)}%, target ${TARGET}%`);
console.log(`  Period: ${periodRange} \u2014 headline country: ${sel?.name ?? 'n/a'}`);
console.log(`  Rows: ${above.length} countries above target`);
