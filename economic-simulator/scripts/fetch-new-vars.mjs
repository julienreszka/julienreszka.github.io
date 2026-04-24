/**
 * fetch-new-vars.mjs
 * Fetches working-age population share and terms-of-trade index from WB API.
 * Saves in the same format as ceiling-r2.mjs (data array only, not the full API wrapper).
 *
 * Run: node /path/to/economic-simulator/scripts/fetch-new-vars.mjs
 */

import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { DATE_START, DATE_END } from "../model-math.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dir, "cache");

async function fetchWB(indicator, dateFrom, dateTo) {
  const path = join(CACHE_DIR, `wb_${indicator}.json`);
  if (existsSync(path)) {
    console.log(`  [cache] ${indicator}`);
    return;
  }
  console.log(`  [fetch] ${indicator}`);
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${dateFrom}:${dateTo}&format=json&per_page=20000`;
  const res = await fetch(url);
  const json = await res.json();
  const data = json[1] ?? [];
  writeFileSync(path, JSON.stringify(data));
  console.log(`         → ${data.length} rows`);
}

// Working-age share: period average over 2005-2023
await fetchWB("SP.POP.1564.TO.ZS", DATE_START, DATE_END);

// ToT index: need one extra year before DATE_START for YoY change computation
await fetchWB("TT.PRI.MRCH.XD.WD", DATE_START - 1, DATE_END);

console.log("Done.");
