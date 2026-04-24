// Compare all curve models: Stage 1 R² and Stage 1+2 combined R² (spending + initial income)
// Run with: node scripts/compare-curves.mjs

import { DATE_START, DATE_END, MIN_YEARS, EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT, avg, r2, aic, ols, gridSearch2D } from '../model-math.mjs';

async function fetchWB(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  return ((await res.json())[1]) ?? [];
}
async function fetchMeta() {
  return ((await (await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`)).json())[1]) ?? [];
}

// All models: return { name, k, fn, params }
function fitModels(dataPoints) {
  const cost = (fn) => {
    const n = dataPoints.length;
    const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
    return n * Math.log(ssRes / n);
  };

  const models = [];

  // Power law: b0 * x^(-alpha)
  {
    const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) => cost(x => b0 * Math.pow(Math.max(x, 0.1), -a)));
    models.push({ name: "Power Law", k: 2, fn: x => b0 * Math.pow(Math.max(x, 0.1), -alpha), params: `b0=${b0.toFixed(2)}, α=${alpha.toFixed(3)}` });
  }

  // Inverse: a + b/x
  {
    const [b, a] = gridSearch2D([0.1, 5000], [-10, 10], (b, a) => cost(x => a + b / Math.max(x, 0.1)));
    models.push({ name: "Inverse (a + b/x)", k: 2, fn: x => a + b / Math.max(x, 0.1), params: `a=${a.toFixed(3)}, b=${b.toFixed(2)}` });
  }

  // Log-linear: b0 - alpha*ln(x+1)
  {
    const [b0, alpha] = gridSearch2D([0.1, 50], [0.01, 20], (b0, a) => cost(x => b0 - a * Math.log(x + 1)));
    models.push({ name: "Log-Linear", k: 2, fn: x => b0 - alpha * Math.log(x + 1), params: `b0=${b0.toFixed(3)}, α=${alpha.toFixed(3)}` });
  }

  // Exponential: b0 * exp(-lambda*x)
  {
    const [b0, lambda] = gridSearch2D([0.5, 2000], [0.001, 1], (b0, l) => cost(x => b0 * Math.exp(-l * x)));
    models.push({ name: "Exponential", k: 2, fn: x => b0 * Math.exp(-lambda * x), params: `b0=${b0.toFixed(2)}, λ=${lambda.toFixed(4)}` });
  }

  // Linear: b0 + slope*x
  {
    const [b0, slope] = gridSearch2D([0.1, 50], [-3, 0], (b0, s) => cost(x => b0 + s * x));
    models.push({ name: "Linear", k: 2, fn: x => b0 + slope * x, params: `b0=${b0.toFixed(3)}, slope=${slope.toFixed(4)}` });
  }

  // Free quadratic: OLS closed form
  {
    const dp = dataPoints;
    const n = dp.length;
    const s1 = dp.reduce((a, p) => a + p.spending, 0), s2 = dp.reduce((a, p) => a + p.spending ** 2, 0);
    const s3 = dp.reduce((a, p) => a + p.spending ** 3, 0), s4 = dp.reduce((a, p) => a + p.spending ** 4, 0);
    const g0 = dp.reduce((a, p) => a + p.growth, 0), g1 = dp.reduce((a, p) => a + p.spending * p.growth, 0), g2 = dp.reduce((a, p) => a + p.spending ** 2 * p.growth, 0);
    const A = [[n, s1, s2], [s1, s2, s3], [s2, s3, s4]], b = [g0, g1, g2];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const f = A[j][i] / A[i][i]; for (let k2 = 0; k2 < 3; k2++)A[j][k2] -= f * A[i][k2]; b[j] -= f * b[i]; }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) { x[i] = (b[i] - A[i].slice(i + 1).reduce((a, v, k2) => a + v * x[i + 1 + k2], 0)) / A[i][i]; }
    const [a, b1, b2] = x;
    models.push({ name: "Free Quadratic", k: 3, fn: s => a + b1 * s + b2 * s * s, params: `a=${a.toFixed(3)}, b1=${b1.toFixed(4)}, b2=${b2.toFixed(5)}` });
  }

  // Constrained quadratic (b2 < 0): grid search over a, b1 with b2 forced negative
  // Form: a + b1*x + b2*x^2, b2 in [-0.1, -0.0001]
  {
    const [a, b1] = gridSearch2D([0.1, 50], [-5, 5], (a, b1) => {
      // For each (a, b1), find best b2 < 0 by inner 1D grid
      let best = Infinity, bestB2 = -0.001;
      const B2_STEPS = 60;
      for (let k2 = 0; k2 < B2_STEPS; k2++) {
        const b2 = -0.0001 - (0.2 - 0.0001) * k2 / B2_STEPS;
        const ssRes = dataPoints.reduce((s, c) => s + (c.growth - (a + b1 * c.spending + b2 * c.spending ** 2)) ** 2, 0);
        const c = dataPoints.length * Math.log(ssRes / dataPoints.length);
        if (c < best) { best = c; bestB2 = b2; }
      }
      return best;
    }, 60);
    // Recover best b2 for this (a, b1)
    let bestB2 = -0.001, bestCost = Infinity;
    for (let k2 = 0; k2 < 200; k2++) {
      const b2 = -0.0001 - (0.2 - 0.0001) * k2 / 200;
      const ssRes = dataPoints.reduce((s, c) => s + (c.growth - (a + b1 * c.spending + b2 * c.spending ** 2)) ** 2, 0);
      const c = dataPoints.length * Math.log(ssRes / dataPoints.length);
      if (c < bestCost) { bestCost = c; bestB2 = b2; }
    }
    const b2 = bestB2;
    models.push({ name: "Quadratic (b2<0)", k: 3, fn: s => a + b1 * s + b2 * s * s, params: `a=${a.toFixed(3)}, b1=${b1.toFixed(4)}, b2=${b2.toFixed(5)}` });
  }

  return models;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("Fetching data...");
const [meta, spRaw, grRaw, gdpPcRaw] = await Promise.all([
  fetchMeta(),
  fetchWB("GC.XPN.TOTL.GD.ZS"),
  fetchWB("NY.GDP.MKTP.KD.ZG"),
  fetchWB("NY.GDP.PCAP.KD"),
]);

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));

// Build per-country averages
const countries = {};
for (const item of spRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (!countries[code]) countries[code] = { name: item.country?.value ?? code, sp: [], gr: [], gdpPc: null };
  countries[code].sp.push(item.value);
}
for (const item of grRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (countries[code]) countries[code].gr.push(item.value);
}
for (const item of gdpPcRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (Math.abs(item.date - DATE_START) <= 2) {
    const code = item.countryiso3code;
    if (countries[code] && !countries[code].gdpPc) countries[code].gdpPc = item.value;
  }
}

const dataPoints = Object.entries(countries)
  .filter(([code, d]) =>
    actualCodes.has(code) &&
    !EXCLUDED.has(code) && !CONFLICT.has(code) && !GDP_DIST.has(code) &&
    !EXT_FUNDED.has(code) && !RESOURCE_DEP.has(code) &&
    d.sp.length >= MIN_YEARS && d.gr.length >= MIN_YEARS
  )
  .map(([, d]) => ({
    name: d.name,
    spending: avg(d.sp),
    growth: avg(d.gr),
    logGdpPcap: d.gdpPc ? Math.log(d.gdpPc) : null,
  }));

console.log(`Clean dataset: ${dataPoints.length} countries\n`);

const models = fitModels(dataPoints);
const actuals = dataPoints.map(c => c.growth);

// For each model: compute Stage 1 R², then Stage 2 (add income on residuals)
console.log(
  `${"Model".padEnd(20)} ${"k".padStart(2)}  ${"R²(spending)".padStart(13)}  ${"R²(+income)".padStart(12)}  ${"AIC".padStart(8)}  Params`
);
console.log("-".repeat(100));

const withIncome = dataPoints.filter(c => c.logGdpPcap !== null);
const withIncomeIdx = dataPoints.map((c, i) => c.logGdpPcap !== null ? i : -1).filter(i => i >= 0);

const results = [];
for (const model of models) {
  const preds = dataPoints.map(c => model.fn(c.spending));
  const r2s = r2(actuals, preds);
  const aicVal = aic(actuals, preds, model.k);

  // Stage 2: OLS on residuals vs logGdpPcap (only countries with income data)
  const residuals = dataPoints.map((c, i) => c.growth - preds[i]);
  const incomeResiduals = withIncomeIdx.map(i => residuals[i]);
  const incomeXs = withIncomeIdx.map(i => dataPoints[i].logGdpPcap);
  const { slope, intercept } = ols(incomeXs, incomeResiduals);
  const incomeFitted = incomeXs.map(x => intercept + slope * x);

  // Combined predictions for income subset
  const combinedActuals = withIncomeIdx.map(i => actuals[i]);
  const combinedPreds = withIncomeIdx.map((idx, k) => preds[idx] + incomeFitted[k]);
  const r2combined = r2(combinedActuals, combinedPreds);

  results.push({ model, r2s, aicVal, r2combined });
  console.log(
    `${model.name.padEnd(20)} ${String(model.k).padStart(2)}  ${r2s.toFixed(4).padStart(13)}  ${r2combined.toFixed(4).padStart(12)}  ${aicVal.toFixed(2).padStart(8)}  ${model.params}`
  );
}

// Sort by combined R²
results.sort((a, b) => b.r2combined - a.r2combined);
console.log(`\nRanked by combined R² (spending + income):`);
results.forEach((r, i) =>
  console.log(`  ${i + 1}. ${r.model.name.padEnd(20)} R²(spending)=${r.r2s.toFixed(4)}  R²(+income)=${r.r2combined.toFixed(4)}  AIC=${r.r2s > 0 ? r.aicVal.toFixed(2) : "n/a"}`)
);
