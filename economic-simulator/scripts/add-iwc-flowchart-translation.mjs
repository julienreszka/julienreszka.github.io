/**
 * Extracts the EN flowchart block from armey-curve.html and injects
 * both EN + FR values into the JSON locale files.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..');

function readJson(name) {
  return JSON.parse(readFileSync(join(dir, name), 'utf8'));
}
function writeJson(name, data) {
  writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`✔ wrote ${name}`);
}
function extractBlock(html, key) {
  const startTag = `<!-- i18n:${key}:start -->`;
  const endTag = `<!-- /i18n:${key}:end -->`;
  const s = html.indexOf(startTag);
  const e = html.indexOf(endTag);
  if (s === -1 || e === -1) throw new Error(`Block not found: ${key}`);
  let inner = html.slice(s + startTag.length, e);
  inner = inner.replace(/^\n/, '').replace(/\n[ \t]*$/, '');
  return inner;
}

const html = readFileSync(join(dir, 'armey-curve.html'), 'utf8');
const en = readJson('armey-curve.en.json');
const fr = readJson('armey-curve.fr.json');

en['prose.iwc-flowchart'] = extractBlock(html, 'prose.iwc-flowchart');

fr['prose.iwc-flowchart'] = `            <div class="iwc-node iwc-start">Activité à l'examen</div>
            <div class="iwc-arrow" aria-hidden="true"></div>

            <div class="iwc-step">
              <div class="iwc-step-main">
                <div class="iwc-node iwc-decision">
                  <div class="iwc-q">Q1</div>
                  <div>Des personnes affectées sans avoir consenti&nbsp;?</div>
                </div>
              </div>
              <div class="iwc-exit" aria-label="Non : laisser faire" data-i18n-aria-label="aria.iwc-exit-no">
                <span class="iwc-exit-label">Non</span>
                <span class="iwc-exit-line" aria-hidden="true"></span>
                <div class="iwc-node iwc-leave">Laisser faire</div>
              </div>
            </div>
            <div class="iwc-spine">
              <span class="iwc-spine-label">Oui</span>
              <div class="iwc-arrow" aria-hidden="true"></div>
            </div>

            <div class="iwc-step">
              <div class="iwc-step-main">
                <div class="iwc-node iwc-decision">
                  <div class="iwc-q">Q2</div>
                  <div>$\\sum_k p_k\\,\\Delta K_k$ pour les non-consentants</div>
                  <div class="math-note" style="margin-top:3px">(somme de prix × variation du capital, par type de capital)</div>
                </div>
              </div>
              <div class="iwc-exit" aria-label="Supérieur ou égal à zéro : laisser faire" data-i18n-aria-label="aria.iwc-exit-zero">
                <span class="iwc-exit-label">$\\geq 0$</span>
                <span class="iwc-exit-line" aria-hidden="true"></span>
                <div class="iwc-node iwc-leave">Laisser faire</div>
              </div>
            </div>
            <div class="iwc-spine">
              <span class="iwc-spine-label">$&lt; 0$</span>
              <div class="iwc-arrow" aria-hidden="true"></div>
            </div>

            <div class="iwc-step">
              <div class="iwc-step-main">
                <div class="iwc-node iwc-decision">
                  <div class="iwc-q">Q3</div>
                  <div>Le coût du frein (perte sèche, application, capture) dépasse-t-il le dommage de Q2&nbsp;?</div>
                </div>
              </div>
              <div class="iwc-exit" aria-label="Oui : laisser faire" data-i18n-aria-label="aria.iwc-exit-yes">
                <span class="iwc-exit-label">Oui</span>
                <span class="iwc-exit-line" aria-hidden="true"></span>
                <div class="iwc-node iwc-leave">Laisser faire</div>
              </div>
            </div>
            <div class="iwc-spine">
              <span class="iwc-spine-label">Non</span>
              <div class="iwc-arrow" aria-hidden="true"></div>
            </div>

            <div class="iwc-node iwc-brake">FREIN</div>`;

writeJson('armey-curve.en.json', en);
writeJson('armey-curve.fr.json', fr);
console.log('\nDone. Run: node scripts/audit-i18n.mjs && node scripts/build-locale.mjs fr');
