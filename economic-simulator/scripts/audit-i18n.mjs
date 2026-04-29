#!/usr/bin/env node
// scripts/audit-i18n.mjs
// Scans armey-curve.html for hardcoded user-visible strings that have not yet
// been migrated to a locale JSON. Writes economic-simulator/i18n-audit.csv.
//
// Usage:  node scripts/audit-i18n.mjs
//
// CSV columns:
//   line        — 1-based line number in armey-curve.html
//   category    — meta | jsonld | heading | body-text | label | option |
//                 button | table-cell | list-item | aria-attr | js-string |
//                 summary | nav
//   status      — managed | hardcoded
//   excerpt     — first 120 chars of the string (whitespace collapsed)
//   context     — ±2 surrounding lines from the source file (whitespace collapsed)

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const htmlPath = resolve(root, "armey-curve.html");
const outPath = resolve(root, "i18n-audit.csv");

const raw = readFileSync(htmlPath, "utf8");
const lines = raw.split("\n");

// ── Anchor-managed regions — content inside these is already generated ────────
const MANAGED_REGIONS = [
  ["<!-- FAQ-JSONLD-START -->", "<!-- FAQ-JSONLD-END -->"],
  ["<!-- FAQ-DETAILS-START -->", "<!-- FAQ-DETAILS-END -->"],
  ["<!-- IWC-CODE-START -->", "<!-- IWC-CODE-END -->"],
];

// Build a Set of line indices that are inside managed regions
const managedLines = new Set();
for (const [open, close] of MANAGED_REGIONS) {
  let inside = false;
  for (let i = 0; i < lines.length; i++) {
    if (!inside && lines[i].includes(open)) { inside = true; }
    if (inside) managedLines.add(i);
    if (inside && lines[i].includes(close)) { inside = false; }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function excerpt(str) {
  return str.replace(/\s+/g, " ").trim().slice(0, 120).replace(/"/g, '""');
}

function isBoringText(str) {
  const t = str.replace(/\s+/g, " ").trim();
  if (t.length < 2) return true;
  // Pure numbers / punctuation / symbols
  if (/^[\d\s.,;:!?()\-–—·×§%°€$#@&*/+<>=\[\]{}|^~`'"\\]+$/.test(t)) return true;
  // URLs
  if (/^https?:\/\//.test(t)) return true;
  // KaTeX / math tokens only
  if (/^[\$\\{}_^]+/.test(t) && t.length < 8) return true;
  return false;
}

/** Track whether we are inside a <script> block (not ld+json) */
function buildScriptRanges() {
  const ranges = []; // [{start, end, isLdJson}]
  let inScript = false;
  let isLdJson = false;
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inScript && /<script(\s[^>]*)?>/.test(l)) {
      inScript = true;
      isLdJson = /type=["']application\/ld\+json["']/.test(l);
      startLine = i;
    }
    if (inScript && /<\/script>/.test(l)) {
      ranges.push({ start: startLine, end: i, isLdJson });
      inScript = false;
    }
  }
  return ranges;
}

const scriptRanges = buildScriptRanges();

function lineScriptInfo(lineIdx) {
  for (const r of scriptRanges) {
    if (lineIdx >= r.start && lineIdx <= r.end) return r;
  }
  return null;
}

// ── Results collector ─────────────────────────────────────────────────────────
const rows = []; // {line, category, status, text, ctx}

/** Return ±2 lines around lineIdx, stripped and collapsed, max 160 chars. */
function surroundingContext(lineIdx) {
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length - 1, lineIdx + 2);
  return lines
    .slice(start, end + 1)
    .map((l) => l.trim())
    .join(" ▸ ")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function add(lineIdx, category, text) {
  if (isBoringText(text)) return;
  const status = managedLines.has(lineIdx) ? "managed" : "hardcoded";
  rows.push({ line: lineIdx + 1, category, status, text: excerpt(text), ctx: surroundingContext(lineIdx) });
}

// ── Main scan — line by line ──────────────────────────────────────────────────

// Patterns: each has a regex that captures visible text from one line.
// For multi-line elements we use a stateful accumulator below.

// --- Meta tags ---
const META_PATTERNS = [
  { re: /<title>([^<]+)<\/title>/, cat: "meta" },
  { re: /<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/, cat: "meta" },
  { re: /<meta\s[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/, cat: "meta" },
  { re: /<meta\s[^>]*property=["']og:[^"']*["'][^>]*content=["']([^"']+)["']/, cat: "meta" },
  { re: /<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:/, cat: "meta" },
  { re: /<meta\s[^>]*name=["']twitter:[^"']*["'][^>]*content=["']([^"']+)["']/, cat: "meta" },
  { re: /<meta\s[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:/, cat: "meta" },
  { re: /<meta\s[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/, cat: "meta" },
];

// aria-label / title attribute
const ATTR_PATTERN = /(?:aria-label|title)=["']([^"']{2,})["']/g;

// Headings (single-line)
const HEADING_RE = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/;
// Single-line <p>
const P_SINGLE_RE = /<p[^>]*>([^<]+)<\/p>/;
// <label>
const LABEL_RE = /<label[^>]*>([^<]+)/;
// <option>
const OPTION_RE = /<option[^>]*>([^<]+)<\/option>/;
// <button>
const BUTTON_RE = /<button[^>]*>([^<]+)<\/button>/;
// <th> / <td>
const TABLE_CELL_RE = /<t[hd][^>]*>([^<]+)<\/t[hd]>/;
// <li>
const LI_RE = /<li[^>]*>([^<]+)/;
// <summary> (FAQ managed separately)
const SUMMARY_RE = /<summary[^>]*>([^<]+)<\/summary>/;
// <a> nav breadcrumb
const NAV_A_RE = /<a\s[^>]*>([^<]+)<\/a>/;

// JS user-visible strings: quoted strings that contain at least one space
// (likely labels/messages, not identifiers, CSS classes, or data keys)
const JS_STRING_RE = /(?:'|")([A-Za-z][^'"]{3,}[A-Za-z.!?])(?:'|")/g;

// JSON-LD "name" / "text" / "headline" / "description" values
const JSONLD_VALUE_RE = /"(?:name|text|headline|description|itemName)"\s*:\s*"([^"\\]{3,})"/g;

// ── Accumulator for multi-line block elements ─────────────────────────────────
// We track open tags and accumulate text until the matching close tag.
const blockTags = ["p", "h1","h2","h3","h4","h5","h6","li","th","td","label","summary","button","figcaption","blockquote","aside","div"];
const blockOpenRe = new RegExp(`^\\s*<(${blockTags.join("|")})(\\s[^>]*)?>\\s*$`, "i");
const blockCloseRe = new RegExp(`^\\s*</(${blockTags.join("|")})>\\s*$`, "i");

let blockTag = null;
let blockStart = -1;
let blockLines = [];

function flushBlock() {
  if (!blockTag) return;
  const full = blockLines.join(" ");
  // Strip tags, get text
  const text = full.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();
  if (!isBoringText(text)) {
    const catMap = {
      p: "body-text", h1:"heading", h2:"heading", h3:"heading", h4:"heading",
      h5:"heading", h6:"heading", li:"list-item", th:"table-cell", td:"table-cell",
      label:"label", summary:"summary", button:"button", figcaption:"body-text",
      blockquote:"body-text", aside:"body-text", div:"body-text",
    };
    add(blockStart, catMap[blockTag] || "body-text", text);
  }
  blockTag = null;
  blockLines = [];
  blockStart = -1;
}

// ── Line loop ─────────────────────────────────────────────────────────────────
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const scriptInfo = lineScriptInfo(i);

  // ── Inside a JS script block (not ld+json) ────────────────────────────────
  if (scriptInfo && !scriptInfo.isLdJson) {
    let m;
    JS_STRING_RE.lastIndex = 0;
    while ((m = JS_STRING_RE.exec(l)) !== null) {
      // Only flag strings that contain a space — user-visible prose, not identifiers
      if (!/ /.test(m[1])) continue;
      // Skip inline CSS strings
      if (/:\s*\w+[;]/.test(m[1]) || /padding|margin|color|font|text-align|opacity|display|border|white-space/.test(m[1])) continue;
      add(i, "js-string", m[1]);
    }
    continue;
  }

  // ── Inside JSON-LD ────────────────────────────────────────────────────────
  if (scriptInfo && scriptInfo.isLdJson) {
    let m;
    JSONLD_VALUE_RE.lastIndex = 0;
    while ((m = JSONLD_VALUE_RE.exec(l)) !== null) {
      add(i, "jsonld", m[1]);
    }
    continue;
  }

  // ── HTML content ──────────────────────────────────────────────────────────

  // Meta tags (single-line)
  for (const { re, cat } of META_PATTERNS) {
    const m = re.exec(l);
    if (m) add(i, cat, m[1]);
  }

  // aria-label / title attrs
  let am;
  const attrLine = l;
  ATTR_PATTERN.lastIndex = 0;
  while ((am = ATTR_PATTERN.exec(attrLine)) !== null) {
    // Skip href="#..." title patterns
    if (/^#/.test(am[1])) continue;
    add(i, "aria-attr", am[1]);
  }

  // Single-line block elements
  let sm;
  if ((sm = HEADING_RE.exec(l))) add(i, "heading", sm[1]);
  else if ((sm = P_SINGLE_RE.exec(l))) add(i, "body-text", sm[1]);
  else if ((sm = LABEL_RE.exec(l))) add(i, "label", sm[1]);
  else if ((sm = OPTION_RE.exec(l))) add(i, "option", sm[1]);
  else if ((sm = BUTTON_RE.exec(l))) add(i, "button", sm[1]);
  else if ((sm = TABLE_CELL_RE.exec(l))) add(i, "table-cell", sm[1]);
  else if ((sm = LI_RE.exec(l))) add(i, "list-item", sm[1]);
  else if ((sm = SUMMARY_RE.exec(l))) add(i, "summary", sm[1]);
  else if ((sm = NAV_A_RE.exec(l))) add(i, "nav", sm[1]);

  // Multi-line block accumulator
  if (!blockTag) {
    const om = blockOpenRe.exec(l);
    if (om) { blockTag = om[1].toLowerCase(); blockStart = i; blockLines = []; }
  } else {
    if (blockCloseRe.exec(l)) { flushBlock(); }
    else { blockLines.push(l); }
  }
}
flushBlock();

// ── Deduplicate by (line, category) ─────────────────────────────────────────
const seen = new Set();
const deduped = rows.filter((r) => {
  const key = `${r.line}|${r.category}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ── Sort: hardcoded first, then by line ──────────────────────────────────────
deduped.sort((a, b) => {
  if (a.status !== b.status) return a.status === "hardcoded" ? -1 : 1;
  return a.line - b.line;
});

// ── Summary counts ────────────────────────────────────────────────────────────
const hardcoded = deduped.filter((r) => r.status === "hardcoded");
const managed   = deduped.filter((r) => r.status === "managed");

const byCategory = {};
for (const r of hardcoded) {
  byCategory[r.category] = (byCategory[r.category] || 0) + 1;
}

// ── Write CSV ─────────────────────────────────────────────────────────────────
const header = "line,category,status,excerpt,context";
const csvRows = deduped.map(
  (r) => `${r.line},${r.category},${r.status},"${r.text}","${r.ctx}"`
);
const csv = [header, ...csvRows].join("\n") + "\n";

writeFileSync(outPath, csv, "utf8");

// ── Console summary ───────────────────────────────────────────────────────────
console.log(`\narmey-curve.html i18n audit`);
console.log(`  Total entries : ${deduped.length}`);
console.log(`  Hardcoded     : ${hardcoded.length}`);
console.log(`  Managed       : ${managed.length}`);
console.log(`\nHardcoded by category:`);
for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(14)} ${count}`);
}
console.log(`\nFull report: economic-simulator/i18n-audit.csv`);
