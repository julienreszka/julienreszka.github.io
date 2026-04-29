#!/usr/bin/env node
// scripts/add-residual-prose-keys.mjs
// Adds heading.stage2-section and prose.residual-explanation locale keys.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

const newKeys = {
  "heading.stage2-section": [
    `Stage 2: Spending + R&D + Military + Capital Formation + Population Growth + Domestic Credit + Tertiary Enrollment + Initial Income\n            <span style="font-weight:normal; font-size:0.85em; color:rgba(255,255,255,0.55);">— combined-R² ranked model comparison</span>`,
    `Étape 2 : Dépenses + R&D + Militaire + Formation de capital + Croissance démographique + Crédit intérieur + Inscription tertiaire + Revenu initial\n            <span style="font-weight:normal; font-size:0.85em; color:rgba(255,255,255,0.55);">— comparaison de modèles classés par R² combiné</span>`,
  ],
  "prose.residual-explanation": [
    `The spending curve above predicts a growth rate for each country. The <strong style="color:rgba(255,255,255,0.85)">residual</strong> is how far off that prediction is (actual − fitted).\n            These charts ask: <em>do R&amp;D, military expenditure, capital formation, population growth, domestic credit, tertiary enrollment, initial income, and terms-of-trade volatility systematically predict the errors?</em>\n            All eight are controlled jointly via eight-variable OLS. Each chart shows the <strong style="color:rgba(255,255,255,0.85)">partial slope</strong> — the effect of one variable holding the other seven at their means.\n            A <strong style="color:rgba(255,255,255,0.85)">positive capital formation slope</strong> reflects the investment-growth channel.\n            A <strong style="color:rgba(255,255,255,0.85)">positive domestic credit slope</strong> would indicate financial depth matters beyond the spending level.\n            A <strong style="color:rgba(255,255,255,0.85)">negative income slope</strong> (poorer countries grow faster conditional on spending) is expected textbook beta-convergence.\n            Note: military expenditure, R&amp;D, and tertiary enrollment are all <em>components</em> of total government spending (the Stage 1 x-axis). Their Stage 2 coefficients should be read as <strong style="color:rgba(255,255,255,0.85)">composition effects</strong> — among countries with the same total spending share, how does allocating more of it toward military (vs. other uses) correlate with growth? This is a guns-vs-butter trade-off coefficient, not an additive one.\n            The table below ranks all models by <strong style="color:rgba(255,255,255,0.85)">combined R²</strong> on the joint subset.`,
    `La courbe des dépenses ci-dessus prédit un taux de croissance pour chaque pays. Le <strong style="color:rgba(255,255,255,0.85)">résidu</strong> mesure l'écart entre cette prédiction et la réalité (valeur réelle − valeur ajustée).\n            Ces graphiques posent la question : <em>la R&amp;D, les dépenses militaires, la formation de capital, la croissance démographique, le crédit intérieur, l'inscription en enseignement supérieur, le revenu initial et la volatilité des termes de l'échange prédisent-ils systématiquement ces erreurs ?</em>\n            Les huit variables sont contrôlées conjointement par une régression MCO à huit variables. Chaque graphique montre la <strong style="color:rgba(255,255,255,0.85)">pente partielle</strong> — l'effet d'une variable en maintenant les sept autres à leurs moyennes.\n            Une <strong style="color:rgba(255,255,255,0.85)">pente positive de formation de capital</strong> reflète le canal investissement-croissance.\n            Une <strong style="color:rgba(255,255,255,0.85)">pente positive de crédit intérieur</strong> indiquerait que la profondeur financière compte au-delà du niveau de dépenses.\n            Une <strong style="color:rgba(255,255,255,0.85)">pente négative du revenu</strong> (les pays plus pauvres croissent plus vite conditionnellement aux dépenses) correspond à la convergence bêta classique des manuels.\n            Remarque : les dépenses militaires, la R&amp;D et l'inscription en enseignement supérieur sont des <em>composantes</em> des dépenses publiques totales (l'axe x de l'étape 1). Leurs coefficients de l'étape 2 doivent être interprétés comme des <strong style="color:rgba(255,255,255,0.85)">effets de composition</strong> — parmi les pays ayant la même part de dépenses totales, comment l'allocation d'une plus grande part aux dépenses militaires (par rapport à d'autres usages) se corrèle-t-elle avec la croissance ? Il s'agit d'un coefficient de compromis canons-vs-beurre, pas d'un coefficient additif.\n            Le tableau ci-dessous classe tous les modèles par <strong style="color:rgba(255,255,255,0.85)">R² combiné</strong> sur le sous-ensemble commun.`,
  ],
};

let added = 0;
for (const [key, [enVal, frVal]] of Object.entries(newKeys)) {
  if (!(key in en)) { en[key] = enVal; added++; }
  if (!(key in fr)) { fr[key] = frVal; added++; }
}

writeFileSync(resolve(root, "armey-curve.en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "armey-curve.fr.json"), JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log(`✓ Added ${added} locale key-locale pairs.`);
