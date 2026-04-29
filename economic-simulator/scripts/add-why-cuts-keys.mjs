#!/usr/bin/env node
// scripts/add-why-cuts-keys.mjs
// Adds prose.why-cuts-are-hard-body and prose.cut-gains-note to locale JSONs.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");

const html = readFileSync(resolve(root, "armey-curve.html"), "utf8");
const en = JSON.parse(readFileSync(resolve(root, "armey-curve.en.json"), "utf8"));
const fr = JSON.parse(readFileSync(resolve(root, "armey-curve.fr.json"), "utf8"));

// ── Extract prose.why-cuts-are-hard-body from HTML ───────────────────────────
const key1 = "prose.why-cuts-are-hard-body";
const marker1s = `<!-- i18n:${key1}:start -->`;
const marker1e = `<!-- /i18n:${key1}:end -->`;
const s1 = html.indexOf(marker1s);
const e1 = html.indexOf(marker1e);
if (s1 === -1 || e1 === -1) { console.error(`Missing markers for ${key1}`); process.exit(1); }
const enVal1 = html.slice(s1 + marker1s.length + 1, e1).trimEnd();

const frVal1 = `          <p>
            Si un gouvernement plus petit signifie une croissance plus rapide, pourquoi les
            pays à dépenses élevées ne réduisent-ils pas simplement leurs dépenses pour
            atteindre la prospérité ? La courbe en loi de puissance elle-même fournit la
            réponse la plus sous-estimée : <strong>le gain marginal de la réduction est infime
            quand on se trouve déjà sur la partie plate de la courbe.</strong>
          </p>
          <p>
            Les mathématiques sont précises. Pour le modèle en loi de puissance
            $g = \\beta_0 \\cdot s^{-\\alpha}$ <span class="math-note">(croissance = échelle&nbsp;×&nbsp;dépenses<sup>−exposant</sup>)</span>,
            le gain marginal de croissance obtenu en réduisant les dépenses d'un petit montant
            $\\Delta s$ <span class="math-note">(une petite variation des dépenses)</span> au
            niveau $s$ est :
          </p>
          <p style="text-align:center; font-style:italic; margin:12px 0;">
            $\\Delta g \\approx \\alpha \\cdot \\beta_0 \\cdot s^{-(\\alpha+1)} \\cdot \\Delta s$
          </p>
          <p class="iwc-gloss" style="margin-top:-6px">
            <strong>En clair :</strong> la hausse de croissance obtenue par une réduction des
            dépenses est égale à l'exposant ($\\alpha$) multiplié par l'échelle de base
            ($\\beta_0$) multiplié par la platitude de la courbe à ce niveau de dépenses
            ($s^{-(\\alpha+1)}$) multiplié par l'ampleur de la réduction ($\\Delta s$). À des
            dépenses élevées, le terme $s^{-(\\alpha+1)}$ est minuscule, donc le gain est
            minuscule.
          </p>
          <p>
            Le rapport de ce gain pour un pays à dépenses faibles ($s_1 = 20\\%$) par rapport
            à un pays à dépenses élevées ($s_2 = 50\\%$) est :
          </p>
          <p style="text-align:center; font-style:italic; margin:12px 0;">
            $\\frac{\\Delta g(s_1)}{\\Delta g(s_2)} = \\left(\\frac{s_2}{s_1}\\right)^{\\alpha+1} = \\left(\\frac{50}{20}\\right)^{\\alpha+1}$
          </p>
          <p class="iwc-gloss" style="margin-top:-6px">
            <strong>En clair :</strong> le rapport indiquant dans quelle mesure une réduction
            aide à 20 % de dépenses par rapport à 50 % est égal à $(50/20)$ élevé à la
            puissance de $(\\alpha+1)$. Avec $\\alpha \\approx 0,45$, cela donne
            $2,5^{1,45} \\approx 3,5$ &mdash; ce qui signifie que la même réduction vaut
            environ 3,5&times; plus si vous partez d'un gouvernement plus restreint.
          </p>
          <p>
            À 20 % du PIB, la courbe est pentue. Réduire de 20 % à 15 % produit un saut
            significatif de la croissance prédite. À 50 % du PIB, la courbe s'est
            considérablement aplatie. Réduire de 50 % à 45 % produit une amélioration à
            peine perceptible. Avec l'exposant ajusté empiriquement α ≈ 0,447, la même
            réduction de cinq points de pourcentage produit environ
            <strong>3,5× moins de dividende de croissance</strong> si l'on part de 50 % que
            de 20 % — et le ratio s'accroît avec l'écart de dépenses. Si α était plus proche
            de 1,5 (la valeur par défaut du simulateur), ce multiplicateur atteindrait ~10×.
            Dans tous les cas, la logique directionnelle est la même : plus la courbe est
            plate, plus il est difficile de rendre la réforme politiquement visible.
          </p>
          <p>
            Cette asymétrie crée un piège politique. Les coûts des réductions sont immédiats
            et concentrés — emplois perdus dans le secteur public, bénéficiaires des
            prestations mobilisés, entreprises sous contrat qui font du lobbying pour leur
            réintégration. Les bénéfices en termes de croissance sont diffus, différés et,
            surtout, <em>trop faibles pour être statistiquement visibles</em> au cours des
            premières années de données. Un gouvernement qui réduit de 5 points de PIB à
            partir d'une base de 50 % ne peut pas crédiblement promettre à sa population un
            boom visible ; la loi de puissance indique qu'il obtiendra peut-être 0,2–0,3
            point de pourcentage supplémentaire de croissance annuelle. C'est une richesse
            réelle composée sur des décennies, mais ce n'est pas un titre de presse.
          </p>
          <p>
            Contrastez cela avec l'expérience de l'Irlande dans les années 1980–90 ou de la
            Suède au début des années 1990 : les deux ont réduit à partir de bases élevées,
            mais leurs reprises ont été amplifiées par d'autres vents favorables (accès au
            marché unique européen, dévaluation monétaire, rattrapage rapide après de
            profondes récessions) qui ont rendu le gain de croissance visible et important.
            La contribution de la loi de puissance était réelle, mais elle était combinée à
            d'autres forces. Sans ces vents favorables, un pays réduisant de 55 % à 50 %
            dans une économie mature et stable verra un dividende de réforme que la courbe
            prédit comme étant quasi invisible sur un mandat parlementaire.
          </p>
          <p>
            Il y a aussi un <strong>effet de cliquet</strong> : les programmes de dépenses
            créent des groupes de pression. Chaque point de pourcentage du PIB dépensé
            construit un groupe de bénéficiaires qui résisteront au retour en arrière plus
            farouchement que le contribuable diffus ne le récompensera. L'équilibre politique
            dérive vers la droite sur la courbe — vers des dépenses plus élevées, une
            croissance plus faible et des rendements marginaux toujours plus faibles à la
            réduction — jusqu'à ce qu'une crise fiscale force un ajustement discontinu. La
            loi de puissance explique non seulement le coût économique d'un grand État, mais
            l'économie politique expliquant pourquoi les grands États tendent à rester grands.
          </p>`;

// ── prose.cut-gains-note ─────────────────────────────────────────────────────
const key2 = "prose.cut-gains-note";
const enVal2 = `Uses current model parameters and the currently displayed country data. Gain = <em>predicted growth at (spending − 5 pp)</em> minus <em>predicted growth at current spending</em>. Load country data and press ⚙ Auto-fit to update.`;
const frVal2 = `Utilise les paramètres du modèle actuel et les données pays actuellement affichées. Gain = <em>croissance prédite à (dépenses − 5 pp)</em> moins <em>croissance prédite aux dépenses actuelles</em>. Chargez les données pays et appuyez sur ⚙ Ajustement auto pour mettre à jour.`;

let added = 0;
for (const [key, enV, frV] of [[key1, enVal1, frVal1], [key2, enVal2, frVal2]]) {
  if (!(key in en)) { en[key] = enV; added++; console.log(`✓ Added en: ${key}`); }
  if (!(key in fr)) { fr[key] = frV; added++; console.log(`✓ Added fr: ${key}`); }
}

writeFileSync(resolve(root, "armey-curve.en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
writeFileSync(resolve(root, "armey-curve.fr.json"), JSON.stringify(fr, null, 2) + "\n", "utf8");
console.log(`Done. Added ${added} key-locale pairs.`);
