/**
 * build-piq.mjs
 *
 * Constructs a country-level Public Investment Quality (PIQ) proxy from the
 * IEG World Bank Project Performance Ratings dataset, following the spirit of
 * Adarov & Panizza (2024, WB Policy Research WP 10877).
 *
 * Method (simplified PIQ-F):
 *   1. Convert ordinal IEG Outcome Ratings to 1–6 numeric scale.
 *   2. Residualise against Quality-at-Entry and Quality-of-Supervision using
 *      country-pooled OLS (same controls used in the paper's Table 2.1).
 *   3. Average the residual per country across all projects closed 2000–2023.
 *   4. Map IEG country names → ISO3 codes.
 *   5. Save {iso3: piq_score} to cache/piq.json.
 *   6. Report how many countries overlap with the existing WB Stage 2 sample.
 *
 * Usage: node /path/to/economic-simulator/scripts/build-piq.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "cache");
const IEG_PATH = path.join(CACHE_DIR, "ieg-ratings.json");
const PIQ_PATH = path.join(CACHE_DIR, "piq.json");

// ─── ISO3 lookup ────────────────────────────────────────────────────────────
// Maps IEG country name strings to ISO 3166-1 alpha-3 codes.
// Regional / multi-country entries are mapped to null (excluded).
const NAME_TO_ISO3 = {
  "Afghanistan": "AFG",
  "Albania": "ALB",
  "Algeria": "DZA",
  "Angola": "AGO",
  "Antigua and Barbuda": "ATG",
  "Argentina": "ARG",
  "Armenia": "ARM",
  "Azerbaijan": "AZE",
  "Bahamas, The": "BHS",
  "Bangladesh": "BGD",
  "Barbados": "BRB",
  "Belarus": "BLR",
  "Belize": "BLZ",
  "Benin": "BEN",
  "Bhutan": "BTN",
  "Bolivia": "BOL",
  "Bosnia and Herzegovina": "BIH",
  "Botswana": "BWA",
  "Brazil": "BRA",
  "Bulgaria": "BGR",
  "Burkina Faso": "BFA",
  "Burundi": "BDI",
  "Cabo Verde": "CPV",
  "Cambodia": "KHM",
  "Cameroon": "CMR",
  "Central African Republic": "CAF",
  "Chad": "TCD",
  "Chile": "CHL",
  "China": "CHN",
  "Colombia": "COL",
  "Comoros": "COM",
  "Congo": "COG",
  "Congo, Democratic Republic of": "COD",
  "Costa Rica": "CRI",
  "Cote d'Ivoire": "CIV",
  "Croatia": "HRV",
  "Czechia": "CZE",
  "Djibouti": "DJI",
  "Dominica": "DMA",
  "Dominican Republic": "DOM",
  "Ecuador": "ECU",
  "Egypt": "EGY",
  "El Salvador": "SLV",
  "Equatorial Guinea": "GNQ",
  "Eritrea": "ERI",
  "Estonia": "EST",
  "Eswatini": "SWZ",
  "Ethiopia": "ETH",
  "Fiji": "FJI",
  "Gabon": "GAB",
  "Georgia": "GEO",
  "Ghana": "GHA",
  "Grenada": "GRD",
  "Guatemala": "GTM",
  "Guinea": "GIN",
  "Guinea-Bissau": "GNB",
  "Guyana": "GUY",
  "Haiti": "HTI",
  "Honduras": "HND",
  "Hungary": "HUN",
  "India": "IND",
  "Indonesia": "IDN",
  "Iran, Islamic Republic of": "IRN",
  "Iraq": "IRQ",
  "Jamaica": "JAM",
  "Jordan": "JOR",
  "Kazakhstan": "KAZ",
  "Kenya": "KEN",
  "Kiribati": "KIR",
  "Korea, Republic of": "KOR",
  "Kosovo": "XKX",
  "Kyrgyz Republic": "KGZ",
  "Lao PDR": "LAO",
  "Latvia": "LVA",
  "Lebanon": "LBN",
  "Lesotho": "LSO",
  "Liberia": "LBR",
  "Lithuania": "LTU",
  "Madagascar": "MDG",
  "Malawi": "MWI",
  "Malaysia": "MYS",
  "Maldives": "MDV",
  "Mali": "MLI",
  "Marshall Islands": "MHL",
  "Mauritania": "MRT",
  "Mauritius": "MUS",
  "Mexico": "MEX",
  "Micronesia": "FSM",
  "Moldova": "MDA",
  "Mongolia": "MNG",
  "Montenegro": "MNE",
  "Morocco": "MAR",
  "Mozambique": "MOZ",
  "Myanmar": "MMR",
  "Namibia": "NAM",
  "Nepal": "NPL",
  "Nicaragua": "NIC",
  "Niger": "NER",
  "Nigeria": "NGA",
  "North Macedonia": "MKD",
  "Pakistan": "PAK",
  "Panama": "PAN",
  "Papua New Guinea": "PNG",
  "Paraguay": "PRY",
  "Peru": "PER",
  "Philippines": "PHL",
  "Poland": "POL",
  "Romania": "ROU",
  "Russia": "RUS",
  "Rwanda": "RWA",
  "Samoa": "WSM",
  "Sao Tome and Principe": "STP",
  "Senegal": "SEN",
  "Serbia": "SRB",
  "Seychelles": "SYC",
  "Sierra Leone": "SLE",
  "Slovak Republic": "SVK",
  "Slovenia": "SVN",
  "Solomon Islands": "SLB",
  "Somalia": "SOM",
  "South Africa": "ZAF",
  "South Sudan": "SSD",
  "Sri Lanka": "LKA",
  "St. Kitts and Nevis": "KNA",
  "St. Lucia": "LCA",
  "St. Vincent and the Grenadines": "VCT",
  "Sudan": "SDN",
  "Tajikistan": "TJK",
  "Tanzania": "TZA",
  "Thailand": "THA",
  "Timor-Leste": "TLS",
  "Togo": "TGO",
  "Tonga": "TON",
  "Trinidad and Tobago": "TTO",
  "Tuvalu": "TUV",
  "Turkiye": "TUR",
  "Turkmenistan": "TKM",
  "Uganda": "UGA",
  "Ukraine": "UKR",
  "Uruguay": "URY",
  "Uzbekistan": "UZB",
  "Vanuatu": "VUT",
  "Venezuela, Republica Bolivariana de": "VEN",
  "Viet Nam": "VNM",
  "West Bank and Gaza": "PSE",
  "Yemen": "YEM",
  "Zambia": "ZMB",
  "Zimbabwe": "ZWE",
  // Regional / multi-country → excluded
  "Africa": null,
  "Andean Countries": null,
  "Aral Sea": null,
  "Caribbean": null,
  "Central Africa": null,
  "Central America": null,
  "Central Asia": null,
  "East Asia and Pacific": null,
  "Eastern Africa": null,
  "Eastern and Southern Africa": null,
  "Europe and Central Asia": null,
  "Latin America": null,
  "Latin America and Caribbean": null,
  "Middle East and North Africa": null,
  "OECS Countries": null,
  "Pacific Islands": null,
  "Red Sea and Gulf of Aden": null,
  "South Asia": null,
  "Viet Nam, Cambodia, Laos CMU": null,
  "West Bank and Gaza": "PSE",
  "Western Africa": null,
  "Western and Central Africa": null,
  "Western Balkans": null,
  "World": null,
};

// ─── Simple OLS helpers ──────────────────────────────────────────────────────
function mean(arr) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

/**
 * OLS with 2 predictors (x1, x2) → returns residuals.
 * Outcome = a + b1*x1 + b2*x2
 */
function residualise(ys, x1s, x2s) {
  const n = ys.length;
  const my = mean(ys), mx1 = mean(x1s), mx2 = mean(x2s);
  // Center
  const yc = ys.map((y, i) => y - my);
  const x1c = x1s.map((x, i) => x - mx1);
  const x2c = x2s.map((x, i) => x - mx2);

  // Normal equations for 2 predictors (Cramer's rule)
  let s11 = 0, s12 = 0, s22 = 0, sy1 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    s11 += x1c[i] * x1c[i];
    s12 += x1c[i] * x2c[i];
    s22 += x2c[i] * x2c[i];
    sy1 += yc[i] * x1c[i];
    sy2 += yc[i] * x2c[i];
  }
  const det = s11 * s22 - s12 * s12;
  if (Math.abs(det) < 1e-12) {
    // Collinear — return demeaned y
    return yc;
  }
  const b1 = (sy1 * s22 - sy2 * s12) / det;
  const b2 = (sy2 * s11 - sy1 * s12) / det;

  return ys.map((y, i) => y - (my + b1 * (x1s[i] - mx1) + b2 * (x2s[i] - mx2)));
}

// ─── Main ────────────────────────────────────────────────────────────────────
if (!existsSync(IEG_PATH)) {
  console.error(`Missing ${IEG_PATH}. Run extract-ieg.py first.`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(IEG_PATH, "utf8"));
console.log(`Loaded ${raw.length} IEG project rows`);

// Keep only rows with all three ratings (for residualisation)
const usable = raw.filter(
  (r) => r.outcome != null && r.qEntry != null && r.qSupervision != null
    && NAME_TO_ISO3[r.country] !== undefined  // known country
    && NAME_TO_ISO3[r.country] !== null        // not regional
);
console.log(`Rows with full ratings & known country: ${usable.length}`);

// ── Residualise outcome against qEntry + qSupervision globally ──────────────
// This mirrors Adarov & Panizza's approach of controlling for project-level
// quality drivers so the country-level residual reflects systemic quality.
const ys = usable.map((r) => r.outcome);
const x1s = usable.map((r) => r.qEntry);
const x2s = usable.map((r) => r.qSupervision);
const resid = residualise(ys, x1s, x2s);

// ── Average residual per country (= PIQ proxy) ────────────────────────────
const byCountry = new Map(); // iso3 → {sum, count}
for (let i = 0; i < usable.length; i++) {
  const iso3 = NAME_TO_ISO3[usable[i].country];
  if (!byCountry.has(iso3)) byCountry.set(iso3, { sum: 0, count: 0 });
  const b = byCountry.get(iso3);
  b.sum += resid[i];
  b.count++;
}

const piq = {};
for (const [iso3, { sum, count }] of byCountry) {
  if (count >= 5) { // require at least 5 projects for reliability
    piq[iso3] = sum / count;
  }
}

const iso3List = Object.keys(piq).sort();
console.log(`PIQ scores computed for ${iso3List.length} countries (min 5 projects)`);

// ── Print distribution ────────────────────────────────────────────────────
const vals = Object.values(piq);
const sorted = [...vals].sort((a, b) => a - b);
const pMin = sorted[0].toFixed(3);
const pMax = sorted[sorted.length - 1].toFixed(3);
const pMean = (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3);
console.log(`Distribution: min=${pMin}  mean=${pMean}  max=${pMax}`);

// ── Top / bottom 10 ──────────────────────────────────────────────────────
const ranked = iso3List.map((iso3) => ({ iso3, piq: piq[iso3] }))
  .sort((a, b) => b.piq - a.piq);
console.log("\nTop 10 (high quality):");
ranked.slice(0, 10).forEach((r) => console.log(`  ${r.iso3}  ${r.piq.toFixed(3)}`));
console.log("Bottom 10 (low quality):");
ranked.slice(-10).forEach((r) => console.log(`  ${r.iso3}  ${r.piq.toFixed(3)}`));

// ── Check overlap with ceiling-r2 WB cache ───────────────────────────────
// Load WB spending data to count overlap
const spendPath1 = path.join(CACHE_DIR, "WB_GC.XPN.TOTL.GD.ZS.json");
const spendPath2 = path.join(CACHE_DIR, "wb_GC.XPN.TOTL.GD.ZS.json");
const spendPath = existsSync(spendPath1) ? spendPath1 : existsSync(spendPath2) ? spendPath2 : null;
if (spendPath) {
  const spendRaw = JSON.parse(readFileSync(spendPath, "utf8"));
  const spendArr = Array.isArray(spendRaw) ? spendRaw : [];
  const rows = Array.isArray(spendArr[1]) ? spendArr[1] : spendArr;
  const wbCountries = new Set(rows.map((r) => r.countryiso3code).filter(Boolean));
  const overlap = iso3List.filter((iso3) => wbCountries.has(iso3));
  console.log(`\nOverlap with WB spending sample: ${overlap.length} countries`);
}

// ── Save ─────────────────────────────────────────────────────────────────
writeFileSync(PIQ_PATH, JSON.stringify(piq, null, 2));
console.log(`\nSaved to ${PIQ_PATH}`);
