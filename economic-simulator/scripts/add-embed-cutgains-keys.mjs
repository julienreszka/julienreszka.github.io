// One-time script: adds prose.embed-intro and table.cutgains.predicted-gain to both JSON files
// Run with: node scripts/add-embed-cutgains-keys.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const newKeys = {
  'prose.embed-intro': {
    en: 'You can embed the interactive chart on your site. Copy the snippet below:',
    fr: 'Vous pouvez int\u00e9grer le graphique interactif sur votre site. Copiez l\u2019extrait ci-dessous\u00a0:',
  },
  'table.cutgains.predicted-gain': {
    en: 'Predicted gain from \u22125 pp cut',
    fr: 'Gain pr\u00e9dit pour une coupe de \u22125 pp',
  },
};

for (const lang of ['en', 'fr']) {
  const path = join(root, `armey-curve.${lang}.json`);
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  let changed = false;
  for (const [key, vals] of Object.entries(newKeys)) {
    if (obj[key]) { console.log(`${lang}.json already has ${key} — skipping`); continue; }
    obj[key] = vals[lang];
    changed = true;
    console.log(`Added ${key} to ${lang}.json`);
  }
  if (changed) writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
