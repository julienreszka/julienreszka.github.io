#!/usr/bin/env node
// scripts/fix-intercept-key.mjs
// Appends the missing closing </p> to prose.intercept-explained in both JSONs.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

for (const file of ["armey-curve.en.json", "armey-curve.fr.json"]) {
  const data = JSON.parse(readFileSync(resolve(root, file), "utf8"));
  const key = "prose.intercept-explained";
  if (key in data && !data[key].trimEnd().endsWith("</p>")) {
    data[key] = data[key].trimEnd() + "\n          </p>";
    writeFileSync(resolve(root, file), JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`✓ Fixed ${key} in ${file}`);
  } else {
    console.log(`  ${file}: ${key} already has </p> or key missing`);
  }
}
