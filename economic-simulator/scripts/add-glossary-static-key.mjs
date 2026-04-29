// Adds prose.ranking-glossary-static key to en.json and fr.json
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..');

const enDl = `<dl class="ranking-glossary">
            <dt>R\u00b2 (R-squared)</dt>
            <dd>
              Measures how well the curve explains the variation in growth rates
              across countries. A perfect fit = 1.0. A score of 0 means the
              model is no better than just predicting the average growth rate
              for every country.
              <strong
                >Negative values mean the model is worse than that
                baseline.</strong
              >
              When models are auto-fitted across 113 countries (resource-dependent, externally-funded, conflict/fragile, and GDP-distorted countries excluded), the top models reach R\u00b2\u00a0\u2248\u00a00.42 \u2014
              meaning government spending % explains roughly 42% of the
              variation in growth. Note that
              <strong
                >Power Law and Inverse are tied on combined R\u00b2 (0.4913); Power Law edges ahead on AIC (53.29 vs 53.82)</strong
              >
              \u2014 it fits the spending\u2013growth relationship well across diverse economies. Each exclusion category has a specific theoretical justification: resource-dependent economies grow via commodity windfalls unrelated to government size; externally-funded states have aid-distorted budgets; conflict/fragile states have suppressed growth from instability; GDP-distorted economies have artificially inflated or deflated GDP figures.
            </dd>
            <dt>AIC (Akaike Information Criterion)</dt>
            <dd>
              Ranks competing models by balancing how well they fit the data
              against how many parameters they use (simpler models are
              rewarded). <strong>Lower AIC = better model.</strong> Unlike R\u00b2,
              AIC is useful for comparing models even when none of them fits
              well \u2014 it tells you which is the <em>least bad</em> option. With
              113 countries (standard exclusions), Power Law (AIC 53.29) and Inverse (AIC 53.82) are
              effectively tied, with Log-Linear (54.31) close behind. Exponential
              (AIC 55.48) and Quadratic (62.17) trail \u2014 the constrained Armey Curve
              shape finds no empirical support in this dataset.
            </dd>
            <dt>p-value</dt>
            <dd>
              The probability of observing a fit this strong (or stronger) by
              chance alone, assuming government spending has no real effect on
              growth. <strong>Lower p-value = stronger evidence against the
              null hypothesis.</strong> A threshold of 0.05 is conventional; all
              models except Quadratic show p\u00a0&lt;\u00a00.001, meaning there
              is less than a 1-in-1000 chance the observed relationship is a
              statistical accident. The p-value is derived from an F-test on the
              regression: F = (R\u00b2 / k) / ((1 \u2212 R\u00b2) / (N \u2212 k \u2212 1)), where k is
              the number of fitted parameters.
            </dd>
            <dt>N (Sample size)</dt>
            <dd>
              The number of countries included in the regression for the current
              filter and time-period settings. Larger N increases statistical
              power and makes both R\u00b2 and p-value estimates more reliable.
              Excluding resource-dependent or externally-funded countries reduces
              N and may change all fit metrics \u2014 a drop in R\u00b2 after exclusion
              means those countries were pulling the curve in a predictable
              direction.
            </dd>
          </dl>`;

const frDl = `<dl class="ranking-glossary">
            <dt>R\u00b2 (coefficient de d\u00e9termination)</dt>
            <dd>
              Mesure dans quelle mesure la courbe explique la variation des taux de croissance
              entre pays. Un ajustement parfait = 1,0. Un score de 0 signifie que le
              mod\u00e8le ne fait pas mieux que de pr\u00e9dire le taux de croissance moyen pour
              chaque pays.
              <strong
                >Les valeurs n\u00e9gatives signifient que le mod\u00e8le est moins bon que cette
                r\u00e9f\u00e9rence.</strong
              >
              Lorsque les mod\u00e8les sont ajust\u00e9s sur 113 pays (pays d\u00e9pendants des ressources, financ\u00e9s de l\u2019ext\u00e9rieur, en conflit/fragiles et \u00e0 PIB distorc\u00e9 exclus), les meilleurs mod\u00e8les atteignent R\u00b2\u00a0\u2248\u00a00,42 \u2014
              ce qui signifie que les d\u00e9penses publiques % expliquent environ 42 % de la
              variation de la croissance. \u00c0 noter que
              <strong
                >la loi de puissance et l\u2019inverse sont \u00e0 \u00e9galit\u00e9 sur le R\u00b2 combin\u00e9 (0,4913) ; la loi de puissance devance l\u2019AIC (53,29 vs 53,82)</strong
              >
              \u2014 elle s\u2019ajuste bien \u00e0 la relation d\u00e9penses\u2013croissance dans des \u00e9conomies diverses. Chaque cat\u00e9gorie d\u2019exclusion a une justification th\u00e9orique sp\u00e9cifique : les \u00e9conomies d\u00e9pendantes des ressources croissent gr\u00e2ce \u00e0 des aubaines de mati\u00e8res premi\u00e8res sans lien avec la taille de l\u2019\u00e9tat ; les \u00e9tats financ\u00e9s de l\u2019ext\u00e9rieur ont des budgets distordus par l\u2019aide ; les \u00e9tats en conflit/fragiles ont une croissance supprim\u00e9e par l\u2019instabilit\u00e9 ; les \u00e9conomies \u00e0 PIB distorc\u00e9 ont des chiffres de PIB artificiellement gonfl\u00e9s ou d\u00e9gonfl\u00e9s.
            </dd>
            <dt>AIC (crit\u00e8re d\u2019information d\u2019Akaike)</dt>
            <dd>
              Classe les mod\u00e8les concurrents en \u00e9quilibrant leur qualit\u00e9 d\u2019ajustement et leur nombre de param\u00e8tres (les mod\u00e8les plus simples sont r\u00e9compens\u00e9s). <strong>AIC plus bas = meilleur mod\u00e8le.</strong> Contrairement au R\u00b2,
              l\u2019AIC est utile pour comparer des mod\u00e8les m\u00eame quand aucun ne s\u2019ajuste bien
              \u2014 il indique lequel est le <em>moins mauvais</em>. Avec
              113 pays (exclusions standard), la loi de puissance (AIC 53,29) et l\u2019inverse (AIC 53,82) sont
              pratiquement \u00e0 \u00e9galit\u00e9, avec la log-lin\u00e9aire (54,31) juste derri\u00e8re. L\u2019exponentielle
              (AIC 55,48) et le quadratique (62,17) sont en retrait \u2014 la forme contrainte de la courbe d\u2019Armey
              ne trouve aucun soutien empirique dans ces donn\u00e9es.
            </dd>
            <dt>valeur p</dt>
            <dd>
              La probabilit\u00e9 d\u2019observer un ajustement aussi fort (ou plus fort) par
              hasard, en supposant que les d\u00e9penses publiques n\u2019ont aucun effet r\u00e9el sur la
              croissance. <strong>Valeur p plus faible = preuve plus forte contre
              l\u2019hypoth\u00e8se nulle.</strong> Le seuil conventionnel est 0,05 ; tous
              les mod\u00e8les sauf le quadratique montrent p\u00a0&lt;\u00a00,001, ce qui signifie qu\u2019il y a
              moins d\u2019une chance sur 1000 que la relation observ\u00e9e soit un
              accident statistique. La valeur p est d\u00e9riv\u00e9e d\u2019un test F sur la
              r\u00e9gression : F = (R\u00b2 / k) / ((1 \u2212 R\u00b2) / (N \u2212 k \u2212 1)), o\u00f9 k est
              le nombre de param\u00e8tres ajust\u00e9s.
            </dd>
            <dt>N (taille de l\u2019\u00e9chantillon)</dt>
            <dd>
              Le nombre de pays inclus dans la r\u00e9gression pour les param\u00e8tres de filtre
              et de p\u00e9riode actuels. Un N plus grand augmente la puissance statistique
              et rend les estimations de R\u00b2 et de valeur p plus fiables.
              Exclure les pays d\u00e9pendants des ressources ou financ\u00e9s de l\u2019ext\u00e9rieur r\u00e9duit
              N et peut modifier toutes les mesures d\u2019ajustement \u2014 une baisse de R\u00b2 apr\u00e8s exclusion
              signifie que ces pays tiraient la courbe dans une direction pr\u00e9visible.
            </dd>
          </dl>`;

// Update en.json
const enPath = join(dir, 'armey-curve.en.json');
const en = JSON.parse(readFileSync(enPath, 'utf8'));
en['prose.ranking-glossary-static'] = enDl;
writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('Updated armey-curve.en.json');

// Update fr.json
const frPath = join(dir, 'armey-curve.fr.json');
const fr = JSON.parse(readFileSync(frPath, 'utf8'));
fr['prose.ranking-glossary-static'] = frDl;
writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
console.log('Updated armey-curve.fr.json');
