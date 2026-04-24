/**
 * test-eci.mjs
 *
 * Tests the marginal R² contribution of the Economic Complexity Index (ECI)
 * — Harvard Growth Lab — when added as an 8th control in the Stage 2 residual
 * regression of armey-curve.html.
 *
 * Mirrors test-piq.mjs structure. Reports:
 *   - ECI overlap with the WB Stage 2 sample
 *   - R² of the 7-variable baseline model on the ECI subset
 *   - R² after adding ECI as an 8th control (marginal R²)
 *   - Distribution of ECI scores by income group
 *
 * Run: node /path/to/economic-simulator/scripts/test-eci.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  DATE_START, DATE_END,
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

// ─── Loaders ────────────────────────────────────────────────────────────────
function loadWB(indicator) {
  for (const prefix of ["wb_", "WB_"]) {
    const p = join(CACHE_DIR, `${prefix}${indicator}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error(`Missing cache for ${indicator} — run ceiling-r2.mjs first`);
  process.exit(1);
}
function loadMeta() {
  for (const name of ["wb_meta", "WB_meta"]) {
    const p = join(CACHE_DIR, `${name}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error("Missing country metadata");
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

// ─── Load data ──────────────────────────────────────────────────────────────
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

const eci = JSON.parse(readFileSync(join(CACHE_DIR, "eci.json"), "utf8"));
console.log(`ECI countries: ${Object.keys(eci).length}`);

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

// ─── Build country dataset (matches armey-curve.html exclusions) ────────────
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

// ─── Stage 1 residuals ──────────────────────────────────────────────────────
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

// ─── 7-variable subset (matches armey-curve.html joint filter) ──────────────
const sub7 = withResid.filter(
  p => p.rd != null && p.mil != null && p.cap != null && p.pop != null
    && p.credit != null && p.ter != null && p.gdpPc != null
);
console.log(`7-var subset: ${sub7.length} countries`);

// ─── 8-variable subset: add ECI ─────────────────────────────────────────────
const sub8 = sub7.filter(p => eci[p.code] != null);
console.log(`8-var subset (+ ECI): ${sub8.length} countries`);

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
const r8 = olsK(
  [
    sub8.map(p => p.rd),
    sub8.map(p => p.mil),
    sub8.map(p => p.cap),
    sub8.map(p => p.pop),
    sub8.map(p => p.credit),
    sub8.map(p => p.ter),
    sub8.map(logInc),
    sub8.map(p => eci[p.code]),
  ],
  res8
);
const rEciAlone = olsK([sub8.map(p => eci[p.code])], res8);

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

console.log(`\n=== Marginal R² test ===`);
console.log(`7-var R² on full 7-var subset (N=${sub7.length}): ${r7full.r2.toFixed(4)}`);
console.log(`7-var R² on ECI subset (N=${sub8.length}):        ${r7on8.r2.toFixed(4)}`);
console.log(`8-var R² (+ ECI):                              ${r8.r2.toFixed(4)}`);
console.log(`Marginal R² from ECI:                          +${(r8.r2 - r7on8.r2).toFixed(4)}`);
console.log(`ECI-alone R² (bivariate):                      ${rEciAlone.r2.toFixed(4)}`);
console.log(`N-shrinkage gap: ${(r7on8.r2 - r7full.r2).toFixed(4)}`);

// ─── ECI by income group ────────────────────────────────────────────────────
const incomeGroup = {};
for (const m of meta) incomeGroup[m.id] = m.incomeLevel?.value ?? "Unknown";
const groups = {};
for (const p of sub8) {
  const g = incomeGroup[p.code] ?? "Unknown";
  if (!groups[g]) groups[g] = [];
  groups[g].push(eci[p.code]);
}
console.log(`\nECI mean by income group (Stage 2 countries):`);
for (const [g, vals] of Object.entries(groups).sort()) {
  console.log(`  ${g.padEnd(30)} n=${vals.length}  mean=${avg(vals).toFixed(3)}`);
}

// ─── ECI standardized coefficient ───────────────────────────────────────────
const eciVals = sub8.map(p => eci[p.code]);
const eciSD = Math.sqrt(eciVals.reduce((s, v) => s + (v - avg(eciVals)) ** 2, 0) / eciVals.length);
const resSD = Math.sqrt(res8.reduce((s, v) => s + (v - avg(res8)) ** 2, 0) / res8.length);
const beta_eci_std = r8.bs[7] * eciSD / resSD;
console.log(`\nECI standardized β: ${beta_eci_std.toFixed(3)} (SD of residual per SD of ECI)`);
console.log(`ECI raw β: ${r8.bs[7].toFixed(3)} pp growth per unit ECI`);
