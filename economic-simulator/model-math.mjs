// Shared model math — single source of truth for browser and Node.js scripts.
//
// Browser: <script type="module"> imports gridSearch2D and assigns to window.
// Node:    scripts/compare-curves.mjs and scripts/ceiling-r2.mjs import directly.

// ── Date range & quality threshold ────────────────────────────────────────────
export const DATE_START = 2005;
export const DATE_END = 2023;
export const MIN_YEARS = 3;

// ── Exclusion sets ─────────────────────────────────────────────────────────────
// Countries excluded due to aid/conflict distortion
export const EXCLUDED = new Set([
  "AFG", "SSD", "SOM", "YEM", "SYR", "ERI", "PRK", "NRU",
]);

// Growth heavily driven by natural resource windfalls
export const RESOURCE_DEP = new Set([
  "AZE", "KWT", "ARE", "SAU", "QAT", "OMN", "TTO", "GNQ", "GAB", "NOR",
  "KAZ", "TKM", "UZB", "AGO", "COG", "BHR", "IRQ", "LBY", "VEN", "IRN",
  "BOL", "ECU", "PNG", "MNG", "ZMB", "BWA", "GUY", "MDV",
]);

// Spending substantially financed by external transfers (aid compacts, grants)
export const EXT_FUNDED = new Set(["KIR", "MHL", "FSM", "TLS", "PLW"]);

// GDP structurally decoupled from domestic fiscal policy (MNC profit-shifting, financial hubs)
export const GDP_DIST = new Set(["IRL", "MLT", "LUX", "SMR"]);

// Ongoing or recent severe conflict distorts growth independent of fiscal policy
export const CONFLICT = new Set(["SDN", "CAF", "UKR", "MLI", "MDG", "LBN", "ETH", "GRC"]);

// World Bank display names for EXCLUDED ISO3 codes — used by scripts that work
// with pre-processed (name-only) fallback data where ISO3 codes are unavailable.
export const EXCLUDED_NAMES = new Set([
  "Afghanistan",               // AFG
  "South Sudan",               // SSD
  "Somalia",                   // SOM
  "Yemen, Rep.",               // YEM
  "Syrian Arab Republic",      // SYR
  "Eritrea",                   // ERI
  "Korea, Dem. People's Rep.", // PRK
  "Nauru",                     // NRU
]);

// Display-name equivalents for exclusion sets that pre-date the conflictFragile /
// gdpDistorted / externallyFunded fields in older fallback-data.json snapshots.
// Used in getCountryDataToShow() as a belt-and-suspenders filter so that stale
// fallback data (which lacks boolean flags on these countries) is still filtered.
export const CONFLICT_NAMES = new Set([
  "Sudan",                     // SDN
  "Central African Republic",  // CAF
  "Ukraine",                   // UKR
  "Mali",                      // MLI
  "Madagascar",                // MDG
  "Lebanon",                   // LBN
  "Ethiopia",                  // ETH
  "Greece",                    // GRC
]);

export const GDP_DIST_NAMES = new Set([
  "Ireland",                   // IRL
  "Malta",                     // MLT
  "Luxembourg",                // LUX
  "San Marino",                // SMR
]);

export const EXT_FUNDED_NAMES = new Set([
  "Kiribati",                  // KIR
  "Marshall Islands",          // MHL
  "Micronesia, Fed. Sts.",     // FSM
  "Timor-Leste",               // TLS
  "Palau",                     // PLW
]);

// ── Math utilities ─────────────────────────────────────────────────────────────
export function avg(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Ordinary least squares regression.
 * Returns slope, intercept, fitted values, and R².
 */
export function ols(xs, ys) {
  const n = xs.length;
  const mx = avg(xs), my = avg(ys);
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const fitted = xs.map(x => intercept + slope * x);
  const ssTot = ys.reduce((s, v) => s + (v - my) ** 2, 0);
  const ssRes = ys.reduce((s, v, i) => s + (v - fitted[i]) ** 2, 0);
  return { slope, intercept, fitted, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

export function r2(actuals, predictions) {
  const mean = avg(actuals);
  const ssTot = actuals.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = actuals.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

export function aic(actuals, predictions, k) {
  const n = actuals.length;
  const ssRes = actuals.reduce((s, v, i) => s + (v - predictions[i]) ** 2, 0);
  return n * Math.log(ssRes / n) + 2 * k;
}

// ── Grid search ────────────────────────────────────────────────────────────────
/**
 * Two-parameter grid search (minimises costFn).
 *
 * @param {[number,number]} b0Range  [min, max] for first param — searched on LOG scale (must be > 0).
 * @param {[number,number]} pRange   [min, max] for second param — searched on linear scale.
 * @param {(b0:number, p:number) => number} costFn  Returns cost (lower = better). Return Infinity to skip.
 * @param {number} [N=80]  Grid size for coarse pass; fine pass re-runs at ±15% with same N.
 * @returns {[number, number]} [bestB0, bestP]
 */
export function gridSearch2D(b0Range, pRange, costFn, N = 80) {
  const [b0Min, b0Max] = b0Range;
  const [pMin, pMax] = pRange;

  // Coarse pass: log scale for b0 (handles wide ranges like [0.5, 2000]), linear for p
  const b0s = Array.from({ length: N }, (_, i) =>
    Math.exp(Math.log(b0Min) + (Math.log(b0Max) - Math.log(b0Min)) * i / (N - 1))
  );
  const ps = Array.from({ length: N }, (_, i) =>
    pMin + (pMax - pMin) * i / (N - 1)
  );

  let bestCost = Infinity, bestB0 = b0Min, bestP = pMin;
  for (const b0 of b0s) {
    for (const p of ps) {
      const cost = costFn(b0, p);
      if (isFinite(cost) && cost < bestCost) { bestCost = cost; bestB0 = b0; bestP = p; }
    }
  }

  // Fine pass: ±15% around best
  const b0Lo = bestB0 * 0.85, b0Hi = bestB0 * 1.15;
  const span = (pMax - pMin) * 0.15;
  const pLo = Math.max(pMin, bestP - span), pHi = Math.min(pMax, bestP + span);
  const b0sF = Array.from({ length: N }, (_, i) => b0Lo + (b0Hi - b0Lo) * i / (N - 1));
  const psF = Array.from({ length: N }, (_, i) => pLo + (pHi - pLo) * i / (N - 1));
  for (const b0 of b0sF) {
    for (const p of psF) {
      const cost = costFn(b0, p);
      if (isFinite(cost) && cost < bestCost) { bestCost = cost; bestB0 = b0; bestP = p; }
    }
  }

  return [bestB0, bestP];
}

// ── Cut gains ──────────────────────────────────────────────────────────────────
/**
 * For each country in dataPoints, compute the predicted growth gain from
 * cutting government spending by `cutPP` percentage points.
 *
 * @param {{ name: string, spending: number, growth: number }[]} dataPoints
 * @param {(spending: number) => number} predictFn  Current fitted model
 * @param {number} [cutPP=5]  Size of the hypothetical cut in pp of GDP
 * @returns {{ name: string, spending: number, growth: number, gain: number }[]}
 *   Sorted descending by spending, filtered to countries where spending > cutPP.
 */
export function computeCutGains(dataPoints, predictFn, cutPP = 5) {
  return dataPoints
    .filter(d => d.spending > cutPP)
    .map(d => ({
      name: d.name,
      spending: d.spending,
      growth: d.growth,
      gain: predictFn(d.spending - cutPP) - predictFn(d.spending),
    }))
    .sort((a, b) => b.spending - a.spending);
}
