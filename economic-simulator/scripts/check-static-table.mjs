#!/usr/bin/env node
// scripts/check-static-table.mjs
// Verifies that the static model-ranking table in armey-curve.html matches
// the values computed from the cached World Bank data.
//
// Usage:  node scripts/check-static-table.mjs
// Exit 0 = all values match within tolerance.
// Exit 1 = mismatch found (prints diffs).

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  DATE_START, DATE_END, MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, r2, aic, gridSearch2D,
} from "../model-math.mjs";

const __dir  = dirname(fileURLToPath(import.meta.url));
const root   = resolve(__dir, "..");
const cache  = resolve(__dir, "cache");

// ── 1. Load cached World Bank data (offline — no network call) ────────────────
function loadCache(indicator) {
  return JSON.parse(readFileSync(resolve(cache, `wb_${indicator}.json`), "utf8"));
}

const spRaw  = loadCache("GC.XPN.TOTL.GD.ZS");   // gov spending % GDP
const grRaw  = loadCache("NY.GDP.MKTP.KD.ZG");    // GDP growth %
const gdpPcRaw = loadCache("NY.GDP.PCAP.KD");     // GDP per capita (for meta)

// World Bank regional / income-group aggregate codes.
// These appear in the indicator downloads but are not actual countries.
// List derived by cross-referencing the spending cache against the WB
// metadata endpoint (region.id === "NA" → aggregate).
const WB_AGGREGATES = new Set([
  "AFE","AFW","ARB","CEB","CSS","EAP","EAR","EAS","ECA","ECS","EMU","EUU",
  "FCS","HIC","HPC","IBD","IBT","IDA","IDB","IDX","LAC","LCN","LDC","LIC",
  "LMC","LMY","LTE","MEA","MIC","MNA","NAC","OED","OSS","PRE","PSS","PST",
  "SAS","SSA","SSF","SST","TEC","TEA","TLA","TMN","TSA","TSS","UMC","WLD",
]);

// Derive the set of actual country codes from GDP per-capita data,
// excluding known regional/income-group aggregates.
const actualCodes = new Set(
  gdpPcRaw
    .filter(r => r.value !== null && r.countryiso3code && r.countryiso3code.length === 3
                 && !WB_AGGREGATES.has(r.countryiso3code))
    .map(r => r.countryiso3code)
);

// ── 2. Build per-country averages ─────────────────────────────────────────────
const countries = {};
for (const item of spRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (+item.date < DATE_START || +item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (!countries[code]) countries[code] = { name: item.country?.value ?? code, sp: [], gr: [] };
  countries[code].sp.push(item.value);
}
for (const item of grRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (+item.date < DATE_START || +item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (countries[code]) countries[code].gr.push(item.value);
}

// ── 3. Apply standard exclusions (mirrors compare-curves.mjs) ─────────────────
const dataPoints = Object.entries(countries)
  .filter(([code, d]) =>
    actualCodes.has(code) &&
    !EXCLUDED.has(code) && !CONFLICT.has(code) && !GDP_DIST.has(code) &&
    !EXT_FUNDED.has(code) && !RESOURCE_DEP.has(code) &&
    d.sp.length >= MIN_YEARS && d.gr.length >= MIN_YEARS
  )
  .map(([, d]) => ({ spending: avg(d.sp), growth: avg(d.gr) }));

// ── 4. Fit all 7 models ───────────────────────────────────────────────────────
const cost = fn =>
  dataPoints.length *
  Math.log(dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0) / dataPoints.length);

const actuals = dataPoints.map(c => c.growth);
const N = dataPoints.length;

function metrics(fn, k) {
  const preds = dataPoints.map(c => fn(c.spending));
  return { r2: r2(actuals, preds), aic: aic(actuals, preds, k), n: N };
}

function coverage(fn, k) {
  const preds = dataPoints.map(c => fn(c.spending));
  const resid = actuals.map((a, i) => a - preds[i]);
  const sse = resid.reduce((s, v) => s + v * v, 0);
  const se = Math.sqrt(sse / Math.max(N - k, 1));
  return resid.filter(r => Math.abs(r) <= se).length / N;
}

const [plB0, plAlpha] = gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a)));
const plFn = x => plB0 * Math.pow(Math.max(x, 0.1), -plAlpha);

const [invB, invA] = gridSearch2D([0.1, 5000], [-10, 10], (b, a) => cost(x => a + b / Math.max(x, 0.1)));
const invFn = x => invA + invB / Math.max(x, 0.1);

const [llB0, llAlpha] = gridSearch2D([0.1, 50], [0.01, 20], (b0, a) => cost(x => b0 - a * Math.log(x + 1)));
const llFn = x => llB0 - llAlpha * Math.log(x + 1);

const [expB0, expL] = gridSearch2D([0.5, 2000], [0.001, 1], (b0, l) => cost(x => b0 * Math.exp(-l * x)));
const expFn = x => expB0 * Math.exp(-expL * x);

const [linB0, linSlope] = gridSearch2D([0.1, 50], [-3, 0], (b0, s) => cost(x => b0 + s * x));
const linFn = x => linB0 + linSlope * x;

// Free quadratic via OLS closed form
{
  const dp = dataPoints;
  const n = dp.length;
  const s1 = dp.reduce((a, p) => a + p.spending, 0), s2 = dp.reduce((a, p) => a + p.spending ** 2, 0);
  const s3 = dp.reduce((a, p) => a + p.spending ** 3, 0), s4 = dp.reduce((a, p) => a + p.spending ** 4, 0);
  const g0 = dp.reduce((a, p) => a + p.growth, 0), g1 = dp.reduce((a, p) => a + p.spending * p.growth, 0), g2 = dp.reduce((a, p) => a + p.spending ** 2 * p.growth, 0);
  const A = [[n, s1, s2], [s1, s2, s3], [s2, s3, s4]], b = [g0, g1, g2];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const f = A[j][i] / A[i][i]; for (let k2 = 0; k2 < 3; k2++) A[j][k2] -= f * A[i][k2]; b[j] -= f * b[i]; }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) { x[i] = (b[i] - A[i].slice(i + 1).reduce((a, v, k2) => a + v * x[i + 1 + k2], 0)) / A[i][i]; }
  var [fqA, fqB1, fqB2] = x;
}
const fqFn = s => fqA + fqB1 * s + fqB2 * s * s;

// Constrained quadratic (b2 < 0) — grid search
{
  const [cqA, cqB1] = gridSearch2D([0.1, 50], [-5, 5], (a, b1) => {
    let best = Infinity;
    for (let k = 0; k < 60; k++) {
      const b2 = -0.0001 - (0.2 - 0.0001) * k / 60;
      const c = cost(x => a + b1 * x + b2 * x * x);
      if (c < best) best = c;
    }
    return best;
  }, 60);
  let bestB2 = -0.001, bestCost = Infinity;
  for (let k = 0; k < 200; k++) {
    const b2 = -0.0001 - (0.2 - 0.0001) * k / 200;
    const c = cost(x => cqA + cqB1 * x + b2 * x * x);
    if (c < bestCost) { bestCost = c; bestB2 = b2; }
  }
  var [cqAf, cqB1f, cqB2f] = [cqA, cqB1, bestB2];
}
const cqFn = s => cqAf + cqB1f * s + cqB2f * s * s;

const computed = {
  "Power Law":     { ...metrics(plFn, 2),  cov: coverage(plFn, 2)  },
  "Log-Linear":    { ...metrics(llFn, 2),  cov: coverage(llFn, 2)  },
  "Free Quadratic":{ ...metrics(fqFn, 3),  cov: coverage(fqFn, 3)  },
  "Inverse":       { ...metrics(invFn, 2), cov: coverage(invFn, 2) },
  "Linear":        { ...metrics(linFn, 2), cov: coverage(linFn, 2) },
  "Quadratic":     { ...metrics(cqFn, 3),  cov: coverage(cqFn, 3)  },
  "Exponential":   { ...metrics(expFn, 2), cov: coverage(expFn, 2) },
};

// ── 5. Parse static table from armey-curve.html ───────────────────────────────
const html = readFileSync(resolve(root, "armey-curve.html"), "utf8");

// Locate the static (non-template-literal) model ranking table.
// It is the first <tbody> inside #model-ranking that contains literal <td> values.
const MODEL_NAME_MAP = {
  "Power Law ✓":   "Power Law",
  "Log-Linear":    "Log-Linear",
  "Free Quadratic":"Free Quadratic",
  "Inverse":       "Inverse",
  "Linear":        "Linear",
  "Quadratic":     "Quadratic",
  "Exponential":   "Exponential",
};

const staticRows = {};
const trRe = /<tr>\s*<td>\d+<\/td>\s*<td>([^<]+)<\/td>\s*<td>([\d.]+)<\/td>\s*<td>\[([^\]]+)\]<\/td>\s*<td>([\d.]+)<\/td>\s*<td>[^<]+<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)%<\/td>/g;
let m;
while ((m = trRe.exec(html)) !== null) {
  const rawName = m[1].trim();
  const name = MODEL_NAME_MAP[rawName];
  if (!name) continue;
  staticRows[name] = {
    r2:  parseFloat(m[2]),
    aic: parseFloat(m[4]),
    n:   parseInt(m[5]),
    cov: parseInt(m[6]) / 100,
  };
}

// ── 6. Assert each value matches within tolerance ─────────────────────────────
const R2_TOL  = 0.001;   // ±0.001 on R² (displayed to 4dp)
const AIC_TOL = 0.1;     // ±0.10 on AIC (displayed to 2dp)
const N_TOL   = 0;       // exact
const COV_TOL = 0.03;    // ±3% (displayed as integer %; grid-search rounding adds ~2%)

let failures = 0;

function check(model, field, actual, expected, tol) {
  const diff = Math.abs(actual - expected);
  if (diff > tol) {
    console.error(`✗  ${model} — ${field}: static=${expected}, computed=${actual.toFixed(4)}, diff=${diff.toFixed(4)} > tol=${tol}`);
    failures++;
  }
}

if (Object.keys(staticRows).length === 0) {
  console.error("ERROR: Could not parse any rows from the static table — regex mismatch.");
  process.exit(1);
}

for (const [name, stat] of Object.entries(staticRows)) {
  const comp = computed[name];
  if (!comp) { console.error(`✗  '${name}' found in HTML but not computed`); failures++; continue; }
  check(name, "R²",       comp.r2,  stat.r2,  R2_TOL);
  check(name, "AIC",      comp.aic, stat.aic, AIC_TOL);
  check(name, "N",        comp.n,   stat.n,   N_TOL);
  check(name, "Coverage", comp.cov, stat.cov, COV_TOL);
}

if (failures === 0) {
  console.log(`✓  Static table matches computed values for all ${Object.keys(staticRows).length} models (N=${N}).`);
  process.exit(0);
} else {
  console.error(`\n${failures} assertion(s) failed — update the static table or re-run the model fitting.`);
  process.exit(1);
}
