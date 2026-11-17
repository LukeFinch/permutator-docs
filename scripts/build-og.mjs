// Renders site/og.png (1200×630 social card). Run: node scripts/build-og.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = readFileSync(path.join(root, 'site/fonts/bricolage-grotesque-latin.woff2')).toString('base64');

const tokens = ['brand', 'neutral', 'danger'].flatMap(r => ['bg', 'fg', 'border'].map(e => `surface/${r}/${e}`));

const html = `<!doctype html><html><head><style>
@font-face{font-family:B;src:url("data:font/woff2;base64,${font}") format("woff2");font-weight:700 800}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:oklch(0.975 0.006 255);color:oklch(0.24 0.03 260);font-family:-apple-system,system-ui,sans-serif;display:grid;grid-template-columns:1.05fr 1fr;gap:56px;padding:72px 80px;align-items:center}
.brand{display:flex;gap:12px;align-items:center;font:800 30px B}
h1{font:800 76px/0.98 B;letter-spacing:-0.03em;margin:28px 0 0}em{font-style:normal;color:oklch(0.53 0.19 262)}
p{font-size:25px;color:oklch(0.47 0.025 260);margin:26px 0 0;line-height:1.4}
.card{background:#fff;border:1px solid oklch(0.89 0.012 255);border-radius:20px;padding:30px;box-shadow:0 24px 60px -24px oklch(0.3 0.05 260/.3)}
.f{font:500 22px ui-monospace,Menlo,monospace;color:oklch(0.47 0.025 260)}.f b{font:800 44px B;color:oklch(0.53 0.19 262)}
ul{list-style:none;margin:18px 0 0;padding:16px 20px;background:oklch(0.975 0.006 255);border-radius:12px;font:19px/1.75 ui-monospace,Menlo,monospace;columns:1}
li span{color:oklch(0.6 0.02 260)}
</style></head><body>
<div><div class="brand"><svg width="34" height="34" viewBox="0 0 24 24"><g fill="oklch(0.53 0.19 262)"><rect x="2" y="2" width="9" height="9" rx="2.5"/><rect x="13" y="2" width="9" height="9" rx="2.5" opacity=".45"/><rect x="2" y="13" width="9" height="9" rx="2.5" opacity=".45"/><rect x="13" y="13" width="9" height="9" rx="2.5" opacity=".2"/></g></svg>Permutator</div>
<h1>Your token system, <em>multiplied</em> out for you.</h1>
<p>20 Figma tools to generate, rewire and audit variables.</p></div>
<div class="card"><div class="f">3 × 3 = <b>9</b> variables</div><ul>${tokens.map(t => `<li><span>${t.split('/').slice(0, 1)}/</span>${t.split('/').slice(1).join('<span>/</span>')}</li>`).join('')}</ul></div>
</body></html>`;

// Uses installed Google Chrome if Playwright's own browser isn't downloaded.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, 'site/og.png') });
await browser.close();
console.log('wrote site/og.png');
