const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const BASE = __dirname;
const MIN_WORDS = 150;

const ARTICLES = [
  ["free-apps-like-zombies-run",
   "5 Free Apps Like Zombies, Run! (That Don't Require a Subscription)",
   "Love the idea of being chased while you run but don't want another subscription? Here are free alternatives to Zombies, Run!, including Night Chase."],
  ["zombies-run-vs-night-chase",
   "Zombies, Run! vs Night Chase: Which GPS Zombie Game Is Right for You?",
   "An honest comparison of Zombies, Run!'s audio-drama running app and Night Chase's free, instant-play visual map chase — which fits how you run?"],
  ["immersive-running-apps-without-audio",
   "The Best Immersive Running Apps That Don't Rely on Audio",
   "Not every gamified running app needs headphones. Here are visual, map-based running games for runners who'd rather listen to their own podcast."],
  ["gamify-running-hate-cardio",
   "How to Gamify Running When You Absolutely Hate Cardio",
   "If cardio feels like a chore, gamification can trick your brain into forgetting you're exercising. Here's how to gamify running, step by step."],
  ["running-games-for-adults",
   "7 Running Games for Adults Who Find Jogging Boring",
   "Jogging doesn't have to be dull. Here are running games for adults — from location-based apps to GPS zombie chases — that make it feel like play."],
  ["running-motivation-for-beginners",
   "Running Motivation for Beginners: Why You Need a Quest, Not a Stopwatch",
   "Beginner running advice usually focuses on pace and distance. Here's why framing your first runs as a game, not a stopwatch test, works better."],
  ["how-to-stop-finding-running-boring",
   "How to Stop Finding Running Boring: 5 Gamified Strategies",
   "Past the cliche advice about new shoes and podcasts, here are 5 concrete gamification strategies to make running less boring, starting today."],
  ["run-trackers-without-subscription",
   "Best Run Trackers Without a Subscription (or an App Download)",
   "You don't need a paid account or an app install just to track a run. Here are free, no-subscription run trackers that work straight from your browser."],
  ["browser-based-gps-running-games",
   "How to Play GPS Running Games in Your Browser (No App Required)",
   "No download, no account, no background permissions. Here's how browser-based GPS running games work, and why that's worth trying first."],
  ["strava-alternatives-casual-runners",
   "Strava Alternatives for Casual Runners Who Hate Leaderboards",
   "Not every runner wants their pace judged by strangers. Here are private, low-pressure Strava alternatives for people who just want to move."],
  ["gamified-interval-training-fartlek",
   'Gamified Interval Training: How to Use "Chases" for Fartlek Runs',
   "Fartlek training is basically unstructured intervals — and a chase mechanic makes a natural, randomized interval timer. Here's how to combine them."],
  ["best-gps-fitness-games",
   "The Best GPS Fitness Games to Play Outside This Summer",
   "From Pokémon Go to zombie chases, here are the best GPS-based fitness games for turning a walk or run outside into something worth doing."],
  ["gamify-walking-apps",
   "Can You Gamify Walking? The Best Apps for Walkers and Joggers",
   "Most gamified fitness apps assume you're running hard. Here are options, including adjustable-difficulty games, that work for walkers too."],
  ["fun-ways-to-run-outside",
   "Fun Ways to Run Outside: Ditch the Treadmill with Location-Based Games",
   "If the treadmill feels safer than the sidewalk, a location-based running game gives you a reason to head outside. Here's where to start."],
  ["free-outdoor-fitness-games-students",
   "Free Outdoor Fitness Games for Teens and College Students",
   "You don't need a gym membership or a paid app to stay active. Here are free outdoor fitness games for teens and students, no subscription required."],
  ["zombie-chase-apps-run-faster",
   "Zombie Chase Running Apps: Do They Actually Make You Run Faster?",
   "Does being \"chased\" by virtual zombies actually change how you run? Here's what's going on with adrenaline, play, and pace in gamified running."],
  ["gamification-transforms-cardio",
   "How Gamification Transforms Cardio From a Chore Into a Game",
   "Why do points and survival mechanics motivate us more than a calorie counter? A look at the psychology of gamified exercise."],
  ["pedometer-vs-live-map-chases",
   "Pedometer Apps vs. Live Map Chases: A Better Way to Move",
   "A step count is passive feedback. A live map chase is active engagement. Here's why the second one might get you moving more consistently."],
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function articleShell({ title, desc, slug, bodyHtml, noindex }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <title>${esc(title)} | Night Chase</title>
    <meta name="description" content="${esc(desc)}" />
${noindex ? '    <meta name="robots" content="noindex" />\n' : ""}
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta
      property="og:url"
      content="https://julienreszka.github.io/night-chase/articles/${slug}.html"
    />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary" />
    <meta
      property="twitter:url"
      content="https://julienreszka.github.io/night-chase/articles/${slug}.html"
    />
    <meta property="twitter:title" content="${esc(title)}" />
    <meta property="twitter:description" content="${esc(desc)}" />

    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Inter:400,600,700,800&display=swap"
    />
    <link rel="stylesheet" href="assets/article.css" />

    <!-- Google tag (gtag.js) -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-CGGYE2S105"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-CGGYE2S105");
    </script>
  </head>
  <body>
    <div class="wrap">
      <div class="crumbs">
        <a href="../../index.html">Julien Reszka's Github Pages</a>
        <span>/</span>
        <a href="../index.html">Night Chase</a>
        <span>/</span>
        <a href="index.html">Articles</a>
      </div>

      <div id="article-root">
${bodyHtml}
      </div>

      <div class="cta-card">
        <div class="emoji">\u{1F9DF}</div>
        <div class="body">
          <b>Night Chase</b>
          <span>Free GPS zombie-chase running game. No app, no account, no ads.</span>
        </div>
        <a class="btn" href="../index.html">Play free</a>
      </div>

      <div class="footer-links">
        <a href="index.html">&larr; More articles</a>
        <a href="../index.html">Try Night Chase &rarr;</a>
      </div>
    </div>
  </body>
</html>
`;
}

function indexPage(finished) {
  const items = finished
    .map(
      ([slug, title]) =>
        `          <li><a href="${slug}.html">${esc(title)}</a></li>`
    )
    .join("\n");
  const remaining = ARTICLES.length - finished.length;
  const note =
    remaining > 0
      ? `\n        <p class="note" style="margin-top: 0.9rem">${remaining} more article${
          remaining === 1 ? "" : "s"
        } coming soon.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <title>Articles | Night Chase</title>
    <meta
      name="description"
      content="Guides on gamified running, free alternatives to paid running apps, and how to make cardio less boring — from the team behind Night Chase."
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Inter:400,600,700,800&display=swap"
    />
    <link rel="stylesheet" href="assets/article.css" />
    <style>
      .article-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .article-list li {
        border-bottom: 1px solid var(--border);
      }
      .article-list li:last-child {
        border-bottom: none;
      }
      #article-root .article-list a {
        display: block;
        padding: 0.9rem 0.2rem;
        color: var(--text);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.98rem;
      }
      #article-root .article-list a:hover {
        color: var(--accent);
      }
      h1 {
        font-size: 1.6rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0 0 0.4rem;
      }
      .sub {
        color: var(--text-soft);
        font-size: 0.95rem;
        margin: 0 0 1.25rem;
      }
      .note {
        font-size: 0.85rem;
        color: var(--text-faint);
      }
    </style>
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-CGGYE2S105"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-CGGYE2S105");
    </script>
  </head>
  <body>
    <div class="wrap">
      <div class="crumbs">
        <a href="../../index.html">Julien Reszka's Github Pages</a>
        <span>/</span>
        <a href="../index.html">Night Chase</a>
      </div>
      <h1>Articles</h1>
      <p class="sub">
        Notes on gamified running, free alternatives to paid running apps,
        and making cardio less boring.
      </p>
      <div id="article-root">
        <ul class="article-list">
${items}
        </ul>${note}
      </div>

      <div class="cta-card">
        <div class="emoji">\u{1F9DF}</div>
        <div class="body">
          <b>Night Chase</b>
          <span>Free GPS zombie-chase running game. No app, no account, no ads.</span>
        </div>
        <a class="btn" href="../index.html">Play free</a>
      </div>
    </div>
  </body>
</html>
`;
}

const finished = [];

for (const [slug, title, desc] of ARTICLES) {
  const mdPath = path.join(BASE, slug + ".md");
  const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "";
  const wordCount = md.trim().split(/\s+/).filter(Boolean).length;
  const isFinished = wordCount >= MIN_WORDS;

  let bodyHtml;
  if (isFinished) {
    bodyHtml = marked.parse(md, { gfm: true, breaks: false });
    finished.push([slug, title]);
  } else {
    bodyHtml =
      '<h1>Coming soon</h1>\n<p>This article is still being written. Check back soon, or head back to <a href="../index.html">Night Chase</a>.</p>';
  }

  const html = articleShell({
    title,
    desc,
    slug,
    bodyHtml,
    noindex: !isFinished,
  });
  fs.writeFileSync(path.join(BASE, slug + ".html"), html);
  console.log((isFinished ? "[ready]   " : "[draft]   ") + slug);
}

fs.writeFileSync(path.join(BASE, "index.html"), indexPage(finished));
console.log(`\n${finished.length}/${ARTICLES.length} articles finished. Index rebuilt.`);
