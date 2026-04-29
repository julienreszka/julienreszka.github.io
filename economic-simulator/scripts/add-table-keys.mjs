#!/usr/bin/env node
// scripts/add-table-keys.mjs
// One-time script: adds table column header keys and prose.iwc-table to
// armey-curve.en.json and armey-curve.fr.json.

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

const en = loadJson("armey-curve.en.json");
const fr = loadJson("armey-curve.fr.json");

// ── Table column header keys ────────────────────────────────────────────────
const tableColKeys = {
  "table.col.model":          ["Model",           "Modèle"],
  "table.col.r2":             ["R²",              "R²"],
  "table.col.ci-r2":         ["95% CI (R²)",     "IC 95 % (R²)"],
  "table.col.pvalue":         ["p-value",         "valeur p"],
  "table.col.variable":       ["Variable",        "Variable"],
  "table.col.marginal-r2":   ["Marginal R²",     "R² marginal"],
  "table.col.cumul-r2":      ["Cumul. R²",       "R² cumulé"],
  "table.col.slope":          ["Slope",           "Pente"],
  "table.col.interpretation": ["Interpretation",  "Interprétation"],
};

for (const [key, [enVal, frVal]] of Object.entries(tableColKeys)) {
  if (!(key in en)) en[key] = enVal;
  if (!(key in fr)) fr[key] = frVal;
}

// ── prose.iwc-table — full inner HTML of the IWC table ────────────────────
const iwcTableEn = `              <div class="table-scroll">
            <table class="ranking-table" style="margin: 12px 0">
              <thead>
                <tr>
                  <th>Activity type</th>
                  <th>Which $K_k$ shrinks</th>
                  <th>How consent fails</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Negative externalities</strong><br />
                    <em>pollution, congestion, systemic risk</em>
                  </td>
                  <td>clean air, infrastructure, financial stability</td>
                  <td>third parties never agreed to bear the cost</td>
                </tr>
                <tr>
                  <td>
                    <strong>Resource depletion</strong><br />
                    <em>extraction beyond regeneration</em>
                  </td>
                  <td>$K_{\\text{natural}}$, no offsetting investment</td>
                  <td>future generations not at the table (Hartwick violated)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Rent-seeking</strong><br />
                    <em>lobbying, regulatory capture, patent trolling</em>
                  </td>
                  <td>$K_{\\text{institutional}}$ erodes; $\\sum p_k \\Delta K_k < 0$ once that erosion is priced in <span class="math-note">(produced-capital gains are more than offset by institutional losses)</span></td>
                  <td>captured process, not voluntary exchange</td>
                </tr>
                <tr>
                  <td>
                    <strong>Fraud, coercion, monopoly by force</strong>
                  </td>
                  <td>varies (institutional, produced, human)</td>
                  <td>consent absent by definition</td>
                </tr>
                <tr>
                  <td>
                    <strong>Compulsory unfunded intergenerational transfers</strong><br />
                    <em>PAYG pensions financed by tomorrow's workers</em>
                  </td>
                  <td>young cohort's claim on $\\sum_k K_k$ <span class="math-note">(total capital stock)</span></td>
                  <td>unborn cannot negotiate the contract</td>
                </tr>
                <tr>
                  <td>
                    <strong>Information asymmetry exploitation</strong><br />
                    <em>predatory lending, deceptive marketing</em>
                  </td>
                  <td>$K_{\\text{human}}$ <span class="math-note">(human capital)</span>, $K_{\\text{produced}}$ <span class="math-note">(produced capital)</span> of victim</td>
                  <td>nominal consent, not informed consent</td>
                </tr>
              </tbody>
            </table>
          </div>`;

const iwcTableFr = `              <div class="table-scroll">
            <table class="ranking-table" style="margin: 12px 0">
              <thead>
                <tr>
                  <th>Type d'activité</th>
                  <th>Quel $K_k$ diminue</th>
                  <th>Comment le consentement fait défaut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Externalités négatives</strong><br />
                    <em>pollution, congestion, risque systémique</em>
                  </td>
                  <td>air pur, infrastructures, stabilité financière</td>
                  <td>les tiers n'ont jamais accepté de supporter le coût</td>
                </tr>
                <tr>
                  <td>
                    <strong>Épuisement des ressources</strong><br />
                    <em>extraction au-delà de la régénération</em>
                  </td>
                  <td>$K_{\\text{natural}}$, sans investissement compensatoire</td>
                  <td>les générations futures absentes de la table (règle de Hartwick violée)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Recherche de rente</strong><br />
                    <em>lobbying, capture réglementaire, piratage de brevets</em>
                  </td>
                  <td>$K_{\\text{institutional}}$ s'érode ; $\\sum p_k \\Delta K_k < 0$ une fois cette érosion valorisée <span class="math-note">(les gains en capital produit sont plus que compensés par les pertes institutionnelles)</span></td>
                  <td>processus capturé, pas d'échange volontaire</td>
                </tr>
                <tr>
                  <td>
                    <strong>Fraude, coercition, monopole par la force</strong>
                  </td>
                  <td>variable (institutionnel, produit, humain)</td>
                  <td>consentement absent par définition</td>
                </tr>
                <tr>
                  <td>
                    <strong>Transferts intergénérationnels obligatoires non financés</strong><br />
                    <em>retraites par répartition financées par les travailleurs de demain</em>
                  </td>
                  <td>la créance de la jeune cohorte sur $\\sum_k K_k$ <span class="math-note">(stock total de capital)</span></td>
                  <td>les non-nés ne peuvent pas négocier le contrat</td>
                </tr>
                <tr>
                  <td>
                    <strong>Exploitation de l'asymétrie d'information</strong><br />
                    <em>prêts prédateurs, marketing trompeur</em>
                  </td>
                  <td>$K_{\\text{human}}$ <span class="math-note">(capital humain)</span>, $K_{\\text{produced}}$ <span class="math-note">(capital produit)</span> de la victime</td>
                  <td>consentement nominal, pas éclairé</td>
                </tr>
              </tbody>
            </table>
          </div>`;

if (!("prose.iwc-table" in en)) en["prose.iwc-table"] = iwcTableEn;
if (!("prose.iwc-table" in fr)) fr["prose.iwc-table"] = iwcTableFr;

// ── prose.iwc-2x2-table ───────────────────────────────────────────────────
const iwc2x2En = `          <div class="table-scroll">
            <table class="iwc-2x2">
              <thead>
                <tr>
                  <th></th>
                  <th>Consent ✓ (all parties agreed)</th>
                  <th>Consent ✗ (third parties bear cost)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>$\\Delta W > 0$</strong><br><span class="math-note">wealth grows</span></td>
                  <td class="iwc-q-encourage">Encourage / leave alone — voluntary value creation</td>
                  <td class="iwc-q-unusual">Rare; investigate why anyone is harmed by net-positive activity</td>
                </tr>
                <tr>
                  <td><strong>$\\Delta W < 0$</strong><br><span class="math-note">wealth shrinks</span></td>
                  <td class="iwc-q-leave">Leave alone — their loss, their choice (e.g. risky hobby)</td>
                  <td class="iwc-q-brake">BRAKE — the only quadrant where government has objective standing</td>
                </tr>
              </tbody>
            </table>
          </div>`;

const iwc2x2Fr = `          <div class="table-scroll">
            <table class="iwc-2x2">
              <thead>
                <tr>
                  <th></th>
                  <th>Consentement ✓ (toutes les parties ont accepté)</th>
                  <th>Consentement ✗ (des tiers supportent le coût)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>$\\Delta W > 0$</strong><br><span class="math-note">la richesse augmente</span></td>
                  <td class="iwc-q-encourage">Encourager / laisser faire — création de valeur volontaire</td>
                  <td class="iwc-q-unusual">Rare ; investiguer pourquoi quelqu'un est lésé par une activité à bilan positif</td>
                </tr>
                <tr>
                  <td><strong>$\\Delta W < 0$</strong><br><span class="math-note">la richesse diminue</span></td>
                  <td class="iwc-q-leave">Laisser faire — leur perte, leur choix (ex. hobby risqué)</td>
                  <td class="iwc-q-brake">FREINER — le seul quadrant où le gouvernement a une légitimité objective</td>
                </tr>
              </tbody>
            </table>
          </div>`;

if (!("prose.iwc-2x2-table" in en)) en["prose.iwc-2x2-table"] = iwc2x2En;
if (!("prose.iwc-2x2-table" in fr)) fr["prose.iwc-2x2-table"] = iwc2x2Fr;

saveJson("armey-curve.en.json", en);
saveJson("armey-curve.fr.json", fr);

console.log("✓ Added table column header keys and prose.iwc-table to en.json and fr.json");
