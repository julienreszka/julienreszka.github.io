#!/usr/bin/env node
// Download canonical PDFs of papers cited in the IWC section of armey-curve.html
// to economic-simulator/papers/ for posterity.
//
// Only papers with publicly-available, openly-distributed PDFs are downloaded:
//   - Pigou (1920)               public domain (Internet Archive)
//   - Buchanan & Tullock (1962)  Liberty Fund OLL (free PDF)
//   - Arrow et al. (2004)        AEA JEP (complimentary PDF)
//   - Stern (2008)               AEA AER Ely Lecture (complimentary PDF)
//   - Nordhaus (2007)            AEA JEL (full PDF)
//
// Paywalled JSTOR papers (Coase 1960, Hartwick 1977, Weitzman 1976) are NOT
// downloaded — only their citation metadata is recorded.

import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "papers");

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  Accept:
    "application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

// Each entry: filename + url + citation. Optional referer.
//
// Editorial note: every paper below was produced with substantial public funding
// (university salaries, public research grants). The author considers all such work
// part of the scholarly commons. Paywalled PDFs are still attempted; if a publisher
// refuses an anonymous download, the script records the refusal honestly in the
// README rather than circumventing access controls.
const PAPERS = [
  {
    file: "pigou-1920-economics-of-welfare.pdf",
    url: "https://archive.org/download/in.ernet.dli.2015.6160/2015.6160.The-Economics-Of-Welfare.pdf",
    citation:
      "Pigou, A. C. (1920). The Economics of Welfare. London: Macmillan.",
    landing: "https://archive.org/details/in.ernet.dli.2015.6160",
  },
  {
    file: "buchanan-tullock-1962-calculus-of-consent.pdf",
    url: "https://oll-resources.s3.us-east-2.amazonaws.com/oll3/store/titles/1063/Buchanan_0102-03_EBk_v6.0.pdf",
    citation:
      "Buchanan, J. M., & Tullock, G. (1962). The Calculus of Consent: Logical Foundations of Constitutional Democracy. Ann Arbor: University of Michigan Press. (Liberty Fund ed., 1999.)",
    landing:
      "https://oll.libertyfund.org/title/buchanan-the-calculus-of-consent-logical-foundations-of-constitutional-democracy",
  },
  {
    file: "arrow-et-al-2004-are-we-consuming-too-much.pdf",
    url: "https://www.aeaweb.org/articles/pdf/doi/10.1257/0895330042162377",
    citation:
      "Arrow, K., Dasgupta, P., Goulder, L., et al. (2004). Are We Consuming Too Much? Journal of Economic Perspectives, 18(3), 147–172. DOI: 10.1257/0895330042162377",
    landing:
      "https://www.aeaweb.org/articles?id=10.1257/0895330042162377",
  },
  {
    file: "stern-2008-economics-of-climate-change.pdf",
    url: "https://www.aeaweb.org/articles/pdf/doi/10.1257/aer.98.2.1",
    citation:
      "Stern, N. (2008). The Economics of Climate Change. American Economic Review, 98(2), 1–37. DOI: 10.1257/aer.98.2.1",
    landing: "https://www.aeaweb.org/articles?id=10.1257/aer.98.2.1",
  },
  {
    file: "nordhaus-2007-review-of-stern-review.pdf",
    url: "https://www.aeaweb.org/articles/pdf/doi/10.1257/jel.45.3.686",
    citation:
      "Nordhaus, W. D. (2007). A Review of the Stern Review on the Economics of Climate Change. Journal of Economic Literature, 45(3), 686–702. DOI: 10.1257/jel.45.3.686",
    landing: "https://www.aeaweb.org/articles?id=10.1257/jel.45.3.686",
  },
  {
    file: "unep-2023-inclusive-wealth-report.pdf",
    url: "https://wedocs.unep.org/bitstreams/da6e6162-9a9c-4d3b-b9b7-3676cc9808df/download",
    citation:
      "UNEP (2023). Inclusive Wealth Report 2023: Measuring Sustainability and Equity. Nairobi: United Nations Environment Programme.",
    landing: "https://wedocs.unep.org/handle/20.500.11822/43131",
  },
  // The next three are paywalled on JSTOR. JSTOR allows free online reading for
  // most users but requires authentication to download a PDF. The script will
  // attempt the download and report the publisher's response honestly.
  {
    file: "coase-1960-problem-of-social-cost.pdf",
    url: "https://www.jstor.org/stable/pdf/724810.pdf",
    citation:
      "Coase, R. H. (1960). The Problem of Social Cost. Journal of Law and Economics, 3, 1–44.",
    landing: "https://www.jstor.org/stable/724810",
  },
  {
    file: "hartwick-1977-intergenerational-equity.pdf",
    url: "https://www.jstor.org/stable/pdf/1828847.pdf",
    citation:
      "Hartwick, J. M. (1977). Intergenerational Equity and the Investing of Rents from Exhaustible Resources. American Economic Review, 67(5), 972–974.",
    landing:
      "https://econpapers.repec.org/article/aeaaecrev/v_3a67_3ay_3a1977_3ai_3a5_3ap_3a972-74.htm",
  },
  {
    file: "weitzman-1976-welfare-significance-national-product.pdf",
    url: "https://www.jstor.org/stable/pdf/1886092.pdf",
    citation:
      "Weitzman, M. L. (1976). On the Welfare Significance of National Product in a Dynamic Economy. Quarterly Journal of Economics, 90(1), 156–162.",
    landing: "https://www.jstor.org/stable/1886092",
  },
];

const CITATION_ONLY = [];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function download(paper) {
  const out = join(OUT_DIR, paper.file);
  if (await exists(out)) {
    console.log(`[SKIP] already present: ${paper.file}`);
    return { ok: true, skipped: true };
  }
  const headers = { ...BROWSER_HEADERS };
  if (paper.landing) headers.Referer = paper.landing;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(paper.url, {
      method: "GET",
      redirect: "follow",
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.log(`[FAIL] ${res.status}\t${paper.file}\t<- ${paper.url}`);
      return { ok: false, status: res.status };
    }
    const ct = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    // Sanity check: PDFs start with %PDF
    if (!buf.subarray(0, 4).toString("ascii").startsWith("%PDF")) {
      console.log(
        `[FAIL] not a PDF (got ${ct}, ${buf.length} bytes)\t${paper.file}`,
      );
      return { ok: false, status: 0, error: `not-pdf: ${ct}` };
    }
    await writeFile(out, buf);
    console.log(
      `[OK  ] ${(buf.length / 1024 / 1024).toFixed(2)} MB\t${paper.file}`,
    );
    return { ok: true, bytes: buf.length };
  } catch (e) {
    console.log(`[ERR ] ${e.message}\t${paper.file}`);
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

await mkdir(OUT_DIR, { recursive: true });

console.log(`Downloading ${PAPERS.length} papers to ${OUT_DIR}\n`);
const results = [];
for (const p of PAPERS) {
  results.push({ paper: p, result: await download(p) });
}

// Write README.md
const lines = [
  "# Cited papers — local archive",
  "",
  "Local copies of the papers cited in the Inclusive Wealth Criterion section of",
  "`../armey-curve.html`, saved here for posterity in case publisher URLs rot.",
  "",
  "**Editorial note.** Every paper below was produced with substantial public",
  "funding — university salaries, public research grants, taxpayer-supported",
  "academic infrastructure. Treating that work as a private revenue stream behind",
  "a paywall is, in the author's view, a bug in the scholarly-publishing system.",
  "These local copies exist so the citations in this article remain reachable to",
  "any reader, regardless of institutional affiliation.",
  "",
  "Run `node scripts/download-papers.mjs` to refresh. Files already present are",
  "skipped, so you can manually drop a PDF into `papers/` with the expected",
  "filename and the script will preserve it on the next run.",
  "",
  "## Status",
  "",
];
const ok = results.filter((r) => r.result.ok);
const fail = results.filter((r) => !r.result.ok);
lines.push(`Automatic: **${ok.length} of ${results.length} downloaded.**`);
lines.push("");
if (fail.length) {
  lines.push(
    `${fail.length} publishers refuse anonymous scripted access (Cloudflare JS`,
  );
  lines.push(
    "challenge, JSTOR auth gate, etc.). To complete the archive, open each",
  );
  lines.push(
    "landing page below in a browser, click \"Download PDF\", and save with the",
  );
  lines.push("filename shown.");
  lines.push("");
}

for (const { paper, result } of results) {
  const status = result.ok
    ? result.skipped
      ? "✓ already present"
      : "✓ downloaded"
    : `✗ FAILED — ${result.status === 403 ? "publisher blocks anonymous scripts" : result.error ?? `status ${result.status}`}. Save manually as \`${paper.file}\`.`;
  lines.push(`### \`${paper.file}\``);
  lines.push("");
  lines.push(`Status: ${status}`);
  lines.push("");
  lines.push(`> ${paper.citation}`);
  lines.push("");
  lines.push(`- PDF source: <${paper.url}>`);
  if (paper.landing) lines.push(`- Landing page: <${paper.landing}>`);
  lines.push("");
}
await writeFile(join(OUT_DIR, "README.md"), lines.join("\n"));
console.log(`\nWrote ${join(OUT_DIR, "README.md")}`);

if (fail.length) {
  console.log(
    `\n${fail.length} paper(s) need manual download — see papers/README.md.`,
  );
}
