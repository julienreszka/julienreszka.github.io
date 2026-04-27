#!/usr/bin/env node
// Extract all href URLs from a given HTML file and check each like a real browser.
// Usage: node scripts/check-links.mjs <path-to-html>
//
// Strategy:
//   1. Send a full set of browser headers (UA, Accept, Accept-Language, Sec-Fetch-*).
//   2. Try GET with Range: bytes=0-0 first (cheaper than full GET, tolerated by most CDNs).
//   3. On failure, retry with plain GET (no Range), then once more after a short delay.
//   4. Treat 200/206/3xx as OK.
//   5. Treat 401/403/406/451 from a known bot-blocking host as "soft-OK" (WARN), since
//      such URLs almost always resolve in a real browser.

import { readFile } from "node:fs/promises";
import { argv, exit } from "node:process";

const file = argv[2];
if (!file) {
  console.error("Usage: node scripts/check-links.mjs <html-file>");
  exit(2);
}

const html = await readFile(file, "utf8");

// Strip <link> tags before extracting hrefs. <link rel="preconnect|dns-prefetch|...">
// hrefs are DNS hints, not navigable URLs, and the bare domain root often 404s.
const navHtml = html.replace(/<link\b[^>]*>/gi, "");

const re = /href\s*=\s*"(https?:\/\/[^"#]+)(#[^"]*)?"/gi;
const seen = new Map();
for (const m of navHtml.matchAll(re)) {
  seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
}
const urls = [...seen.keys()].sort();
console.log(`Found ${urls.length} unique external URLs in ${file}\n`);

const SOFT_HOSTS = new Set([
  "doi.org",
  "www.jstor.org",
  "jstor.org",
  "wedocs.unep.org",
  "academic.oup.com",
  "linkinghub.elsevier.com",
  "www.sciencedirect.com",
  "onlinelibrary.wiley.com",
  "journals.uchicago.edu",
  "www.journals.uchicago.edu",
  "www.cambridge.org",
  "link.springer.com",
]);

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryFetch(url, { range }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  const headers = { ...BROWSER_HEADERS };
  if (range) headers.Range = "bytes=0-0";
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(t);
  }
}

async function check(url) {
  const host = new URL(url).hostname;
  const isSoftHost = SOFT_HOSTS.has(host);
  const attempts = [
    { range: true },
    { range: false },
    { range: false, delay: 1000 },
  ];

  let lastStatus = 0;
  let lastError = null;
  let finalUrl = url;
  for (const a of attempts) {
    if (a.delay) await sleep(a.delay);
    try {
      const res = await tryFetch(url, a);
      lastStatus = res.status;
      finalUrl = res.url;
      try {
        await res.body?.cancel?.();
      } catch {
        /* ignore */
      }
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return { url, status: res.status, ok: true, soft: false, finalUrl };
      }
      if (
        isSoftHost &&
        [401, 403, 406, 451].includes(res.status)
      ) {
        return { url, status: res.status, ok: true, soft: true, finalUrl };
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  if (isSoftHost && [401, 403, 406, 451].includes(lastStatus)) {
    return { url, status: lastStatus, ok: true, soft: true, finalUrl };
  }
  return {
    url,
    status: lastStatus,
    ok: false,
    soft: false,
    error: lastError,
    finalUrl,
  };
}

const CONCURRENCY = 4;
const results = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const idx = i++;
    const url = urls[idx];
    const r = await check(url);
    results[idx] = r;
    const tag = r.ok ? (r.soft ? "WARN" : "OK  ") : "BAD ";
    const code = r.error ? `ERR ${r.error}` : r.status;
    const note = r.soft ? " (bot-blocked; likely OK in browser)" : "";
    console.log(`[${tag}] ${code}\t${url}${note}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const broken = results.filter((r) => !r.ok);
const soft = results.filter((r) => r.soft);
console.log(
  `\nSummary: ${results.length - broken.length}/${results.length} OK ` +
  `(${soft.length} soft/bot-blocked), ${broken.length} broken`,
);
if (broken.length) {
  console.log("\nBroken links:");
  for (const b of broken) {
    console.log(
      `  ${b.status || "ERR"} ${b.url}${b.error ? ` (${b.error})` : ""}`,
    );
  }
  exit(1);
}
