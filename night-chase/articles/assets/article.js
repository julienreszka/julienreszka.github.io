(function () {
  "use strict";
  const root = document.getElementById("article-root");
  if (!root || typeof marked === "undefined") return;
  const slug = location.pathname.split("/").pop().replace(/\.html?$/, "");
  const MIN_WORDS = 150; // below this, treat as an unfinished draft

  function showComingSoon() {
    root.innerHTML =
      '<h1>Coming soon</h1><p>This article is still being written. Check back soon, or head back to <a href="../index.html">Night Chase</a>.</p>';
  }

  fetch(slug + ".md")
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed: " + r.status);
      return r.text();
    })
    .then((md) => {
      const wordCount = md.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORDS) {
        showComingSoon();
        return;
      }
      root.innerHTML = marked.parse(md, { gfm: true, breaks: false });
    })
    .catch(() => {
      root.innerHTML =
        "<p>Couldn't load this article's content. Try refreshing.</p>";
    });
})();
