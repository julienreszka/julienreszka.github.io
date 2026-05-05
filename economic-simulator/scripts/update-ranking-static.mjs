/**
 * Regenerates the static MODEL-RANKING-TBODY in armey-curve.html from
 * model-ranking-structural.json — the single source of truth for the
 * 113-country structural-period model ranking.
 *
 * Usage: node scripts/update-ranking-static.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");

const ranking = JSON.parse(
  readFileSync(join(root, "model-ranking-structural.json"), "utf8")
);

function buildRows(models) {
  return models
    .map((m) => {
      const label = m.key === "power-law" ? `${m.name} ✓` : m.name;
      return [
        `              <tr>`,
        `                <td>${m.rank}</td>`,
        `                <td>${label}</td>`,
        `                <td>${m.r2.toFixed(4)}</td>`,
        `                <td>${m.ci}</td>`,
        `                <td>${m.aic.toFixed(2)}</td>`,
        `                <td>&lt;0.001</td>`,
        `                <td>${m.n ?? ranking.n}</td>`,
        `                <td>${m.coverage}</td>`,
        `              </tr>`,
      ].join("\n");
    })
    .join("\n");
}

const htmlPath = join(root, "armey-curve.html");
let html = readFileSync(htmlPath, "utf8");

const startMarker = "<!-- MODEL-RANKING-TBODY:START -->";
const endMarker = "<!-- MODEL-RANKING-TBODY:END -->";
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find MODEL-RANKING-TBODY markers in armey-curve.html");
  process.exit(1);
}

const before = html.slice(0, startIdx + startMarker.length);
const after = html.slice(endIdx);
const rows = buildRows(ranking.models);

html = `${before}\n${rows}\n              ${after}`;
writeFileSync(htmlPath, html, "utf8");

console.log(`Updated ${ranking.models.length} rows in armey-curve.html`);
console.log("Models:", ranking.models.map((m) => `${m.rank}. ${m.name} R²=${m.r2}`).join(", "));
