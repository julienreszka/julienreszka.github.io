// Test how the Stage 2 ranking changes with different subset strategies.
// Run: node scripts/subset-sensitivity.mjs

import {
  DATE_START, DATE_END, MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, r2, ols, gridSearch2D,
} from "../model-math.mjs";

// ── OLS helpers ───────────────────────────────────────────────────────────
// Generic multi-variable OLS: y = a + sum(b_k * x_k). Solves via Gauss-Jordan
// on the (p+1)×(p+1) augmented normal-equation matrix. Returns fitted values.
function olsK(Xcols, ys) {
  const n = ys.length, p = Xcols.length;
  // Design matrix with intercept column
  const X = [];
  for (let i = 0; i < n; i++) {
    const row = [1];
    for (let k = 0; k < p; k++) row.push(Xcols[k][i]);
    X.push(row);
  }
  const m = p + 1;
  // Normal equations: (X'X) beta = X'y
  const XtX = Array.from({ length: m }, () => new Array(m).fill(0));
  const Xty = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < m; r++) {
      Xty[r] += X[i][r] * ys[i];
      for (let c = 0; c < m; c++) XtX[r][c] += X[i][r] * X[i][c];
    }
  }
  // Gauss-Jordan
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let i = 0; i < m; i++) {
    let pivot = i;
    for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) pivot = r;
    if (Math.abs(A[pivot][i]) < 1e-15) return { fitted: ys.map(() => avg(ys)) };
    if (pivot !== i) [A[i], A[pivot]] = [A[pivot], A[i]];
    const piv = A[i][i];
    for (let c = 0; c <= m; c++) A[i][c] /= piv;
    for (let r = 0; r < m; r++) if (r !== i) {
      const f = A[r][i];
      for (let c = 0; c <= m; c++) A[r][c] -= f * A[i][c];
    }
  }
  const beta = A.map(row => row[m]);
  const fitted = X.map(row => row.reduce((s, v, k) => s + v * beta[k], 0));
  return { fitted, beta };
}

// ── Fetch ─────────────────────────────────────────────────────────────────
const fetchWB = async (ind) => {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${ind}?date=${DATE_START}:${DATE_END}&format=json&per_page=20000`;
  const res = await fetch(url);
  const json = await res.json();
  return json[1] || [];
};
const fetchMeta = async () => {
  const res = await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=400`);
  const json = await res.json();
  return json[1] || [];
};

console.log("Fetching...");
const [meta, spRaw, grRaw, gdpPcRaw, rdRaw, milRaw, gcfRaw, popRaw] = await Promise.all([
  fetchMeta(),
  fetchWB("GC.XPN.TOTL.GD.ZS"),
  fetchWB("NY.GDP.MKTP.KD.ZG"),
  fetchWB("NY.GDP.PCAP.KD"),
  fetchWB("GB.XPD.RSDV.GD.ZS"),
  fetchWB("MS.MIL.XPND.GD.ZS"),
  fetchWB("NE.GDI.TOTL.ZS"),   // gross capital formation, % GDP
  fetchWB("SP.POP.GROW"),       // population growth, annual %
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
  const c = it.countryiso3code, y = +it.date;
  if (!gdpPcByYear[c]) gdpPcByYear[c] = {};
  gdpPcByYear[c][y] = it.value;
}
for (const code of Object.keys(countries)) {
  const ys = gdpPcByYear[code]; if (!ys) continue;
  const earliest = Math.min(...Object.keys(ys).map(Number));
  countries[code].gdpPc = ys[earliest];
}
const rdBy = {}, milBy = {}, gcfBy = {}, popBy = {};
for (const it of rdRaw) if (it.value && +it.date >= DATE_START && +it.date <= DATE_END) (rdBy[it.countryiso3code] ??= []).push(it.value);
for (const it of milRaw) if (it.value && +it.date >= DATE_START && +it.date <= DATE_END) (milBy[it.countryiso3code] ??= []).push(it.value);
for (const it of gcfRaw) if (it.value && +it.date >= DATE_START && +it.date <= DATE_END) (gcfBy[it.countryiso3code] ??= []).push(it.value);
for (const it of popRaw) if (it.value && +it.date >= DATE_START && +it.date <= DATE_END) (popBy[it.countryiso3code] ??= []).push(it.value);

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
    gcf: gcfBy[code] ? avg(gcfBy[code]) : null,
    pop: popBy[code] ? avg(popBy[code]) : null,
  }));

console.log(`Clean dataset: ${dataPoints.length} countries`);

// ── Fit Stage 1 models on the FULL clean set (constant across scenarios) ──
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
  {
    const dp = dataPoints, n = dp.length;
    const s1 = dp.reduce((a, p) => a + p.spending, 0), s2 = dp.reduce((a, p) => a + p.spending ** 2, 0);
    const s3 = dp.reduce((a, p) => a + p.spending ** 3, 0), s4 = dp.reduce((a, p) => a + p.spending ** 4, 0);
    const g0 = dp.reduce((a, p) => a + p.growth, 0), g1 = dp.reduce((a, p) => a + p.spending * p.growth, 0), g2 = dp.reduce((a, p) => a + p.spending ** 2 * p.growth, 0);
    const A = [[n, s1, s2], [s1, s2, s3], [s2, s3, s4]], b = [g0, g1, g2];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const f = A[j][i] / A[i][i]; for (let k = 0; k < 3; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) x[i] = (b[i] - A[i].slice(i + 1).reduce((a, v, k) => a + v * x[i + 1 + k], 0)) / A[i][i];
    const [a, b1, b2] = x;
    models.push({ name: "Free Quadratic", k: 3, fn: s => a + b1 * s + b2 * s * s });
  }
  {
    const [a, b1] = gridSearch2D([0.1, 50], [-5, 5], (a, b1) => {
      let best = Infinity;
      for (let k = 0; k < 60; k++) {
        const b2 = -0.0001 - (0.2 - 0.0001) * k / 60;
        const ssRes = dataPoints.reduce((s, c) => s + (c.growth - (a + b1 * c.spending + b2 * c.spending ** 2)) ** 2, 0);
        const cv = dataPoints.length * Math.log(ssRes / dataPoints.length);
        if (cv < best) best = cv;
      }
      return best;
    }, 60);
    let bestB2 = -0.001, bestCost = Infinity;
    for (let k = 0; k < 200; k++) {
      const b2 = -0.0001 - (0.2 - 0.0001) * k / 200;
      const ssRes = dataPoints.reduce((s, c) => s + (c.growth - (a + b1 * c.spending + b2 * c.spending ** 2)) ** 2, 0);
      const cv = dataPoints.length * Math.log(ssRes / dataPoints.length);
      if (cv < bestCost) { bestCost = cv; bestB2 = b2; }
    }
    models.push({ name: "Quadratic", k: 3, fn: s => a + b1 * s + bestB2 * s * s });
  }
  return models;
}

const models = fitModels(dataPoints);

// ── Scenario runner ───────────────────────────────────────────────────────
function rank(label, subset, controls) {
  const xs = controls.map(ctrl => subset.map(c => c[ctrl.key]));
  const fitFn = (resids) => olsK(xs, resids).fitted;

  const results = models.map(m => {
    const stage1 = subset.map(c => m.fn(c.spending));
    const actuals = subset.map(c => c.growth);
    const r2s = r2(actuals, stage1);
    const resids = actuals.map((g, i) => g - stage1[i]);
    const stage2 = fitFn(resids);
    const combPreds = stage1.map((p, i) => p + stage2[i]);
    const r2c = r2(actuals, combPreds);
    return { name: m.name, r2s, r2c };
  }).sort((a, b) => b.r2c - a.r2c);

  console.log(`\n── ${label}  (N=${subset.length}, controls=${controls.map(c => c.label).join("+")}) ──`);
  console.log("Rank  Model              R²(spending)  Combined R²");
  results.forEach((r, i) => {
    console.log(`  ${i + 1}.  ${r.name.padEnd(18)} ${r.r2s.toFixed(4).padStart(11)}  ${r.r2c.toFixed(4).padStart(11)}`);
  });
  return results;
}

// Scenario A: original 2-control fit on countries with income + R&D (no military)
const withIncRd = dataPoints.filter(c => c.logGdpPcap !== null && c.rd !== null);
rank("A. 2 controls (income + R&D), no military requirement",
  withIncRd,
  [{ key: "rd", label: "R&D" }, { key: "logGdpPcap", label: "income" }]);

// Scenario B: NEW — 3 controls require all three (89 countries)
const withAll = dataPoints.filter(c => c.logGdpPcap !== null && c.rd !== null && c.mil !== null);
rank("B. 3 controls (R&D + military + income), strict subset",
  withAll,
  [{ key: "rd", label: "R&D" }, { key: "mil", label: "military" }, { key: "logGdpPcap", label: "income" }]);

// Scenario C: same 95-country subset as A, but include military as a 3rd
//   control. Countries missing military get its sample mean (mean-imputation).
const milMean = avg(withAll.map(c => c.mil));
const withIncRdImp = withIncRd.map(c => ({ ...c, mil: c.mil ?? milMean }));
rank("C. 3 controls, mean-impute missing military (keeps N=95)",
  withIncRdImp,
  [{ key: "rd", label: "R&D" }, { key: "mil", label: "military(imp)" }, { key: "logGdpPcap", label: "income" }]);

// Scenario D: 2 controls (income + R&D) but evaluated on the strict 89-country
//   subset — isolates the "shrinkage" effect from the "extra control" effect
rank("D. 2 controls (income + R&D), but on the 89-country military subset",
  withAll,
  [{ key: "rd", label: "R&D" }, { key: "logGdpPcap", label: "income" }]);

// Scenario E: per-control independent subsets — each ranking uses its own
//   maximal subset with just that one control. This is what option 3 would do.
function rank1(label, subset, ctrl) {
  const xs = subset.map(c => c[ctrl.key]);
  const results = models.map(m => {
    const stage1 = subset.map(c => m.fn(c.spending));
    const actuals = subset.map(c => c.growth);
    const r2s = r2(actuals, stage1);
    const resids = actuals.map((g, i) => g - stage1[i]);
    // Univariate OLS
    const mx = avg(xs), my = avg(resids);
    const dx = xs.map(v => v - mx), dy = resids.map(v => v - my);
    const sxx = dx.reduce((s, v) => s + v * v, 0);
    const sxy = dx.reduce((s, v, i) => s + v * dy[i], 0);
    const slope = sxx === 0 ? 0 : sxy / sxx;
    const ic = my - slope * mx;
    const stage2 = xs.map(v => ic + slope * v);
    const combPreds = stage1.map((p, i) => p + stage2[i]);
    const r2c = r2(actuals, combPreds);
    return { name: m.name, r2s, r2c };
  }).sort((a, b) => b.r2c - a.r2c);
  console.log(`\n── ${label}  (N=${subset.length}, control=${ctrl.label}) ──`);
  console.log("Rank  Model              R²(spending)  Combined R²");
  results.forEach((r, i) => {
    console.log(`  ${i + 1}.  ${r.name.padEnd(18)} ${r.r2s.toFixed(4).padStart(11)}  ${r.r2c.toFixed(4).padStart(11)}`);
  });
}

const withRd = dataPoints.filter(c => c.rd !== null);
const withMil = dataPoints.filter(c => c.mil !== null);
const withIncome = dataPoints.filter(c => c.logGdpPcap !== null);

console.log("\n========== Scenario E: per-control independent subsets ==========");
rank1("E1. R&D only — maximal subset", withRd, { key: "rd", label: "R&D" });
rank1("E2. Military only — maximal subset", withMil, { key: "mil", label: "military" });
rank1("E3. Income only — maximal subset", withIncome, { key: "logGdpPcap", label: "income" });

// ── Income-table candidates: which subset makes Power Law beat Inverse? ───
console.log("\n========== Income-table candidates ==========");
rank1("F1. Income, exclude N=113 (full clean)", withIncome, { key: "logGdpPcap", label: "income" });
rank1("F2. Income ∩ has R&D", withIncome.filter(c => c.rd !== null), { key: "logGdpPcap", label: "income" });
rank1("F3. Income ∩ has military", withIncome.filter(c => c.mil !== null), { key: "logGdpPcap", label: "income" });
rank1("F4. Income ∩ has R&D ∩ has military", withIncome.filter(c => c.rd !== null && c.mil !== null), { key: "logGdpPcap", label: "income" });
rank1("F5. Income ∩ has R&D OR has military", withIncome.filter(c => c.rd !== null || c.mil !== null), { key: "logGdpPcap", label: "income" });

// Scenario G: drop income — joint OLS on R&D + military only
const withRdMil = dataPoints.filter(c => c.rd !== null && c.mil !== null);
rank("G. 2 controls (R&D + military), no income",
  withRdMil,
  [{ key: "rd", label: "R&D" }, { key: "mil", label: "military" }]);

// ── Scenario H: try R&D + military + capital formation + population growth ──
console.log("\n========== Scenario H: 4-control variants ==========");

// Subset diagnostics
const haveAll4 = dataPoints.filter(c => c.rd !== null && c.mil !== null && c.gcf !== null && c.pop !== null);
const haveCore3 = dataPoints.filter(c => c.rd !== null && c.mil !== null && c.gcf !== null);
const haveAll5 = dataPoints.filter(c => c.rd !== null && c.mil !== null && c.gcf !== null && c.pop !== null && c.logGdpPcap !== null);

console.log(`N(R&D+mil+gcf+pop)         = ${haveAll4.length}`);
console.log(`N(R&D+mil+gcf)             = ${haveCore3.length}`);
console.log(`N(R&D+mil+gcf+pop+income)  = ${haveAll5.length}`);

rank("H1. R&D + military + capital + population (no income)",
  haveAll4,
  [
    { key: "rd", label: "R&D" },
    { key: "mil", label: "military" },
    { key: "gcf", label: "capital" },
    { key: "pop", label: "popgrowth" },
  ]);

rank("H2. R&D + military + capital (drop population, drop income)",
  haveCore3,
  [
    { key: "rd", label: "R&D" },
    { key: "mil", label: "military" },
    { key: "gcf", label: "capital" },
  ]);

rank("H3. R&D + military + capital + population + income (all 5)",
  haveAll5,
  [
    { key: "rd", label: "R&D" },
    { key: "mil", label: "military" },
    { key: "gcf", label: "capital" },
    { key: "pop", label: "popgrowth" },
    { key: "logGdpPcap", label: "income" },
  ]);

// Per-control R² of the new variables on their own
console.log("\n========== Per-control marginal R² (univariate) ==========");
const withGcf = dataPoints.filter(c => c.gcf !== null);
const withPop = dataPoints.filter(c => c.pop !== null);
rank1("I1. Capital formation only — maximal subset", withGcf, { key: "gcf", label: "capital" });
rank1("I2. Population growth only — maximal subset", withPop, { key: "pop", label: "popgrowth" });
