// Appends the measurement-integrity precondition bullet to list.objectivity-leaks
// in both locale JSON files.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const EN_BULLET = `\\n            <li>\\n              <strong>Measurement integrity is a prior precondition to price vetting — the oracle problem.</strong>\\n              Shadow prices ultimately settle against physical stock measurements: satellite readings,\\n              sensor networks, survey data. If those measurements can be manipulated by a party that\\n              benefits from the outcome — heating a monitoring device to corrupt a prediction market\\n              that settles against it, for example — every layer above (vetting, certainty-equivalent\\n              pricing, the brake decision itself) is invalidated regardless of how rigorous it is.\\n              The trust hierarchy is: <em>measurement integrity &rarr; independent vetting &rarr;\\n              certainty-equivalent pricing &rarr; brake decision</em>.\\n              Corruption at the foundation propagates upward unconditionally.\\n              The defenses are redundancy (satellite remote sensing, adversarially motivated\\n              competing observers, cryptographically attested hardware) and making the cost of\\n              corrupting all independent measurement streams exceed the benefit — not relying\\n              on the honesty of any single sensor or data supplier.\\n            </li>`;

const FR_BULLET = `\\n            <li>\\n              <strong>L'intégrité des mesures est une condition préalable à la vérification des prix — le problème de l'oracle.</strong>\\n              Les prix d'ombre se règlent en dernière instance sur des mesures physiques des stocks :\\n              relevés satellitaires, réseaux de capteurs, données d'enquête. Si ces mesures peuvent\\n              être manipulées par une partie qui bénéficie du résultat — chauffer un dispositif de\\n              surveillance pour corrompre un marché de prédiction qui s'y règle, par exemple — chaque\\n              couche supérieure (vérification, prix équivalent-certain, la décision de freinage\\n              elle-même) est invalidée quelle que soit sa rigueur.\\n              La hiérarchie de confiance est : <em>intégrité des mesures &rarr; vérification\\n              indépendante &rarr; prix équivalent-certain &rarr; décision de freinage</em>.\\n              La corruption à la base se propage inconditionnellement vers le haut.\\n              Les défenses sont la redondance (télédétection par satellite, observateurs\\n              concurrents motivés de manière antagoniste, matériel cryptographiquement attesté)\\n              et faire en sorte que le coût de la corruption de tous les flux de mesure\\n              indépendants dépasse le bénéfice — sans compter sur l'honnêteté d'un seul\\n              capteur ou fournisseur de données.\\n            </li>`;

const SKIP_MARKERS = ["oracle problem", "problème de l'oracle"];

for (const [file, bullet] of [
  ["armey-curve.en.json", EN_BULLET],
  ["armey-curve.fr.json", FR_BULLET],
]) {
  const path = resolve(root, file);
  let raw = readFileSync(path, "utf8");

  if (SKIP_MARKERS.some(m => raw.includes(m))) {
    console.log(`${file}: already patched, skipping`);
    continue;
  }

  const key = '"list.objectivity-leaks"';
  const idx = raw.indexOf(key);
  if (idx === -1) throw new Error(`Key not found in ${file}`);
  const valueStart = raw.indexOf('": "', idx) + 4;
  const nextKey = raw.indexOf('\n  "', valueStart);
  const closingQuote = raw.lastIndexOf('"', nextKey - 1);
  if (raw[closingQuote] !== '"') throw new Error("Could not find closing quote");

  raw = raw.slice(0, closingQuote) + bullet + raw.slice(closingQuote);
  writeFileSync(path, raw, "utf8");
  console.log(`${file}: patched`);
}
