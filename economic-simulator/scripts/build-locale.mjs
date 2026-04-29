#!/usr/bin/env node
// scripts/build-locale.mjs
// Reads armey-curve.html (English source) + a locale JSON, substitutes all
// data-i18n / data-i18n-content / data-i18n-aria-label attributes, and
// writes armey-curve.{lang}.html.
//
// Usage:
//   node scripts/build-locale.mjs fr          # → armey-curve.fr.html
//   node scripts/build-locale.mjs en          # → armey-curve.en.html (verify round-trip)
//
// How substitution works:
//   data-i18n="key"
//       Replaces the text content of the element.
//       Handles single-line:   <tag data-i18n="k">old text</tag>
//       And multi-line:        <tag ... data-i18n="k">
//                                old text
//                              </tag>
//       Does NOT descend into child tags — replaces raw text nodes only.
//
//   data-i18n-content="key"
//       Replaces the value of the `content` attribute on the same tag
//       (used for <meta content="..."> tags).
//
//   data-i18n-aria-label="key"
//       Replaces the value of the `aria-label` attribute on the same tag.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const lang = process.argv[2];
if (!lang) {
  console.error("Usage: node scripts/build-locale.mjs <lang>  (e.g. fr)");
  process.exit(1);
}

const localePath = resolve(root, `armey-curve.${lang}.json`);
const htmlPath = resolve(root, "armey-curve.html");
const outPath = resolve(root, `armey-curve.${lang}.html`);

let locale;
try {
  locale = JSON.parse(readFileSync(localePath, "utf8"));
} catch (e) {
  console.error(`Could not read ${localePath}: ${e.message}`);
  process.exit(1);
}

let html = readFileSync(htmlPath, "utf8");

// ── 0. Replace window.i18n block between I18N-JS-START / I18N-JS-END ─────────
// Collect all js.* keys from the locale JSON and emit a new script block.
const jsKeys = Object.entries(locale).filter(([k]) => k.startsWith("js."));
if (jsKeys.length > 0) {
  const obj = Object.fromEntries(jsKeys);
  const json = JSON.stringify(obj, null, 8)
    .split("\n")
    .map((line, i) => (i === 0 ? line : "      " + line))
    .join("\n");
  const newBlock =
    `<!-- I18N-JS-START -->\n    <script>\n      window.i18n = ${json};\n    </script>\n    <!-- I18N-JS-END -->`;
  html = html.replace(
    /<!-- I18N-JS-START -->[\s\S]*?<!-- I18N-JS-END -->/,
    newBlock
  );
}

// ── 0c. Replace <!-- i18n:key:start --> ... <!-- /i18n:key:end --> blocks ─────
// These wrap entire HTML sections; the locale value replaces the inner content.
html = html.replace(
  /<!-- i18n:([a-z][a-z0-9.-]*):start -->([\s\S]*?)<!-- \/i18n:\1:end -->/g,
  (match, key, _oldContent) => {
    const val = locale[key];
    if (val === undefined) return match;
    // Detect the indentation used by the opening comment
    const indentMatch = match.match(/^([ \t]*)<!--/);
    const indent = indentMatch ? indentMatch[1] : "          ";
    return `<!-- i18n:${key}:start -->\n${val}\n${indent}<!-- /i18n:${key}:end -->`;
  }
);

// ── 1. data-i18n-content="key" → replace content="..." on same line/tag ─────
html = html.replace(
  /(<[^>]+\s)data-i18n-content="([^"]+)"([^>]*content=")([^"]*?)(")/g,
  (match, before, key, mid, _old, after) => {
    const val = locale[key];
    if (val === undefined) return match;
    return `${before}data-i18n-content="${key}"${mid}${val}${after}`;
  }
);

// ── 2b. data-i18n-title="key" → replace title="..." on same tag ─────────────
html = html.replace(
  /(<[^>]+\s)data-i18n-title="([^"]+)"([^>]*title=")([^"]*?)(")/g,
  (match, before, key, mid, _old, after) => {
    const val = locale[key];
    if (val === undefined) return match;
    return `${before}data-i18n-title="${key}"${mid}${val}${after}`;
  }
);
// Handle title-before-data-i18n-title order
html = html.replace(
  /(<[^>]+\s)(title=")([^"]*?)(")([^>]*\s)data-i18n-title="([^"]+)"([^>]*>)/g,
  (match, before, attrOpen, _old, attrClose, mid, key, rest) => {
    const val = locale[key];
    if (val === undefined) return match;
    return `${before}${attrOpen}${val}${attrClose}${mid}data-i18n-title="${key}"${rest}`;
  }
);

// ── 2. data-i18n-aria-label="key" → replace aria-label="..." on same tag ────
html = html.replace(
  /(<[^>]+\s)data-i18n-aria-label="([^"]+)"([^>]*aria-label=")([^"]*?)(")/g,
  (match, before, key, mid, _old, after) => {
    const val = locale[key];
    if (val === undefined) return match;
    return `${before}data-i18n-aria-label="${key}"${mid}${val}${after}`;
  }
);

// Handle the case where aria-label comes BEFORE data-i18n-aria-label on same tag
html = html.replace(
  /(<[^>]+\s)(aria-label=")([^"]*?)(")([^>]*\s)data-i18n-aria-label="([^"]+)"([^>]*>)/g,
  (match, before, attrOpen, _old, attrClose, mid, key, rest) => {
    const val = locale[key];
    if (val === undefined) return match;
    return `${before}${attrOpen}${val}${attrClose}${mid}data-i18n-aria-label="${key}"${rest}`;
  }
);

// ── 3. data-i18n="key" → replace text content of the element ─────────────────
// Strategy: find each data-i18n="key" occurrence, locate the closing > of its
// opening tag, then replace everything up to the corresponding closing tag with
// the locale value.  We handle elements whose text content spans multiple lines.

// Tag names we handle (extend as needed)
const HANDLED_TAGS = [
  "title", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "label", "option", "button", "span", "p", "li", "td", "th", "summary",
];
const TAG_RE = new RegExp(`<(${HANDLED_TAGS.join("|")})(\\s[^>]*)?>`, "i");

// Walk through finding each data-i18n attr
html = html.replace(/data-i18n="([^"]+)"/g, (attrMatch, key) => {
  // Return attr unchanged — we'll do a second targeted pass
  return attrMatch;
});

// Second pass: for each data-i18n="key", find the surrounding element and
// replace its text content. We use a stateful replace.
const I18N_ATTR_RE = /(<(title|h[1-6]|a|label|option|button|span|p|li|td|th|summary)(\s[^>]*)?\sdata-i18n="([^"]+)"(\s[^>]*)?>)([^<]*?)(<\/\2>)/gi;

html = html.replace(I18N_ATTR_RE, (match, openTag, tagName, _attrs1, key, _attrs2, _oldText, closeTag) => {
  const val = locale[key];
  if (val === undefined) return match;
  return `${openTag}${val}${closeTag}`;
});

// Multi-line variant: text on lines after the opening tag
// Pattern: opening tag ends with >, then newline(s) + whitespace + text + newline(s) + whitespace + close tag
const I18N_MULTILINE_RE = /(<(title|h[1-6]|a|label|option|button|span|p|li|td|th|summary|ul|ol|div)(\s[^>]*)?\sdata-i18n="([^"]+)"(\s[^>]*)?>)\n([\s\S]*?)(<\/\2>)/gi;

html = html.replace(I18N_MULTILINE_RE, (match, openTag, tagName, _attrs1, key, _attrs2, _oldText, closeTag) => {
  const val = locale[key];
  if (val === undefined) return match;
  // Detect indentation of close tag to preserve formatting
  const indentMatch = match.match(/\n(\s+)<\//);
  const indent = indentMatch ? indentMatch[1] : "              ";
  return `${openTag}\n${indent}${val}\n${indent.slice(2)}${closeTag}`;
});

// ── 4. Also update <html lang="en"> to target lang ───────────────────────────
html = html.replace(/(<html\s[^>]*lang=")[^"]*(")/i, `$1${lang}$2`);

// ── 5. Update canonical URL and og:url if different page name ────────────────
if (lang !== "en") {
  const enUrl = "armey-curve.html";
  const frUrl = `armey-curve.${lang}.html`;
  html = html.replace(
    /(<link\s[^>]*rel="canonical"\s[^>]*href=")([^"]*armey-curve\.html)(")/,
    `$1${`$2`.replace(enUrl, frUrl)}$3`
  );
  // Update og:url
  html = html.replace(
    /(property="og:url"\s[^>]*content=")([^"]*armey-curve\.html)(")/,
    (m, before, url, after) => `${before}${url.replace(enUrl, frUrl)}${after}`
  );
}

// ── 6. Write output ───────────────────────────────────────────────────────────
writeFileSync(outPath, html, "utf8");
console.log(`Built armey-curve.${lang}.html from ${lang} locale.`);
