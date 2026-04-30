/**
 * fix-worked-example-count.mjs
 * Updates heading.worked-example and prose.worked-example-intro-p in both
 * locale JSONs to reflect three examples instead of two.
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

en["heading.worked-example"] = "Worked examples: applying the test to three policies";
en["prose.worked-example-intro-p"] = `The criterion is only useful if it produces unambiguous verdicts on
            real cases. Three contrasting examples:`;

fr["heading.worked-example"] = "Exemples pratiques : appliquer le test à trois politiques";
fr["prose.worked-example-intro-p"] = `Le critère n'est utile que s'il produit des verdicts non ambigus sur des
            cas réels. Trois exemples contrastés :`;

save(enPath, en);
console.log("✔ armey-curve.en.json updated");

save(frPath, fr);
console.log("✔ armey-curve.fr.json updated");
