// Builds the tool pages from scripts/tools.mjs, and fills the generated parts of the home page.
// Writes site/tools/index.html, site/tools/<slug>/index.html, and the <!-- gen:NAME --> blocks in site/index.html.
// Brand strips are rendered from site/brand/config.json. Run: npm run pages
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../site/brand/render.js';
import { tools, workspaces, highlights } from './tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const URL_BASE = 'https://lukefinch.github.io/permutator-docs/';
const config = JSON.parse(await readFile(path.join(site, 'brand/config.json'), 'utf8'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = { rows: 1, cols: 10, gap: 22, disorder: 0 };
const stripCfg = {
  lines: { mode: 'lines', linesMin: 2, linesStep: 3, lenMin: 0.5, lenMax: 0.5 },
  arcs: { mode: 'arcs', arcMax: 1 },
  bars: { mode: 'bars', countMin: 3, countStep: 0 },
  cubes: { mode: 'cubes' },
};
const wsOf = (t) => workspaces.find((w) => w.id === t.ws);
const wsNo = (w) => `${workspaces.indexOf(w) + 1} / ${workspaces.length}`;
const tagHtml = (t) => (t.tags || []).map((g) => `<span class="tag${g === 'new' ? ' new' : ''}">${g === 'new' ? 'New' : 'Read-only'}</span>`).join(' ');
const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function page({ base, url, title, desc, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${URL_BASE}${url}">
<meta name="theme-color" content="#fcfcfa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101010" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${URL_BASE}${url}">
<meta property="og:image" content="${URL_BASE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}fonts/redaction-35-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}fonts/source-serif-4-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}site.css">
<link rel="stylesheet" href="${base}demos.css">
</head>
<body>

<header class="site-header">
  <div class="wrap">
    <a class="wordmark display" href="${base}">Permutator</a>
    <nav class="site-nav" aria-label="Sections">
      <a href="${base}#highlights">Highlights</a>
      <a href="${base}tools/">All tools</a>
      <a href="${base}#status">Status</a>
    </nav>
    <a class="btn" href="${base}#status">Coming soon</a>
  </div>
</header>

<main id="top" class="wrap">
${body}
  <footer>
    <span>Permutator, a Figma plugin by Luke Finch</span>
  </footer>
</main>
<script src="${base}demos.js" defer></script>
</body>
</html>
`;
}

// A card: demo, name, one-liner, link to the tool's page. `base` is the path from the card's page to site/.
const card = (t, base) => `      <article class="tool">
        <div class="demo" data-demo="${t.slug}" aria-hidden="true"></div>
        <h3><a href="${base}tools/${t.slug}/">${esc(t.name)}</a> ${tagHtml(t)}</h3>
        <p class="line">${t.line}</p>
        <a class="more" href="${base}tools/${t.slug}/" aria-label="More about ${esc(t.name)}">More</a>
      </article>`;

// ---------- Tools index ----------
const sheets = workspaces.map((w, i) => {
  const { svg } = render({ ...config, ...strip, ...stripCfg[w.strip] }, { uid: w.id });
  const list = tools.filter((t) => t.ws === w.id);
  return `  <section class="sheet workspace" id="${w.id}" aria-labelledby="ws${i + 1}">
    <div class="sheet-head"><span class="no">${wsNo(w)}</span><h2 class="display" id="ws${i + 1}">${w.name}</h2></div>
    <div class="strip" aria-hidden="true">${svg}</div>
    <div class="list">
${list.map((t) => card(t, '../')).join('\n')}
    </div>
    <div class="sheet-foot"><p>${w.blurb}</p></div>
  </section>`;
}).join('\n\n');

const indexBody = `  <section class="page-intro">
    <p class="crumbs"><a href="../">Home</a><span>/</span><span>Tools</span></p>
    <h1 class="display">${tools.length} tools in ${workspaces.length} workspaces.</h1>
    <p class="lede">They work on their own, and they chain. A typical run goes from understanding what's in the file, to generating primitives, to mapping the semantic layer, to rebinding screens, to keeping it clean.</p>
  </section>

  <nav class="index" aria-label="Workspaces">
    ${workspaces.map((w) => `<a href="#${w.id}">${w.name} · ${tools.filter((t) => t.ws === w.id).length}</a>`).join('\n    ')}
  </nav>

${sheets}
`;

await rm(path.join(site, 'tools'), { recursive: true, force: true });
await mkdir(path.join(site, 'tools'), { recursive: true });
await writeFile(path.join(site, 'tools/index.html'), page({
  base: '../', url: 'tools/',
  title: 'All tools · Permutator',
  desc: `All ${tools.length} Permutator tools for Figma variables: generate tokens, rewire layers and audit libraries.`,
  body: indexBody,
}));

// ---------- One page per tool ----------
for (const [i, t] of tools.entries()) {
  const w = wsOf(t);
  const prev = tools[i - 1], next = tools[i + 1];
  const body = `  <section class="page-intro">
    <p class="crumbs"><a href="../../">Home</a><span>/</span><a href="../">Tools</a><span>/</span><a href="../#${w.id}">${w.name}</a></p>
  </section>

  <article class="sheet tool-page" aria-labelledby="tool-title">
    <div class="sheet-head"><span class="no">${wsNo(w)}</span><h1 class="display" id="tool-title">${esc(t.name)}</h1></div>
    <div class="stage"><div class="demo" data-demo="${t.slug}" aria-hidden="true"></div></div>
    <div class="detail">
      <p class="pitch display">${t.line}</p>
      <div class="text">
        <p>${t.body}</p>
        <p class="benefit"><b>Why it helps</b>${t.why}</p>
        ${t.sample ? `<div class="sample">${t.sample}</div>` : ''}
      </div>
    </div>
    ${t.tags ? `<div class="sheet-foot"><p>${tagHtml(t)}</p></div>` : ''}
  </article>

  <nav class="pager" aria-label="More tools">
    ${prev ? `<a href="../${prev.slug}/"><small>Previous</small><b>${esc(prev.name)}</b></a>` : '<span></span>'}
    ${next ? `<a href="../${next.slug}/"><small>Next</small><b>${esc(next.name)}</b></a>` : `<a href="../"><small>Back to</small><b>All tools</b></a>`}
  </nav>
`;
  await mkdir(path.join(site, 'tools', t.slug), { recursive: true });
  await writeFile(path.join(site, 'tools', t.slug, 'index.html'), page({
    base: '../../', url: `tools/${t.slug}/`,
    title: `${t.name} · Permutator`,
    desc: `${plain(t.line)} ${plain(t.body)}`,
    body,
  }));
}

// ---------- Home page blocks ----------
const blocks = {
  highlights: `\n${highlights.map((s) => card(tools.find((t) => t.slug === s), '')).join('\n')}\n      `,
  catalog: `\n${workspaces.map((w) => `      <div>
        <h3>${w.name}</h3>
        <ul>
${tools.filter((t) => t.ws === w.id).map((t) => `          <li><a href="tools/${t.slug}/">${esc(t.name)}</a></li>`).join('\n')}
        </ul>
      </div>`).join('\n')}\n      `,
};
const homePath = path.join(site, 'index.html');
let home = await readFile(homePath, 'utf8');
for (const [name, html] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- gen:${name} -->)[\\s\\S]*?(<!-- /gen:${name} -->)`);
  if (!re.test(home)) throw new Error(`site/index.html has no <!-- gen:${name} --> block`);
  home = home.replace(re, `$1${html}$2`);
}
await writeFile(homePath, home);
console.log(`wrote tools/index.html, ${tools.length} tool pages, and the home page's highlights and catalog`);
