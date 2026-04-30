/**
 * migrate-faq-to-locale.mjs
 *
 * One-time migration: adds faq.N.jsonA (plain-text JSON-LD answer) to both
 * armey-curve.en.json and armey-curve.fr.json for all 13 FAQ entries, so
 * inject-faq.mjs can read everything it needs from the locale JSONs and
 * faq-data.mjs can be deleted.
 *
 * Run: node scripts/migrate-faq-to-locale.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const base = resolve(__dir, "..");

function load(f) { return JSON.parse(readFileSync(f, "utf8")); }
function save(f, o) { writeFileSync(f, JSON.stringify(o, null, 2) + "\n"); }

const enPath = resolve(base, "armey-curve.en.json");
const frPath = resolve(base, "armey-curve.fr.json");
const en = load(enPath);
const fr = load(frPath);

// Plain-text JSON-LD answers (EN) — must match the reframed HTML content.
const jsonAen = [
  // 0
  "The Armey Curve is a theoretical relationship between government spending as a percentage of GDP and economic growth. It proposes an inverted-U shape with an optimal government size around 20–30% of GDP. Cross-country data challenges this, suggesting a power law (monotonically decreasing) relationship fits better.",
  // 1
  "Cross-country data from the World Bank consistently shows a negative correlation between government spending as a share of GDP and GDP growth rates. Countries with smaller governments (e.g. Singapore ~17%, Hong Kong ~15%) tend to outgrow high-spending peers. The relationship fits a power law better than the traditional quadratic Armey Curve.",
  // 2
  "The data does not support a precise optimal size. Unlike the quadratic Armey Curve which implies a sweet spot around 20–30% of GDP, power law models suggest growth is highest at the lowest feasible spending levels. Countries below 25% of GDP consistently outperform higher-spending peers, but a precise constitutional cap cannot be derived from a single cross-country regression.",
  // 3
  "If government spending reliably slows economic activity, its most defensible use is as a selective brake on harmful activity — pollution, overfishing, systemic financial risk — where private actors impose costs on others. Government focused on correcting negative externalities through liability rules or narrow targeted regulations can improve welfare while remaining small in budget terms.",
  // 4
  "The Nordic countries are wealthy but their growth rates are not high — Denmark averaged ~1.0% and Finland ~0.9% GDP growth in 2005–2019, exactly where the power law model places high-spending countries. Their wealth is a legacy of industrialisation built when governments were smaller. Sweden cut spending from 67% to ~49% of GDP between 1993 and 2007 and had its strongest growth decades immediately after. Wealth (a stock) persists long after the conditions that created it change; growth rates (a flow) respond more quickly.",
  // 5
  "A public-choice dynamic is likely at work: when governments fund most economic research and policy positions, institutional incentives favour frameworks compatible with continued government involvement. As James Buchanan argued, economists respond to incentives like everyone else — theory tends to lag evidence when political convenience and funding structures favour a particular conclusion.",
  // 6
  "Not necessarily. South Korea and Taiwan achieved 7–9% growth with moderate spending (~18–20% GDP) alongside significant industrial policy. Their experience shows that total spending level and institutional quality — not the absence of all state intervention — are what cross-country regressions primarily capture. Targeted industrial programs within a lean overall budget are different from broad high-spending welfare states.",
  // 7
  "Before World War II, Western European governments spent roughly 10–15% of GDP and annual per-capita growth ran at ~2–3% — consistent with where the power law curve projects at those spending levels. The post-war expansion of the welfare state shifted every major Western economy rightward along the curve into the low-growth zone. Where high-spending economies have sustained rapid growth, compositional factors — high investment shares, catch-up convergence, or off-budget financing — tend to account for the exception.",
  // 8
  "No country in the World Bank panel has government spending below ~8% of GDP. Territories with near-zero formal government either collapse and lose World Bank coverage, or informalize so completely that GDP measurement breaks down. The data cannot speak to the sub-8% range, and what institutions classify as 'state failure' often means 'a territory that permits transactions we have prohibited' — those transactions represent real welfare gains by revealed preference.",
  // 9 — reframed: external parties / ΔW_ext
  "The empirical curve answers 'how much' but not 'on what'. The article proposes a two-condition rule: government should brake an activity only when (1) it imposes a net wealth loss on external parties — those who bear a cost or receive a benefit without choosing to participate in the transaction — summed across all capital types (produced, human, natural, knowledge, institutional), and (2) the brake is cost-effective (deadweight loss + enforcement cost + capture risk ≤ |ΔW_ext|). Activities satisfying both conditions are genuine negative externalities: pollution, resource depletion beyond regeneration rates, systemic financial risk. Activities that fail either condition — voluntary transactions between willing parties, wealth-creating innovation, or choices affecting only internal participants — fall outside the criterion's scope.",
  // 10
  "GDP can be inflated by the very pathologies a brake should target. Extracting an oil field boosts GDP while depleting natural capital; transfer payments cycle through GDP without creating wealth; coerced transactions register as economic activity. Inclusive wealth — the shadow-price sum of all productive capital stocks — cannot be gamed the same way: depleting natural capital without reinvesting elsewhere shrinks it by construction. The framework follows the Dasgupta Review (2021) and the Arrow-Dasgupta-Mäler (2004) unified wealth accounting tradition.",
  // 11 — reframed: ΔW_ext and brake cost replace consent axis
  "Two binary questions produce four cells: does the activity impose a net wealth loss on external parties (ΔW_ext < 0)? and is the brake cost-effective (brake cost ≤ |ΔW_ext|)? Three of the four cells tell government to do nothing. Only the bottom-left cell — an external wealth loss that a cost-effective brake can address — gives government objective standing to act. This is a much narrower licence than 'whatever the median voter wants' and a much wider one than 'government should never act'.",
  // 12 — reframed: two conditions only
  "The criterion has two sequential conditions. First: does the activity impose a net wealth loss on external parties — those outside the transaction? This is ΔW_ext < 0 across all capital types. Second: is the brake cost-effective? The total cost of intervention — deadweight loss (Harberger triangle), enforcement cost, and expected regulatory capture risk — must not exceed |ΔW_ext|. Both conditions must hold for government to have objective standing to act.",
];

// Plain-text JSON-LD answers (FR)
const jsonAfr = [
  // 0
  "La courbe d'Armey est une relation théorique entre les dépenses publiques en pourcentage du PIB et la croissance économique. Elle propose une forme en cloche avec une taille optimale de l'État autour de 20–30 % du PIB. Les données comparatives internationales le remettent en cause : une loi de puissance (monotonement décroissante) s'ajuste mieux.",
  // 1
  "Les données mondiales de la Banque mondiale montrent systématiquement une corrélation négative entre les dépenses publiques en part du PIB et les taux de croissance du PIB. Les pays à gouvernement plus petit (ex. Singapour ~17 %, Hong Kong ~15 %) tendent à surpasser les pairs à dépenses élevées. La relation suit mieux une loi de puissance que la courbe d'Armey quadratique traditionnelle.",
  // 2
  "Les données ne permettent pas de déterminer une taille optimale précise. Contrairement à la courbe quadratique qui implique un optimum, les modèles en loi de puissance suggèrent que la croissance est maximale aux niveaux de dépenses les plus faibles. Les pays en dessous de 25 % du PIB surpassent systématiquement leurs pairs à dépenses élevées, mais un plafond constitutionnel précis ne peut pas être dérivé d'une seule régression transnationale.",
  // 3
  "Si les dépenses publiques freinent systématiquement l'activité économique, leur usage le plus défendable est de freiner sélectivement les activités nuisibles — pollution, surpêche, risque financier systémique — où des acteurs privés imposent des coûts à autrui. Un gouvernement centré sur la correction des externalités négatives peut améliorer le bien-être tout en restant budgétairement limité.",
  // 4
  "Les pays nordiques sont riches, mais leurs taux de croissance ne sont pas élevés — le Danemark a affiché ~1,0 % et la Finlande ~0,9 % de croissance du PIB en 2005–2019, exactement là où le modèle en loi de puissance place les pays à dépenses élevées. Leur richesse est l'héritage d'une industrialisation construite quand leurs gouvernements étaient plus petits. La Suède a réduit ses dépenses de 67 % à ~49 % du PIB entre 1993 et 2007 et a connu ses décennies de croissance les plus fortes immédiatement après.",
  // 5
  "Une dynamique de choix public est probablement à l'œuvre : quand les gouvernements financent la plupart des recherches économiques, les incitations institutionnelles favorisent les cadres compatibles avec un rôle continu de l'État. Comme James Buchanan l'a soutenu, les économistes répondent aux incitations comme tout le monde — la théorie tend à rester en retard sur les preuves quand la commodité politique et les structures de financement favorisent une conclusion particulière.",
  // 6
  "Pas nécessairement. La Corée du Sud et Taïwan ont atteint 7–9 % de croissance avec des dépenses modérées (~18–20 % du PIB) accompagnées d'une politique industrielle significative. Leur expérience montre que le niveau total des dépenses et la qualité institutionnelle — pas l'absence de toute intervention étatique — sont ce que les régressions transnationales capturent principalement.",
  // 7
  "Avant la Seconde Guerre mondiale, les gouvernements d'Europe occidentale dépensaient environ 10–15 % du PIB et la croissance annuelle par habitant était de ~2–3 % — cohérent avec ce que la courbe en loi de puissance projette à ces niveaux de dépenses. L'expansion de l'État-providence après-guerre a déplacé chaque grande économie occidentale vers la droite de la courbe dans la zone de faible croissance.",
  // 8
  "Aucun pays dans le panel de la Banque mondiale n'a des dépenses publiques inférieures à ~8 % du PIB. Les territoires à gouvernement quasi nul s'effondrent ou s'informalisent au point que la mesure du PIB s'effondre. Les données ne peuvent pas parler de la plage sous les 8 %, et ce que les institutions classent comme 'défaillance de l'État' signifie souvent 'un territoire qui permet des transactions que nous avons interdites'.",
  // 9 — reframed
  "La courbe empirique répond à 'combien' mais pas à 'pour quoi'. L'article propose une règle à deux conditions : le gouvernement ne doit freiner une activité que lorsque (1) elle impose une perte de richesse nette sur des parties externes — celles qui supportent un coût sans avoir choisi de participer à la transaction — sommée sur tous les types de capital, et (2) le frein est rentable (perte sèche + coût d'application + risque de capture ≤ |ΔW_ext|). Les activités satisfaisant les deux conditions sont de véritables externalités négatives : pollution, épuisement des ressources, risque financier systémique.",
  // 10
  "Le PIB peut être gonflé par les pathologies mêmes qu'un frein devrait cibler. Extraire un champ pétrolier augmente le PIB tout en épuisant le capital naturel. La richesse inclusive — la somme à prix d'ombre de tous les stocks de capital productif — ne peut pas être manipulée de la même manière. Le cadre suit le Rapport Dasgupta (2021) et la tradition de comptabilité de richesse Arrow-Dasgupta-Mäler (2004).",
  // 11 — reframed
  "Deux questions binaires produisent quatre cellules : l'activité impose-t-elle une perte de richesse nette sur des parties externes (ΔW_ext < 0) ? et le frein est-il rentable (coût du frein ≤ |ΔW_ext|) ? Trois des quatre cellules disent à l'État de ne rien faire. Seule la cellule inférieure gauche — une perte de richesse externe qu'un frein rentable peut adresser — donne à l'État une légitimité objective pour agir.",
  // 12 — reframed
  "Le critère a deux conditions séquentielles. Première : l'activité impose-t-elle une perte de richesse nette sur des parties externes — celles extérieures à la transaction ? C'est ΔW_ext < 0 sur tous les types de capital. Deuxième : le frein est-il rentable ? Le coût total de l'intervention — perte sèche, coût d'application et risque de capture réglementaire — ne doit pas dépasser |ΔW_ext|. Les deux conditions doivent être réunies pour que l'État ait une légitimité objective à agir.",
];

for (let i = 0; i < 13; i++) {
  en[`faq.${i}.jsonA`] = jsonAen[i];
  fr[`faq.${i}.jsonA`] = jsonAfr[i];
}

save(enPath, en);
console.log(`✔ Added faq.N.jsonA (0–12) to armey-curve.en.json`);

save(frPath, fr);
console.log(`✔ Added faq.N.jsonA (0–12) to armey-curve.fr.json`);
