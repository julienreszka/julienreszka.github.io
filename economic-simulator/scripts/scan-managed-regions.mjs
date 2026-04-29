// Scans ALL managed regions in armey-curve.html for bare <p>/<li>/<h*> without data-i18n.
// Excludes known data-only or code regions.
// Run with: node scripts/scan-managed-regions.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const srcHtml = readFileSync(join(root, 'armey-curve.html'), 'utf8');
const srcLines = srcHtml.split('\n');

// Regions that are managed but NOT automatically translated — all prose must use data-i18n or i18n blocks
const MANAGED_REGIONS = [
  ['<!-- IWC-FLOWCHART-START -->', '<!-- IWC-FLOWCHART-END -->'],
  ['<!-- IWC-PEDIGREE-START -->', '<!-- IWC-PEDIGREE-END -->'],
  ['<!-- POWER-LAWS-EVERYWHERE:START -->', '<!-- POWER-LAWS-EVERYWHERE:END -->'],
  ['<!-- DATA-SOURCES:START -->', '<!-- DATA-SOURCES:END -->'],
  ['<!-- CORRELATION-CAUSATION:START -->', '<!-- CORRELATION-CAUSATION:END -->'],
  ['<!-- SCATTER-EXPLANATION:START -->', '<!-- SCATTER-EXPLANATION:END -->'],
  ['<!-- QUADRATIC-POLITICAL:START -->', '<!-- QUADRATIC-POLITICAL:END -->'],
  ['<!-- REFERENCES:START -->', '<!-- REFERENCES:END -->'],
  ['<!-- NATURAL-RIGHTS:START -->', '<!-- NATURAL-RIGHTS:END -->'],
  ['<!-- EMBED:START -->', '<!-- EMBED:END -->'],
];

// Known data-only or automatically-generated sub-regions to skip
const SKIP_SUBREGIONS = [
  ['<!-- IWC-CODE-START -->', '<!-- IWC-CODE-END -->'],
  ['<!-- i18n:', '<!-- /i18n:'],
];

for (const [open, close] of MANAGED_REGIONS) {
  let inside = false;
  let regionLines = [];
  for (let i = 0; i < srcLines.length; i++) {
    if (!inside && srcLines[i].includes(open)) { inside = true; }
    if (inside) regionLines.push({ i: i + 1, text: srcLines[i] });
    if (inside && srcLines[i].includes(close)) { inside = false; }
  }
  if (!regionLines.length) continue;

  // Mark sub-regions to skip
  const skipLines = new Set();
  for (const [subOpen, subClose] of SKIP_SUBREGIONS) {
    let inSub = false;
    for (const { i, text } of regionLines) {
      if (!inSub && text.includes(subOpen)) inSub = true;
      if (inSub) skipLines.add(i);
      if (inSub && text.includes(subClose)) inSub = false;
    }
  }

  const bareLines = [];
  for (const { i, text } of regionLines) {
    if (skipLines.has(i)) continue;
    if (/<(p|li|h[1-6])[\s>]/.test(text) && !text.includes('data-i18n') && !text.includes('aria-hidden')) {
      const stripped = text.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, 'X').replace(/\s+/g, ' ').trim();
      if (stripped.length > 5 && !/^[\d.,%;%\-+×]+$/.test(stripped)) {
        bareLines.push({ line: i, text: text.trim().slice(0, 130) });
      }
    }
  }
  if (bareLines.length > 0) {
    console.log(`\nREGION: ${open}`);
    for (const { line, text } of bareLines) {
      console.log(`  L${line}: ${text}`);
    }
  }
}
console.log('\nDone.');
