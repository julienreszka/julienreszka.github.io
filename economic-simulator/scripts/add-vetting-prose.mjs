// Appends the shadow-price vetting precondition bullet to list.objectivity-leaks
// in both locale JSON files.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const EN_BULLET = `\\n            <li>\\n              <strong>Independent vetting of shadow prices is a validity precondition, not a quality improvement.</strong>\\n              Self-declared conflicts of interest are insufficient — the same GIGO problem that afflicts the prices\\n              also afflicts the declaration. Before any estimate enters the criterion, it must be cross-referenced\\n              against at least two independent sources the estimator does not control: their own financial\\n              disclosures and balance-sheet valuations (IFRS/GAAP asset impairment), credit-market pricing\\n              (bond spreads and CDS that price the same environmental liability at arm's length), insurance\\n              premiums on comparable risks, and observed transaction prices for comparable capital assets.\\n              If any external party's prices have not been independently cross-referenced, the brake output\\n              is undefined — the function throws rather than returning a value that cannot be trusted.\\n            </li>`;

const FR_BULLET = `\\n            <li>\\n              <strong>La vérification indépendante des prix d'ombre est une condition de validité, pas une amélioration de la qualité.</strong>\\n              La déclaration de conflits d'intérêts est insuffisante — le même problème GIGO qui affecte les prix\\n              affecte aussi la déclaration. Avant qu'une estimation entre dans le critère, elle doit être\\n              recoupée avec au moins deux sources indépendantes que l'estimateur ne contrôle pas : ses propres\\n              divulgations financières et évaluations au bilan (dépréciation d'actifs IFRS/GAAP), la tarification\\n              du marché du crédit (spreads obligataires et CDS qui valorisent la même responsabilité\\n              environnementale à distance), les primes d'assurance sur des risques comparables, et les prix\\n              de transaction observés pour des actifs en capital comparables.\\n              Si les prix de l'une des parties externes n'ont pas été recoupés indépendamment, le résultat\\n              du frein est indéfini — la fonction lance une erreur plutôt que de retourner une valeur\\n              qui ne peut pas être fiable.\\n            </li>`;

for (const [file, bullet] of [
  ["armey-curve.en.json", EN_BULLET],
  ["armey-curve.fr.json", FR_BULLET],
]) {
  const path = resolve(root, file);
  let raw = readFileSync(path, "utf8");
  const key = '"list.objectivity-leaks"';
  const idx = raw.indexOf(key);
  if (idx === -1) throw new Error(`Key not found in ${file}`);
  // Find the closing \" of the value (last unescaped " before the next key)
  // The value is a JSON string; find the closing quote by scanning from end
  // of the key's value. The value starts after ": "
  const valueStart = raw.indexOf('": "', idx) + 4;
  // Walk backwards from next top-level key to find the closing quote
  const nextKey = raw.indexOf('\n  "', valueStart);
  // closing quote is the last `"` before the newline+whitespace+`"`
  const closingQuote = raw.lastIndexOf('"', nextKey - 1);
  if (raw[closingQuote] !== '"') throw new Error("Could not find closing quote");

  if (raw.slice(closingQuote - 10, closingQuote).includes("fiable")) {
    console.log(`${file}: already patched, skipping`);
    continue;
  }
  if (raw.slice(closingQuote - 10, closingQuote).includes("trusted")) {
    console.log(`${file}: already patched, skipping`);
    continue;
  }

  raw = raw.slice(0, closingQuote) + bullet + raw.slice(closingQuote);
  writeFileSync(path, raw, "utf8");
  console.log(`${file}: patched`);
}
