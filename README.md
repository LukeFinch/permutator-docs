# Permutator docs

The public site for Permutator, a Figma plugin for design-system teams. Live at https://lukefinch.github.io/permutator-docs/.

The plugin's source is kept private; this repo holds only the website and its brand tooling.

## Layout

- `site/` is the static site that GitHub Pages serves. Pushing a change under it to `main` deploys it (`.github/workflows/pages.yml`).
- `site/brand/render.js` draws the brand artwork. `render(config)` is a pure function of its config, seed included.
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
npm install && npm run og   # re-render site/og.png (needs Playwright or Google Chrome)
```

In the lab, click the canvas for a new variation, adjust the knobs, and press Save. Saving writes the config to `lab/brand/saved/` and to `site/brand/config.json`, the file the site reads.
