#!/usr/bin/env node
// Extract all href URLs from a given HTML file and check each with HEAD/GET.
// Usage: node scripts/check-links.mjs <path-to-html>

import { readFile } from "node:fs/promises";
import { argv, exit } from "node:process";

const file = argv[2];
if (!file) {
  console.error("Usage: node scripts/check-links.mjs <html-file>");
  exit(2);
}

const html = await readFile(file, "utf8");

// Match href="..." capturing the URL. Only http(s) external links.
const re = /href\s*=\s*"(https?:\/\/[^"#]+)(#[^"]*)?"/gi;
const seen = new Map(); // url -> count
for (const m of html.matchAll(re)) {
  const url = m[1];
  seen.set(url, (seen.get(url) ?? 0) + 1);
}

const urls = [...seen.keys()].sort();
console.log(`Found ${urls.length} unique external URLs in ${file}\n`);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function check(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    // Try HEAD first; some servers reject HEAD, fall back to GET.
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "*/*" },
    });
    if (res.status === 405 || res.status === 403 || res.status === 400) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": UA, Accept: "*/*" },
      });
    }
    return { url, status: res.status, ok: res.ok, finalUrl: res.url };
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

// Run with limited concurrency to be polite.
const CONCURRENCY = 6;
const results = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const idx = i++;
    const url = urls[idx];
    const r = await check(url);
    results[idx] = r;
    const tag = r.ok ? "OK " : "BAD";
    const code = r.error ? `ERR ${r.error}` : r.status;
    console.log(`[${tag}] ${code}\t${url}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const broken = results.filter((r) => !r.ok);
console.log(
  `\nSummary: ${results.length - broken.length}/${results.length} OK, ${broken.length} broken`,
);
if (broken.length) {
  console.log("\nBroken links:");
  for (const b of broken) {
    console.log(`  ${b.status || "ERR"} ${b.url}${b.error ? ` (${b.error})` : ""}`);
  }
  exit(1);
}
