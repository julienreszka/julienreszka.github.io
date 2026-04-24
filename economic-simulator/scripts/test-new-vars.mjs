/**
 * test-new-vars.mjs
 *
 * Tests the marginal R² contribution of three new Stage 2 controls:
 *   1. Working-age population share (SP.POP.1564.TO.ZS) — demographic structure
 *   2. Terms-of-trade volatility (SD of YoY % changes in TT.PRI.MRCH.XD.WD)
 *   3. Trade-partner growth (GDP-weighted mean growth of same WB region, ex. own)
 *
 * Each is tested individually (marginal over 7-var) and jointly.
 *
 * Run: node /path/to/economic-simulator/scripts/test-new-vars.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  DATE_START, DATE_END,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, r2,
} from "../model-math.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dir, "cache");

// ─── Gauss-Jordan OLS ────────────────────────────────────────────────────────
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

// ─── WB loader helpers ───────────────────────────────────────────────────────
function loadWB(indicator) {
  for (const prefix of ["wb_", "WB_"]) {
    const p = join(CACHE_DIR, `${prefix}${indicator}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error(`Missing cache for ${indicator} — fetch it first`);
  process.exit(1);
}
function loadMeta() {
  for (const name of ["wb_meta", "WB_meta"]) {
    const p = join(CACHE_DIR, `${name}.json`);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  console.error("Missing country metadata"); process.exit(1);
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

/** Compute SD of year-over-year % changes in terms-of-trade index */
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
      const prev = byYear[years[i - 1]];
      const curr = byYear[years[i]];
      if (prev > 0 && curr > 0) changes.push((curr - prev) / prev * 100);
    }
    if (changes.length < 5) continue;
    const mu = avg(changes);
    const sd = Math.sqrt(changes.reduce((s, v) => s + (v - mu) ** 2, 0) / changes.length);
    out[c] = sd;
  }
  return out;
}

// ─── Load cached data ────────────────────────────────────────────────────────
console.log("Loading World Bank cache...");
const meta       = loadMeta();
const spRaw      = loadWB("GC.XPN.TOTL.GD.ZS");
const grRaw      = loadWB("NY.GDP.MKTP.KD.ZG");
const gdpPcRaw   = loadWB("NY.GDP.PCAP.KD");
const rdRaw      = loadWB("GB.XPD.RSDV.GD.ZS");
const milRaw     = loadWB("MS.MIL.XPND.GD.ZS");
const capRaw     = loadWB("NE.GDI.TOTL.ZS");
const popRaw     = loadWB("SP.POP.GROW");
const creditRaw  = loadWB("FS.AST.PRVT.GD.ZS");
const terRaw     = loadWB("SE.TER.ENRR");
const waRaw      = loadWB("SP.POP.1564.TO.ZS");   // working-age share
const totRaw     = loadWB("TT.PRI.MRCH.XD.WD");   // ToT index

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));

const spAvg      = periodAvg(spRaw);
const grAvg      = periodAvg(grRaw);
const gdpPcSt    = startVal(gdpPcRaw);
const rdAvg      = periodAvg(rdRaw);
const milAvg     = periodAvg(milRaw);
const capAvg     = periodAvg(capRaw);
const popAvg     = periodAvg(popRaw);
const creditAvg  = periodAvg(creditRaw);
const terAvg     = periodAvg(terRaw);
const waAvg      = periodAvg(waRaw);
const totVol     = totVolatility(totRaw);

// ─── Trade-partner growth: GDP-weighted regional peer growth ─────────────────
// For each country, compute the average GDP growth of all other countries in the
// same WB region over 2005-2023. This captures shared external demand conditions.
const regionOf = {};
for (const m of meta) if (m.region?.id && m.region.id !== "NA") regionOf[m.id] = m.region.id;

// Collect per-country period average growth
const countryGrowthAvg = {};
for (const [code, vals] of Object.entries(grAvg)) countryGrowthAvg[code] = avg(vals);

// Collect by region
const regionMembers = {};
for (const [code, region] of Object.entries(regionOf)) {
  if (!countryGrowthAvg[code]) continue;
  if (!regionMembers[region]) regionMembers[region] = [];
  regionMembers[region].push({ code, growth: countryGrowthAvg[code] });
}

// Peer growth = mean growth of all other countries in the same WB region
const peerGrowth = {};
for (const [code, region] of Object.entries(regionOf)) {
  const members = regionMembers[region];
  if (!members) continue;
  const others = members.filter(m => m.code !== code);
  if (others.length < 3) continue;  // need at least 3 peers
  peerGrowth[code] = avg(others.map(m => m.growth));
}

const get = (map, code) => map[code] ? avg(map[code]) : null;

// ─── Build base dataset ──────────────────────────────────────────────────────
const ALL_EXCL = new Set([...EXCLUDED, ...RESOURCE_DEP, ...EXT_FUNDED, ...GDP_DIST, ...CONFLICT]);

const data = [];
for (const code of Object.keys(spAvg)) {
  if (!actualCodes.has(code)) continue;
  if (ALL_EXCL.has(code)) continue;
  const spending = get(spAvg, code);
  const growth   = get(grAvg, code);
  const gdpPc    = gdpPcSt[code];
  const rd       = get(rdAvg, code);
  const mil      = get(milAvg, code);
  const cap      = get(capAvg, code);
  const pop      = get(popAvg, code);
  const credit   = get(creditAvg, code);
  const ter      = get(terAvg, code);
  if (!spending || !growth || !gdpPc) continue;
  data.push({ code, spending, growth, gdpPc, rd, mil, cap, pop, credit, ter });
}
console.log(`Base dataset: ${data.length} countries`);
console.log(`  Working-age share coverage: ${data.filter(p => get(waAvg, p.code) != null).length}`);
console.log(`  ToT volatility coverage:    ${data.filter(p => totVol[p.code] != null).length}`);
console.log(`  Peer growth coverage:       ${data.filter(p => peerGrowth[p.code] != null).length}\n`);

// ─── Stage 1 residuals ───────────────────────────────────────────────────────
function computeResiduals(pts) {
  const xs = pts.map(p => p.spending);
  const ys = pts.map(p => p.growth);
  const mx = avg(xs), my = avg(ys);
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  return pts.map((p, i) => ({
    ...p, residual: ys[i] - (intercept + slope * xs[i]),
  }));
}
const withResid = computeResiduals(data);
const logInc = (p) => Math.log(p.gdpPc);

// ─── 7-variable baseline (R&D, mil, cap, pop, credit, tertiary, income) ──────
const sub7 = withResid.filter(
  p => p.rd != null && p.mil != null && p.cap != null && p.pop != null
    && p.credit != null && p.ter != null && p.gdpPc != null
);
const res7 = sub7.map(p => p.residual);
const r7base = olsK(
  [sub7.map(p => p.rd), sub7.map(p => p.mil), sub7.map(p => p.cap),
   sub7.map(p => p.pop), sub7.map(p => p.credit), sub7.map(p => p.ter), sub7.map(logInc)],
  res7
);
console.log(`7-var baseline: N=${sub7.length}  R²=${r7base.r2.toFixed(4)}\n`);

// ─── Test each variable individually ─────────────────────────────────────────
function testMarginal(label, getFn) {
  const sub = sub7.filter(p => getFn(p) != null);
  if (sub.length < 20) { console.log(`${label}: insufficient coverage (N=${sub.length})`); return; }
  const res = sub.map(p => p.residual);
  const base = olsK(
    [sub.map(p => p.rd), sub.map(p => p.mil), sub.map(p => p.cap),
     sub.map(p => p.pop), sub.map(p => p.credit), sub.map(p => p.ter), sub.map(logInc)],
    res
  );
  const augmented = olsK(
    [sub.map(p => p.rd), sub.map(p => p.mil), sub.map(p => p.cap),
     sub.map(p => p.pop), sub.map(p => p.credit), sub.map(p => p.ter), sub.map(logInc),
     sub.map(getFn)],
    res
  );
  const alone = olsK([sub.map(getFn)], res);
  console.log(`${label}`);
  console.log(`  N=${sub.length}  alone R²=${alone.r2.toFixed(4)}  7-var R²=${base.r2.toFixed(4)}  +var R²=${augmented.r2.toFixed(4)}  marginal=+${(augmented.r2 - base.r2).toFixed(4)}`);
  console.log(`  raw β=${augmented.bs[7].toFixed(4)}`);
}

testMarginal("Working-age share (SP.POP.1564.TO.ZS)", p => get(waAvg, p.code));
testMarginal("ToT volatility (SD of YoY % changes)",  p => totVol[p.code]);
testMarginal("Trade-partner growth (WB regional peer)", p => peerGrowth[p.code]);

// ─── Joint test: all three together ─────────────────────────────────────────
const subJoint = sub7.filter(
  p => get(waAvg, p.code) != null && totVol[p.code] != null && peerGrowth[p.code] != null
);
if (subJoint.length >= 20) {
  const res = subJoint.map(p => p.residual);
  const base = olsK(
    [subJoint.map(p => p.rd), subJoint.map(p => p.mil), subJoint.map(p => p.cap),
     subJoint.map(p => p.pop), subJoint.map(p => p.credit), subJoint.map(p => p.ter), subJoint.map(logInc)],
    res
  );
  const joint = olsK(
    [subJoint.map(p => p.rd), subJoint.map(p => p.mil), subJoint.map(p => p.cap),
     subJoint.map(p => p.pop), subJoint.map(p => p.credit), subJoint.map(p => p.ter), subJoint.map(logInc),
     subJoint.map(p => get(waAvg, p.code)),
     subJoint.map(p => totVol[p.code]),
     subJoint.map(p => peerGrowth[p.code])],
    res
  );
  console.log(`\nJoint test (all 3 new vars added to 7-var):`);
  console.log(`  N=${subJoint.length}  7-var R²=${base.r2.toFixed(4)}  10-var R²=${joint.r2.toFixed(4)}  joint marginal=+${(joint.r2 - base.r2).toFixed(4)}`);
}
