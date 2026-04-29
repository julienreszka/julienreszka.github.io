// One-time script: adds prose.decision-in-sequence to en.json and fr.json
// Run with: node scripts/add-decision-in-sequence-prose.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const entries = [
  [
    'en',
    `The 2\u00d72 collapses the verdict to two binary questions, but it
            omits a third that any honest framework must include: <em>does the
            brake itself cost more than the damage it prevents?</em>
            Government action has its own deadweight loss, enforcement cost,
            and capture risk. The full test is three sequential checks:`,
  ],
  [
    'fr',
    `Le 2\u00d72 r\u00e9duit le verdict \u00e0 deux questions binaires, mais en omet une
            troisi\u00e8me que tout cadre honn\u00eate doit inclure\u00a0: <em>le frein lui-m\u00eame
            co\u00fbte-t-il plus que le pr\u00e9judice qu\u2019il pr\u00e9vient\u00a0?</em>
            L\u2019action gouvernementale a son propre co\u00fbt mort, ses frais d\u2019ex\u00e9cution
            et son risque de captation. Le test complet comprend trois
            v\u00e9rifications s\u00e9quentielles\u00a0:`,
  ],
];

for (const [lang, value] of entries) {
  const path = join(root, `armey-curve.${lang}.json`);
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  if (obj['prose.decision-in-sequence']) {
    console.log(`${lang}.json already has prose.decision-in-sequence — skipping`);
    continue;
  }
  obj['prose.decision-in-sequence'] = value;
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`Added prose.decision-in-sequence to ${lang}.json`);
}
