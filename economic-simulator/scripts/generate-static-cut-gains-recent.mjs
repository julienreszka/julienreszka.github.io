// Generates a "most recent data" cut-gains table using:
//   - World Bank GC.XPN.TOTL.GD.ZS for spending (latest available, typically 2022-2024)
//   - IMF WEO NGDP_RPCH for GDP growth (2022-2024 actuals)
// Injects the table into armey-curve.html between the STATIC-CUT-GAINS-TABLE markers.
// Run with: node scripts/generate-static-cut-gains-recent.mjs [--cut 5] [--start 2022] [--end 2024]

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, gridSearch2D, computeCutGains,
} from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i + 1] ? args[i + 1] : def; };
const CUT_PP = Number(getArg('--cut', 5));
const YR_START = getArg('--start', '2022');
const YR_END = getArg('--end', '2024');
const MIN_PTS = 1; // at least 1 year of each within the window

const PERIOD_LABEL = `${YR_START}–${YR_END} (IMF/WB)`;
console.log(`Fetching data for ${YR_START}–${YR_END}…`);

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchWB(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${YR_START}:${YR_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  return (await res.json())[1] ?? [];
}

async function fetchIMF_growth() {
  // IMF datamapper v2 returns { values: { NGDP_RPCH: { ISO3: { "2022": val, ... } } } }
  const url = 'https://www.imf.org/external/datamapper/api/v2/NGDP_RPCH';
  const d = await (await fetch(url)).json();
  return d.values?.NGDP_RPCH ?? {};
}

async function fetchWB_meta() {
  const res = await fetch('https://api.worldbank.org/v2/country?format=json&per_page=300');
  return ((await res.json())[1]) ?? [];
}

// ── Fetch all data ────────────────────────────────────────────────────────────
const [meta, spRaw, imfGrowth] = await Promise.all([
  fetchWB_meta(),
  fetchWB('GC.XPN.TOTL.GD.ZS'),
  fetchIMF_growth(),
]);

// Build set of actual (non-aggregate) country codes from WB metadata
const actualCodes = new Set(meta.filter(c => c.region?.id !== 'NA').map(c => c.id));

// ── Build spending data from WB ───────────────────────────────────────────────
const wbSpending = {}; // ISO3 → { name, sp[] }
for (const item of spRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < YR_START || item.date > YR_END) continue;
  const code = item.countryiso3code;
  if (!wbSpending[code]) wbSpending[code] = { name: item.country?.value ?? code, sp: [] };
  wbSpending[code].sp.push(item.value);
}

// ── Build growth data from IMF ────────────────────────────────────────────────
// IMF uses ISO3 codes; filter to actuals only (projection-year is 2026, so 2024 is actual)
// "projection-year" from indicators endpoint = first projected year
// We only want up to YR_END and exclude future projections
const imfGrowthFiltered = {}; // ISO3 → number[]
for (const [code, yearMap] of Object.entries(imfGrowth)) {
  if (!yearMap || typeof yearMap !== 'object') continue;
  const vals = Object.entries(yearMap)
    .filter(([y]) => y >= YR_START && y <= YR_END)
    .map(([, v]) => v)
    .filter(v => v != null && isFinite(v));
  if (vals.length >= MIN_PTS) imfGrowthFiltered[code] = vals;
}

// ── Merge: require both spending and growth ───────────────────────────────────
const exclusionSets = [EXCLUDED, CONFLICT, GDP_DIST, EXT_FUNDED, RESOURCE_DEP];

const dataPoints = Object.entries(wbSpending)
  .filter(([code, d]) =>
    actualCodes.has(code) &&
    exclusionSets.every(s => !s.has(code)) &&
    d.sp.length >= MIN_PTS &&
    imfGrowthFiltered[code]?.length >= MIN_PTS
  )
  .map(([code, d]) => ({
    name: d.name,
    spending: avg(d.sp),
    growth: avg(imfGrowthFiltered[code]),
  }));

console.log(`Clean dataset: ${dataPoints.length} countries (WB spending + IMF growth, ${PERIOD_LABEL})`);

if (dataPoints.length < 20) {
  console.error('Too few countries — aborting. Check network connectivity.');
  process.exit(1);
}

// ── Auto-fit power law ────────────────────────────────────────────────────────
const cost = (fn) => {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n);
};

const [b0, alpha] = gridSearch2D(
  [0.5, 2000], [0.1, 5],
  (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a))
);
const predictFn = (x) => b0 * Math.pow(Math.max(x, 0.1), -alpha);
console.log(`Power law fit: g = ${b0.toFixed(2)} × s^(−${alpha.toFixed(3)})`);

// ── Cut gains ────────────────────────────────────────────────────────────────
const rows = computeCutGains(dataPoints, predictFn, CUT_PP);
console.log(`Table rows: ${rows.length} countries with spending > ${CUT_PP}%`);

// ── Ratio note ───────────────────────────────────────────────────────────────
const ratio = Math.pow(50 / 20, alpha + 1).toFixed(1);
const ratioNote = `<p style="font-size:0.78em; color:rgba(255,255,255,0.45); margin:4px 0 0;">With α = ${alpha.toFixed(3)}: ratio of marginal gains at 20% vs 50% = (50/20)<sup>${(alpha + 1).toFixed(3)}</sup> ≈ <strong>${ratio}×</strong>. Data: World Bank spending (latest available), IMF WEO growth (${YR_START}–${YR_END} actuals).</p>`;

// ── Build table HTML ─────────────────────────────────────────────────────────
const thead = `<thead><tr style="color:rgba(255,255,255,0.5); font-size:0.82em;">
  <th style="text-align:left;padding:3px 8px">Country</th>
  <th style="text-align:right;padding:3px 8px">Avg. spending %<br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${PERIOD_LABEL}</span></th>
  <th style="text-align:right;padding:3px 8px">Avg. growth %<br><span style="font-weight:normal;font-size:0.9em;opacity:0.7">${PERIOD_LABEL}</span></th>
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

// ── Inject into armey-curve.html ─────────────────────────────────────────────
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

const lineStart = html.lastIndexOf('\n', startIdx) + 1;
const indent = html.slice(lineStart, startIdx);

const before = html.slice(0, startIdx + START_MARKER.length);
const after = html.slice(endIdx);

const indentedTable = tableHTML
  .split('\n')
  .map(line => line.trim() ? indent + line : line)
  .join('\n');

writeFileSync(htmlPath, `${before}\n${indentedTable}\n${indent}${after}`, 'utf8');
console.log(`\nInjected static table into armey-curve.html (${rows.length} rows, ${PERIOD_LABEL})`);
