/* ch03.js — Market Structure. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin
   note and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const bump = (S, b, d = 0.3) => { const u = (S.bt - b) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
  // eased-with-overshoot progress that is exactly 0 before beat b (E.outBack(0) is not exactly 0)
  const back = (S, b, d) => (S.bt <= b ? 0 : S.at(b, d, E.outBack));
  const caption = (ctx, ls, x, y, o = {}) => ls.forEach((l, i) => K.txt(ctx, l, x, y + i * (o.lh || 26), Object.assign({ f: 'mono', s: 18, w: 600, c: C.ink2, a: 'center', ls: 0.5 }, o)));
  // balanced 2-line wrap (prefers a split after ':' or '.')
  const wrap2 = (ctx, str, maxW, o) => {
    if (K.measure(ctx, str, o) <= maxW) return [str];
    const w = String(str).split(' '); let best = null, bs = 1e9;
    for (let i = 1; i < w.length; i++) {
      const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(K.measure(ctx, a, o), K.measure(ctx, b, o));
      const sc = m - (/[.:]$/.test(a) ? 80 : 0); if (m <= maxW + 40 && sc < bs) { bs = sc; best = [a, b]; }
    }
    return best || K.wrap(ctx, str, maxW, o);
  };
  // classic mouse pointer, tip at (x,y)
  function cursor(ctx, x, y, s = 1.5) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.12);
    ctx.beginPath(); const P = [[0, 0], [0, 30], [8, 23], [13.5, 35], [19, 32.5], [13.5, 21], [23, 21]];
    P.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, p[0], p[1])); ctx.closePath();
    ctx.fillStyle = C.card; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // 3.1 Secondary liquidity — SELL is pressed into an empty room; then value vs volume bars
  SC['L3.1'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, bx = 812, by = 372; S.noteTo = [800, 600];
    // the SELL button
    const bp = S.pop(0.05, 0.45), press = K.clamp(bump(S, 0.42, 0.32) * 1.6);
    if (bp > 0) {
      ctx.save(); ctx.translate(bx, by); ctx.scale(bp, bp);
      K.box(ctx, -150, -44, 300, 98, { r: 49, fill: '#8E2424', stroke: C.ink, lw: 5 });
      K.box(ctx, -150, -54 + press * 9, 300, 92, { r: 46, fill: C.red, stroke: C.ink, lw: 5 });
      K.txt(ctx, 'SELL ▸', 0, 11 + press * 9, { f: 'display', s: 52, w: 900, st: 'semi-condensed', c: C.card, a: 'center', ls: 2 });
      ctx.restore();
    }
    // the pointer comes in and clicks
    const cin = S.at(0.0, 0.4, E.outCubic), cout = S.at(0.9, 0.5, E.inCubic);
    if (cin > 0 && cout < 1) cursor(ctx, K.lerp(1010, bx + 40, cin) + cout * 120, K.lerp(470, by + 10, cin) + press * 6 + cout * 60, 1.6);
    // spotlight on an empty floor, two crickets
    const sp = S.at(1.0, 0.25), fx = bx, fy = 690;
    if (sp > 0) {
      ctx.save(); ctx.globalAlpha = sp;
      const g = ctx.createLinearGradient(0, 470, 0, fy); g.addColorStop(0, 'rgba(255,226,74,.50)'); g.addColorStop(1, 'rgba(255,226,74,.20)');
      ctx.beginPath(); ctx.moveTo(fx - 26, 474); ctx.lineTo(fx + 26, 474); ctx.lineTo(fx + 170, fy); ctx.lineTo(fx - 170, fy); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.ellipse(fx, fy, 172, 24, 0, 0, 7); ctx.fillStyle = 'rgba(255,226,74,.42)'; ctx.fill();
      // lamp
      ctx.beginPath(); ctx.moveTo(fx - 22, 476); ctx.lineTo(fx + 22, 476); ctx.lineTo(fx + 14, 452); ctx.lineTo(fx - 14, 452); ctx.closePath(); ctx.fillStyle = C.ink2; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.restore();
      K.line(ctx, fx - 220, fy + 24, fx + 220, fy + 24, { lw: 3, c: C.line2 });
      const chirp = (k) => (Math.sin(t * 26 + k * 2) > 0.2 ? 1 : 0);
      for (const [k, x, flip] of [[0, fx - 62, 1], [1, fx + 66, -1]]) {
        const cp = S.pop(1.0 + k * 0.12, 0.4); if (cp <= 0) continue;
        ctx.save(); ctx.translate(x, fy - 8 - chirp(k) * 2); ctx.scale(cp * flip, cp); I.cricket(ctx, 0, 0, 74, { chirp: chirp(k) }); ctx.restore();
        if ((Math.floor(t * 2.2 + k * 0.5) % 2) === 0) K.txt(ctx, 'chirp', x + flip * -6, fy - 54, { f: 'hand', s: 30, w: 700, c: C.ink2, a: 'center', alpha: cp });
      }
      label(ctx, 'BUYERS: 0', fx, fy + 66, { s: 18, c: C.ink3, ls: 4, alpha: sp });
    }
    // bars: total value vs 30-day volume
    const [vName, vAmt] = L.value.split(' $'), [qName, qAmt] = L.volume.split(' $');
    const base = 700, b1x = 1335, b2x = 1625, bw = 170, H = 380;
    const ax = S.at(2.2, 0.4);
    if (ax > 0) { K.line(ctx, 1170, base, K.lerp(1170, 1790, ax), base, { lw: 4, c: C.ink }); K.txt(ctx, 'illustrative', 1790, 318, { f: 'mono', s: 15, w: 600, c: C.ink3, a: 'right', ls: 1, alpha: ax }); }
    const g1 = back(S, 2.4, 0.55);
    if (g1 > 0) {
      const h = H * g1; K.box(ctx, b1x - bw / 2, base - h, bw, h, { r: 6, fill: C.orange, stroke: C.ink, lw: 4.5 });
      K.txt(ctx, '$' + vAmt, b1x, base - H + 70, { f: 'display', s: 62, w: 900, st: 'condensed', c: C.card, a: 'center', alpha: S.at(2.6, 0.3) });
      label(ctx, vName, b1x, base + 38, { s: 20 });
    }
    const g2 = S.pop(2.9, 0.4);
    if (g2 > 0) {
      K.box(ctx, b2x - bw / 2, base - 4 * K.clamp(g2), bw, 4 * K.clamp(g2), { r: 1, fill: C.orange, stroke: C.ink, lw: 2 });
      label(ctx, qName, b2x, base + 38, { s: 20 });
      // you need a magnifier to see it
      const mg = S.pop(3.1, 0.45);
      if (mg > 0) {
        const lx = b2x, ly = base - 70, R = 46;
        ctx.save(); ctx.translate(lx, ly); ctx.scale(mg, mg);
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = 'rgba(235,246,255,.92)'; ctx.fill(); ctx.clip();
        ctx.fillStyle = C.orange; ctx.fillRect(-R + 16, 4, 2 * R - 32, 16); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.strokeRect(-R + 16, 4, 2 * R - 32, 16); K.line(ctx, -R, 21, R, 21, { lw: 6, c: C.ink });
        ctx.restore();
        ctx.lineCap = 'round'; ctx.lineWidth = 13; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(R * 0.72, -R * 0.72); ctx.lineTo(R * 1.55, -R * 1.55); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.lineWidth = 8; ctx.stroke();
        ctx.restore();
        K.txt(ctx, '$' + qAmt, b2x - 14, base - 138, { f: 'display', s: 62, w: 900, st: 'condensed', c: C.ink, a: 'center', alpha: K.clamp(mg) });
        ctx.save(); ctx.globalAlpha = K.clamp(mg); ctx.setLineDash([4, 6]); K.line(ctx, b2x, base - 22, b2x, base - 6, { lw: 2.5, c: C.ink2 }); ctx.restore();
      }
    }
  };

  // money bag
  function moneyBag(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = Math.max(2.5, s * 0.06); ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.3); ctx.quadraticCurveTo(-s * 0.52, s * 0.04, -s * 0.38, s * 0.36); ctx.lineTo(s * 0.38, s * 0.36); ctx.quadraticCurveTo(s * 0.52, s * 0.04, s * 0.16, -s * 0.3); ctx.closePath(); ctx.fillStyle = '#D2AE72'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.13, -s * 0.31); ctx.lineTo(-s * 0.26, -s * 0.48); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s * 0.26, -s * 0.48); ctx.lineTo(s * 0.13, -s * 0.31); ctx.closePath(); ctx.fillStyle = '#C49A5A'; ctx.fill(); ctx.stroke();
    K.txt(ctx, '$', 0, s * 0.21, { f: 'display', s: s * 0.4, w: 900, c: '#2F5F2C', a: 'center' });
    ctx.restore();
  }
  // checkered finish strip
  function finish(ctx, x, y0, y1, sq = 12) {
    for (let j = 0, y = y0; y < y1; j++, y += sq) for (let i = 0; i < 2; i++) { ctx.fillStyle = (i + j) % 2 ? C.ink : C.card; ctx.fillRect(x + i * sq, y, sq, Math.min(sq, y1 - y)); }
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.strokeRect(x, y0, sq * 2, y1 - y0);
  }

  // 3.2 Settlement — the token leg finishes instantly; the cash leg is a snail with a money bag
  SC['L3.2'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, x0 = 610, x1 = 1640, fl = 1588, y1 = 420, y2 = 614, lh = 72; S.noteTo = [900, 600];
    const lp = S.at(0.05, 0.35);
    // lanes
    for (const [y, name, k] of [[y1, L.token, 0], [y2, L.cash, 1]]) {
      const red = k === 1 ? S.at(3.2, 0.3) : 0;
      ctx.save(); ctx.globalAlpha = lp;
      K.box(ctx, x0, y - lh / 2, x1 - x0, lh, { r: 16, fill: red > 0 ? `rgba(214,69,69,${0.07 * red})` : C.raise, stroke: red > 0.5 ? C.red : C.line2, lw: red > 0.5 ? 4 : 3 });
      ctx.setLineDash([16, 14]); K.line(ctx, x0 + 60, y, fl - 20, y, { lw: 2.5, c: C.line2 }); ctx.restore();
      label(ctx, name, x0 + 4, y - lh / 2 - 14, { a: 'left', s: 20, ls: 4, c: k ? C.ink : C.orange, alpha: lp });
    }
    if (lp > 0) { ctx.save(); ctx.globalAlpha = lp; finish(ctx, fl, y1 - lh / 2, y1 + lh / 2); finish(ctx, fl, y2 - lh / 2, y2 + lh / 2); ctx.restore(); }
    // TOKEN LEG: zap — start to finish in one frame
    const z = S.at(0.4, 0.14, E.outExpo), zx = K.lerp(x0 + 52, fl - 34, z);
    if (S.bt > 0.15) {
      if (z > 0) {
        const fade = 1 - S.at(0.7, 0.6);
        ctx.save(); ctx.globalAlpha = fade; ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const yy = y1 - 18 + i * 12, len = (zx - x0 - 60) * (0.55 + 0.45 * K.hash(i + 2)); ctx.strokeStyle = i % 2 ? C.orange : C.gold; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(zx - 40 - len, yy); ctx.lineTo(zx - 40, yy); ctx.stroke(); }
        ctx.restore();
      }
      I.bolt(ctx, zx - 40, y1 - 2, 56, { rot: 0.5 });
      ctx.save(); ctx.translate(zx, y1); const sp = S.pop(0.15, 0.35); ctx.scale(sp, sp); K.coin(ctx, 0, 0, 27, {}); ctx.restore();
    }
    const okP = S.pop(1.0, 0.4);
    if (okP > 0) { ctx.save(); ctx.translate(1724, y1); ctx.scale(okP, okP); K.chip(ctx, 'T+0 ✓', 0, 0, { s: 26, fill: C.green, c: C.card, a: 'center', w: 700, ls: 2 }); ctx.restore(); K.txt(ctx, 'done', 1724, y1 + 50, { f: 'mono', s: 17, w: 700, c: C.green, a: 'center', ls: 2, alpha: K.clamp(okP) }); }
    // CASH LEG: a snail hauling the money, crawling
    const crawl = S.lin(0.6, 6.4), sx = K.lerp(x0 + 150, x0 + 330, crawl) + Math.sin(t * 5) * 1.5;
    const sn = S.pop(0.3, 0.45);
    if (sn > 0) {
      ctx.save(); ctx.globalAlpha = K.clamp(sn);
      ctx.lineWidth = 3; ctx.strokeStyle = C.ink2; ctx.beginPath(); ctx.moveTo(sx - 30, y2 - 6); ctx.quadraticCurveTo(sx - 52, y2 + 8, sx - 76, y2 - 2); ctx.stroke();
      moneyBag(ctx, sx - 100, y2 + 4, 62);
      ctx.save(); ctx.translate(sx, y2 - 4); ctx.scale(-1, 1); I.snail(ctx, 0, 0, 86, {}); ctx.restore();
      ctx.restore();
    }
    // day counter at the cash finish
    const cp = S.pop(0.6, 0.4);
    if (cp > 0) {
      const day = S.bt >= 1.6 ? 1 : 0, flip = day === 0 ? 1 : S.at(1.6, 0.22, E.outBack); // US trades settle T+1; the wire lands next business day
      ctx.save(); ctx.translate(1724, y2 + 4); ctx.scale(cp, cp);
      I.calendar(ctx, 0, 0, 104, { top: C.ink2, label: 'CASH' });
      ctx.save(); ctx.translate(0, 0); ctx.scale(1, K.clamp(flip, 0.05, 1.2)); K.txt(ctx, 'T+' + day, 0, 30, { f: 'display', s: 40, w: 900, st: 'condensed', c: day ? C.red : C.ink, a: 'center' }); ctx.restore();
      ctx.restore();
      if (S.bt > 1.6) K.txt(ctx, 'processing…', 1724, y2 + 84, { f: 'mono', s: 17, w: 600, c: C.ink2, a: 'center', ls: 1, alpha: S.at(1.6, 0.3) });
    }
    // the red flag: settlement risk lives here
    const rp = S.pop(3.2, 0.4);
    if (rp > 0) {
      const wx = 1190;
      ctx.save(); ctx.translate(wx, y2); ctx.scale(rp, rp);
      ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(38, 30); ctx.lineTo(-38, 30); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      K.txt(ctx, '!', 0, 22, { f: 'display', s: 44, w: 900, c: C.card, a: 'center' });
      ctx.restore();
      label(ctx, 'settlement risk lives here', wx, y2 + lh / 2 + 36, { s: 20, c: C.red, ls: 1.5, alpha: K.clamp(rp) });
    }
  };

  // corner cobweb: anchored at (x,y), spreading into the quadrant given by (sx,sy)
  function cobweb(ctx, x, y, r, sx, sy, p) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(92,84,71,.75)'; ctx.lineCap = 'round';
    const n = 5, R = r * p;
    for (let i = 0; i < n; i++) { const a = (i / (n - 1)) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); }
    for (let k = 1; k <= 4; k++) {
      const rr = R * k / 4.4; ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = (i / (n - 1)) * Math.PI / 2, a0 = ((i - 1) / (n - 1)) * Math.PI / 2; if (!i) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else { const am = (a + a0) / 2; ctx.quadraticCurveTo(Math.cos(am) * rr * 0.86, Math.sin(am) * rr * 0.86, Math.cos(a) * rr, Math.sin(a) * rr); } }
      ctx.stroke();
    }
    ctx.restore();
  }
  function fly(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(200,225,255,.85)'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; const fl = Math.sin(t * 80) * 0.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 5, -6, 6, 3.5, s * (0.6 + fl), 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
    ctx.restore();
  }

  // 3.3 Order books vs AMMs — both assume nonstop trading; RWAs trade a handful of times a day
  SC['L3.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [1590, 420];
    const cardY = 318, cardH = 300;
    // ORDER BOOK card
    const ob = S.pop(0.3);
    if (ob > 0) {
      const cx = 790; ctx.save(); ctx.translate(cx, cardY + cardH / 2); ctx.scale(ob, ob); ctx.translate(-cx, -(cardY + cardH / 2));
      K.box(ctx, cx - 190, cardY, 380, cardH, { r: 18, fill: C.card, stroke: C.ink, lw: 4 });
      label(ctx, L.ob, cx, cardY + 40, { s: 22, ls: 4 });
      const rows = [['101.40', 0.55, 0], ['101.30', 0.85, 0], ['101.20', 0.7, 0], ['101.00', 0.75, 1], ['100.90', 0.95, 1], ['100.80', 0.6, 1]];
      rows.forEach(([px, sz, bid], i) => {
        const y = cardY + 78 + i * 34 + (bid ? 16 : 0), drain = S.at(2.15 + Math.abs(i - 2.5) * 0.12, 0.35, E.inOutCubic);
        const live = sz * (0.82 + 0.18 * Math.sin(t * 9 + i * 1.7)) * (1 - drain);
        const col = bid ? C.green : C.red;
        K.txt(ctx, drain > 0.9 ? '—' : px, cx - 150, y + 20, { f: 'mono', s: 19, w: 700, c: drain > 0.5 ? C.ink3 : col, alpha: 1 - drain * 0.4 });
        ctx.save(); ctx.setLineDash([4, 6]); K.line(ctx, cx - 40, y + 14, cx + 160, y + 14, { lw: 2, c: C.line }); ctx.restore();
        if (live > 0.01) K.box(ctx, cx - 40, y + 2, 200 * live, 24, { r: 4, fill: bid ? 'rgba(14,159,110,.35)' : 'rgba(214,69,69,.30)', stroke: null });
      });
      label(ctx, 'NO BIDS · NO ASKS', cx, cardY + 78 + 3 * 34 + 14, { s: 17, c: C.ink3, ls: 2, alpha: S.at(2.9, 0.4) });
      ctx.restore();
      caption(ctx, wrap2(ctx, L.ob2, 360, { f: 'mono', s: 18, w: 600, ls: 0.5 }), cx, cardY + cardH + 42, { alpha: K.clamp(ob) });
    }
    // AMM card
    const am = S.pop(0.9);
    const stale = S.at(2.8, 0.5);
    if (am > 0) {
      const cx = 1590; ctx.save(); ctx.translate(cx, cardY + cardH / 2); ctx.scale(am, am); ctx.translate(-cx, -(cardY + cardH / 2));
      K.box(ctx, cx - 190, cardY, 380, cardH, { r: 18, fill: C.card, stroke: C.ink, lw: 4 });
      label(ctx, L.amm, cx, cardY + 40, { s: 22, ls: 4 });
      // the pool bowl, two assets
      const bxc = cx, rimY = cardY + 140, rx = 130, depth = 120, slosh = Math.sin(t * 4) * 5 * (1 - stale);
      ctx.save(); ctx.beginPath(); ctx.moveTo(bxc - rx, rimY); ctx.bezierCurveTo(bxc - rx, rimY + depth * 1.3, bxc + rx, rimY + depth * 1.3, bxc + rx, rimY); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#9BD3B9'; ctx.fillRect(bxc - rx, rimY + 14, rx * 2, depth * 1.4);
      ctx.beginPath(); ctx.moveTo(bxc - rx, rimY + 14 + slosh); ctx.quadraticCurveTo(bxc, rimY + 6 - slosh, bxc + rx, rimY + 14 + slosh); ctx.lineTo(bxc + rx, rimY + 62); ctx.lineTo(bxc - rx, rimY + 62); ctx.closePath(); ctx.fillStyle = '#FFB37A'; ctx.fill();
      ctx.fillStyle = '#9BD3B9'; ctx.fillRect(bxc - rx, rimY + 62, rx * 2, depth);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(bxc - rx, rimY); ctx.bezierCurveTo(bxc - rx, rimY + depth * 1.3, bxc + rx, rimY + depth * 1.3, bxc + rx, rimY); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bxc, rimY, rx, 14, 0, 0, 7); ctx.lineWidth = 4; ctx.stroke();
      K.txt(ctx, 'x · y = k', bxc, rimY + 92, { f: 'mono', s: 24, w: 700, c: C.ink, a: 'center', ls: 1 });
      // cobwebs in the card corners
      cobweb(ctx, cx - 186, cardY + 4, 88, 1, 1, stale); cobweb(ctx, cx + 186, cardY + 4, 74, -1, 1, S.at(3.0, 0.5));
      ctx.restore();
      caption(ctx, wrap2(ctx, L.amm2, 360, { f: 'mono', s: 18, w: 600, ls: 0.5 }), cx, cardY + cardH + 42, { alpha: K.clamp(am) });
    }
    // STALE PRICE sign drops in and creaks
    if (stale > 0) {
      const sw = Math.sin(S.since(2.8) * 5.5) * 0.16 * Math.exp(-S.since(2.8) * 1.1), sy = K.lerp(cardY - 40, cardY + 58, S.at(2.8, 0.3, E.outBack));
      ctx.save(); ctx.translate(1590, cardY + 4); ctx.rotate(sw);
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink2; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-70, sy - cardY - 4); ctx.moveTo(60, 0); ctx.lineTo(70, sy - cardY - 4); ctx.stroke();
      ctx.translate(0, sy - cardY - 4);
      K.box(ctx, -108, 0, 216, 46, { r: 6, fill: '#F3E2C7', stroke: C.ink, lw: 4 });
      K.txt(ctx, 'STALE PRICE', 0, 33, { f: 'display', s: 30, w: 900, st: 'semi-condensed', c: C.red, a: 'center', ls: 2 });
      ctx.restore();
      // flies
      const fa = S.at(3.1, 0.4);
      if (fa > 0) { ctx.save(); ctx.globalAlpha = fa; for (let k = 0; k < 2; k++) { const a = t * (2.6 + k * 0.7) + k * 2.6; ctx.save(); ctx.translate(1590 + Math.cos(a) * 96, cardY + 146 + Math.sin(a * 1.4) * 20); ctx.scale(1.7, 1.7); fly(ctx, 0, 0, t + k); ctx.restore(); } ctx.restore(); }
    }
    // the RWA clock: a whole day, a handful of trades
    const ck = S.pop(1.9, 0.45);
    if (ck > 0) {
      const cx = 1191, cy = 456, spin = S.lin(2.0, 1.4), hrs = 10 + spin * 24;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(ck, ck);
      I.clock(ctx, 0, 0, 170, { h: hrs % 12, m: (hrs % 1) * 60 });
      // the day's trades: a few dots on the rim
      [0.12, 0.47, 0.71].forEach((f, i) => { if (spin > f) { const a = f * Math.PI * 4 - Math.PI / 2, pp = K.clamp((spin - f) * 8); ctx.beginPath(); ctx.arc(Math.cos(a) * 98, Math.sin(a) * 98, 9 * pp, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke(); } });
      ctx.restore();
      const [l1, ...rest] = L.clock.split(': ');
      label(ctx, l1 + ':', cx, cy + 136, { s: 22, c: C.orange, ls: 4, alpha: K.clamp(ck) });
      caption(ctx, wrap2(ctx, rest.join(': '), 300, { f: 'mono', s: 18, w: 600, ls: 0.5 }), cx, cy + 166, { alpha: K.clamp(ck) });
    }
  };

  // 3.4 Price discovery — a "LIVE" price that nobody has traded at for six days
  SC['L3.4'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, tx = 905, ty = 486, tw = 520, th = 204; S.noteTo = [1000, 470];
    const p = S.pop(0.3);
    if (p > 0) {
      ctx.save(); ctx.translate(tx, ty); ctx.scale(p, p); ctx.rotate(-0.025);
      // tag body (pointed left end, hole, string)
      const x0 = -tw / 2, x1 = tw / 2, y0 = -th / 2, y1 = th / 2, nk = th * 0.42;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + nk, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0 + nk, y1); ctx.closePath();
      ctx.fillStyle = C.card; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x0 + nk * 0.8, 0, 12, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      K.txt(ctx, L.price, 34, 44, { f: 'display', s: 128, w: 900, st: 'condensed', c: C.ink, a: 'center' });
      // LIVE badge (keeps blinking, naturally)
      ctx.save(); ctx.translate(x1 - 70, y0 + 2); ctx.rotate(0.06);
      K.box(ctx, -62, -22, 124, 44, { r: 22, fill: C.red, stroke: C.ink, lw: 3.5 });
      ctx.beginPath(); ctx.arc(-38, 0, 8, 0, 7); ctx.fillStyle = (t * 2.4) % 1 < 0.6 ? C.card : 'rgba(255,255,255,.3)'; ctx.fill();
      K.txt(ctx, 'LIVE', 14, 9, { f: 'display', s: 26, w: 900, c: C.card, a: 'center', ls: 2 });
      ctx.restore();
      ctx.restore();
    }
    // dust settles on the tag
    const dl = S.at(2.2, 1.2);
    if (dl > 0 && p > 0) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(-0.025); ctx.fillStyle = `rgba(150,138,118,${0.28 * dl})`; ctx.fillRect(-tw / 2 + th * 0.42 + 6, -th / 2 - 5, tw - th * 0.42 - 8, 6); ctx.restore(); }
    const r = K.rand(17);
    for (let i = 0; i < 26; i++) {
      const x = tx - tw / 2 + 120 + r() * (tw - 150), d0 = 1.5 + r() * 1.6, size = 2 + r() * 2.6, wob = r() * 6;
      const u = S.lin(d0, 0.9); if (u <= 0) continue;
      const topY = ty - th / 2 + (x - tx) * Math.tan(-0.025) - size;
      ctx.beginPath(); ctx.arc(x + Math.sin(u * 7 + wob) * 6 * (1 - u), K.lerp(300, topY, E.outCubic(u)), size, 0, 7); ctx.fillStyle = 'rgba(120,110,95,.55)'; ctx.fill();
    }
    // "last trade: 6 days ago" types out
    const ty0 = 1.2, n = L.last.length, typed = Math.floor(K.clamp(S.since(ty0) / (S.b * 1.0)) * n);
    if (S.bt > ty0) {
      const str = L.last.slice(0, typed), x0 = tx - tw / 2 + 10, y = ty + th / 2 + 86;
      K.txt(ctx, str, x0, y, { f: 'mono', s: 32, w: 700, c: C.ink2, ls: 1 });
      const w = K.measure(ctx, str, { f: 'mono', s: 32, w: 700, ls: 1 });
      if ((t * 2.2) % 1 < 0.6) { ctx.fillStyle = C.orange; ctx.fillRect(x0 + w + 4, y - 26, 16, 30); }
      if (typed >= n) K.marker(ctx, x0 + K.measure(ctx, 'last trade: ', { f: 'mono', s: 32, w: 700, ls: 1 }) - 6, y - 30, K.measure(ctx, '6 days ago', { f: 'mono', s: 32, w: 700, ls: 1 }) + 12, 40, S.at(2.3, 0.35), 'rgba(214,69,69,.20)');
    }
    // a spider lowers itself onto the "live" price
    const sp = back(S, 2.2, 0.9);
    if (sp > 0) { const sy = K.lerp(292, ty - th / 2 - 30, sp) + Math.sin(S.since(2.2) * 3) * 4 * sp; I.spider(ctx, tx + 60, sy, 62, { len: Math.max(1, sy - 290) }); }
    // the sparkline: one trade, six days back, then a flat line pretending to be a price
    const cp = S.pop(1.6, 0.45);
    if (cp > 0) {
      const cx0 = 1330, cy0 = 352, cw = 456, ch = 276;
      ctx.save(); ctx.translate(cx0 + cw / 2, cy0 + ch / 2); ctx.scale(cp, cp); ctx.translate(-(cx0 + cw / 2), -(cy0 + ch / 2));
      K.box(ctx, cx0, cy0, cw, ch, { r: 16, fill: C.card, stroke: C.ink, lw: 4 });
      label(ctx, 'TRADES · LAST 7 DAYS', cx0 + cw / 2, cy0 + 42, { s: 17, c: C.ink2, ls: 3 });
      const ax0 = cx0 + 74, ax1 = cx0 + cw - 50, base = cy0 + ch - 64, py = cy0 + 130;
      K.line(ctx, ax0, base, ax1, base, { lw: 3, c: C.ink });
      for (let d = 0; d <= 6; d++) { const x = K.lerp(ax0, ax1, d / 6); K.line(ctx, x, base - 6, x, base + 6, { lw: 2.5, c: C.ink }); }
      K.txt(ctx, '6 days ago', ax0, base + 36, { f: 'mono', s: 17, w: 700, c: C.ink, a: 'center' });
      K.txt(ctx, 'today', ax1, base + 36, { f: 'mono', s: 17, w: 700, c: C.ink, a: 'center' });
      const lp = S.at(2.4, 0.9, E.inOutCubic);
      if (lp > 0) { ctx.save(); ctx.setLineDash([10, 9]); K.line(ctx, ax0, py, K.lerp(ax0, ax1, lp), py, { lw: 4, c: C.ink3 }); ctx.restore(); }
      const dp = S.pop(1.95, 0.4);
      if (dp > 0) { ctx.beginPath(); ctx.arc(ax0, py, 12 * dp, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke(); K.txt(ctx, 'the only trade', ax0 + 24, py - 20, { f: 'hand', s: 28, w: 700, c: C.orange2, alpha: K.clamp(dp) }); }
      if (lp >= 1) { K.txt(ctx, '?', ax1 + 16, py + 12, { f: 'display', s: 36, w: 900, c: C.ink3, a: 'center', alpha: S.at(3.3, 0.3) }); }
      ctx.restore();
    }
  };
})();
