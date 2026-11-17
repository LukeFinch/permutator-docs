// Permutator brand renderer. render(config) -> { svg, caption } is a pure function of config (seed included).
// Rules (fixed): unit grid, the whole matrix is drawn, one pen width, paper + ink + one signal colour,
// at most three varying parameters per mode, a caption stating the rule.

export const DEFAULTS = {
  version: 1,
  seed: 1964,
  mode: 'cubes', // cubes | arcs | bars | type
  cols: 8,
  rows: 3,
  gap: 18,
  stroke: 3,
  // cubes
  minEdges: 3,
  maxEdges: 9,
  connected: true,
  stride: 7,
  // arcs
  arcMax: 4,
  // bars
  angleMin: 0,
  angleMax: 157.5,
  countMin: 1,
  countStep: 2,
  // type
  text: 'Pm',
  wdthMin: 62,
  wdthMax: 125,
  wghtMin: 200,
  wghtMax: 900,
  fontSize: 56,
  // disorder (Molnár)
  disorder: 0.08,
  disorderKind: 'rotate', // rotate | drop | drift
  disorderAmount: 0.5,
  // signal
  signalRule: 'diagonal', // none | row | column | diagonal | scatter
  signalIndex: 0,
  signalCount: 3,
  signalHue: 40,
  signalChroma: 0.2,
  signalLightness: 0.62,
  ink: '#121212',
  paper: '#f6f6f3',
};

const CELL = 100;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function signalColor(c) {
  return `oklch(${c.signalLightness} ${c.signalChroma} ${c.signalHue})`;
}

const fmt = n => (Math.round(n * 100) / 100).toString();
const lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ---- cube geometry (isometric) ----
const VERTS = [];
for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) VERTS.push([x, y, z]);
const EDGES = [];
for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
  const d = VERTS[i].reduce((s, v, k) => s + Math.abs(v - VERTS[j][k]), 0);
  if (d === 1) EDGES.push([i, j]);
}
function iso([x, y, z]) {
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
  return [(x - z) * c, (x + z) * s - y];
}
const ISO = VERTS.map(iso);
const isoXs = ISO.map(p => p[0]), isoYs = ISO.map(p => p[1]);
const ISO_BOX = { x0: Math.min(...isoXs), x1: Math.max(...isoXs), y0: Math.min(...isoYs), y1: Math.max(...isoYs) };

const maskCache = new Map();
function cubeMasks(minE, maxE, connected) {
  const key = `${minE}-${maxE}-${connected}`;
  if (maskCache.has(key)) return maskCache.get(key);
  const out = [];
  for (let m = 1; m < 4096; m++) {
    let pc = 0; for (let b = m; b; b &= b - 1) pc++;
    if (pc < minE || pc > maxE) continue;
    if (connected && !isConnected(m)) continue;
    out.push([pc, m]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const list = out.map(o => o[1]);
  maskCache.set(key, list);
  return list;
}
function isConnected(mask) {
  const parent = [0, 1, 2, 3, 4, 5, 6, 7];
  const find = v => (parent[v] === v ? v : (parent[v] = find(parent[v])));
  const touched = new Set();
  EDGES.forEach(([a, b], i) => {
    if (mask & (1 << i)) { touched.add(a); touched.add(b); parent[find(a)] = find(b); }
  });
  const roots = new Set([...touched].map(find));
  return roots.size === 1;
}

// ---- per-mode cell drawing; each returns { body, params } in cell-local units 0..CELL ----
function drawCube(c, r, col, i, rng, ctx) {
  const masks = ctx.masks;
  if (!masks.length) return { body: '' };
  const idx = (ctx.offset + i * c.stride) % masks.length;
  const mask = masks[idx];
  const pad = 14;
  const w = ISO_BOX.x1 - ISO_BOX.x0, h = ISO_BOX.y1 - ISO_BOX.y0;
  const k = (CELL - pad * 2) / Math.max(w, h);
  const ox = pad + ((CELL - pad * 2) - w * k) / 2, oy = pad + ((CELL - pad * 2) - h * k) / 2;
  const P = ([x, y]) => [ox + (x - ISO_BOX.x0) * k, oy + (y - ISO_BOX.y0) * k];
  let d = '';
  EDGES.forEach(([a, b], e) => {
    if (!(mask & (1 << e))) return;
    const [x1, y1] = P(ISO[a]), [x2, y2] = P(ISO[b]);
    d += `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`;
  });
  return { body: d ? `<path d="${d}"/>` : '' };
}

function drawArcs(c, r, col) {
  const corners = (col % 15) + 1; // 1..15 subset of 4 corners
  const n = Math.min(c.arcMax, r + 1);
  const pts = [[0, 0, 1, 1], [CELL, 0, -1, 1], [CELL, CELL, -1, -1], [0, CELL, 1, -1]];
  let d = '';
  pts.forEach(([cx, cy, sx, sy], q) => {
    if (!(corners & (1 << q))) return;
    for (let k = 1; k <= n; k++) {
      const rad = (CELL / 2) * (k / n);
      const ax = cx + sx * rad, ay = cy, bx = cx, by = cy + sy * rad;
      const sweep = (sx * sy > 0) ? 1 : 0;
      d += `M${fmt(ax)} ${fmt(ay)}A${fmt(rad)} ${fmt(rad)} 0 0 ${sweep} ${fmt(bx)} ${fmt(by)}`;
    }
  });
  return { body: `<path d="${d}"/>` };
}

function drawBars(c, r, col, i, rng, ctx) {
  const t = c.cols > 1 ? col / (c.cols - 1) : 0;
  const angle = lerp(c.angleMin, c.angleMax, t);
  const count = c.countMin + r * c.countStep;
  const L = CELL * 1.5;
  let d = '';
  for (let k = 0; k < count; k++) {
    const off = count === 1 ? 0 : lerp(-CELL / 2, CELL / 2, (k + 0.5) / count) ;
    d += `M${fmt(-L / 2)} ${fmt(off)}L${fmt(L / 2)} ${fmt(off)}`;
  }
  const clip = `pmclip${ctx.uid}-${i}`;
  return {
    defs: `<clipPath id="${clip}"><rect width="${CELL}" height="${CELL}"/></clipPath>`,
    body: `<g clip-path="url(#${clip})"><path transform="translate(${CELL / 2} ${CELL / 2}) rotate(${fmt(angle)})" d="${d}"/></g>`,
  };
}

function drawType(c, r, col) {
  const tx = c.cols > 1 ? col / (c.cols - 1) : 0;
  const ty = c.rows > 1 ? r / (c.rows - 1) : 0;
  const wdth = lerp(c.wdthMin, c.wdthMax, tx);
  const wght = lerp(c.wghtMin, c.wghtMax, ty);
  return {
    body: `<text x="${CELL / 2}" y="${CELL / 2}" text-anchor="middle" dominant-baseline="central" stroke="none" fill="currentColor" font-family="Archivo, sans-serif" font-size="${c.fontSize}" style="font-variation-settings:'wdth' ${fmt(wdth)},'wght' ${fmt(wght)}">${esc(c.text)}</text>`,
    isText: true,
  };
}

function isSignal(c, r, col, i, scatter) {
  switch (c.signalRule) {
    case 'row': return r === c.signalIndex % c.rows;
    case 'column': return col === c.signalIndex % c.cols;
    case 'diagonal': return (((col - r - c.signalIndex) % c.cols) + c.cols) % c.cols === 0;
    case 'scatter': return scatter.has(i);
    default: return false;
  }
}

export function caption(c) {
  const dis = c.disorder > 0 ? ` ${Math.round(c.disorder * 100)}% of cells ${c.disorderKind === 'drop' ? 'are left out' : c.disorderKind === 'drift' ? 'drift' : 'rotate'}.` : '';
  const grid = `${c.cols} × ${c.rows}.`;
  switch (c.mode) {
    case 'cubes': return `Incomplete cubes of ${c.minEdges}–${c.maxEdges} edges${c.connected ? ', always connected' : ''}, stepped every ${c.stride}th form. ${grid}${dis}`;
    case 'arcs': return `Quarter arcs. Columns vary the corners, rows add a ring, up to ${c.arcMax}. ${grid}${dis}`;
    case 'bars': return `Parallel lines. Columns turn ${fmt(c.angleMin)}–${fmt(c.angleMax)}°, rows add ${c.countStep} lines from ${c.countMin}. ${grid}${dis}`;
    case 'type': return `One glyph pair, every cut. Columns widen ${c.wdthMin}–${c.wdthMax}, rows weigh ${c.wghtMin}–${c.wghtMax}. ${grid}${dis}`;
    default: return grid;
  }
}

let uidCounter = 0;
export function render(input, opts = {}) {
  const c = { ...DEFAULTS, ...input };
  const rng = mulberry32(c.seed >>> 0);
  const uid = opts.uid ?? (++uidCounter);
  const ctx = { uid };
  if (c.mode === 'cubes') {
    ctx.masks = cubeMasks(Math.min(c.minEdges, c.maxEdges), Math.max(c.minEdges, c.maxEdges), c.connected);
    ctx.offset = Math.floor(rng() * Math.max(ctx.masks.length, 1));
  }
  const total = c.cols * c.rows;
  const scatter = new Set();
  if (c.signalRule === 'scatter') {
    let guard = 0;
    while (scatter.size < Math.min(c.signalCount, total) && guard++ < 1000) scatter.add(Math.floor(rng() * total));
  }
  const draw = { cubes: drawCube, arcs: drawArcs, bars: drawBars, type: drawType }[c.mode] || drawCube;
  const step = CELL + c.gap;
  const W = c.cols * CELL + (c.cols - 1) * c.gap;
  const H = c.rows * CELL + (c.rows - 1) * c.gap;
  const sig = signalColor(c);
  let defs = '', cells = '';
  let order = 0;
  for (let r = 0; r < c.rows; r++) {
    for (let col = 0; col < c.cols; col++) {
      const i = r * c.cols + col;
      // Disorder is decided per cell from the seeded stream, in a fixed order, so it's reproducible.
      const roll = rng(), a = rng(), b = rng();
      const cell = draw(c, r, col, i, rng, ctx);
      if (cell.defs) defs += cell.defs;
      if (!cell.body) continue;
      let tf = `translate(${col * step} ${r * step})`;
      if (roll < c.disorder) {
        if (c.disorderKind === 'drop') continue;
        if (c.disorderKind === 'rotate') tf += ` rotate(${fmt((a - 0.5) * 180 * c.disorderAmount)} ${CELL / 2} ${CELL / 2})`;
        if (c.disorderKind === 'drift') tf += ` translate(${fmt((a - 0.5) * CELL * c.disorderAmount)} ${fmt((b - 0.5) * CELL * c.disorderAmount)})`;
      }
      const signal = isSignal(c, r, col, i, scatter);
      const color = signal ? `var(--pm-signal, ${sig})` : `var(--pm-ink, ${c.ink})`;
      const attrs = cell.isText
        ? `style="color:${color}"`
        : `stroke="${color}" class="pm-stroke" style="--i:${order}"`;
      cells += `<g transform="${tf}" ${attrs}>${cell.body.replace(/<path /g, '<path pathLength="1" ')}</g>`;
      order++;
    }
  }
  const m = c.stroke * 2 + (c.disorderKind === 'drift' ? CELL * c.disorderAmount * 0.5 : 0) + (c.disorderKind === 'rotate' ? CELL * 0.22 * c.disorderAmount : 0);
  const vb = `${fmt(-m)} ${fmt(-m)} ${fmt(W + m * 2)} ${fmt(H + m * 2)}`;
  const label = opts.label ?? caption(c);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${esc(label)}" fill="none" stroke-width="${c.stroke}" stroke-linecap="round" stroke-linejoin="round" style="--pm-count:${order}">${defs ? `<defs>${defs}</defs>` : ''}${cells}</svg>`;
  return { svg, caption: caption(c), cells: order };
}
