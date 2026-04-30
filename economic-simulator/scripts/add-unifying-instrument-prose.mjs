// Adds the unifying-instrument keys to both locale JSON files.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const EN = {
  "heading.unifying-instrument": "How the brake is applied: one instrument",
  "prose.unifying-instrument-intro-p":
    "<code>shouldBrake</code> outputs a verdict. The verdict has to be executed by some instrument &mdash; tax, quota, ban, liability, disclosure mandate. Each instrument has its own capture surface, so this looks like a second hard problem stacked on top of the first. It collapses to a much simpler answer once you ask which instrument self-enforces, prices the externality (not the transaction), and gives the state no fiscal interest in the activity continuing. <strong>Strict liability with mandatory insurance covering the maximum credible loss</strong> &mdash; no liability cap, in a competitive insurance market, not subsidised by the state &mdash; is the only instrument that satisfies all those constraints simultaneously.",
  "list.unifying-instrument-properties":
    "<li><strong>Prices the externality, not the transaction.</strong> The premium tracks expected damage. A clean activity pays nothing; a damaging one pays heavily. VAT on energy fails this test: it taxes nuclear and coal at the same rate.</li><li><strong>Self-enforcing.</strong> The operator either holds a policy or they don't. There is no regulator deciding case-by-case, so there is nothing to capture. Verification is binary and contractual.</li><li><strong>Adversarial verification built in.</strong> The insurer pays out on harm, so they price it correctly, audit the operator, demand evidence, and refuse coverage on bad risks. They are the vetter you do not have to appoint, with skin in the game by construction. Measurement integrity becomes the insurer's problem &mdash; and they have a financial incentive to solve it.</li><li><strong>State has no fiscal stake in the activity continuing.</strong> Premiums go to insurers, not the Treasury. This breaks the dependency that turns &quot;green taxes&quot; into structural rent extraction (TICPE in France, ~&euro;33B/year, is paid into the general budget &mdash; the Treasury cannot afford for the activity to actually shrink).</li><li><strong>Tail risk handled automatically.</strong> If the maximum credible loss exceeds insurance market capacity, no policy is written and the activity is braked by the absence of coverage. This is how nuclear works in jurisdictions without Price&ndash;Anderson-style caps, and how gain-of-function research <em>should</em> work.</li><li><strong>Scales automatically with evidence.</strong> As harm materialises, premiums rise. As risk-reducing technology improves, premiums fall. No legislative reset required &mdash; the system updates as a side-effect of insurers protecting their reserves.</li>",
  "prose.unifying-instrument-conclusion-p":
    "The hard part is not picking the instrument. The hard part is three preconditions that political systems resist: <strong>no liability cap</strong> (Price&ndash;Anderson-style legislation is the standard failure mode), <strong>competitive insurance markets</strong> (cartelisation lets insurers under-price collusively), and <strong>no state subsidy of premiums</strong> (which would transfer the externality back to taxpayers and reintroduce the fiscal-capture problem). Where those three preconditions hold, the criterion needs almost no machinery. Where they fail, the criterion produces a verdict that nobody is structurally equipped to honour. The <code>requiredInsuranceCoverage</code> helper makes this concrete: it returns the policy size the operator must hold, derived from exactly the same certainty-equivalent prices that feed <code>shouldBrake</code>.",
};

const FR = {
  "heading.unifying-instrument": "Comment le frein est appliqué : un seul instrument",
  "prose.unifying-instrument-intro-p":
    "<code>shouldBrake</code> rend un verdict. Le verdict doit être exécuté par un instrument &mdash; taxe, quota, interdiction, responsabilité, obligation de divulgation. Chaque instrument a sa propre surface de capture, ce qui ressemble à un second problème difficile empilé sur le premier. Tout s'effondre vers une réponse beaucoup plus simple lorsqu'on demande quel instrument s'auto-applique, tarifie l'externalité (pas la transaction), et ne donne à l'État aucun intérêt budgétaire à la poursuite de l'activité. <strong>La responsabilité stricte avec assurance obligatoire couvrant la perte maximale crédible</strong> &mdash; sans plafond de responsabilité, sur un marché d'assurance concurrentiel, non subventionné par l'État &mdash; est le seul instrument qui satisfait simultanément toutes ces contraintes.",
  "list.unifying-instrument-properties":
    "<li><strong>Tarifie l'externalité, pas la transaction.</strong> La prime suit le dommage attendu. Une activité propre ne paie rien ; une activité nuisible paie beaucoup. La TVA sur l'énergie échoue à ce test : elle taxe le nucléaire et le charbon au même taux.</li><li><strong>Auto-applicable.</strong> L'opérateur détient une police ou non. Il n'y a pas de régulateur qui décide cas par cas, donc rien à capturer. La vérification est binaire et contractuelle.</li><li><strong>Vérification antagoniste intégrée.</strong> L'assureur paie en cas de sinistre, il tarifie donc correctement, audite l'opérateur, exige des preuves et refuse la couverture des mauvais risques. Il est le vérificateur que vous n'avez pas à nommer, avec un intérêt en jeu par construction. L'intégrité des mesures devient le problème de l'assureur &mdash; et il a une incitation financière à le résoudre.</li><li><strong>L'État n'a aucun enjeu budgétaire à la poursuite de l'activité.</strong> Les primes vont aux assureurs, pas au Trésor. Cela brise la dépendance qui transforme les « taxes vertes » en extraction de rente structurelle (la TICPE en France, ~33 Mds&euro;/an, est versée au budget général &mdash; le Trésor ne peut pas se permettre que l'activité diminue réellement).</li><li><strong>Risque de queue géré automatiquement.</strong> Si la perte maximale crédible dépasse la capacité du marché de l'assurance, aucune police n'est rédigée et l'activité est freinée par l'absence de couverture. C'est ainsi que fonctionne le nucléaire dans les juridictions sans plafond de type Price&ndash;Anderson, et c'est ainsi que la recherche gain-de-fonction <em>devrait</em> fonctionner.</li><li><strong>S'adapte automatiquement aux preuves.</strong> Lorsque le dommage se matérialise, les primes augmentent. Lorsque la technologie de réduction du risque s'améliore, les primes baissent. Aucune réinitialisation législative requise &mdash; le système se met à jour comme effet secondaire de la protection des réserves des assureurs.</li>",
  "prose.unifying-instrument-conclusion-p":
    "La partie difficile n'est pas le choix de l'instrument. La partie difficile, ce sont trois conditions préalables auxquelles les systèmes politiques résistent : <strong>aucun plafond de responsabilité</strong> (la législation de type Price&ndash;Anderson est le mode d'échec standard), <strong>des marchés d'assurance concurrentiels</strong> (la cartellisation permet aux assureurs de sous-tarifer collusivement), et <strong>aucune subvention publique des primes</strong> (qui transférerait l'externalité aux contribuables et réintroduirait le problème de capture budgétaire). Là où ces trois conditions sont réunies, le critère n'a presque besoin d'aucune machinerie. Là où elles échouent, le critère produit un verdict que personne n'est structurellement équipé pour honorer. L'auxiliaire <code>requiredInsuranceCoverage</code> rend cela concret : il renvoie la taille de police que l'opérateur doit détenir, dérivée exactement des mêmes prix équivalents-certains qui alimentent <code>shouldBrake</code>.",
};

function escapeForJsonValue(s) {
  // The values in the JSON file are stored as JSON-escaped single-line strings.
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function patch(file, kv) {
  const path = resolve(root, file);
  let raw = readFileSync(path, "utf8");

  // Skip if any key is already present.
  for (const k of Object.keys(kv)) {
    if (raw.includes(`"${k}"`)) {
      console.log(`${file}: ${k} already present, skipping all`);
      return;
    }
  }

  // Insert before "prose.policy-rule-conclusion-p" line so the new section
  // appears in the right place. Actually JSON key order is preserved in
  // most parsers but order-of-iteration is not the rendering driver — the
  // HTML order is. So we can append anywhere; appending before the closing }
  // is simplest.
  const closingBrace = raw.lastIndexOf("}");
  if (closingBrace === -1) throw new Error(`No closing brace in ${file}`);

  // Find the last property line (ends with a quote, possibly followed by a comma).
  // Walk backwards from closingBrace to find last `"\n}`.
  const before = raw.slice(0, closingBrace).trimEnd();
  const lastChar = before[before.length - 1];

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
