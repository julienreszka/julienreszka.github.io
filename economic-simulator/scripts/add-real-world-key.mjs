#!/usr/bin/env node
// scripts/add-real-world-key.mjs
// Extracts prose.real-world-implications-body from HTML and adds to locale JSONs.
// Also adds the French translation from wrap-theory-section2.mjs.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const html = readFileSync(resolve(root, "armey-curve.html"), "utf8");
const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

const key = "prose.real-world-implications-body";

// Extract English value from the HTML (between markers)
const marker = `<!-- i18n:${key}:start -->`;
const endMarker = `<!-- /i18n:${key}:end -->`;
const startIdx = html.indexOf(marker);
const endIdx = html.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error(`Could not find markers for ${key}`);
  process.exit(1);
}
const enVal = html.slice(startIdx + marker.length + 1, endIdx).trimEnd();

const frVal = `          <p>
            Si les données sont correctes et la théorie traditionnelle erronée, les
            implications politiques sont considérables :
          </p>
          <ul>
            <li>
              <strong>Pas de « taille optimale » à cibler :</strong> il n'y a pas
              de point idéal à affiner — il suffit de minimiser l'État et de
              maximiser la croissance
            </li>
            <li>
              <strong>Chaque programme a un coût :</strong> chaque programme
              gouvernemental, quelle que soit sa bonne intention, réduit la
              croissance économique globale
            </li>
            <li>
              <strong>La composition importe, mais le niveau prime :</strong> ces
              données traitent toutes les dépenses de manière identique — elles ne
              peuvent pas distinguer les programmes productifs des programmes
              inutiles. Mais le schéma comparatif tient au niveau agrégé : les pays
              à gouvernement plus petit surpassent systématiquement ceux à
              gouvernement plus grand, ce qui suggère que le niveau total est le
              facteur déterminant
            </li>
            <li>
              <strong>La question des biens publics :</strong> la théorie économique
              standard identifie une catégorie étroite de biens (défense, règle de
              droit de base, infrastructures essentielles) où la fourniture par le
              marché peut être insuffisante. Ces données ne peuvent pas résoudre ces
              débats — elles montrent seulement que les pays à dépenses agrégées très
              faibles obtiennent quand même une croissance forte, suggérant que des
              alternatives privées et marchandes peuvent remplacer plus de services
              que la théorie conventionnelle ne le prédit
            </li>
            <li>
              <strong>L'État comme frein sélectif :</strong> si les dépenses
              publiques ralentissent de manière fiable l'activité économique,
              l'implication n'est pas seulement de les minimiser — mais de les
              diriger délibérément vers les parties de l'économie que l'on veut
              ralentir. La pollution des rivières, la surpêche, le surdosage en
              antibiotiques et le risque financier systémique sont tous des cas où
              une activité privée non contrôlée croît aux dépens de la société. Un
              gouvernement qui agit comme un frein ciblé sur ces nuisances peut
              améliorer le bien-être tout en maintenant les dépenses agrégées —
              et leur frein à la croissance — à un niveau faible
            </li>
            <li>
              <strong>Stratégie de réduction maximale :</strong> la meilleure
              politique est de réduire l'État au minimum absolu nécessaire pour
              l'état de droit de base
            </li>
          </ul>`;

if (!(key in en)) {
  en[key] = enVal;
  console.log(`✓ Added en.json: ${key}`);
} else {
  console.log(`  en.json already has: ${key}`);
}

if (!(key in fr)) {
  fr[key] = frVal;
  console.log(`✓ Added fr.json: ${key}`);
} else {
  console.log(`  fr.json already has: ${key}`);
}

writeFileSync(resolve(root, "armey-curve.en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "armey-curve.fr.json"), JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log("Done.");
