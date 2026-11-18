# Permutator docs

The public site for Permutator, a Figma plugin for design-system teams. Live at https://lukefinch.github.io/permutator-docs/.

The plugin's source is kept private; this repo holds only the website and its brand tooling.

## Layout

- `site/` is the static site that GitHub Pages serves. Pushing a change under it to `main` deploys it (`.github/workflows/pages.yml`).
- `scripts/tools.mjs` holds the copy for every tool. `npm run pages` turns it into `site/tools/` (an index plus one page per tool) and fills the highlights and catalog blocks on the home page. Edit the copy there, not in the generated HTML.
- `site/site.css` is the shared stylesheet for every page.
- `site/brand/render.js` draws the brand artwork. `render(config)` is a pure function of its config, seed included.
- `site/demos.js` and `site/demos.css` draw the looping animation in each tool card. Each demo is a pure function of time; add one by writing a `D['name']` entry and a matching `<div class="demo" data-demo="name">`.
- `lab/` is a dev-only generator for that artwork. It is not deployed.
- `scripts/build-og.mjs` renders the social card, `site/og.png`.

## Commands

```bash
npm run serve   # preview the site at http://localhost:4321
```

```bash
npm run lab     # brand lab at http://localhost:4322/lab/brand/
```

```bash
npm run pages   # rebuild site/tools/ and the home page's generated blocks from scripts/tools.mjs
```

```bash
npm install && npm run og   # re-render site/og.png (needs Playwright or Google Chrome)
```

In the lab, click the canvas for a new variation, adjust the knobs, and press Save. Saving writes the config to `lab/brand/saved/` and to `site/brand/config.json`. Then run `npm run pages` and `npm run og` to put it on the page and the social card.
