#!/usr/bin/env node
// scripts/wrap-theory-section.mjs
// Wraps major prose subsections of the theory-vs-reality section in
// <!-- i18n:prose.key:start/end --> anchor-comment blocks and adds
// English + French locale values to armey-curve.en.json / armey-curve.fr.json.

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

// Helper: wrap a snippet in anchor-comment markers
function wrapBlock(oldInner, key) {
  return `<!-- i18n:${key}:start -->\n${oldInner}\n          <!-- /i18n:${key}:end -->`;
}

// ── 1. prose.theory-intro — 3 intro paragraphs ─────────────────────────────
const theoryIntroEn = `          <p>
            <strong>The theory seemed reasonable:</strong> The Armey Curve
            suggested an inverted U-shaped relationship between government
            spending and economic growth. Named after economist Richard Armey,
            this curve claimed there exists an optimal level of government
            spending that maximizes economic growth.
          </p>

          <p>
            <strong>But here's the problem:</strong> When you actually look at
            real-world data from dozens of countries over multiple decades, the
            theory doesn't hold up. Countries with lower government spending
            consistently achieve higher growth rates, while high-spending
            countries cluster in the low-growth zone.
          </p>

          <p>
            <strong>What the data actually shows:</strong> Instead of a neat
            U-shaped curve with an "optimal" government size around 20-30% of
            GDP, we see patterns that better fit power law (s⁻ᵅ) or inverse
            (1/x) models - suggesting that <em>any</em> government spending
            beyond the absolute minimum reduces economic growth.
          </p>`;

const theoryIntroFr = `          <p>
            <strong>La théorie semblait raisonnable :</strong> la courbe d'Armey
            proposait une relation en U inversé entre les dépenses publiques
            et la croissance économique. Attribuée à l'économiste Richard Armey,
            cette courbe affirmait qu'il existe un niveau optimal de dépenses
            publiques qui maximise la croissance économique.
          </p>

          <p>
            <strong>Mais voici le problème :</strong> lorsqu'on examine
            réellement les données de dizaines de pays sur plusieurs décennies,
            la théorie ne tient pas. Les pays à faibles dépenses publiques
            obtiennent systématiquement une croissance plus élevée, tandis que
            les pays à dépenses élevées se regroupent dans la zone de faible
            croissance.
          </p>

          <p>
            <strong>Ce que montrent réellement les données :</strong> au lieu d'une
            belle courbe en U avec une taille gouvernementale « optimale » autour de
            20-30 % du PIB, on observe des modèles qui correspondent mieux à une
            loi de puissance (s⁻ᵅ) ou à des modèles inverses (1/x) — suggérant
            que <em>toute</em> dépense publique au-delà du minimum absolu
            réduit la croissance économique.
          </p>`;

// ── 2. prose.traditional-theory-list — p + ul with 3 li ───────────────────
const tradListEn = `          <p>The Armey Curve theory proposed three distinct phases:</p>
          <ul>
            <li>
              <strong>Rising Phase (0-20%):</strong> Government spending
              supposedly provides essential infrastructure, legal framework, and
              public goods that enhance productivity and growth
            </li>
            <li>
              <strong>Peak (20-30%):</strong> The mythical "optimal" government
              size where growth is supposedly maximized
            </li>
            <li>
              <strong>Declining Phase (30%+):</strong> Excessive spending
              creates inefficiencies, crowds out private investment, and reduces
              growth through higher taxes and regulatory burden
            </li>
          </ul>`;

const tradListFr = `          <p>La courbe d'Armey proposait trois phases distinctes :</p>
          <ul>
            <li>
              <strong>Phase ascendante (0-20 %) :</strong> les dépenses publiques
              fourniraient prétendument les infrastructures essentielles, le cadre
              juridique et les biens publics qui améliorent la productivité et la
              croissance
            </li>
            <li>
              <strong>Pic (20-30 %) :</strong> la taille gouvernementale
              « optimale » mythique où la croissance serait soi-disant maximisée
            </li>
            <li>
              <strong>Phase déclinante (30 %+) :</strong> les dépenses excessives
              créent des inefficacités, évincent l'investissement privé et
              réduisent la croissance par des impôts plus élevés et une charge
              réglementaire accrue
            </li>
          </ul>`;

// ── 3. prose.data-actually-shows-body — 3 paragraphs ─────────────────────
const dataShowsEn = `          <p>
            <strong>There is no "rising phase."</strong> Countries with minimal
            government spending (Singapore ~17%, historically Hong Kong ~15%)
            consistently achieve solid growth. Meanwhile, countries that spend
            30-45% of GDP (most of Europe) cluster in the low-growth zone
            (0.5-1.5%).
          </p>

          <p>
            <strong>There is no clear "optimal" zone.</strong> The data doesn't
            show clustering around 20-30% spending. Instead, we see a consistent
            negative relationship: lower spending = higher growth.
          </p>

          <p>
            <strong
              >The relationship is better described by power law or inverse
              decline,</strong
            >
            not a quadratic curve. The data shows government spending is
            harmful to GDP growth from the first dollar — but that's precisely
            the point. The defensible use of government is as a deliberate
            brake on economic activity we don't want: pollution, overfishing,
            systemic financial risk. Slowing the economy is the feature, not
            the bug, in those applications.
          </p>`;

const dataShowsFr = `          <p>
            <strong>Il n'y a pas de « phase ascendante ».</strong> Les pays à
            dépenses publiques minimales (Singapour ~17 %, Hong Kong historiquement
            ~15 %) obtiennent systématiquement une croissance solide. Pendant ce
            temps, les pays qui dépensent 30-45 % du PIB (la plupart des pays
            européens) se regroupent dans la zone de faible croissance (0,5-1,5 %).
          </p>

          <p>
            <strong>Il n'y a pas de zone « optimale » claire.</strong> Les données
            ne montrent pas de regroupement autour de 20-30 % de dépenses. Au
            contraire, on observe une relation négative constante : dépenses
            inférieures = croissance plus élevée.
          </p>

          <p>
            <strong
              >La relation est mieux décrite par une loi de puissance ou un
              déclin inverse,</strong
            >
            et non par une courbe quadratique. Les données montrent que les
            dépenses publiques nuisent à la croissance du PIB dès le premier
            dollar — mais c'est précisément là l'enjeu. L'utilisation défendable
            de l'État est comme un frein délibéré aux activités économiques
            indésirables : pollution, surpêche, risque financier systémique.
            Ralentir l'économie est la fonctionnalité, pas le bug, dans ces
            applications.
          </p>`;

// ── 4. prose.historical-arc-body ─────────────────────────────────────────
const histArcEn = `          <p>
            The simulator window (2005–2023) captures only a narrow slice of
            history in which all major economies already operate above 25% of
            GDP. But the pre-WWII record is instructive: in 1913, government
            spending averaged roughly <strong>10–15% of GDP</strong> across
            Western Europe, and annual per-capita growth ran at
            <strong>~2–3%</strong> — consistent with where the power law curve
            projects at those spending levels. The post-war expansion of the
            state shifted every major Western economy rightward along the curve
            into the low-growth zone. Where high-spending economies have
            sustained rapid growth, compositional factors — high investment
            shares, catch-up convergence, or off-budget financing — tend to
            account for the exception.
          </p>`;

const histArcFr = `          <p>
            La fenêtre du simulateur (2005–2023) ne capture qu'une tranche
            étroite de l'histoire dans laquelle toutes les grandes économies
            opèrent déjà au-dessus de 25 % du PIB. Mais le bilan d'avant-guerre
            est instructif : en 1913, les dépenses publiques représentaient en
            moyenne environ <strong>10–15 % du PIB</strong> en Europe occidentale,
            et la croissance annuelle par habitant atteignait <strong>~2–3 %</strong>
            — cohérent avec ce que la courbe de loi de puissance projette à ces
            niveaux de dépenses. L'expansion d'après-guerre de l'État a déplacé
            chaque grande économie occidentale vers la droite sur la courbe, dans
            la zone de faible croissance. Là où les économies à dépenses élevées
            ont soutenu une croissance rapide, des facteurs de composition —
            parts d'investissement élevées, convergence de rattrapage ou
            financement hors budget — tendent à expliquer l'exception.
          </p>`;

// ── 5. prose.intercept-explained — intercept section with list ───────────
const interceptEn = `          <p>
            The intercept represents the natural economic growth rate in the
            absence of government intervention. This baseline reflects:
          </p>
          <ul>
            <li>
              <strong>Entrepreneurial Innovation:</strong> Natural human
              creativity and problem-solving driving new products and services
            </li>
            <li>
              <strong>Voluntary Exchange:</strong> Wealth creation through
              mutually beneficial trade
            </li>
            <li>
              <strong>Capital Accumulation:</strong> Private savings and
              investment in productive assets
            </li>
            <li>
              <strong>Knowledge Spillovers:</strong> Information sharing and
              learning between economic actors
            </li>
            <li>
              <strong>Competition:</strong> Market pressure driving efficiency
              improvements
            </li>
            <li>
              <strong>Specialization:</strong> Gains from division of labor and
              comparative advantage
            </li>
          </ul>
          <p>
            Historical evidence suggests this baseline ranges from 2-4% annually
            in developed economies, representing the economy's natural tendency
            toward improvement when people are free to innovate, trade, and
            invest.`;

const interceptFr = `          <p>
            L'intercepte représente le taux de croissance économique naturel en
            l'absence d'intervention gouvernementale. Cette base reflète :
          </p>
          <ul>
            <li>
              <strong>Innovation entrepreneuriale :</strong> la créativité et la
              résolution de problèmes humaines naturelles qui génèrent de nouveaux
              produits et services
            </li>
            <li>
              <strong>Échange volontaire :</strong> la création de richesse par
              le commerce mutuellement bénéfique
            </li>
            <li>
              <strong>Accumulation de capital :</strong> épargne privée et
              investissement dans des actifs productifs
            </li>
            <li>
              <strong>Externalités de connaissance :</strong> partage
              d'informations et apprentissage entre acteurs économiques
            </li>
            <li>
              <strong>Concurrence :</strong> pression du marché stimulant les
              améliorations d'efficacité
            </li>
            <li>
              <strong>Spécialisation :</strong> gains de la division du travail
              et de l'avantage comparatif
            </li>
          </ul>
          <p>
            Les preuves historiques suggèrent que cette base oscille entre 2 et
            4 % par an dans les économies développées, représentant la tendance
            naturelle de l'économie à s'améliorer lorsque les personnes sont
            libres d'innover, d'échanger et d'investir.`;

// ── Apply replacements ────────────────────────────────────────────────────
const replacements = [
  {
    key: "prose.theory-intro",
    en: theoryIntroEn,
    fr: theoryIntroFr,
    old: `          <p>
            <strong>The theory seemed reasonable:</strong> The Armey Curve
            suggested an inverted U-shaped relationship between government
            spending and economic growth. Named after economist Richard Armey,
            this curve claimed there exists an optimal level of government
            spending that maximizes economic growth.
          </p>

          <p>
            <strong>But here's the problem:</strong> When you actually look at
            real-world data from dozens of countries over multiple decades, the
            theory doesn't hold up. Countries with lower government spending
            consistently achieve higher growth rates, while high-spending
            countries cluster in the low-growth zone.
          </p>

          <p>
            <strong>What the data actually shows:</strong> Instead of a neat
            U-shaped curve with an "optimal" government size around 20-30% of
            GDP, we see patterns that better fit power law (s⁻ᵅ) or inverse
            (1/x) models - suggesting that <em>any</em> government spending
            beyond the absolute minimum reduces economic growth.
          </p>`,
  },
  {
    key: "prose.traditional-theory-list",
    en: tradListEn,
    fr: tradListFr,
    old: `          <p>The Armey Curve theory proposed three distinct phases:</p>
          <ul>
            <li>
              <strong>Rising Phase (0-20%):</strong> Government spending
              supposedly provides essential infrastructure, legal framework, and
              public goods that enhance productivity and growth
            </li>
            <li>
              <strong>Peak (20-30%):</strong> The mythical "optimal" government
              size where growth is supposedly maximized
            </li>
            <li>
              <strong>Declining Phase (30%+):</strong> Excessive spending
              creates inefficiencies, crowds out private investment, and reduces
              growth through higher taxes and regulatory burden
            </li>
          </ul>`,
  },
  {
    key: "prose.data-actually-shows-body",
    en: dataShowsEn,
    fr: dataShowsFr,
    old: `          <p>
            <strong>There is no "rising phase."</strong> Countries with minimal
            government spending (Singapore ~17%, historically Hong Kong ~15%)
            consistently achieve solid growth. Meanwhile, countries that spend
            30-45% of GDP (most of Europe) cluster in the low-growth zone
            (0.5-1.5%).
          </p>

          <p>
            <strong>There is no clear "optimal" zone.</strong> The data doesn't
            show clustering around 20-30% spending. Instead, we see a consistent
            negative relationship: lower spending = higher growth.
          </p>

          <p>
            <strong
              >The relationship is better described by power law or inverse
              decline,</strong
            >
            not a quadratic curve. The data shows government spending is
            harmful to GDP growth from the first dollar — but that's precisely
            the point. The defensible use of government is as a deliberate
            brake on economic activity we don't want: pollution, overfishing,
            systemic financial risk. Slowing the economy is the feature, not
            the bug, in those applications.
          </p>`,
  },
  {
    key: "prose.historical-arc-body",
    en: histArcEn,
    fr: histArcFr,
    old: `          <p>
            The simulator window (2005–2023) captures only a narrow slice of
            history in which all major economies already operate above 25% of
            GDP. But the pre-WWII record is instructive: in 1913, government
            spending averaged roughly <strong>10–15% of GDP</strong> across
            Western Europe, and annual per-capita growth ran at
            <strong>~2–3%</strong> — consistent with where the power law curve
            projects at those spending levels. The post-war expansion of the
            state shifted every major Western economy rightward along the curve
            into the low-growth zone. Where high-spending economies have
            sustained rapid growth, compositional factors — high investment
            shares, catch-up convergence, or off-budget financing — tend to
            account for the exception.
          </p>`,
  },
  {
    key: "prose.intercept-explained",
    en: interceptEn,
    fr: interceptFr,
    old: `          <p>
            The intercept represents the natural economic growth rate in the
            absence of government intervention. This baseline reflects:
          </p>
          <ul>
            <li>
              <strong>Entrepreneurial Innovation:</strong> Natural human
              creativity and problem-solving driving new products and services
            </li>
            <li>
              <strong>Voluntary Exchange:</strong> Wealth creation through
              mutually beneficial trade
            </li>
            <li>
              <strong>Capital Accumulation:</strong> Private savings and
              investment in productive assets
            </li>
            <li>
              <strong>Knowledge Spillovers:</strong> Information sharing and
              learning between economic actors
            </li>
            <li>
              <strong>Competition:</strong> Market pressure driving efficiency
              improvements
            </li>
            <li>
              <strong>Specialization:</strong> Gains from division of labor and
              comparative advantage
            </li>
          </ul>
          <p>
            Historical evidence suggests this baseline ranges from 2-4% annually
            in developed economies, representing the economy's natural tendency
            toward improvement when people are free to innovate, trade, and
            invest.`,
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
