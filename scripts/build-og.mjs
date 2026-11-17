// Renders site/og.png (1200×630 social card) from the saved brand config, laid out as a diagram sheet. Run: npm run og
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '../site/brand/render.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = f => readFileSync(path.join(root, 'site/fonts', f)).toString('base64');
const config = JSON.parse(readFileSync(path.join(root, 'site/brand/config.json'), 'utf8'));
const art = render({ ...config, cols: 6, rows: 1 }, { uid: 'og' }).svg;

// Same thresholded ink palette the site uses, so Coral Pixels renders as crisp ink pixels without its colour fringe.
const alphas = [0x26, 0x3d, 0x4f, 0x24, 0x1c, 0xf0, 0xf0, 0xfc, 0x26, 0xf5, 0x4a, 0x99, 0xcf, 0xf0, 0x4d, 0x1f, 0x80, 0x59, 0x9e, 0x4f, 0x42, 0x61, 0x69, 0x99, 0xc4, 0xa6, 0x75, 0x8c, 0xa6, 0x9c, 0xa1, 0xff];
const palette = alphas.map((a, i) => `${i} rgba(17, 17, 17, ${a / 255 >= 0.5 ? 1 : 0})`).join(', ');

const html = `<!doctype html><html><head><style>
@font-face{font-family:"Coral Pixels";src:url("data:font/woff2;base64,${font('coral-pixels-latin.woff2')}") format("woff2")}
@font-face{font-family:"Source Serif 4";src:url("data:font/woff2;base64,${font('source-serif-4-latin-var.woff2')}") format("woff2");font-weight:200 900}
@font-palette-values --ink{font-family:"Coral Pixels";override-colors:${palette}}
*{box-sizing:border-box}
body{margin:0;width:1200px;height:630px;background:${config.paper};color:${config.ink};padding:36px;--pm-ink:${config.ink}}
.sheet{height:100%;border:1.5px solid ${config.ink};display:grid;grid-template-rows:auto 1fr auto}
.head{border-bottom:1.5px solid ${config.ink};padding:22px;text-align:center;font:40px/1 "Coral Pixels";font-palette:--ink;letter-spacing:.55em;text-indent:.55em;text-transform:uppercase}
.body{padding:40px 64px;display:grid;align-content:center;gap:34px}
h1{margin:0;font:54px/1.05 "Coral Pixels";font-palette:--ink;font-weight:400}
.body svg{width:100%;height:auto;display:block}
.foot{border-top:1.5px solid ${config.ink};padding:20px 64px;font:400 24px/1.3 "Source Serif 4"}
</style></head><body><div class="sheet">
<div class="head">Permutator</div>
<div class="body"><h1>Your token system, multiplied out for you.</h1>${art}</div>
<div class="foot">A Figma plugin for design-system teams: 20 tools to generate, rewire and audit variables.</div>
</div></body></html>`;

// Uses installed Google Chrome if Playwright's own browser isn't downloaded.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'site/og.png') });
await browser.close();
console.log('wrote site/og.png');
