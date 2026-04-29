#!/usr/bin/env node
// scripts/add-selective-brake-keys.mjs
// Adds locale values for selective-brake-body, selective-brake-quote,
// iwc-section-intro, and iwc-formula-body blocks.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const html = readFileSync(resolve(root, "armey-curve.html"), "utf8");
const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

function extractBlock(key) {
  const s = `<!-- i18n:${key}:start -->`;
  const e = `<!-- /i18n:${key}:end -->`;
  const si = html.indexOf(s);
  const ei = html.indexOf(e);
  if (si === -1 || ei === -1) { console.error(`Missing markers for ${key}`); return null; }
  return html.slice(si + s.length + 1, ei).trimEnd();
}

const keys = {
  "prose.selective-brake-body": {
    en: extractBlock("prose.selective-brake-body"),
    fr: `          <p>
            Les données de ce simulateur montrent que les dépenses publiques
            ralentissent systématiquement l'activité économique. La réponse
            conventionnelle est de les minimiser. Mais il y a une implication plus
            précise : <strong>si le gouvernement est un frein, utilisez-le sur les
            parties de l'économie que vous voulez ralentir.</strong>
          </p>
          <p>
            L'objection immédiate est que ce n'est pas ce qui se passe réellement.
            La plupart des dépenses publiques ne sont pas un instrument ciblé visant
            la pollution ou le risque systémique — ce sont de larges salaires,
            transferts, subventions et marchés publics qui ralentissent toute
            l'économie à la fois. Une taxe carbone qui augmente le coût des émissions
            est un frein appliqué à une activité spécifique. Un ministère qui accroît
            ses effectifs, un système de retraite qui élargit son éligibilité, une
            règle de marchés publics qui réserve les contrats aux titulaires —
            ceux-ci appliquent la même force de freinage aux activités productives et
            non productives. Les données agrégées reflètent cette réalité : les pays
            avec de grands gouvernements ne gèrent pas principalement de grands
            programmes de correction des externalités. Ils gèrent de grands programmes
            de redistribution et d'emploi public, et le frein à la croissance reflète
            cette portée indiscriminée.
            <strong>Le frein sélectif est une possibilité théorique que
            l'expansion fiscale réelle atteint rarement.</strong>
          </p>
          <p>
            De nombreuses activités économiques nocives sont rapides précisément
            parce que leurs coûts sont externalisés. Une usine se développe en
            déversant dans une rivière. Une flotte de pêche s'agrandit en épuisant
            une ressource commune. Une banque s'enrichit en assumant un risque
            systémique que d'autres absorbent. Ces activités ne se développent pas
            parce qu'elles sont productives — elles se développent parce que les
            personnes qui les dirigent ne supportent pas l'intégralité des coûts.
            Laissées à elles-mêmes, elles supplantent des alternatives plus propres
            et plus prudentes et dégradent la qualité globale de l'économie.
          </p>
          <p>
            C'est précisément là où la force de freinage du gouvernement appartient.
            Une règle de responsabilité qui oblige les pollueurs à payer, un quota
            qui limite la surpêche, une exigence de fonds propres qui oblige les
            banques à internaliser leurs propres risques — ces interventions
            ralentissent l'activité nocive sans nécessiter de grands budgets ou une
            large redistribution. Le gouvernement ne produit rien ; il corrige le
            signal de prix pour que le marché ralentisse les bonnes choses.
          </p>
          <p>
            Le corollaire est tout aussi important :
            <strong>le gouvernement ne devrait pas être utilisé pour ralentir
            l'activité productive.</strong>
            Les barrières à l'entrée dans les professions compétitives, les règles de
            marchés publics qui protègent les fournisseurs en place, les tarifs
            douaniers qui isolent les industries nationales de la concurrence — ceux-ci
            appliquent le frein là où il détruit plutôt que crée de la valeur. Les
            données capturent cet agrégat : les pays qui utilisent largement le
            gouvernement ralentissent toute leur économie. Les pays qui maintiennent
            un gouvernement limité préservent le moteur de croissance tout en étant
            capables, en principe, de cibler les véritables nuisances.
          </p>`,
  },
  "prose.selective-brake-quote": {
    en: `Government spending reliably slows economic activity &mdash; so\n              the right use of government is to aim that braking force at the\n              parts of the economy we want less of, not the parts that create\n              value.`,
    fr: `Les dépenses publiques ralentissent systématiquement l'activité économique &mdash; donc\n              la bonne utilisation du gouvernement est de diriger cette force de freinage vers\n              les parties de l'économie dont nous voulons moins, pas celles qui créent\n              de la valeur.`,
  },
  "prose.iwc-section-intro": {
    en: extractBlock("prose.iwc-section-intro"),
    fr: `          <p class="iwc-gloss" style="margin-bottom: 18px;">
            <strong>Une note sur le simulateur ci-dessus.</strong> Le simulateur
            évalue les niveaux de dépenses selon leur adéquation à la
            <em>croissance du PIB</em>. Le critère développé ci-dessous soutient
            que le PIB est la mauvaise cible &mdash; il peut être gonflé par
            l'épuisement des ressources, les transferts et la coercition. Les deux
            répondent à des questions différentes : le simulateur demande
            <em>combien</em> de dépenses publiques maximisent la croissance
            mesurée ; le critère demande <em>où</em> ces dépenses devraient être
            dirigées et quelles activités privées méritent un frein. Les deux
            peuvent être corrects simultanément : la courbe empirique discipline
            la taille, le critère discipline la cible.
          </p>
          <p>
            Si le gouvernement doit freiner certaines activités et pas d'autres,
            nous avons besoin d'un moyen non arbitraire de décider lesquelles. « Ce
            que je n'aime pas » n'est pas un critère. « Ce qui échoue à un test
            coût&ndash;bénéfice » est plus proche, mais le
            coût&ndash;bénéfice basé sur le PIB peut être manipulé par les
            transferts, l'épuisement des ressources et la coercition &mdash; les
            pathologies mêmes qu'un frein devrait cibler. Nous avons besoin d'une
            métrique qui <em>ne peut pas</em> être gonflée par l'activité qu'elle
            est censée évaluer.
          </p>`,
  },
  "prose.iwc-formula-body": {
    en: extractBlock("prose.iwc-formula-body"),
    fr: `          <p>
            Trois des quatre quadrants indiquent au gouvernement de ne rien faire.
            Seul le coin inférieur droit justifie un frein. C'est une licence
            beaucoup plus étroite que « ce que veut l'électeur médian » &mdash;
            et beaucoup plus large que « le gouvernement ne devrait jamais agir ».
            Le reste de cette section définit $\\Delta W$ précisément, rend
            &quot;le consentement&quot; non trivial, et ajoute une troisième
            question (Q3) que le 2&times;2 ne peut pas capturer : le frein
            lui-même est-il pire que le dommage ?
          </p>

          <h4 data-i18n="heading.formula-2x2">La formule derrière le 2&times;2</h4>
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
                <div class="iwc-ped-tag">externalités &amp; consentement</div>
              </div>
              <div class="iwc-ped-arrow">&rarr;</div>
              <div class="iwc-ped-node">
                <div class="iwc-ped-year">1962</div>
                <div class="iwc-ped-name">Buchanan &amp; Tullock</div>
                <div class="iwc-ped-tag">le consentement comme fondement politique</div>
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
            La formule de richesse par prix fictifs ci-dessous suit Weitzman ; le
            critère de frein filtré par le consentement est une synthèse originale &mdash;
            chaque ingrédient a une source publiée, mais la règle unifiée n'est pas
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
            <em>pour les parties qui n'ont pas consenti à en supporter le coût</em> :
          </p>
          <p class="iwc-eq">
            $$\\text{Brake}(a) \\iff \\mathbb{E}\\!\\left[\\sum_k p_k\\,\\Delta K_k^{(a)}\\right] < 0$$
          </p>
          <p class="iwc-eq-caption">(sur les parties qui n'ont pas consenti)</p>
          <p class="iwc-gloss">
            <strong>En clair :</strong> appliquez le frein à l'activité $a$
            <em>si et seulement si</em> (« $\\iff$ ») son effet <em>espéré</em>
            (« $\\mathbb{E}$ ») sur la richesse totale, sommé sur chaque type de
            capital, est négatif &mdash; en comptant uniquement les personnes qui
            n'ont pas accepté d'en supporter le coût. $\\Delta K_k^{(a)}$ signifie
            « la variation du capital de type $k$ causée par l'activité $a$ ».
          </p>`,
  },
};

let added = 0;
for (const [key, { en: enV, fr: frV }] of Object.entries(keys)) {
  if (enV === null) { console.error(`Skipping ${key}: extraction failed`); continue; }
  if (!(key in en)) { en[key] = enV; added++; console.log(`✓ Added en: ${key}`); }
  if (!(key in fr)) { fr[key] = frV; added++; console.log(`✓ Added fr: ${key}`); }
}

writeFileSync(resolve(root, "armey-curve.en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "armey-curve.fr.json"), JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log(`Done. Added ${added} key-locale pairs.`);
