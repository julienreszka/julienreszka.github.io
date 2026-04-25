// Predicted growth gain from a 5-point spending cut — per country, auto-fitted power law.
// Mirrors the "Why High-Spending Countries Struggle to Cut" table in armey-curve.html.
// Run with: node scripts/cut-gains.mjs [--cut <pp>] [--alpha <α>]

import {
  DATE_START, DATE_END, MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, aic, gridSearch2D, computeCutGains,
} from '../model-math.mjs';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? +args[i + 1] : def;
};
const CUT_PP = getArg('--cut', 5);    // size of hypothetical cut in pp of GDP
const FIXED_ALPHA = getArg('--alpha', null); // override auto-fit exponent

// ── World Bank fetch ───────────────────────────────────────────────────────────
async function fetchWB(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  return ((await res.json())[1]) ?? [];
}
async function fetchMeta() {
  return ((await (await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`)).json())[1]) ?? [];
}

// ── Main ───────────────────────────────────────────────────────────────────────
console.log(`Fetching data (${DATE_START}–${DATE_END})…`);
const [meta, spRaw, grRaw] = await Promise.all([
  fetchMeta(),
  fetchWB('GC.XPN.TOTL.GD.ZS'),
  fetchWB('NY.GDP.MKTP.KD.ZG'),
]);

const actualCodes = new Set(meta.filter(c => c.region?.id !== 'NA').map(c => c.id));

const countries = {};
for (const item of spRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (!countries[code]) countries[code] = { name: item.country?.value ?? code, sp: [], gr: [] };
  countries[code].sp.push(item.value);
}
for (const item of grRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (countries[code]) countries[code].gr.push(item.value);
}

const dataPoints = Object.entries(countries)
  .filter(([code, d]) =>
    actualCodes.has(code) &&
    !EXCLUDED.has(code) && !CONFLICT.has(code) && !GDP_DIST.has(code) &&
    !EXT_FUNDED.has(code) && !RESOURCE_DEP.has(code) &&
    d.sp.length >= MIN_YEARS && d.gr.length >= MIN_YEARS
  )
  .map(([, d]) => ({ name: d.name, spending: avg(d.sp), growth: avg(d.gr) }));

console.log(`Clean dataset: ${dataPoints.length} countries\n`);

// ── Auto-fit power law ─────────────────────────────────────────────────────────
const cost = (fn) => {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n);
};

const [b0, alpha] = FIXED_ALPHA !== null
  ? [gridSearch2D([0.5, 2000], [FIXED_ALPHA, FIXED_ALPHA + 1e-9], (b0) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -FIXED_ALPHA)))[0], FIXED_ALPHA]
  : gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a)));

const predictFn = (x) => b0 * Math.pow(Math.max(x, 0.1), -alpha);

console.log(`Power law fit: g = ${b0.toFixed(2)} × s^(−${alpha.toFixed(3)})`);

// Ratio of marginal gains at 20% vs 50% of GDP
const ratio = Math.pow(50 / 20, alpha + 1);
console.log(`Marginal gain ratio (20% vs 50% spending): (50/20)^(α+1) = 2.5^${(alpha + 1).toFixed(3)} ≈ ${ratio.toFixed(2)}×\n`);

// ── Cut gains table ────────────────────────────────────────────────────────────
const rows = computeCutGains(dataPoints, predictFn, CUT_PP);

console.log(`Predicted growth gain from a −${CUT_PP} pp spending cut (sorted by spending ↓):\n`);
console.log(
  `${'Country'.padEnd(36)} ${'Spending %'.padStart(10)}  ${'Actual growth %'.padStart(15)}  ${'Gain (pp)'.padStart(10)}`
);
console.log('─'.repeat(77));
for (const r of rows) {
  const gainStr = (r.gain >= 0 ? '+' : '') + r.gain.toFixed(2);
  console.log(
    `${r.name.padEnd(36)} ${r.spending.toFixed(1).padStart(10)}  ${r.growth.toFixed(2).padStart(15)}  ${gainStr.padStart(10)}`
  );
}
console.log(`\n${rows.length} countries shown (spending > ${CUT_PP}%, standard exclusions applied).`);
