// Test script: fetch World Bank data, fit Armey model, run Stage 2 convergence OLS
// Run with: node scripts/test-convergence.mjs

const DATE_START = 2005;
const DATE_END = 2023;
const MIN_YEARS = 3;

// --- Fetch helpers ---
async function fetchWB(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  const json = await res.json();
  return json[1] ?? [];
}

async function fetchMeta() {
  const res = await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`);
  const json = await res.json();
  return json[1] ?? [];
}

// --- Country exclusion lists (mirrors armey-curve.html) ---
const EXCLUDED = new Set(["AFG", "SSD", "SOM", "YEM", "SYR", "ERI", "PRK", "NRU"]);
const RESOURCE_DEP = new Set(["AZE", "KWT", "ARE", "SAU", "QAT", "OMN", "TTO", "GNQ", "GAB", "NOR", "KAZ", "TKM", "UZB", "AGO", "COG", "BHR", "IRQ", "LBY", "VEN", "IRN", "BOL", "ECU", "PNG", "MNG", "ZMB", "BWA", "GUY", "MDV"]);
const EXT_FUNDED = new Set(["KIR", "MHL", "FSM", "TLS", "PLW"]);
const GDP_DISTORTED = new Set(["IRL", "MLT", "LUX", "SMR"]);
const CONFLICT = new Set(["SDN", "CAF", "UKR", "MLI", "MDG", "LBN", "ETH", "GRC"]);

// --- Build per-country averages ---
function buildAverages(spendingRaw, growthRaw, gdpPcRaw) {
  const countries = {};

  for (const item of spendingRaw) {
    if (item.value === null) continue;
    if (item.date < DATE_START || item.date > DATE_END) continue;
    const code = item.countryiso3code;
    if (!code) continue;
    if (!countries[code]) countries[code] = { name: item.country?.value, spending: [], growth: [], gdpPcStart: null };
    countries[code].spending.push(item.value);
  }

  for (const item of growthRaw) {
    if (item.value === null) continue;
    if (item.date < DATE_START || item.date > DATE_END) continue;
    const code = item.countryiso3code;
    if (!code || !countries[code]) continue;
    countries[code].growth.push(item.value);
  }

  // Period-start GDP/cap
  for (const item of gdpPcRaw) {
    if (item.value === null) continue;
    const code = item.countryiso3code;
    if (!code || !countries[code]) continue;
    if (item.date === DATE_START && !countries[code].gdpPcStart) {
      countries[code].gdpPcStart = item.value;
    }
  }
  // Fallback ±2 years
  for (const item of gdpPcRaw) {
    if (item.value === null) continue;
    const code = item.countryiso3code;
    if (!code || !countries[code]) continue;
    if (!countries[code].gdpPcStart && item.date >= DATE_START - 2 && item.date <= DATE_START + 2) {
      countries[code].gdpPcStart = item.value;
    }
  }

  return countries;
}

// --- Armey model: power-law fit via grid search ---
function powerLaw(b0, alpha) {
  return x => b0 * Math.pow(Math.max(x, 0.1), -alpha);
}

function aic(fn, dataPoints, k) {
  const n = dataPoints.length;
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return n * Math.log(ssRes / n) + 2 * k;
}

function gridSearch(b0Range, alphaRange, dataPoints, N = 60) {
  let bestAic = Infinity, bestB0 = 1, bestAlpha = 1.5;
  for (let i = 0; i < N; i++) {
    const b0 = b0Range[0] + (b0Range[1] - b0Range[0]) * i / N;
    for (let j = 0; j < N; j++) {
      const alpha = alphaRange[0] + (alphaRange[1] - alphaRange[0]) * j / N;
      const fn = powerLaw(b0, alpha);
      const a = aic(fn, dataPoints, 2);
      if (a < bestAic) { bestAic = a; bestB0 = b0; bestAlpha = alpha; }
    }
  }
  return { b0: bestB0, alpha: bestAlpha, aic: bestAic };
}

// --- OLS ---
function ols(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const fitted = xs.map(x => intercept + slope * x);
  const ssTot = ys.reduce((s, v) => s + (v - my) ** 2, 0);
  const ssRes = ys.reduce((s, v, i) => s + (v - fitted[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

// --- R² of a model on data ---
function r2Of(fn, dataPoints) {
  const mean = dataPoints.reduce((s, c) => s + c.growth, 0) / dataPoints.length;
  const ssTot = dataPoints.reduce((s, c) => s + (c.growth - mean) ** 2, 0);
  const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

// --- Main ---
console.log("Fetching World Bank data...");
const [meta, spendingRaw, growthRaw, gdpPcRaw] = await Promise.all([
  fetchMeta(),
  fetchWB("GC.XPN.TOTL.GD.ZS"),
  fetchWB("NY.GDP.MKTP.KD.ZG"),
  fetchWB("NY.GDP.PCAP.KD"),
]);

const hiCountries = new Set(
  meta.filter(c => c.region?.id !== "NA" && c.incomeLevel?.id === "HIC").map(c => c.id)
);

const raw = buildAverages(spendingRaw, growthRaw, gdpPcRaw);

// Build set of actual country codes (not regional aggregates) from metadata
const actualCountryCodes = new Set(
  meta.filter(c => c.region?.id !== "NA").map(c => c.id)
);

// Filter to clean dataset: actual countries only, no excluded, min years, both spending+growth available
const dataPoints = Object.entries(raw)
  .filter(([code, d]) =>
    actualCountryCodes.has(code) &&
    !EXCLUDED.has(code) &&
    !CONFLICT.has(code) &&
    !GDP_DISTORTED.has(code) &&
    !EXT_FUNDED.has(code) &&
    !RESOURCE_DEP.has(code) &&
    d.spending.length >= MIN_YEARS &&
    d.growth.length >= MIN_YEARS
  )
  .map(([code, d]) => ({
    code,
    name: d.name,
    spending: d.spending.reduce((s, v) => s + v, 0) / d.spending.length,
    growth: d.growth.reduce((s, v) => s + v, 0) / d.growth.length,
    logGdpPcap: d.gdpPcStart ? Math.log(d.gdpPcStart) : null,
    developed: hiCountries.has(code),
  }));

console.log(`\nClean dataset: ${dataPoints.length} countries`);

// --- Stage 1: Armey power-law fit ---
const { b0, alpha, aic: bestAic } = gridSearch([0.5, 2000], [0.1, 5], dataPoints, 80);
const armeyFn = powerLaw(b0, alpha);
const r2Armey = r2Of(armeyFn, dataPoints);

console.log(`\nStage 1 — Armey power-law best fit:`);
console.log(`  growth = ${b0.toFixed(2)} × spending^(-${alpha.toFixed(3)})`);
console.log(`  R²     = ${r2Armey.toFixed(4)}`);
console.log(`  AIC    = ${bestAic.toFixed(2)}`);

// --- Stage 2: residuals vs log GDP/cap ---
const withIncome = dataPoints.filter(c => c.logGdpPcap !== null);
const residuals = withIncome.map(c => c.growth - armeyFn(c.spending));
const xs = withIncome.map(c => c.logGdpPcap);
const { slope, intercept, r2: r2Income } = ols(xs, residuals);

console.log(`\nStage 2 — Residuals vs ln(GDP per capita):`);
console.log(`  N      = ${withIncome.length} countries`);
console.log(`  slope  = ${slope.toFixed(4)} pp per ln-unit`);
console.log(`  R²     = ${r2Income.toFixed(4)}`);
console.log(`  Direction: ${slope < 0 ? "CONVERGENCE (negative — poorer countries outperform)" : "divergence (positive)"}`);

// --- Combined approximate R² (spending + income) ---
// Run OLS on residuals, compute how much variance remains unexplained
const fittedIncome = xs.map(x => intercept + slope * x);
const allActuals = withIncome.map(c => c.growth);
const meanAll = allActuals.reduce((s, v) => s + v, 0) / allActuals.length;
const ssTotAll = allActuals.reduce((s, v) => s + (v - meanAll) ** 2, 0);
const ssResBoth = withIncome.reduce((s, c, i) => s + (c.growth - armeyFn(c.spending) - fittedIncome[i]) ** 2, 0);
const r2Combined = Math.max(0, 1 - ssResBoth / ssTotAll);

console.log(`\nCombined R² (spending + income, additive): ${r2Combined.toFixed(4)}`);
console.log(`Remaining unexplained variance: ${((1 - r2Combined) * 100).toFixed(1)}%`);

// --- Biggest positive and negative residuals ---
const sorted = withIncome
  .map((c, i) => ({ ...c, residual: residuals[i] }))
  .sort((a, b) => b.residual - a.residual);

console.log(`\nTop 10 positive residuals (outperformers vs Armey model):`);
sorted.slice(0, 10).forEach(c =>
  console.log(`  ${c.name.padEnd(35)} spending=${c.spending.toFixed(1)}%  growth=${c.growth.toFixed(2)}%  residual=+${c.residual.toFixed(2)}pp  lnGDP=${c.logGdpPcap.toFixed(2)}`)
);

console.log(`\nTop 10 negative residuals (underperformers):`);
sorted.slice(-10).reverse().forEach(c =>
  console.log(`  ${c.name.padEnd(35)} spending=${c.spending.toFixed(1)}%  growth=${c.growth.toFixed(2)}%  residual=${c.residual.toFixed(2)}pp  lnGDP=${c.logGdpPcap.toFixed(2)}`)
);
