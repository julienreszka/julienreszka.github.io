// One-time script: adds prose.theory-misled to en.json and fr.json
// Run with: node scripts/add-theory-misled-prose.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const EN_VALUE = `<h3 data-i18n="heading.theory-misled-policymakers">How the Theory Misled Policymakers</h3>
          <p>
            The Armey Curve theory emerged in the 1980s from observations that
            both very small governments (lacking basic institutions) and very
            large governments (socialist economies) had slower growth than
            moderate-sized governments. This seemed to suggest an optimal middle
            ground.
          </p>
          <p>
            <strong>But this analysis was flawed.</strong> Countries with \u201cvery
            small governments\u201d were often failed states or developing nations
            with poor institutions, while \u201cvery large governments\u201d were
            communist dictatorships. The comparison wasn\u2019t between different
            sizes of functional government - it was between functional and
            dysfunctional states.
          </p>
          <p>
            <strong>When you compare functional governments of different sizes,</strong>
            the pattern is clear: smaller government = higher growth. Singapore,
            Switzerland, and Estonia consistently outperform France, Germany,
            and Sweden on growth despite having much smaller governments.
          </p>
          <p>
            The theory gave academic cover to politicians who wanted to justify
            expanding government by claiming they were finding the \u201coptimal\u201d
            size. In reality, they were just reducing economic growth.
          </p>

          <h3 data-i18n="heading.quadratic-nonsensical">Why the Quadratic Model Produces Nonsensical Results</h3>
          <p>
            <strong>The quadratic Armey curve is fundamentally broken</strong>
            because it predicts impossible negative growth rates at high
            government spending levels. This mathematical artifact reveals why
            the traditional theory is wrong - real economies don\u2019t experience
            negative 5\u201310% GDP growth just because government spends 50\u201360% of
            GDP.
          </p>
          <p>
            <strong>What actually happens in high-spending countries:</strong>
            European countries with 35\u201345% government spending don\u2019t collapse
            into economic oblivion. They stagnate at low positive growth rates
            (0.5\u20131.5%), which is exactly what the power law and inverse models
            predict.
          </p>
          <p>
            <strong>The math exposes the flaw:</strong> When you fit a quadratic
            curve (y = ax\u00b2 + bx + c) to real data, it eventually curves downward
            so sharply that it predicts economic apocalypse. But Sweden at 35%
            spending doesn\u2019t have \u22128% growth - it has +0.8% growth. The
            quadratic model fails basic reality checks.
          </p>
          <p>
            <strong>Worse: the unconstrained free fit is U-shaped, not inverted-U.</strong>
            When a quadratic is fitted to the data with no constraints \u2014 letting
            the sign of the curvature be determined by the data itself \u2014 the
            result is a <em>U-shaped</em> curve with a minimum at ~49% spending,
            not the inverted-U \u201csweet spot\u201d Armey theory predicts. The data
            finds growth declining all the way through the observed range, with
            the theoretical upturn occurring beyond 49% spending where almost
            no country in the sample exists. This is arguably more damning than
            a poor R\u00b2: the best quadratic the data can produce is the
            <em>opposite</em> of the Armey curve.
          </p>

          <h4 data-i18n="heading.linear-flawed">Linear Models Are Equally Flawed</h4>
          <p>
            <strong>The linear decline model suffers from the exact same mathematical impossibility.</strong>
            With a negative slope (which is required to show government spending
            reduces growth), the linear model inevitably predicts negative
            growth rates at high spending levels:
          </p>
          <ul>
            <li>
              <strong>Mathematical Inevitability:</strong> A linear model with
              negative slope (Growth = \u03b2\u2080 + slope \u00d7 spending) must eventually
              cross zero and go negative as spending increases
            </li>
            <li>
              <strong>Empirical Absurdity:</strong> The model would predict that
              France (35% spending) should have negative GDP growth every year,
              which clearly doesn\u2019t happen
            </li>
            <li>
              <strong>No Asymptotic Behavior:</strong> Unlike inverse or
              exponential models, linear models can\u2019t capture the reality that
              even heavily regulated economies maintain some positive growth
            </li>
            <li>
              <strong>Constant Marginal Damage:</strong> Linear models
              unrealistically assume that each additional percentage of
              government spending causes exactly the same damage regardless of
              existing spending levels
            </li>
          </ul>
          <p>
            <strong>Both quadratic and linear models fail the basic empirical test:</strong>
            they predict economic outcomes that simply don\u2019t exist in the real
            world. This leaves only the power law, inverse, and exponential
            models as mathematically viable alternatives to describe the
            government\u2013growth relationship.
          </p>
          <h4 data-i18n="heading.power-law-makes-sense">Why Power Law, Inverse, and Exponential Models Make Sense</h4>
          <ul>
            <li>
              <strong>Asymptotic Approach to Zero:</strong> Both models approach
              (but never reach) zero growth, which matches reality where even
              heavily regulated economies still limp along
            </li>
            <li>
              <strong>No Mathematical Artifacts:</strong> As shown above, these
              models avoid the impossible negative growth predictions that
              disqualify both quadratic and linear specifications
            </li>
            <li>
              <strong>Diminishing Returns Without Collapse:</strong> They show
              government spending becomes increasingly harmful without
              predicting economic Armageddon
            </li>
            <li>
              <strong>Empirical Fit:</strong> They actually match what we
              observe - stagnation, not collapse, in high-spending economies
            </li>
          </ul>

          <h4 data-i18n="heading.exponential-too-far">But Even Exponential Decay Goes Too Far</h4>
          <p>
            <strong>While exponential decay avoids the quadratic model\u2019s absurd
            negative growth predictions, it still doesn\u2019t fit the real-world
            data perfectly.</strong>
            The exponential model suggests that each additional percentage point
            of government spending causes accelerating damage to growth, but
            empirical evidence shows this is too aggressive:
          </p>
          <ul>
            <li>
              <strong>European Resilience:</strong> Countries like Germany (30%
              spending, 0.5% growth) and France (35% spending, 0.8% growth)
              maintain low but positive growth despite massive government
              sectors. Exponential decay would predict much sharper decline
            </li>
            <li>
              <strong>Nordic Stability:</strong> Denmark (35% spending) and
              Sweden (35% spending) have sustained their welfare states for
              decades with consistent low growth (0.4\u20130.8%), not the
              accelerating collapse exponential models predict
            </li>
            <li>
              <strong>Mathematical Overshooting:</strong> Exponential decay
              curves drop too steeply for high-spending economies,
              underestimating their ability to maintain basic economic function
              through institutional momentum
            </li>
            <li>
              <strong>Real-World Stagnation Pattern:</strong> What we actually
              observe is not accelerating decay but persistent low-growth
              stagnation - exactly what the power law and inverse models predict
            </li>
          </ul>

          <h4 data-i18n="heading.power-law-superior">Why the Power Law Model Is Empirically Superior</h4>
          <p>
            <strong>The power law model (Growth = \u03b2\u2080 \u00d7 s\u207b\u1d45) achieves the highest R\u00b2
              of any model tested, explaining ~42% of cross-country growth
              variation among comparable economies:</strong>
          </p>
          <ul>
            <li>
              <strong>Best Predictive Fit:</strong>
              With R\u00b2 = 0.42 (on the 113-country filtered sample \u2014 excluding
              resource-dependent, externally-funded, conflict-fragile, and
              GDP-distorted economies), the power law outperforms the inverse
              model (R\u00b2 = 0.42) and all other alternatives. On the full
              unfiltered sample the figure is ~0.24, but those excluded groups
              add noise unrelated to fiscal policy. To put this in perspective:
              cross-country growth depends on dozens of factors (demographics,
              institutions, geography, trade, technology, culture) yet
              government spending alone accounts for nearly half the variation
              among comparable economies \u2014 a signal-to-noise ratio that most
              macro variables can only dream of. The exponent \u03b1 lets the model
              calibrate the steepness of the spending-growth curve to real data
              rather than fixing it at \u03b1=1 like the inverse model
            </li>
            <li>
              <strong>Harmful from the First Dollar:</strong>
              Government spending consistently reduces GDP growth even at low
              levels \u2014 with diminishing marginal harm as spending rises,
              matching the power law\u2019s steep-then-flattening shape
            </li>
            <li>
              <strong>Realistic High-Spending Outcomes:</strong> Predicts that
              welfare states stagnate around 0.5\u20131.5% growth rather than
              collapsing, which matches Nordic and European performance
            </li>
            <li>
              <strong>Generalizes the Inverse Model:</strong> The inverse model
              is just a special case of power law with \u03b1=1. Auto-fitting reveals
              the optimal \u03b1 \u2248 1.5, meaning government spending is even more
              harmful at low levels than the simple 1/x curve implies
            </li>
            <li>
              <strong>Economic Intuition:</strong> Reflects how crowding-out
              works in practice - initial government spending displaces the most
              productive private investments, while later spending displaces
              progressively less efficient private alternatives. The tunable
              exponent captures exactly how steep this displacement is
            </li>
            <li>
              <strong>Institutional Inertia:</strong> Accounts for why
              high-spending countries don\u2019t collapse immediately - existing
              institutions, human capital, and economic structures provide some
              resilience even under heavy government burden
            </li>
          </ul>

          <p>
            <strong>This isn\u2019t a minor technical issue \u2014 it is strong evidence that the
              theoretical framework is misspecified.</strong>
            When an economic model predicts France should be experiencing
            Great Depression-level contractions year after year, the more
            plausible conclusion is that the model\u2019s functional form is wrong,
            not that France\u2019s economy is. The power law model avoids this
            failure while still consistently showing a negative
            spending\u2013growth relationship.
          </p>`;

const FR_VALUE = `<h3>Comment la théorie a égaré les décideurs</h3>
          <p>
            La théorie de la courbe d'Armey est apparue dans les années 1980 à partir
            d'observations selon lesquelles les gouvernements très petits (manquant
            d'institutions de base) et très grands (économies socialistes) connaissaient
            une croissance plus lente que les gouvernements de taille modérée. Cela semblait
            suggérer un juste milieu optimal.
          </p>
          <p>
            <strong>Mais cette analyse était erronée.</strong> Les pays à « très petit
            gouvernement » étaient souvent des États défaillants ou des nations en
            développement aux institutions insuffisantes, tandis que les « très grands
            gouvernements » étaient des dictatures communistes. La comparaison ne portait pas
            sur des gouvernements fonctionnels de tailles différentes — elle opposait des États
            fonctionnels à des États dysfonctionnels.
          </p>
          <p>
            <strong>Quand on compare des gouvernements fonctionnels de tailles différentes,</strong>
            le schéma est clair : gouvernement plus petit = croissance plus élevée. Singapour,
            la Suisse et l'Estonie surpassent systématiquement la France, l'Allemagne et la
            Suède en termes de croissance, malgré des gouvernements bien plus petits.
          </p>
          <p>
            La théorie a fourni une couverture académique aux politiciens qui voulaient
            justifier l'expansion de l'État en prétendant trouver la taille « optimale ».
            En réalité, ils ne faisaient que réduire la croissance économique.
          </p>

          <h3>Pourquoi le modèle quadratique produit des résultats absurdes</h3>
          <p>
            <strong>La courbe d'Armey quadratique est fondamentalement défaillante</strong>
            car elle prédit des taux de croissance négatifs impossibles pour des niveaux
            élevés de dépenses publiques. Cet artefact mathématique révèle pourquoi la
            théorie traditionnelle est erronée — les économies réelles ne connaissent pas
            une contraction de 5 à 10 % du PIB simplement parce que l'État dépense 50 à 60 %
            du PIB.
          </p>
          <p>
            <strong>Ce qui se passe réellement dans les pays à fortes dépenses :</strong>
            Les pays européens dont les dépenses publiques représentent 35 à 45 % ne
            s'effondrent pas dans le néant économique. Ils stagnent à de faibles taux de
            croissance positifs (0,5 à 1,5 %), ce qui est exactement ce que prédisent les
            modèles en loi de puissance et inverse.
          </p>
          <p>
            <strong>Les mathématiques exposent le défaut :</strong> Quand on ajuste une courbe
            quadratique (y = ax² + bx + c) à des données réelles, elle finit par s'incurver
            si fortement vers le bas qu'elle prédit l'apocalypse économique. Mais la Suède
            à 35 % de dépenses n'a pas −8 % de croissance — elle a +0,8 %. Le modèle
            quadratique échoue aux vérifications de base de la réalité.
          </p>
          <p>
            <strong>Pire : l'ajustement libre non contraint est en forme de U, pas de U inversé.</strong>
            Quand on ajuste une quadratique aux données sans contraintes — en laissant le
            signe de la courbure être déterminé par les données elles-mêmes — le résultat
            est une courbe en <em>U</em> avec un minimum à ~49 % de dépenses, et non le
            « point idéal » en U inversé prédit par la théorie d'Armey. Les données montrent
            que la croissance décline tout au long de la plage observée, le rebond théorique
            n'intervenant qu'au-delà de 49 % de dépenses — là où presque aucun pays de
            l'échantillon n'existe. C'est sans doute plus accablant qu'un mauvais R² : la
            meilleure quadratique que les données peuvent produire est l'<em>opposé</em> de
            la courbe d'Armey.
          </p>

          <h4>Les modèles linéaires sont tout aussi défaillants</h4>
          <p>
            <strong>Le modèle de déclin linéaire souffre exactement de la même impossibilité mathématique.</strong>
            Avec une pente négative (nécessaire pour montrer que les dépenses publiques
            réduisent la croissance), le modèle linéaire prédit inévitablement des taux de
            croissance négatifs à des niveaux de dépenses élevés :
          </p>
          <ul>
            <li>
              <strong>Inévitabilité mathématique :</strong> Un modèle linéaire à pente
              négative (Croissance = β₀ + pente × dépenses) doit finalement franchir zéro et
              devenir négatif à mesure que les dépenses augmentent
            </li>
            <li>
              <strong>Absurdité empirique :</strong> Le modèle prédirait que la France
              (35 % de dépenses) devrait avoir une croissance du PIB négative chaque année,
              ce qui ne se produit manifestement pas
            </li>
            <li>
              <strong>Absence de comportement asymptotique :</strong> Contrairement aux
              modèles inverse ou exponentiel, les modèles linéaires ne peuvent pas rendre
              compte de la réalité selon laquelle même les économies très réglementées
              maintiennent une certaine croissance positive
            </li>
            <li>
              <strong>Préjudice marginal constant :</strong> Les modèles linéaires supposent
              de façon irréaliste que chaque pourcentage supplémentaire de dépenses publiques
              cause exactement le même préjudice, quel que soit le niveau de dépenses existant
            </li>
          </ul>
          <p>
            <strong>Les modèles quadratique et linéaire échouent tous deux au test empirique de base :</strong>
            ils prédisent des résultats économiques qui n'existent tout simplement pas dans
            le monde réel. Il ne reste donc que les modèles en loi de puissance, inverse et
            exponentiel comme alternatives mathématiquement viables pour décrire la relation
            État–croissance.
          </p>
          <h4>Pourquoi les modèles en loi de puissance, inverse et exponentiel sont pertinents</h4>
          <ul>
            <li>
              <strong>Approche asymptotique de zéro :</strong> Ces modèles s'approchent
              (sans jamais l'atteindre) d'une croissance nulle, ce qui correspond à la
              réalité où même les économies très réglementées continuent de progresser
              légèrement
            </li>
            <li>
              <strong>Absence d'artefacts mathématiques :</strong> Comme indiqué
              ci-dessus, ces modèles évitent les prédictions de croissance négative
              impossibles qui disqualifient les spécifications quadratique et linéaire
            </li>
            <li>
              <strong>Rendements décroissants sans effondrement :</strong> Ils montrent
              que les dépenses publiques deviennent de plus en plus néfastes sans prédire
              l'Armageddon économique
            </li>
            <li>
              <strong>Adéquation empirique :</strong> Ils correspondent réellement à ce
              que nous observons — la stagnation, et non l'effondrement, dans les économies
              à fortes dépenses
            </li>
          </ul>

          <h4>Mais même la décroissance exponentielle va trop loin</h4>
          <p>
            <strong>Si la décroissance exponentielle évite les prédictions absurdes de
            croissance négative du modèle quadratique, elle ne s'adapte toujours pas
            parfaitement aux données réelles.</strong>
            Le modèle exponentiel suggère que chaque point de pourcentage supplémentaire
            de dépenses publiques cause un préjudice croissant à la croissance, mais les
            preuves empiriques montrent que c'est trop agressif :
          </p>
          <ul>
            <li>
              <strong>Résilience européenne :</strong> Des pays comme l'Allemagne (30 % de
              dépenses, 0,5 % de croissance) et la France (35 % de dépenses, 0,8 % de
              croissance) maintiennent une croissance faible mais positive malgré des
              secteurs publics massifs. La décroissance exponentielle prédirait un déclin
              bien plus prononcé
            </li>
            <li>
              <strong>Stabilité nordique :</strong> Le Danemark (35 % de dépenses) et la
              Suède (35 % de dépenses) ont maintenu leurs États-providence pendant des
              décennies avec une croissance constamment faible (0,4–0,8 %), et non
              l'effondrement accéléré que prédisent les modèles exponentiels
            </li>
            <li>
              <strong>Dépassement mathématique :</strong> Les courbes de décroissance
              exponentielle chutent trop fortement pour les économies à fortes dépenses,
              sous-estimant leur capacité à maintenir une fonction économique de base grâce
              à l'inertie institutionnelle
            </li>
            <li>
              <strong>Schéma réel de stagnation :</strong> Ce que nous observons réellement
              n'est pas une décroissance accélérée mais une stagnation persistante à faible
              croissance — exactement ce que prédisent les modèles en loi de puissance et
              inverse
            </li>
          </ul>

          <h4>Pourquoi le modèle en loi de puissance est empiriquement supérieur</h4>
          <p>
            <strong>Le modèle en loi de puissance (Croissance = β₀ × s⁻ᵅ) atteint le
              R² le plus élevé de tous les modèles testés, expliquant ~42 % de la
              variation de croissance entre pays comparables :</strong>
          </p>
          <ul>
            <li>
              <strong>Meilleure adéquation prédictive :</strong>
              Avec R² = 0,42 (sur l'échantillon filtré de 113 pays — excluant les économies
              dépendantes des ressources, à financement extérieur, en conflit ou dont le PIB
              est distordu), la loi de puissance surpasse le modèle inverse (R² = 0,42) et
              toutes les autres alternatives. Sur l'échantillon complet non filtré, le chiffre
              est ~0,24, mais ces groupes exclus ajoutent du bruit sans lien avec la politique
              budgétaire. Pour mettre cela en perspective : la croissance d'un pays dépend de
              dizaines de facteurs (démographie, institutions, géographie, commerce,
              technologie, culture) et pourtant les dépenses publiques à elles seules
              expliquent près de la moitié de la variation entre économies comparables — un
              rapport signal/bruit que la plupart des variables macro ne peuvent qu'envier.
              L'exposant α permet au modèle de calibrer la pente de la courbe
              dépenses–croissance sur des données réelles plutôt que de la fixer à α=1
              comme le modèle inverse
            </li>
            <li>
              <strong>Néfaste dès le premier euro :</strong>
              Les dépenses publiques réduisent systématiquement la croissance du PIB même à
              de faibles niveaux — avec un préjudice marginal décroissant à mesure que les
              dépenses augmentent, correspondant à la forme raide-puis-aplanie de la loi de
              puissance
            </li>
            <li>
              <strong>Résultats réalistes pour les pays à fortes dépenses :</strong> Prédit
              que les États-providence stagnent autour de 0,5–1,5 % de croissance plutôt que
              de s'effondrer, ce qui correspond aux performances nordiques et européennes
            </li>
            <li>
              <strong>Généralise le modèle inverse :</strong> Le modèle inverse n'est qu'un
              cas particulier de la loi de puissance avec α=1. L'ajustement automatique
              révèle l'exposant optimal α ≈ 1,5, ce qui signifie que les dépenses publiques
              sont encore plus néfastes à de faibles niveaux que ce que la simple courbe
              1/x implique
            </li>
            <li>
              <strong>Intuition économique :</strong> Reflète comment l'éviction fonctionne
              en pratique — les dépenses publiques initiales déplacent les investissements
              privés les plus productifs, tandis que les dépenses ultérieures déplacent des
              alternatives privées progressivement moins efficaces. L'exposant réglable
              capture précisément la pente de ce déplacement
            </li>
            <li>
              <strong>Inertie institutionnelle :</strong> Explique pourquoi les pays à
              fortes dépenses ne s'effondrent pas immédiatement — les institutions existantes,
              le capital humain et les structures économiques offrent une certaine résilience
              même sous une lourde charge étatique
            </li>
          </ul>

          <p>
            <strong>Ce n'est pas une question technique mineure — c'est une preuve solide
              que le cadre théorique est mal spécifié.</strong>
            Quand un modèle économique prédit que la France devrait connaître des contractions
            de type Grande Dépression année après année, la conclusion la plus plausible est
            que la forme fonctionnelle du modèle est erronée, pas que l'économie française
            l'est. Le modèle en loi de puissance évite cet échec tout en montrant
            systématiquement une relation négative entre dépenses et croissance.
          </p>`;

// Inject into both JSON files
for (const [lang, value] of [['en', EN_VALUE], ['fr', FR_VALUE]]) {
  const path = join(root, `armey-curve.${lang}.json`);
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  if (obj['prose.theory-misled']) {
    console.log(`${lang}.json already has prose.theory-misled — skipping`);
    continue;
  }
  obj['prose.theory-misled'] = value;
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`Added prose.theory-misled to ${lang}.json`);
}
