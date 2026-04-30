/**
 * update-external-reframe.mjs
 *
 * Syncs armey-curve.en.json and armey-curve.fr.json with the reframing
 * from "consent" to "external parties / ΔW_ext" that was applied to
 * armey-curve.html in April 2026.
 *
 * For managed-region keys (marked <!-- i18n:key:start/end --> in the HTML)
 * the EN value is extracted directly from the HTML so it stays in sync.
 * The FR values and all inline data-i18n key values are hardcoded here.
 *
 * Run: node scripts/update-external-reframe.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const base = resolve(__dir, "..");

const enPath = resolve(base, "armey-curve.en.json");
const frPath = resolve(base, "armey-curve.fr.json");
const htmlPath = resolve(base, "armey-curve.html");

function load(f) { return JSON.parse(readFileSync(f, "utf8")); }
function save(f, o) { writeFileSync(f, JSON.stringify(o, null, 2) + "\n"); }

/** Extract the inner HTML of a managed-region block from the HTML source. */
function extractBlock(html, key) {
  const startTag = `<!-- i18n:${key}:start -->`;
  const endTag = `<!-- /i18n:${key}:end -->`;
  const s = html.indexOf(startTag);
  const e = html.indexOf(endTag);
  if (s === -1 || e === -1) throw new Error(`Block not found in HTML: ${key}`);
  let inner = html.slice(s + startTag.length, e);
  inner = inner.replace(/^\n/, "").replace(/\n[ \t]*$/, "");
  return inner;
}

const html = readFileSync(htmlPath, "utf8");
const en = load(enPath);
const fr = load(frPath);

// ── Meta tags ────────────────────────────────────────────────────────────────

en["meta.description"] =
  "I tested the Armey Curve on 151 countries. Government spending monotonically slows growth (power law beats quadratic, R² 0.42 vs 0.39, n=113). So if government is structurally a brake, the right question isn't 'how much' but 'on what'. The Inclusive Wealth Criterion: brake an activity only when it imposes a net wealth loss on external parties AND the brake is cost-effective. Interactive simulator + 11-section essay.";
fr["meta.description"] =
  "J'ai testé la courbe d'Armey sur 151 pays. Les dépenses publiques freinent monotonement la croissance (loi de puissance > quadratique, R² 0,42 vs 0,39, n=113). Si l'État est structurellement un frein, la bonne question n'est pas « combien » mais « sur quoi ». Le critère de richesse inclusive : freiner une activité uniquement quand elle impose une perte de richesse nette sur des parties externes ET que le frein est rentable. Simulateur interactif + essai en 11 sections.";

en["meta.keywords"] =
  "Armey curve, government spending, economic growth, fiscal policy, public economics, power law model, inclusive wealth, selective brake, Pigou, Coase, Dasgupta Review, Buchanan Tullock, externalities, external parties, objective criterion, interactive simulator";
fr["meta.keywords"] =
  "courbe d'Armey, dépenses publiques, croissance économique, politique budgétaire, économie publique, modèle loi de puissance, richesse inclusive, frein sélectif, Pigou, Coase, rapport Dasgupta, Buchanan Tullock, externalités, parties externes, critère objectif, simulateur interactif";

en["meta.og.description"] =
  "Government spending monotonically slows growth across 151 countries (power law beats quadratic, R² 0.42 vs 0.39, n=113). If it's a brake, aim it — brake activities only when they impose a net wealth loss on external parties AND the brake is cost-effective. Three of four cells tell government to do nothing.";
fr["meta.og.description"] =
  "Les dépenses publiques freinent monotonement la croissance sur 151 pays (loi de puissance > quadratique, R² 0,42 vs 0,39, n=113). Si c'est un frein, visez-le — freinez uniquement quand l'activité impose une perte de richesse nette sur des parties externes ET que le frein est rentable. Trois cellules sur quatre disent à l'État de ne rien faire.";

en["meta.twitter.description"] =
  "I tested the Armey Curve on 151 countries. Spending monotonically slows growth — but the real fix isn't 'less' it's 'aim it'. Brake only when inclusive wealth falls for external parties AND the brake is cost-effective. Three of four cells: leave alone.";
fr["meta.twitter.description"] =
  "J'ai testé la courbe d'Armey sur 151 pays. Les dépenses freinent monotonement la croissance — mais la vraie réponse n'est pas « moins », c'est « visez ». Freinez uniquement quand la richesse inclusive recule pour les parties externes ET que le frein est rentable. Trois cellules sur quatre : ne rien faire.";

// ── Managed-region blocks: EN extracted from HTML, FR hardcoded ──────────────

en["prose.argument-aside"] = extractBlock(html, "prose.argument-aside");
fr["prose.argument-aside"] =
  `<div style="font-size: 0.72em; font-weight: 700; letter-spacing: 0.12em; color: #f4d35e; margin-bottom: 8px;">L'ARGUMENT EN TROIS TEMPS</div>
        <ol style="margin: 0; padding-left: 22px;">
          <li style="margin-bottom: 6px;"><strong>L'État ralentit l'activité économique agrégée.</strong> Le
            <a href="#armey-simulator" style="color:#90caf9;">simulateur</a> montre que la relation est monotonement négative — pas de point optimal de la courbe d'Armey entre 15 et 25 % du PIB.</li>
          <li style="margin-bottom: 6px;"><strong>La question politique n'est donc pas &laquo; combien ? &raquo; — mais &laquo; pour quoi ? &raquo;</strong>
            Si l'État est structurellement un frein, on ne le minimise pas, on le
            <a href="#selective-brake" style="color:#90caf9;">cible</a>. Les freins sont utiles précisément parce qu'ils ralentissent.</li>
          <li><strong>Ciblez-le selon une règle objective, pas selon les préférences.</strong> Le
            <a href="#inclusive-wealth-criterion" style="color:#90caf9;">Critère de richesse inclusive</a> : freiner une activité uniquement si elle impose une perte de richesse nette sur des parties externes ET que le frein est rentable.
            Trois cellules sur quatre disent à l'État de ne rien faire.</li>
        </ol>
        <p style="margin: 10px 0 0; font-size: 0.88em; opacity: 0.8;">Raccourcis :
          <a href="#cut-gains-table" style="color:#90caf9;">Gain de croissance d'une coupe de 5 points</a> ·
          <a href="#target-growth-table-section" style="color:#90caf9;">Coupe budgétaire pour atteindre un taux de croissance cible</a>
        </p>`;

en["prose.iwc-2x2-table"] = extractBlock(html, "prose.iwc-2x2-table");
fr["prose.iwc-2x2-table"] =
  `          <div class="table-scroll">
            <table class="iwc-2x2">
              <thead>
                <tr>
                  <th></th>
                  <th>Coût du frein &le; |&Delta;W<sub>ext</sub>|<br><span class="math-note">l'intervention est rentable</span></th>
                  <th>Coût du frein &gt; |&Delta;W<sub>ext</sub>|<br><span class="math-note">le remède est pire que le mal</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>$\\Delta W_{\\text{ext}} \\geq 0$</strong><br><span class="math-note">aucun préjudice externe net</span></td>
                  <td class="iwc-q-encourage">Laisser faire &mdash; aucune légitimité objective à agir</td>
                  <td class="iwc-q-leave">Laisser faire &mdash; aucune légitimité objective à agir</td>
                </tr>
                <tr>
                  <td><strong>$\\Delta W_{\\text{ext}} < 0$</strong><br><span class="math-note">perte de richesse externe</span></td>
                  <td class="iwc-q-brake">FREINER &mdash; la seule cellule où l'État a une légitimité objective</td>
                  <td class="iwc-q-unusual">Laisser faire &mdash; les coûts du frein dépassent le dommage qu'il préviendrait</td>
                </tr>
              </tbody>
            </table>
          </div>`;

en["prose.iwc-formula-body"] = extractBlock(html, "prose.iwc-formula-body");
fr["prose.iwc-formula-body"] =
  `          <p>
            Trois des quatre cellules indiquent au gouvernement de ne rien faire.
            Seule la cellule inférieure gauche — une perte de richesse externe qu'un
            frein rentable peut adresser — justifie une action. C'est une licence
            beaucoup plus étroite que « ce que veut l'électeur médian » &mdash;
            et beaucoup plus large que « le gouvernement ne devrait jamais agir ».
            Le reste de cette section définit $\\Delta W_{\\text{ext}}$ précisément.
          </p>

          <h4 data-i18n="heading.formula-2x2">La formule derrière le tableau 2&times;2</h4>
          <p>
            La formulation la plus claire vient de la tradition de la
            <strong>richesse inclusive</strong>. La généalogie :
          </p>
          <!-- IWC-PEDIGREE-START -->
          <div class="iwc-pedigree" aria-label="Généalogie de la richesse inclusive" data-i18n-aria-label="aria.iwc-pedigree">
            <div class="iwc-ped-row">
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">1920 / 1960</div>
                <div class="iwc-ped-name">Pigou &middot; Coase</div>
                <div class="iwc-ped-tag">externalités &amp; transactions</div>
              </div>
              <div class="iwc-ped-arrow">&rarr;</div>
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">1962</div>
                <div class="iwc-ped-name">Buchanan &amp; Tullock</div>
                <div class="iwc-ped-tag">coûts d'action collective en économie publique</div>
              </div>
            </div>
            <div class="iwc-ped-arrow iwc-ped-arrow-down">&darr;</div>
            <div class="iwc-ped-row">
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">1974 / 1976</div>
                <div class="iwc-ped-name">Solow &middot; Dasgupta &middot; Heal &middot; Weitzman</div>
                <div class="iwc-ped-tag">comptabilité de richesse par prix fictifs</div>
              </div>
              <div class="iwc-ped-arrow">&rarr;</div>
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">1977</div>
                <div class="iwc-ped-name">Hartwick</div>
                <div class="iwc-ped-tag">règle d'épuisement / réinvestissement</div>
              </div>
            </div>
            <div class="iwc-ped-arrow iwc-ped-arrow-down">&darr;</div>
            <div class="iwc-ped-row">
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">2004</div>
                <div class="iwc-ped-name">Arrow, Dasgupta, M&auml;ler et al.</div>
                <div class="iwc-ped-tag">cadre unifié de richesse inclusive</div>
              </div>
              <div class="iwc-ped-arrow">&rarr;</div>
              <div class="iwc-ped-node iwc-ped-node-final">
                <div class="iwc-ped-year">2021</div>
                <div class="iwc-ped-name">Rapport Dasgupta</div>
                <div class="iwc-ped-tag">reformulation de référence</div>
              </div>
            </div>
          </div>
          <p style="font-size: 0.88em; color: #94a3b8;">
            Sources, dans l'ordre :
            <a href="https://archive.org/details/in.ernet.dli.2015.6160" target="_blank" rel="noopener">Pigou (1920)</a>,
            <a href="https://www.jstor.org/stable/724810" target="_blank" rel="noopener">Coase (1960)</a>,
            <a href="https://oll.libertyfund.org/title/buchanan-the-calculus-of-consent-logical-foundations-of-constitutional-democracy" target="_blank" rel="noopener">Buchanan &amp; Tullock (1962)</a>,
            <a href="https://www.jstor.org/stable/2296370" target="_blank" rel="noopener">Solow (1974)</a>,
            <a href="https://www.jstor.org/stable/2296369" target="_blank" rel="noopener">Dasgupta &amp; Heal (1974)</a>,
            <a href="https://www.jstor.org/stable/1886092" target="_blank" rel="noopener">Weitzman (1976)</a>,
            <a href="https://econpapers.repec.org/article/aeaaecrev/v_3a67_3ay_3a1977_3ai_3a5_3ap_3a972-74.htm" target="_blank" rel="noopener">Hartwick (1977)</a>,
            <a href="https://www.aeaweb.org/articles?id=10.1257/0895330042162377" target="_blank" rel="noopener">Arrow, Dasgupta, M&auml;ler et al. (2004)</a>,
            <a href="https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review" target="_blank" rel="noopener">Dasgupta (2021)</a>.
            Chaque ingrédient a une source publiée, mais la règle unifiée n'est pas
            énoncée dans un seul article.
          </p>
          <!-- IWC-PEDIGREE-END -->
          <p>
            Définissez la richesse d'un pays comme la valeur actuelle de chaque
            stock de capital productif &mdash; produit, humain, naturel, savoir,
            institutionnel &mdash; chacun pondéré par son prix fictif :
          </p>
          <p style="text-align:center; font-size:1.05em">
            $$\\frac{dW}{dt} = \\sum_k p_k \\frac{dK_k}{dt}$$
          </p>
          <p class="iwc-gloss">
            <strong>En clair :</strong> le taux auquel la richesse d'un pays croît
            ($dW/dt$) est égal à la somme, sur chaque type de capital $k$
            (produit, humain, naturel, savoir, institutionnel), de la vitesse à
            laquelle ce capital change ($dK_k/dt$) multiplié par ce que vaut ce
            capital à la marge ($p_k$, son <em>prix fictif</em>).
            « $\\sum_k$ » signifie simplement « additionner sur chaque type de capital ».
          </p>
          <p>
            La croissance à long terme, honnêtement mesurée, est
            <span style="white-space:nowrap">$dW/dt > 0$</span>. Une activité est
            objectivement freinable si et seulement si elle réduit cette quantité
            <em>pour les parties extérieures à la transaction</em> (celles qui
            supportent un coût ou reçoivent un bénéfice sans avoir choisi de
            s'engager), et seulement lorsque le frein lui-même est rentable :
          </p>
          <p class="iwc-eq">
            $$\\text{Brake}(a) \\iff \\mathbb{E}\\!\\left[\\sum_k p_k\\,\\Delta K_k^{(a)}\\right] < 0$$
          </p>
          <p class="iwc-eq-caption">(sommé sur les parties externes &mdash; celles extérieures à la transaction &mdash; et seulement si le coût du frein &le; |&Delta;W<sub>ext</sub>|)</p>
          <p class="iwc-gloss">
            <strong>En clair :</strong> appliquez le frein à l'activité $a$
            <em>si et seulement si</em> (« $\\iff$ ») son effet <em>espéré</em>
            (« $\\mathbb{E}$ ») sur la richesse totale, sommé sur chaque type de
            capital, est négatif &mdash; en comptant uniquement les parties extérieures
            à la transaction (celles qui supportent un coût ou reçoivent un bénéfice
            sans avoir choisi de s'engager). $\\Delta K_k^{(a)}$ signifie
            « la variation du capital de type $k$ causée par l'activité $a$ ».
            Une seconde vérification (non montrée dans la formule) exige que le coût
            du frein ne dépasse pas cette perte.
          </p>`;

en["prose.iwc-table"] = extractBlock(html, "prose.iwc-table");
fr["prose.iwc-table"] =
  `              <div class="table-scroll">
            <table class="ranking-table" style="margin: 12px 0">
              <thead>
                <tr>
                  <th>Type d'activité</th>
                  <th>Quel $K_k$ diminue</th>
                  <th>Pourquoi le coût est externe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Externalités négatives</strong><br />
                    <em>pollution, congestion, risque systémique</em>
                  </td>
                  <td>air pur, infrastructures, stabilité financière</td>
                  <td>des tiers supportent le coût sans être dans la transaction</td>
                </tr>
                <tr>
                  <td>
                    <strong>Épuisement des ressources</strong><br />
                    <em>extraction au-delà de la régénération</em>
                  </td>
                  <td>$K_{\\text{natural}}$, sans investissement compensatoire</td>
                  <td>les générations futures sont extérieures à la transaction (règle de Hartwick violée)</td>
                </tr>
                <tr>
                  <td>
                    <strong>Recherche de rente</strong><br />
                    <em>lobbying, capture réglementaire, piratage de brevets</em>
                  </td>
                  <td>$K_{\\text{institutional}}$ s'érode ; $\\sum p_k \\Delta K_k < 0$ une fois cette érosion valorisée <span class="math-note">(les gains en capital produit sont plus que compensés par les pertes institutionnelles)</span></td>
                  <td>processus capturé, pas d'échange volontaire ; les coûts tombent sur des outsiders</td>
                </tr>
                <tr>
                  <td>
                    <strong>Fraude, coercition, monopole par la force</strong>
                  </td>
                  <td>variable (institutionnel, produit, humain)</td>
                  <td>les victimes sont externes à la transaction par définition</td>
                </tr>
                <tr>
                  <td>
                    <strong>Transferts intergénérationnels obligatoires non financés</strong><br />
                    <em>retraites par répartition financées par les travailleurs de demain</em>
                  </td>
                  <td>la créance de la jeune cohorte sur $\\sum_k K_k$ <span class="math-note">(stock total de capital)</span></td>
                  <td>les travailleurs non nés sont externes aux contrats négociés avant leur naissance</td>
                </tr>
                <tr>
                  <td>
                    <strong>Exploitation de l'asymétrie d'information</strong><br />
                    <em>prêts prédateurs, marketing trompeur</em>
                  </td>
                  <td>$K_{\\text{human}}$ <span class="math-note">(capital humain)</span>, $K_{\\text{produced}}$ <span class="math-note">(capital produit)</span> de la victime</td>
                  <td>la victime est externe : la désinformation lui a fait supporter des coûts qu'elle n'a pas sciemment acceptés</td>
                </tr>
              </tbody>
            </table>
          </div>`;

en["prose.iwc-flowchart"] = extractBlock(html, "prose.iwc-flowchart");
fr["prose.iwc-flowchart"] =
  `            <div class="iwc-node iwc-start">Activité à l'examen</div>
            <div class="iwc-arrow" aria-hidden="true"></div>

            <div class="iwc-step">
              <div class="iwc-step-main">
                <div class="iwc-node iwc-decision">
                  <div class="iwc-q">Q1</div>
                  <div>$\\Delta W_{\\text{ext}} = \\sum_k p_k\\,\\Delta K_k$ sur les parties externes</div>
                  <div class="math-note" style="margin-top:3px">(variation de richesse pour les parties extérieures à la transaction)</div>
                </div>
              </div>
              <div class="iwc-exit" aria-label="Supérieur ou égal à zéro : laisser faire" data-i18n-aria-label="aria.iwc-exit-zero">
                <span class="iwc-exit-label">$\\geq 0$</span>
                <span class="iwc-exit-line" aria-hidden="true"></span>
                <div class="iwc-node iwc-leave">Laisser faire &mdash; aucun préjudice externe</div>
              </div>
            </div>
            <div class="iwc-spine">
              <span class="iwc-spine-label">$&lt; 0$</span>
              <div class="iwc-arrow" aria-hidden="true"></div>
            </div>

            <div class="iwc-step">
              <div class="iwc-step-main">
                <div class="iwc-node iwc-decision">
                  <div class="iwc-q">Q2</div>
                  <div>Le coût du frein (perte sèche, application, capture) dépasse-t-il |&Delta;W<sub>ext</sub>|&nbsp;?</div>
                </div>
              </div>
              <div class="iwc-exit" aria-label="Oui : laisser faire" data-i18n-aria-label="aria.iwc-exit-yes">
                <span class="iwc-exit-label">Oui</span>
                <span class="iwc-exit-line" aria-hidden="true"></span>
                <div class="iwc-node iwc-leave">Laisser faire &mdash; le remède est pire que le mal</div>
              </div>
            </div>
            <div class="iwc-spine">
              <span class="iwc-spine-label">Non</span>
              <div class="iwc-arrow" aria-hidden="true"></div>
            </div>

            <div class="iwc-node iwc-brake">FREIN</div>`;

en["prose.legitimacy-section"] = extractBlock(html, "prose.legitimacy-section");
fr["prose.legitimacy-section"] =
  `          <p>
            Le critère rend un verdict par <em>action</em>. Le transposer à
            des gouvernements entiers est direct : la légitimité d'un régime
            est la part de ses actes coercitifs qui franchissent les deux
            filtres. Un gouvernement qui freine la pollution, la fraude,
            l'épuisement des ressources et le risque systémique utilise son
            instrument dans la cellule que le critère autorise. Un
            gouvernement qui freine des échanges volontaires, le travail
            productif ou la consommation pacifique entre adultes compétents
            applique le frein là où $\\Delta W_{\\text{ext}} \\geq 0$ &mdash;
            pied sur la pédale de frein là où il devrait être levé.
          </p>`;

en["faq.9.html"] = extractBlock(html, "faq.9.html");
fr["faq.9.html"] =
  `          <p>
                        La courbe empirique répond à <em>combien</em> mais pas à
                        <em>pour quoi</em>. L'article propose une règle à deux conditions :
                        le gouvernement ne doit freiner une activité que lorsque (1) elle
                        impose une perte de richesse nette sur des
                        <strong>parties externes</strong> &mdash; celles qui supportent un
                        coût sans être participantes à la transaction &mdash; sommée sur
                        tous les types de capital (produit, humain, naturel, savoir,
                        institutionnel), et (2) le frein lui-même est
                        <strong>rentable</strong> (perte sèche, coût d'application et risque
                        de capture réglementaire ensemble inférieurs au dommage). Les
                        activités satisfaisant les deux conditions sont de véritables
                        externalités négatives : pollution, épuisement des ressources
                        au-delà des taux de régénération, risque financier systémique. Les
                        activités qui échouent à l'une ou l'autre condition &mdash;
                        transactions internes, innovations créatrices de richesse, ou choix
                        de mode de vie ne produisant aucun préjudice externe &mdash; sont
                        hors du champ du critère.
                      </p>`;

en["faq.11.html"] = extractBlock(html, "faq.11.html");
fr["faq.11.html"] =
  `          <p>
                        Deux questions binaires produisent quatre cellules : y a-t-il une
                        perte de richesse nette pour les parties extérieures à la transaction
                        ($\\Delta W_{\\text{ext}} < 0$) ? et le frein est-il rentable
                        (coût du frein &le; |&Delta;W<sub>ext</sub>|) ?
                        Trois des quatre cellules disent à l'État de ne rien faire. Seule
                        la cellule où les parties externes perdent de la richesse nette ET
                        où le frein est rentable donne à l'État une légitimité objective pour
                        agir. C'est un mandat bien plus étroit que &ldquo;ce que veut
                        l'électeur médian&rdquo; et bien plus large que &ldquo;l'État ne
                        devrait jamais agir.&rdquo;
                      </p>`;

en["faq.11.q"] = "What does the 2×2 diagram show?";
fr["faq.11.q"] = "Que montre le diagramme 2×2 ?";

en["faq.12.html"] = extractBlock(html, "faq.12.html");
fr["faq.12.html"] =
  `          <p>
                        Le critère a deux conditions séquentielles. Première : l'activité
                        impose-t-elle une perte de richesse nette sur des parties externes
                        &mdash; celles extérieures à la transaction (parties qui supportent
                        un coût sans avoir choisi de participer) ? Cela se mesure comme
                        $\\Delta W_{\\text{ext}} < 0$ sur tous les types de capital. Si
                        oui, deuxième : le frein est-il rentable ? Le coût total de
                        l'intervention &mdash; perte sèche (le triangle de Harberger),
                        coût d'application et risque attendu de capture réglementaire &mdash;
                        doit être inférieur à l'ampleur de la perte de richesse externe. Si
                        <code>coûtFrein &gt; |&Delta;W<sub>ext</sub>|</code>, le remède est
                        pire que le mal. Les deux conditions doivent être réunies pour que
                        l'État ait une légitimité objective à agir.
                      </p>`;

en["faq.12.q"] = "What are the two conditions in the criterion?";
fr["faq.12.q"] = "Quelles sont les deux conditions du critère ?";

// ── Inline data-i18n keys ────────────────────────────────────────────────────

en["heading.what-consent-means"] = "What \u201cexternal\u201d actually means here";
fr["heading.what-consent-means"] = "Ce que signifie réellement « externe » ici";

en["prose.iwc-converse-p"] =
  "Conversely, the criterion <em>refuses</em> to condemn activities\n            that are merely unfashionable, inefficient, or disliked by\n            incumbents. Consumption choices of competent adults that affect\n            only themselves produce $\\Delta W_{\\text{ext}} = 0$ &mdash; there\n            are no external parties. The criterion is silent &mdash; which is\n            exactly what an objective rule should do where no objective harm\n            exists.";
fr["prose.iwc-converse-p"] =
  "À l'inverse, le critère <em>refuse</em> de condamner les activités\n            qui sont simplement démodées, inefficaces ou mal aimées par les\n            acteurs en place. Les choix de consommation d'adultes compétents\n            qui n'affectent qu'eux-mêmes produisent $\\Delta W_{\\text{ext}} = 0$ &mdash; il\n            n'y a pas de parties externes. Le critère est muet &mdash; ce qui est\n            exactement ce qu'une règle objective devrait faire là où aucun préjudice\n            objectif n'existe.";

en["prose.iwc-q3-implicit"] =
  "Q2 is the step most policy analysis skips. It matters because\n            many real-world activities produce negative $\\Delta W_{\\text{ext}}$\n            yet would still be made <em>worse</em> by intervention &mdash;\n            either because the brake mechanism is captureable (Q2 fail mode 1)\n            or because enforcement costs exceed the damage (Q2 fail mode 2).\n            The criterion licences action only when both filters are passed.";
fr["prose.iwc-q3-implicit"] =
  "Q2 est l'étape que la plupart des analyses politiques ignorent. Elle importe\n            parce que de nombreuses activités produisent un $\\Delta W_{\\text{ext}}$ négatif\n            mais seraient tout de même <em>aggravées</em> par une intervention &mdash; soit parce que\n            le mécanisme de frein est susceptible d'être capturé (mode d'échec Q2 n°\u00a01),\n            soit parce que les coûts d'application dépassent le dommage (mode d'échec Q2 n°\u00a02).\n            Le critère n'autorise l'action que lorsque les deux filtres sont validés.";

en["prose.iwc-q3-qualitative"] =
  "Q2 is the most qualitative of the two and worth flagging as\n            such. Deadweight loss has a textbook estimator (Harberger\n            triangles), enforcement cost has a budget line, but\n            <em>capture risk</em> &mdash; the probability that the brake\n            instrument gets bent toward the very interest it was meant to\n            constrain &mdash; is genuinely hard to put a number on. The\n            literature on regulatory capture\n            (<a href=\"https://doi.org/10.2307/3003160\" target=\"_blank\" rel=\"noopener\">Stigler 1971</a>;\n            <a href=\"https://doi.org/10.1093/oxrep/grj013\" target=\"_blank\" rel=\"noopener\">Dal B&oacute; 2006</a>)\n            describes the mechanism but offers no consensus formula. In\n            practice Q2 acts as a circuit-breaker: if a sector has a strong\n            track record of capturing its regulator, raise the burden of\n            proof for new brakes there; otherwise treat the deadweight and\n            enforcement components as the binding part of the test.";
fr["prose.iwc-q3-qualitative"] =
  "Q2 est le plus qualitatif des deux, et il vaut la peine de le\n            souligner. La perte sèche dispose d'un estimateur classique (les\n            triangles de Harberger), le coût d'application a une ligne budgétaire,\n            mais le <em>risque de capture</em> &mdash; la probabilité que l'instrument\n            de frein soit détourné au profit de l'intérêt même qu'il était censé\n            contraindre &mdash; est réellement difficile à chiffrer. La littérature\n            sur la capture réglementaire\n            (<a href=\"https://doi.org/10.2307/3003160\" target=\"_blank\" rel=\"noopener\">Stigler 1971</a>\u00a0;\n            <a href=\"https://doi.org/10.1093/oxrep/grj013\" target=\"_blank\" rel=\"noopener\">Dal B&oacute; 2006</a>)\n            décrit le mécanisme mais n'offre pas de formule consensuelle. En\n            pratique, Q2 fonctionne comme un disjoncteur\u00a0: si un secteur a de\n            solides antécédents de capture de son régulateur, relevez le seuil de\n            preuve pour les nouveaux freins dans ce secteur\u00a0; sinon, traitez les\n            composantes de perte sèche et de coût d'application comme la partie\n            contraignante du test.";

en["prose.worked-example-coal-p"] =
  "<strong>A coal subsidy.</strong>\n            $\\Delta K_{\\text{natural}} < 0$ (emissions, depleted reserves);\n            $\\Delta K_{\\text{human}} < 0$ (respiratory damage in downwind\n            populations, external to the transaction); $\\Delta K_{\\text{produced}} > 0$\n            (cheaper electricity, short-term); $\\Delta K_{\\text{institutional}} < 0$\n            (the lobbying apparatus that sustains the subsidy itself erodes\n            rule-of-law neutrality). Net: $\\Delta W_{\\text{ext}} < 0$ <span class=\"math-note\">(external wealth loss)</span>.\n            <strong>Verdict: brake.</strong>";
fr["prose.worked-example-coal-p"] =
  "<strong>Une subvention au charbon.</strong>\n            $\\Delta K_{\\text{naturel}} < 0$ (émissions, réserves épuisées) ;\n            $\\Delta K_{\\text{humain}} < 0$ (dommages respiratoires pour les\n            populations sous le vent, externes à la transaction) ; $\\Delta K_{\\text{produit}} > 0$\n            (électricité moins chère, à court terme) ; $\\Delta K_{\\text{institutionnel}} < 0$\n            (l'appareil de lobbying qui maintient la subvention érode lui-même\n            la neutralité de l'état de droit). Net : $\\Delta W_{\\text{ext}} < 0$ <span class=\"math-note\">(perte de richesse externe)</span>.\n            <strong>Verdict : freiner.</strong>";

en["prose.worked-example-grant-p"] =
  "<strong>A grant for basic-science research.</strong> The case is\n            harder than a coal subsidy and worth the honesty.\n            $\\Delta K_{\\text{knowledge}} > 0$ (results enter the public\n            domain with positive spillovers); $\\Delta K_{\\text{human}} > 0$\n            (trained researchers); but\n            $\\Delta K_{\\text{produced}} < 0$ for taxpayers, who are external\n            parties (they fund the grant through coerced transfers without\n            being participants in the research transaction). The verdict\n            therefore turns on Q1: is $\\Delta W_{\\text{ext}}$ negative on net?\n            For basic research with broad, non-rivalrous spillovers, the\n            knowledge gain that eventually accrues <em>back</em> to the same\n            taxpayers (cheaper medicine, better materials, public-domain\n            methods) typically exceeds the per-capita tax cost &mdash; so\n            $\\Delta W_{\\text{ext}} \\geq 0$ and the criterion declines to brake\n            it. <strong>Verdict: don't brake the activity, but the\n            funding mechanism remains a real cost the activity has to pay\n            back in spillover terms.</strong> Narrowly captured grants that\n            spill over only to the recipient (industry-specific subsidies,\n            company-town infrastructure) do not pay back and would fail Q1.";
fr["prose.worked-example-grant-p"] =
  "<strong>Une subvention à la recherche fondamentale.</strong> Le\n            cas est plus difficile que la subvention au charbon et mérite\n            l'honnêteté. $\\Delta K_{\\text{savoir}} > 0$ (les résultats\n            entrent dans le domaine public avec des effets de débordement\n            positifs) ; $\\Delta K_{\\text{humain}} > 0$ (chercheurs\n            formés) ; mais $\\Delta K_{\\text{produit}} < 0$ pour les\n            contribuables, qui sont des parties externes (ils financent la\n            subvention par des transferts contraints sans être participants\n            à la transaction de recherche). Le verdict dépend donc de Q1 :\n            $\\Delta W_{\\text{ext}}$ est-il négatif net ? Pour la recherche\n            fondamentale, dont les retombées sont larges et non rivales, le\n            gain de connaissance qui revient ensuite <em>aux mêmes\n            contribuables</em> (médicaments moins chers, meilleurs matériaux,\n            méthodes du domaine public) excède typiquement le coût fiscal par\n            tête &mdash; donc $\\Delta W_{\\text{ext}} \\geq 0$ et le critère\n            renonce à la freiner. <strong>Verdict : ne pas freiner\n            l'activité, mais le mécanisme de financement reste un coût réel\n            que l'activité doit rembourser sous forme de retombées.</strong>\n            Les subventions étroitement captées dont les retombées ne\n            profitent qu'au bénéficiaire (subventions sectorielles\n            spécifiques, infrastructures de ville-entreprise) ne remboursent\n            pas et échoueraient à Q1.";

en["prose.worked-example-notice-p"] =
  "Notice what the test did <em>not</em> require: a vote, a moral\n            intuition, or an opinion about energy policy. It only required\n            tallying the capital effects on external parties.";
fr["prose.worked-example-notice-p"] =
  "Remarquez ce que le test n'a pas exigé : un vote, une intuition morale\n            ou une opinion sur la politique énergétique. Il a seulement requis\n            de comptabiliser les effets sur le capital pour les parties externes.";

en["prose.dasgupta-reference-p"] =
  "<strong>One empirical reference point: the planet, 1992&ndash;2014.</strong>\n            The Dasgupta Review's Headline Message 2 reports that over this\n            period global per-capita produced capital roughly doubled while\n            per-capita natural capital fell by roughly 40%\n            (<a href=\"https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review\" target=\"_blank\" rel=\"noopener\">Dasgupta 2021</a>;\n            corroborated by the World Bank's\n            <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\"><em>Changing Wealth of Nations</em> 2021</a>).\n            Run those through the IWC lens: $\\Delta K_{\\text{produced}} > 0$,\n            but $\\Delta K_{\\text{natural}} \\ll 0$ for parties\n            &mdash; future generations, downstream ecosystems &mdash; who are\n            external to the trade. Whether\n            $\\sum_k p_k\\,\\Delta K_k$ was net-positive or net-negative overall\n            depends on shadow prices, which is exactly what the Review argues\n            we have been omitting from standard GDP accounting. The criterion\n            doesn't pretend to settle those shadow-price disputes; it forces\n            them into the open. A growth statistic that aggregates\n            +100% produced capital with &minus;40% natural capital into a single\n            cheerful headline number is not measuring wealth &mdash; it is\n            measuring one column of a ledger while pretending the others don't exist.";
fr["prose.dasgupta-reference-p"] =
  "<strong>Un point de référence empirique : la planète, 1992&ndash;2014.</strong>\n            Le Message principal 2 du Rapport Dasgupta indique que sur cette\n            période, le capital produit mondial par habitant a environ doublé tandis que\n            le capital naturel par habitant a chuté d'environ 40 %\n            (<a href=\"https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review\" target=\"_blank\" rel=\"noopener\">Dasgupta 2021</a> ;\n            corroboré par la\n            <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\"><em>Changing Wealth of Nations</em> 2021 de la Banque mondiale</a>).\n            Passés au crible IWC : $\\Delta K_{\\text{produit}} > 0$,\n            mais $\\Delta K_{\\text{naturel}} \\ll 0$ pour les parties\n            &mdash; générations futures, écosystèmes en aval &mdash; qui sont\n            externes à l'échange. Que\n            $\\sum_k p_k\\,\\Delta K_k$ soit globalement positif ou négatif\n            dépend des prix d'ombre, ce qui est exactement ce que le Rapport Dasgupta affirme\n            avoir omis de la comptabilité PIB standard. Le critère\n            ne prétend pas régler ces disputes de prix d'ombre ; il les\n            force au grand jour. Une statistique de croissance qui agrège\n            +100 % de capital produit avec &minus;40 % de capital naturel en un seul\n            nombre satisfaisant n'est pas en train de mesurer la richesse &mdash; il\n            mesure une colonne d'un grand livre en faisant semblant que les autres n'existent pas.";

en["prose.consent-intro-p"] =
  "&quot;External parties&quot; means those who bear a cost or receive\n            a benefit from an activity without choosing to participate in it.\n            This is the standard economic definition of an externality. The\n            boundary matters because the criterion is silent on harms that\n            fall only on willing participants &mdash; their wealth change is\n            real, but it is their choice to bear it. Three cases worth\n            distinguishing:";
fr["prose.consent-intro-p"] =
  "&quot;Parties externes&quot; désigne celles qui supportent un coût ou reçoivent\n            un bénéfice d'une activité sans avoir choisi d'y participer.\n            C'est la définition économique standard d'une externalité. La\n            frontière importe parce que le critère est muet sur les préjudices\n            qui ne touchent que des participants volontaires &mdash; leur variation de\n            richesse est réelle, mais c'est leur choix de la supporter. Trois cas\n            valent la peine d'être distingués :";

en["list.consent-types"] =
  "            <li>\n              <strong>Clearly external</strong>: the harmed party is\n              identifiable and did not participate in the transaction at all.\n              Classical externalities (pollution downwind, systemic risk\n              shifted to the deposit-insurance fund), fraud against\n              counterparties, and <strong>coerced transfers</strong> &mdash;\n              taxation, conscription, eminent domain &mdash; where the\n              contributing party was not a voluntary party to the particular\n              use of their resources. The criterion treats these as real\n              external costs.\n            </li>\n            <li>\n              <strong>Clearly internal</strong>: the party freely entered an\n              arrangement that priced the cost in &mdash; an insurance pool\n              whose premiums fund payouts, a professional code of conduct\n              accepted on entry, a club whose dues fund the clubhouse, a\n              private contract whose terms were negotiated. The defining\n              feature is voluntary participation: a person who could decline\n              and walk away is an internal party. Their wealth changes do not\n              enter $\\Delta W_{\\text{ext}}$.\n            </li>\n            <li>\n              <strong>Contested boundary</strong>: a voter who loses on a\n              budget line, a future generation affected by today's investment\n              choices, an animal or ecosystem that cannot transact at all.\n              The criterion requires a convention here &mdash; the standard\n              one is to treat future generations as external (hence Hartwick)\n              and non-transacting ecosystems as external via their shadow\n              prices on $K_{\\text{natural}}$. These are reasonable defaults,\n              not derivations.\n            </li>";
fr["list.consent-types"] =
  "            <li>\n              <strong>Clairement externe</strong> : la partie lésée est\n              identifiable et n'a pas participé à la transaction du tout.\n              Les externalités classiques (pollution sous le vent, risque\n              systémique transféré au fonds de garantie des dépôts), la\n              fraude contre des contreparties, et les <strong>transferts\n              contraints</strong> &mdash; impôts, conscription, expropriation\n              &mdash; où la partie contributrice n'était pas un acteur\n              volontaire à l'utilisation particulière de ses ressources.\n              Le critère les traite comme de véritables coûts externes.\n            </li>\n            <li>\n              <strong>Clairement interne</strong> : la partie est librement\n              entrée dans un arrangement qui intègre le coût &mdash; un pool\n              d'assurance dont les primes financent les indemnisations, un\n              code de conduite professionnel accepté à l'entrée, un club dont\n              les cotisations financent le local, un contrat privé dont les\n              termes ont été négociés. Le trait déterminant est la\n              participation volontaire : une personne qui pourrait refuser et\n              partir est une partie interne. Ses variations de richesse\n              n'entrent pas dans $\\Delta W_{\\text{ext}}$.\n            </li>\n            <li>\n              <strong>Frontière contestée</strong> : un électeur qui perd sur\n              une ligne budgétaire, une génération future affectée par les\n              choix d'investissement d'aujourd'hui, un animal ou un\n              écosystème qui ne peut pas transiger du tout. Le critère exige\n              une convention ici &mdash; la standard est de traiter les\n              générations futures comme externes (d'où Hartwick) et les\n              écosystèmes non transactants comme externes via leurs prix\n              d'ombre sur $K_{\\text{naturel}}$. Ce sont des valeurs par défaut\n              raisonnables, pas des dérivations.\n            </li>";

en["prose.consent-coase-p"] =
  "The Coase (1960) reading carries through: when transaction costs\n            are low and parties are identifiable, externalities can be\n            resolved privately and $\\Delta W_{\\text{ext}} = 0$ &mdash; the\n            criterion stays silent. Pigouvian intervention is only licensed\n            when private resolution is structurally impossible, not merely\n            unattractive.";
fr["prose.consent-coase-p"] =
  "La lecture de Coase (1960) se prolonge : lorsque les coûts de transaction\n            sont faibles et que les parties sont identifiables, les externalités peuvent être\n            résolues en privé et $\\Delta W_{\\text{ext}} = 0$ &mdash; le critère reste\n            silencieux. L'intervention pigouvienne n'est autorisée que lorsque la\n            résolution privée est structurellement impossible, pas simplement peu attrayante.";

en["list.hard-cases"] =
  "<li>\n              <strong>Public-goods underprovision.</strong> Defense, basic\n              research, contagious-disease surveillance: there is no activity\n              to brake, only one to <em>start</em>. The criterion tells\n              government what to slow, not what to provide. A complementary\n              rule (Samuelson on public goods) is needed for the production\n              side.\n            </li>\n            <li>\n              <strong>Voluntary risky behaviour with social spillovers.</strong>\n              Smoking, motorcycling without a helmet, recreational drugs.\n              The user is an internal party; the emergency-room budget is\n              external. The criterion says brake the external portion (e.g.\n              insurance pricing that reflects actual risk) <em>not</em> the\n              activity itself.\n            </li>\n            <li>\n              <strong>High-variance frontier activity.</strong> Gain-of-function\n              research, untested geoengineering, novel financial instruments.\n              The expectation operator $\\mathbb{E}$ matters: tail risk to\n              external parties can dominate even when the central\n              estimate of $\\Delta W_{\\text{ext}}$ is positive. The criterion\n              supports precaution proportional to the size of the external tail.\n            </li>\n            <li>\n              <strong>Effects on the unborn.</strong> Every long-horizon\n              decision affects people who don't yet exist. The criterion treats\n              them as external parties, represented by the discount rate $\\rho$\n              and by an obligation to leave $W$ non-decreasing (Hartwick).\n              This is a convention, not a derivation, and people of good faith\n              disagree about $\\rho$.\n            </li>";
fr["list.hard-cases"] =
  "<li>\n              <strong>Sous-provision de biens publics.</strong> Défense, recherche\n              fondamentale, surveillance des maladies contagieuses : il n'y a pas d'activité\n              à freiner, seulement une à <em>démarrer</em>. Le critère dit\n              au gouvernement quoi ralentir, pas quoi fournir. Une règle complémentaire\n              (Samuelson sur les biens publics) est nécessaire pour le côté production.\n            </li>\n            <li>\n              <strong>Comportement risqué volontaire avec externalités sociales.</strong>\n              Tabac, moto sans casque, drogues récréatives.\n              L'utilisateur est une partie interne ; le budget des urgences est\n              externe. Le critère dit de freiner la partie externe (par exemple\n              la tarification d'assurance reflétant le risque réel) <em>pas</em>\n              l'activité elle-même.\n            </li>\n            <li>\n              <strong>Activité frontière à haute variance.</strong> Recherche gain-de-fonction,\n              géo-ingénierie non testée, nouveaux instruments financiers.\n              L'opérateur d'espérance $\\mathbb{E}$ est important : le risque de queue pour\n              les parties externes peut dominer même lorsque l'estimation centrale\n              de $\\Delta W_{\\text{ext}}$ est positive. Le critère soutient\n              une précaution proportionnelle à la taille de la queue externe.\n            </li>\n            <li>\n              <strong>Effets sur les personnes à naître.</strong> Toute décision à long terme\n              affecte des personnes qui n'existent pas encore. Le critère les traite\n              comme des parties externes, représentées par le taux d'actualisation $\\rho$\n              et par une obligation de laisser $W$ non-décroissant (Hartwick).\n              C'est une convention, pas une dérivation, et des gens de bonne foi\n              sont en désaccord sur $\\rho$.\n            </li>";

en["list.genuinely-objective"] =
  "<li>\n              <strong>Sign objectivity is robust.</strong> Even when shadow\n              prices $p_k$ are uncertain, the <em>direction</em> of $\\Delta W_{\\text{ext}}$\n              is often unambiguous: a polluting subsidised monopoly reduces\n              nearly every $K_k$ for outsiders at once.\n            </li>\n            <li>\n              <strong>It does not require value judgements about\n              lifestyles.</strong> It only checks the accounting.\n            </li>\n            <li>\n              <strong>It is partially measurable.</strong> The\n              <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\">World Bank's Changing Wealth of Nations</a>\n              covers ~150 countries with produced, human, natural, and\n              net-foreign-asset capital and finds that many resource-dependent\n              economies have shrinking per-capita wealth even while their\n              GDP per capita rises &mdash; the exact gap GDP-only accounting\n              hides. The\n              <a href=\"https://wedocs.unep.org/handle/20.500.11822/43131\" target=\"_blank\" rel=\"noopener\">UN Inclusive Wealth Report 2023</a>\n              covers 163 countries. The\n              <a href=\"https://data.worldbank.org/indicator/NY.ADJ.SVNG.GN.ZS\" target=\"_blank\" rel=\"noopener\">Adjusted Net Savings</a>\n              series provides the annual flow counterpart for ~140 countries.\n            </li>";
fr["list.genuinely-objective"] =
  "<li>\n              <strong>L'objectivité du signe est robuste.</strong> Même quand les prix\n              d'ombre $p_k$ sont incertains, la <em>direction</em> de $\\Delta W_{\\text{ext}}$\n              est souvent non ambiguë : un monopole polluant subventionné réduit\n              presque chaque $K_k$ pour les outsiders à la fois.\n            </li>\n            <li>\n              <strong>Il ne nécessite pas de jugements de valeur sur\n              les modes de vie.</strong> Il vérifie seulement la comptabilité.\n            </li>\n            <li>\n              <strong>Il est partiellement mesurable.</strong> Le\n              <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\">Changing Wealth of Nations de la Banque mondiale</a>\n              couvre ~150 pays avec le capital produit, humain, naturel et\n              les actifs étrangers nets et constate que de nombreuses économies dépendantes\n              des ressources ont une richesse par habitant déclinante même si leur\n              PIB par habitant augmente &mdash; l'écart exact que la comptabilité uniquement PIB\n              masque. Le\n              <a href=\"https://wedocs.unep.org/handle/20.500.11822/43131\" target=\"_blank\" rel=\"noopener\">Rapport sur la richesse inclusive 2023 de l'ONU</a>\n              couvre 163 pays. La série\n              <a href=\"https://data.worldbank.org/indicator/NY.ADJ.SVNG.GN.ZS\" target=\"_blank\" rel=\"noopener\">Épargne nette ajustée</a>\n              fournit le flux annuel correspondant pour ~140 pays.\n            </li>";

en["list.objectivity-leaks"] =
  "<li>\n              Shadow prices for institutional and natural capital are\n              estimated, not observed. Existing accounts cover produced, human,\n              and natural capital well; <strong>institutional capital is not\n              yet integrated</strong> into any official wealth account.\n            </li>\n            <li>\n              <strong>Shadow prices are partly endogenous to the policy under\n              evaluation.</strong> $p_k$ depends on the policy environment\n              &mdash; a carbon tax changes the shadow price of\n              $K_{\\text{natural}}$, which is the very price you'd want to use\n              to score the carbon tax. Honest practice picks a baseline\n              (no-policy or counterfactual-status-quo prices), reports a range,\n              and relies on sign-robustness rather than precise magnitudes.\n              See Dasgupta &amp; M&auml;ler\n              (<a href=\"https://doi.org/10.1017/S1355770X00000061\" target=\"_blank\" rel=\"noopener\">2000</a>)\n              for the formal treatment.\n            </li>\n            <li>\n              The discount rate $\\rho$ involves an ethical choice\n              (<a href=\"https://www.aeaweb.org/articles?id=10.1257/aer.98.2.1\" target=\"_blank\" rel=\"noopener\">Stern 2008</a> vs.\n              <a href=\"https://www.aeaweb.org/articles?id=10.1257/jel.45.3.686\" target=\"_blank\" rel=\"noopener\">Nordhaus 2007</a>).\n            </li>\n            <li>\n              The boundary between internal and external parties requires a\n              convention for contested cases (future generations, ecosystems,\n              diffuse publics).\n            </li>\n            <li>\n              <strong>The criterion is silent on distribution within the\n              internal set.</strong> Two policies with identical $\\Delta W_{\\text{ext}}$\n              can have very different fairness profiles among participants, and\n              the test will rank them as equivalent. That second question needs\n              a different tool.\n            </li>";
fr["list.objectivity-leaks"] =
  "<li>\n              Les prix d'ombre pour le capital institutionnel et naturel sont\n              estimés, pas observés. Les comptes existants couvrent bien le capital produit, humain\n              et naturel ; <strong>le capital institutionnel n'est pas\n              encore intégré</strong> dans aucun compte de richesse officiel.\n            </li>\n            <li>\n              <strong>Les prix d'ombre sont partiellement endogènes à la politique\n              évaluée.</strong> $p_k$ dépend de l'environnement politique\n              &mdash; une taxe carbone change le prix d'ombre de\n              $K_{\\text{naturel}}$, qui est précisément le prix qu'on voudrait utiliser\n              pour évaluer la taxe carbone. La pratique honnête choisit une référence\n              (prix sans politique ou du statu quo contrefactuel), rapporte une plage,\n              et s'appuie sur la robustesse du signe plutôt que sur des magnitudes précises.\n              Voir Dasgupta &amp; M&auml;ler\n              (<a href=\"https://doi.org/10.1017/S1355770X00000061\" target=\"_blank\" rel=\"noopener\">2000</a>)\n              pour le traitement formel.\n            </li>\n            <li>\n              Le taux d'actualisation $\\rho$ implique un choix éthique\n              (<a href=\"https://www.aeaweb.org/articles?id=10.1257/aer.98.2.1\" target=\"_blank\" rel=\"noopener\">Stern 2008</a> vs.\n              <a href=\"https://www.aeaweb.org/articles?id=10.1257/jel.45.3.686\" target=\"_blank\" rel=\"noopener\">Nordhaus 2007</a>).\n            </li>\n            <li>\n              La frontière entre les parties internes et externes nécessite une\n              convention pour les cas contestés (générations futures, écosystèmes,\n              publics diffus).\n            </li>\n            <li>\n              <strong>Le critère est muet sur la distribution au sein de\n              l'ensemble interne.</strong> Deux politiques avec $\\Delta W_{\\text{ext}}$ identique\n              peuvent avoir des profils d'équité très différents parmi les participants,\n              et le test les classera comme équivalentes. Cette deuxième question\n              nécessite un outil différent.\n            </li>";

en["prose.objectivity-leaks-conclusion-p"] =
  "But these are <em>calibration</em> disputes, not <em>criterion</em>\n            disputes. Two honest analysts using inclusive wealth can disagree\n            on magnitudes substantially &mdash; the Stern&ndash;Nordhaus split\n            on the social cost of carbon spans roughly an order of magnitude\n            &mdash; but they will agree on the <em>sign</em> of $\\Delta W_{\\text{ext}}$ for\n            most cases, which is what the brake test actually requires. Two\n            analysts using \"what's good for society\" can disagree by infinity\n            and on the sign too.";
fr["prose.objectivity-leaks-conclusion-p"] =
  "Mais ce sont des disputes de <em>calibration</em>, pas de <em>critère</em>.\n            Deux analystes honnêtes utilisant la richesse inclusive peuvent être en désaccord\n            sur les magnitudes de manière substantielle &mdash; le fossé Stern&ndash;Nordhaus\n            sur le coût social du carbone couvre environ un ordre de magnitude\n            &mdash; mais ils seront d'accord sur le <em>signe</em> de $\\Delta W_{\\text{ext}}$ pour\n            la plupart des cas, ce qui est ce que le test de frein requiert réellement. Deux\n            analystes utilisant « ce qui est bon pour la société » peuvent être en désaccord à l'infini\n            et sur le signe aussi.";

en["prose.policy-rule-quote-p"] =
  "Government spending should be aimed at activities where\n            $\\sum_k p_k \\Delta K_k < 0$ <span class=\"math-note\">(weighted capital shrinks)</span> for external parties &mdash;\n            activities that shrink the inclusive capital base of outsiders &mdash; and\n            withdrawn from activities where it is positive.\n            <br /><strong>Don't tax production; tax depletion.</strong>";
fr["prose.policy-rule-quote-p"] =
  "Les dépenses publiques devraient être ciblées sur les activités où\n            $\\sum_k p_k \\Delta K_k < 0$ <span class=\"math-note\">(le capital pondéré diminue)</span> pour les parties externes &mdash;\n            les activités qui réduisent la base de capital inclusive des outsiders &mdash; et\n            retirées des activités où il est positif.\n            <br /><strong>Ne pas taxer la production ; taxer l'épuisement.</strong>";

en["list.what-falsifies"] =
  "<li>\n              If countries with depletion-style tax bases (Norway's sovereign\n              fund, Chilean copper royalties, Singaporean land-value capture,\n              British Columbia's carbon tax) systematically showed <em>worse</em>\n              long-run inclusive-wealth growth than peers that tax labour and\n              capital, the criterion fails.\n            </li>\n            <li>\n              If shadow-price uncertainty turned out to flip the <em>sign</em>\n              of $\\Delta W_{\\text{ext}}$ <span class=\"math-note\">(change in external wealth)</span> (not just its magnitude) for most policy-relevant\n              activities, the criterion would lose its claim to sign objectivity.\n            </li>";
fr["list.what-falsifies"] =
  "<li>\n              Si les pays avec des bases fiscales de type épuisement (le fonds souverain\n              de Norvège, les redevances sur le cuivre chilien, la capture de la valeur foncière\n              singapourienne, la taxe carbone de la Colombie-Britannique) montraient systématiquement\n              une croissance de richesse inclusive à long terme <em>pire</em> que les pairs qui taxent\n              le travail et le capital, le critère échoue.\n            </li>\n            <li>\n              Si l'incertitude des prix d'ombre s'avérait inverser le <em>signe</em>\n              de $\\Delta W_{\\text{ext}}$ <span class=\"math-note\">(variation de la richesse externe)</span> (pas seulement sa magnitude) pour la plupart des\n              activités pertinentes pour les politiques, le critère perdrait sa revendication\n              à l'objectivité du signe.\n            </li>";

// ── Save both files ──────────────────────────────────────────────────────────

save(enPath, en);
console.log(`✔ Updated ${Object.keys(en).length} keys in armey-curve.en.json`);

save(frPath, fr);
console.log(`✔ Updated ${Object.keys(fr).length} keys in armey-curve.fr.json`);

console.log("\nDone. To rebuild the French HTML:\n  node scripts/build-locale.mjs fr");
