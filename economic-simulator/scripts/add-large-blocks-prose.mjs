/**
 * Extracts EN block values from armey-curve.html and injects both
 * EN + FR translations into the two JSON locale files.
 *
 * Blocks handled:
 *   prose.power-laws-everywhere
 *   prose.data-sources
 *   prose.correlation-causation
 *   prose.scatter-explanation
 *   prose.quadratic-political
 *   prose.natural-rights
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..');

// ── helpers ────────────────────────────────────────────────────────────────

function readJson(name) {
  return JSON.parse(readFileSync(join(dir, name), 'utf8'));
}

function writeJson(name, data) {
  writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`✔ wrote ${name}`);
}

/** Extract the inner content between <!-- i18n:key:start --> … <!-- /i18n:key:end --> */
function extractBlock(html, key) {
  const startTag = `<!-- i18n:${key}:start -->`;
  const endTag = `<!-- /i18n:${key}:end -->`;
  const s = html.indexOf(startTag);
  const e = html.indexOf(endTag);
  if (s === -1 || e === -1) throw new Error(`Block not found for key: ${key}`);
  // strip the start tag itself, then trim leading newline, keep rest
  let inner = html.slice(s + startTag.length, e);
  // trim a single leading newline and a single trailing newline
  inner = inner.replace(/^\n/, '').replace(/\n[ \t]*$/, '');
  return inner;
}

// ── read source files ──────────────────────────────────────────────────────

const html = readFileSync(join(dir, 'armey-curve.html'), 'utf8');
const en = readJson('armey-curve.en.json');
const fr = readJson('armey-curve.fr.json');

const BLOCKS = [
  'prose.power-laws-everywhere',
  'prose.data-sources',
  'prose.correlation-causation',
  'prose.scatter-explanation',
  'prose.quadratic-political',
  'prose.natural-rights',
];

// Set EN values from source HTML
for (const key of BLOCKS) {
  en[key] = extractBlock(html, key);
}

// ── French translations ────────────────────────────────────────────────────

fr['prose.power-laws-everywhere'] = `          <h3 data-i18n="heading.power-laws-everywhere">Les lois de puissance sont omniprésentes en économie</h3>
          <p>
            Le fait qu'une loi de puissance décrive le mieux la relation entre
            dépenses publiques et croissance ne devrait pas surprendre. Les lois
            de puissance comptent parmi les régularités empiriques les plus
            robustes en économie et en finance. Le schéma y = β₀ × x⁻ᵅ
            apparaît dans des domaines très différents — partout où quelques
            observations extrêmes dominent et où la relation entre variables est
            invariante d'échelle plutôt que distribuée en cloche.
          </p>

          <h4 data-i18n="heading.established-power-laws">Lois de puissance établies en économie</h4>
          <ul>
            <li>
              <strong>La loi de Pareto sur la distribution des revenus :</strong> Vilfredo
              Pareto a découvert en 1896 que la richesse suit une loi de
              puissance : les 20 % les plus riches détiennent environ 80 % de la
              richesse, et cela s'observe à travers les pays et les siècles. La
              queue de la distribution des revenus décroît en x⁻ᵅ avec α ≈ 1,5–3,
              ce qui signifie que les grandes fortunes sont bien plus fréquentes
              que ne le prédirait une distribution normale
            </li>
            <li>
              <strong>La loi de Zipf pour la taille des villes :</strong> La population
              de la n-ième plus grande ville d'un pays est approximativement
              proportionnelle à 1/n. New York représente environ deux fois Los
              Angeles, trois fois Chicago. Cette loi de puissance s'observe à
              travers les pays, des États-Unis à la Chine en passant par le
              Brésil, suggérant des forces structurelles profondes plutôt que la
              coïncidence
            </li>
            <li>
              <strong>Distribution de la taille des entreprises :</strong> La
              distribution des tailles d'entreprises (par chiffre d'affaires,
              effectifs ou capitalisation boursière) suit une loi de puissance.
              Quelques géants (Apple, Amazon) coexistent avec des millions de
              petites entreprises — exactement ce que prédit une loi de puissance,
              et exactement ce qu'une distribution normale ne peut pas expliquer
            </li>
            <li>
              <strong>Rendements des marchés financiers :</strong> Les krachs et
              les envolées boursières suivent des queues en loi de puissance, non
              les distributions gaussiennes supposées par la finance traditionnelle
              (Black-Scholes, CAPM). Benoît Mandelbrot a montré que les événements
              « impossibles » à 5–10 écarts-types se produisent bien plus souvent
              que ne le prévoient les courbes en cloche — car les rendements suivent
              une loi de puissance avec α ≈ 3
            </li>
            <li>
              <strong>Modèles de gravité du commerce :</strong> Les volumes
              d'échanges internationaux entre pays décroissent selon une loi de
              puissance de la distance : Commerce ∝ (PIB₁ × PIB₂) / distance^α.
              Cette équation de gravité est l'un des modèles empiriques les plus
              probants en économie, et c'est une loi de puissance
            </li>
            <li>
              <strong>Productivité et innovation :</strong> La distribution des
              citations de brevets, de l'impact des articles scientifiques et des
              valorisations de startups suit des lois de puissance. Une infime
              fraction des innovations génère la majeure partie de la valeur
              économique — la nature « dominée par les succès » de la technologie
            </li>
            <li>
              <strong>Effets de réseau et marchés à gagnant unique :</strong>
              Les parts de marché dans les économies de plateforme (moteurs de
              recherche, réseaux sociaux, boutiques d'applications) suivent des
              lois de puissance. Google ne détient pas 30 % des recherches — il en
              détient 90 %. Cette concentration est un résultat naturel des lois de
              puissance, non une défaillance de marché
            </li>
          </ul>

          <h4 data-i18n="heading.why-power-laws-dominate">Pourquoi les lois de puissance dominent les phénomènes économiques</h4>
          <p>
            Les lois de puissance émergent en économie pour les mêmes raisons
            structurelles qu'en physique, biologie et science des réseaux :
          </p>
          <ul>
            <li>
              <strong>Processus multiplicatifs :</strong> Lorsque la croissance se
              compose (la richesse engendre la richesse, le succès engendre le
              succès), la distribution résultante est log-normale ou en loi de
              puissance — jamais gaussienne. La croissance économique entre pays
              est intrinsèquement multiplicative
            </li>
            <li>
              <strong>Attachement préférentiel :</strong> Dans les réseaux, les
              nœuds qui ont déjà de nombreuses connexions en attirent davantage.
              En économie, les grandes villes attirent plus de migrants, les
              entreprises dominantes attirent plus de clients, et les économies
              productives attirent plus d'investissements
            </li>
            <li>
              <strong>Invariance d'échelle :</strong> Les lois de puissance n'ont
              pas d'échelle caractéristique — le même schéma s'observe que l'on
              examine des petits gouvernements (10–15 % du PIB) ou des grands
              (40–50 %). C'est exactement ce que l'on constate dans les données
              dépenses-croissance : le schéma de décroissance ne change pas de
              forme à aucun seuil
            </li>
            <li>
              <strong>Queues épaisses :</strong> Contrairement à la décroissance
              exponentielle, les lois de puissance admettent des observations
              extrêmes. Des pays comme Singapour (17 % de dépenses, 2,8 % de
              croissance) ne sont pas des « anomalies » — ils se trouvent
              exactement là où la courbe en loi de puissance le prédit
            </li>
          </ul>

          <p>
            <strong>En résumé :</strong> les lois de puissance sont la forme
            fonctionnelle par défaut pour les relations économiques impliquant des
            rendements décroissants, des distributions invariantes d'échelle et
            des processus multiplicatifs. Il serait surprenant que la relation
            entre dépenses publiques et croissance ne suive <em>pas</em> une loi
            de puissance. La vraie question est de savoir pourquoi les économistes
            ont passé des décennies à forcer une courbe quadratique sur des données
            qui criaient depuis toujours « loi de puissance ».
          </p>`;

fr['prose.data-sources'] = `          <h3 data-i18n="heading.data-sources">Sources des données</h3>
          <p>
            Les données réelles par pays affichées dans ce simulateur proviennent
            de la base de données complète de la Banque mondiale :
          </p>
          <ul>
            <li>
              <strong>Dépenses publiques :</strong>
              <a
                href="https://data.worldbank.org/indicator/GC.XPN.TOTL.GD.ZS"
                target="_blank"
                rel="noopener"
                >Dépenses totales des administrations publiques (% du PIB)</a
              >
              - Inclut l'ensemble des dépenses publiques en biens, services,
              salaires, transferts et subventions
            </li>
            <li>
              <strong>Croissance économique :</strong>
              <a
                href="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG"
                target="_blank"
                rel="noopener"
                >Croissance du PIB (% annuel)</a
              >
              - Taux de croissance réel du PIB en monnaie locale constante
            </li>
            <li>
              <strong>Période des données :</strong> Moyennes calculées sur les
              périodes sélectionnées par l'utilisateur (plage 2005–2023)
            </li>
            <li>
              <strong>Méthodologie :</strong> Les pays ne sont inclus que s'ils
              disposent d'au moins 3 ans de données dans la période sélectionnée
            </li>
          </ul>
          <p>
            <em
              >Remarque : vous pouvez télécharger directement les données brutes
              depuis la
              <a
                href="https://databank.worldbank.org/home.aspx"
                target="_blank"
                rel="noopener"
                >DataBank</a
              >
              de la Banque mondiale pour vos propres analyses.</em
            >
          </p>`;

fr['prose.correlation-causation'] = `          <h3 data-i18n="heading.correlation-causation">Mais la corrélation implique-t-elle la causalité ?</h3>
          <p>
            <strong
              >L'objection la plus forte à cette analyse est la causalité
              inverse :</strong
            >
            peut-être que les pays riches peuvent simplement <em>se permettre</em>
            des dépenses publiques plus élevées, de sorte que c'est la prospérité
            qui engendre un grand État plutôt que l'inverse. Ou peut-être qu'une
            troisième variable — le vieillissement des populations, par exemple —
            entraîne à la fois des dépenses plus élevées (retraites, santé) et une
            croissance plus faible simultanément. Ce sont des préoccupations
            économétriques sérieuses qui méritent un examen honnête.
          </p>

          <h4 data-i18n="heading.endogeneity">Le problème de l'endogénéité</h4>
          <p>
            Les corrélations entre pays seules ne peuvent pas prouver la causalité.
            Trois menaces spécifiques à l'inférence causale existent ici :
          </p>
          <ul>
            <li>
              <strong>Causalité inverse :</strong> Les pays plus riches peuvent
              choisir des États-providence plus généreux comme bien de luxe —
              dépensant davantage <em>parce qu'ils peuvent se le permettre</em>,
              non parce que cela réduit la croissance
            </li>
            <li>
              <strong>Biais de variable omise :</strong> La démographie
              (vieillissement), la culture (éthique du travail), la géographie
              (distance de l'équateur) et l'histoire institutionnelle influencent
              à la fois les dépenses et la croissance
            </li>
            <li>
              <strong>Simultanéité :</strong> La croissance et les dépenses sont
              déterminées conjointement — les récessions augmentent les dépenses
              (stabilisateurs automatiques) tout en réduisant la croissance,
              créant une corrélation négative mécanique
            </li>
          </ul>

          <h4 data-i18n="heading.causal-direction">Pourquoi la direction causale reste valide</h4>
          <p>
            Malgré ces préoccupations légitimes, plusieurs lignes de preuves
            suggèrent que la flèche causale dominante va des dépenses publiques
            vers la croissance, et non l'inverse :
          </p>
          <ul>
            <li>
              <strong>La loi de Wagner inversée :</strong> La loi de Wagner (1893)
              prédisait qu'à mesure que les revenus augmentent, la part du
              gouvernement dans le PIB s'accroîtrait. Mais les pays à la plus forte
              croissance (Singapour, Hong Kong, Botswana) ont <em>résisté</em> à
              cette tendance par des choix politiques délibérés. Si la causalité
              inverse dominait, on ne verrait jamais de pays riches avec de petits
              gouvernements — pourtant ils existent et surperforment
            </li>
            <li>
              <strong>Analyse avec décalage temporel :</strong> Lorsque les
              chercheurs utilisent les niveaux <em>initiaux</em> de dépenses
              publiques pour prédire la croissance <em>ultérieure</em> (<a href="#ref-barro">Barro 1991</a>,
              <a href="#ref-gwartney">Gwartney et al. 1998</a>), la relation
              négative persiste. Les pays qui débutaient la décennie avec des
              dépenses plus faibles ont crû plus vite au cours des dix années
              suivantes, excluant une simple causalité inverse
            </li>
            <li>
              <strong>Études par variables instrumentales :</strong>
              <a href="#ref-afonso">Afonso &amp; Furceri (2010)</a> et d'autres
              utilisent des instruments politiques et institutionnels (systèmes
              électoraux, contraintes constitutionnelles) qui affectent les
              dépenses mais pas directement la croissance. L'effet négatif
              subsiste après ces contrôles
            </li>
            <li>
              <strong>Données de panel entre pays :</strong>
              <a href="#ref-bergh">Bergh &amp; Henrekson (2011)</a> ont passé en
              revue la littérature et conclu qu'« une augmentation de la taille
              totale du gouvernement de 10 points de pourcentage est associée à
              un taux de croissance annuel inférieur de 0,5 à 1 point de
              pourcentage » — un résultat robuste selon différentes méthodologies
            </li>
          </ul>

          <h4 data-i18n="heading.natural-experiments">Les expériences naturelles : pays qui ont changé de cap</h4>
          <p>
            Les preuves les plus convaincantes proviennent des pays qui ont
            modifié radicalement leurs niveaux de dépenses, créant des
            quasi-expériences naturelles où l'on peut observer des effets avant
            et après :
          </p>

          <div class="info-card">
            <h5 data-i18n="heading.countries-cut-boomed">Pays qui ont réduit leurs dépenses et connu l'essor :</h5>
            <ul>
              <li>
                <strong>Irlande (1987–2000) :</strong> Les dépenses publiques
                sont passées d'environ 53 % à 36 % du PIB. Les coupes ont
                commencé en 1987 sous la Stratégie de Tallaght — avant
                l'arrivée significative des investissements directs étrangers.
                Résultat : la croissance a bondi de moins de 1 % à 6–8 % par an,
                transformant l'Irlande du « malade de l'Europe » en Tigre celtique.
                Le PIB par habitant est passé de 64 % de la moyenne européenne en
                1987 à plus de 120 % en 2000. <em>Crucial pour la causalité : les
                coupes de dépenses ont précédé l'accélération de la croissance de
                2 à 3 ans.</em>
              </li>
              <li>
                <strong>Suède (1993–2000) :</strong> À la suite de sa récession
                la plus profonde depuis les années 1930, la Suède a réduit ses
                dépenses publiques totales d'environ 67 % à 55 % du PIB entre
                1993 et 2000 — soit une réduction de 12 points de pourcentage en
                sept ans. La croissance du PIB est passée de −1,4 % en 1993 à
                +4,7 % en 1994 et +3,8 % en 1995. Le déficit budgétaire est
                passé de −11 % à un excédent en 1998.
                <em>Crucial pour la causalité : la consolidation budgétaire a
                immédiatement précédé la reprise de la croissance.</em>
              </li>
              <li>
                <strong>Canada (1994–1999) :</strong> Les dépenses publiques
                totales sont passées d'environ 53 % à 42 % du PIB sous la
                consolidation budgétaire Chrétien–Martin. Les dépenses de
                programmes ont été réduites d'environ 20 % en termes réels sur
                trois ans. La croissance s'est accélérée et le Canada a enregistré
                des excédents budgétaires consécutifs de 1997 à 2008, surpassant
                les États-Unis et la plupart des pairs du G7. <em>Crucial pour la
                causalité : une décision politique délibérée, non une réponse à
                un boom préexistant.</em>
              </li>
              <li>
                <strong>Estonie (1992–2008) :</strong> L'Estonie a accédé à
                l'indépendance en 1991 avec des dépenses publiques d'environ
                40 % du PIB — modérées pour une économie de transition
                européenne. Elle a maintenu ce niveau tout en introduisant un
                impôt à taux unique (1994), des privatisations rapides et une
                gouvernance numérique. En comparaison, la Lettonie et la
                Lituanie — avec des points de départ similaires — ont davantage
                dépensé et ont connu une croissance un peu plus lente durant les
                années 2000. La croissance a atteint en moyenne 7 % par an,
                valant à l'Estonie l'étiquette de « Tigre balte ».
              </li>
              <li>
                <strong>Nouvelle-Zélande (1984–1994) :</strong> Le
                « Rogernomics » a réduit les dépenses publiques de 44 % à 37 %
                du PIB — dérégulant les secteurs, privatisant les entreprises
                d'État, aplatissant la fiscalité. La croissance est remontée
                de la stagnation à 3–4 % et l'économie s'est modernisée en
                une décennie.
              </li>
            </ul>
          </div>

          <div class="warning-card">
            <h5 data-i18n="heading.countries-expanded-stagnated">Pays qui ont augmenté leurs dépenses et connu la stagnation :</h5>
            <ul>
              <li>
                <strong>France (1980–aujourd'hui) :</strong> Les dépenses
                publiques sont passées d'environ 43 % à 57 % du PIB. La
                croissance a décéléré de 3–4 % à à peine 1 %, et le chômage est
                devenu structurellement ancré au-dessus de 7 %
              </li>
              <li>
                <strong>Italie (1970–aujourd'hui) :</strong> Les dépenses ont
                progressé d'environ 30 % à plus de 50 % du PIB. L'Italie est
                passée de l'une des économies à la plus forte croissance d'Europe
                à deux décennies de croissance quasi nulle (2000–2020)
              </li>
              <li>
                <strong>Grèce (1990–2009) :</strong> Les dépenses ont gonflé
                jusqu'à plus de 50 % du PIB, financées par la dette. Il en a
                résulté une crise de la dette souveraine, une contraction de
                25 % du PIB et une décennie perdue
              </li>
            </ul>
          </div>

          <p>
            <strong>Ce que ces cas établissent sur la causalité :</strong>
            Dans chaque cas, la réduction des dépenses était un choix politique
            délibéré effectué durant ou immédiatement avant une période de faible
            croissance — non une réponse à un boom existant. L'Irlande a réduit
            ses dépenses en 1987 <em>lors d'une crise budgétaire</em>, avant
            l'arrivée des investissements étrangers. La Suède a réduit en
            1993–1995 <em>durant et immédiatement après</em> sa pire récession
            en soixante ans. Le Canada a réduit en 1994–1995 <em>sous la pression
            du déficit</em>, non en période de prospérité. La séquence temporelle
            — décision politique, puis accélération de la croissance 1 à 3 ans
            plus tard — est incompatible avec la causalité inverse, qui prédirait
            que les coupes surviennent <em>après</em> que la croissance améliore
            la situation budgétaire d'un pays. Ces cas ne prouvent pas
            définitivement la causalité, mais ils déplacent la charge de la
            preuve : un scénario de causalité inverse devrait expliquer pourquoi
            les programmes d'austérité adoptés en période de crise précèdent
            systématiquement les reprises de croissance.
          </p>

          <h4 data-i18n="heading.remaining-limitations">Limites restantes</h4>
          <p>
            Dans un souci d'honnêteté intellectuelle, cette analyse présente de
            réelles limites que les lecteurs doivent peser :
          </p>
          <ul>
            <li>
              <strong>Conception transversale :</strong> Le simulateur utilise des
              moyennes par pays, qui perdent les dynamiques temporelles
              intra-pays. Des données de panel avec effets fixes pays
              renforceraient l'analyse
            </li>
            <li>
              <strong>Petit échantillon :</strong> 113 pays passent les filtres
              de qualité standard (N=38 sans aucune exclusion sur une version plus
              ancienne du jeu de données). Aucun intervalle de confiance ni
              valeur p n'est affiché (bien que R² = 0,42 avec N=113 implique
              p &lt; 0,001 pour l'ajustement en loi de puissance)
            </li>
            <li>
              <strong>Absence de variables de contrôle :</strong> Le modèle
              utilise une seule variable. Une régression multivariée contrôlant
              la démographie, l'ouverture commerciale et la qualité
              institutionnelle serait plus rigoureuse
            </li>
            <li>
              <strong>Composition des dépenses :</strong> Toutes les dépenses
              publiques ne se valent pas. La loi de puissance est ajustée sur les
              pays de l'échantillon Banque mondiale 2005–2023 qui ont <em>déjà</em>
              financé la gouvernance de base, de sorte que le dollar marginal dans
              les données est en écrasante majorité des transferts, subventions,
              salaires publics et service de la dette — non des tribunaux ou de
              la protection des droits de propriété. Cela renforce en fait le
              résultat : même lorsque l'échantillon penche vers les catégories
              de dépenses les moins productives, la relation négative se maintient.
              Par ailleurs, certaines dépenses visent délibérément à ralentir une
              activité économique qui impose des coûts à autrui (pollution, risque
              financier systémique) — ralentir cette activité est l'objectif, non
              un défaut
            </li>
            <li>
              <strong>Biais de survie et plancher des données :</strong> Aucun
              pays du panel Banque mondiale n'a des dépenses publiques inférieures
              à environ 8 % du PIB. Ce plancher n'est pas aléatoire. Les
              territoires avec un gouvernement formel quasi nul s'effondrent et
              perdent leur couverture par la Banque mondiale, ou s'informalisent
              au point que la mesure du PIB devient impossible. L'absence de pays
              observables avec 3–5 % de dépenses et une forte croissance est
              elle-même informative : elle peut refléter un échec de sélection
              plutôt que confirmer qu'un minimum étatique est nécessaire.
              <br><br>
              Il existe une version plus subtile de ce biais : ce que nous
              appelons « échec de l'État » reflète en partie les valeurs des
              institutions qui le classifient. Un territoire où les marchés de
              drogues, de transplantations d'organes et de finance non régulée
              opèrent ouvertement peut avoir un bien-être élevé selon la
              préférence révélée — les gens choisissent volontairement ces
              transactions — mais un PIB <em>mesuré</em> faible et une
              classification « État défaillant » par des organisations
              internationales qui sont elles-mêmes le produit de gouvernements
              à fortes dépenses. La Somalie des années 2000–2010, par exemple,
              possédait un secteur des télécommunications informel florissant,
              des réseaux hawala de transfert d'argent et un commerce de
              bétail — presque rien n'apparaît dans les chiffres officiels du
              PIB. Hernando de Soto l'a documenté systématiquement dans
              <em>Le Mystère du capital</em> : l'économie informelle des
              territoires à faible État est large, réelle et invisible pour les
              comptabilités nationales standard. Ainsi, les données peuvent
              simultanément sous-estimer l'activité économique dans les
              territoires à faibles dépenses <em>et</em> les classer à tort
              comme défaillants parce que les transactions qu'ils rendent
              possibles sont celles que les États à fortes dépenses ont décidé
              d'interdire.
              <br><br>
              Cela n'implique pas que zéro gouvernement est optimal — le modèle
              en loi de puissance est ajusté au domaine observé (8–67 % de
              dépenses) et son comportement aux limites est un artefact
              mathématique, non une prédiction. Ce que cela implique, c'est
              que les données ne peuvent pas se prononcer sur la plage
              inférieure à 8 %, et que la preuve apparente contre les États
              très petits peut en partie refléter des choix de mesure et de
              classification plutôt que la réalité économique.
            </li>
          </ul>
          <p>
            <strong>Aucune de ces limites n'invalide le résultat central</strong>
            — que les dépenses publiques expliquent une part remarquablement
            importante des différences de croissance entre pays, et que la
            relation est systématiquement négative — mais elles invitent à la
            prudence avant de tirer des conclusions absolues. Le schéma en loi
            de puissance est réel. Si le niveau de dépenses optimal impliqué
            est de 10 % ou de 20 % du PIB nécessite une analyse plus
            sophistiquée qu'une régression à une seule variable peut fournir.
          </p>

          <h3 id="nordic-question" data-i18n="heading.nordic-question">La question nordique : riches malgré des dépenses élevées, ou riches avant des dépenses élevées ?</h3>
          <p>
            L'objection la plus courante au modèle en loi de puissance concerne
            les pays nordiques. Le Danemark, la Suède et la Finlande consacrent
            49–53 % de leur PIB aux dépenses publiques — pourtant ce sont des
            sociétés riches, bien fonctionnelles, avec un niveau de vie élevé.
            Cela ne réfute-t-il pas la thèse ?
          </p>
          <p>
            Non, pour une raison qui traverse tout l'article :
            <strong>la richesse (un stock) n'est pas la même chose que la croissance
            (un flux).</strong>
            Le modèle en loi de puissance prédit les taux de croissance, non les
            niveaux de PIB. Un pays qui a bâti sa richesse sur un siècle de
            gouvernement relativement sobre, puis a étendu son État-providence,
            sera toujours riche — il ne croîtra simplement pas aussi vite qu'il
            l'aurait autrement fait.
          </p>

          <div class="info-card">
            <h5 data-i18n="heading.nordic-growth-rates">Taux de croissance nordiques et leurs dépenses (moy. 2005–2019) :</h5>
            <ul>
              <li><strong>Danemark</strong> — ~51 % de dépenses, ~1,0 % de croissance moy.</li>
              <li><strong>Finlande</strong> — ~53 % de dépenses, ~0,9 % de croissance moy.</li>
              <li><strong>Suède</strong> — ~49 % de dépenses, ~2,3 % de croissance moy.</li>
              <li><strong>Norvège</strong> — ~57 % de dépenses, ~1,7 % de croissance moy.</li>
            </ul>
            <p style="margin-top:8px">
              Ce ne sont <em>pas</em> des taux de croissance élevés. Ils se
              situent précisément dans le groupe à faible croissance où le modèle
              en loi de puissance place les pays à fortes dépenses. Les pays
              nordiques sont riches parce qu'ils ont crû rapidement
              <em>avant</em> que leurs États-providence n'atteignent leur
              envergure actuelle — l'expansion des dépenses suédoises s'est
              produite dans les années 1970–80, bien après que la base de
              richesse industrielle ait été établie.
            </p>
          </div>

          <p>
            La Suède est en fait l'étude de cas la plus solide de l'article pour
            la causalité : elle a réduit ses dépenses de 67 % à environ 49 % du
            PIB entre 1993 et 2007, et a connu ses meilleures décennies de
            croissance depuis les années 1960 immédiatement après — une séquence
            documentée dans la section des expériences naturelles ci-dessus. Le
            modèle nordique n'est pas une exception à la relation ; c'en est une
            confirmation.
          </p>
          <p>
            La Norvège nécessite une mise en garde distincte : environ 15 à
            20 points de pourcentage de ses « dépenses publiques » mesurées
            transitent par le Fonds de pension gouvernemental (fonds souverain)
            qui investit les revenus pétroliers à l'étranger plutôt que de les
            diriger vers l'économie nationale. Sa consommation publique intérieure
            effective est plus proche de 40 % du PIB continental — encore élevée,
            mais matériellement différente du chiffre officiel.
          </p>
          <p>
            La bonne question à poser sur les pays nordiques n'est pas
            « pourquoi sont-ils riches ? » mais « pourquoi croissent-ils
            lentement par rapport à leur propre potentiel et par rapport aux
            pairs à plus faibles dépenses ? » Sur cette question, les données
            fournissent une réponse cohérente.
          </p>`;

fr['prose.scatter-explanation'] = `          <h3 data-i18n="heading.scatter-explanation">
            Pourquoi il subsiste une dispersion même si la taille de l'État est le facteur dominant
          </h3>
          <p>
            Même si les données entre pays suggèrent systématiquement une relation
            négative entre taille de l'État et croissance, on remarque une
            dispersion significative autour de tout modèle de courbe.
            Cela ne mine pas le schéma empirique — cela montre simplement que
            <strong
              >la taille de l'État est un facteur important mais pas le seul
              associé à la croissance économique</strong
            >. Comprendre ces autres facteurs aide à expliquer pourquoi certains
            pays à fortes dépenses ne sont pas complètement à la peine, et
            pourquoi certains pays à faibles dépenses ne croissent pas encore
            plus vite.
          </p>

          <h4 data-i18n="heading.key-growth-factors">Facteurs de croissance clés au-delà de la taille de l'État</h4>

          <h5 data-i18n="heading.factor-institutional-quality">1. Qualité institutionnelle</h5>
          <ul>
            <li>
              <strong>État de droit :</strong> Des droits de propriété solides
              et l'exécution des contrats favorisent l'investissement et
              l'innovation
            </li>
            <li>
              <strong>Efficacité réglementaire :</strong> Des réglementations
              allégées réduisent les coûts et encouragent l'entrepreneuriat
            </li>
            <li>
              <strong>Efficacité gouvernementale :</strong> La qualité de
              l'administration publique et de la mise en œuvre des politiques
              compte davantage que la taille
            </li>
            <li>
              <strong>Contrôle de la corruption :</strong> Une gouvernance
              transparente garantit que les ressources sont utilisées à des fins
              productives
            </li>
          </ul>
          <p>
            <em
              >Exemple : Singapour (17 % de dépenses, 2,8 % de croissance)
              associe un gouvernement efficace à des institutions solides, tandis
              que certains pays à fortes dépenses peinent avec l'inefficacité
              bureaucratique.</em
            >
          </p>

          <h5 data-i18n="heading.factor-development-stage">2. Stade de développement et potentiel de rattrapage</h5>
          <ul>
            <li>
              <strong>Effet de convergence :</strong> Les pays en développement
              peuvent croître plus vite en adoptant les technologies existantes
            </li>
            <li>
              <strong>Écarts de productivité :</strong> La marge d'amélioration
              varie considérablement selon les pays
            </li>
            <li>
              <strong>Besoins en infrastructures :</strong> Les pays présentant
              des déficits d'infrastructures peuvent constater des rendements
              élevés sur l'investissement
            </li>
          </ul>
          <p>
            <em
              >Exemple : l'Éthiopie (8,5 % de dépenses, 6,5 % de croissance)
              et le Rwanda (19,7 % de dépenses, 7,0 % de croissance) bénéficient
              d'un potentiel de croissance de rattrapage malgré des tailles
              d'État très différentes.</em
            >
          </p>

          <h5 data-i18n="heading.factor-demographics">3. Démographie et capital humain</h5>
          <ul>
            <li>
              <strong>Structure d'âge :</strong> Les populations jeunes en âge
              de travailler stimulent la croissance ; les populations vieillissantes
              font face à des vents contraires
            </li>
            <li>
              <strong>Qualité de l'éducation :</strong> Adéquation des
              compétences, capacité d'innovation et adaptabilité au changement
            </li>
            <li>
              <strong>Résultats sanitaires :</strong> Les populations en bonne
              santé sont plus productives et innovantes
            </li>
          </ul>
          <p>
            <em
              >Exemple : le Japon (19,7 % de dépenses, 0,2 % de croissance)
              fait face à des vents contraires démographiques liés à une
              population vieillissante, tandis que les pays à population jeune
              bénéficient d'avantages naturels de croissance.</em
            >
          </p>

          <h5 data-i18n="heading.factor-economic-structure">4. Structure économique et ouverture</h5>
          <ul>
            <li>
              <strong>Intégration commerciale :</strong> Accès aux marchés
              mondiaux et aux chaînes de valeur
            </li>
            <li>
              <strong>Composition sectorielle :</strong> Différences de
              productivité entre industrie manufacturière, services et agriculture
            </li>
            <li>
              <strong>Compétitivité à l'exportation :</strong> Niveaux de change,
              coûts salariaux et spécialisation
            </li>
            <li>
              <strong>Investissement étranger :</strong> Transferts de
              technologie et entrées de capitaux
            </li>
          </ul>
          <p>
            <em
              >Exemple : l'Irlande (22,3 % de dépenses, 6,8 % de croissance)
              bénéficie de son statut de plaque tournante pour les multinationales
              et de l'accès au marché européen.</em
            >
          </p>

          <h5 data-i18n="heading.factor-innovation">5. Innovation et technologie</h5>
          <ul>
            <li>
              <strong>Investissement en R&amp;D :</strong> Les dépenses de
              recherche, publiques comme privées, alimentent la croissance à
              long terme
            </li>
            <li>
              <strong>Adoption technologique :</strong> Infrastructures
              numériques et capacités d'automatisation
            </li>
            <li>
              <strong>Retombées des connaissances :</strong> Proximité des
              centres d'innovation et des universités
            </li>
            <li>
              <strong>Culture entrepreneuriale :</strong> Prise de risque et
              taux de création d'entreprises
            </li>
          </ul>

          <h5 data-i18n="heading.factor-macrostability">6. Stabilité macroéconomique</h5>
          <ul>
            <li>
              <strong>Maîtrise de l'inflation :</strong> La stabilité des prix
              permet la planification et l'investissement à long terme
            </li>
            <li>
              <strong>Développement financier :</strong> Accès au crédit et
              allocation efficace du capital
            </li>
            <li>
              <strong>Politique de change :</strong> Compétitivité et stabilité
              pour le commerce
            </li>
            <li>
              <strong>Soutenabilité de la dette :</strong> Charge d'endettement
              maîtrisable et espace budgétaire disponible
            </li>
          </ul>

          <h5 data-i18n="heading.factor-resources-geography">7. Ressources naturelles et géographie</h5>
          <ul>
            <li>
              <strong>Dotations en ressources :</strong> Peuvent être une
              bénédiction ou une malédiction selon la gestion
            </li>
            <li>
              <strong>Localisation géographique :</strong> Accès aux marchés,
              climat et avantages naturels
            </li>
            <li>
              <strong>Coûts énergétiques :</strong> Accès à une énergie
              abordable pour l'industrie et les ménages
            </li>
          </ul>
          <p>
            <em
              >Exemple : la Norvège gère bien sa manne pétrolière via un fonds
              souverain, tandis que certains pays riches en ressources souffrent
              du « syndrome hollandais ».</em
            >
          </p>

          <h4 data-i18n="heading.understanding-outliers">Comprendre les valeurs aberrantes</h4>

          <div class="info-card">
            <h5 data-i18n="heading.high-growth-low-spending">Forte croissance avec de faibles dépenses :</h5>
            <ul>
              <li>
                <strong>Éthiopie (8,5 % de dépenses, 6,5 % de croissance) :</strong>
                Croissance de rattrapage, investissement en infrastructures,
                population jeune
              </li>
              <li>
                <strong>Bangladesh (8,1 % de dépenses, 6,4 % de croissance) :</strong>
                Croissance manufacturière, dividende démographique, faible base
              </li>
              <li>
                <strong>Singapour (17 % de dépenses, 2,8 % de croissance) :</strong>
                Gouvernement efficace, position stratégique, services à haute
                valeur ajoutée. <em>Mise en garde importante :</em> le chiffre
                de 17 % sous-estime la véritable implication de l'État — le Fonds
                de prévoyance central (CPF) impose environ 37 % d'épargne
                salariale, environ 80 % du logement est construit par le HDB
                (un organisme gouvernemental), et les fonds souverains (GIC,
                Temasek) gèrent des actifs supérieurs à 100 % du PIB. Ces
                dispositifs sont pilotés par l'État mais n'apparaissent pas dans
                le budget. Singapour confirme la direction du modèle — des
                budgets sobres corrèlent avec la croissance — mais l'empreinte
                réelle de l'État est plus large que 17 % ne le suggère
              </li>
              <li>
                <strong
                  >Corée du Sud (c.1970–1995, ~20 % de dépenses, ~8 % de
                  croissance) :</strong
                >
                Croissance soutenue avec des dépenses publiques modérées, mais
                aussi une politique industrielle importante (ciblage des
                exportations, POSCO, subventions DRAM). La Corée du Sud montre
                que le niveau total des dépenses et la qualité institutionnelle
                — non l'absence de toute intervention de l'État — sont ce que
                les données entre pays captent principalement. Son expérience
                complique toute affirmation générale selon laquelle l'orientation
                gouvernementale de l'investissement détruit toujours la croissance
              </li>
              <li>
                <strong
                  >Taïwan (c.1965–1995, ~18 % de dépenses, ~9 % de
                  croissance) :</strong
                >
                Schéma similaire : budget modéré accompagné d'un développement
                industriel significativement piloté par l'État (ITRI, origines de
                TSMC, promotion des exportations). Le cas de Taïwan renforce
                l'idée que les régressions entre pays reflètent les niveaux
                agrégés de dépenses, non la réussite ou l'échec de certains
                programmes ciblés dans un budget global sobre
              </li>
            </ul>
          </div>

          <div class="warning-card">
            <h5 data-i18n="heading.low-growth-moderate-spending">Faible croissance malgré des dépenses modérées :</h5>
            <ul>
              <li>
                <strong>Japon (19,7 % de dépenses, 0,2 % de croissance) :</strong>
                Population vieillissante, dette élevée, économie mature
              </li>
              <li>
                <strong>Allemagne (30,2 % de dépenses, 0,5 % de croissance) :</strong>
                Coûts de la transition énergétique, industrie manufacturière
                mature, défis démographiques
              </li>
              <li>
                <strong>Argentine (22,7 % de dépenses, 0 % de croissance) :</strong>
                Instabilité macroéconomique, inflation, faiblesses institutionnelles
              </li>
            </ul>
          </div>

          <h4 data-i18n="heading.policy-implications">Implications politiques</h4>
          <p>
            La dispersion dans les données nous enseigne que
            <strong
              >minimiser la taille de l'État est nécessaire et généralement
              suffisant</strong
            >
            pour la croissance, mais d'autres facteurs peuvent amplifier ou
            diminuer les bénéfices. Notons que cette analyse ne réfute pas
            l'argument théorique en faveur d'un ensemble étroit de biens publics
            (défense, état de droit, infrastructures de base) où la fourniture
            par le marché peut être véritablement insuffisante — elle montre
            seulement que, empiriquement, les pays à dépenses totales très faibles
            parviennent à une forte croissance. L'enseignement politique porte sur
            l'<em>échelle</em>, non sur l'élimination de toute fonction
            gouvernementale. Les stratégies de croissance les plus réussies :
          </p>
          <ul>
            <li>
              <strong>Réduction de l'État en premier :</strong> Réduire les
              dépenses et les réglementations comme stratégie de croissance
              prioritaire
            </li>
            <li>
              <strong>Laisser les marchés gérer le reste :</strong> La plupart
              des « autres facteurs » (éducation, infrastructures, innovation)
              sont mieux fournis par les marchés privés que par des programmes
              gouvernementaux
            </li>
            <li>
              <strong>La qualité institutionnelle signifie moins d'État :</strong>
              Un État de droit solide protège la propriété privée et les échanges
              volontaires, non des programmes gouvernementaux
            </li>
            <li>
              <strong>Les facteurs démographiques et géographiques sont des
              explications partielles :</strong> Le vieillissement de la
              population et la géographie expliquent une partie de la variation
              entre pays, mais ils ne rendent pas compte de l'ampleur totale de
              la relation dépenses-croissance dans les données
            </li>
            <li>
              <strong>Le modèle singapourien (avec nuances) :</strong> Un
              gouvernement <em>budgétaire</em> sobre avec de solides droits de
              propriété surpasse systématiquement le modèle européen de
              l'État-providence. Cependant, Singapour utilise une épargne
              obligatoire (CPF ~37 %) et un logement d'État (HDB ~80 %) qui
              fonctionnent comme des quasi-programmes gouvernementaux hors
              budget. L'enseignement est moins « pas de gouvernement » et
              davantage « un gouvernement qui opère via des mécanismes
              compatibles avec le marché plutôt que par les impôts et les
              transferts »
            </li>
          </ul>

          <p>
            <strong>En résumé :</strong> les pays qui associent un petit
            gouvernement à des institutions solides obtiennent les taux de
            croissance les plus élevés. Dans les régressions entre pays à
            variable unique, la taille de l'État explique davantage de variance
            dans la croissance que la plupart des autres déterminants couramment
            testés — ce qui lui confère une pertinence politique de premier ordre,
            même en tenant compte des mises en garde sur l'endogénéité évoquées
            ci-dessus.
          </p>`;

fr['prose.quadratic-political'] = `          <h3 data-i18n="heading.quadratic-persisted">Pourquoi le modèle quadratique a persisté</h3>
          <p>
            La courbe d'Armey traditionnelle a survécu plus longtemps que son
            bilan empirique ne le justifie. Une partie de l'explication tient
            à ce qu'elle offrait quelque chose à plusieurs sensibilités :
          </p>
          <ul>
            <li>
              <strong>Les politiciens :</strong> Un argument de « zone optimale »
              plutôt qu'une demande de réduction maximale
            </li>
            <li>
              <strong>Les universitaires :</strong> Une courbe lisse et
              maniable, adaptée au raffinement économétrique
            </li>
            <li>
              <strong>Les institutions :</strong> Un cadre compatible avec
              l'ajustement incrémental plutôt que la refonte structurelle
            </li>
            <li>
              <strong>Les électeurs :</strong> Une histoire où dépenses et
              croissance pouvaient coexister au bon niveau
            </li>
          </ul>
          <p>
            Les données sont cohérentes avec l'hypothèse d'éviction : chaque
            dollar supplémentaire de dépenses publiques déplace un investissement
            et une consommation privés qui auraient, en moyenne, généré une
            croissance plus forte. Que cela reflète le mécanisme qu'insistent les
            économistes autrichiens ou une simple réallocation vers des usages
            privés à rendement plus élevé, le schéma entre pays pointe dans la
            même direction.
          </p>

          <h3 data-i18n="heading.political-economy">L'économie politique du choix de modèle</h3>
          <p>
            L'une des raisons pour lesquelles le modèle en loi de puissance n'a
            pas encore intégré le discours politique dominant est peut-être que
            ses implications sont plus inconfortables que celles de l'alternative
            quadratique. Ce n'est pas inhabituel en économie : comme James
            Buchanan l'a soutenu, les économistes répondent aux incitations comme
            tout le monde, et les théories compatibles avec les arrangements
            institutionnels existants tendent à recevoir plus de développement,
            de tests et de citations que celles qui ne le sont pas.
          </p>

          <h4 data-i18n="heading.power-law-awkward">Ce qui rend la loi de puissance politiquement inconfortable</h4>
          <p>
            Le modèle quadratique offre aux politiciens un message navigable :
            trouvez le point optimal, affinez à partir de là. La loi de puissance
            offre un message moins négociable : toute expansion des dépenses
            publiques entraîne un coût en termes de croissance. Les tensions
            spécifiques incluent :
          </p>

          <ul>
            <li>
              <strong>Pas de compromis « optimal » :</strong> Le modèle
              quadratique permet des arguments sur l'équilibre et le calibrage ;
              la loi de puissance ne le permet pas
            </li>
            <li>
              <strong>Remet en question le cadrage technocratique :</strong>
              Si les dépenses agrégées sont monotonement nuisibles, la question
              politique passe de « combien » à « pour quoi » — un débat moins
              maniable
            </li>
            <li>
              <strong>Difficile à défendre en campagne :</strong> Les systèmes
              électoraux tendent à récompenser les promesses de nouveaux services ;
              un modèle qui traite toutes les dépenses comme coûteuses est plus
              difficile à traduire en programmes électoraux
            </li>
            <li>
              <strong>Friction institutionnelle :</strong> De larges pans de
              l'appareil de recherche et de politique sont intégrés dans le
              gouvernement ou financés par lui — une raison structurelle
              d'attendre une adoption lente des cadres qui remettent en question
              son périmètre
            </li>
          </ul>

          <h4 data-i18n="heading.quadratic-remained-useful">Pourquoi le modèle quadratique est resté utile</h4>
          <p>
            La courbe d'Armey traditionnelle est restée en circulation non pas
            nécessairement parce que les chercheurs la trouvaient plus
            convaincante, mais parce qu'elle constituait un point de référence
            commun praticable. Elle offrait aux deux camps des débats sur la
            politique budgétaire un vocabulaire partagé tout en laissant de la
            place au désaccord.
          </p>

          <div class="info-card">
            <h5 data-i18n="heading.quadratic-properties">Propriétés qui ont soutenu le modèle quadratique :</h5>
            <ul>
              <li>
                <strong>Flexibilité descriptive :</strong> Des niveaux de
                dépenses de 30–45 % du PIB, communs aux pays de l'OCDE, pouvaient
                être placés « près de l'optimum » sous des choix de paramètres
                raisonnables
              </li>
              <li>
                <strong>Soutient la politique incrémentale :</strong> De petits
                ajustements dans les deux sens pouvaient être justifiés dans le
                cadre
              </li>
              <li>
                <strong>Ancrage théorique :</strong> La forme en U inversé
                dispose d'une histoire plausible pour les deux phases, même si
                les données ne soutiennent pas clairement la phase montante
              </li>
              <li>
                <strong>Lisibilité bipartisane :</strong> Les conservateurs
                budgétaires comme les partisans de la dépense pouvaient l'utiliser
                sans concéder la prémisse centrale de l'autre camp
              </li>
            </ul>
          </div>

          <h4 data-i18n="heading.institutional-inertia">Inertie institutionnelle et changement de paradigme</h4>
          <p>
            Ce schéma n'est pas propre à la courbe d'Armey. Les paradigmes
            économiques tendent à persister jusqu'à ce que les anomalies
            empiriques qu'ils accumulent deviennent trop importantes à absorber
            — et le changement de paradigme est plus rapide lorsqu'il n'est pas
            également coûteux sur le plan institutionnel. Le modèle en loi de
            puissance pourrait gagner une acceptation plus large à mesure que :
          </p>
          <ul>
            <li>
              <strong>La pression budgétaire :</strong> les trajectoires
              d'endettement dans les économies à fortes dépenses forcent à
              reconsidérer ce que les dépenses publiques apportent réellement
            </li>
            <li>
              <strong>La divergence entre pays :</strong> si les économies à
              faibles dépenses continuent à surperformer, la pertinence
              politique du schéma devient plus difficile à ignorer
            </li>
            <li>
              <strong>Les substituts privés :</strong> les alternatives aux
              services publics portées par la technologie déplacent
              progressivement la perception de la nécessité de la fourniture
              gouvernementale
            </li>
            <li>
              <strong>La réplication indépendante :</strong> des chercheurs
              extérieurs au principal circuit universitaire-politique réexaminent
              les données et parviennent à des conclusions similaires
            </li>
          </ul>

          <h4 data-i18n="heading.opportunity-cost">Le coût d'opportunité du choix de modèle</h4>
          <p>
            Si le modèle en loi de puissance décrit mieux les données, alors
            les politiques calibrées sur un cadre quadratique ont probablement
            sous-livré en termes de croissance — non parce que les décideurs
            agissaient de mauvaise foi, mais parce que le modèle sur lequel ils
            optimisaient était erroné. Les enjeux de cette erreur se composent
            sur des décennies.
          </p>

          <p>
            <strong>Cela importe au-delà de la comparaison de modèles
            académiques.</strong>
            De petites sous-estimations systématiques du coût de croissance des
            dépenses publiques s'accumulent : un pays qui soutient une croissance
            annuelle inférieure de 0,3 % pendant trente ans est d'environ 10 %
            plus pauvre en termes réels qu'il ne l'aurait autrement été. Choisir
            le bon modèle n'est pas une note de bas de page technique — cela
            façonne la trajectoire des niveaux de vie.
          </p>

          <p>
            Il existe aussi un argument pro-croissance pour la viabilité
            politique du modèle en loi de puissance : les pays qui réduisent
            leurs dépenses et atteignent une croissance plus forte élargissent
            l'assiette fiscale, ce qui peut rendre la consolidation budgétaire
            auto-entretenue plutôt que simplement contractionniste. Les coûts
            de transition à court terme sont réels, mais la trajectoire à long
            terme est plus soutenable. La question de savoir si les systèmes
            politiques peuvent s'engager de manière crédible dans cette
            trajectoire est distincte de celle de savoir si l'économie
            sous-jacente est correcte.
          </p>`;

fr['prose.natural-rights'] = `      <section class="natural-rights-section">
        <h2 data-i18n="heading.right-to-growth">Le droit à la croissance économique</h2>

        <div class="right-card armey-specific">
          <div class="right-principle">
            <p>
              <strong>Droit économique fondamental :</strong> Chaque individu a
              le droit naturel de participer à une économie qui maximise la
              création de richesses et les opportunités. Ce droit est violé
              lorsque les politiques publiques réduisent systématiquement la
              croissance économique en deçà de son potentiel naturel, diminuant
              ainsi la prospérité et limitant l'épanouissement humain.
            </p>
            <p>
              <strong>Droit négatif :</strong> Liberté à l'égard des
              interférences gouvernementales qui réduisent de manière démontrable
              la croissance économique par des dépenses excessives, la fiscalité,
              la réglementation et la mauvaise allocation des ressources. Fondé
              sur les preuves empiriques montrant la relation en loi de puissance
              entre taille de l'État et performance économique, ce droit exige
              une intervention gouvernementale minimale dans l'activité
              économique.
            </p>
          </div>

          <h4 data-i18n="heading.empirical-foundation">Fondement empirique</h4>
          <div class="right-evidence">
            <p>
              <strong>L'argument fondé sur les données :</strong> Ce droit
              s'ancre dans un schéma cohérent entre pays : le modèle en loi de
              puissance ajusté sur 113 économies comparables montre une relation
              monotonement négative entre dépenses publiques et croissance, sans
              aucune preuve d'un seuil bénéfique. La preuve est une régression
              entre pays à variable unique — suggestive plutôt que conclusive —
              mais la direction est cohérente selon les spécifications de modèle,
              les périodes et les vérifications de robustesse.
            </p>
            <ul>
              <li>
                <strong>Singapour (17 % de dépenses, 2,8 % de croissance) :</strong>
                Illustre comment un gouvernement <em>budgétaire</em> sobre permet
                une performance soutenue élevée (même si des mécanismes hors
                budget comme le CPF et le HDB signifient que l'empreinte réelle
                de l'État est plus importante)
              </li>
              <li>
                <strong
                  >Stagnation européenne (35 %+ de dépenses, 0,5–1,5 % de
                  croissance) :</strong
                >
                Illustre le véritable coût d'un grand État pour la prospérité
                humaine
              </li>
              <li>
                <strong>Coût d'opportunité :</strong> Chaque point de pourcentage
                de dépenses publiques supplémentaires représente des milliers de
                milliards en richesse perdue sur des décennies
              </li>
            </ul>
          </div>

          <h4 data-i18n="heading.institutional-protections">Protections institutionnelles essentielles</h4>
          <div class="right-positive">
            <h4 data-i18n="heading.constitutional-frameworks">Cadres constitutionnels et juridiques :</h4>
            <ul>
              <li>
                <strong>Plafonds constitutionnels de dépenses :</strong> Limites
                strictes sur les dépenses publiques en pourcentage du PIB, avec
                des exigences de supermajorité pour toute augmentation. Les
                preuves empiriques montrent systématiquement une croissance plus
                forte en dessous de 25 % du PIB, bien qu'une cible
                constitutionnelle précise nécessite une analyse plus fine qu'une
                seule régression entre pays ne peut fournir
              </li>
              <li>
                <strong>Règle d'or budgétaire :</strong> Exigence constitutionnelle
                que les budgets publics soient équilibrés sur les cycles
                économiques, empêchant l'accumulation de dettes qui grèverait
                les générations futures d'obligations fiscales réductrice de
                croissance
              </li>
              <li>
                <strong>Garanties de concurrence fiscale :</strong> Cadres
                juridiques empêchant l'harmonisation fiscale et garantissant la
                concurrence entre juridictions, permettant aux citoyens de voter
                avec leurs pieds contre les politiques qui tuent la croissance
              </li>
              <li>
                <strong>Moratoire réglementaire :</strong> Présomption par défaut
                contre les nouvelles réglementations, avec des clauses
                d'extinction automatiques et des révisions périodiques exigeant
                une justification empirique pour la poursuite
              </li>
            </ul>

            <h4 data-i18n="heading.market-preserving">Institutions préservatrices des marchés :</h4>
            <ul>
              <li>
                <strong>Banque centrale indépendante :</strong> Politique
                monétaire isolée des pressions politiques, avec des mandats
                stricts de stabilité des prix empêchant l'impôt inflationniste
                qui érode l'épargne et l'investissement
              </li>
              <li>
                <strong>Évaluation de l'impact réglementaire :</strong> Analyse
                coûts-bénéfices obligatoire avec examen indépendant pour toute
                politique affectant la croissance économique, y compris les
                évaluations d'impact cumulatif entre agences
              </li>
              <li>
                <strong>Protection des droits de propriété :</strong> Cadres
                juridiques solides protégeant la propriété intellectuelle, les
                actifs physiques et les arrangements contractuels contre la
                saisie gouvernementale ou la prise réglementaire arbitraire
              </li>
              <li>
                <strong>Garanties du libre-échange :</strong> Protection
                constitutionnelle du commerce international et prévention des
                politiques protectionnistes qui réduisent l'efficacité économique
              </li>
            </ul>

            <h4 data-i18n="heading.transparency-accountability">Mécanismes de transparence et de responsabilité :</h4>
            <ul>
              <li>
                <strong>Rapports d'impact sur la croissance :</strong> Évaluation
                publique annuelle de la manière dont les politiques publiques ont
                affecté la croissance économique par rapport au potentiel, avec
                une responsabilité spécifique pour les décisions réductrices de
                croissance
              </li>
              <li>
                <strong>Comptabilité des coûts bureaucratiques :</strong>
                Transparence totale sur le coût économique de chaque programme
                gouvernemental, y compris les coûts d'opportunité et les effets
                dynamiques sur la croissance
              </li>
              <li>
                <strong>Comparaison internationale :</strong> Comparaison
                régulière avec les juridictions à gouvernement minimal pour
                illustrer le coût des choix politiques nationaux
              </li>
              <li>
                <strong>Qualité pour agir des citoyens :</strong> Qualité pour
                agir des contribuables pour contester les politiques réductrices
                de croissance devant les tribunaux, avec des procédures
                d'examen accélérées
              </li>
            </ul>
          </div>

          <h4 data-i18n="heading.current-threats">Menaces actuelles aux droits à la croissance économique</h4>
          <div class="right-enemies">
            <h4 data-i18n="heading.systemic-threats">Menaces institutionnelles systémiques :</h4>
            <ul>
              <li>
                <strong>Illusion budgétaire :</strong> Systèmes politiques qui
                dissimulent le véritable coût des dépenses publiques par le
                financement par endettement, rendant les électeurs inconscients
                de la croissance qu'ils sacrifient au profit de la consommation
                présente
              </li>
              <li>
                <strong>Capture réglementaire :</strong> Agences servant les
                intérêts des entreprises établies plutôt que l'efficacité
                économique, créant des barrières à l'entrée qui protègent les
                acteurs en place au détriment de l'innovation et de la
                concurrence
              </li>
              <li>
              <li>
                <strong>Court-termisme électoral :</strong> Systèmes
                démocratiques qui incitent les politiciens à promettre des
                bénéfices immédiats financés par des réductions futures de
                croissance, biaisant systématiquement les politiques contre la
                prospérité à long terme
              </li>
            </ul>

            <h4 data-i18n="heading.growth-destroying-policies">Politiques directement destructrices de croissance :</h4>
            <ul>
              <li>
                <strong>Monétisation de la dette :</strong> Financement par la
                banque centrale des déficits gouvernementaux créant une pression
                inflationniste qui fausse les décisions d'investissement et érode
                le pouvoir d'achat de l'épargne
              </li>
              <li>
                <strong>Charge fiscale agrégée élevée :</strong> Prélèvement
                fiscal total qui retire des ressources à l'allocation privée —
                indépendamment de sa structure. Les données capturent les
                dépenses publiques comme variable principale ; les impôts élevés
                sont le mécanisme par lequel les programmes gouvernementaux
                évincent l'investissement privé
              </li>
              <li>
                <strong>Charge de conformité réglementaire :</strong>
                Réglementations complexes et enchevêtrées imposant des coûts de
                conformité massifs aux entreprises, détournant des ressources
                d'activités productives vers la navigation bureaucratique
              </li>
              <li>
                <strong>Mandats non financés :</strong> Exigences
                gouvernementales imposant des coûts aux acteurs privés sans
                compensation, saisissant effectivement des ressources qui
                pourraient être investies productivement
              </li>
              <li>
                <strong>Politique budgétaire procyclique :</strong> Dépenses
                publiques amplifiant plutôt que lissant les cycles économiques,
                créant des booms artificiels suivis de récessions plus sévères
              </li>
              <li>
                <strong>Allocation de capital orientée politiquement :</strong>
                Dépenses guidées par des incitations électorales et de lobbying
                plutôt que par les rendements économiques — le mécanisme qui
                convertit de fortes dépenses agrégées en faible croissance,
                indépendamment des objectifs affichés
              </li>
            </ul>
          </div>

          <h4 data-i18n="heading.protecting-growth-rights">Protéger les droits à la croissance en pratique</h4>
          <div class="right-implementation">
            <p>
              <strong>Action individuelle :</strong> Les citoyens peuvent protéger
              leurs droits à la croissance en soutenant les candidats favorables
              à un État minimal, en s'établissant dans des juridictions à faible
              fiscalité et en faisant des choix économiques qui signalent une
              préférence pour des politiques favorables à la croissance.
            </p>
            <p>
              <strong>Action collective :</strong> Les conventions
              constitutionnelles, les initiatives citoyennes pour des limites de
              dépenses, les recours juridiques contre les politiques réductrices
              de croissance et les mouvements internationaux pour la concurrence
              fiscale peuvent institutionnaliser la protection de la croissance.
            </p>
            <p>
              <strong>L'objectif ultime :</strong> Un système politique et
              économique qui maximise la création de richesses en minimisant
              l'interférence gouvernementale, permettant à la créativité humaine
              et aux échanges volontaires d'atteindre leur plein potentiel. Les
              preuves entre pays pointent systématiquement dans cette direction —
              même si traduire un schéma agrégé à variable unique en une
              conception institutionnelle spécifique nécessite une analyse plus
              fine que ce modèle seul ne peut soutenir.
            </p>
          </div>
        </div>
      </section>`;

// ── write output ───────────────────────────────────────────────────────────

writeJson('armey-curve.en.json', en);
writeJson('armey-curve.fr.json', fr);

console.log('\nDone. Run: node scripts/audit-i18n.mjs && node scripts/build-locale.mjs fr');
