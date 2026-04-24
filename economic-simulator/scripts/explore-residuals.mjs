// Explore what's driving residuals after controlling for spending + income
// Run with: node scripts/explore-residuals.mjs

const DATE_START = 2005;
const DATE_END = 2023;
const MIN_YEARS = 3;

async function fetchWB(indicator) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  const json = await res.json();
  return json[1] ?? [];
}
async function fetchMeta() {
  const res = await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`);
  return (await res.json())[1] ?? [];
}

const EXCLUDED = new Set(["AFG", "SSD", "SOM", "YEM", "SYR", "ERI", "PRK", "NRU"]);
const RESOURCE_DEP = new Set(["AZE", "KWT", "ARE", "SAU", "QAT", "OMN", "TTO", "GNQ", "GAB", "NOR", "KAZ", "TKM", "UZB", "AGO", "COG", "BHR", "IRQ", "LBY", "VEN", "IRN", "BOL", "ECU", "PNG", "MNG", "ZMB", "BWA", "GUY", "MDV"]);
const EXT_FUNDED = new Set(["KIR", "MHL", "FSM", "TLS", "PLW"]);
const GDP_DISTORTED = new Set(["IRL", "MLT", "LUX", "SMR"]);
const CONFLICT = new Set(["SDN", "CAF", "UKR", "MLI", "MDG", "LBN", "ETH", "GRC"]);

function avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null; }
function periodAvg(raw, dateStart, dateEnd) {
  const byCountry = {};
  for (const item of raw) {
    if (item.value === null) continue;
    if (item.date < dateStart || item.date > dateEnd) continue;
    const code = item.countryiso3code;
    if (!code) continue;
    if (!byCountry[code]) byCountry[code] = [];
    byCountry[code].push(item.value);
  }
  return byCountry;
}
function startVal(raw, dateStart) {
  const byCountry = {};
  for (const item of raw) {
    if (item.value === null) continue;
    if (Math.abs(item.date - dateStart) <= 2) {
      const code = item.countryiso3code;
      if (!code) continue;
      if (!byCountry[code] || Math.abs(item.date - dateStart) < Math.abs(byCountry[code].date - dateStart)) {
        byCountry[code] = { value: item.value, date: item.date };
      }
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(byCountry)) out[k] = v.value;
  return out;
}

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
  return { slope, intercept, r2, fitted };
}

function powerLawFit(dataPoints) {
  let bestAic = Infinity, bestB0 = 1, bestAlpha = 1.5;
  for (let i = 0; i < 80; i++) {
    const b0 = 0.5 + (2000 - 0.5) * i / 80;
    for (let j = 0; j < 80; j++) {
      const alpha = 0.1 + (5 - 0.1) * j / 80;
      const fn = x => b0 * Math.pow(Math.max(x, 0.1), -alpha);
      const n = dataPoints.length;
      const ssRes = dataPoints.reduce((s, c) => s + (c.growth - fn(c.spending)) ** 2, 0);
      const a = n * Math.log(ssRes / n) + 2 * 2;
      if (a < bestAic) { bestAic = a; bestB0 = b0; bestAlpha = alpha; }
    }
  }
  return x => bestB0 * Math.pow(Math.max(x, 0.1), -bestAlpha);
}

console.log("Fetching data (spending, growth, GDP/cap, trade, population growth, inflation, capital formation)...");
const [meta, spRaw, grRaw, gdpPcRaw, tradeRaw, popGrRaw, inflRaw, capRaw] = await Promise.all([
  fetchMeta(),
  fetchWB("GC.XPN.TOTL.GD.ZS"),
  fetchWB("NY.GDP.MKTP.KD.ZG"),
  fetchWB("NY.GDP.PCAP.KD"),
  fetchWB("NE.TRD.GNFS.ZS"),          // trade openness
  fetchWB("SP.POP.GROW"),              // population growth
  fetchWB("FP.CPI.TOTL.ZG"),          // inflation
  fetchWB("NE.GDI.TOTL.ZS"),          // gross capital formation % GDP
]);

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));
const hiCodes = new Set(meta.filter(c => c.region?.id !== "NA" && c.incomeLevel?.id === "HIC").map(c => c.id));

const spAvg = periodAvg(spRaw, DATE_START, DATE_END);
const grAvg = periodAvg(grRaw, DATE_START, DATE_END);
const gdpPcStart = startVal(gdpPcRaw, DATE_START);
const tradeAvg = periodAvg(tradeRaw, DATE_START, DATE_END);
const popAvg = periodAvg(popGrRaw, DATE_START, DATE_END);
const inflAvg = periodAvg(inflRaw, DATE_START, DATE_END);
const capAvg = periodAvg(capRaw, DATE_START, DATE_END);

const allCodes = new Set([
  ...Object.keys(spAvg), ...Object.keys(grAvg)
]);

const dataPoints = [];
for (const code of allCodes) {
  if (!actualCodes.has(code)) continue;
  if (EXCLUDED.has(code) || CONFLICT.has(code) || GDP_DISTORTED.has(code) || EXT_FUNDED.has(code) || RESOURCE_DEP.has(code)) continue;
  const sp = spAvg[code];
  const gr = grAvg[code];
  if (!sp || !gr || sp.length < MIN_YEARS || gr.length < MIN_YEARS) continue;
  const spending = avg(sp);
  const growth = avg(gr);
  const gdpPc = gdpPcStart[code];
  const trade = tradeAvg[code] ? avg(tradeAvg[code]) : null;
  const pop = popAvg[code] ? avg(popAvg[code]) : null;
  const infl = inflAvg[code] ? avg(inflAvg[code]) : null;
  const cap = capAvg[code] ? avg(capAvg[code]) : null;
  dataPoints.push({ code, name: grRaw.find(r => r.countryiso3code === code)?.country?.value ?? code, spending, growth, logGdpPcap: gdpPc ? Math.log(gdpPc) : null, trade, pop, infl, cap });
}

console.log(`\nClean dataset: ${dataPoints.length} countries\n`);

// Stage 1: Armey fit
const armeyFn = powerLawFit(dataPoints);
const residuals1 = dataPoints.map(c => c.growth - armeyFn(c.spending));
const meanGr = dataPoints.reduce((s, c) => s + c.growth, 0) / dataPoints.length;
const ssTot = dataPoints.reduce((s, c) => s + (c.growth - meanGr) ** 2, 0);
const ssRes1 = residuals1.reduce((s, r) => s + r ** 2, 0);
const r2_1 = 1 - ssRes1 / ssTot;
console.log(`Stage 1 (spending only):          R² = ${r2_1.toFixed(4)}`);

// Stage 2: residuals vs each candidate variable
const candidates = [
  { name: "ln(GDP per capita)", key: "logGdpPcap" },
  { name: "Trade openness (% GDP)", key: "trade" },
  { name: "Population growth (%)", key: "pop" },
  { name: "Inflation (%)", key: "infl" },
  { name: "Capital formation (% GDP)", key: "cap" },
];

let currentResiduals = residuals1;
let currentR2 = r2_1;
let currentSsTot = ssTot;
let usedVars = [];

console.log(`\n${"Variable".padEnd(35)} R²(marginal)  N    Slope`);
console.log("-".repeat(70));
for (const cand of candidates) {
  const pairs = dataPoints
    .map((c, i) => ({ x: c[cand.key], y: currentResiduals[i] }))
    .filter(p => p.x !== null && p.x !== undefined && isFinite(p.x) && isFinite(p.y));
  if (pairs.length < 20) { console.log(`${cand.name.padEnd(35)} (insufficient data: ${pairs.length})`); continue; }
  const xs = pairs.map(p => p.x);
  const ys = pairs.map(p => p.y);
  const { r2, slope } = ols(xs, ys);
  const ssResTot = ys.reduce((s, v) => s + (v - ys.reduce((a, b) => a + b, 0) / ys.length) ** 2, 0);
  console.log(`${cand.name.padEnd(35)} ${r2.toFixed(4).padStart(12)}  ${String(pairs.length).padStart(3)}  ${slope.toFixed(4)}`);
}

// Now stepwise: add best variable at each step
console.log(`\n--- Stepwise addition (greedy) ---`);
let stepResiduals = [...residuals1];
let stepR2 = r2_1;
const available = [...candidates];
const chosen = [];

for (let step = 0; step < candidates.length; step++) {
  let bestR2Gain = -Infinity, bestCand = null, bestFitted = null;
  for (const cand of available) {
    const pairs = dataPoints
      .map((c, i) => ({ x: c[cand.key], y: stepResiduals[i], idx: i }))
      .filter(p => p.x !== null && p.x !== undefined && isFinite(p.x) && isFinite(p.y));
    if (pairs.length < 20) continue;
    const { r2: r2marg, fitted, slope } = ols(pairs.map(p => p.x), pairs.map(p => p.y));
    if (r2marg > bestR2Gain) { bestR2Gain = r2marg; bestCand = { ...cand, slope, n: pairs.length, pairs, fitted }; bestFitted = { pairs, fitted }; }
  }
  if (!bestCand || bestR2Gain < 0.005) break;

  // Update residuals
  const newResiduals = [...stepResiduals];
  for (let k = 0; k < bestCand.pairs.length; k++) {
    newResiduals[bestCand.pairs[k].idx] -= bestCand.fitted[k];
  }

  const ssResNew = newResiduals.reduce((s, r) => s + r ** 2, 0);
  const newR2 = 1 - ssResNew / ssTot;
  console.log(`  Add "${bestCand.name}": marginal R² gain = +${(newR2 - stepR2).toFixed(4)}, cumulative R² = ${newR2.toFixed(4)}, slope = ${bestCand.slope.toFixed(4)}, N = ${bestCand.n}`);

  stepResiduals = newResiduals;
  stepR2 = newR2;
  available.splice(available.indexOf(available.find(c => c.name === bestCand.name)), 1);
  chosen.push(bestCand.name);
}

console.log(`\nFinal cumulative R²: ${stepR2.toFixed(4)}`);
console.log(`Remaining unexplained: ${((1 - stepR2) * 100).toFixed(1)}%`);
