#!/usr/bin/env node
// scripts/inject-should-brake.mjs
// Reads should-brake.js, HTML-escapes it, and splices it into the
// <details class="iwc-code"> block inside armey-curve.html.
//
// Usage:  node scripts/inject-should-brake.mjs

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const jsSrc = resolve(root, "should-brake.js");
const htmlSrc = resolve(root, "armey-curve.html");
const indexSrc = resolve(root, "index.html");

// ── 1. Read source files ──────────────────────────────────────────────────────
const js = readFileSync(jsSrc, "utf8");
const html = readFileSync(htmlSrc, "utf8");

// ── 2. HTML-escape the JS so it is safe inside <pre><code> ───────────────────
const escaped = js
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

// Strip trailing newline — the closing </code></pre> sits on its own line.
const payload = escaped.trimEnd();

// ── 3. Locate the target block via its unique anchor ─────────────────────────
// The block is the first (and only) <details class="iwc-code"> element.
// IMPORTANT: the <details> contains an HTML comment that itself contains the
// literal text "<pre><code>" as part of its instruction prose.  We must search
// for the real <pre><code> tag AFTER the comment closes (-->), not just after
// the <details> opening, otherwise the inject lands inside the comment and the
// visible block is never updated.
const OPEN_ANCHOR = '<details class="iwc-code"';
const COMMENT_CLOSE = "-->";
const CODE_OPEN = "<pre><code>";
const CODE_CLOSE = "</code></pre>";

const anchorStart = html.indexOf(OPEN_ANCHOR);
if (anchorStart === -1) {
  console.error('ERROR: Could not find <details class="iwc-code"> in armey-curve.html');
  process.exit(1);
}

// Skip past the closing --> of the instruction comment before searching for
// the real <pre><code> tag.
const commentClose = html.indexOf(COMMENT_CLOSE, anchorStart);
const searchFrom = commentClose === -1 ? anchorStart : commentClose + COMMENT_CLOSE.length;

const codeStart = html.indexOf(CODE_OPEN, searchFrom);
const codeEnd = html.indexOf(CODE_CLOSE, codeStart);
if (codeStart === -1 || codeEnd === -1) {
  console.error("ERROR: Could not find <pre><code>…</code></pre> after the anchor.");
  process.exit(1);
}

const before = html.slice(0, codeStart + CODE_OPEN.length);
const after = html.slice(codeEnd);
const updated = before + payload + after;

// ── Resolve the authoritative last-modified date once ─────────────────────────
// Used by both the visible <time> stamp in armey-curve.html and the
// JSON-LD dateModified in index.html.
let isoDate;
try {
  isoDate = execSync(
    `git log -1 --format=%cs -- "${jsSrc}"`,
    { cwd: root, encoding: "utf8" }
  ).trim();
  if (!isoDate) throw new Error("no commit");
} catch {
  isoDate = new Date().toISOString().slice(0, 10);
}

// ── 4. Write back only if changed (code block + <time> stamp) ────────────────
// Also update the visible <time datetime="…">…</time> in the same file so the
// "Last updated" date shown to readers tracks the JS source, not a manual edit.
const updatedWithDate = updated.replace(
  /<time datetime="\d{4}-\d{2}-\d{2}">\d{4}-\d{2}-\d{2}<\/time>/,
  `<time datetime="${isoDate}">${isoDate}</time>`
);
if (updatedWithDate === html) {
  console.log("armey-curve.html is already up to date.");
} else {
  writeFileSync(htmlSrc, updatedWithDate, "utf8");
  console.log("armey-curve.html updated from should-brake.js.");
}

// ── 5. Update dateModified in index.html ─────────────────────────────────────
const indexHtml = readFileSync(indexSrc, "utf8");
const updatedIndex = indexHtml.replace(
  /"dateModified": "\d{4}-\d{2}-\d{2}"/,
  `"dateModified": "${isoDate}"`
);

if (updatedIndex === indexHtml) {
  console.log(`index.html dateModified already "${isoDate}".`);
} else {
  writeFileSync(indexSrc, updatedIndex, "utf8");
  console.log(`index.html dateModified updated to "${isoDate}".`);
}
