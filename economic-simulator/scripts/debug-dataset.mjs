// Mirrors the browser's processWorldBankData pipeline exactly.
// Run: node scripts/debug-dataset.mjs
// Compare output to compare-curves.mjs to find dataset divergence.
import { gridSearch2D, avg, EXCLUDED, RESOURCE_DEP, EXT_FUNDED, GDP_DIST, CONFLICT } from '../model-math.mjs';

const DATE_START = 2005, DATE_END = 2023, MIN_YEARS = 3;

const fetchWB = async (ind) => {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${ind}?date=${DATE_START}:${DATE_END}&format=json&per_page=10000`;
  return ((await (await fetch(url)).json())[1]) ?? [];
};
const fetchMeta = async () =>
  ((await (await fetch(`https://api.worldbank.org/v2/country?format=json&per_page=300`)).json())[1]) ?? [];

const meta = await fetchMeta();
const developedCountries = new Set();
const developingCountries = new Set();
for (const c of meta) {
  if (!c.region || c.region.id === 'NA') continue;
  if (c.incomeLevel?.id === 'HIC') developedCountries.add(c.id);
  else developingCountries.add(c.id);
}

const [spendingRaw, growthRaw] = await Promise.all([
  fetchWB('GC.XPN.TOTL.GD.ZS'),
  fetchWB('NY.GDP.MKTP.KD.ZG'),
]);

// --- Browser pipeline ---
const countryAverages = {};
for (const item of spendingRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (!countryAverages[code]) countryAverages[code] = { name: item.country?.value ?? code, spending: [], growth: [] };
  countryAverages[code].spending.push(item.value);
}
for (const item of growthRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (countryAverages[code]) countryAverages[code].growth.push(item.value);
}

const browserCountries = new Set();
for (const [code, data] of Object.entries(countryAverages)) {
  if (EXCLUDED.has(code)) continue;
  if (data.spending.length < MIN_YEARS || data.growth.length < MIN_YEARS) continue;
  if (RESOURCE_DEP.has(code) || EXT_FUNDED.has(code) || GDP_DIST.has(code) || CONFLICT.has(code)) continue;
  if (!developedCountries.has(code) && !developingCountries.has(code)) continue;
  browserCountries.add(code);
}

// --- Node pipeline (compare-curves.mjs) ---
const nodeCountries = new Set();
const actualCodes = new Set(meta.filter(c => c.region?.id !== 'NA').map(c => c.id));
const nodeBuild = {};
for (const item of spendingRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (!nodeBuild[code]) nodeBuild[code] = { sp: [], gr: [] };
  nodeBuild[code].sp.push(item.value);
}
for (const item of growthRaw) {
  if (!item.value || !item.countryiso3code) continue;
  if (item.date < DATE_START || item.date > DATE_END) continue;
  const code = item.countryiso3code;
  if (nodeBuild[code]) nodeBuild[code].gr.push(item.value);
}
for (const [code, d] of Object.entries(nodeBuild)) {
  if (!actualCodes.has(code)) continue;
  if (EXCLUDED.has(code) || CONFLICT.has(code) || GDP_DIST.has(code) || EXT_FUNDED.has(code) || RESOURCE_DEP.has(code)) continue;
  if (d.sp.length < MIN_YEARS || d.gr.length < MIN_YEARS) continue;
  nodeCountries.add(code);
}

// --- Compare ---
const onlyInBrowser = [...browserCountries].filter(c => !nodeCountries.has(c));
const onlyInNode = [...nodeCountries].filter(c => !browserCountries.has(c));
const both = [...browserCountries].filter(c => nodeCountries.has(c));

console.log(`Browser N=${browserCountries.size}  Node N=${nodeCountries.size}  Shared=${both.length}`);
if (onlyInBrowser.length) console.log(`\nOnly in BROWSER (${onlyInBrowser.length}):`, onlyInBrowser.join(', '));
if (onlyInNode.length) console.log(`\nOnly in NODE (${onlyInNode.length}):`, onlyInNode.join(', '));

// --- Compute R² for each pipeline ---
const computeR2 = (codes, dataSource) => {
  const pts = codes.map(c => {
    const d = dataSource[c];
    return { spending: avg(d.spending ?? d.sp), growth: avg(d.growth ?? d.gr) };
  });
  const cost = fn => pts.length * Math.log(pts.reduce((s, p) => s + (p.growth - fn(p.spending)) ** 2, 0) / pts.length);
  const [b0, alpha] = gridSearch2D([0.5, 2000], [0.1, 5], (b0, a) =>
    cost(x => b0 * Math.pow(Math.max(x, 0.1), -a))
  );
  const fn = x => b0 * Math.pow(Math.max(x, 0.1), -alpha);
  const actuals = pts.map(p => p.growth);
  const preds = pts.map(p => fn(p.spending));
  const mean = avg(actuals);
  const ssTot = actuals.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = actuals.reduce((s, v, i) => s + (v - preds[i]) ** 2, 0);
  return 1 - ssRes / ssTot;
};

const r2Browser = computeR2([...browserCountries], countryAverages);
const r2Node = computeR2([...nodeCountries], nodeBuild);
console.log(`\nPower Law R²  Browser=${r2Browser.toFixed(4)}  Node=${r2Node.toFixed(4)}`);

// --- Show spending/growth diffs for shared countries ---
if (both.length > 0) {
  const diffs = both.map(code => {
    const bSp = avg(countryAverages[code].spending), bGr = avg(countryAverages[code].growth);
    const nSp = avg(nodeBuild[code].sp), nGr = avg(nodeBuild[code].gr);
    return { code, dSp: Math.abs(bSp - nSp), dGr: Math.abs(bGr - nGr) };
  }).filter(d => d.dSp > 1e-6 || d.dGr > 1e-6).sort((a, b) => (b.dSp + b.dGr) - (a.dSp + a.dGr));
  if (diffs.length) {
    console.log(`\nShared countries with different values (top ${Math.min(diffs.length, 20)}):`);
    for (const d of diffs.slice(0, 20)) {
      const bSp = avg(countryAverages[d.code].spending), bGr = avg(countryAverages[d.code].growth);
      const nSp = avg(nodeBuild[d.code].sp), nGr = avg(nodeBuild[d.code].gr);
      console.log(`  ${d.code}  sp: browser=${bSp.toFixed(3)} node=${nSp.toFixed(3)}  gr: browser=${bGr.toFixed(3)} node=${nGr.toFixed(3)}`);
    }
  } else {
    console.log('\nAll shared countries have identical spending/growth values.');
  }
}
