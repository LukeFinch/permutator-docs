/* Tool demos. Each demo is { L, still, build(root) -> frame(t) }.
   frame(t) sets every style from t alone (seconds into a loop of length L), so a demo can be drawn at any
   moment: that is how the reduced-motion still frame and the screenshot checks work. The runtime fades each
   loop in and out, runs only the demos on screen, and draws `still` once when motion is reduced. */
(() => {
  'use strict';

  const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const pr = (t, a, b) => clamp((t - a) / (b - a));
  const eo = (t, a, b) => { const x = 1 - pr(t, a, b); return 1 - x * x * x * x; }; // ease-out quart
  const eio = (t, a, b) => { const x = pr(t, a, b); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, x) => a + (b - a) * x;
  const ink = (pct) => `color-mix(in srgb, var(--ink) ${(+pct).toFixed(1)}%, transparent)`;
  const typed = (s, x) => s.slice(0, Math.round(s.length * clamp(x)));

  function mk(parent, cls, text, tag) {
    const n = document.createElement(tag || 'div');
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  }
  const html = (n, h) => { n.innerHTML = h; return n; };
  const vis = (n, v, dy) => { n.style.opacity = v.toFixed(3); n.style.transform = v >= 1 ? '' : `translateY(${((1 - v) * (dy == null ? 6 : dy)).toFixed(2)}px)`; };
  const fillInk = (n, v) => { n.style.background = ink(v * 100); n.style.color = v > 0.5 ? 'var(--paper)' : 'var(--ink)'; };
  const at = (n, x, y, w, h) => {
    n.classList.add('d-abs');
    n.style.left = x + 'px'; n.style.top = y + 'px';
    if (w != null) n.style.width = w + 'px';
    if (h != null) n.style.height = h + 'px';
    return n;
  };
  const dim = (s) => `<span class="d-dim">${s}</span>`;

  const D = {};

  // 1. Keyword Groups: a name splits into segments, segments sort into groups.
  D['keyword-groups'] = { L: 6, still: 4.4, build(r) {
    const row = mk(r, 'd-row'); row.style.gap = '0';
    const chips = [], seps = [];
    ['color', 'blue', '500'].forEach((s, i) => {
      if (i) seps.push(mk(row, 'd-sep', '/'));
      chips.push(mk(row, 'd-chip', s));
    });
    const lab = mk(r, 'd-row'); lab.style.gap = '16px';
    const l1 = html(mk(lab, 'd-chip'), dim('hue:') + ' blue');
    const l2 = html(mk(lab, 'd-chip'), dim('step:') + ' 500');
    return (t) => {
      vis(row, eo(t, 0.1, 0.45));
      const s = eio(t, 0.9, 1.6);
      row.style.gap = lerp(0, 12, s) + 'px';
      seps.forEach((sp) => { sp.style.opacity = 1 - s; sp.style.maxWidth = lerp(10, 0, s) + 'px'; });
      chips.forEach((c) => { c.style.borderColor = ink(s * 100); c.style.paddingInline = lerp(0, 9, s) + 'px'; });
      fillInk(chips[1], eo(t, 2.0, 2.4));
      fillInk(chips[2], eo(t, 2.5, 2.9));
      vis(l1, eo(t, 2.2, 2.6)); vis(l2, eo(t, 2.7, 3.1));
    };
  } };

  // 2. Color: a ramp builds, one shade is nudged.
  D['color'] = { L: 6, still: 4.6, build(r) {
    const row = mk(r, 'd-row'); row.style.gap = '4px'; row.style.alignItems = 'flex-end'; row.style.height = '62px';
    const pct = [6, 12, 20, 32, 46, 60, 74, 88, 96];
    const sw = pct.map((p, i) => {
      const c = mk(row, 'd-box'); c.style.width = '22px'; c.style.height = '52px'; c.style.transformOrigin = 'bottom';
      c.classList.add('d-pop');
      return c;
    });
    const labs = mk(r, 'd-row'); labs.style.gap = '4px'; labs.style.marginTop = '-4px';
    const ls = pct.map((p, i) => { const l = mk(labs, 'd-dim', String((i + 1) * 100)); l.style.width = '22px'; l.style.textAlign = 'center'; l.style.fontSize = '0.56rem'; return l; });
    return (t) => {
      sw.forEach((c, i) => {
        const a = eo(t, 0.3 + i * 0.09, 0.8 + i * 0.09);
        c.style.transform = `scaleY(${a.toFixed(3)})`;
        let p = pct[i];
        let lift = 0;
        if (i === 4) {
          const k = eio(t, 3.0, 3.6) - eio(t, 4.3, 4.9);
          lift = -9 * k; p = pct[i] + 16 * k;
        }
        c.style.background = ink(p);
        if (i === 4) c.style.transform = `translateY(${lift.toFixed(2)}px) scaleY(${a.toFixed(3)})`;
        ls[i].style.opacity = a * 0.55;
      });
    };
  } };

  // 3. Semantics: map a hue onto a role, the aliases follow.
  D['semantics'] = { L: 6.5, still: 4.8, build(r) {
    const top = mk(r, 'd-row'); top.style.gap = '0';
    const a = mk(top, 'd-chip', 'blue'); a.style.borderColor = 'var(--ink)';
    const line = mk(top, 'd-box'); line.style.height = '0'; line.style.borderWidth = '1px 0 0'; line.style.width = '0';
    const b = mk(top, 'd-chip', 'brand'); b.style.borderColor = 'var(--ink)';
    const rows = mk(r, 'div'); rows.style.display = 'grid'; rows.style.gap = '7px';
    const rs = [300, 500, 700].map((n) => html(mk(rows, 'd-note'), `color/brand/${n} ${dim('=')} color/blue/${n}`));
    return (t) => {
      vis(a, eo(t, 0.2, 0.6)); vis(b, eo(t, 0.9, 1.3), 6);
      line.style.width = lerp(0, 70, eio(t, 0.5, 1.2)) + 'px';
      fillInk(b, eo(t, 1.2, 1.5));
      rs.forEach((n, i) => vis(n, eo(t, 1.7 + i * 0.4, 2.2 + i * 0.4)));
    };
  } };

  // 4. Surface: every combination gets covered.
  D['surface'] = { L: 6.5, still: 4.8, build(r) {
    const grid = mk(r, 'div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(4, 56px)'; grid.style.gap = '6px';
    const cells = [];
    for (let i = 0; i < 12; i++) { const c = mk(grid, 'd-box', 'Aa'); c.style.height = '24px'; c.style.display = 'grid'; c.style.placeItems = 'center'; cells.push(c); }
    const cap = mk(r, 'd-note');
    return (t) => {
      let n = 0;
      cells.forEach((c, i) => {
        const col = i % 4, row = (i / 4) | 0;
        const v = eo(t, 0.5 + (col + row) * 0.16, 0.85 + (col + row) * 0.16);
        fillInk(c, v * (0.25 + 0.75 * ((col + 1) / 4)) + 0 * 0);
        c.style.background = ink(v * (col === 0 ? 14 : col === 1 ? 38 : col === 2 ? 68 : 100));
        c.style.color = v * (col === 0 ? 14 : col === 1 ? 38 : col === 2 ? 68 : 100) > 50 ? 'var(--paper)' : 'var(--ink)';
        if (v > 0.5) n++;
      });
      cap.innerHTML = `${n} / 12 ${dim('combinations')}`;
    };
  } };

  // 5. Opacity: one source, several alpha variants.
  D['opacity'] = { L: 5.5, still: 4.0, build(r) {
    const hold = mk(r, 'd-row d-hatch'); hold.style.gap = '10px'; hold.style.padding = '10px'; hold.style.border = '1px solid var(--ink)';
    const sq = [100, 50, 20, 10].map(() => { const s = mk(hold, ''); s.style.width = '40px'; s.style.height = '40px'; s.style.border = '1px solid var(--ink)'; return s; });
    const labs = mk(r, 'd-row'); labs.style.gap = '10px'; labs.style.padding = '0 10px';
    const ls = ['hue/100', '@50', '@20', '@10'].map((s) => { const l = mk(labs, 'd-dim', s); l.style.width = '40px'; l.style.textAlign = 'center'; l.style.fontSize = '0.6rem'; return l; });
    const tg = [100, 50, 20, 10];
    return (t) => {
      sq.forEach((s, i) => {
        const a = eo(t, 0.2 + i * 0.1, 0.6 + i * 0.1);
        const k = i === 0 ? 0 : eio(t, 1.2 + i * 0.35, 2.0 + i * 0.35);
        s.style.opacity = a;
        s.style.background = ink(lerp(100, tg[i], k));
        ls[i].style.opacity = a * 0.7;
      });
    };
  } };

  // 6. Substrate: nested layers pick up surface levels from what they sit on.
  D['substrate'] = { L: 7, still: 5.4, build(r) {
    const box = mk(r, 'd-box'); box.style.position = 'relative'; box.style.width = '236px'; box.style.height = '100px';
    const card = at(mk(box, 'd-box'), 22, 24, 188, 62);
    const pop = at(mk(card, 'd-box'), 24, 20, 132, 28);
    const l0 = at(mk(box, 'd-dim', 'surface-2'), 7, 6); l0.style.fontSize = '0.58rem';
    const l1 = at(mk(card, 'd-dim', 'card +1'), 6, 5); l1.style.fontSize = '0.58rem';
    const l2 = at(mk(pop, 'd-dim', 'popover +2'), 6, 9); l2.style.fontSize = '0.58rem';
    return (t) => {
      vis(card, eo(t, 0.4, 0.9)); vis(pop, eo(t, 1.0, 1.5), 4);
      vis(l0, eo(t, 0.2, 0.5) * 0.7, 2); vis(l1, eo(t, 0.7, 1.0) * 0.7, 2); vis(l2, eo(t, 1.3, 1.6) * 0.7, 2);
      const up = eio(t, 4.2, 5.0) - eio(t, 6.2, 6.9) * 0;
      box.style.background = ink(lerp(5, 9, 0) + (eo(t, 2.0, 2.6) * 0) + up * 8);
      card.style.background = ink(lerp(0, 11, eo(t, 2.4, 3.0)) + up * 8);
      pop.style.background = ink(lerp(0, 20, eo(t, 2.8, 3.4)) + up * 8);
      l1.textContent = t > 2.4 ? 'card +1 = surface-3' : 'card +1';
      l2.textContent = t > 2.8 ? 'popover = surface-5' : 'popover +2';
      l0.textContent = t > 4.4 ? 'surface-3' : 'surface-2';
    };
  } };

  // 7. Shadows: layers, level and light angle.
  D['shadows'] = { L: 7, still: 5.6, build(r) {
    r.style.gap = '22px';
    const card = mk(r, 'd-box'); card.style.width = '96px'; card.style.height = '54px'; card.style.background = 'var(--paper)';
    const cap = mk(r, 'd-note'); cap.style.marginTop = '-6px';
    const levels = ['low', 'medium', 'high', 'extreme'];
    return (t) => {
      vis(card, eo(t, 0.1, 0.5), 4);
      const lift = eo(t, 0.7, 1.9);
      const d = lerp(2, 15, lift);
      const ang = 90 + 48 * Math.sin(eio(t, 2.6, 5.4) * Math.PI * 2);
      const rad = (ang * Math.PI) / 180;
      const dx = -Math.cos(rad), dy = Math.sin(rad);
      const layers = [1, 2, 3].map((k) => {
        const o = d * k / 3 * 1.1;
        return `${(dx * o).toFixed(1)}px ${(dy * o).toFixed(1)}px ${(o * 1.7).toFixed(1)}px ${ink(34 / k + 6)}`;
      });
      card.style.boxShadow = layers.join(', ');
      const lv = levels[Math.min(3, Math.floor(lift * 3.99))];
      cap.innerHTML = `elevation/${lv} ${dim('· ' + Math.round(ang) + '° light')}`;
    };
  } };

  // 8. Variables: filter a long list.
  D['variables'] = { L: 7, still: 3.4, build(r) {
    r.style.gap = '8px';
    const q = mk(r, 'd-box'); q.style.width = '230px'; q.style.padding = '6px 8px'; q.style.display = 'flex'; q.style.gap = '8px';
    html(q, `<span class="d-dim">⌕</span><span class="q"></span><span class="d-caret"></span>`);
    const qt = q.querySelector('.q'), caret = q.querySelector('.d-caret');
    const list = mk(r, 'div'); list.style.display = 'grid'; list.style.gap = '4px'; list.style.width = '230px';
    const names = [['color/blue/500', 1], ['color/gray/100', 0], ['color/blue/700', 1], ['space/4', 0], ['color/brand/500', 0]];
    const rows = names.map(([n, m]) => { const x = html(mk(list, 'd-row'), `<span>${n}</span>`); x.style.justifyContent = 'space-between'; if (n.includes('brand')) x.innerHTML += dim('→ blue/500'); return x; });
    return (t) => {
      const type = pr(t, 0.7, 1.4) - pr(t, 4.6, 5.0);
      qt.textContent = typed('blue', type);
      caret.style.opacity = Math.floor(t * 2.2) % 2 === 0 ? 1 : 0;
      const f = eo(t, 1.5, 2.0) - eo(t, 5.0, 5.5);
      rows.forEach((x, i) => { x.style.opacity = names[i][1] ? 1 : lerp(1, 0.16, f); });
    };
  } };

  // 9. Collections: modes, then a JSON file.
  D['collections'] = { L: 6.5, still: 4.6, build(r) {
    r.style.gap = '10px';
    const tabs = mk(r, 'd-row'); tabs.style.gap = '0';
    const tb = ['Light', 'Dark', 'Brand'].map((s) => { const x = mk(tabs, 'd-chip', s); x.style.border = '1px solid var(--ink)'; x.style.marginLeft = '-1px'; x.style.width = '60px'; x.style.textAlign = 'center'; return x; });
    const arrow = mk(r, 'd-box'); arrow.style.width = '0'; arrow.style.borderWidth = '0 0 0 1px'; arrow.style.height = '0';
    const file = mk(r, 'd-row'); file.style.cssText += ';flex-direction:column;gap:7px';
    const chip = mk(file, 'd-chip', 'Primitives.json'); chip.style.border = '1px solid var(--ink)';
    const cnt = mk(file, 'd-dim');
    return (t) => {
      vis(tabs, eo(t, 0.1, 0.5));
      const m = t < 1.2 ? 0 : t < 1.8 ? 1 : t < 2.4 ? 2 : -1;
      tb.forEach((x, i) => fillInk(x, m === i ? 1 : 0));
      arrow.style.height = lerp(0, 16, eio(t, 2.6, 3.1)) + 'px';
      vis(chip, eo(t, 3.0, 3.5));
      const n = Math.round(412 * eo(t, 3.2, 4.2));
      cnt.textContent = t > 3.2 ? `· 3 modes · ${n} variables` : '';
      cnt.style.opacity = eo(t, 3.2, 3.6) * 0.55;
    };
  } };

  // 10. Find & Replace: one rename rebinds every layer.
  D['find-replace'] = { L: 6.5, still: 4.8, build(r) {
    r.style.gap = '11px';
    const q = mk(r, 'd-box'); q.style.padding = '6px 9px';
    const qt = mk(q, '');
    const list = mk(r, 'div'); list.style.display = 'grid'; list.style.gap = '6px'; list.style.width = '226px';
    const rows = ['Button fill', 'Card stroke', 'Icon fill'].map((n) => {
      const row = mk(list, 'd-row'); row.style.justifyContent = 'space-between';
      mk(row, '', n);
      const cell = mk(row, ''); cell.style.display = 'grid'; cell.style.justifyItems = 'end';
      const o = mk(cell, '', 'gray/700'); o.style.gridArea = '1/1'; o.style.position = 'relative';
      const nw = mk(cell, '', 'neutral/700'); nw.style.gridArea = '1/1';
      const strike = mk(o, ''); strike.style.cssText = 'position:absolute;left:0;top:50%;height:1px;background:var(--ink);width:100%;transform-origin:left;transform:scaleX(0)';
      return { row, o, nw, strike };
    });
    return (t) => {
      qt.innerHTML = typed('gray/700', pr(t, 0.2, 0.9)) + ' ' + dim(t > 1.0 ? '→ neutral/700' : '');
      rows.forEach((x, i) => {
        const s = eo(t, 1.3 + i * 0.45, 1.6 + i * 0.45);
        const sw = eo(t, 1.7 + i * 0.45, 2.1 + i * 0.45);
        x.strike.style.transform = `scaleX(${s})`;
        x.o.style.opacity = 1 - sw;
        x.nw.style.opacity = sw; x.nw.style.transform = `translateY(${((1 - sw) * 4).toFixed(2)}px)`;
      });
    };
  } };

  // 11. Variable Swap: a variant matrix builds itself.
  D['variable-swap'] = { L: 6.5, still: 4.8, build(r) {
    r.style.gap = '10px';
    const head = html(mk(r, 'd-note'), `variant[primary, secondary] ${dim('×')} size[sm, md, lg]`); head.style.cssText += ';font-size:0.6rem;white-space:normal;text-align:center;max-width:94%';
    const g = mk(r, 'div'); g.style.display = 'grid'; g.style.gridTemplateColumns = 'repeat(3, 66px)'; g.style.gridAutoRows = '34px'; g.style.gap = '6px'; g.style.alignItems = 'center'; g.style.justifyItems = 'center';
    const dims = [[30, 14], [44, 20], [60, 28]];
    const cells = [];
    for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++) {
      const b = mk(g, 'd-box d-pop'); b.style.width = dims[c][0] + 'px'; b.style.height = dims[c][1] + 'px';
      b.style.background = row === 0 ? 'var(--ink)' : 'transparent';
      cells.push(b);
    }
    const cap = mk(r, 'd-note'); cap.style.marginTop = '-2px';
    return (t) => {
      vis(head, eo(t, 0.1, 0.5), 3);
      let n = 0;
      cells.forEach((b, i) => {
        const a = eo(t, 1.0 + i * 0.28, 1.4 + i * 0.28);
        b.style.opacity = a; b.style.transform = `scale(${lerp(0.6, 1, a).toFixed(3)})`;
        if (a > 0.5) n++;
      });
      cap.innerHTML = `= ${n} ${dim(n === 1 ? 'variant' : 'variants')}`;
    };
  } };

  // 12. Hot Swap: try modes in a sandbox, then finalise.
  D['hot-swap'] = { L: 8, still: 6.8, build(r) {
    r.style.gap = '10px';
    const seg = mk(r, 'd-row'); seg.style.gap = '0'; seg.style.position = 'relative';
    const ind = mk(seg, ''); ind.style.cssText = 'position:absolute;left:0;top:0;width:54px;height:100%;background:var(--ink);';
    const labs = ['current', 'option-a', 'option-b'].map((s) => { const x = mk(seg, 'd-chip', s); x.style.border = '1px solid var(--ink)'; x.style.width = '54px'; x.style.paddingInline = '0'; x.style.fontSize = '0.64rem'; x.style.textAlign = 'center'; x.style.marginLeft = '-1px'; x.style.position = 'relative'; x.style.zIndex = 1; x.style.background = 'transparent'; return x; });
    ind.style.marginLeft = '0';
    const scr = mk(r, 'd-box'); scr.style.width = '210px'; scr.style.height = '52px'; scr.style.position = 'relative';
    const bar = at(mk(scr, 'd-box'), 8, 7, 194, 9);
    const card = at(mk(scr, 'd-box'), 8, 22, 120, 22);
    const btn = at(mk(scr, 'd-box'), 140, 22, 62, 22);
    const modes = { 0: [8, 20, 90], 1: [30, 6, 55], 2: [4, 40, 18] };
    const fb = mk(seg, 'd-chip d-pop', 'finalise'); fb.style.cssText += ';border:1px solid var(--ink);margin-left:8px;padding:6px 7px;font-size:0.64rem';
    return (t) => {
      const pos = eio(t, 1.0, 1.6) + eio(t, 3.0, 3.6) - eio(t, 4.6, 5.2);
      const p = Math.max(0, Math.min(2, pos));
      ind.style.transform = `translateX(${(p * 53).toFixed(2)}px)`;
      labs.forEach((x, i) => { x.style.color = Math.abs(p - i) < 0.5 ? 'var(--paper)' : 'var(--ink)'; });
      const i0 = Math.floor(Math.min(p, 1.999)), f = p - i0;
      const v = [0, 1, 2].map((k) => lerp(modes[i0][k], modes[Math.min(2, i0 + 1)][k], f));
      bar.style.background = ink(v[0]); card.style.background = ink(v[1]); btn.style.background = ink(v[2]);
      const press = eo(t, 5.8, 5.9) - eo(t, 5.9, 6.1);
      fb.style.transform = `scale(${(1 - 0.04 * press).toFixed(3)})`;
      fb.style.opacity = eo(t, 5.4, 5.7);
      fillInk(fb, eo(t, 5.85, 6.0));
      fb.textContent = t > 6.1 ? '✓ done' : 'finalise';
    };
  } };

  // 13. Migrate: bindings move from one collection to another.
  D['migrate'] = { L: 6.5, still: 4.6, build(r) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 300 118'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    r.appendChild(svg);
    const E = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    const boxL = E('rect', { x: 8, y: 14, width: 78, height: 90, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1 });
    const boxR = E('rect', { x: 214, y: 14, width: 78, height: 90, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1 });
    const tl = E('text', { x: 16, y: 29 }); tl.textContent = 'Legacy';
    const tr = E('text', { x: 222, y: 29 }); tr.textContent = 'Core';
    const ys = [48, 66, 84];
    const nodes = ys.map((y) => E('rect', { x: 139, y: y - 6, width: 12, height: 12, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1 }));
    const L = ys.map((y) => E('path', { d: `M86 ${y}H139`, stroke: 'var(--ink)', fill: 'none', pathLength: 1, 'stroke-dasharray': 1 }));
    const R = ys.map((y) => E('path', { d: `M151 ${y}H214`, stroke: 'var(--ink)', fill: 'none', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }));
    const lb = E('text', { x: 16, y: 98, opacity: 0.55 }); lb.textContent = 'brand/500';
    const rb = E('text', { x: 222, y: 98, opacity: 0.55 }); rb.textContent = 'brand/500';
    return (t) => {
      ys.forEach((y, i) => {
        const a = eo(t, 0.2 + i * 0.1, 0.6 + i * 0.1);
        nodes[i].setAttribute('opacity', a);
        L[i].setAttribute('opacity', a);
        const out = eio(t, 1.5 + i * 0.4, 2.2 + i * 0.4);
        L[i].setAttribute('stroke-dashoffset', (-out).toFixed(3));
        L[i].setAttribute('opacity', a * (1 - out));
        R[i].setAttribute('stroke-dashoffset', (1 - eio(t, 1.8 + i * 0.4, 2.6 + i * 0.4)).toFixed(3));
        nodes[i].setAttribute('fill', 'var(--paper)');
        nodes[i].setAttribute('stroke-width', 1);
      });
      lb.setAttribute('opacity', 0.55 * (1 - eo(t, 3.4, 3.9)));
      rb.setAttribute('opacity', 0.55 * eo(t, 3.6, 4.1));
    };
  } };

  // 14. Sync from JSON: updated, created, deleted.
  D['sync-json'] = { L: 7.5, still: 6.0, build(r) {
    r.style.gap = '8px';
    const list = mk(r, 'div'); list.style.display = 'grid'; list.style.gap = '5px'; list.style.width = '236px';
    const mkRow = (name, tag) => { const row = mk(list, 'd-row'); row.style.justifyContent = 'space-between'; row.style.padding = '4px 6px'; row.style.border = '1px solid transparent'; const n = mk(row, '', name); const tg = mk(row, 'd-dim', tag); return { row, n, tg }; };
    const rowsU = [mkRow('brand/500', '~ updated'), mkRow('brand/600', '~ updated')];
    const rowC = mkRow('brand/950', '+ created');
    const rowD = mkRow('gray/050', '− deleted');
    const cap = mk(r, 'd-note');
    return (t) => {
      rowsU.forEach((x, i) => {
        const k = eo(t, 0.3 + i * 0.1, 0.6 + i * 0.1);
        x.row.style.opacity = k;
        const f = eo(t, 1.5 + i * 0.4, 1.8 + i * 0.4) - eo(t, 2.4 + i * 0.4, 3.0 + i * 0.4);
        fillInk(x.row, Math.max(0, f)); x.row.style.borderColor = ink(eo(t, 1.5 + i * 0.4, 1.8 + i * 0.4) * 100);
        x.tg.style.opacity = 0.55 * eo(t, 1.5 + i * 0.4, 1.9 + i * 0.4);
        x.tg.style.visibility = t > 1.4 + i * 0.4 ? 'visible' : 'hidden';
      });
      const c = eo(t, 3.2, 3.8);
      rowC.row.style.opacity = c; rowC.row.style.transform = `translateX(${((1 - c) * -14).toFixed(2)}px)`; rowC.row.style.borderColor = ink(c * 100);
      rowD.row.style.opacity = eo(t, 0.3, 0.6) * (1 - eo(t, 4.6, 5.2) * 0.75);
      rowD.n.style.textDecoration = t > 4.4 ? 'line-through' : 'none';
      rowD.tg.style.visibility = t > 4.3 ? 'visible' : 'hidden';
      rowD.row.style.borderColor = ink(eo(t, 4.3, 4.6) * 100);
      cap.innerHTML = `${Math.round(12 * eo(t, 1.6, 3.0))} updated ${dim('·')} ${Math.round(3 * eo(t, 3.3, 4.0))} created ${dim('·')} ${Math.round(eo(t, 4.6, 5.0))} deleted`;
    };
  } };

  // 15. Dealias: collapse the chain.
  D['dealias'] = { L: 6.5, still: 5.2, build(r) {
    r.style.gap = '16px';
    const row = mk(r, 'd-row'); row.style.gap = '0';
    const mkChip = (s) => { const x = mk(row, 'd-chip', s); x.style.border = '1px solid var(--ink)'; x.style.overflow = 'hidden'; return x; };
    const arrow = () => { const a = mk(row, 'd-sep', '→'); a.style.padding = '0 8px'; a.style.maxWidth = '40px'; a.style.overflow = 'hidden'; return a; };
    const c1 = mkChip('fill: danger'); const a1 = arrow(); const c2 = mkChip('color/danger'); const a2 = arrow(); const c3 = mkChip('red-500');
    const cap = mk(r, 'd-note');
    const w = (el) => el.dataset.w || (el.dataset.w = el.getBoundingClientRect().width);
    return (t) => {
      vis(row, eo(t, 0.1, 0.5));
      const mid = eio(t, 1.8, 2.5);
      c2.style.opacity = 1 - mid; c2.style.maxWidth = lerp(120, 0, mid) + 'px'; c2.style.paddingInline = lerp(9, 0, mid) + 'px'; c2.style.borderWidth = mid > 0.98 ? '0' : '1px';
      a2.style.opacity = 1 - mid; a2.style.maxWidth = lerp(40, 0, mid) + 'px'; a2.style.paddingInline = lerp(8, 0, mid) + 'px';
      const sw = eo(t, 3.0, 3.5);
      c1.textContent = sw > 0.5 ? 'fill: red-500' : 'fill: danger';
      const gone = eio(t, 3.6, 4.2);
      a1.style.opacity = 1 - gone; a1.style.maxWidth = lerp(40, 0, gone) + 'px'; a1.style.paddingInline = lerp(8, 0, gone) + 'px';
      c3.style.opacity = 1 - gone; c3.style.maxWidth = lerp(120, 0, gone) + 'px'; c3.style.paddingInline = lerp(9, 0, gone) + 'px'; c3.style.borderWidth = gone > 0.98 ? '0' : '1px';
      cap.innerHTML = t > 3.0 ? `bound to the primitive ${dim('directly')}` : `${dim('alias → alias → primitive')}`;
      cap.style.opacity = 1;
    };
  } };

  // 16. Inspect: a scan finds usage, and what is safe to remove.
  D['inspect'] = { L: 7, still: 5.4, build(r) {
    const list = mk(r, 'div'); list.style.cssText = 'position:relative;display:grid;gap:3px;width:min(246px,90%)';
    const data = [['color/blue/500', 24], ['color/gray/100', 11], ['space/4', 6], ['color/red/200', 0], ['radius/xl', 0]];
    const rows = data.map(([n, c]) => {
      const row = mk(list, 'd-row'); row.style.cssText += ';height:20px;padding:0 6px;border:1px solid transparent;gap:8px';
      const nm = mk(row, '', n); nm.style.width = '92px';
      const track = mk(row, ''); track.style.cssText = 'width:40px;height:5px;position:relative';
      const bar = mk(track, ''); bar.style.cssText = 'height:100%;background:var(--ink);width:0';
      const ct = mk(row, '', ''); ct.style.marginLeft = 'auto';
      return { row, nm, bar, ct, c };
    });
    const scan = mk(list, ''); scan.style.cssText = 'position:absolute;left:-6px;right:-6px;top:0;height:1px;background:var(--ink)';
    return (t) => {
      const y = lerp(-2, 5 * 23, eio(t, 0.5, 2.8));
      scan.style.transform = `translateY(${y.toFixed(1)}px)`; scan.style.opacity = 1 - eo(t, 2.8, 3.1);
      rows.forEach((x, i) => {
        const k = clamp((y - i * 23) / 14);
        x.nm.style.opacity = 0.3 + 0.7 * k;
        x.bar.style.width = (x.c / 24) * 40 * k + 'px';
        const zero = x.c === 0;
        x.ct.textContent = k > 0.05 ? (zero && t > 3.3 ? 'safe to remove' : String(Math.round(x.c * k))) : '';
        if (zero) { const z = eo(t, 3.3, 3.7); x.row.style.borderColor = ink(z * 100); x.row.style.borderStyle = 'dashed'; }
      });
    };
  } };

  // 17. Orphan Scan: a sweep catches layers on old collections.
  D['orphan-scan'] = { L: 7, still: 5.2, build(r) {
    r.style.gap = '12px';
    const grid = mk(r, 'div'); grid.style.cssText = 'position:relative;display:grid;grid-template-columns:repeat(8,16px);gap:8px';
    const orph = new Set([3, 9, 12, 18, 21, 26, 30]);
    const cells = [];
    for (let i = 0; i < 32; i++) { const c = mk(grid, 'd-box'); c.style.height = '16px'; cells.push(c); }
    const scan = mk(grid, ''); scan.style.cssText = 'position:absolute;top:-6px;bottom:-6px;left:0;width:1px;background:var(--ink)';
    const cap = mk(r, 'd-note');
    return (t) => {
      const x = lerp(-4, 8 * 24, eio(t, 0.6, 3.4));
      scan.style.transform = `translateX(${x.toFixed(1)}px)`; scan.style.opacity = eo(t, 0.4, 0.6) * (1 - eo(t, 3.4, 3.7));
      let n = 0;
      cells.forEach((c, i) => {
        const cx = (i % 8) * 24 + 8;
        const hit = orph.has(i) ? eo(x, cx - 2, cx + 8) : 0;
        fillInk(c, hit);
        c.style.transform = `scale(${(1 + 0.18 * Math.sin(Math.PI * clamp(pr(x, cx - 2, cx + 14)))).toFixed(3)})`;
        if (hit > 0.5) n++;
      });
      cap.innerHTML = `${n} ${dim('layers on')} [OLD] Brand 2023`;
    };
  } };

  // 18. Deprecation Audit: a component and everywhere it is used.
  D['deprecation-audit'] = { L: 7.5, still: 6.2, build(r) {
    r.style.gap = '9px';
    const pill = mk(r, 'd-box'); pill.style.padding = '5px 9px'; pill.style.minWidth = '132px'; pill.style.textAlign = 'center';
    const comp = mk(r, 'd-row'); comp.style.cssText += ';width:230px;justify-content:space-between';
    const nm = mk(comp, 'd-chip', 'Card/v1'); nm.style.border = '1px solid var(--ink)';
    const tg = mk(comp, 'd-tag', 'deprecated');
    const uses = mk(r, 'div'); uses.style.cssText = 'display:grid;gap:6px;width:230px;padding-left:16px';
    const us = ['Pricing / Hero', 'Checkout / Summary', 'Settings / Panel'].map((s) => html(mk(uses, ''), `${dim('↳')} ${s}`));
    return (t) => {
      const saved = eo(t, 5.2, 5.6);
      pill.innerHTML = saved > 0.5 ? '✓ report saved · read-only' : 'match: ' + typed('*/v1', pr(t, 0.3, 1.0));
      vis(comp, eo(t, 1.2, 1.7)); fillInk(nm, eo(t, 1.8, 2.2));
      tg.style.opacity = eo(t, 2.0, 2.4);
      us.forEach((u, i) => vis(u, eo(t, 2.5 + i * 0.5, 3.0 + i * 0.5), 4));
    };
  } };

  // 19. Alias Matrix: colours become modes, ramp steps become variables.
  D['alias-matrix'] = { L: 7.5, still: 5.6, build(r) {
    const g = mk(r, 'div'); g.style.cssText = 'display:grid;grid-template-columns:62px repeat(3,60px);gap:5px;align-items:center;justify-items:center';
    mk(g, '');
    const head = ['blue', 'green', 'red'].map((s) => { const h = mk(g, 'd-dim', s); return h; });
    const cells = [];
    ['accent/300', 'accent/500', 'accent/700'].forEach((row, ri) => {
      const l = mk(g, '', row); l.style.justifySelf = 'start'; l.style.fontSize = '0.6rem';
      ['blue', 'green', 'red'].forEach((c, ci) => {
        const miss = ri === 2 && ci === 1;
        const x = mk(g, 'd-box', miss ? '!' : `${c}/${(ri + 1) * 2 + 1}00`.replace('/300', '/300')); x.style.cssText += ';width:58px;height:20px;display:grid;place-items:center;font-size:0.56rem';
        if (miss) x.style.borderStyle = 'dashed';
        cells.push({ x, ci, miss });
      });
    });
        return (t) => {
      head.forEach((h, i) => { h.style.opacity = 0.55 * eo(t, 0.2 + i * 0.1, 0.6 + i * 0.1); });
      cells.forEach(({ x, ci, miss }) => {
        const a = eo(t, 0.7 + ci * 0.45, 1.2 + ci * 0.45);
        x.style.opacity = a;
        if (miss) { const f = eo(t, 3.4, 3.7); fillInk(x, f * (0.5 + 0.5 * Math.sin(t * 8) * (t < 4.4 ? 1 : 0)) * 0 + (t > 3.4 && t < 4.4 ? f : 0)); x.style.borderColor = 'var(--ink)'; }
      });
      const hot = t < 4.8 ? -1 : t < 5.5 ? 0 : t < 6.2 ? 1 : 2;
      cells.forEach(({ x, ci, miss }) => { if (!miss) fillInk(x, hot === ci ? 0.12 * 8 : 0); });
    };
  } };

  // 20. Deprecate & Replace: ban once, flagged in every file.
  D['deprecate-replace'] = { L: 8, still: 6.4, build(r) {
    r.style.flexDirection = 'row'; r.style.gap = '40px';
    const mkFile = (name) => {
      const f = mk(r, 'd-box'); f.style.cssText += ';width:116px;height:96px;position:relative';
      const t = at(mk(f, 'd-dim', name), 8, 7); t.style.fontSize = '0.58rem';
      at(mk(f, '', 'gray/700'), 8, 28);
      const tag = at(mk(f, 'd-tag', 'deprecated'), 8, 46); tag.style.opacity = 0;
      const rep = at(mk(f, 'd-dim', '→ neutral/700'), 8, 72);
      return { f, tag, rep };
    };
    const A = mkFile('file A'), B = mkFile('file B');
    const beam = mk(r, ''); beam.style.cssText = 'position:absolute;top:calc(50% - 16px);left:calc(50% - 20px);width:40px;height:0;border-top:1px dashed var(--ink);transform-origin:left;transform:scaleX(0)';
    const ban = mk(A.f, 'd-chip d-pop', 'ban'); ban.style.cssText += ';border:1px solid var(--ink);position:absolute;right:6px;top:4px;padding:4px 7px;font-size:0.6rem';
    return (t) => {
      A.rep.style.opacity = 0.55 * eo(t, 0.8, 1.3);
      const press = eo(t, 2.4, 2.5) - eo(t, 2.5, 2.7);
      ban.style.transform = `scale(${(1 - 0.05 * press).toFixed(3)})`;
      ban.style.opacity = eo(t, 1.6, 2.0);
      fillInk(ban, eo(t, 2.45, 2.6) * (1 - eo(t, 3.2, 3.6)));
      A.tag.style.opacity = eo(t, 2.5, 2.9);
      beam.style.transform = `scaleX(${eio(t, 3.2, 4.2).toFixed(3)})`; beam.style.opacity = 1 - eo(t, 4.6, 5.0);
      B.tag.style.opacity = eo(t, 4.2, 4.7);
    };
  } };

  /* ---------------- runtime ---------------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...document.querySelectorAll('.demo[data-demo]')].map((el) => {
    const def = D[el.dataset.demo];
    if (!def) return null;
    const inn = mk(el, 'demo-in');
    return { el, inn, def, frame: def.build(inn), on: false, t0: 0 };
  }).filter(Boolean);

  function draw(it, t) {
    const L = it.def.L;
    it.inn.style.opacity = Math.min(eo(t, 0, 0.3), 1 - eo(t, L - 0.45, L)).toFixed(3);
    it.frame(t);
  }
  items.forEach((it) => draw(it, it.def.still));

  let raf = 0;
  function tick(now) {
    raf = 0;
    let any = false;
    for (const it of items) {
      if (!it.on) continue;
      any = true;
      draw(it, (((now - it.t0) / 1000) % it.def.L));
    }
    if (any && !reduce.matches && !document.hidden) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && !reduce.matches && !document.hidden) raf = requestAnimationFrame(tick); };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        const it = items.find((x) => x.el === e.target);
        if (!it) return;
        if (e.isIntersecting && !it.on) { it.on = true; it.t0 = performance.now(); if (reduce.matches) draw(it, it.def.still); kick(); }
        else if (!e.isIntersecting) it.on = false;
      });
    }, { rootMargin: '80px' });
    items.forEach((it) => io.observe(it.el));
  }
  document.addEventListener('visibilitychange', kick);
  reduce.addEventListener && reduce.addEventListener('change', () => { items.forEach((it) => draw(it, it.def.still)); kick(); });

  window.__pmDemos = { items, draw };
})();
