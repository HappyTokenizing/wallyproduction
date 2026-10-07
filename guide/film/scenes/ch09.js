/* ch09.js — Commodities. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const aside = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 17, w: 600, c: C.ink2, a: 'center', ls: 1 }, o));
  const grow = (ctx, x, y, k, fn) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); };
  const STEEL = '#B9B4A8', STEEL2 = '#8E877B', DARK = '#3B3530';
  const quad = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

  // square vault frame with a round opening; inside(ctx) is clipped to the opening
  function vaultFrame(ctx, x, y, s, inside) {
    const R = s / 2, F = R * 1.08;
    K.box(ctx, x - F, y - F, F * 2, F * 2, { r: s * 0.07, fill: STEEL, stroke: C.ink, lw: 5 });
    ctx.fillStyle = STEEL2;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * F * 0.86, y + sy * F * 0.86, s * 0.022, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y, R * 0.92, 0, 7); ctx.fillStyle = DARK; ctx.fill();
    if (inside) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, R * 0.92, 0, 7); ctx.clip(); inside(ctx); ctx.restore(); }
    ctx.beginPath(); ctx.arc(x, y, R * 0.92, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
  }
  // round vault door hinged on the left edge of the opening (hx); k: 0 shut .. 1 swung wide open
  function vaultDoor(ctx, hx, y, R, k, spin = 0) {
    const th = k * 1.78, c = Math.cos(th), rx = Math.max(R * 0.07, R * Math.abs(c)), cx = hx + R * c;
    const off = -Math.sin(th) * R * 0.1;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 5;
    if (k > 0.01) { ctx.beginPath(); ctx.ellipse(cx + off, y, rx, R, 0, 0, 7); ctx.fillStyle = '#6E675C'; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(cx, y, rx, R, 0, 0, 7); ctx.fillStyle = STEEL2; ctx.fill(); ctx.stroke();
    if (c > 0.05) {
      ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(cx, y, rx * 0.68, R * 0.68, 0, 0, 7); ctx.stroke();
      ctx.lineWidth = 7;
      for (let i = 0; i < 3; i++) { const a = spin + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rx * 0.5, y + Math.sin(a) * R * 0.5); ctx.lineTo(cx - Math.cos(a) * rx * 0.5, y - Math.sin(a) * R * 0.5); ctx.stroke(); }
      ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, y, rx * 0.15, R * 0.15, 0, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = C.ink; for (const sy of [-0.55, 0.55]) K.rr(ctx, hx - 9, y + sy * R - 14, 18, 28, 4), ctx.fill();
    ctx.restore();
  }
  // round numbered badge (the auditor's count)
  function countBadge(ctx, x, y, n, p) {
    grow(ctx, x, y, p, () => {
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.card; ctx.stroke();
      K.txt(ctx, String(n), 0, 6.5, { f: 'display', s: 19, w: 900, c: C.card, a: 'center' });
    });
  }

  // 9.1 The metal stays in the vault; the auditor counts it; 1-gram claims zip out to wallets around the world
  SC['L9.1'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, vx = 795, vy = 520, s = 320, R = s / 2, F = R * 1.08;
    S.noteTo = [790, 540];
    const vp = S.pop(0.0, 0.45), open = S.at(0.3, 0.75, E.inOutCubic);
    const hop = S.lin(2.5, 0.4), hopY = -Math.sin(hop * Math.PI) * 18;
    const bars = [[-84, 46], [0, 46], [84, 46], [-42, 6], [42, 6], [0, -34]];
    const by = (k) => bars[k][1] + (k === 5 ? hopY : 0);
    grow(ctx, vx, vy, vp, () => {
      vaultFrame(ctx, 0, 0, s, (c) => bars.forEach(([x], k) => I.goldbar(c, x, by(k), 66)));
      bars.forEach(([x], k) => countBadge(ctx, x - 3, by(k) + 7, k + 1, S.pop(1.0 + k * 0.08, 0.35)));
      vaultDoor(ctx, -R * 0.92, 0, R * 0.92, open, S.at(0, 0.35) * 2.4);
    });
    label(ctx, L.vault, vx, vy - F - 20, { s: 22, alpha: S.at(0.1, 0.3) });
    label(ctx, L.audit, vx, vy + F + 42, { c: C.green, alpha: S.at(1.25, 0.4) });

    // the claims: three 1 g tokens, tethered to the bars, zip out to wallets around the globe
    const gx = 1598, gy = 548, W = [[1454, 428], [1752, 492], [1590, 714]], P0 = [[1056, 420], [1056, 522], [1056, 624]];
    const src = [vx + 118, vy + 30], land = (k) => [W[k][0] - 14, W[k][1] - 44];
    const fly = (k) => S.at(2.4 + k * 0.1, 0.75, E.inOutCubic);
    const pos = (k, u) => {
      const a = S.at(1.8 + k * 0.2, 0.45), ax = K.lerp(vx + F - 20, P0[k][0], a), ay = P0[k][1];
      const [bx, by2] = land(k), mx = (ax + bx) / 2, my = Math.min(ay, by2) - 110;
      return { x: quad(ax, mx, bx, u), y: quad(ay, my, by2, u) };
    };
    for (let k = 0; k < 3; k++) {
      if (S.bt < 1.8 + k * 0.2) continue;
      const q = pos(k, fly(k));
      K.line(ctx, src[0], src[1], q.x, q.y, { lw: 3, c: C.ink2, dash: [5, 9] });
    }
    grow(ctx, gx, gy, S.pop(1.45, 0.5), () => I.globe(ctx, 0, 0, 236, { spin: t * 0.07 }));
    for (let k = 0; k < 3; k++) {
      const wp = S.pop(1.55 + k * 0.08, 0.45); if (wp <= 0) continue;
      const lt = S.since(2.4 + k * 0.1 + 0.75), bump = lt > 0 && lt < 0.3 ? Math.sin(lt / 0.3 * Math.PI) * 0.09 : 0;
      grow(ctx, W[k][0], W[k][1], wp * (1 + bump), () => I.wallet(ctx, 0, 0, 104));
    }
    for (let k = 0; k < 3; k++) {
      const p = S.pop(1.8 + k * 0.2, 0.45), u = fly(k); if (p <= 0) continue;
      if (u > 0 && u < 1) { ctx.save(); for (let j = 3; j >= 1; j--) { const g = pos(k, Math.max(0, u - j * 0.07)); ctx.globalAlpha = 0.16 * (4 - j); ctx.beginPath(); ctx.arc(g.x, g.y, 36 - j * 3, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); } ctx.restore(); }
      const q = pos(k, u), r = K.lerp(38, 31, u);
      grow(ctx, q.x, q.y, p, () => K.coin(ctx, 0, 0, r, { label: '1 g' }));
    }
    const tg = S.pop(1.9, 0.45);
    grow(ctx, 1222, 382, tg, () => K.chip(ctx, L.tok, 0, 0, { s: 20, w: 700, fill: C.bg, c: C.orange, stroke: C.orange, lw: 3, a: 'center', ls: 2 }));
  };

  // 9.2 Three issuers on gold pedestals; the share is mostly gold; the vault checklist is what decides it
  SC['L9.2'] = (ctx, S) => {
    const L = S.sc.labels, xs = [700, 900, 1100], py = 524;
    S.noteTo = [1380, 470];
    L.logos.forEach(([logo, name], k) => {
      const p = S.pop(0.3 + k * 0.4); if (p <= 0) return;
      grow(ctx, xs[k], py, p, () => { I.goldbar(ctx, 0, 0, 128); K.logo(ctx, logo, 0, -104, 60, { stroke: C.ink, lw: 4 }); });
      label(ctx, name.toUpperCase(), xs[k], py + 74, { s: 18, ls: 2, alpha: K.clamp(p) });
    });
    // share bar: mostly gold, a sliver of everything else
    const sb = S.at(2.2, 0.7), x0 = 610, x1 = 1190, y0 = 660, h = 46, g = 0.93;
    if (sb > 0) {
      const ww = (x1 - x0) * sb, gw = (x1 - x0) * g, sw = (x1 - x0) * (1 - g) / 3;
      ctx.save(); K.rr(ctx, x0, y0, ww, h, 10); ctx.clip();
      ctx.fillStyle = C.gold; ctx.fillRect(x0, y0, gw, h);
      ['#C9CDD3', '#EFEDE8', '#2B2622'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x0 + gw + i * sw, y0, sw + 1, h); });
      ctx.restore();
      K.rr(ctx, x0, y0, ww, h, 10); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
      if (sb > 0.95) K.line(ctx, x0 + gw, y0, x0 + gw, y0 + h, { lw: 3 });
      label(ctx, L.mostly.toUpperCase(), x0 + 22, y0 + 31, { a: 'left', s: 20, alpha: K.clamp(sb * 3 - 1.5) });
      const r = S.at(2.6, 0.4);
      ctx.save(); ctx.globalAlpha = r; K.line(ctx, x0 + gw + sw * 1.5, y0 + h + 6, x0 + gw + sw * 1.5, y0 + h + 20, { lw: 2.5, c: C.ink2 }); ctx.restore();
      aside(ctx, L.rest, x1, y0 + h + 44, { a: 'right', alpha: r });
    }
    // what decides it: the vault
    const cp = S.pop(2.5, 0.5);
    grow(ctx, 1530, 522, cp, () => I.clipboard(ctx, 0, 0, 296, { wide: 1.24, ts: 0.064, items: L.check.map((c, i) => [c.toUpperCase(), S.lin(3.0 + i * 0.2, 0.3)]) }));
    label(ctx, 'ASK THE VAULT', 1530, 340, { c: C.orange, s: 22, alpha: K.clamp(cp) });
    const ra = S.at(3.8, 0.5), rw = K.measure(ctx, 'REDEMPTION ', { f: 'mono', s: 19, w: 700, ls: 2 }), tw = K.measure(ctx, 'is where they separate', { f: 'mono', s: 18, w: 600, ls: 1 });
    label(ctx, 'REDEMPTION', 1530 - (rw + tw) / 2, 742, { a: 'left', s: 19, ls: 2, c: C.orange, alpha: ra });
    aside(ctx, 'is where they separate', 1530 - (rw + tw) / 2 + rw, 742, { a: 'left', s: 18, c: C.ink, alpha: ra });
  };

  // 9.3 Allocated bars vs an unallocated pool; then redemption: cash for most, a full bar for the brave
  SC['L9.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t;
    S.noteTo = [1690, 690];
    // ---- ALLOCATED (top left): specific bars with serial numbers
    const a = S.at(0.3, 0.4), ap = S.pop(0.3);
    label(ctx, L.alloc, 600, 326, { a: 'left', s: 26, c: C.green, alpha: a });
    aside(ctx, L.allocSub, 600, 357, { a: 'left', alpha: a });
    grow(ctx, 800, 448, ap, () => {
      K.box(ctx, -200, -60, 400, 120, { r: 16, fill: DARK, stroke: C.ink, lw: 5 });
      [-118, 0, 118].forEach((x) => I.goldbar(ctx, x, -12, 74));
    });
    [-118, 0, 118].forEach((x, k) => {
      const p = S.pop(1.0 + k * 0.1, 0.4); if (p <= 0) return;
      grow(ctx, 800 + x, 484, p, () => { K.box(ctx, -40, -14, 80, 28, { r: 6, fill: C.card, stroke: C.ink, lw: 3 }); K.txt(ctx, '#' + (4471 + k), 0, 7, { f: 'mono', s: 15, w: 700, c: C.ink, a: 'center' }); });
    });
    const ck = S.pop(1.3, 0.4);
    grow(ctx, 1018, 398, ck, () => { ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke(); K.check(ctx, 1, 2, 30, 1, C.card, 6); });
    // ---- UNALLOCATED (top right): a pool, and a queue of creditors with you at the back
    const b = S.at(1.8, 0.4), bp = S.pop(1.8);
    label(ctx, L.unalloc, 1232, 326, { a: 'left', s: 26, c: C.red, alpha: b });
    L.unallocSub.split(' · ').forEach((ln, i) => aside(ctx, ln, 1232, 357 + i * 24, { a: 'left', alpha: b }));
    const pile = [[-62, 30, 0.06], [0, 34, -0.04], [62, 30, 0.1], [-30, 2, -0.12], [32, 4, 0.08], [2, -24, -0.05]];
    grow(ctx, 1712, 458, bp, () => pile.forEach(([x, y, r]) => I.goldbar(ctx, x, y, 60, { rot: r })));
    label(ctx, 'THE POOL', 1712, 526, { s: 16, c: C.ink2, alpha: b });
    const fills = [C.blue, C.violet, C.teal, '#9C9488', C.blue, C.teal, C.violet];
    for (let k = 0; k < 7; k++) {
      const p = S.pop(2.4 + (6 - k) * 0.06, 0.4); if (p <= 0) continue;
      const x = 1590 - k * 52, you = k === 6, bob = Math.sin(t * 7 + k * 1.3) * 2;
      grow(ctx, x, 476 + bob, p, () => I.person(ctx, 0, 0, 74, { fill: you ? C.orange : fills[k] }));
    }
    label(ctx, 'YOU', 1278, 534, { s: 16, c: C.orange, alpha: S.at(2.8, 0.3) });
    // ---- REDEMPTION
    const d = S.at(2.8, 0.5);
    if (d > 0) {
      K.line(ctx, 600, 560, K.lerp(600, 1810, d), 560, { lw: 2.5, c: C.line2, dash: [10, 10] });
      K.box(ctx, 588, 544, 196, 32, { r: 6, fill: C.bg, stroke: null });
      label(ctx, 'REDEMPTION', 600, 568, { a: 'left', s: 18, c: C.orange, ls: 4, alpha: d });
    }
    // cash settlement (bottom left)
    grow(ctx, 660, 680, S.pop(3.0, 0.5), () => K.coin(ctx, 0, 0, 34, {}));
    K.arrow(ctx, 708, 680, 772, 680, { p: S.at(3.15, 0.3), lw: 4, hs: 14 });
    grow(ctx, 840, 680, S.pop(3.25, 0.45), () => I.cash(ctx, 0, 0, 72));
    const [c1, c2] = L.cash.split(': ');
    label(ctx, c1.toUpperCase(), 925, 670, { a: 'left', s: 20, alpha: S.at(3.0, 0.4) });
    aside(ctx, c2, 925, 702, { a: 'left', c: C.green, s: 18, alpha: S.at(3.2, 0.4) });
    // physical (bottom right): full bar · full KYC · shipping at your cost — and Wally strains under the bar
    const ph = L.phys.split(': '), items = ph[1].split(' · ');
    label(ctx, ph[0].toUpperCase(), 1232, 628, { a: 'left', s: 20, alpha: S.at(3.3, 0.4) });
    items.forEach((it, i) => aside(ctx, '+ ' + it, 1232, 664 + i * 30, { a: 'left', s: 18, c: i === 2 ? C.red : C.ink2, alpha: S.at(3.4 + i * 0.12, 0.35) }));
    const wp = S.at(3.25, 0.3);
    if (wp > 0) {
      const lt = S.since(3.6), drop = S.at(3.35, 0.25, E.inCubic);
      const sq = lt > 0 ? 0.11 + 0.04 * Math.exp(-lt * 6) * Math.sin(lt * 40) + Math.sin(t * 31) * 0.006 : 0;
      const wx = 1690, wyF = 794, s = 0.31, headTop = wyF - (591 - 29) * s * (1 - sq);
      ctx.save(); ctx.globalAlpha = wp;
      window.WallyRig.draw(ctx, { x: wx, y: wyF, s, squash: sq, rot: lt > 0 ? Math.sin(t * 23) * 0.012 : 0, blink: lt > 0 ? 0.55 : 0, trunk: { bend: 0.35, curl: 0.55, lift: 0.15 }, earL: lt > 0 ? 0.14 : 0, earR: lt > 0 ? 0.14 : 0 });
      ctx.save(); ctx.beginPath(); ctx.rect(1200, 566, 640, 260); ctx.clip();
      I.goldbar(ctx, wx, K.lerp(500, headTop - 30, drop), 132, { serial: 'FULL BAR' });
      ctx.restore();
      if (lt > 0) for (let i = 0; i < 3; i++) {
        const k = (lt * 1.6 + i / 3) % 1, sx = i === 1 ? 1 : -1;
        ctx.save(); ctx.globalAlpha = wp * Math.sin(k * Math.PI); ctx.translate(wx + sx * (52 + k * 30), headTop + 26 - Math.sin(k * Math.PI) * 20 + k * 12);
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(7, 0, 0, 6); ctx.quadraticCurveTo(-7, 0, 0, -10); ctx.fillStyle = '#7FC4F5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }
  };
})();
