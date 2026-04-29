/**
 * Populates armey-curve.en.json and armey-curve.fr.json with FAQ keys.
 *
 * EN values come from faq-data.mjs (single source of truth).
 * FR values are defined inline below.
 *
 * Keys generated:
 *   faq.N.q    — question text (used on <summary data-i18n="faq.N.q">)
 *   faq.N.html — rich HTML answer (used in <!-- i18n:faq.N.html:start/end -->)
 *
 * Run: node scripts/add-faq-translations.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FAQ } from '../faq-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..');

function readJson(name) {
  return JSON.parse(readFileSync(join(dir, name), 'utf8'));
}
function writeJson(name, data) {
  writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`✔ wrote ${name}`);
}

const en = readJson('armey-curve.en.json');
const fr = readJson('armey-curve.fr.json');

// ── EN: copy directly from faq-data.mjs ────────────────────────────────────

for (let i = 0; i < FAQ.length; i++) {
  const f = FAQ[i];
  en[`faq.${i}.q`] = f.q;
  en[`faq.${i}.html`] = f.html
    ? f.html
    : `<p>${f.jsonA.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
}

// ── FR translations ─────────────────────────────────────────────────────────

const FR_Q = [
  "Qu'est-ce que la courbe d'Armey ?",
  "Des dépenses publiques plus élevées réduisent-elles la croissance économique ?",
  "Quelle est la taille optimale de l'État ?",
  "À quoi l'État devrait-il réellement servir ?",
  "Mais les pays nordiques ne sont-ils pas riches malgré de grands États ?",
  "Pourquoi les économistes ne promeuvent-ils pas le modèle en loi de puissance ?",
  "Les données contredisent-elles le modèle de croissance est-asiatique ?",
  "Que révèle l'histoire d'avant la Seconde Guerre mondiale sur les dépenses publiques et la croissance ?",
  "Qu'en est-il des États défaillants et des pays à très faibles dépenses publiques ?",
  "Si les dépenses publiques freinent toujours la croissance, que devrait réellement faire l'État ?",
  "Pourquoi utiliser la richesse inclusive plutôt que le PIB comme critère d'intervention ?",
  "Que montre le diagramme en quadrants 2×2 ?",
  "Le critère ajoute-t-il une troisième condition au-delà de la richesse et du consentement ?",
];

const FR_HTML = [
  // 0 — What is the Armey Curve?
  `<p>
              La courbe d'Armey est une relation théorique entre les dépenses
              publiques en pourcentage du PIB et la croissance économique. Elle
              propose une forme en U inversé avec une taille gouvernementale
              optimale d'environ 20&ndash;30 % du PIB. Les données entre pays
              remettent cela en cause : une loi de puissance (relation
              monotonement décroissante) correspond systématiquement mieux aux
              preuves empiriques.
            </p>`,

  // 1 — Does more government spending reduce economic growth?
  `<p>
              Les données mondiales de la Banque mondiale montrent
              systématiquement une corrélation négative entre les dépenses
              publiques en pourcentage du PIB et les taux de croissance du PIB.
              Les pays à gouvernement plus restreint (Singapour ~15 %,
              Bangladesh ~9 %) tendent à surpasser leurs pairs à fortes
              dépenses. La relation correspond mieux à une loi de puissance
              qu'à la courbe d'Armey quadratique traditionnelle :
              R&sup2;&nbsp;=&nbsp;0,4219
              (IC 95 % approx. : 0,28&ndash;0,56) contre 0,3856 pour le
              modèle quadratique &mdash; sur 113 pays dans l'échantillon
              structurel 2005&ndash;2023.
              L'IC est calculé par la transformation Z de Fisher sur le
              coefficient de corrélation.
            </p>`,

  // 2 — What is the optimal size of government?
  `<p>
              Les données ne permettent pas d'établir une taille optimale
              précise. Contrairement à la courbe d'Armey quadratique qui
              implique un point optimal, les modèles en loi de puissance
              suggèrent que la croissance est la plus élevée aux niveaux de
              dépenses les plus bas réalisables. Les pays en dessous de 25 % du
              PIB surpassent systématiquement leurs pairs à plus fortes dépenses,
              mais un plafond constitutionnel précis ne peut être déduit d'une
              seule régression entre pays.
            </p>`,

  // 3 — What should government actually be used for?
  `<p>
              Si les dépenses publiques freinent systématiquement l'activité
              économique, leur usage le plus défendable est celui d'un frein
              sélectif sur les activités nuisibles &mdash; pollution, surpêche,
              risque financier systémique &mdash; où les acteurs privés imposent
              des coûts à autrui. Un gouvernement centré sur la correction des
              externalités négatives via des règles de responsabilité ou des
              réglementations ciblées étroites peut améliorer le bien-être tout
              en restant modeste en termes budgétaires.
            </p>`,

  // 4 — But aren't the Nordic countries rich with big governments?
  `<p>
              Oui &mdash; mais leurs <em>taux de croissance</em> ne sont pas
              élevés. Le Danemark a affiché en moyenne ~1,0 % et la Finlande
              ~0,9 % de croissance du PIB sur la période 2005&ndash;2019 :
              exactement là où le modèle en loi de puissance place les pays à
              fortes dépenses. Leur richesse est l'héritage d'une
              industrialisation construite lorsque leurs gouvernements étaient
              plus modestes. La Suède est le cas le plus probant : elle a réduit
              ses dépenses de 67 % à ~49 % du PIB entre 1993 et 2007 et a
              connu ses meilleures décennies de croissance immédiatement après.
              La richesse (un stock) persiste longtemps après que les conditions
              qui l'ont créée ont changé ; les taux de croissance (un flux)
              réagissent plus rapidement. Les pays nordiques sont riches
              <em>malgré</em> leurs niveaux de dépenses actuels, non grâce à eux.
            </p>`,

  // 5 — Why don't economists promote the power law model?
  `<p>
              Une dynamique de choix public est probablement à l'œuvre : quand
              les gouvernements financent la majeure partie de la recherche
              économique et des postes de politique publique, les incitations
              institutionnelles favorisent les cadres compatibles avec une
              intervention gouvernementale continue. Comme James Buchanan l'a
              soutenu, les économistes répondent aux incitations comme tout le
              monde &mdash; la théorie tend à prendre du retard sur les preuves
              quand la commodité politique et les structures de financement
              favorisent une conclusion particulière.
            </p>`,

  // 6 — Does the data contradict the East Asian growth model?
  `<p>
              Pas nécessairement. La Corée du Sud et Taïwan ont atteint une
              croissance de 7&ndash;9 % avec des dépenses modérées (~18&ndash;20 %
              du PIB) parallèlement à une politique industrielle significative.
              Leur expérience montre que le niveau total des dépenses et la
              qualité institutionnelle &mdash; non l'absence de toute intervention
              de l'État &mdash; sont ce que les régressions entre pays captent
              principalement. Les programmes ciblés dans le cadre d'un budget
              global sobre sont différents des larges États-providence à fortes
              dépenses.
            </p>`,

  // 7 — What does pre-WWII history show?
  `<p>
              Avant la Seconde Guerre mondiale, les gouvernements d'Europe
              occidentale dépensaient environ
              <strong>10&ndash;15 % du PIB</strong> et la croissance annuelle
              par habitant atteignait <strong>~2&ndash;3 %</strong> &mdash;
              cohérent avec ce que la courbe en loi de puissance projette à
              ces niveaux de dépenses. L'expansion d'après-guerre de l'État
              providence a déplacé chaque grande économie occidentale vers la
              droite sur la courbe, dans la zone de faible croissance. Là où
              les économies à fortes dépenses ont soutenu une croissance rapide,
              des facteurs de composition &mdash; parts d'investissement élevées,
              convergence de rattrapage ou financement hors budget &mdash; tendent
              à expliquer l'exception.
            </p>`,

  // 8 — What about failed states and very low spending?
  `<p>
              Aucun pays du panel de la Banque mondiale n'a des dépenses
              publiques inférieures à ~8 % du PIB. Ce plancher n'est pas
              aléatoire : les territoires avec un gouvernement formel quasi nul
              s'effondrent et perdent leur couverture par la Banque mondiale, ou
              s'informalisent au point que la mesure du PIB devient impossible.
              Mais cette absence peut elle-même refléter un problème de mesure
              et de classification plutôt qu'un plancher économique réel. Hernando
              de Soto a documenté dans <em>Le Mystère du capital</em> que les
              économies informelles des territoires à faible État sont larges et
              réelles mais invisibles pour les comptabilités nationales. Ce que
              les institutions internationales qualifient d'&ldquo;État
              défaillant&rdquo; signifie souvent &ldquo;un territoire qui
              autorise des transactions que nous avons interdites&rdquo; &mdash;
              marchés de drogues, finance non régulée, travail informel. Ces
              transactions représentent de réels gains de bien-être selon la
              préférence révélée. Les données ne peuvent pas se prononcer sur la
              plage inférieure à 8 %, et la preuve apparente contre les États
              très petits peut en partie refléter des choix de mesure plutôt que
              la réalité économique.
            </p>`,

  // 9 — If government spending always slows growth, what should it do?
  `<p>
              La courbe empirique répond à <em>combien</em> mais pas à
              <em>pour quoi</em>. L'article propose une règle à deux conditions :
              le gouvernement ne doit freiner une activité que lorsque (1) elle
              réduit la <strong>richesse inclusive</strong> &mdash; la valeur
              actualisée de tous les stocks de capital productif : produit,
              humain, naturel, de connaissance et institutionnel &mdash; et (2)
              une partie affectée n'a <strong>jamais consenti</strong> à
              supporter le coût. Les activités satisfaisant les deux conditions
              sont de véritables externalités négatives : pollution, épuisement
              des ressources au-delà des taux de régénération, risque financier
              systémique. Les activités qui échouent à l'une ou l'autre condition
              &mdash; transactions consensuelles, innovations créatrices de
              richesse, ou choix de mode de vie ne nuisant qu'au choix lui-même
              &mdash; sont hors du champ du critère.
            </p>`,

  // 10 — Why use inclusive wealth rather than GDP?
  `<p>
              Le PIB peut être gonflé par les pathologies mêmes qu'un frein
              devrait cibler. L'extraction d'un champ pétrolier booste le PIB
              tout en épuisant le capital naturel ; les transferts recyclent à
              travers le PIB sans créer de richesse ; les transactions coercitives
              s'enregistrent comme activité économique. La richesse inclusive &mdash;
              la somme aux prix fictifs de tous les stocks de capital productif
              &mdash; ne peut pas être manipulée de la même façon : épuiser le
              capital naturel sans réinvestir ailleurs la réduit par construction.
              Le cadre s'appuie sur la
              <a href="https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review" target="_blank" rel="noopener">revue Dasgupta (2021)</a>
              et la tradition de comptabilité de la richesse unifiée
              <a href="https://www.aeaweb.org/articles?id=10.1257/0895330042162377" target="_blank" rel="noopener">Arrow, Dasgupta &amp; M&auml;ler (2004)</a>.
            </p>`,

  // 11 — What does the 2×2 quadrant diagram show?
  `<p>
              Deux questions binaires &mdash; toutes les parties affectées
              ont-elles consenti ? la richesse inclusive augmente-t-elle ou
              diminue-t-elle ? &mdash; produisent quatre quadrants. Trois des
              quatre disent à l'État de ne rien faire : consensuel et
              enrichissant (encourager ou laisser faire) ; consensuel et
              appauvrissant (laisser faire &mdash; leur perte, leur choix) ;
              non consensuel et enrichissant (rare ; investiguer mais ne pas
              freiner par réflexe). Seul le quatrième quadrant &mdash;
              non consensuel et appauvrissant &mdash; donne à l'État une
              légitimité objective pour agir. C'est un mandat bien plus étroit
              que &ldquo;ce que veut l'électeur médian&rdquo; et bien plus large
              que &ldquo;l'État ne devrait jamais agir.&rdquo;
            </p>`,

  // 12 — Does the criterion add a third condition?
  `<p>
              Oui. Même lorsque les deux conditions sont réunies &mdash; la
              richesse diminue, le consentement est absent &mdash; l'État devrait
              tout de même s'abstenir si le frein lui-même coûte plus que le
              dommage qu'il prévient. Le troisième filtre additionne la perte
              sèche (le triangle de Harberger), le coût d'application et le
              risque attendu de capture réglementaire, et compare ce total à
              l'ampleur de la perte de richesse. Si
              <code>coûtFrein &gt; |&Delta;W|</code>, le remède est pire que le
              mal. C'est le correctif standard de l'école des choix publics :
              les taxes pigouviennes et la négociation coasienne ne dominent les
              marchés non réglementés que lorsque les coûts de transaction et de
              gouvernance sont suffisamment faibles pour les rendre réalisables.
            </p>`,
];

for (let i = 0; i < FAQ.length; i++) {
  fr[`faq.${i}.q`] = FR_Q[i];
  fr[`faq.${i}.html`] = FR_HTML[i];
}

writeJson('armey-curve.en.json', en);
writeJson('armey-curve.fr.json', fr);
console.log(`\nAdded ${FAQ.length} FAQ entries (faq.0.q … faq.${FAQ.length - 1}.html) to both JSON files.`);
console.log('Next: node scripts/inject-faq.mjs && node scripts/audit-i18n.mjs && node scripts/build-locale.mjs fr');
