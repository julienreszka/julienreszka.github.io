/**
 * test-piq.mjs
 *
 * Tests the marginal R² contribution of the PIQ (Public Investment Quality)
 * proxy — derived from IEG World Bank Project Performance Ratings — when added
 * as an 8th control in the Stage 2 residual regression.
 *
 * Builds on the same dataset as ceiling-r2.mjs (uses its cache) and reports:
 *   - PIQ overlap with the WB Stage 2 sample
 *   - R² of the 7-variable baseline model on the PIQ subset
 *   - R² after adding PIQ as an 8th control (marginal R²)
 *   - Distribution of PIQ scores by income group
 *
 * Usage: node /path/to/economic-simulator/scripts/test-piq.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  DATE_START, DATE_END, MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, r2,
} from "../model-math.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dir, "cache");

// ─── Gauss-Jordan OLS (k predictors) ────────────────────────────────────────
function olsK(xss, ys) {
  const n = ys.length;
  const k = xss.length;
  const my = avg(ys);
  const mxs = xss.map(avg);
  // Augmented matrix [k x k+1]
  const A = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k + 1 }, (__, j) => {
      if (j < k) {
        let s = 0;
        for (let r = 0; r < n; r++) s += (xss[i][r] - mxs[i]) * (xss[j][r] - mxs[j]);
        return s;
      } else {
        let s = 0;
        for (let r = 0; r < n; r++) s += (xss[i][r] - mxs[i]) * (ys[r] - my);
        return s;
      }
    })
  );
  // Gauss-Jordan elimination with partial pivoting
  for (let col = 0; col < k; col++) {
    let maxRow = col;
    for (let row = col + 1; row < k; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    if (Math.abs(A[col][col]) < 1e-14) continue;
    const pivot = A[col][col];
    for (let j = col; j <= k; j++) A[col][j] /= pivot;
    for (let row = 0; row < k; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = col; j <= k; j++) A[row][j] -= factor * A[col][j];
    }
  }
  const bs = A.map(row => row[k]);
  const intercept = my - bs.reduce((s, b, i) => s + b * mxs[i], 0);
  const fitted = ys.map((_, r) => intercept + bs.reduce((s, b, i) => s + b * xss[i][r], 0));
  return { bs, intercept, fitted, r2: r2(ys, fitted) };
}

// ─── Load helpers (same as ceiling-r2.mjs) ───────────────────────────────────
function cacheKey(name) { return join(CACHE_DIR, `${name}.json`); }

function loadWB(indicator) {
  // Try both prefixes (ceiling-r2.mjs uses wb_, armey-curve.html uses WB_)
  for (const prefix of ["wb_", "WB_"]) {
    const p = cacheKey(`${prefix}${indicator}`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error(`Missing cache for ${indicator} — run ceiling-r2.mjs first`);
  process.exit(1);
}

function loadMeta() {
  for (const name of ["wb_meta", "WB_meta"]) {
    const p = cacheKey(name);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error("Missing country metadata — run ceiling-r2.mjs first");
  process.exit(1);
}

function periodAvg(raw) {
  const by = {};
  for (const item of raw) {
    if (item.value === null) continue;
    const y = +item.date;
    if (y < DATE_START || y > DATE_END) continue;
    const c = item.countryiso3code;
    if (!c) continue;
    if (!by[c]) by[c] = [];
    by[c].push(item.value);
  }
  return by;
}

function startVal(raw) {
  const by = {};
  for (const item of raw) {
    if (item.value === null) continue;
    const y = +item.date;
    if (Math.abs(y - DATE_START) > 2) continue;
    const c = item.countryiso3code;
    if (!c) continue;
    if (!by[c] || Math.abs(y - DATE_START) < Math.abs(by[c].year - DATE_START)) {
      by[c] = { value: item.value, year: y };
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(by)) out[k] = v.value;
  return out;
}

// ─── Load data ────────────────────────────────────────────────────────────────
console.log("Loading cached World Bank data...");
const meta = loadMeta();
const spRaw = loadWB("GC.XPN.TOTL.GD.ZS");
const grRaw = loadWB("NY.GDP.MKTP.KD.ZG");
const gdpPcRaw = loadWB("NY.GDP.PCAP.KD");
const rdRaw = loadWB("GB.XPD.RSDV.GD.ZS");
const milRaw = loadWB("MS.MIL.XPND.GD.ZS");
const capRaw = loadWB("NE.GDI.TOTL.ZS");
const popRaw = loadWB("SP.POP.GROW");
const creditRaw = loadWB("FS.AST.PRVT.GD.ZS");
const terRaw = loadWB("SE.TER.ENRR");

const piqData = JSON.parse(readFileSync(join(CACHE_DIR, "piq.json"), "utf8"));

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));

const spAvg = periodAvg(spRaw);
const grAvg = periodAvg(grRaw);
const gdpPcSt = startVal(gdpPcRaw);
const rdAvg = periodAvg(rdRaw);
const milAvg = periodAvg(milRaw);
const capAvg = periodAvg(capRaw);
const popAvg = periodAvg(popRaw);
const creditAvg = periodAvg(creditRaw);
const terAvg = periodAvg(terRaw);

const get = (map, code) => map[code] ? avg(map[code]) : null;

// ─── Build country dataset (same exclusion logic as armey-curve.html) ─────────
const ALL_EXCL = new Set([...EXCLUDED, ...RESOURCE_DEP, ...EXT_FUNDED, ...GDP_DIST, ...CONFLICT]);

const data = [];
for (const code of Object.keys(spAvg)) {
  if (!actualCodes.has(code)) continue;
  if (ALL_EXCL.has(code)) continue;

  const spending = get(spAvg, code);
  const growth = get(grAvg, code);
  const gdpPc = gdpPcSt[code];
  const rd = get(rdAvg, code);
  const mil = get(milAvg, code);
  const cap = get(capAvg, code);
  const pop = get(popAvg, code);
  const credit = get(creditAvg, code);
  const ter = get(terAvg, code);

  if (!spending || !growth || !gdpPc) continue;

  data.push({ code, spending, growth, gdpPc, rd, mil, cap, pop, credit, ter });
}
console.log(`Base dataset: ${data.length} countries\n`);

// ─── Stage 1: Power-law fit ───────────────────────────────────────────────────
// Fit growth = b0 * spending^(-alpha) — simplified with grid search result
// For the residual calculation we just need OLS residuals from a simple 1-var model.
// Use the same approach as armey-curve.html Stage 2: residuals from OLS(growth ~ spending).
function computeResiduals(pts) {
  const xs = pts.map(p => p.spending);
  const ys = pts.map(p => p.growth);
  const mx = avg(xs), my = avg(ys);
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  return pts.map((p, i) => ({
    ...p,
    residual: ys[i] - (intercept + slope * xs[i]),
  }));
}

const withResid = computeResiduals(data);

// ─── 7-variable subset (same joint filter as armey-curve.html) ───────────────
const sub7 = withResid.filter(
  p => p.rd != null && p.mil != null && p.cap != null && p.pop != null
    && p.credit != null && p.ter != null && p.gdpPc != null
);
console.log(`7-variable subset (R&D, mil, cap, pop, credit, tertiary, income): ${sub7.length} countries`);

// ─── 8-variable subset: add PIQ ───────────────────────────────────────────────
const sub8 = sub7.filter(p => piqData[p.code] != null);
console.log(`8-variable subset (+ PIQ): ${sub8.length} countries`);
if (sub8.length === 0) {
  console.log("No overlap — check ISO3 codes in build-piq.mjs");
  process.exit(1);
}

// ─── Baseline 7-var R² on the PIQ subset ─────────────────────────────────────
const logInc = (p) => Math.log(p.gdpPc);

const res8 = sub8.map(p => p.residual);
const r7on8 = olsK(
  [
    sub8.map(p => p.rd),
    sub8.map(p => p.mil),
    sub8.map(p => p.cap),
    sub8.map(p => p.pop),
    sub8.map(p => p.credit),
    sub8.map(p => p.ter),
    sub8.map(logInc),
  ],
  res8
);
console.log(`\n7-var R² on PIQ subset (N=${sub8.length}): ${r7on8.r2.toFixed(4)}`);

// ─── Add PIQ as 8th variable ─────────────────────────────────────────────────
const r8 = olsK(
  [
    sub8.map(p => p.rd),
    sub8.map(p => p.mil),
    sub8.map(p => p.cap),
    sub8.map(p => p.pop),
    sub8.map(p => p.credit),
    sub8.map(p => p.ter),
    sub8.map(logInc),
    sub8.map(p => piqData[p.code]),
  ],
  res8
);
console.log(`8-var R² (+ PIQ):              ${r8.r2.toFixed(4)}`);
console.log(`Marginal R² from PIQ:          +${(r8.r2 - r7on8.r2).toFixed(4)}`);

// ─── PIQ alone on this subset ─────────────────────────────────────────────────
const rPiqAlone = olsK(
  [sub8.map(p => piqData[p.code])],
  res8
);
console.log(`PIQ-alone R² (bivariate):      ${rPiqAlone.r2.toFixed(4)}`);

// ─── Compare to 7-var on full 7-var subset ────────────────────────────────────
const res7full = sub7.map(p => p.residual);
const r7full = olsK(
  [
    sub7.map(p => p.rd),
    sub7.map(p => p.mil),
    sub7.map(p => p.cap),
    sub7.map(p => p.pop),
    sub7.map(p => p.credit),
    sub7.map(p => p.ter),
    sub7.map(logInc),
  ],
  res7full
);
console.log(`\n7-var R² on full 7-var subset (N=${sub7.length}): ${r7full.r2.toFixed(4)}`);
console.log(`(PIQ subset R² gap from N-shrinkage: ${(r7on8.r2 - r7full.r2).toFixed(4)})`);

// ─── PIQ distribution by income group ────────────────────────────────────────
const incomeGroup = {};
for (const m of meta) incomeGroup[m.id] = m.incomeLevel?.value ?? "Unknown";

const groups = {};
for (const p of sub8) {
  const g = incomeGroup[p.code] ?? "Unknown";
  if (!groups[g]) groups[g] = [];
  groups[g].push(piqData[p.code]);
}
console.log("\nPIQ mean by income group (Stage 2 countries):");
for (const [g, vals] of Object.entries(groups).sort()) {
  console.log(`  ${g.padEnd(30)} n=${vals.length}  mean=${avg(vals).toFixed(3)}`);
}

// ─── Countries gaining most from PIQ control ─────────────────────────────────
const r7resid = r7on8.fitted.map((f, i) => res8[i] - f);
const piqArr = sub8.map(p => piqData[p.code]);
const piqMean = avg(piqArr);

// Countries where PIQ explains large part of residual
const byExplained = sub8.map((p, i) => ({
  code: p.code,
  piq: piqData[p.code],
  r7resid: r7resid[i],
})).sort((a, b) => Math.abs(b.piq - piqMean) - Math.abs(a.piq - piqMean));

console.log("\nCountries with most extreme PIQ scores (in Stage 2 sample):");
byExplained.slice(0, 15).forEach(p =>
  console.log(`  ${p.code}  PIQ=${p.piq.toFixed(3)}  Stage2-resid=${p.r7resid.toFixed(3)}`)
);
