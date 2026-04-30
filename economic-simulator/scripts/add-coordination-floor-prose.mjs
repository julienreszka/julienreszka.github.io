// Adds the coordination-floor keys to both locale JSON files.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const EN = {
  "heading.coordination-floor": "When does one country suffice? Three cases",
  "prose.coordination-floor-intro-p":
    "The criterion's natural unit is the externality's footprint, but our institutions are geographic. Whether per-country implementation is sufficient depends on a quantity the framework already encodes: the share of external loss that falls on parties <em>outside</em> the deciding jurisdiction. <code>coordinationFloor(a)</code> reads that share directly from <code>affectedParties</code>. The number it returns sorts activities into three structurally different regimes &mdash; not a continuum but three different problems.",
  "list.coordination-floor-cases":
    "<li><strong>Case 1 &mdash; local externality (floor &asymp; 0).</strong> All external parties reside in the deciding jurisdiction: water pollution, regional smog, soil contamination, urban noise, land-use change, most labour conditions. Per-country implementation is not just adequate; it is optimal. There is no leakage problem because the externality cannot leak across a border it does not cross. <em>Most of what governments actually regulate falls here.</em></li><li><strong>Case 2 &mdash; trade-coupled externality (0 &lt; floor &lt; 1).</strong> Water embedded in agricultural exports, deforestation behind cattle exports, labour conditions in supply chains. The harm happens in country B but the demand pull comes from country A. The brake belongs at the <em>consumption</em> point, not the production point. Border adjustments (the EU's CBAM is the early version) carry the brake to where the demand actually originates &mdash; this is not a workaround, it is the correct location of the brake when the producer-side framing is wrong.</li><li><strong>Case 3 &mdash; global externality (floor &rarr; 1).</strong> Greenhouse gases, ozone-depleting substances, ocean fishery collapse, antibiotic resistance, weapons-grade fissile material, gain-of-function pathogens. The externality is genuinely fungible across all geography. Coordination is constitutive of the brake, not an enhancement. Climate clubs (Nordhaus 2015), MFN reciprocity, and linked liability schemes all converge to the same result: leakage falls toward zero as the coordinated bloc approaches global market share. Below ~50% of global activity in the bloc, leakage is significant; above ~70% it is <em>de minimis</em>.</li>",
  "prose.coordination-floor-conclusion-p":
    "This makes the &quot;competitiveness&quot; objection precise. The objection has bite for Case 3 specifically &mdash; not as a flaw in the criterion, but as a coordination problem the criterion correctly identifies. For Cases 1 and 2 the objection is a category error: country A's residents win on inclusive wealth even when country A's GDP-share-of-cement-production falls. The Changing Wealth of Nations data shows the pattern repeatedly &mdash; resource-dependent economies post rising GDP per capita and falling per-capita inclusive wealth. They are &quot;competitive&quot; only on the wrong metric. The criterion's job is to make the right metric legible, including when unilateral action is sufficient (most cases), partial (trade-coupled cases), or genuinely insufficient without coordination (planet-scale cases).",
};

const FR = {
  "heading.coordination-floor": "Quand un seul pays suffit-il ? Trois cas",
  "prose.coordination-floor-intro-p":
    "L'unité naturelle du critère est l'empreinte de l'externalité, mais nos institutions sont géographiques. Savoir si la mise en œuvre par pays suffit dépend d'une quantité que le cadre encode déjà : la part de la perte externe qui retombe sur des parties <em>hors</em> de la juridiction décidante. <code>coordinationFloor(a)</code> lit cette part directement depuis <code>affectedParties</code>. Le nombre renvoyé classe les activités en trois régimes structurellement différents &mdash; non un continuum mais trois problèmes distincts.",
  "list.coordination-floor-cases":
    "<li><strong>Cas 1 &mdash; externalité locale (plancher &asymp; 0).</strong> Toutes les parties externes résident dans la juridiction décidante : pollution de l'eau, smog régional, contamination des sols, bruit urbain, changement d'usage des terres, la plupart des conditions de travail. La mise en œuvre par pays n'est pas seulement adéquate ; elle est optimale. Il n'y a pas de problème de fuite car l'externalité ne peut pas franchir une frontière qu'elle ne traverse pas. <em>La plupart de ce que les gouvernements régulent réellement relève de ce cas.</em></li><li><strong>Cas 2 &mdash; externalité couplée au commerce (0 &lt; plancher &lt; 1).</strong> Eau incorporée dans les exportations agricoles, déforestation derrière les exportations de bovins, conditions de travail dans les chaînes d'approvisionnement. Le dommage a lieu dans le pays B mais la demande vient du pays A. Le frein doit s'appliquer au point de <em>consommation</em>, pas au point de production. Les ajustements aux frontières (le MACF de l'UE en est la première version) portent le frein là où la demande prend réellement naissance &mdash; ce n'est pas un contournement, c'est la bonne localisation du frein lorsque le cadrage côté producteur est erroné.</li><li><strong>Cas 3 &mdash; externalité globale (plancher &rarr; 1).</strong> Gaz à effet de serre, substances appauvrissant l'ozone, effondrement des pêcheries océaniques, résistance aux antibiotiques, matériel fissile de qualité militaire, agents pathogènes issus de gain-de-fonction. L'externalité est véritablement fongible à l'échelle de la planète. La coordination est constitutive du frein, pas un complément. Les clubs climatiques (Nordhaus 2015), la réciprocité NPF et les régimes de responsabilité liés convergent tous vers le même résultat : la fuite tend vers zéro à mesure que le bloc coordonné approche de la part mondiale de l'activité. En dessous d'environ 50 % de l'activité mondiale dans le bloc, la fuite est significative ; au-dessus de ~70 %, elle est <em>de minimis</em>.</li>",
  "prose.coordination-floor-conclusion-p":
    "Cela rend l'objection de « compétitivité » précise. L'objection a du poids spécifiquement pour le Cas 3 &mdash; non comme un défaut du critère, mais comme un problème de coordination que le critère identifie correctement. Pour les Cas 1 et 2, l'objection est une erreur de catégorie : les résidents du pays A gagnent en richesse inclusive même lorsque la part-de-PIB-de-production-de-ciment du pays A baisse. Les données du Changing Wealth of Nations montrent ce schéma à répétition &mdash; les économies dépendantes des ressources affichent un PIB par habitant en hausse et une richesse inclusive par habitant en baisse. Elles sont « compétitives » uniquement sur la mauvaise métrique. Le travail du critère est de rendre lisible la bonne métrique, y compris lorsque l'action unilatérale est suffisante (la plupart des cas), partielle (cas couplés au commerce), ou véritablement insuffisante sans coordination (cas à l'échelle planétaire).",
};

function escapeForJsonValue(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function patch(file, kv) {
  const path = resolve(root, file);
  let raw = readFileSync(path, "utf8");

  for (const k of Object.keys(kv)) {
    if (raw.includes(`"${k}"`)) {
      console.log(`${file}: ${k} already present, skipping all`);
      return;
    }
  }

  const closingBrace = raw.lastIndexOf("}");
  if (closingBrace === -1) throw new Error(`No closing brace in ${file}`);

  const before = raw.slice(0, closingBrace).trimEnd();

  let insertion = "";
  for (const [k, v] of Object.entries(kv)) {
    insertion += `,\n  "${k}": "${escapeForJsonValue(v)}"`;
  }

  const newRaw = before + insertion + "\n}\n";
  writeFileSync(path, newRaw, "utf8");
  console.log(`${file}: added ${Object.keys(kv).length} keys`);
}

patch("armey-curve.en.json", EN);
patch("armey-curve.fr.json", FR);

// Verify both files still parse as JSON.
for (const file of ["armey-curve.en.json", "armey-curve.fr.json"]) {
  const path = resolve(root, file);
  const obj = JSON.parse(readFileSync(path, "utf8"));
  for (const k of Object.keys(EN)) {
    if (typeof obj[k] !== "string") throw new Error(`${file}: ${k} missing or wrong type`);
  }
  console.log(`${file}: valid JSON, all keys present`);
}
