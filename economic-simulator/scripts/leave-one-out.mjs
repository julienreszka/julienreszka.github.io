/**
 * leave-one-out.mjs
 *
 * Measures the marginal R² of each variable in the 7-var Stage 2 model
 * by dropping it and recording the R² drop. Then compares against the
 * new candidates (ToT volatility, working-age share).
 *
 * This answers: "Are the new variables stronger predictors than any we already have?"
 *
 * Run: node /path/to/economic-simulator/scripts/leave-one-out.mjs
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

function loadWB(indicator) {
  for (const prefix of ["wb_", "WB_"]) {
    const p = join(CACHE_DIR, `${prefix}${indicator}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error(`Missing cache for ${indicator}`); process.exit(1);
}
function loadMeta() {
  for (const name of ["wb_meta", "WB_meta"]) {
    const p = join(CACHE_DIR, `${name}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error("Missing metadata"); process.exit(1);
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
function totVolatility(raw) {
  const byCountry = {};
  for (const item of raw) {
    if (item.value === null) continue;
    const y = +item.date;
    if (y < DATE_START - 1 || y > DATE_END) continue;
    const c = item.countryiso3code;
    if (!c) continue;
    if (!byCountry[c]) byCountry[c] = {};
    byCountry[c][y] = item.value;
  }
  const out = {};
  for (const [c, byYear] of Object.entries(byCountry)) {
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
    const changes = [];
    for (let i = 1; i < years.length; i++) {
      const prev = byYear[years[i - 1]], curr = byYear[years[i]];
      if (prev > 0 && curr > 0) changes.push((curr - prev) / prev * 100);
    }
    if (changes.length < 5) continue;
    const mu = avg(changes);
    out[c] = Math.sqrt(changes.reduce((s, v) => s + (v - mu) ** 2, 0) / changes.length);
  }
  return out;
}

// ─── Load ────────────────────────────────────────────────────────────────────
const meta      = loadMeta();
const spRaw     = loadWB("GC.XPN.TOTL.GD.ZS");
const grRaw     = loadWB("NY.GDP.MKTP.KD.ZG");
const gdpPcRaw  = loadWB("NY.GDP.PCAP.KD");
const rdRaw     = loadWB("GB.XPD.RSDV.GD.ZS");
const milRaw    = loadWB("MS.MIL.XPND.GD.ZS");
const capRaw    = loadWB("NE.GDI.TOTL.ZS");
const popRaw    = loadWB("SP.POP.GROW");
const creditRaw = loadWB("FS.AST.PRVT.GD.ZS");
const terRaw    = loadWB("SE.TER.ENRR");
const waRaw     = loadWB("SP.POP.1564.TO.ZS");
const totRaw    = loadWB("TT.PRI.MRCH.XD.WD");

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));
const ALL_EXCL    = new Set([...EXCLUDED, ...RESOURCE_DEP, ...EXT_FUNDED, ...GDP_DIST, ...CONFLICT]);

const spAvg     = periodAvg(spRaw);
const grAvg     = periodAvg(grRaw);
const gdpPcSt   = startVal(gdpPcRaw);
const rdAvg     = periodAvg(rdRaw);
const milAvg    = periodAvg(milRaw);
const capAvg    = periodAvg(capRaw);
const popAvg    = periodAvg(popRaw);
const creditAvg = periodAvg(creditRaw);
const terAvg    = periodAvg(terRaw);
const waAvg     = periodAvg(waRaw);
const totVol    = totVolatility(totRaw);

const get = (map, code) => map[code] ? avg(map[code]) : null;

const data = [];
for (const code of Object.keys(spAvg)) {
  if (!actualCodes.has(code) || ALL_EXCL.has(code)) continue;
  const spending = get(spAvg, code), growth = get(grAvg, code), gdpPc = gdpPcSt[code];
  if (!spending || !growth || !gdpPc) continue;
  data.push({
    code, spending, growth, gdpPc,
    rd: get(rdAvg, code), mil: get(milAvg, code), cap: get(capAvg, code),
    pop: get(popAvg, code), credit: get(creditAvg, code), ter: get(terAvg, code),
    wa: get(waAvg, code), tot: totVol[code],
  });
}

function computeResiduals(pts) {
  const xs = pts.map(p => p.spending), ys = pts.map(p => p.growth);
  const mx = avg(xs), my = avg(ys);
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  return pts.map((p, i) => ({ ...p, residual: ys[i] - (intercept + slope * xs[i]) }));
}
const withResid = computeResiduals(data);
const logInc = (p) => Math.log(p.gdpPc);

// ─── Full 7-var joint subset (same joint filter as armey-curve.html) ─────────
const sub7 = withResid.filter(
  p => p.rd != null && p.mil != null && p.cap != null && p.pop != null
    && p.credit != null && p.ter != null && p.gdpPc != null
);
const res7 = sub7.map(p => p.residual);

const VARS = [
  { label: "R&D spending",             fn: p => p.rd },
  { label: "Military spending",        fn: p => p.mil },
  { label: "Capital formation",        fn: p => p.cap },
  { label: "Population growth",        fn: p => p.pop },
  { label: "Private credit",           fn: p => p.credit },
  { label: "Tertiary enrollment",      fn: p => p.ter },
  { label: "Log income per capita",    fn: logInc },
];

const allFns  = VARS.map(v => v.fn);
const r7full  = olsK(allFns.map(fn => sub7.map(fn)), res7);
console.log(`7-var full model: N=${sub7.length}  R²=${r7full.r2.toFixed(4)}\n`);

// ─── Leave-one-out for each existing variable ─────────────────────────────────
console.log("=== Leave-one-out: marginal R² of each existing variable ===");
const results = [];
for (let i = 0; i < VARS.length; i++) {
  const dropped = allFns.filter((_, j) => j !== i);
  const r6 = olsK(dropped.map(fn => sub7.map(fn)), res7);
  const marginal = r7full.r2 - r6.r2;
  results.push({ label: VARS[i].label, r6: r6.r2, marginal });
}
results.sort((a, b) => b.marginal - a.marginal);
for (const r of results) {
  console.log(`  ${r.label.padEnd(28)} marginal=+${r.marginal.toFixed(4)}  (without: R²=${r.r6.toFixed(4)})`);
}

// ─── New candidates marginal over the same N=88 subset ───────────────────────
console.log("\n=== New candidates (marginal over same N=88 7-var model) ===");
const newVars = [
  { label: "ToT volatility",           fn: p => p.tot },
  { label: "Working-age share",        fn: p => p.wa },
];
for (const { label, fn } of newVars) {
  const aug = olsK([...allFns, fn].map(f => sub7.map(f)), res7);
  const marginal = aug.r2 - r7full.r2;
  console.log(`  ${label.padEnd(28)} marginal=+${marginal.toFixed(4)}`);
}

// ─── Ranking: all variables by marginal R² ────────────────────────────────────
console.log("\n=== Full ranking: existing (LOO) + new candidates ===");
const all = [
  ...results,
  { label: "ToT volatility *new*",   marginal: olsK([...allFns, p => p.tot].map(f => sub7.map(f)), res7).r2 - r7full.r2 },
  { label: "Working-age share *new*", marginal: olsK([...allFns, p => p.wa].map(f => sub7.map(f)), res7).r2 - r7full.r2 },
].sort((a, b) => b.marginal - a.marginal);

for (const r of all) {
  const bar = "█".repeat(Math.round(r.marginal * 400));
  console.log(`  ${r.label.padEnd(30)} +${r.marginal.toFixed(4)}  ${bar}`);
}
