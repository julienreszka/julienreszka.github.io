import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const NEW_LI_EN =
  '\n            <li>\n' +
  '              <strong>Shadow prices carry uncertainty, not just point estimates.</strong>\n' +
  '              The criterion prices in $\\sigma_p$ via a certainty-equivalent:\n' +
  '              $p^* = \\max(0,\\, \\mu - \\lambda\\sigma)$, with $\\lambda = 2$ for irreversible\n' +
  '              capital (Arrow&ndash;Fisher&ndash;Hanemann quasi-option value; Dasgupta Review\n' +
  '              on natural-capital irreversibility) and $\\lambda = 0.5$ for reversible\n' +
  '              capital. This raises the burden of proof when damage is both uncertain\n' +
  '              and irreversible. The corollary is an\n' +
  '              <strong>endogenous research incentive</strong>: any party that funds work\n' +
  '              shrinking $\\sigma_p$ &mdash; better measurement, basic science &mdash; lowers\n' +
  '              the precautionary premium and moves the brake decision toward its true\n' +
  '              expected-value verdict. This is the value of information\n' +
  '              (<a href="https://www.jstor.org/stable/2296340" target="_blank" rel="noopener">Arrow 1972</a>)\n' +
  '              made operational.\n' +
  '            </li>';

const NEW_LI_FR =
  '\n            <li>\n' +
  '              <strong>Les prix d\'ombre portent une incertitude, pas seulement des estimations ponctuelles.</strong>\n' +
  '              Le critère intègre $\\sigma_p$ via un équivalent-certain :\n' +
  '              $p^* = \\max(0,\\, \\mu - \\lambda\\sigma)$, avec $\\lambda = 2$ pour le capital\n' +
  '              irréversible (valeur quasi-optionnelle Arrow&ndash;Fisher&ndash;Hanemann ;\n' +
  '              Rapport Dasgupta sur l\'irréversibilité du capital naturel) et $\\lambda = 0{,}5$\n' +
  '              pour le capital réversible. Cela élève l\'exigence de preuve lorsque le\n' +
  '              préjudice est à la fois incertain et irréversible. Le corollaire est une\n' +
  '              <strong>incitation endogène à la recherche</strong> : toute partie qui finance\n' +
  '              des travaux réduisant $\\sigma_p$ &mdash; meilleure mesure, science fondamentale\n' +
  '              &mdash; abaisse la prime de précaution et rapproche la décision de freinage\n' +
  '              de son verdict en espérance mathématique. C\'est la valeur de l\'information\n' +
  '              (<a href="https://www.jstor.org/stable/2296340" target="_blank" rel="noopener">Arrow 1972</a>)\n' +
  '              rendue opérationnelle.\n' +
  '            </li>';

const ANCHOR_EN = 'a different tool.\\n            </li>"';
const ANCHOR_FR = 'nécessite un outil différent.\\n            </li>"';

function patch(file, anchor, newLi) {
  const raw = readFileSync(file, "utf8");
  if (!raw.includes(anchor)) {
    throw new Error(`anchor not found in ${file}`);
  }
  if (raw.includes("Arrow 1972")) {
    console.log(`${file}: already contains Arrow 1972 bullet — skipping.`);
    return;
  }
  // The anchor ends the JSON string value. We insert the new <li> (as a JSON
  // escaped string) before the closing quote, then the rest continues as normal.
  const escapedNewLi = newLi
    .replace(/\\/g, "\\\\")   // backslash → \\
    .replace(/"/g, '\\"')     // " → \"
    .replace(/\n/g, "\\n");   // newline → \n
  const patched = raw.replace(anchor, `a different tool.\\n            </li>${escapedNewLi}"`.replace("a different tool.", anchor.replace('\\n            </li>"', '')));
  // Simpler: just find the anchor and insert before the closing quote
  const idx = raw.indexOf(anchor);
  const insertAt = idx + anchor.length - 1; // position of the closing "
  const result = raw.slice(0, insertAt) + escapedNewLi + raw.slice(insertAt);
  writeFileSync(file, result, "utf8");
  console.log(`${file}: patched.`);
}

patch(resolve(root, "armey-curve.en.json"), ANCHOR_EN, NEW_LI_EN);
patch(resolve(root, "armey-curve.fr.json"), ANCHOR_FR, NEW_LI_FR);
