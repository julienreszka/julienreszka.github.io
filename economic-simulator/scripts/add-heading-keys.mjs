#!/usr/bin/env node
// scripts/add-heading-keys.mjs
// Adds data-i18n="heading.*" attributes to all untagged headings in
// armey-curve.html and appends the corresponding keys to both locale JSONs.
//
// Usage: node scripts/add-heading-keys.mjs

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

// ── Heading definitions ───────────────────────────────────────────────────────
// Each entry: { key, old, new_, en, fr }
//   old  – exact substring to find in armey-curve.html (opening tag line)
//   new_ – replacement (same line with data-i18n inserted)
//   en   – English text content (stored in en.json)
//   fr   – French translation (stored in fr.json)
// HTML entities (&amp; &times; etc.) are preserved as-is in en values since
// the build script injects them verbatim into the HTML output.

const HEADINGS = [
  {
    key: "heading.model-fit-ranking",
    old: `<h3 class="ranking-title">Model Fit Ranking</h3>`,
    new_: `<h3 class="ranking-title" data-i18n="heading.model-fit-ranking">Model Fit Ranking</h3>`,
    en: "Model Fit Ranking",
    fr: "Classement par qualité d'ajustement",
  },
  {
    key: "heading.what-else-explains-growth",
    old: `<h3 style="font-size: 1.05em; margin-bottom: 6px;">What else explains growth beyond government spending?</h3>`,
    new_: `<h3 style="font-size: 1.05em; margin-bottom: 6px;" data-i18n="heading.what-else-explains-growth">What else explains growth beyond government spending?</h3>`,
    en: "What else explains growth beyond government spending?",
    fr: "Qu'est-ce qui explique la croissance au-delà des dépenses publiques\u00a0?",
  },
  {
    key: "heading.theory-vs-reality",
    old: `<h2>The Armey Curve Theory vs. Reality</h2>`,
    new_: `<h2 data-i18n="heading.theory-vs-reality">The Armey Curve Theory vs. Reality</h2>`,
    en: "The Armey Curve Theory vs. Reality",
    fr: "La théorie de la courbe d'Armey face à la réalité",
  },
  {
    key: "heading.traditional-theory-claimed",
    old: `<h3>What the Traditional Theory Claimed</h3>`,
    new_: `<h3 data-i18n="heading.traditional-theory-claimed">What the Traditional Theory Claimed</h3>`,
    en: "What the Traditional Theory Claimed",
    fr: "Ce que prétendait la théorie traditionnelle",
  },
  {
    key: "heading.data-actually-shows",
    old: `<h3>What the Data Actually Shows</h3>`,
    new_: `<h3 data-i18n="heading.data-actually-shows">What the Data Actually Shows</h3>`,
    en: "What the Data Actually Shows",
    fr: "Ce que montrent réellement les données",
  },
  {
    key: "heading.historical-arc",
    old: `<h3 id="historical-arc">The Historical Arc Confirms the Pattern</h3>`,
    new_: `<h3 id="historical-arc" data-i18n="heading.historical-arc">The Historical Arc Confirms the Pattern</h3>`,
    en: "The Historical Arc Confirms the Pattern",
    fr: "L'arc historique confirme la tendance",
  },
  {
    key: "heading.theory-vs-empirical-reality",
    old: `<h3>Traditional Theory vs. Empirical Reality</h3>`,
    new_: `<h3 data-i18n="heading.theory-vs-empirical-reality">Traditional Theory vs. Empirical Reality</h3>`,
    en: "Traditional Theory vs. Empirical Reality",
    fr: "Théorie traditionnelle face à la réalité empirique",
  },
  {
    key: "heading.understanding-intercept",
    old: `<h4>Understanding the Intercept (β₀)</h4>`,
    new_: `<h4 data-i18n="heading.understanding-intercept">Understanding the Intercept (β₀)</h4>`,
    en: "Understanding the Intercept (\u03b2\u2080)",
    fr: "Comprendre l'ordonnée à l'origine (\u03b2\u2080)",
  },
  {
    key: "heading.real-world-implications",
    old: `<h3>Real-World Policy Implications</h3>`,
    new_: `<h3 data-i18n="heading.real-world-implications">Real-World Policy Implications</h3>`,
    en: "Real-World Policy Implications",
    fr: "Implications concrètes pour les politiques publiques",
  },
  {
    key: "heading.why-cuts-are-hard",
    old: `<h3 id="why-cuts-are-hard">Why High-Spending Countries Struggle to Cut</h3>`,
    new_: `<h3 id="why-cuts-are-hard" data-i18n="heading.why-cuts-are-hard">Why High-Spending Countries Struggle to Cut</h3>`,
    en: "Why High-Spending Countries Struggle to Cut",
    fr: "Pourquoi les pays à fortes dépenses peinent à les réduire",
  },
  {
    key: "heading.predicted-growth-gain",
    old: `<h4 style="font-size:0.95em; margin:0;">Predicted growth gain from a 5-point spending cut — current model &amp; data</h4>`,
    new_: `<h4 style="font-size:0.95em; margin:0;" data-i18n="heading.predicted-growth-gain">Predicted growth gain from a 5-point spending cut — current model &amp; data</h4>`,
    en: "Predicted growth gain from a 5-point spending cut \u2014 current model &amp; data",
    fr: "Gain de croissance prédit pour une réduction de 5 points de dépenses\u00a0\u2014 modèle et données actuels",
  },
  {
    key: "heading.selective-brake",
    // Multi-line heading: only replace the opening tag line
    old: `<h3 id="selective-brake">`,
    new_: `<h3 id="selective-brake" data-i18n="heading.selective-brake">`,
    en: "The Selective Brake: What Government Is Actually Good For",
    fr: "Le frein sélectif\u00a0: à quoi sert vraiment l'État",
  },
  {
    key: "heading.inclusive-wealth-criterion",
    old: `<h3 id="inclusive-wealth-criterion">A Single Objective Test: The Inclusive Wealth Criterion</h3>`,
    new_: `<h3 id="inclusive-wealth-criterion" data-i18n="heading.inclusive-wealth-criterion">A Single Objective Test: The Inclusive Wealth Criterion</h3>`,
    en: "A Single Objective Test: The Inclusive Wealth Criterion",
    fr: "Un test objectif unique\u00a0: le critère de richesse inclusive",
  },
  {
    key: "heading.whole-rule-2x2",
    old: `<h4>The whole rule, in one 2&times;2</h4>`,
    new_: `<h4 data-i18n="heading.whole-rule-2x2">The whole rule, in one 2&times;2</h4>`,
    en: "The whole rule, in one 2\u00d72",
    fr: "La règle complète en un tableau 2\u00d72",
  },
  {
    key: "heading.formula-2x2",
    old: `<h4>The formula behind the 2&times;2</h4>`,
    new_: `<h4 data-i18n="heading.formula-2x2">The formula behind the 2&times;2</h4>`,
    en: "The formula behind the 2\u00d72",
    fr: "La formule derrière le tableau 2\u00d72",
  },
  {
    key: "heading.decision-in-sequence",
    old: `<h4>The decision in sequence</h4>`,
    new_: `<h4 data-i18n="heading.decision-in-sequence">The decision in sequence</h4>`,
    en: "The decision in sequence",
    fr: "La décision étape par étape",
  },
  {
    key: "heading.worked-example",
    old: `<h4>Worked example: applying the test to two policies</h4>`,
    new_: `<h4 data-i18n="heading.worked-example">Worked example: applying the test to two policies</h4>`,
    en: "Worked example: applying the test to two policies",
    fr: "Exemple concret\u00a0: appliquer le test à deux politiques",
  },
  {
    key: "heading.what-consent-means",
    old: `<h4>What &quot;consent&quot; actually means here</h4>`,
    new_: `<h4 data-i18n="heading.what-consent-means">What &quot;consent&quot; actually means here</h4>`,
    en: "What \u201cconsent\u201d actually means here",
    fr: "Ce que signifie réellement le \u00ab\u00a0consentement\u00a0\u00bb ici",
  },
  {
    key: "heading.hard-cases",
    old: `<h4>The hard cases (where the criterion is genuinely ambiguous)</h4>`,
    new_: `<h4 data-i18n="heading.hard-cases">The hard cases (where the criterion is genuinely ambiguous)</h4>`,
    en: "The hard cases (where the criterion is genuinely ambiguous)",
    fr: "Les cas difficiles (où le critère est vraiment ambigu)",
  },
  {
    key: "heading.genuinely-objective",
    old: `<h4>Why this is genuinely objective (within limits)</h4>`,
    new_: `<h4 data-i18n="heading.genuinely-objective">Why this is genuinely objective (within limits)</h4>`,
    en: "Why this is genuinely objective (within limits)",
    fr: "Pourquoi ceci est véritablement objectif (dans certaines limites)",
  },
  {
    key: "heading.objectivity-leaks",
    old: `<h4>Where objectivity leaks &mdash; honestly</h4>`,
    new_: `<h4 data-i18n="heading.objectivity-leaks">Where objectivity leaks &mdash; honestly</h4>`,
    en: "Where objectivity leaks \u2014 honestly",
    fr: "Là où l'objectivité s'effrite\u00a0\u2014 en toute honnêteté",
  },
  {
    key: "heading.policy-rule",
    old: `<h4>The policy rule that follows</h4>`,
    new_: `<h4 data-i18n="heading.policy-rule">The policy rule that follows</h4>`,
    en: "The policy rule that follows",
    fr: "La règle de politique publique qui en découle",
  },
  {
    key: "heading.what-falsifies-this",
    old: `<h4>What would falsify this</h4>`,
    new_: `<h4 data-i18n="heading.what-falsifies-this">What would falsify this</h4>`,
    en: "What would falsify this",
    fr: "Ce qui infirmerait cette théorie",
  },
  {
    key: "heading.theory-misled-policymakers",
    old: `<h3>How the Theory Misled Policymakers</h3>`,
    new_: `<h3 data-i18n="heading.theory-misled-policymakers">How the Theory Misled Policymakers</h3>`,
    en: "How the Theory Misled Policymakers",
    fr: "Comment la théorie a égaré les décideurs",
  },
  {
    key: "heading.quadratic-nonsensical",
    old: `<h3>Why the Quadratic Model Produces Nonsensical Results</h3>`,
    new_: `<h3 data-i18n="heading.quadratic-nonsensical">Why the Quadratic Model Produces Nonsensical Results</h3>`,
    en: "Why the Quadratic Model Produces Nonsensical Results",
    fr: "Pourquoi le modèle quadratique produit des résultats absurdes",
  },
  {
    key: "heading.linear-flawed",
    old: `<h4>Linear Models Are Equally Flawed</h4>`,
    new_: `<h4 data-i18n="heading.linear-flawed">Linear Models Are Equally Flawed</h4>`,
    en: "Linear Models Are Equally Flawed",
    fr: "Les modèles linéaires sont tout aussi défaillants",
  },
  {
    key: "heading.power-law-makes-sense",
    old: `<h4>Why Power Law, Inverse, and Exponential Models Make Sense</h4>`,
    new_: `<h4 data-i18n="heading.power-law-makes-sense">Why Power Law, Inverse, and Exponential Models Make Sense</h4>`,
    en: "Why Power Law, Inverse, and Exponential Models Make Sense",
    fr: "Pourquoi les modèles en loi de puissance, inverse et exponentiel sont pertinents",
  },
  {
    key: "heading.exponential-too-far",
    old: `<h4>But Even Exponential Decay Goes Too Far</h4>`,
    new_: `<h4 data-i18n="heading.exponential-too-far">But Even Exponential Decay Goes Too Far</h4>`,
    en: "But Even Exponential Decay Goes Too Far",
    fr: "Mais même la décroissance exponentielle va trop loin",
  },
  {
    key: "heading.power-law-superior",
    old: `<h4>Why the Power Law Model Is Empirically Superior</h4>`,
    new_: `<h4 data-i18n="heading.power-law-superior">Why the Power Law Model Is Empirically Superior</h4>`,
    en: "Why the Power Law Model Is Empirically Superior",
    fr: "Pourquoi le modèle en loi de puissance est empiriquement supérieur",
  },
  {
    key: "heading.power-laws-everywhere",
    old: `<h3>Power Laws Are Everywhere in Economics</h3>`,
    new_: `<h3 data-i18n="heading.power-laws-everywhere">Power Laws Are Everywhere in Economics</h3>`,
    en: "Power Laws Are Everywhere in Economics",
    fr: "Les lois de puissance sont omniprésentes en économie",
  },
  {
    key: "heading.established-power-laws",
    old: `<h4>Established Power Laws in Economics</h4>`,
    new_: `<h4 data-i18n="heading.established-power-laws">Established Power Laws in Economics</h4>`,
    en: "Established Power Laws in Economics",
    fr: "Lois de puissance établies en économie",
  },
  {
    key: "heading.why-power-laws-dominate",
    old: `<h4>Why Power Laws Dominate Economic Phenomena</h4>`,
    new_: `<h4 data-i18n="heading.why-power-laws-dominate">Why Power Laws Dominate Economic Phenomena</h4>`,
    en: "Why Power Laws Dominate Economic Phenomena",
    fr: "Pourquoi les lois de puissance dominent les phénomènes économiques",
  },
  {
    key: "heading.data-sources",
    old: `<h3>Data Sources</h3>`,
    new_: `<h3 data-i18n="heading.data-sources">Data Sources</h3>`,
    en: "Data Sources",
    fr: "Sources de données",
  },
  {
    key: "heading.correlation-causation",
    old: `<h3>But Does Correlation Mean Causation?</h3>`,
    new_: `<h3 data-i18n="heading.correlation-causation">But Does Correlation Mean Causation?</h3>`,
    en: "But Does Correlation Mean Causation?",
    fr: "Mais la corrélation implique-t-elle la causalité\u00a0?",
  },
  {
    key: "heading.endogeneity",
    old: `<h4>The Endogeneity Problem</h4>`,
    new_: `<h4 data-i18n="heading.endogeneity">The Endogeneity Problem</h4>`,
    en: "The Endogeneity Problem",
    fr: "Le problème d'endogénéité",
  },
  {
    key: "heading.causal-direction",
    old: `<h4>Why the Causal Direction Still Holds</h4>`,
    new_: `<h4 data-i18n="heading.causal-direction">Why the Causal Direction Still Holds</h4>`,
    en: "Why the Causal Direction Still Holds",
    fr: "Pourquoi la direction causale reste valide",
  },
  {
    key: "heading.natural-experiments",
    old: `<h4>The Natural Experiments: Countries That Changed Course</h4>`,
    new_: `<h4 data-i18n="heading.natural-experiments">The Natural Experiments: Countries That Changed Course</h4>`,
    en: "The Natural Experiments: Countries That Changed Course",
    fr: "Les expériences naturelles\u00a0: des pays qui ont changé de cap",
  },
  {
    key: "heading.countries-cut-boomed",
    old: `<h5>Countries That Cut Spending and Boomed:</h5>`,
    new_: `<h5 data-i18n="heading.countries-cut-boomed">Countries That Cut Spending and Boomed:</h5>`,
    en: "Countries That Cut Spending and Boomed:",
    fr: "Pays ayant réduit leurs dépenses et connu une forte croissance\u00a0:",
  },
  {
    key: "heading.countries-expanded-stagnated",
    old: `<h5>Countries That Expanded Spending and Stagnated:</h5>`,
    new_: `<h5 data-i18n="heading.countries-expanded-stagnated">Countries That Expanded Spending and Stagnated:</h5>`,
    en: "Countries That Expanded Spending and Stagnated:",
    fr: "Pays ayant augmenté leurs dépenses et stagné\u00a0:",
  },
  {
    key: "heading.remaining-limitations",
    old: `<h4>Remaining Limitations</h4>`,
    new_: `<h4 data-i18n="heading.remaining-limitations">Remaining Limitations</h4>`,
    en: "Remaining Limitations",
    fr: "Limites restantes",
  },
  {
    key: "heading.nordic-question",
    old: `<h3 id="nordic-question">The Nordic Question: Rich Despite High Spending, or Rich Before High Spending?</h3>`,
    new_: `<h3 id="nordic-question" data-i18n="heading.nordic-question">The Nordic Question: Rich Despite High Spending, or Rich Before High Spending?</h3>`,
    en: "The Nordic Question: Rich Despite High Spending, or Rich Before High Spending?",
    fr: "La question nordique\u00a0: riches malgré des dépenses élevées, ou riches avant des dépenses élevées\u00a0?",
  },
  {
    key: "heading.nordic-growth-rates",
    old: `<h5>Nordic growth rates vs. their spending (avg. 2005–2019):</h5>`,
    new_: `<h5 data-i18n="heading.nordic-growth-rates">Nordic growth rates vs. their spending (avg. 2005–2019):</h5>`,
    en: "Nordic growth rates vs. their spending (avg. 2005\u20132019):",
    fr: "Taux de croissance nordiques vs leurs dépenses (moy. 2005\u20132019)\u00a0:",
  },
  {
    key: "heading.scatter-explanation",
    // Multi-line heading: match enough to be unique
    old: `<h3>\n            Why There's Still Scatter Even Though Government Size Matters Most`,
    new_: `<h3 data-i18n="heading.scatter-explanation">\n            Why There's Still Scatter Even Though Government Size Matters Most`,
    en: "Why There\u2019s Still Scatter Even Though Government Size Matters Most",
    fr: "Pourquoi il reste de la dispersion même si la taille de l'État est le facteur principal",
  },
  {
    key: "heading.key-growth-factors",
    old: `<h4>Key Growth Factors Beyond Government Size</h4>`,
    new_: `<h4 data-i18n="heading.key-growth-factors">Key Growth Factors Beyond Government Size</h4>`,
    en: "Key Growth Factors Beyond Government Size",
    fr: "Autres facteurs clés de croissance au-delà de la taille de l'État",
  },
  {
    key: "heading.factor-institutional-quality",
    old: `<h5>1. Institutional Quality</h5>`,
    new_: `<h5 data-i18n="heading.factor-institutional-quality">1. Institutional Quality</h5>`,
    en: "1. Institutional Quality",
    fr: "1. Qualité institutionnelle",
  },
  {
    key: "heading.factor-development-stage",
    old: `<h5>2. Development Stage and Catch-Up Potential</h5>`,
    new_: `<h5 data-i18n="heading.factor-development-stage">2. Development Stage and Catch-Up Potential</h5>`,
    en: "2. Development Stage and Catch-Up Potential",
    fr: "2. Stade de développement et potentiel de rattrapage",
  },
  {
    key: "heading.factor-demographics",
    old: `<h5>3. Demographics and Human Capital</h5>`,
    new_: `<h5 data-i18n="heading.factor-demographics">3. Demographics and Human Capital</h5>`,
    en: "3. Demographics and Human Capital",
    fr: "3. Démographie et capital humain",
  },
  {
    key: "heading.factor-economic-structure",
    old: `<h5>4. Economic Structure and Openness</h5>`,
    new_: `<h5 data-i18n="heading.factor-economic-structure">4. Economic Structure and Openness</h5>`,
    en: "4. Economic Structure and Openness",
    fr: "4. Structure économique et ouverture",
  },
  {
    key: "heading.factor-innovation",
    old: `<h5>5. Innovation and Technology</h5>`,
    new_: `<h5 data-i18n="heading.factor-innovation">5. Innovation and Technology</h5>`,
    en: "5. Innovation and Technology",
    fr: "5. Innovation et technologie",
  },
  {
    key: "heading.factor-macrostability",
    old: `<h5>6. Macroeconomic Stability</h5>`,
    new_: `<h5 data-i18n="heading.factor-macrostability">6. Macroeconomic Stability</h5>`,
    en: "6. Macroeconomic Stability",
    fr: "6. Stabilité macroéconomique",
  },
  {
    key: "heading.factor-resources-geography",
    old: `<h5>7. Natural Resources and Geography</h5>`,
    new_: `<h5 data-i18n="heading.factor-resources-geography">7. Natural Resources and Geography</h5>`,
    en: "7. Natural Resources and Geography",
    fr: "7. Ressources naturelles et géographie",
  },
  {
    key: "heading.understanding-outliers",
    old: `<h4>Understanding the Outliers</h4>`,
    new_: `<h4 data-i18n="heading.understanding-outliers">Understanding the Outliers</h4>`,
    en: "Understanding the Outliers",
    fr: "Comprendre les valeurs aberrantes",
  },
  {
    key: "heading.high-growth-low-spending",
    old: `<h5>High Growth with Low Spending:</h5>`,
    new_: `<h5 data-i18n="heading.high-growth-low-spending">High Growth with Low Spending:</h5>`,
    en: "High Growth with Low Spending:",
    fr: "Forte croissance avec de faibles dépenses\u00a0:",
  },
  {
    key: "heading.low-growth-moderate-spending",
    old: `<h5>Low Growth Despite Moderate Spending:</h5>`,
    new_: `<h5 data-i18n="heading.low-growth-moderate-spending">Low Growth Despite Moderate Spending:</h5>`,
    en: "Low Growth Despite Moderate Spending:",
    fr: "Faible croissance malgré des dépenses modérées\u00a0:",
  },
  {
    key: "heading.policy-implications",
    old: `<h4>Policy Implications</h4>`,
    new_: `<h4 data-i18n="heading.policy-implications">Policy Implications</h4>`,
    en: "Policy Implications",
    fr: "Implications pour les politiques publiques",
  },
  {
    key: "heading.quadratic-persisted",
    old: `<h3>Why the Quadratic Model Persisted</h3>`,
    new_: `<h3 data-i18n="heading.quadratic-persisted">Why the Quadratic Model Persisted</h3>`,
    en: "Why the Quadratic Model Persisted",
    fr: "Pourquoi le modèle quadratique a persisté",
  },
  {
    key: "heading.political-economy",
    old: `<h3>The Political Economy of Model Selection</h3>`,
    new_: `<h3 data-i18n="heading.political-economy">The Political Economy of Model Selection</h3>`,
    en: "The Political Economy of Model Selection",
    fr: "L'économie politique du choix de modèle",
  },
  {
    key: "heading.power-law-awkward",
    old: `<h4>What Makes the Power Law Politically Awkward</h4>`,
    new_: `<h4 data-i18n="heading.power-law-awkward">What Makes the Power Law Politically Awkward</h4>`,
    en: "What Makes the Power Law Politically Awkward",
    fr: "Ce qui rend la loi de puissance politiquement gênante",
  },
  {
    key: "heading.quadratic-remained-useful",
    old: `<h4>Why the Quadratic Model Remained Useful</h4>`,
    new_: `<h4 data-i18n="heading.quadratic-remained-useful">Why the Quadratic Model Remained Useful</h4>`,
    en: "Why the Quadratic Model Remained Useful",
    fr: "Pourquoi le modèle quadratique est resté utile",
  },
  {
    key: "heading.quadratic-properties",
    old: `<h5>Properties that sustained the quadratic model:</h5>`,
    new_: `<h5 data-i18n="heading.quadratic-properties">Properties that sustained the quadratic model:</h5>`,
    en: "Properties that sustained the quadratic model:",
    fr: "Propriétés qui ont maintenu le modèle quadratique\u00a0:",
  },
  {
    key: "heading.institutional-inertia",
    old: `<h4>Institutional Inertia and Paradigm Change</h4>`,
    new_: `<h4 data-i18n="heading.institutional-inertia">Institutional Inertia and Paradigm Change</h4>`,
    en: "Institutional Inertia and Paradigm Change",
    fr: "Inertie institutionnelle et changement de paradigme",
  },
  {
    key: "heading.opportunity-cost",
    old: `<h4>The Opportunity Cost of Model Choice</h4>`,
    new_: `<h4 data-i18n="heading.opportunity-cost">The Opportunity Cost of Model Choice</h4>`,
    en: "The Opportunity Cost of Model Choice",
    fr: "Le coût d'opportunité du choix de modèle",
  },
  {
    key: "heading.cite-this-page",
    old: `<h2>Cite This Page</h2>`,
    new_: `<h2 data-i18n="heading.cite-this-page">Cite This Page</h2>`,
    en: "Cite This Page",
    fr: "Citer cette page",
  },
  {
    key: "heading.apa",
    old: `<h4 style="margin: 12px 0 4px">APA</h4>`,
    new_: `<h4 style="margin: 12px 0 4px" data-i18n="heading.apa">APA</h4>`,
    en: "APA",
    fr: "APA",
  },
  {
    key: "heading.embed",
    old: `<h2>Embed This Simulator</h2>`,
    new_: `<h2 data-i18n="heading.embed">Embed This Simulator</h2>`,
    en: "Embed This Simulator",
    fr: "Intégrer ce simulateur",
  },
  {
    key: "heading.right-to-growth",
    old: `<h2>The Right to Economic Growth</h2>`,
    new_: `<h2 data-i18n="heading.right-to-growth">The Right to Economic Growth</h2>`,
    en: "The Right to Economic Growth",
    fr: "Le droit à la croissance économique",
  },
  {
    key: "heading.empirical-foundation",
    old: `<h4>Empirical Foundation</h4>`,
    new_: `<h4 data-i18n="heading.empirical-foundation">Empirical Foundation</h4>`,
    en: "Empirical Foundation",
    fr: "Fondement empirique",
  },
  {
    key: "heading.institutional-protections",
    old: `<h4>Essential Institutional Protections</h4>`,
    new_: `<h4 data-i18n="heading.institutional-protections">Essential Institutional Protections</h4>`,
    en: "Essential Institutional Protections",
    fr: "Protections institutionnelles essentielles",
  },
  {
    key: "heading.constitutional-frameworks",
    old: `<h4>Constitutional and Legal Frameworks:</h4>`,
    new_: `<h4 data-i18n="heading.constitutional-frameworks">Constitutional and Legal Frameworks:</h4>`,
    en: "Constitutional and Legal Frameworks:",
    fr: "Cadres constitutionnels et juridiques\u00a0:",
  },
  {
    key: "heading.market-preserving",
    old: `<h4>Market-Preserving Institutions:</h4>`,
    new_: `<h4 data-i18n="heading.market-preserving">Market-Preserving Institutions:</h4>`,
    en: "Market-Preserving Institutions:",
    fr: "Institutions préservant le marché\u00a0:",
  },
  {
    key: "heading.transparency-accountability",
    old: `<h4>Transparency and Accountability Mechanisms:</h4>`,
    new_: `<h4 data-i18n="heading.transparency-accountability">Transparency and Accountability Mechanisms:</h4>`,
    en: "Transparency and Accountability Mechanisms:",
    fr: "Mécanismes de transparence et de responsabilité\u00a0:",
  },
  {
    key: "heading.current-threats",
    old: `<h4>Current Threats to Economic Growth Rights</h4>`,
    new_: `<h4 data-i18n="heading.current-threats">Current Threats to Economic Growth Rights</h4>`,
    en: "Current Threats to Economic Growth Rights",
    fr: "Menaces actuelles contre le droit à la croissance économique",
  },
  {
    key: "heading.systemic-threats",
    old: `<h4>Systemic Institutional Threats:</h4>`,
    new_: `<h4 data-i18n="heading.systemic-threats">Systemic Institutional Threats:</h4>`,
    en: "Systemic Institutional Threats:",
    fr: "Menaces institutionnelles systémiques\u00a0:",
  },
  {
    key: "heading.growth-destroying-policies",
    old: `<h4>Direct Growth-Destroying Policies:</h4>`,
    new_: `<h4 data-i18n="heading.growth-destroying-policies">Direct Growth-Destroying Policies:</h4>`,
    en: "Direct Growth-Destroying Policies:",
    fr: "Politiques directement destructrices de croissance\u00a0:",
  },
  {
    key: "heading.protecting-growth-rights",
    old: `<h4>Protecting Growth Rights in Practice</h4>`,
    new_: `<h4 data-i18n="heading.protecting-growth-rights">Protecting Growth Rights in Practice</h4>`,
    en: "Protecting Growth Rights in Practice",
    fr: "Protéger le droit à la croissance dans la pratique",
  },
];

// ── 1. Patch armey-curve.html ─────────────────────────────────────────────────
const htmlPath = resolve(root, "armey-curve.html");
let html = readFileSync(htmlPath, "utf8");
let changed = 0;
let notFound = [];

for (const h of HEADINGS) {
  if (html.includes(h.old)) {
    // replace only the first occurrence (string.replace with string arg)
    html = html.replace(h.old, h.new_);
    changed++;
  } else {
    notFound.push(h.key);
  }
}

writeFileSync(htmlPath, html, "utf8");
console.log(`armey-curve.html: ${changed}/${HEADINGS.length} headings tagged`);
if (notFound.length) {
  console.warn("⚠ NOT FOUND:", notFound.join(", "));
}

// ── 2. Update JSON locale files ───────────────────────────────────────────────
function updateJson(filePath, buildEntry) {
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  let added = 0;
  for (const h of HEADINGS) {
    if (!(h.key in data)) {
      data[h.key] = buildEntry(h);
      added++;
    }
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${filePath}: +${added} keys`);
}

updateJson(resolve(root, "armey-curve.en.json"), h => h.en);
updateJson(resolve(root, "armey-curve.fr.json"), h => h.fr);

console.log("Done. Run: node scripts/build-locale.mjs fr");
