// One-time script: adds prose.iwc-q3-implicit and prose.iwc-q3-qualitative
// Run with: node scripts/add-iwc-q3-prose.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const entries = [
  ['prose.iwc-q3-implicit', {
    en: `Q3 is the step the section so far has implicit. It matters because
            many real-world activities fail Q1 and Q2 yet would still be made
            <em>worse</em> by intervention &mdash; either because the brake
            mechanism itself is captureable (Q3 fail mode 1) or because the
            cure costs more than the disease (Q3 fail mode 2). The criterion
            therefore licences action only when all three filters are passed.`,
    fr: `Q3 est l\u2019\u00e9tape que la section a jusqu\u2019ici laiss\u00e9e implicite. Elle importe
            parce que de nombreuses activit\u00e9s \u00e9chouent \u00e0 Q1 et Q2 mais seraient
            tout de m\u00eame <em>aggrav\u00e9es</em> par une intervention &mdash; soit parce que
            le m\u00e9canisme de frein lui-m\u00eame est susceptible d\u2019\u00eatre captur\u00e9 (mode
            d\u2019\u00e9chec Q3 n\u00b0\u00a01), soit parce que le rem\u00e8de co\u00fbte plus que le mal
            (mode d\u2019\u00e9chec Q3 n\u00b0\u00a02). Le crit\u00e8re n\u2019autorise donc l\u2019action que
            lorsque les trois filtres sont valid\u00e9s.`,
  }],
  ['prose.iwc-q3-qualitative', {
    en: `Q3 is the most qualitative of the three and worth flagging as
            such. Deadweight loss has a textbook estimator (Harberger
            triangles), enforcement cost has a budget line, but
            <em>capture risk</em> &mdash; the probability that the brake
            instrument gets bent toward the very interest it was meant to
            constrain &mdash; is genuinely hard to put a number on. The
            literature on regulatory capture
            (<a href="https://doi.org/10.2307/3003160" target="_blank" rel="noopener">Stigler 1971</a>;
            <a href="https://doi.org/10.1093/oxrep/grj013" target="_blank" rel="noopener">Dal B&oacute; 2006</a>)
            describes the mechanism but offers no consensus formula. In
            practice Q3 acts as a circuit-breaker: if a sector has a strong
            track record of capturing its regulator, raise the burden of
            proof for new brakes there; otherwise treat the deadweight and
            enforcement components as the binding part of the test.`,
    fr: `Q3 est le plus qualitatif des trois, et il vaut la peine de le
            souligner. La perte s\u00e8che dispose d\u2019un estimateur classique (les
            triangles de Harberger), le co\u00fbt d\u2019ex\u00e9cution a une ligne budg\u00e9taire,
            mais le <em>risque de capture</em> &mdash; la probabilit\u00e9 que l\u2019instrument
            de frein soit d\u00e9tourn\u00e9 au profit de l\u2019int\u00e9r\u00eat m\u00eame qu\u2019il \u00e9tait cens\u00e9
            contraindre &mdash; est r\u00e9ellement difficile \u00e0 chiffrer. La litt\u00e9rature
            sur la capture r\u00e9glementaire
            (<a href="https://doi.org/10.2307/3003160" target="_blank" rel="noopener">Stigler 1971</a>\u00a0;
            <a href="https://doi.org/10.1093/oxrep/grj013" target="_blank" rel="noopener">Dal B&oacute; 2006</a>)
            d\u00e9crit le m\u00e9canisme mais n\u2019offre pas de formule consensuelle. En
            pratique, Q3 fonctionne comme un disjoncteur\u00a0: si un secteur a de
            solides ant\u00e9c\u00e9dents de capture de son r\u00e9gulateur, relevez le seuil de
            preuve pour les nouveaux freins dans ce secteur\u00a0; sinon, traitez les
            composantes de perte s\u00e8che et de co\u00fbt d\u2019ex\u00e9cution comme la partie
            contraignante du test.`,
  }],
];

for (const lang of ['en', 'fr']) {
  const path = join(root, `armey-curve.${lang}.json`);
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  let changed = false;
  for (const [key, vals] of entries) {
    if (obj[key]) { console.log(`${lang}.json already has ${key} — skipping`); continue; }
    obj[key] = vals[lang];
    changed = true;
    console.log(`Added ${key} to ${lang}.json`);
  }
  if (changed) writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
