#!/usr/bin/env node
// scripts/add-intro-keys.mjs
// Adds intro-paragraph locale key and aria.chart-label key.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const html = readFileSync(resolve(root, "armey-curve.html"), "utf8");
const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

function extractBlock(key) {
  const s = `<!-- i18n:${key}:start -->`;
  const e = `<!-- /i18n:${key}:end -->`;
  const si = html.indexOf(s);
  const ei = html.indexOf(e);
  if (si === -1 || ei === -1) { console.error(`Missing markers for ${key}`); return null; }
  return html.slice(si + s.length + 1, ei).trimEnd();
}

const enIntro = extractBlock("prose.intro-paragraph");

const newKeys = {
  "prose.intro-paragraph": {
    en: enIntro,
    fr: `      <p>
        <strong>Remise en question de la courbe d'Armey :</strong> Pendant des décennies,
        les économistes ont affirmé qu'il existe un niveau « optimal » de dépenses
        publiques maximisant la croissance économique — plaçant généralement ce point
        idéal à 15–25 % du PIB. Les données de la Banque mondiale couvrant
        <span id="intro-n">113</span> pays racontent une histoire différente : un
        <strong>modèle en loi de puissance s'ajuste avec un R²&nbsp;=&nbsp;<span id="intro-r2-pl">0.4219</span>
        (IC 95 % approx. : <span id="intro-ci-pl">0.28–0.56</span>)</strong>, tandis que
        la courbe d'Armey quadratique traditionnelle
        <span id="intro-quad-clause">n'atteint qu'un R²&nbsp;=&nbsp;0.3856 — moins de pouvoir explicatif,
        et aucune preuve du retournement prédit à de faibles niveaux de dépenses</span>.
        La relation est monotonement négative sur l'ensemble de la plage observée.
      </p>`,
  },
  "aria.chart-label": {
    en: `Chart displaying the Armey Curve with government spending on x-axis and GDP growth rate on y-axis`,
    fr: `Graphique affichant la courbe d'Armey avec les dépenses publiques en abscisse et le taux de croissance du PIB en ordonnée`,
  },
};

let added = 0;
for (const [key, { en: enV, fr: frV }] of Object.entries(newKeys)) {
  if (enV === null) { console.error(`Skipping ${key}`); continue; }
  if (!(key in en)) { en[key] = enV; added++; console.log(`✓ Added en: ${key}`); }
  if (!(key in fr)) { fr[key] = frV; added++; console.log(`✓ Added fr: ${key}`); }
}

writeFileSync(resolve(root, "armey-curve.en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "armey-curve.fr.json"), JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log(`Done. Added ${added} key-locale pairs.`);
