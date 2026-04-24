/**
 * build-eci.mjs
 *
 * Parses Harvard Growth Lab's growth_proj_eci_rankings.csv and produces
 * cache/eci.json — a {ISO3 -> mean ECI over 2005-2023} map.
 *
 * Uses eci_hs92 (HS 1992 classification) as the primary measure since it
 * has the longest continuous coverage. Falls back to eci_sitc when missing.
 *
 * Run: node /path/to/economic-simulator/scripts/build-eci.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dir, "cache");
const CSV = join(CACHE_DIR, "eci-raw.csv");

const YEAR_MIN = 2005;
const YEAR_MAX = 2023;
const MIN_YEARS = 5;

const text = readFileSync(CSV, "utf8").trim();
const lines = text.split(/\r?\n/);
const header = lines[0].split(",");
const idx = (name) => header.indexOf(name);
const I_ISO = idx("country_iso3_code");
const I_YEAR = idx("year");
const I_HS92 = idx("eci_hs92");
const I_SITC = idx("eci_sitc");

const byCountry = {};
for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split(",");
  const iso = row[I_ISO];
  const year = +row[I_YEAR];
  if (!iso || !Number.isFinite(year)) continue;
  if (year < YEAR_MIN || year > YEAR_MAX) continue;
  const hs92 = row[I_HS92];
  const sitc = row[I_SITC];
  let v = null;
  if (hs92 !== "" && hs92 != null) v = +hs92;
  else if (sitc !== "" && sitc != null) v = +sitc;
  if (!Number.isFinite(v)) continue;
  if (!byCountry[iso]) byCountry[iso] = [];
  byCountry[iso].push(v);
}

const out = {};
const stats = [];
for (const [iso, vs] of Object.entries(byCountry)) {
  if (vs.length < MIN_YEARS) continue;
  const mean = vs.reduce((s, v) => s + v, 0) / vs.length;
  out[iso] = mean;
  stats.push({ iso, n: vs.length, mean });
}

stats.sort((a, b) => b.mean - a.mean);
console.log(`Countries: ${stats.length} (years averaged: ${YEAR_MIN}-${YEAR_MAX}, min ${MIN_YEARS} years)`);
console.log(`Top 5:`);
for (const s of stats.slice(0, 5)) console.log(`  ${s.iso}  ECI=${s.mean.toFixed(3)}  (n=${s.n})`);
console.log(`Bottom 5:`);
for (const s of stats.slice(-5)) console.log(`  ${s.iso}  ECI=${s.mean.toFixed(3)}  (n=${s.n})`);

writeFileSync(join(CACHE_DIR, "eci.json"), JSON.stringify(out, null, 2));
console.log(`\nWrote ${join(CACHE_DIR, "eci.json")}`);
