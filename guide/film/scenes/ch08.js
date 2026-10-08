/* ch08.js — Infrastructure & Compliance Rails. Lesson diagrams only: the engine draws the page, title, THE POINT,
   the margin note and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const at = (ctx, p, x, y, fn) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p); fn(ctx); ctx.restore(); };
  const fade = (ctx, a, fn) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, a); fn(ctx); ctx.restore(); };
  // eased overshoot from beat b0; exactly 0 before b0 (E.outBack(0) is ~2e-16, which would pass a `> 0` guard)
  const back = (S, b0, db) => (S.bt < b0 ? 0 : S.at(b0, db, E.outBack));
  const qpt = (x1, y1, x2, y2, bend, u) => { // point on K.arrow's quadratic path
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * bend, cy = my + dx / L * bend;
    return { x: (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, y: (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2 };
  };

  // 8.1 — a blindfolded chain; the oracle carries a number in; the contract acts on whatever it is handed
  const blindBlock = (ctx, x, y, s, t) => {
    I.block(ctx, x, y, s, {});
    const w = s * 0.86, d = s * 0.18, fy = y + d, by = fy - s * 0.1, bh = s * 0.16, f = Math.sin(t * 7) * s * 0.025;
    ctx.save(); ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, by - bh / 2 + 3); ctx.lineTo(x + w / 2 + 5, by - bh / 2 - 1); ctx.lineTo(x + w / 2 + 5, by + bh / 2 - 1); ctx.lineTo(x - w / 2 - 5, by + bh / 2 + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w / 2 + 3, by - bh / 2 - 1); ctx.lineTo(x + w / 2 + d, by - bh / 2 - d * 0.9); ctx.lineTo(x + w / 2 + d, by + bh / 2 - d * 0.9); ctx.lineTo(x + w / 2 + 3, by + bh / 2 - 1); ctx.closePath(); ctx.fill();
    const kx = x + w / 2 + d * 0.55, ky = by - d * 0.45;
    ctx.beginPath(); ctx.arc(kx, ky, s * 0.05, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(kx - 3, ky); ctx.quadraticCurveTo(kx + s * 0.03 + f, ky + s * 0.14, kx - s * 0.01 + f, ky + s * 0.27); ctx.lineTo(kx + s * 0.05 + f, ky + s * 0.25); ctx.quadraticCurveTo(kx + s * 0.06 + f, ky + s * 0.12, kx + 3, ky); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.quadraticCurveTo(kx + s * 0.12 - f, ky + s * 0.08, kx + s * 0.14 - f, ky + s * 0.2); ctx.lineTo(kx + s * 0.19 - f, ky + s * 0.15); ctx.quadraticCurveTo(kx + s * 0.14 - f, ky + s * 0.04, kx + 2, ky - 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, fy + s * 0.03, s * 0.16, 0.3, Math.PI - 0.3); ctx.lineWidth = Math.max(3, s * 0.035); ctx.stroke();
    ctx.restore();
  };
  SC['L8.1'] = (ctx, S) => {
    const L = S.sc.labels, dv = 1098, t = S.t, scx = 1384, scy = 334, scw = 372, sch = 136;
    S.noteTo = [1500, 640];
    const a0 = S.at(0.1, 0.4);
    fade(ctx, a0, (c) => { c.setLineDash([8, 10]); K.line(c, dv, 330, dv, 790, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
    label(ctx, '← OFFCHAIN', dv - 22, 322, { a: 'right', s: 16, ls: 2, c: C.ink3, alpha: a0 });
    label(ctx, 'ONCHAIN →', dv + 22, 322, { a: 'left', s: 16, ls: 2, c: C.orange, alpha: a0 });
    // offchain: the report — then someone hands over a typo
    const pd = S.pop(0.3);
    at(ctx, pd, 790, 580, (c) => {
      I.doc(c, 0, 0, 246, { lines: false });
      K.txt(c, 'FUND REPORT', -76, -78, { f: 'mono', s: 16, w: 700, c: C.ink, ls: 1 });
      K.txt(c, 'net asset value', 0, -24, { f: 'serif', s: 19, i: true, c: C.ink2, a: 'center' });
      K.txt(c, '$1.0412', 0, 22, { f: 'mono', s: 34, w: 700, c: C.ink, a: 'center' });
      c.lineWidth = 3; c.strokeStyle = C.line2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-58, 52 + i * 18); c.lineTo(i === 2 ? 10 : 58, 52 + i * 18); c.stroke(); }
    });
    const typo = S.at(2.25, 0.16, E.inCubic);
    if (typo > 0) { const k = K.lerp(1.7, 1, typo); ctx.save(); ctx.globalAlpha *= K.clamp(typo * 3); ctx.translate(808, 600); ctx.scale(k, k); I.sticky(ctx, 0, 0, 122, { text: L.bad.replace(/^NAV\s*/, ''), ts: 0.3, tilt: -0.12 }); ctx.restore(); }
    const ty = S.at(2.5, 0.35);
    if (ty > 0) { K.txt(ctx, 'typo', 936, 700, { f: 'hand', s: 34, w: 700, c: C.red, a: 'center', alpha: ty }); K.arrow(ctx, 912, 684, 872, 652, { p: ty, lw: 3, c: C.red, hs: 11, bend: -10 }); }
    // the oracle, straddling the line
    const po = S.pop(0.45), sending = (S.bt > 1.25 && S.bt < 1.6) || (S.bt > 2.85 && S.bt < 3.15);
    at(ctx, po, dv, 584, (c) => I.antenna(c, 0, 0, 214, { waves: sending ? (t * 1.8) % 1 : 0 }));
    label(ctx, L.oracle, dv, 736, { s: 19, alpha: po });
    // onchain: the contract's screen + the blindfolded chain
    const pc = S.pop(0.6), liq = S.bt >= 3.2, posted2 = S.bt >= 3.1, posted1 = S.bt >= 1.55;
    if (pc > 0) {
      ctx.save(); ctx.translate(scx + scw / 2, scy + sch / 2); ctx.scale(pc, pc); ctx.translate(-scx - scw / 2, -scy - sch / 2);
      K.box(ctx, scx, scy, scw, sch, { r: 14, fill: '#1C150F', stroke: C.ink, lw: 4, shadow: 12 });
      K.txt(ctx, 'SMART CONTRACT', scx + 24, scy + 32, { f: 'mono', s: 14, w: 700, c: 'rgba(244,241,234,.5)', ls: 3 });
      const val = posted2 ? L.bad : posted1 ? L.good : 'NAV  —', vc = posted2 ? '#FF8A80' : posted1 ? '#9BE7B5' : 'rgba(244,241,234,.4)';
      K.txt(ctx, val, scx + 24, scy + 80, { f: 'display', s: 40, w: 900, st: 'semi-condensed', c: vc });
      const st = liq ? '→ ' + L.liq : S.bt >= 1.6 ? '→ ' + L.exec : '';
      if (st) K.txt(ctx, st, scx + 24, scy + 118, { f: 'mono', s: 21, w: 700, c: liq ? '#FF7A7A' : '#7CE0A3', ls: 1, alpha: liq ? S.at(3.2, 0.15) : S.at(1.6, 0.2) });
      // alarm light
      const ax = scx + scw - 36, ay = scy - 2;
      ctx.beginPath(); ctx.arc(ax, ay, 18, Math.PI, 0); ctx.closePath(); ctx.fillStyle = liq ? (Math.sin(t * 18) > 0 ? '#FF3B3B' : '#B81E1E') : '#8E877B'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke();
      if (liq) { ctx.save(); ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(t * 18); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = Math.PI + 0.35 + i * 0.6; ctx.beginPath(); ctx.moveTo(ax + Math.cos(a) * 26, ay + Math.sin(a) * 26); ctx.lineTo(ax + Math.cos(a) * 42, ay + Math.sin(a) * 42); ctx.stroke(); } ctx.restore(); }
      ctx.restore();
    }
    const pb = S.pop(0.75), hop = liq ? Math.abs(Math.sin(S.since(3.2) * 9)) * 14 * Math.exp(-S.since(3.2) * 0.6) : S.bt > 1.6 && S.bt < 2.1 ? Math.sin(S.lin(1.6, 0.5) * Math.PI) * 10 : 0;
    if (pb > 0) {
      K.line(ctx, 1420, 672, 1480, 672, { lw: 6 }); K.line(ctx, 1690, 672, 1726, 672, { lw: 6 });
      at(ctx, pb, 1396, 672, (c) => I.block(c, 0, 0, 80, {}));
      at(ctx, pb, 1752, 672, (c) => I.block(c, 0, 0, 80, {}));
      fade(ctx, pb, (c) => { c.setLineDash([5, 7]); K.line(c, scx + scw / 2, scy + sch + 6, 1574, 560, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
      at(ctx, pb, 1574, 650 - hop, (c) => blindBlock(c, 0, 0, 168, t));
      label(ctx, L.chain, 1574, 786, { s: 19, alpha: pb });
    }
    // the number, carried across
    const fly = (u, txt, fill) => {
      if (u <= 0 || u >= 1) return;
      const q = u < 0.5 ? qpt(812, 548, dv + 14, 486, -60, u * 2) : qpt(dv + 14, 486, scx + 140, scy + 66, -70, (u - 0.5) * 2);
      K.chip(ctx, txt, q.x, q.y, { s: 17, fill, c: C.ink, stroke: C.ink, lw: 2.5, a: 'center' });
    };
    fly(S.lin(1.0, 0.55), L.good, C.card);
    fly(S.lin(2.6, 0.5), L.bad, C.neonYellow);
  };

  // 8.2 — lock on A, a dashed copy on B; the copy opens like nesting dolls: claim on → claim on → asset
  const doll = (ctx, x, y, h, o = {}) => { // matryoshka, base at y; o.open lifts the top half
    const w = h * 0.62, lw = Math.max(3, h * 0.026), fill = o.fill || C.orange, wy = -h * 0.42, lift = o.open || 0;
    const sil = (c) => { // silhouette: head + body
      c.beginPath(); c.arc(0, -h * 0.74, h * 0.2, 0, 7);
      c.moveTo(-w * 0.42, 0); c.bezierCurveTo(-w * 0.64, -h * 0.2, -w * 0.52, -h * 0.52, -w * 0.24, -h * 0.62); c.lineTo(w * 0.24, -h * 0.62); c.bezierCurveTo(w * 0.52, -h * 0.52, w * 0.64, -h * 0.2, w * 0.42, 0); c.closePath();
    };
    const part = (top) => {
      ctx.save(); ctx.beginPath(); if (top) ctx.rect(-h, -h * 1.3, 2 * h, h * 1.3 + wy); else ctx.rect(-h, wy, 2 * h, -wy + lw * 2); ctx.clip();
      if (o.dash) ctx.setLineDash([h * 0.07, h * 0.045]);
      sil(ctx); ctx.lineWidth = lw * 2; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.setLineDash([]); sil(ctx); ctx.fillStyle = fill; ctx.fill();
      if (top) { // face
        ctx.beginPath(); ctx.arc(0, -h * 0.735, h * 0.135, 0, 7); ctx.fillStyle = '#F6E3CF'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.fillStyle = C.ink; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * h * 0.05, -h * 0.75, h * 0.016, 0, 7); ctx.fill(); }
        ctx.fillStyle = 'rgba(214,69,69,.45)'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * h * 0.085, -h * 0.71, h * 0.022, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, -h * 0.715, h * 0.04, 0.3, Math.PI - 0.3); ctx.lineWidth = lw * 0.6; ctx.stroke();
      } else { // apron
        ctx.beginPath(); ctx.ellipse(0, -h * 0.22, w * 0.3, h * 0.17, 0, 0, 7); ctx.fillStyle = o.apron || C.card; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = C.ink; ctx.stroke();
        if (o.text) K.txt(ctx, o.text, 0, -h * 0.155, { f: 'display', s: Math.round(h * 0.2), w: 900, c: o.textC || C.ink, a: 'center' });
      }
      ctx.save(); sil(ctx); ctx.clip(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(-w * 0.7, wy); ctx.lineTo(w * 0.7, wy); ctx.stroke(); ctx.restore();
      ctx.restore();
    };
    ctx.save(); ctx.translate(x, y); part(false);
    ctx.save(); ctx.translate(lift * h * 0.08, -lift * h * 0.3); ctx.rotate(lift * 0.22); part(true); ctx.restore();
    ctx.restore();
  };
  const chainRow = (ctx, cx, y, p) => {
    for (let i = 0; i < 4; i++) { const x = cx - 90 + i * 60; if (i) K.line(ctx, x - 40, y + 6, x - 20, y + 6, { lw: 5 }); at(ctx, p, x, y, (c) => I.block(c, 0, 0, 50, {})); }
  };
  SC['L8.2'] = (ctx, S) => {
    const L = S.sc.labels, ax = 728, bX = 1562, py = 512, t = S.t, ty = py - 96;
    S.noteTo = [1150, 650];
    const pa = S.pop(0.3), pb = S.pop(0.42);
    chainRow(ctx, ax, py, pa); chainRow(ctx, bX, py, pb);
    const [a1, a2] = L.a.split(' · '), [b1, b2] = L.b.split(' · ');
    label(ctx, a1, ax, py + 64, { s: 20, alpha: pa }); K.txt(ctx, a2 || '', ax, py + 96, { f: 'hand', s: 30, w: 700, c: C.ink2, a: 'center', alpha: pa });
    label(ctx, b1, bX, py + 64, { s: 20, alpha: pb }); K.txt(ctx, b2 || '', bX, py + 96, { f: 'hand', s: 30, w: 700, c: C.ink2, a: 'center', alpha: pb });
    // the bridge
    const br = S.at(0.35, 0.45);
    if (br > 0) {
      ctx.save(); ctx.globalAlpha *= br; ctx.lineCap = 'round';
      const deck = (lw, c) => { ctx.beginPath(); ctx.moveTo(862, py + 4); ctx.quadraticCurveTo(1145, py - 74, 1428, py + 4); ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.stroke(); };
      deck(16, C.ink); deck(9, '#B9B4A8');
      ctx.beginPath(); ctx.moveTo(862, py - 34); ctx.quadraticCurveTo(1145, py - 112, 1428, py - 34); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
      for (let i = 0; i <= 10; i++) { const u = i / 10, x = K.lerp(862, 1428, u), yd = (1 - u) * (1 - u) * (py + 4) + 2 * (1 - u) * u * (py - 74) + u * u * (py + 4); K.line(ctx, x, yd - 4, x, yd - 34, { lw: 3.5 }); }
      ctx.restore();
      label(ctx, 'BRIDGE', 1145, py + 38, { s: 15, ls: 3, c: C.ink3, alpha: br });
    }
    // the original on A gets locked
    const tp = S.pop(0.5), lk = S.at(0.8, 0.2, E.inCubic), lp = S.pop(1.0, 0.4);
    at(ctx, tp, ax, ty, (c) => K.coin(c, 0, 0, 44, {}));
    if (lk > 0) {
      const yy = K.lerp(ty - 66, ty, lk);
      ctx.save(); ctx.globalAlpha *= K.clamp(lk * 2);
      K.box(ctx, ax - 66, yy - 64, 132, 122, { r: 14, fill: 'rgba(143,211,255,.28)', stroke: C.ink, lw: 4 });
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(ax - 50, yy - 52, 10, 72);
      ctx.restore();
    }
    at(ctx, lp, ax, ty + 44, (c) => I.padlock(c, 0, 0, 62, { open: 1 - S.at(1.0, 0.12) }));
    label(ctx, L.lock, ax, ty - 82, { s: 18, c: C.red, alpha: S.at(1.0, 0.3) });
    // a representation appears on B
    const bm = S.at(1.45, 0.35);
    K.arrow(ctx, ax + 76, ty - 40, bX - 70, ty - 40, { p: bm, lw: 4, c: C.orange, dash: [12, 10], bend: -70, hs: 16 });
    const cp = S.pop(1.8);
    at(ctx, cp, bX, ty, (c) => K.coin(c, 0, 0, 44, { ghost: true, fill: '#FFE3CC', markC: C.orange }));
    // … and it opens like nesting dolls
    const yb = 788, xs = [1132, 1392, 1652], dB = S.pop(1.8), sA = S.at(2.4, 0.4, E.inOutCubic), sT = S.at(2.8, 0.4, E.inOutCubic);
    const oB = Math.sin(K.clamp(S.lin(2.3, 0.6)) * Math.PI), oA = Math.sin(K.clamp(S.lin(2.7, 0.6)) * Math.PI);
    if (dB > 0) {
      if (sT > 0) at(ctx, 1, K.lerp(xs[1], xs[2], sT), yb - 46, (c) => I.tbill(c, 0, 0, 76, {}));
      if (sA > 0) doll(ctx, K.lerp(xs[0], xs[1], sA), yb, 140, { text: 'A', open: oA });
      at(ctx, dB, xs[0], yb, (c) => doll(c, 0, 0, 176, { dash: true, fill: '#FFD7B8', text: 'B', textC: C.orange2, open: oB }));
      const c1 = S.at(2.75, 0.3), c2 = S.at(3.15, 0.3);
      K.arrow(ctx, xs[0] + 66, yb - 70, xs[1] - 58, yb - 70, { p: c1, lw: 4, c: C.orange, hs: 14 });
      K.txt(ctx, 'claim on', (xs[0] + xs[1]) / 2 + 2, yb - 88, { f: 'hand', s: 30, w: 700, c: C.orange, a: 'center', alpha: c1 });
      K.arrow(ctx, xs[1] + 54, yb - 70, xs[2] - 72, yb - 70, { p: c2, lw: 4, c: C.orange, hs: 14 });
      K.txt(ctx, 'claim on', (xs[1] + xs[2]) / 2 - 8, yb - 88, { f: 'hand', s: 30, w: 700, c: C.orange, a: 'center', alpha: c2 });
      label(ctx, 'ASSET', xs[2], yb + 2, { s: 17, alpha: S.at(3.1, 0.3) });
    }
    // which one the issuer will actually redeem
    const rg = S.at(3.45, 0.4);
    if (rg > 0) {
      const [r1, r2] = L.reg.split(': ');
      fade(ctx, rg, (c) => K.box(c, 600, 664, 404, 118, { r: 14, fill: C.card, stroke: C.ink, lw: 3.5, shadow: 10 }));
      label(ctx, r1.toUpperCase(), 802, 700, { s: 15, ls: 2, c: C.ink2, alpha: rg });
      K.txt(ctx, (r2 || '') + ' ✓', 802, 756, { f: 'display', s: 44, w: 900, st: 'semi-condensed', c: C.green, a: 'center', alpha: rg });
      at(ctx, S.pop(3.6, 0.4), bX + 40, ty - 40, (c) => { c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fillStyle = C.red; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke(); K.txt(c, '?', 0, 9, { f: 'display', s: 28, w: 900, c: C.card, a: 'center' }); });
    }
  };

  // 8.3 — the allowlist snaps into transfer(); one transfer settles, the other bounces on the spot
  SC['L8.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, cx0 = 600, cy0 = 304, cw = 720, ch = 96, gx = 1110, l1 = 590, l2 = 722, wX = 1610;
    S.noteTo = [1250, 660];
    // the code line, typed
    const cp = S.pop(0.1, 0.4);
    at(ctx, cp, cx0 + cw / 2, cy0 + ch / 2, (c) => {
      K.box(c, -cw / 2, -ch / 2, cw, ch, { r: 14, fill: '#1C150F', stroke: C.ink, lw: 4, shadow: 12 });
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.beginPath(); c.arc(-cw / 2 + 22 + i * 18, -ch / 2 + 18, 5, 0, 7); c.fillStyle = col; c.fill(); });
    });
    const code = L.code, fo = { f: 'mono', s: 27, w: 600 }, chW = K.measure(ctx, 'M', fo), tx0 = cx0 + 38, ty0 = cy0 + 68;
    const cols = []; const re = /[A-Za-z_]+|[^A-Za-z_]/g; let m;
    while ((m = re.exec(code))) { const tok = m[0]; let col = '#E8E1D2'; if (/^[A-Za-z_]+$/.test(tok)) { const nx = code[m.index + tok.length]; col = tok === 'allowlist' ? C.goldLite : nx === '(' ? '#FF9A5C' : '#8FD3FF'; } for (let i = 0; i < tok.length; i++) cols.push(col); }
    const n = Math.floor(code.length * S.lin(0.3, 0.85));
    for (let i = 0; i < n; i++) K.txt(ctx, code[i], tx0 + i * chW, ty0, Object.assign({ c: cols[i] }, fo));
    if (cp > 0 && (n < code.length || Math.sin(t * 9) > 0)) { ctx.fillStyle = 'rgba(244,241,234,.8)'; ctx.fillRect(tx0 + n * chW + 2, ty0 - 24, 3, 30); }
    // the allowlist clipboard snaps in
    const ai = code.indexOf('allowlist'), awx = tx0 + (ai + 4.5) * chW;
    const sn = back(S, 0.95, 0.3), lnk = S.at(1.2, 0.2);
    if (sn > 0) {
      const x = K.lerp(1650, 1462, sn), y = K.lerp(330, 370, K.clamp(sn)), w = 196, h = 168, k = K.lerp(0.55, 1, sn);
      ctx.save(); ctx.translate(x, y); ctx.rotate((1 - K.clamp(sn)) * 0.3); ctx.scale(k, k); ctx.globalAlpha *= K.clamp(sn * 4);
      K.box(ctx, -w / 2, -h / 2, w, h, { r: 12, fill: '#C9A36A', stroke: C.ink, lw: 4, shadow: 10 });
      K.box(ctx, -w / 2 + 10, -h / 2 + 16, w - 20, h - 26, { r: 6, fill: C.card, stroke: C.ink, lw: 3 });
      K.box(ctx, -32, -h / 2 - 8, 64, 22, { r: 6, fill: '#8C8C8C', stroke: C.ink, lw: 3 });
      label(ctx, 'ALLOWLIST', 0, -h / 2 + 46, { s: 16, ls: 2 });
      ['0x7a…f1', '0x3c…9b', '0xe5…07'].forEach((ad, i) => { K.txt(ctx, ad, -w / 2 + 26, -h / 2 + 82 + i * 28, { f: 'mono', s: 16, w: 600, c: C.ink2 }); K.check(ctx, w / 2 - 34, -h / 2 + 76 + i * 28, 22, 1, C.green, 4.5); });
      ctx.restore();
    }
    if (lnk > 0) { K.marker(ctx, tx0 + ai * chW - 4, ty0 - 26, chW * 9 + 8, 34, lnk, 'rgba(246,215,123,.25)'); K.arrow(ctx, 1362, 370, awx + chW * 5, cy0 + ch - 6, { p: lnk, lw: 3.5, c: C.goldDark, bend: -30, hs: 13, head: false }); }
    // the checkpoint: transfer() runs on every move
    const gp = S.pop(1.05, 0.4);
    fade(ctx, gp, (c) => { c.setLineDash([6, 8]); K.line(c, gx, cy0 + ch + 4, gx, 482, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
    const g1 = K.clamp(1 - Math.abs(S.bt - 1.62) / 0.25), g2 = K.clamp(1 - Math.abs(S.bt - 3.0) / 0.3) + (S.bt > 3.0 ? 0.35 : 0);
    at(ctx, gp, gx, 792, (c) => { // a scanner arch: the beam curtain flashes green / red per lane (scales from its base)
      c.translate(0, -152);
      for (let yy = -110; yy <= 140; yy += 14) {
        const up = yy < 16; let col = 'rgba(152,144,127,.4)';
        if (up && g1 > 0) col = `rgba(14,159,110,${0.4 + 0.6 * g1})`;
        if (!up && g2 > 0) col = `rgba(214,69,69,${0.4 + 0.6 * Math.min(1, g2)})`;
        c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(-32, yy); c.lineTo(32, yy); c.stroke();
      }
      K.box(c, -52, -124, 20, 276, { r: 6, fill: '#B9B4A8', stroke: C.ink, lw: 4 });
      K.box(c, 32, -124, 20, 276, { r: 6, fill: '#B9B4A8', stroke: C.ink, lw: 4 });
      K.box(c, -72, -156, 144, 38, { r: 9, fill: C.ink, stroke: C.ink, lw: 3 });
      K.txt(c, 'transfer()', 0, -130, { f: 'mono', s: 17, w: 700, c: C.bg, a: 'center' });
    });
    // sender + the two destinations
    const ps = S.pop(0.6), pw = S.pop(0.9);
    at(ctx, ps, 690, 656, (c) => I.wallet(c, 0, 0, 120, {}));
    label(ctx, 'SENDER', 690, 730, { s: 16, ls: 2, c: C.ink2, alpha: ps });
    fade(ctx, pw, (c) => { c.setLineDash([10, 9]); K.line(c, 760, 646, gx - 56, l1, { lw: 3, c: C.ink3 }); K.line(c, gx + 56, l1, wX - 74, l1, { lw: 3, c: C.ink3 }); K.line(c, 760, 666, gx - 56, l2, { lw: 3, c: C.ink3 }); K.line(c, gx + 56, l2, wX - 74, l2, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
    [[l1, true], [l2, false]].forEach(([y, ok]) => at(ctx, pw, wX, y, (c) => {
      I.wallet(c, 0, 0, 116, {});
      c.beginPath(); c.arc(56, -40, 19, 0, 7); c.fillStyle = ok ? C.green : '#9A9A9A'; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke();
      if (ok) K.check(c, 56, -40, 22, 1, C.card, 4.5); else K.txt(c, '?', 56, -31, { f: 'display', s: 26, w: 900, c: C.card, a: 'center' });
    }));
    label(ctx, 'VERIFIED', wX + 84, l1 + 7, { a: 'left', s: 16, ls: 1, c: C.green, alpha: pw });
    label(ctx, 'UNVERIFIED', wX + 84, l2 + 7, { a: 'left', s: 16, ls: 1, c: C.ink3, alpha: pw });
    // transfer 1 settles
    const u1 = S.lin(1.4, 0.4);
    if (u1 > 0) {
      const e = E.inOutCubic(u1), x = u1 < 1 ? K.lerp(740, wX - 40, e) : wX - 40, y = x < gx ? K.lerp(646, l1, (x - 740) / (gx - 740)) : l1;
      if (u1 < 1) K.coin(ctx, x, y - 26, 26, {}); else K.coin(ctx, wX - 14, l1 - 52, 22, {});
      at(ctx, S.pop(1.8, 0.4), wX, l1 - 96, (c) => K.chip(c, L.ok, 0, 0, { s: 18, fill: C.green, c: C.card, a: 'center' }));
    }
    // transfer 2 bounces off, instantly
    const u2 = S.lin(2.6, 0.4), bk = S.at(3.0, 0.45);
    if (u2 > 0) {
      let x, y, r = 0;
      if (bk <= 0) { const e = E.inCubic(u2); x = K.lerp(740, gx - 82, e); y = K.lerp(666, l2, e); }
      else { x = gx - 82 - bk * 176; y = l2 - Math.sin(bk * Math.PI) * 70 + bk * 26; r = -bk * 4; }
      ctx.save(); ctx.translate(x, y - 26); ctx.rotate(r); K.coin(ctx, 0, 0, 26, {}); ctx.restore();
      if (bk > 0) K.cross(ctx, gx - 82 - 176, l2 - 8, 46, S.lin(3.25, 0.25));
      if (S.bt > 3.0) at(ctx, S.pop(3.0, 0.35), 1376, 656, (c) => K.chip(c, L.no, 0, 0, { s: 17, fill: C.red, c: C.card, a: 'center' }));
    }
  };

  // 8.4 — ACCREDITED ONLY: a wealth test at a velvet rope. Two get in. The gate turns out to be a rulebook,
  // and an OPEN SYSTEMS banner puts the first cracks in the wall.
  const bricks = (ctx, x0, y0, x1, y1, door) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.rect(door.x + door.w, door.y, -door.w, door.h); ctx.clip('evenodd');
    ctx.fillStyle = '#DDA88A'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = '#B98267'; ctx.lineWidth = 3;
    for (let r = 0, y = y0; y < y1; r++, y += 32) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); for (let x = x0 + (r % 2 ? 38 : 0); x < x1; x += 76) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + 32, y1)); ctx.stroke(); } }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(door.x, y1); ctx.lineTo(door.x, door.y); ctx.lineTo(door.x + door.w, door.y); ctx.lineTo(door.x + door.w, y1); ctx.stroke();
  };
  const CRACKS = [ // under the banner, down both sides of the wall, never across the plaque or the door
    [[1196, 422], [1184, 458], [1198, 494], [1180, 528], [1210, 566], [1226, 612], [1262, 662], [1240, 724]],
    [[1210, 566], [1178, 598]], [[1248, 640], [1296, 652], [1318, 690]],
    [[1740, 418], [1756, 456], [1722, 492], [1762, 532], [1730, 582], [1772, 642], [1746, 704]],
    [[1730, 582], [1662, 610], [1604, 600], [1560, 644]], [[1722, 492], [1700, 524]],
    [[1488, 420], [1458, 442], [1418, 436], [1376, 450], [1320, 444]], [[1488, 420], [1532, 444], [1592, 438], [1646, 452]],
  ];
  SC['L8.4'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, wx0 = 1166, wx1 = 1806, wy0 = 334, fl = 760, door = { x: 1340, y: 548, w: 170, h: fl - 548 }, dX = door.x + door.w / 2;
    S.noteTo = [880, 640];
    fade(ctx, S.at(0.1, 0.4), (c) => K.line(c, 596, fl, 1808, fl, { lw: 3, c: C.ink3 }));
    // the wall, the warm room behind the door, the plaque with the wealth test
    const pw = S.pop(0.25, 0.5);
    if (pw > 0) {
      ctx.save(); ctx.translate(1486, fl); ctx.scale(1, pw); ctx.translate(-1486, -fl);
      const g = ctx.createLinearGradient(0, door.y, 0, fl); g.addColorStop(0, '#FFE7A8'); g.addColorStop(1, '#FFD27A');
      ctx.fillStyle = g; ctx.fillRect(door.x, door.y, door.w, door.h);
      bricks(ctx, wx0, wy0, wx1, fl, door);
      ctx.restore();
    }
    const pp = S.pop(0.3);
    at(ctx, pp, dX, 497, (c) => {
      const rules = [].concat(L.rule); // the eligibility tests, one per line
      K.box(c, -220, -45, 440, 54 + rules.length * 20, { r: 10, fill: '#E9C77E', stroke: C.ink, lw: 4, shadow: 10 });
      K.txt(c, L.rope, 0, -12, { f: 'display', s: 30, w: 900, st: 'semi-condensed', c: C.ink, a: 'center', ls: 2 });
      rules.forEach((r, i) => K.txt(c, r, 0, 14 + i * 20, { f: 'mono', s: 14, w: 700, c: C.ink2, a: 'center' }));
    });
    // the velvet rope (until the rulebook takes its place)
    const ropeA = 1 - S.at(2.2, 0.2), ropeOpen = S.at(1.4, 0.25) * (1 - S.at(1.92, 0.22));
    if (ropeA > 0) fade(ctx, ropeA * pp, (c) => I.rope(c, dX, 724, 116, { open: ropeOpen }));
    // the crowd: everyone else waits in the lobby; two badge-holders walk in
    const cols = [C.blue, C.teal, C.violet, '#C76B3A', '#3E8E5E', '#5C7A9A', '#B5578E', C.blue, C.teal, C.violet];
    const crowd = [[724, 700], [830, 700], [936, 700], [1042, 700], [1132, 700], [672, 730], [778, 730], [884, 730], [990, 730], [1086, 730]];
    const inside = { 4: 1.22, 9: 1.38 }, murmur = S.at(1.2, 0.3);
    const drawP = (k) => {
      const [x0, y0] = crowd[k], p = S.pop(0.3 + (k % 5) * 0.05); if (p <= 0) return;
      let x = x0 + 6 * murmur * Math.sin(t * 2 + k), y = y0 - Math.abs(Math.sin(t * 5 + k * 1.3)) * 5 * murmur, sc = p, al = 1;
      if (k in inside) {
        const st = inside[k], u = S.lin(st, 0.5), v = S.lin(st + 0.5, 0.26);
        x = K.lerp(x0, dX, E.inOutSine(u)); y = K.lerp(y0, 700, E.inOutSine(u)) - (u > 0 && u < 1 ? Math.abs(Math.sin(t * 12)) * 6 : 0);
        if (v > 0) { sc = p * K.lerp(1, 0.72, v); al = 1 - v; y -= v * 22; }
        if (v >= 1) return;
      }
      fade(ctx, al, (c) => at(c, sc, x, y, (cc) => {
        cc.beginPath(); cc.ellipse(0, 50, 32, 6, 0, 0, 7); cc.fillStyle = 'rgba(32,26,19,.12)'; cc.fill();
        I.person(cc, 0, 0, 128, { fill: cols[k] });
        if (k in inside) { cc.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; cc.lineTo(Math.cos(a) * r, 16 + Math.sin(a) * r); } cc.closePath(); cc.fillStyle = C.gold; cc.fill(); cc.lineWidth = 2.5; cc.strokeStyle = C.ink; cc.stroke(); }
      }));
    };
    for (let k = 0; k < 5; k++) drawP(k);
    for (let k = 5; k < 10; k++) drawP(k);
    // the gate, revealed: a rulebook on a pedestal (lands on the thud)
    const dr = S.at(2.18, 0.22, E.inCubic);
    if (dr > 0) {
      const by = K.lerp(240, 0, dr);
      K.box(ctx, dX - 58, 704, 116, 56, { r: 4, fill: '#E2DACB', stroke: C.ink, lw: 4 });
      K.box(ctx, dX - 70, 692, 140, 16, { r: 4, fill: '#D7CFBE', stroke: C.ink, lw: 4 });
      ctx.save(); ctx.translate(0, -by); ctx.globalAlpha *= K.clamp(dr * 3);
      K.box(ctx, dX - 54, 556, 122, 138, { r: 4, fill: '#F3EEE3', stroke: C.ink, lw: 3 });
      K.box(ctx, dX - 62, 550, 118, 142, { r: 8, fill: '#7A2E2E', stroke: C.ink, lw: 4 });
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(dX - 58, 554, 11, 134);
      ctx.strokeStyle = C.goldLite; ctx.lineWidth = 2; K.rr(ctx, dX - 42, 562, 90, 118, 4); ctx.stroke();
      K.txt(ctx, 'THE', dX + 3, 612, { f: 'mono', s: 15, w: 700, c: C.goldLite, a: 'center', ls: 3 });
      K.txt(ctx, 'RULEBOOK', dX + 3, 636, { f: 'mono', s: 15, w: 700, c: C.goldLite, a: 'center', ls: 0 });
      ctx.restore();
      label(ctx, 'THE GATE IS A RULEBOOK', dX, 792, { s: 15, ls: 2, c: C.ink2, alpha: S.at(2.6, 0.4) });
    }
    // open systems: the banner goes up and the wall starts to crack
    const bn = S.at(2.95, 0.3, E.outCubic), cr = S.at(3.2, 0.45);
    if (cr > 0) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      CRACKS.forEach((P, ci) => {
        const q = K.clamp(cr * 1.3 - (ci % 3) * 0.12), n = (P.length - 1) * q; if (q <= 0) return;
        const path = () => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i <= Math.ceil(n); i++) { const f = Math.min(1, n - (i - 1)); ctx.lineTo(K.lerp(P[i - 1][0], P[i][0], f), K.lerp(P[i - 1][1], P[i][1], f)); } };
        path(); ctx.strokeStyle = 'rgba(255,226,140,.95)'; ctx.lineWidth = 10; ctx.stroke();
        path(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.stroke();
      });
      ctx.restore();
      for (let i = 0; i < 6; i++) { const u = S.lin(3.25 + i * 0.07, 0.7); if (u <= 0 || u >= 1) continue; const x = i % 2 ? 1196 + K.hash(i + 3) * 70 : 1700 + K.hash(i + 3) * 80, y = 470 + K.hash(i + 9) * 110 + E.inCubic(u) * (fl - 500); ctx.save(); ctx.translate(x, y); ctx.rotate(u * 5 + i); ctx.globalAlpha *= 1 - K.clamp((u - 0.8) / 0.2); K.box(ctx, -12, -8, 24, 16, { r: 2, fill: '#DDA88A', stroke: C.ink, lw: 2.5 }); ctx.restore(); }
    }
    if (bn > 0) {
      ctx.save(); ctx.translate(1486, 384); ctx.rotate(-0.03); ctx.beginPath(); ctx.rect(-306, -44, 612 * bn, 88); ctx.clip();
      K.box(ctx, -300, -36, 600, 72, { r: 6, fill: C.orange, stroke: C.ink, lw: 4, shadow: 10 });
      K.headMark(ctx, -242, 0, 66, C.card);
      K.txt(ctx, L.open, 26, 17, { f: 'display', s: 48, w: 900, st: 'semi-condensed', c: C.card, a: 'center', ls: 3 });
      ctx.restore();
    }
  };

  // 8.5 — five homes for the same 8.0%: a dotted world map, the same sticker everywhere, a different court each time
  const MAP = [
    '##############......######...........................##.##...###############################################.',
    '################....#######......................#......##..##############################################...',
    '############################...................##.#...#####################################################..',
    '#############################.....................#########################################################.#',
    '..##########################.......................#########################################################.',
    '..########################.........................############.#######.###################################..',
    '.#######################...........................###.#..#####....###..#################################...#',
    '..#####################.........................####.....#.####.##.####..##############################......',
    '..###################...........................###...........#########..#########################...##....#.',
    '...##################..............................#####..........##################################..#...##.',
    '....################............................########.........##################################.....#....',
    '.....##############............................###########.####.####################################.........',
    '.....########.....#............................#################.######.############################.........',
    '......######......#..........................####################.#####...#########################..........',
    '.........###.................................####################.#########...####################.#.........',
    '.........###........#.......................######################.########....#######..######.#.............',
    '..........###..#.....###.....................#####################..######......#####....####................',
    '............####.............................######################.#####........###.....#####.....#.........',
    '...............###..........................##########################...........##.......#####..............',
    '.................#....#......................########################.##.........##.........###.....#........',
    '..................#########...................#########################............#.................#.......',
    '....................########...................#####.##################............#.......#.........#.......',
    '....................###########........................###############....................#.#....##..........',
    '...................############........................##############......................#...###..#........',
    '...................#############.......................#############.......................##..###.#....##...',
    '...................#################....................###########.........................##...........###.',
    '...................##################...................###########.......................................###'
  ], LON0 = -126.75, LAT0 = 58.75, STEP = 2.5;
  const mX = (lon) => 615 + (lon + 128) * 4.27, mY = (lat) => 300 + (60 - lat) * 4.27;
  const MAPBOX = { x: mX(LON0 - STEP), y: mY(LAT0 + STEP), w: (MAP[0].length + 2) * STEP * 4.27, h: (MAP.length + 2) * STEP * 4.27 };
  const mapCache = { k: 0, c: null };
  function mapCanvas(k, NC) {
    if (mapCache.c && mapCache.k === k) return mapCache.c;
    const c = document.createElement('canvas'); c.width = Math.ceil(MAPBOX.w * k); c.height = Math.ceil(MAPBOX.h * k);
    const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, -MAPBOX.x * k, -MAPBOX.y * k);
    x.fillStyle = '#C9BEA6'; x.beginPath();
    MAP.forEach((row, j) => { for (let i = 0; i < NC; i++) if (row[i] === '#') { const px = mX(LON0 + i * STEP), py = mY(LAT0 - j * STEP); x.moveTo(px + 3.3, py); x.arc(px, py, 3.3, 0, 7); } });
    x.fill();
    mapCache.k = k; mapCache.c = c; return c;
  }
  const GEO = { DELAWARE: [-75.5, 39.0], CAYMAN: [-81.2, 19.3], LIECHTENSTEIN: [9.5, 47.1], SINGAPORE: [103.8, 1.35], 'ABU DHABI': [54.4, 24.5] };
  const GAVEL = [['#7A4B2A', '#A0683C'], ['#3D5A80', '#6F8DB8'], ['#1F6F6F', '#3FA3A3'], ['#8E2C48', '#C25B78'], ['#5E6B24', '#93A146']];
  const gavel = (ctx, x, y, s, swing, head, handle) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(swing); ctx.lineWidth = Math.max(2.5, s * 0.05); ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    K.rr(ctx, -s * 0.05, -s * 0.05, s * 0.62, s * 0.1, s * 0.04); ctx.fillStyle = handle; ctx.fill(); ctx.stroke();
    K.rr(ctx, -s * 0.3, -s * 0.22, s * 0.3, s * 0.44, s * 0.06); ctx.fillStyle = head; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-s * 0.26, -s * 0.06, s * 0.22, s * 0.05); ctx.fillRect(-s * 0.26, s * 0.08, s * 0.22, s * 0.05);
    ctx.restore();
  };
  SC['L8.5'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, TX = [688, 939, 1190, 1441, 1692], ty = 610, tw = 228, th = 152;
    S.noteTo = [1060, 690];
    // the map
    // (perf) the ~1,500 dots are rasterised once into an offscreen canvas at the current device scale, then
    // revealed left -> right in column strips, so a frame costs a few drawImage calls instead of 1,500 fills
    const NC = MAP.length ? MAP[0].length : 0, k = ctx.getTransform().a, mc = mapCanvas(k, NC), ga = ctx.globalAlpha;
    const SW = 4; // columns per strip
    for (let c0 = 0; c0 < NC; c0 += SW) {
      const a = S.at(0.02 + ((c0 + SW / 2) / NC) * 0.45, 0.3); if (a <= 0) continue;
      const x0 = mX(LON0 + (c0 - 0.5) * STEP), x1 = mX(LON0 + (Math.min(NC, c0 + SW) - 0.5) * STEP);
      ctx.globalAlpha = ga * a;
      ctx.drawImage(mc, (x0 - MAPBOX.x) * k, 0, (x1 - x0) * k, mc.height, x0, MAPBOX.y, x1 - x0, MAPBOX.h);
    }
    ctx.globalAlpha = ga;
    // pins, sorted into tags left → right
    const pins = L.pins.map((nm, k) => { const g = GEO[nm.toUpperCase()] || [-100 + k * 50, 30]; return { nm, k, x: mX(g[0]), y: mY(g[1]), b: [0.3, 0.6, 0.9, 1.2, 1.5][k] || 0.3 + k * 0.3 }; });
    pins.slice().sort((a, b) => a.x - b.x).forEach((p, slot) => { p.tx = TX[slot]; });
    pins.forEach((p) => { // leader + tag
      const tp = S.pop(p.b + 0.08, 0.45); if (tp <= 0) return;
      fade(ctx, K.clamp(tp), (c) => { c.setLineDash([6, 7]); K.line(c, p.x, p.y + 4, p.tx, ty - 4, { lw: 2.5, c: C.ink3 }); c.setLineDash([]); });
      at(ctx, tp, p.tx, ty + th / 2, (c) => {
        K.box(c, -tw / 2, -th / 2, tw, th, { r: 14, fill: C.card, stroke: C.ink, lw: 3.5, shadow: 10 });
        label(c, p.nm, 0, -th / 2 + 32, { s: 17, ls: 2 });
        c.fillStyle = C.line2; c.fillRect(-tw / 2 + 16, -th / 2 + 46, tw - 32, 2);
      });
    });
    pins.forEach((p) => { // the pin itself drops on its beat
      const u = S.lin(p.b - 0.16, 0.16); if (u <= 0) return;
      const dy = (1 - E.inCubic(u)) * 40, sq = S.since(p.b) > 0 ? Math.exp(-S.since(p.b) * 10) * 0.18 : 0;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 10, 4, 0, 0, 7); ctx.fillStyle = 'rgba(32,26,19,.25)'; ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y - dy); ctx.scale(1 + sq, 1 - sq); I.pin(ctx, 0, 0, 44, { fill: C.orange }); ctx.restore();
    });
    // the same yield sticker on every one…
    pins.forEach((p, i) => {
      const s = S.lin(2.4 + i * 0.04, 0.18); if (s <= 0) return;
      const k = K.lerp(1.8, 1, E.outCubic(s));
      ctx.save(); ctx.translate(p.tx - 50, ty + 102); ctx.rotate(-0.08 + (i % 2) * 0.05); ctx.scale(k, k); ctx.globalAlpha *= K.clamp(s * 3);
      K.box(ctx, -54, -30, 108, 60, { r: 8, fill: C.neonYellow, stroke: C.ink, lw: 3 });
      K.txt(ctx, L.y, 0, 15, { f: 'display', s: 40, w: 900, st: 'condensed', c: C.ink, a: 'center' });
      ctx.restore();
    });
    // …and a different court behind each one
    pins.forEach((p, i) => {
      const r = S.at(2.62 + i * 0.03, 0.25); if (r <= 0) return;
      const sw = S.bt < 2.82 ? -1.25 * r : K.lerp(-1.25, -0.28, E.inCubic(S.lin(2.82, 0.18))), hit = S.since(3.0), rb = hit > 0 ? Math.exp(-hit * 9) * Math.sin(hit * 30) * 0.12 : 0;
      const bx = p.tx + 50, by = ty + 130;
      ctx.beginPath(); ctx.ellipse(bx, by, 34, 9, 0, 0, 7); ctx.fillStyle = '#5A4632'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      gavel(ctx, bx + 24, by - 32, 76, sw + rb, GAVEL[i % 5][0], GAVEL[i % 5][1]);
      if (hit > 0 && hit < 0.3) { ctx.save(); ctx.globalAlpha *= 1 - hit / 0.3; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (const a of [-2.6, -1.57, -0.54]) { ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * 34, by - 8 + Math.sin(a) * 22); ctx.lineTo(bx + Math.cos(a) * 50, by - 8 + Math.sin(a) * 32); ctx.stroke(); } ctx.restore(); }
    });
    // the questions the domicile answers
    const qa = S.at(3.3, 0.4);
    if (qa > 0) {
      const pre = 'DIFFERENT ANSWERS TO:  ', qs = L.q.map((q) => q.toUpperCase()).join('  ·  '), fo = { f: 'mono', s: 17, w: 700, ls: 2 };
      const w1 = K.measure(ctx, pre, fo), w2 = K.measure(ctx, qs, fo), x0 = 1190 - (w1 + w2) / 2;
      K.txt(ctx, pre, x0, 792, Object.assign({ c: C.orange, alpha: qa }, fo));
      K.txt(ctx, qs, x0 + w1, 792, Object.assign({ c: C.ink, alpha: qa }, fo));
    }
  };
})();
