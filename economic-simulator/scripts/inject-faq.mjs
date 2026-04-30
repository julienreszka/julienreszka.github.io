#!/usr/bin/env node
// scripts/inject-faq.mjs
// Reads armey-curve.en.json and splices both the JSON-LD block and the visible
// <details> block into armey-curve.html at the anchor comments it manages.
//
// Anchor comments (must be present in armey-curve.html):
//   <!-- FAQ-JSONLD-START --> ... <!-- FAQ-JSONLD-END -->
//   <!-- FAQ-DETAILS-START --> ... <!-- FAQ-DETAILS-END -->
//
// Usage:  node scripts/inject-faq.mjs

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const htmlSrc = resolve(root, "armey-curve.html");

// ── 0. Load FAQ array from locale JSON ───────────────────────────────────────
const enJson = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const FAQ = [];
for (let i = 0; enJson[`faq.${i}.q`] !== undefined; i++) {
  FAQ.push({
    q: enJson[`faq.${i}.q`],
    jsonA: enJson[`faq.${i}.jsonA`],
    html: enJson[`faq.${i}.html`],
  });
}

// ── 1. Build JSON-LD mainEntity array ─────────────────────────────────────────
function buildJsonLd() {
  const entries = FAQ.map((f) => {
    // Escape double-quotes inside JSON string values
    const q = f.q.replace(/"/g, '\\"');
    const a = f.jsonA.replace(/"/g, '\\"');
    return (
      `              {\n` +
      `                "@type": "Question",\n` +
      `                "name": "${q}",\n` +
      `                "acceptedAnswer": {\n` +
      `                  "@type": "Answer",\n` +
      `                  "text": "${a}"\n` +
      `                }\n` +
      `              }`
    );
  });
  return entries.join(",\n");
}

// ── 2. Build visible <details> block ─────────────────────────────────────────
function buildDetails() {
  return FAQ.map((f, i) => {
    const answerHtml = f.html
      ? f.html
      : `<p>${f.jsonA.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    // Indent the answer block to match surrounding HTML (10 spaces)
    const indented = answerHtml
      .split("\n")
      .map((line) => "          " + line)
      .join("\n")
      .trimEnd();
    return (
      `          <details>\n` +
      `            <summary data-i18n="faq.${i}.q">${f.q.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</summary>\n` +
      `          <!-- i18n:faq.${i}.html:start -->\n` +
      indented +
      `\n          <!-- /i18n:faq.${i}.html:end -->\n` +
      `          </details>`
    );
  }).join("\n");
}

// ── 3. Splice into HTML between anchor comments ───────────────────────────────
function splice(html, startAnchor, endAnchor, payload) {
  const start = html.indexOf(startAnchor);
  const end = html.indexOf(endAnchor);
  if (start === -1 || end === -1) {
    console.error(`ERROR: Could not find anchors "${startAnchor}" / "${endAnchor}" in armey-curve.html`);
    process.exit(1);
  }
  return (
    html.slice(0, start + startAnchor.length) +
    "\n" +
    payload +
    "\n" +
    html.slice(end)
  );
}

// ── 4. Main ───────────────────────────────────────────────────────────────────
let html = readFileSync(htmlSrc, "utf8");

html = splice(
  html,
  "<!-- FAQ-JSONLD-START -->",
  "<!-- FAQ-JSONLD-END -->",
  buildJsonLd()
);

html = splice(
  html,
  "<!-- FAQ-DETAILS-START -->",
  "<!-- FAQ-DETAILS-END -->",
  buildDetails()
);

const original = readFileSync(htmlSrc, "utf8");
if (html === original) {
  console.log("armey-curve.html FAQ is already up to date.");
} else {
  writeFileSync(htmlSrc, html, "utf8");
  console.log("armey-curve.html FAQ updated from armey-curve.en.json.");
}
