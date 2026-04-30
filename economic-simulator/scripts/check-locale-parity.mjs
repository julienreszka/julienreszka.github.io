#!/usr/bin/env node
// scripts/check-locale-parity.mjs
// Verifies that every key present in armey-curve.en.json also exists in
// armey-curve.fr.json. Exits 1 if any keys are missing; 0 otherwise.
//
// Usage: node scripts/check-locale-parity.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

const missing = Object.keys(en).filter((k) => !(k in fr));

if (missing.length === 0) {
  console.log(`✓  All ${Object.keys(en).length} EN keys are present in FR.`);
  process.exit(0);
} else {
  console.error(`✗  ${missing.length} key(s) in armey-curve.en.json missing from armey-curve.fr.json:`);
  for (const k of missing) console.error(`   - ${k}`);
  process.exit(1);
}
