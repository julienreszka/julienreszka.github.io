// Finds i18n issues in the French build:
// 1. data-i18n attributes where the inner content still matches the EN value (not substituted)
// 2. Managed regions in armey-curve.html that contain bare <p> / <li> without data-i18n
// Run with: node scripts/find-untranslated-fr.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const enJson = JSON.parse(readFileSync(join(root, 'armey-curve.en.json'), 'utf8'));
const frJson = JSON.parse(readFileSync(join(root, 'armey-curve.fr.json'), 'utf8'));
const frHtml = readFileSync(join(root, 'armey-curve.fr.html'), 'utf8');
const srcHtml = readFileSync(join(root, 'armey-curve.html'), 'utf8');

// ── 1. Find data-i18n keys in fr.html whose content was NOT substituted ──────
console.log('\n=== PART 1: data-i18n keys not substituted in fr.html ===\n');

// Match opening tag with data-i18n, capture key and content until closing tag
const attrRe = /<[a-z][a-z0-9]*(?:\s[^>]*)?\sdata-i18n="([^"]+)"(?:\s[^>]*)?>([^]*?)<\/[a-z][a-z0-9]*>/gi;
let m;
const notSubstituted = [];
while ((m = attrRe.exec(frHtml)) !== null) {
  const key = m[1];
  const innerContent = m[2].replace(/\s+/g, ' ').trim();
  const enVal = enJson[key];
  if (!enVal) continue;
  const enNorm = enVal.replace(/\s+/g, ' ').trim();
  // If fr has same content as en, substitution failed
  if (innerContent === enNorm || innerContent.startsWith(enNorm.slice(0, 60))) {
    const frVal = frJson[key];
    notSubstituted.push({ key, frMissing: !frVal, excerpt: innerContent.slice(0, 100) });
  }
}
if (notSubstituted.length === 0) {
  console.log('  All data-i18n keys appear to be substituted.');
} else {
  for (const item of notSubstituted) {
    console.log(`  KEY: ${item.key}${item.frMissing ? ' [NO FR TRANSLATION]' : ''}`);
    console.log(`  CONTENT: ${item.excerpt}\n`);
  }
}

// ── 2. Managed regions in source HTML with bare <p>/<li> (no data-i18n) ─────
console.log('\n=== PART 2: Managed regions with untagged prose in armey-curve.html ===\n');

// Regions that are managed but NOT automatically translated by build-locale
// (i.e., not i18n:key:start/end blocks and not data-i18n container blocks)
const MANAGED_REGIONS = [
  ['<!-- IWC-CODE-START -->', '<!-- IWC-CODE-END -->'],
  ['<!-- IWC-PEDIGREE-START -->', '<!-- IWC-PEDIGREE-END -->'],
  ['<!-- SIMULATOR-CONTROLS:START -->', '<!-- SIMULATOR-CONTROLS:END -->'],
  ['<!-- POWER-LAWS-EVERYWHERE:START -->', '<!-- POWER-LAWS-EVERYWHERE:END -->'],
  ['<!-- DATA-SOURCES:START -->', '<!-- DATA-SOURCES:END -->'],
  ['<!-- CORRELATION-CAUSATION:START -->', '<!-- CORRELATION-CAUSATION:END -->'],
  ['<!-- SCATTER-EXPLANATION:START -->', '<!-- SCATTER-EXPLANATION:END -->'],
  ['<!-- QUADRATIC-POLITICAL:START -->', '<!-- QUADRATIC-POLITICAL:END -->'],
  ['<!-- REFERENCES:START -->', '<!-- REFERENCES:END -->'],
  ['<!-- NATURAL-RIGHTS:START -->', '<!-- NATURAL-RIGHTS:END -->'],
  ['<!-- EMBED:START -->', '<!-- EMBED:END -->'],
  ['<!-- CUT-GAINS-CONTROLS:START -->', '<!-- CUT-GAINS-CONTROLS:END -->'],
];

const srcLines = srcHtml.split('\n');

for (const [open, close] of MANAGED_REGIONS) {
  let inside = false;
  let regionLines = [];
  let regionStart = -1;
  for (let i = 0; i < srcLines.length; i++) {
    if (!inside && srcLines[i].includes(open)) { inside = true; regionStart = i + 1; }
    if (inside) regionLines.push({ i: i + 1, text: srcLines[i] });
    if (inside && srcLines[i].includes(close)) { inside = false; }
  }

  if (!regionLines.length) continue;

  // Find <p>, <li>, <td>, <th>, <h[1-6]> without data-i18n or inside i18n blocks
  const bareLines = [];
  let inI18nBlock = false;
  for (const { i, text } of regionLines) {
    if (/<!--\s*i18n:/.test(text)) { inI18nBlock = true; }
    if (/<!--\s*\/i18n:/.test(text)) { inI18nBlock = false; }
    if (inI18nBlock) continue;
    if (/<(p|li|h[1-6]|td|th)[\s>]/.test(text) && !text.includes('data-i18n') && !text.includes('aria-hidden')) {
      // Check if it has visible text content
      const stripped = text.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, 'X').trim();
      if (stripped.length > 3) bareLines.push({ line: i, text: text.trim().slice(0, 120) });
    }
  }
  if (bareLines.length > 0) {
    console.log(`  REGION: ${open}`);
    for (const { line, text } of bareLines.slice(0, 8)) {
      console.log(`    L${line}: ${text}`);
    }
    if (bareLines.length > 8) console.log(`    ... and ${bareLines.length - 8} more`);
    console.log('');
  }
}

console.log('\nDone.\n');
