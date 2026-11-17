// Bakes the brand artwork into site/index.html as static SVG, so it renders without JS and never shifts layout.
// Reads site/brand/config.json (written by the lab's Save button). Run: npm run brand
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../site/brand/render.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(root, 'site/index.html');
const config = JSON.parse(await readFile(path.join(root, 'site/brand/config.json'), 'utf8'));

// The hero is the saved config itself (only placed if the page has hero markers; the social card always uses it). Each workspace strip runs a different mode of the same programme,
// one row deep, all in ink.
const strip = { rows: 1, cols: 10, gap: 22, disorder: 0 };
const pieces = {
  hero: { ...config },
  generate: { ...config, ...strip, mode: 'lines', linesMin: 2, linesStep: 3, lenMin: 0.5, lenMax: 0.5 },
  experimental: { ...config, ...strip, mode: 'arcs', arcMax: 1 },
  variables: { ...config, ...strip, mode: 'bars', countMin: 3, countStep: 0 },
  audit: { ...config, ...strip, mode: 'cubes' },
};

let html = await readFile(page, 'utf8');
for (const [name, cfg] of Object.entries(pieces)) {
  const re = new RegExp(`(<!-- brand:${name} -->)[\\s\\S]*?(<!-- /brand:${name} -->)`);
  if (!re.test(html)) { console.log(`skipped ${name}: no <!-- brand:${name} --> markers on the page`); continue; }
  const { svg, caption } = render(cfg, { uid: name });
  html = html.replace(re, `$1${svg}$2`);
  if (name === 'hero') {
    // The hero's rule is stated in words on the sheet's caption band.
    html = html.replace(/(<!-- brand:rule -->)[\s\S]*?(<!-- \/brand:rule -->)/, `$1${caption}$2`);
    html = html.replace(/(<!-- brand:seed -->)[\s\S]*?(<!-- \/brand:seed -->)/, `$1${cfg.seed}$2`);
  }
}
await writeFile(page, html);
console.log('baked brand artwork into site/index.html');
