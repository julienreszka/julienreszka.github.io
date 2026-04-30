/**
 * add-childhood-example-key.mjs
 * Adds prose.worked-example-childhood-p to both locale JSONs,
 * inserted after prose.worked-example-grant-p.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const base = resolve(__dir, "..");

function load(f) { return JSON.parse(readFileSync(f, "utf8")); }
function save(f, o) { writeFileSync(f, JSON.stringify(o, null, 2) + "\n"); }
function insertAfter(obj, afterKey, newKey, newVal) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = v;
    if (k === afterKey) result[newKey] = newVal;
  }
  return result;
}

const KEY = "prose.worked-example-childhood-p";
const AFTER = "prose.worked-example-grant-p";

const enVal = `Early childhood development. Children are categorically external parties: they cannot choose to participate in, exit, or negotiate the conditions of their upbringing. Parental, community, and state decisions — nutrition, environmental exposures (lead, air pollution), stimulation and care quality, violence — impose irreversible costs on the child as an external party. The empirical record is unusually strong: ΔK_human ≪ 0 from ACE (adverse childhood experience) dose-response studies; childhood blood-lead at 10 μg/dL reduces IQ by 2–5 points with documented downstream crime and earnings effects (Nevin 2000; Reyes 2007); iodine deficiency during pregnancy costs 10–15 IQ points at a brake cost of ~$0.05/person/year for salt iodization. The externality falls on a party who cannot consent on their own behalf, the harm is largely irreversible (raising shadow prices for irreversibility), and cost-effective brakes exist with well-documented returns. Heckman's estimates of $7–13 return per dollar on high-quality early childhood programs clear Q2 comfortably. Verdict: brake environmental and nutritional externalities imposing costs on children; apply precaution proportional to irreversibility.`;

const frVal = `Développement de la petite enfance. Les enfants sont par définition des parties externes : ils ne peuvent pas choisir de participer, de sortir ou de négocier les conditions de leur éducation. Les décisions des parents, des communautés et de l'État — nutrition, expositions environnementales (plomb, pollution de l'air), qualité des soins et de la stimulation, violence — imposent des coûts irréversibles à l'enfant en tant que partie externe. Les données empiriques sont inhabituellement solides : ΔK_humain ≪ 0 d'après les études dose-réponse sur les expériences négatives de l'enfance (ACE) ; un taux de plomb sanguin de 10 μg/dL dans l'enfance réduit le QI de 2 à 5 points avec des effets documentés sur la criminalité et les revenus futurs (Nevin 2000 ; Reyes 2007) ; la carence en iode pendant la grossesse coûte 10 à 15 points de QI pour un coût de frein de ~0,05 $/personne/an pour l'iodation du sel. L'externalité pèse sur une partie qui ne peut pas consentir en son propre nom, le préjudice est en grande partie irréversible (ce qui augmente les prix fictifs pour l'irréversibilité), et des freins rentables existent avec des rendements bien documentés. Les estimations de Heckman de 7 à 13 dollars de retour par dollar investi dans des programmes de la petite enfance de haute qualité franchissent largement le seuil Q2. Verdict : freiner les externalités environnementales et nutritionnelles imposant des coûts aux enfants ; appliquer la précaution proportionnellement à l'irréversibilité.`;

const enPath = resolve(base, "armey-curve.en.json");
const frPath = resolve(base, "armey-curve.fr.json");

save(enPath, insertAfter(load(enPath), AFTER, KEY, enVal));
console.log("✔ armey-curve.en.json updated");

save(frPath, insertAfter(load(frPath), AFTER, KEY, frVal));
console.log("✔ armey-curve.fr.json updated");
