// How high can R² go? Greedy stepwise with every available World Bank indicator.
// Tests the claim that ~42% of cross-country growth variation is irreducibly unexplained
// by standard macro data. Adds WGI governance indicators, education, health, FDI, urbanisation.
// Run with: node scripts/ceiling-r2.mjs
// Fetched data is cached under scripts/cache/ — delete the folder to force a refresh.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { DATE_START, DATE_END, MIN_YEARS, EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT, avg, r2, aic, ols, gridSearch2D } from '../model-math.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dir, "cache");
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR);

function cacheKey(name) { return join(CACHE_DIR, `${name}.json`); }

async function fetchWB(indicator) {
  const path = cacheKey(`wb_${indicator}`);
  if (existsSync(path)) {
    process.stdout.write(`  [cache] ${indicator}\n`);
    return JSON.parse(readFileSync(path, "utf8"));
  }
  process.stdout.write(`  [fetch] ${indicator}\n`);
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  const res = await fetch(url);
  const data = (await res.json())[1] ?? [];
  writeFileSync(path, JSON.stringify(data));
  return data;
}
async function fetchMeta() {
  const path = cacheKey("wb_meta");
  if (existsSync(path)) {
    process.stdout.write(`  [cache] country metadata\n`);
    return JSON.parse(readFileSync(path, "utf8"));
  }
  process.stdout.write(`  [fetch] country metadata\n`);
  const res = await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`);
  const data = (await res.json())[1] ?? [];
  writeFileSync(path, JSON.stringify(data));
  return data;
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

function powerLawFit(pts) {
  const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) => {
    const n = pts.length;
    const ssRes = pts.reduce((s, c) => s + (c.growth - b0 * Math.pow(Math.max(c.spending, 0.1), -a)) ** 2, 0);
    return n * Math.log(ssRes / n);
  });
  return x => b0 * Math.pow(Math.max(x, 0.1), -alpha);
}

// ---------------------------------------------------------------------------
// Fetch all indicators in parallel
// ---------------------------------------------------------------------------
console.log("Loading data (from cache if available, otherwise World Bank API)...");
console.log(`Cache dir: ${CACHE_DIR}\n`);

const [
  meta,
  spRaw, grRaw, gdpPcRaw,
  tradeRaw, popRaw, inflRaw, capRaw,
  rlRaw, ccRaw, geRaw, pvRaw, rqRaw, vaRaw,
  secRaw, lifeRaw, terRaw,
  fdiRaw, creditRaw,
  urbanRaw, caRaw,
  rdRaw, remitRaw, elecRaw, taxRaw, milRaw,
  energyUseRaw, elecKwhRaw, renewRaw,
] = await Promise.all([
  fetchMeta(),
  fetchWB("GC.XPN.TOTL.GD.ZS"),       // gov spending
  fetchWB("NY.GDP.MKTP.KD.ZG"),        // GDP growth
  fetchWB("NY.GDP.PCAP.KD"),           // GDP per capita (constant)
  fetchWB("NE.TRD.GNFS.ZS"),           // trade openness
  fetchWB("SP.POP.GROW"),              // population growth
  fetchWB("FP.CPI.TOTL.ZG"),           // inflation
  fetchWB("NE.GDI.TOTL.ZS"),           // gross capital formation % GDP
  fetchWB("RL.EST"),                   // WGI: Rule of Law
  fetchWB("CC.EST"),                   // WGI: Control of Corruption
  fetchWB("GE.EST"),                   // WGI: Government Effectiveness
  fetchWB("PV.EST"),                   // WGI: Political Stability
  fetchWB("RQ.EST"),                   // WGI: Regulatory Quality
  fetchWB("VA.EST"),                   // WGI: Voice & Accountability
  fetchWB("SE.SEC.ENRR"),              // Secondary school enrollment (gross %)
  fetchWB("SP.DYN.LE00.IN"),           // Life expectancy at birth
  fetchWB("SE.TER.ENRR"),              // Tertiary enrollment (gross %)
  fetchWB("BX.KLT.DINV.WD.GD.ZS"),    // FDI inflows % GDP
  fetchWB("FS.AST.PRVT.GD.ZS"),        // Domestic credit to private sector % GDP
  fetchWB("SP.URB.GROW"),              // Urban population growth
  fetchWB("BN.CAB.XOKA.GD.ZS"),        // Current account balance % GDP
  fetchWB("GB.XPD.RSDV.GD.ZS"),        // R&D spending % GDP
  fetchWB("BX.TRF.PWKR.DT.GD.ZS"),    // Remittances received % GDP
  fetchWB("EG.ELC.ACCS.ZS"),           // Electricity access % population
  fetchWB("GC.TAX.TOTL.GD.ZS"),        // Tax revenue % GDP
  fetchWB("MS.MIL.XPND.GD.ZS"),        // Military expenditure % GDP
  fetchWB("EG.USE.PCAP.KG.OE"),         // Energy use per capita (kg oil eq.)
  fetchWB("EG.USE.ELEC.KH.PC"),         // Electric power consumption per capita (kWh)
  fetchWB("EG.FEC.RNEW.ZS"),            // Renewable energy consumption % total
]);

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));

// Period averages for everything except GDP/cap (use start value for convergence)
const spAvg     = periodAvg(spRaw);
const grAvg     = periodAvg(grRaw);
const gdpPcSt   = startVal(gdpPcRaw);
const tradeAvg  = periodAvg(tradeRaw);
const popAvg    = periodAvg(popRaw);
const inflAvg   = periodAvg(inflRaw);
const capAvg    = periodAvg(capRaw);
const rlAvg     = periodAvg(rlRaw);
const ccAvg     = periodAvg(ccRaw);
const geAvg     = periodAvg(geRaw);
const pvAvg     = periodAvg(pvRaw);
const rqAvg     = periodAvg(rqRaw);
const vaAvg     = periodAvg(vaRaw);
const secAvg    = periodAvg(secRaw);
const lifeAvg   = periodAvg(lifeRaw);
const terAvg    = periodAvg(terRaw);
const fdiAvg    = periodAvg(fdiRaw);
const creditAvg = periodAvg(creditRaw);
const urbanAvg  = periodAvg(urbanRaw);
const caAvg     = periodAvg(caRaw);
const rdAvg     = periodAvg(rdRaw);
const remitAvg  = periodAvg(remitRaw);
const elecAvg   = periodAvg(elecRaw);
const taxAvg    = periodAvg(taxRaw);
const milAvg       = periodAvg(milRaw);
const energyUseAvg = periodAvg(energyUseRaw);
const elecKwhAvg   = periodAvg(elecKwhRaw);
const renewAvg     = periodAvg(renewRaw);

const get = (map, code) => map[code] ? avg(map[code]) : null;

// Build dataset — mirrors compare-curves.mjs exactly:
// iterate spending raw to initialise, then join growth, then filter.
const countries = {};
for (const item of spRaw) {
  if (!item.value || !item.countryiso3code) continue;
  const y = +item.date;
  if (y < DATE_START || y > DATE_END) continue;
  const code = item.countryiso3code;
  if (!countries[code]) countries[code] = { sp: [], gr: [] };
  countries[code].sp.push(item.value);
}
for (const item of grRaw) {
  if (!item.value || !item.countryiso3code) continue;
  const y = +item.date;
  if (y < DATE_START || y > DATE_END) continue;
  const code = item.countryiso3code;
  if (countries[code]) countries[code].gr.push(item.value);
}

const dataPoints = [];
for (const [code, d] of Object.entries(countries)) {
  if (!actualCodes.has(code)) continue;
  if (EXCLUDED.has(code) || CONFLICT.has(code) || GDP_DIST.has(code) || EXT_FUNDED.has(code) || RESOURCE_DEP.has(code)) continue;
  if (d.sp.length < MIN_YEARS || d.gr.length < MIN_YEARS) continue;
  const spending = avg(d.sp);
  const growth   = avg(d.gr);
  const gdpPc    = gdpPcSt[code];
  dataPoints.push({
    code,
    spending,
    growth,
    logGdp:    gdpPc ? Math.log(gdpPc) : null,
    trade:     get(tradeAvg,  code),
    pop:       get(popAvg,    code),
    infl:      get(inflAvg,   code),
    cap:       get(capAvg,    code),
    ruleOfLaw: get(rlAvg,     code),
    corruption:get(ccAvg,     code),
    govtEff:   get(geAvg,     code),
    polStab:   get(pvAvg,     code),
    regQual:   get(rqAvg,     code),
    voice:     get(vaAvg,     code),
    secEnroll: get(secAvg,    code),
    lifeExp:   get(lifeAvg,   code),
    terEnroll: get(terAvg,    code),
    fdi:       get(fdiAvg,    code),
    credit:    get(creditAvg, code),
    urban:     get(urbanAvg,  code),
    curAcct:   get(caAvg,     code),
    rd:        get(rdAvg,     code),
    remit:     get(remitAvg,  code),
    elec:      get(elecAvg,      code),
    tax:       get(taxAvg,       code),
    mil:       get(milAvg,       code),
    energyUse: get(energyUseAvg, code),
    elecKwh:   get(elecKwhAvg,   code),
    renew:     get(renewAvg,     code),
  });
}

console.log(`Clean dataset: ${dataPoints.length} countries\n`);

// Stage 1: power-law spending fit
const armeyFn = powerLawFit(dataPoints);
const meanGr = avg(dataPoints.map(c => c.growth));
const ssTot  = dataPoints.reduce((s, c) => s + (c.growth - meanGr) ** 2, 0);
const ssRes1 = dataPoints.reduce((s, c) => s + (c.growth - armeyFn(c.spending)) ** 2, 0);
const r2_1   = 1 - ssRes1 / ssTot;
console.log(`Stage 1 — Power Law (spending only):  R² = ${r2_1.toFixed(4)}\n`);

// Candidate variables for stepwise
const candidates = [
  { label: "ln(GDP/cap) — convergence",       key: "logGdp"     },
  { label: "Capital formation % GDP",          key: "cap"        },
  { label: "Population growth %",              key: "pop"        },
  { label: "Trade openness % GDP",             key: "trade"      },
  { label: "Inflation %",                      key: "infl"       },
  { label: "WGI Rule of Law",                  key: "ruleOfLaw"  },
  { label: "WGI Control of Corruption",        key: "corruption" },
  { label: "WGI Govt Effectiveness",           key: "govtEff"    },
  { label: "WGI Political Stability",          key: "polStab"    },
  { label: "WGI Regulatory Quality",           key: "regQual"    },
  { label: "WGI Voice & Accountability",       key: "voice"      },
  { label: "Secondary school enrollment %",    key: "secEnroll"  },
  { label: "Life expectancy",                  key: "lifeExp"    },
  { label: "Tertiary enrollment %",            key: "terEnroll"  },
  { label: "FDI inflows % GDP",               key: "fdi"        },
  { label: "Domestic credit (private) % GDP", key: "credit"     },
  { label: "Urban population growth %",        key: "urban"      },
  { label: "Current account balance % GDP",    key: "curAcct"    },
  { label: "R&D spending % GDP",                key: "rd"         },
  { label: "Remittances received % GDP",        key: "remit"      },
  { label: "Electricity access % population",   key: "elec"       },
  { label: "Tax revenue % GDP",                 key: "tax"        },
  { label: "Military expenditure % GDP",        key: "mil"        },
  { label: "Energy use per capita (kg oil eq.)", key: "energyUse"  },
  { label: "Electric power consumption (kWh/cap)",key: "elecKwh"   },
  { label: "Renewable energy share %",           key: "renew"      },
];

// Greedy stepwise — add whichever variable reduces residual SS the most
let stepResiduals = dataPoints.map(c => c.growth - armeyFn(c.spending));
let stepR2 = r2_1;
const remaining = [...candidates];

console.log(`Greedy stepwise — each row adds the single best remaining variable\n`);
console.log(`${"Step".padEnd(5)} ${"Variable".padEnd(40)} ${"Marg R²".padStart(8)}  ${"Cum R²".padStart(8)}  ${"N".padStart(4)}  Slope`);
console.log("-".repeat(90));

for (let step = 1; step <= candidates.length; step++) {
  let bestGain = -Infinity, bestIdx = -1, bestResult = null;

  for (let i = 0; i < remaining.length; i++) {
    const key = remaining[i].key;
    const pairs = dataPoints
      .map((c, j) => ({ x: c[key], y: stepResiduals[j], j }))
      .filter(p => p.x !== null && isFinite(p.x) && isFinite(p.y));
    if (pairs.length < 20) continue;
    const { r2, slope, fitted } = ols(pairs.map(p => p.x), pairs.map(p => p.y));
    if (r2 > bestGain) {
      bestGain = r2;
      bestIdx = i;
      bestResult = { pairs, fitted, slope, n: pairs.length };
    }
  }

  if (bestIdx === -1 || bestGain < 0.003) break;

  // Apply best variable: subtract its OLS-fitted contribution from residuals
  const newResiduals = [...stepResiduals];
  for (let k = 0; k < bestResult.pairs.length; k++) {
    newResiduals[bestResult.pairs[k].j] -= bestResult.fitted[k];
  }

  const ssResNew = newResiduals.reduce((s, r) => s + r ** 2, 0);
  const newR2 = 1 - ssResNew / ssTot;
  const gain = newR2 - stepR2;

  const label = remaining[bestIdx].label;
  console.log(
    `${String(step).padEnd(5)} ${label.padEnd(40)} ${gain.toFixed(4).padStart(8)}  ${newR2.toFixed(4).padStart(8)}  ${String(bestResult.n).padStart(4)}  ${bestResult.slope.toFixed(4)}`
  );

  stepResiduals = newResiduals;
  stepR2 = newR2;
  remaining.splice(bestIdx, 1);
}

console.log("-".repeat(90));
console.log(`\nCeiling R² with all entered variables: ${stepR2.toFixed(4)}`);
console.log(`Unexplained:                           ${((1 - stepR2) * 100).toFixed(1)}%`);
console.log(`\nThis unexplained share represents growth variation not recoverable`);
console.log(`from standard World Bank macro+governance data:`);
console.log(`  - Institutions not captured by WGI (informal norms, path dependence)`);
console.log(`  - Geography & disease burden (Sachs et al.)`);
console.log(`  - Political shocks & crises within the sample window`);
console.log(`  - GDP measurement error (est. ±20-30% in many developing countries)`);
console.log(`  - Culture & history`);
