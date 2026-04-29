// faq-data.mjs — single source of truth for all FAQ entries on armey-curve.html
//
// Each entry has:
//   q     — question text (plain text, used in JSON-LD "name")
//   jsonA — answer text for JSON-LD (plain text only — no HTML tags)
//   html  — answer HTML for the visible <details> block (may contain tags)
//           If omitted, falls back to a <p> wrapping jsonA (plain text).
//
// inject-faq.mjs reads this file and splices both representations into
// armey-curve.html at the anchor comments it manages.

export const FAQ = [
  {
    q: "What is the Armey Curve?",
    jsonA:
      "The Armey Curve is a theoretical relationship between government spending as a percentage of GDP and economic growth. It proposes an inverted-U shape with an optimal government size around 20–30% of GDP. Cross-country data challenges this, suggesting a power law (monotonically decreasing) relationship fits better.",
    html: `<p>
              The Armey Curve is a theoretical relationship between government
              spending as a share of GDP and economic growth. It proposes an
              inverted-U shape with an optimal government size around
              20&ndash;30% of GDP. Cross-country data challenges this: a power
              law (monotonically decreasing) relationship fits the evidence
              consistently better.
            </p>`,
  },
  {
    q: "Does more government spending reduce economic growth?",
    jsonA:
      "Cross-country data from the World Bank consistently shows a negative correlation between government spending as a share of GDP and GDP growth rates. Countries with smaller governments (e.g. Singapore ~17%, Hong Kong ~15%) tend to outgrow high-spending peers. The relationship fits a power law better than the traditional quadratic Armey Curve.",
    html: `<p>
              Cross-country World Bank data consistently shows a negative
              correlation between government spending as a share of GDP and GDP
              growth rates. Countries with smaller governments (Singapore ~15%,
              Bangladesh ~9%) tend to outgrow high-spending peers. The
              relationship fits a Power Law better than the traditional
              Quadratic Armey Curve: R&sup2;&nbsp;=&nbsp;0.4219
              (approx. 95% CI: 0.28&ndash;0.56) vs. 0.3856 for Quadratic &mdash;
              across 113 countries in the 2005&ndash;2023 structural sample.
              The CI is computed via Fisher&rsquo;s Z transformation on the
              correlation coefficient.
            </p>`,
  },
  {
    q: "What is the optimal size of government?",
    jsonA:
      "The data does not support a precise optimal size. Unlike the quadratic Armey Curve which implies a sweet spot around 20–30% of GDP, power law models suggest growth is highest at the lowest feasible spending levels. Countries below 25% of GDP consistently outperform higher-spending peers, but a precise constitutional cap cannot be derived from a single cross-country regression.",
    html: `<p>
              The data does not support a precise optimal size. Unlike the
              quadratic Armey Curve which implies a sweet spot, power law models
              suggest growth is highest at the lowest feasible spending levels.
              Countries below 25% of GDP consistently outgrow higher-spending
              peers, but a precise constitutional cap cannot be derived from a
              single cross-country regression.
            </p>`,
  },
  {
    q: "What should government actually be used for?",
    jsonA:
      "If government spending reliably slows economic activity, its most defensible use is as a selective brake on harmful activity — pollution, overfishing, systemic financial risk — where private actors impose costs on others. Government focused on correcting negative externalities through liability rules or narrow targeted regulations can improve welfare while remaining small in budget terms.",
    html: `<p>
              If government spending reliably slows economic activity, its most
              defensible use is as a selective brake on harmful activity &mdash;
              pollution, overfishing, systemic financial risk &mdash; where
              private actors impose costs on others. A government focused on
              correcting negative externalities through liability rules or
              narrow targeted regulations can improve welfare while remaining
              small in budget terms.
            </p>`,
  },
  {
    q: "But aren't the Nordic countries rich with big governments?",
    jsonA:
      "The Nordic countries are wealthy but their growth rates are not high — Denmark averaged ~1.0% and Finland ~0.9% GDP growth in 2005–2019, exactly where the power law model places high-spending countries. Their wealth is a legacy of industrialisation built when governments were smaller. Sweden cut spending from 67% to ~49% of GDP between 1993 and 2007 and had its strongest growth decades immediately after. Wealth (a stock) persists long after the conditions that created it change; growth rates (a flow) respond more quickly.",
    html: `<p>
              Yes &mdash; but their <em>growth rates</em> are not high. Denmark
              averaged ~1.0% and Finland ~0.9% GDP growth in the 2005&ndash;2019
              period: exactly where the power law model places high-spending
              countries. Their wealth is a legacy of industrialisation built
              when their governments were smaller. Sweden is the clearest case:
              it cut spending from 67% to ~49% of GDP between 1993 and 2007 and
              had its strongest growth decades immediately after. Wealth (a stock)
              persists long after the conditions that created it change; growth
              rates (a flow) respond more quickly. The Nordic countries are rich
              <em>despite</em> their current spending levels, not because of them.
            </p>`,
  },
  {
    q: "Why don't economists promote the power law model?",
    jsonA:
      "A public-choice dynamic is likely at work: when governments fund most economic research and policy positions, institutional incentives favour frameworks compatible with continued government involvement. As James Buchanan argued, economists respond to incentives like everyone else — theory tends to lag evidence when political convenience and funding structures favour a particular conclusion.",
    html: `<p>
              A public-choice dynamic is likely at work: when governments fund
              most economic research and policy positions, institutional
              incentives favour frameworks compatible with continued government
              involvement. As James Buchanan argued, economists respond to
              incentives like everyone else &mdash; theory tends to lag evidence
              when political convenience and funding structures favour a
              particular conclusion.
            </p>`,
  },
  {
    q: "Does the data contradict the East Asian growth model?",
    jsonA:
      "Not necessarily. South Korea and Taiwan achieved 7–9% growth with moderate spending (~18–20% GDP) alongside significant industrial policy. Their experience shows that total spending level and institutional quality — not the absence of all state intervention — are what cross-country regressions primarily capture. Targeted industrial programs within a lean overall budget are different from broad high-spending welfare states.",
    html: `<p>
              Not necessarily. South Korea and Taiwan achieved 7&ndash;9% growth
              with moderate spending (~18&ndash;20% GDP) alongside significant
              industrial policy. Their experience shows that total spending
              level and institutional quality &mdash; not the absence of all
              state intervention &mdash; are what cross-country regressions
              primarily capture. Targeted programs within a lean overall budget
              are different from broad high-spending welfare states.
            </p>`,
  },
  {
    q: "What does pre-WWII history show about government spending and growth?",
    jsonA:
      "Before World War II, Western European governments spent roughly 10–15% of GDP and annual per-capita growth ran at ~2–3% — consistent with where the power law curve projects at those spending levels. The post-war expansion of the welfare state shifted every major Western economy rightward along the curve into the low-growth zone. Where high-spending economies have sustained rapid growth, compositional factors — high investment shares, catch-up convergence, or off-budget financing — tend to account for the exception.",
    html: `<p>
              Before World War II, Western European governments spent roughly
              <strong>10&ndash;15% of GDP</strong> and annual per-capita growth
              ran at <strong>~2&ndash;3%</strong> &mdash; consistent with where
              the power law curve projects at those spending levels. The
              post-war expansion of the welfare state shifted every major
              Western economy rightward along the curve into the low-growth
              zone. Where high-spending economies have sustained rapid growth,
              compositional factors &mdash; high investment shares, catch-up
              convergence, or off-budget financing &mdash; tend to account for
              the exception.
            </p>`,
  },
  {
    q: "What about failed states and countries with very low government spending?",
    jsonA:
      "No country in the World Bank panel has government spending below ~8% of GDP. Territories with near-zero formal government either collapse and lose World Bank coverage, or informalize so completely that GDP measurement breaks down. The data cannot speak to the sub-8% range, and what institutions classify as 'state failure' often means 'a territory that permits transactions we have prohibited' — those transactions represent real welfare gains by revealed preference.",
    html: `<p>
              No country in the World Bank panel has government spending below
              ~8% of GDP. This floor is not random: territories with near-zero
              formal government either collapse and lose World Bank coverage, or
              informalize so completely that GDP measurement breaks down. But
              this absence may itself reflect a measurement and classification
              problem rather than a hard economic floor. Hernando de Soto
              documented in <em>The Mystery of Capital</em> that informal
              economies in low-state territories are large and real but
              invisible to national accounts. What international institutions
              classify as &ldquo;state failure&rdquo; often means &ldquo;a
              territory that permits transactions we have prohibited&rdquo; &mdash;
              drug markets, unregulated finance, informal labour. Those
              transactions represent real welfare gains by revealed preference.
              The data cannot speak to the sub-8% range, and the apparent
              evidence against very small states may partly reflect measurement
              choices rather than economic reality.
            </p>`,
  },
  {
    q: "If government spending always slows growth, what should government actually do?",
    jsonA:
      "The empirical curve answers 'how much' but not 'on what'. The article proposes a two-condition rule: government should brake an activity only when (1) it shrinks inclusive wealth — the present value of all productive capital stocks, produced, human, natural, knowledge, and institutional — and (2) some affected party never consented to bear the cost. Activities that satisfy both conditions are genuine negative externalities: pollution, resource depletion beyond regeneration rates, systemic financial risk. Activities that fail either condition — consensual transactions, wealth-creating innovation, or lifestyle choices that harm only the chooser — fall outside the criterion's scope.",
    html: `<p>
              The empirical curve answers <em>how much</em> but not <em>on what</em>.
              The article proposes a two-condition rule: government should brake an
              activity only when (1) it shrinks <strong>inclusive wealth</strong> &mdash;
              the present value of all productive capital stocks: produced, human,
              natural, knowledge, and institutional &mdash; and (2) some affected party
              <strong>never consented</strong> to bear the cost. Activities that satisfy
              both conditions are genuine negative externalities: pollution, resource
              depletion beyond regeneration rates, systemic financial risk. Activities
              that fail either condition &mdash; consensual transactions, wealth-creating
              innovation, or lifestyle choices that harm only the chooser &mdash; fall
              outside the criterion&rsquo;s scope.
            </p>`,
  },
  {
    q: "Why use inclusive wealth rather than GDP as the criterion for intervention?",
    jsonA:
      "GDP can be inflated by the very pathologies a brake should target. Extracting an oil field boosts GDP while depleting natural capital; transfer payments cycle through GDP without creating wealth; coerced transactions register as economic activity. Inclusive wealth — the shadow-price sum of all productive capital stocks — cannot be gamed the same way: depleting natural capital without reinvesting elsewhere shrinks it by construction. The framework follows the Dasgupta Review (2021) and the Arrow-Dasgupta-Mäler (2004) unified wealth accounting tradition.",
    html: `<p>
              GDP can be inflated by the very pathologies a brake should target.
              Extracting an oil field boosts GDP while depleting natural capital;
              transfer payments cycle through GDP without creating wealth; coerced
              transactions register as economic activity. Inclusive wealth &mdash;
              the shadow-price sum of all productive capital stocks &mdash; cannot
              be gamed the same way: depleting natural capital without reinvesting
              elsewhere shrinks it by construction. The framework follows the
              <a href="https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review" target="_blank" rel="noopener">Dasgupta Review (2021)</a>
              and the
              <a href="https://www.aeaweb.org/articles?id=10.1257/0895330042162377" target="_blank" rel="noopener">Arrow, Dasgupta &amp; M&auml;ler (2004)</a>
              unified wealth accounting tradition.
            </p>`,
  },
  {
    q: "What does the 2×2 quadrant diagram show?",
    jsonA:
      "Two binary questions — did all affected parties consent? does inclusive wealth grow or shrink? — produce four quadrants. Three of the four tell government to do nothing: (1) consensual and wealth-growing: encourage or leave alone; (2) consensual and wealth-shrinking: leave alone, it is their loss and their choice; (3) non-consensual and wealth-growing: rare, investigate but do not reflexively brake. Only the fourth quadrant — non-consensual and wealth-shrinking — gives government objective standing to act. This is a much narrower licence than 'whatever the median voter wants' and a much wider one than 'government should never act'.",
    html: `<p>
              Two binary questions &mdash; did all affected parties consent? does
              inclusive wealth grow or shrink? &mdash; produce four quadrants.
              Three of the four tell government to do nothing: consensual and
              wealth-growing (encourage or leave alone); consensual and
              wealth-shrinking (leave alone &mdash; their loss, their choice);
              non-consensual and wealth-growing (rare; investigate but do not
              reflexively brake). Only the fourth quadrant &mdash; non-consensual
              and wealth-shrinking &mdash; gives government objective standing to
              act. This is a much narrower licence than &ldquo;whatever the median
              voter wants&rdquo; and a much wider one than &ldquo;government should
              never act.&rdquo;
            </p>`,
  },
  {
    q: "Does the criterion add a third condition beyond wealth and consent?",
    jsonA:
      "Yes. Even when both conditions are met — wealth shrinks, consent absent — government should still refrain if the brake itself costs more than the damage it prevents. The third filter sums deadweight loss (the Harberger triangle), enforcement cost, and expected regulatory capture risk, and compares that total to the magnitude of the wealth loss. If brakeCost > |ΔW|, the cure is worse than the disease. This is the standard public-choice corrective: Pigou taxes and Coasian bargaining only dominate unregulated markets when transaction and governance costs are low enough.",
    html: `<p>
              Yes. Even when both conditions are met &mdash; wealth shrinks,
              consent absent &mdash; government should still refrain if the
              brake itself costs more than the damage it prevents. The third
              filter sums deadweight loss (the Harberger triangle), enforcement
              cost, and expected regulatory capture risk, and compares that
              total to the magnitude of the wealth loss. If
              <code>brakeCost &gt; |&Delta;W|</code>, the cure is worse than
              the disease. This is the standard public-choice corrective: Pigou
              taxes and Coasian bargaining only dominate unregulated markets
              when transaction and governance costs are low enough to make them
              feasible.
            </p>`,
  },
];
