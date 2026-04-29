// Fix spurious backslash-escaping before forward slashes in prose.argument-aside
// The Python json.dump double-escaped existing \/ sequences into \\/ which
// renders as literal backslash-slash in the built HTML.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frPath = join(__dirname, '..', 'armey-curve.fr.json');

const fr = JSON.parse(readFileSync(frPath, 'utf8'));

// Remove spurious backslashes before forward slashes (e.g. <\/div> → </div>)
const key = 'prose.argument-aside';
if (fr[key]) {
  fr[key] = fr[key].replace(/\\\//g, '/');
  console.log('Fixed', key);
  console.log('Sample:', fr[key].slice(0, 120));
}

writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
console.log('Written armey-curve.fr.json');
