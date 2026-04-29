#!/usr/bin/env node
// scripts/wrap-theory-section2.mjs
// Wraps the theory-vs-empirical-reality section and real-world-implications list
// in anchor-comment blocks, with French translations.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

function loadJson(file) {
  return JSON.parse(readFileSync(resolve(root, file), "utf8"));
}
function saveJson(file, data) {
  writeFileSync(resolve(root, file), JSON.stringify(data, null, 2) + "\n", "utf8");
}

let html = readFileSync(resolve(root, "armey-curve.html"), "utf8");
const en = loadJson("armey-curve.en.json");
const fr = loadJson("armey-curve.fr.json");

// ── 1. prose.theory-vs-empirical-body ────────────────────────────────────
const theoryEmpBodyEn = `          <p><strong>The traditional quadratic theory claimed:</strong></p>
          <p style="text-align: center; font-style: italic; margin: 20px 0">
            Growth Rate = β₀ + β₁ × Government Spending + β₂ × (Government
            Spending)²
          </p>
          <p>
            Where β₀ represents baseline growth, β₁ captures supposed initial
            positive effects, and β₂ (negative) represents diminishing returns.
          </p>

          <p>
            <strong
              >But the data actually fits these patterns much better:</strong
            >
          </p>
          <p style="text-align: center; font-style: italic; margin: 20px 0">
            <strong>Power Law:</strong> Growth Rate = β₀ × (Government
            Spending)⁻ᵅ<br />
            <strong>Inverse Model:</strong> Growth Rate = β₀ / (Government
            Spending + 1)<br />
            <strong>Exponential Decay:</strong> Growth Rate = β₀ × e^(-decay ×
            Government Spending)
          </p>
          <p>
            The power law model achieves the highest R² of any model tested,
            explaining ~42% of the variation in growth rates among the 113
            countries that pass the standard quality filters (excluding
            resource-dependent, externally-funded, conflict-fragile, and
            GDP-distorted economies). Without those filters the figure is ~24%,
            because the excluded groups add noise without adding signal. In
            cross-country macroeconomics, 42% is an exceptionally strong result
            for a single explanatory variable. For comparison, Robert Barro's
            <a href="#ref-barro">landmark 1991 growth study</a> — one of the
            most cited papers in economics — achieved R² ≈ 0.35–0.50 using
            <em>ten or more</em> variables simultaneously. Most single-variable
            growth regressions explain only 5–15% of variation. Government
            spending alone explaining 42% (or even 24% on the full unfiltered
            sample) means it is, by a wide margin, the single most important
            measurable determinant of cross-country growth differences.
          </p>
          <p>
            The power law generalizes the inverse model (which is just power law
            with α=1) and captures the steep initial harm of government spending
            that gradually flattens at higher levels. These models all suggest
            there's no "beneficial phase" of government spending - it crowds out
            private investment from day one.
          </p>`;

const theoryEmpBodyFr = `          <p><strong>La théorie quadratique traditionnelle affirmait :</strong></p>
          <p style="text-align: center; font-style: italic; margin: 20px 0">
            Taux de croissance = β₀ + β₁ × Dépenses publiques + β₂ × (Dépenses
            publiques)²
          </p>
          <p>
            Où β₀ représente la croissance de base, β₁ capture les effets
            initiaux positifs supposés, et β₂ (négatif) représente les
            rendements décroissants.
          </p>

          <p>
            <strong
              >Mais les données correspondent bien mieux à ces modèles :</strong
            >
          </p>
          <p style="text-align: center; font-style: italic; margin: 20px 0">
            <strong>Loi de puissance :</strong> Taux de croissance = β₀ × (Dépenses
            publiques)⁻ᵅ<br />
            <strong>Modèle inverse :</strong> Taux de croissance = β₀ / (Dépenses
            publiques + 1)<br />
            <strong>Décroissance exponentielle :</strong> Taux de croissance = β₀ × e^(-déclin ×
            Dépenses publiques)
          </p>
          <p>
            Le modèle en loi de puissance obtient le R² le plus élevé de tous les
            modèles testés, expliquant ~42 % de la variation des taux de croissance
            parmi les 113 pays qui satisfont les filtres de qualité standard (excluant
            les économies dépendantes des ressources, financées de l'extérieur,
            touchées par des conflits et à PIB distordu). Sans ces filtres, le
            chiffre est ~24 %, car les groupes exclus ajoutent du bruit sans ajouter
            de signal. En macroéconomie comparée, 42 % est un résultat
            exceptionnellement fort pour une seule variable explicative. À titre
            de comparaison, la <a href="#ref-barro">célèbre étude de croissance de
            Robert Barro en 1991</a> — l'un des articles les plus cités en économie
            — a atteint R² ≈ 0,35–0,50 en utilisant <em>dix variables ou plus</em>
            simultanément. La plupart des régressions de croissance à une seule
            variable n'expliquent que 5 à 15 % de la variation. Les dépenses
            publiques seules expliquant 42 % (ou même 24 % sur l'échantillon complet
            non filtré) en font, de loin, le principal déterminant mesurable des
            différences de croissance entre pays.
          </p>
          <p>
            La loi de puissance généralise le modèle inverse (qui n'est qu'une loi
            de puissance avec α=1) et capture le fort effet négatif initial des
            dépenses publiques qui s'atténue progressivement aux niveaux élevés. Ces
            modèles suggèrent tous qu'il n'y a pas de « phase bénéfique » des
            dépenses publiques — elles évincent l'investissement privé dès le
            premier dollar.
          </p>`;

// ── 2. prose.real-world-implications-body ────────────────────────────────
const realWorldEn = `          <p>
            If the data is right and the traditional theory is wrong, the policy
            implications are dramatic:
          </p>
          <ul>
            <li>
              <strong>No "Optimal Size" to Target:</strong> There's no sweet
              spot to fine-tune toward - just minimize government and maximize
              growth
            </li>
            <li>
              <strong>Every Program Has a Cost:</strong> Each government
              program, no matter how well-intentioned, reduces overall economic
              growth
            </li>
            <li>
              <strong>Composition Matters, But Level Dominates:</strong> This
              data treats all spending identically — it cannot distinguish
              productive from wasteful programs. But the cross-country pattern
              holds at the aggregate level: countries with smaller governments
              consistently outgrow those with larger ones, suggesting the total
              level is the primary driver
            </li>
            <li>
              <strong>The Public Goods Question:</strong> Standard economic
              theory identifies a narrow category of goods (defense, basic rule
              of law, core infrastructure) where market provision may be
              insufficient. This data cannot resolve those debates — it only
              shows that countries with very low aggregate spending still
              achieve strong growth, suggesting private and market alternatives
              can substitute for more services than conventional theory predicts
            </li>
            <li>
              <strong>Government as a Selective Brake:</strong> If government
              spending reliably slows economic activity, the implication is not
              only to minimize it — but to aim it deliberately at the parts of
              the economy we want to slow down. River pollution, overfishing,
              antibiotic overuse, and systemic financial risk are all cases
              where unchecked private activity grows at society's expense. A
              government that acts as a targeted brake on these harms can
              improve welfare while keeping aggregate spending — and its drag on
              growth — small
            </li>
          </ul>`;

const realWorldFr = `          <p>
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
          </ul>`;

const replacements = [
  {
    key: "prose.theory-vs-empirical-body",
    en: theoryEmpBodyEn,
    fr: theoryEmpBodyFr,
    old: theoryEmpBodyEn,
  },
  {
    key: "prose.real-world-implications-body",
    en: realWorldEn,
    fr: realWorldFr,
    old: realWorldEn,
  },
];

let changed = 0;
for (const { key, en: enVal, fr: frVal, old } of replacements) {
  if (!html.includes(old)) {
    console.warn(`⚠ Could not find old content for key "${key}" — skipping`);
    continue;
  }
  html = html.replace(
    old,
    `<!-- i18n:${key}:start -->\n${enVal}\n          <!-- /i18n:${key}:end -->`
  );
  if (!(key in en)) en[key] = enVal;
  if (!(key in fr)) fr[key] = frVal;
  changed++;
  console.log(`✓ Wrapped ${key}`);
}

writeFileSync(resolve(root, "armey-curve.html"), html, "utf8");
saveJson("armey-curve.en.json", en);
saveJson("armey-curve.fr.json", fr);

console.log(`\nWrapped ${changed} sections. Updated en.json and fr.json.`);
