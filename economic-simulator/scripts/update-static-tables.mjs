// Reads the cached World Bank data, re-runs the greedy stepwise, and patches
// the static table in armey-curve.html so it stays in sync with the analysis.
//
// Run with: node scripts/update-static-tables.mjs
// (from inside the economic-simulator/ directory)
//
// Requires: scripts/cache/ populated by running scripts/ceiling-r2.mjs first.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  DATE_START, DATE_END, MIN_YEARS,
  EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT,
  avg, ols, gridSearch2D,
} from "../model-math.mjs";

const __dir  = dirname(fileURLToPath(import.meta.url));
const CACHE  = join(__dir, "cache");
const HTML   = resolve(__dir, "..", "armey-curve.html");

// ---------------------------------------------------------------------------
// Interpretation copy for each candidate variable key.
// Edit here to update the prose in the table without re-running analysis.
// ---------------------------------------------------------------------------
const INTERP = {
  logGdp:    "Beta-convergence: poorer countries grow faster conditional on spending",
  cap:       "Investment rate — countries that invest more grow faster",
  pop:       "More people = more total output (note: total GDP growth, not per-capita)",
  trade:     "More open economies tend to grow faster",
  infl:      "Inflation drag — high inflation erodes real returns on investment",
  ruleOfLaw: "Legal security for contracts and property enables private investment",
  corruption:"Clean institutions lower transaction costs and attract capital",
  govtEff:   "State capacity to deliver services and enforce policy",
  polStab:   "Political predictability reduces uncertainty and investment horizon",
  regQual:   "Business-friendly regulation supports productive entry and exit",
  voice:     "Accountability and freedom of expression correlate with durable institutions",
  secEnroll: "Basic human capital pipeline for the labour force",
  lifeExp:   "Healthy workers are more productive",
  terEnroll: "Human capital stock — higher education feeds productivity growth",
  fdi:       "Foreign investment brings capital and technology transfer",
  credit:    "Financial depth — but negative slope suggests over-financialisation drag at high levels",
  urban:     "Urbanisation correlates with structural transformation and productivity gains",
  curAcct:   "Surplus countries save and invest more domestically",
  rd:        "Negative slope: high-R&D countries are mature economies growing slowly \u2014 captures a development-stage effect not fully absorbed by initial income",
  remit:     "Negative slope: remittances flow to slow-growing economies as a safety valve, not a growth engine",
  elec:      "Infrastructure proxy \u2014 basic energy access enables productive activity",
  tax:       "Fiscal capacity signal; positive slope may capture institutional quality",
  mil:       "Positive slope: may reflect defense-led investment or reverse causality (richer/faster countries can afford more military)",
  energyUse: "Energy-intensive economies produce more \u2014 reflects industrialisation stage",
  elecKwh:   "Modern electricity infrastructure proxy correlated with productive capacity",
  renew:     "Renewable energy share \u2014 positive slope reflects energy diversification and long-run efficiency gains",
};

// ---------------------------------------------------------------------------
// Cache helpers (read-only — run ceiling-r2.mjs first to populate)
// ---------------------------------------------------------------------------
function readCache(indicator) {
  const path = join(CACHE, `wb_${indicator}.json`);
  if (!existsSync(path)) {
    console.error(`  [missing cache] ${indicator} — run ceiling-r2.mjs first`);
    return [];
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function readMeta() {
  const path = join(CACHE, "wb_meta.json");
  if (!existsSync(path)) throw new Error("wb_meta.json not found in cache. Run ceiling-r2.mjs first.");
  return JSON.parse(readFileSync(path, "utf8"));
}

// ---------------------------------------------------------------------------
// Data processing (mirrors ceiling-r2.mjs)
// ---------------------------------------------------------------------------
function periodAvg(raw) {
  const by = {};
  for (const item of raw) {
    if (item.value === null || item.value === undefined) continue;
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
    if (item.value === null || item.value === undefined) continue;
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

const get = (map, code) => map[code] ? avg(map[code]) : null;

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
console.log("Reading cached World Bank data...");

const meta      = readMeta();
const spRaw     = readCache("GC.XPN.TOTL.GD.ZS");
const grRaw     = readCache("NY.GDP.MKTP.KD.ZG");
const gdpPcRaw  = readCache("NY.GDP.PCAP.KD");
const tradeRaw  = readCache("NE.TRD.GNFS.ZS");
const popRaw    = readCache("SP.POP.GROW");
const inflRaw   = readCache("FP.CPI.TOTL.ZG");
const capRaw    = readCache("NE.GDI.TOTL.ZS");
const rlRaw     = readCache("RL.EST");
const ccRaw     = readCache("CC.EST");
const geRaw     = readCache("GE.EST");
const pvRaw     = readCache("PV.EST");
const rqRaw     = readCache("RQ.EST");
const vaRaw     = readCache("VA.EST");
const secRaw    = readCache("SE.SEC.ENRR");
const lifeRaw   = readCache("SP.DYN.LE00.IN");
const terRaw    = readCache("SE.TER.ENRR");
const fdiRaw    = readCache("BX.KLT.DINV.WD.GD.ZS");
const creditRaw = readCache("FS.AST.PRVT.GD.ZS");
const urbanRaw  = readCache("SP.URB.GROW");
const caRaw     = readCache("BN.CAB.XOKA.GD.ZS");
const rdRaw     = readCache("GB.XPD.RSDV.GD.ZS");
const remitRaw  = readCache("BX.TRF.PWKR.DT.GD.ZS");
const elecRaw   = readCache("EG.ELC.ACCS.ZS");
const taxRaw    = readCache("GC.TAX.TOTL.GD.ZS");
const milRaw    = readCache("MS.MIL.XPND.GD.ZS");
const energyRaw = readCache("EG.USE.PCAP.KG.OE");
const kwhRaw    = readCache("EG.USE.ELEC.KH.PC");
const renewRaw  = readCache("EG.FEC.RNEW.ZS");

const actualCodes = new Set(meta.filter(c => c.region?.id !== "NA").map(c => c.id));

const spAvg      = periodAvg(spRaw);
const grAvg      = periodAvg(grRaw);
const gdpPcSt    = startVal(gdpPcRaw);
const tradeAvg   = periodAvg(tradeRaw);
const popAvg     = periodAvg(popRaw);
const inflAvg    = periodAvg(inflRaw);
const capAvg     = periodAvg(capRaw);
const rlAvg      = periodAvg(rlRaw);
const ccAvg      = periodAvg(ccRaw);
const geAvg      = periodAvg(geRaw);
const pvAvg      = periodAvg(pvRaw);
const rqAvg      = periodAvg(rqRaw);
const vaAvg      = periodAvg(vaRaw);
const secAvg     = periodAvg(secRaw);
const lifeAvg    = periodAvg(lifeRaw);
const terAvg     = periodAvg(terRaw);
const fdiAvg     = periodAvg(fdiRaw);
const creditAvg  = periodAvg(creditRaw);
const urbanAvg   = periodAvg(urbanRaw);
const caAvg      = periodAvg(caRaw);
const rdAvg      = periodAvg(rdRaw);
const remitAvg   = periodAvg(remitRaw);
const elecAvg    = periodAvg(elecRaw);
const taxAvg     = periodAvg(taxRaw);
const milAvg     = periodAvg(milRaw);
const energyAvg  = periodAvg(energyRaw);
const kwhAvg     = periodAvg(kwhRaw);
const renewAvg   = periodAvg(renewRaw);

// Build dataset
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
    elec:      get(elecAvg,   code),
    tax:       get(taxAvg,    code),
    mil:       get(milAvg,    code),
    energyUse: get(energyAvg, code),
    elecKwh:   get(kwhAvg,    code),
    renew:     get(renewAvg,  code),
  });
}

console.log(`Clean dataset: ${dataPoints.length} countries`);

// ---------------------------------------------------------------------------
// Stage 1: power-law fit
// ---------------------------------------------------------------------------
const armeyFn = powerLawFit(dataPoints);
const meanGr  = avg(dataPoints.map(c => c.growth));
const ssTot   = dataPoints.reduce((s, c) => s + (c.growth - meanGr) ** 2, 0);
const ssRes1  = dataPoints.reduce((s, c) => s + (c.growth - armeyFn(c.spending)) ** 2, 0);
const r2base  = 1 - ssRes1 / ssTot;
console.log(`Stage 1 power-law R² = ${r2base.toFixed(4)}`);

// ---------------------------------------------------------------------------
// Greedy stepwise
// ---------------------------------------------------------------------------
const candidates = [
  { label: "R&D spending % GDP",                      key: "rd"         },
  { label: "Military expenditure % GDP",                  key: "mil"        },
  { label: "Capital formation % GDP",                     key: "cap"        },
  { label: "Population growth %",                         key: "pop"        },
  { label: "Domestic credit (private) % GDP",             key: "credit"     },
  { label: "Tertiary enrollment %",                       key: "terEnroll"  },
  { label: "ln(GDP/cap) \u2014 convergence",              key: "logGdp"     },
  { label: "Tax revenue % GDP",                           key: "tax"        },
  { label: "Remittances received % GDP",                  key: "remit"      },
  { label: "FDI inflows % GDP",                           key: "fdi"        },
  { label: "Renewable energy share %",                    key: "renew"      },
  { label: "Trade openness % GDP",                        key: "trade"      },
  { label: "Current account balance % GDP",               key: "curAcct"    },
  { label: "Inflation %",                                 key: "infl"       },
  { label: "WGI Rule of Law",                             key: "ruleOfLaw"  },
  { label: "WGI Control of Corruption",                   key: "corruption" },
  { label: "WGI Govt Effectiveness",                      key: "govtEff"    },
  { label: "WGI Political Stability",                     key: "polStab"    },
  { label: "WGI Regulatory Quality",                      key: "regQual"    },
  { label: "WGI Voice & Accountability",                  key: "voice"      },
  { label: "Secondary school enrollment %",               key: "secEnroll"  },
  { label: "Life expectancy",                             key: "lifeExp"    },
  { label: "Urban population growth %",                   key: "urban"      },
  { label: "Electricity access % population",             key: "elec"       },
  { label: "Energy use per capita (kg oil eq.)",          key: "energyUse"  },
  { label: "Electric power consumption (kWh/cap)",        key: "elecKwh"    },
];

let stepResiduals = dataPoints.map(c => c.growth - armeyFn(c.spending));
let cumR2 = r2base;
const remaining = [...candidates];
const entered = [];

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

  // Subtract the OLS-fitted contribution from residuals (using original data indices)
  const newResiduals = [...stepResiduals];
  for (let k = 0; k < bestResult.pairs.length; k++) {
    newResiduals[bestResult.pairs[k].j] -= bestResult.fitted[k];
  }

  // Cumulative R² from original total SS (matches ceiling-r2.mjs exactly)
  const ssResNew = newResiduals.reduce((s, r) => s + r ** 2, 0);
  const newR2 = 1 - ssResNew / ssTot;
  const margR2 = newR2 - cumR2;

  const chosen = remaining.splice(bestIdx, 1)[0];
  stepResiduals = newResiduals;
  cumR2 = newR2;

  entered.push({
    step,
    label:  chosen.label,
    key:    chosen.key,
    margR2,
    cumR2,
    n:      bestResult.n,
    slope:  bestResult.slope,
  });
}

// Everything left in remaining after the loop dropped out
const dropped = [...remaining];

const ceiling = cumR2;
console.log(`Ceiling R² = ${ceiling.toFixed(4)}, steps entered = ${entered.length}`);

// ---------------------------------------------------------------------------
// Generate HTML rows
// ---------------------------------------------------------------------------
function fmtSlope(s) {
  if (!isFinite(s)) return "—";
  const sign = s >= 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(s).toFixed(3)}`;
}
function fmtMargR2(v) {
  return `+${v.toFixed(4)}`;
}
function fmtCumR2(v) {
  return v.toFixed(4);
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const stepRows = entered.map(e => {
  const interp = escHtml(INTERP[e.key] ?? "");
  return `              <tr>
                <td style="padding:3px 8px">${e.step}</td>
                <td style="padding:3px 8px">${escHtml(e.label)}</td>
                <td style="padding:3px 8px">${fmtMargR2(e.margR2)}</td>
                <td style="padding:3px 8px">${fmtCumR2(e.cumR2)}</td>
                <td style="padding:3px 8px">${e.n}</td>
                <td style="padding:3px 8px">${fmtSlope(e.slope)}</td>
                <td style="padding:3px 8px">${interp}</td>
              </tr>`;
}).join("\n");

// Build "dropped" label list
const droppedNames = dropped.map(d => d.label);
const droppedRow = `              <tr style="color:rgba(255,255,255,0.35); font-style:italic;">
                <td style="padding:3px 8px">\u2014</td>
                <td style="padding:3px 8px">${escHtml(droppedNames.join(", "))}</td>
                <td style="padding:3px 8px">&lt;0.003 each</td>
                <td style="padding:3px 8px">\u2014</td>
                <td style="padding:3px 8px">\u2014</td>
                <td style="padding:3px 8px">\u2014</td>
                <td style="padding:3px 8px">Dropped \u2014 no marginal gain after the above variables are controlled</td>
              </tr>`;

const newRows = `${stepRows}\n${droppedRow}`;

// ---------------------------------------------------------------------------
// Patch armey-curve.html
// ---------------------------------------------------------------------------
let html = readFileSync(HTML, "utf8");

// Replace step rows between sentinels
html = html.replace(
  /<!-- STEPWISE-ROWS-START -->[\s\S]*?<!-- STEPWISE-ROWS-END -->/,
  `<!-- STEPWISE-ROWS-START -->\n${newRows}\n              <!-- STEPWISE-ROWS-END -->`
);

// Update inline sentinel values
const ceilingStr  = ceiling.toFixed(3);
const unexplained = `~${Math.round((1 - ceiling) * 100)}%`;
const nCandidates = String(candidates.length);
const nEntered    = String(entered.length);

html = html.replace(
  /<!-- STEPWISE-CEILING -->[\s\S]*?<!-- \/STEPWISE-CEILING -->/g,
  `<!-- STEPWISE-CEILING -->${ceilingStr}<!-- /STEPWISE-CEILING -->`
);
html = html.replace(
  /<!-- STEPWISE-UNEXPLAINED -->[\s\S]*?<!-- \/STEPWISE-UNEXPLAINED -->/g,
  `<!-- STEPWISE-UNEXPLAINED -->${unexplained}<!-- /STEPWISE-UNEXPLAINED -->`
);
html = html.replace(
  /<!-- STEPWISE-N-CANDIDATES -->[\s\S]*?<!-- \/STEPWISE-N-CANDIDATES -->/g,
  `<!-- STEPWISE-N-CANDIDATES -->${nCandidates}<!-- /STEPWISE-N-CANDIDATES -->`
);
html = html.replace(
  /<!-- STEPWISE-N-ENTERED -->[\s\S]*?<!-- \/STEPWISE-N-ENTERED -->/g,
  `<!-- STEPWISE-N-ENTERED -->${nEntered}<!-- /STEPWISE-N-ENTERED -->`
);

writeFileSync(HTML, html, "utf8");
console.log(`\nPatched: armey-curve.html`);
console.log(`  Entered: ${nEntered} variables, ceiling R² = ${ceilingStr}, unexplained = ${unexplained}`);
console.log(`  Dropped: ${droppedNames.join(", ")}`);
