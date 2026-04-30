/**
 * add-dasgupta-key.mjs
 * Adds prose.dasgupta-reference-p to en and fr locale files.
 * Run: node scripts/add-dasgupta-key.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const base = resolve(__dir, '..');

function load(f) { return JSON.parse(readFileSync(f, 'utf8')); }
function save(f, o) { writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); }

const enPath = resolve(base, 'armey-curve.en.json');
const frPath = resolve(base, 'armey-curve.fr.json');
const en = load(enPath);
const fr = load(frPath);

en["prose.dasgupta-reference-p"] = "<strong>One empirical reference point: the planet, 1992&ndash;2014.</strong>\n            The Dasgupta Review's Headline Message 2 reports that over this\n            period global per-capita produced capital roughly doubled while\n            per-capita natural capital fell by roughly 40%\n            (<a href=\"https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review\" target=\"_blank\" rel=\"noopener\">Dasgupta 2021</a>;\n            corroborated by the World Bank's\n            <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\"><em>Changing Wealth of Nations</em> 2021</a>).\n            Run those through the IWC lens: $\\Delta K_{\\text{produced}} > 0$,\n            but $\\Delta K_{\\text{natural}} \\ll 0$ for parties\n            &mdash; future generations, downstream ecosystems &mdash; who are\n            external to the trade. Whether\n            $\\sum_k p_k\\,\\Delta K_k$ was net-positive or net-negative overall\n            depends on shadow prices, which is exactly what the Review argues\n            we have been omitting from standard GDP accounting. The criterion\n            doesn't pretend to settle those shadow-price disputes; it forces\n            them into the open. A growth statistic that aggregates\n            +100% produced capital with &minus;40% natural capital into a single\n            cheerful headline number is not measuring wealth &mdash; it is\n            measuring one column of a ledger while pretending the others don't exist.";

fr["prose.dasgupta-reference-p"] = "<strong>Un point de référence empirique : la planète, 1992&ndash;2014.</strong>\n            Le Message principal 2 du Rapport Dasgupta indique que sur cette\n            période, le capital produit mondial par habitant a environ doublé tandis que\n            le capital naturel par habitant a chuté d'environ 40 %\n            (<a href=\"https://www.gov.uk/government/publications/final-report-the-economics-of-biodiversity-the-dasgupta-review\" target=\"_blank\" rel=\"noopener\">Dasgupta 2021</a> ;\n            corroboré par la\n            <a href=\"https://www.worldbank.org/en/publication/changing-wealth-of-nations\" target=\"_blank\" rel=\"noopener\"><em>Changing Wealth of Nations</em> 2021 de la Banque mondiale</a>).\n            Passés au crible IWC : $\\Delta K_{\\text{produit}} > 0$,\n            mais $\\Delta K_{\\text{naturel}} \\ll 0$ pour les parties\n            &mdash; générations futures, écosystèmes en aval &mdash; qui sont\n            externes à l'échange. Que\n            $\\sum_k p_k\\,\\Delta K_k$ soit globalement positif ou négatif\n            dépend des prix d'ombre, ce qui est exactement ce que le Rapport Dasgupta affirme\n            avoir omis de la comptabilité PIB standard. Le critère\n            ne prétend pas régler ces disputes de prix d'ombre ; il les\n            force au grand jour. Une statistique de croissance qui agrège\n            +100 % de capital produit avec &minus;40 % de capital naturel en un seul\n            nombre satisfaisant n'est pas en train de mesurer la richesse &mdash; il\n            mesure une colonne d'un grand livre en faisant semblant que les autres n'existent pas.";

save(enPath, en);
save(frPath, fr);
console.log('Added prose.dasgupta-reference-p to en and fr locale files.');
