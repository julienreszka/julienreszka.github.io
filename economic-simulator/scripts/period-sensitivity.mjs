// Test how the Stage 2 ranking changes with different DATE windows.
// Run: node scripts/period-sensitivity.mjs

import {
  MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, r2, gridSearch2D,
} from "../model-math.mjs";

const fetchWB = async (ind, dStart, dEnd) => {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${ind}?date=${dStart}:${dEnd}&format=json&per_page=30000`;
  const res = await fetch(url);
  const json = await res.json();
  return json[1] || [];
};
const fetchMeta = async () => {
  const res = await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=400`);
  const json = await res.json();
  return json[1] || [];
};

function olsK(Xcols, ys) {
  const n = ys.length, p = Xcols.length;
  const X = [];
  for (let i = 0; i < n; i++) {
    const row = [1];
    for (let k = 0; k < p; k++) row.push(Xcols[k][i]);
    X.push(row);
  }
  const m = p + 1;
  const XtX = Array.from({ length: m }, () => new Array(m).fill(0));
  const Xty = new Array(m).fill(0);
  for (let i = 0; i < n; i++) for (let r = 0; r < m; r++) {
    Xty[r] += X[i][r] * ys[i];
    for (let c = 0; c < m; c++) XtX[r][c] += X[i][r] * X[i][c];
  }
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let i = 0; i < m; i++) {
    let pv = i;
    for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[pv][i])) pv = r;
    if (Math.abs(A[pv][i]) < 1e-15) return { fitted: ys.map(() => avg(ys)) };
    if (pv !== i) [A[i], A[pv]] = [A[pv], A[i]];
    const piv = A[i][i];
    for (let c = 0; c <= m; c++) A[i][c] /= piv;
    for (let r = 0; r < m; r++) if (r !== i) {
      const f = A[r][i];
      for (let c = 0; c <= m; c++) A[r][c] -= f * A[i][c];
    }
  }
  const beta = A.map(row => row[m]);
  return { fitted: X.map(row => row.reduce((s, v, k) => s + v * beta[k], 0)) };
}

function fitModels(dataPoints) {
  const cost = (fn) => {
    const n = dataPoints.length;
    const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
    return n * Math.log(ssRes / n);
  };
  const models = [];
  {
    const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a)));
    models.push({ name: "Power Law", k: 2, fn: x => b0 * Math.pow(Math.max(x, 0.1), -alpha) });
  }
  {
    const [b, a] = gridSearch2D([0.1, 5000], [-10, 10], (b, a) => cost(x => a + b / Math.max(x, 0.1)));
    models.push({ name: "Inverse", k: 2, fn: x => a + b / Math.max(x, 0.1) });
  }
  {
    const [b0, alpha] = gridSearch2D([0.1, 50], [0.01, 20], (b0, a) => cost(x => b0 - a * Math.log(x + 1)));
    models.push({ name: "Log-Linear", k: 2, fn: x => b0 - alpha * Math.log(x + 1) });
  }
  {
    const [b0, lambda] = gridSearch2D([0.5, 2000], [0.001, 1], (b0, l) => cost(x => b0 * Math.exp(-l * x)));
    models.push({ name: "Exponential", k: 2, fn: x => b0 * Math.exp(-lambda * x) });
  }
  {
    const [b0, slope] = gridSearch2D([0.1, 50], [-3, 0], (b0, s) => cost(x => b0 + s * x));
    models.push({ name: "Linear", k: 2, fn: x => b0 + slope * x });
  }
  return models;
}

async function runPeriod(dStart, dEnd, label) {
  const [meta, spRaw, grRaw, gdpPcRaw, rdRaw, milRaw] = await Promise.all([
    fetchMeta(),
    fetchWB("GC.XPN.TOTL.GD.ZS", dStart, dEnd),
    fetchWB("NY.GDP.MKTP.KD.ZG", dStart, dEnd),
    fetchWB("NY.GDP.PCAP.KD", dStart, dEnd),
    fetchWB("GB.XPD.RSDV.GD.ZS", dStart, dEnd),
    fetchWB("MS.MIL.XPND.GD.ZS", dStart, dEnd),
  ]);
  const actualCodes = new Set(meta.filter(c => c.region?.value !== "Aggregates").map(c => c.id));
  const countries = {};
  for (const c of meta) {
    if (c.region?.value === "Aggregates") continue;
    countries[c.id] = { name: c.name, sp: [], gr: [], gdpPc: null };
  }
  for (const it of spRaw) if (it.value && countries[it.countryiso3code]) countries[it.countryiso3code].sp.push(it.value);
  for (const it of grRaw) if (it.value && countries[it.countryiso3code]) countries[it.countryiso3code].gr.push(it.value);
  const gdpPcByYear = {};
  for (const it of gdpPcRaw) {
    if (!it.value) continue;
    (gdpPcByYear[it.countryiso3code] ??= {})[+it.date] = it.value;
  }
  for (const code of Object.keys(countries)) {
    const ys = gdpPcByYear[code]; if (!ys) continue;
    countries[code].gdpPc = ys[Math.min(...Object.keys(ys).map(Number))];
  }
  const rdBy = {}, milBy = {};
  for (const it of rdRaw) if (it.value) (rdBy[it.countryiso3code] ??= []).push(it.value);
  for (const it of milRaw) if (it.value) (milBy[it.countryiso3code] ??= []).push(it.value);

  const dataPoints = Object.entries(countries)
    .filter(([code, d]) =>
      actualCodes.has(code) &&
      !EXCLUDED.has(code) && !CONFLICT.has(code) && !GDP_DIST.has(code) &&
      !EXT_FUNDED.has(code) && !RESOURCE_DEP.has(code) &&
      d.sp.length >= MIN_YEARS && d.gr.length >= MIN_YEARS
    )
    .map(([code, d]) => ({
      name: d.name,
      spending: avg(d.sp),
      growth: avg(d.gr),
      logGdpPcap: d.gdpPc ? Math.log(d.gdpPc) : null,
      rd: rdBy[code] ? avg(rdBy[code]) : null,
      mil: milBy[code] ? avg(milBy[code]) : null,
    }));

  const withRd = dataPoints.filter(c => c.rd !== null).length;
  const withMil = dataPoints.filter(c => c.mil !== null).length;
  const withInc = dataPoints.filter(c => c.logGdpPcap !== null).length;
  const withAll = dataPoints.filter(c => c.rd !== null && c.mil !== null && c.logGdpPcap !== null);

  const models = fitModels(dataPoints);
  const xs = [
    withAll.map(c => c.rd),
    withAll.map(c => c.mil),
    withAll.map(c => c.logGdpPcap),
  ];
  const results = models.map(m => {
    const stage1 = withAll.map(c => m.fn(c.spending));
    const actuals = withAll.map(c => c.growth);
    const r2s = r2(actuals, stage1);
    const resids = actuals.map((g, i) => g - stage1[i]);
    const stage2 = olsK(xs, resids).fitted;
    const r2c = r2(actuals, stage1.map((p, i) => p + stage2[i]));
    return { name: m.name, r2s, r2c };
  }).sort((a, b) => b.r2c - a.r2c);

  console.log(`\n══ ${label}  (${dStart}–${dEnd}) ══`);
  console.log(`  Clean dataset: ${dataPoints.length}  | with R&D: ${withRd}  | with mil: ${withMil}  | with income: ${withInc}  | all 3: ${withAll.length}`);
  console.log("  Rank  Model         R²(spending)  Combined R²");
  results.forEach((r, i) => {
    console.log(`   ${i + 1}.  ${r.name.padEnd(13)} ${r.r2s.toFixed(4).padStart(11)}  ${r.r2c.toFixed(4).padStart(11)}`);
  });
}

const periods = [
  [1995, 2023, "Long window 1995–2023"],
  [2000, 2023, "2000–2023"],
  [2005, 2023, "Current default 2005–2023"],
  [2010, 2023, "2010–2023"],
  [1995, 2019, "Pre-COVID 1995–2019"],
  [2000, 2019, "2000–2019"],
  [1990, 2023, "1990–2023"],
  [1985, 2023, "1985–2023"],
];

for (const [s, e, label] of periods) {
  try { await runPeriod(s, e, label); }
  catch (err) { console.log(`\n!! ${label}: ${err.message}`); }
}
