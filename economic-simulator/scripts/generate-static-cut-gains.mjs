// Generates a static HTML cut-gains table and injects it into armey-curve.html
// between <!-- STATIC-CUT-GAINS-TABLE:START --> and <!-- STATIC-CUT-GAINS-TABLE:END -->.
// Uses fallback-data.json (structural period, 2005–2023) + auto-fitted power law.
// Run with: node scripts/generate-static-cut-gains.mjs [--period structural] [--cut 5]

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gridSearch2D, computeCutGains, EXCLUDED_NAMES } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i + 1] ? args[i + 1] : def; };
const PERIOD = getArg('--period', 'structural');
const CUT_PP = Number(getArg('--cut', 5));

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

// ── Compute cut gains ─────────────────────────────────────────────────────────
const rows = computeCutGains(dataPoints, predictFn, CUT_PP);
console.log(`Table rows: ${rows.length} countries with spending > ${CUT_PP}%`);

// ── Period label ──────────────────────────────────────────────────────────────
const PERIOD_LABELS = {
  recent: '2018–2023',
  decade: '2014–2023',
  long: '2010–2023',
  structural: '2005–2023',
  extended: '1995–2023',
};
const periodRange = PERIOD_LABELS[PERIOD] ?? PERIOD;

// ── Ratio note ────────────────────────────────────────────────────────────────
const ratio = Math.pow(50 / 20, alpha + 1).toFixed(1);
const ratioNote = `<p style="font-size:0.78em; color:rgba(255,255,255,0.45); margin:4px 0 0;">With α = ${alpha.toFixed(3)}: ratio of marginal gains at 20% vs 50% = (50/20)<sup>${(alpha + 1).toFixed(3)}</sup> ≈ <strong>${ratio}×</strong></p>`;

// ── Build table HTML ──────────────────────────────────────────────────────────
const thead = `<thead><tr style="color:rgba(255,255,255,0.5); font-size:0.82em;">
  <th style="text-align:left;padding:3px 8px" data-i18n="table.cutgains.country">Country</th>
  <th style="text-align:right;padding:3px 8px"><span data-i18n="table.cutgains.avg-spending">Avg. spending %</span><br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${periodRange}</span></th>
  <th style="text-align:right;padding:3px 8px"><span data-i18n="table.cutgains.avg-growth">Avg. growth %</span><br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${periodRange}</span></th>
  <th style="text-align:right;padding:3px 8px">Predicted gain from −${CUT_PP} pp cut</th>
</tr></thead>`;

const tbody = rows.map(r => {
  const gainStr = (r.gain >= 0 ? '+' : '') + r.gain.toFixed(2) + ' pp';
  const gainColor = r.gain >= 0.3 ? 'rgba(100,220,100,0.9)' : r.gain >= 0.1 ? 'rgba(220,200,80,0.9)' : 'rgba(255,255,255,0.55)';
  return `<tr style="font-size:0.83em;">
    <td style="padding:2px 8px">${r.name}</td>
    <td style="padding:2px 8px; text-align:right">${r.spending.toFixed(1)}%</td>
    <td style="padding:2px 8px; text-align:right">${r.growth.toFixed(2)}%</td>
    <td style="padding:2px 8px; text-align:right; color:${gainColor}; font-weight:600">${gainStr}</td>
  </tr>`;
}).join('\n');

const tableHTML = `<table style="width:100%;border-collapse:collapse;">${thead}<tbody>${tbody}</tbody></table>${ratioNote}`;

// ── Inject into armey-curve.html ──────────────────────────────────────────────
const htmlPath = join(root, 'armey-curve.html');
const html = readFileSync(htmlPath, 'utf8');

const START_MARKER = '<!-- STATIC-CUT-GAINS-TABLE:START -->';
const END_MARKER = '<!-- STATIC-CUT-GAINS-TABLE:END -->';

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

// Indent each line of the table to match surrounding HTML
const indentedTable = tableHTML
  .split('\n')
  .map(line => line.trim() ? indent + line : line)
  .join('\n');

const newHtml = `${before}\n${indentedTable}\n${indent}${after}`;

writeFileSync(htmlPath, newHtml, 'utf8');
console.log(`\nInjected static table into armey-curve.html (${rows.length} rows, period: ${periodRange})`);
