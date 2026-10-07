/* ch04.js — Tokenized Treasuries. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin
   note and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const bump = (S, b, d = 0.3) => { const u = (S.bt - b) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
  const back = (S, b, d) => (S.bt <= b ? 0 : S.at(b, d, E.outBack));
  const caption = (ctx, ls, x, y, o = {}) => ls.forEach((l, i) => K.txt(ctx, l, x, y + i * (o.lh || 26), Object.assign({ f: 'mono', s: 18, w: 600, c: C.ink2, a: 'center', ls: 0.5 }, o)));
  // "NAME · rest" header: bold name + lighter rest on one line, left-aligned at x
  function header(ctx, str, x, y, o = {}) {
    const i = str.indexOf(' · '), a = i < 0 ? str : str.slice(0, i), b = i < 0 ? '' : str.slice(i);
    const A = { f: 'mono', s: o.s || 20, w: 700, c: o.c || C.ink, ls: 3, alpha: o.alpha }, B = { f: 'mono', s: (o.s || 20) - 2, w: 600, c: C.ink2, ls: 0.5, alpha: o.alpha };
    K.txt(ctx, a, x, y, A); if (b) K.txt(ctx, b, x + K.measure(ctx, a, A), y, B);
  }
  // white disc badge with a check
  function okBadge(ctx, x, y, p, r = 30) {
    if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    K.check(ctx, 1, 2, r * 1.3, 1, C.card, r * 0.22); ctx.restore();
  }

  // a pipe segment (glass tube) with flanges; draw(ctx) is called between the back and the front layers
  function pipe(ctx, x0, x1, y, r, o, draw) {
    K.rr(ctx, x0, y - r, x1 - x0, 2 * r, 12); ctx.fillStyle = o.back; ctx.fill();
    ctx.save(); K.rr(ctx, x0, y - r, x1 - x0, 2 * r, 12); ctx.clip(); if (draw) draw(ctx); if (o.grime) o.grime(ctx); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x0 + 14, y - r + 9, x1 - x0 - 28, 5);
    K.rr(ctx, x0, y - r, x1 - x0, 2 * r, 12); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    for (let x = x0 + o.step / 2; x < x1 - 30; x += o.step) K.box(ctx, x - 10, y - r - 9, 20, 2 * r + 18, { r: 4, fill: o.flange, stroke: C.ink, lw: 4 });
  }
  function spreadsheet(ctx, x, y, w, h) {
    K.box(ctx, x - w / 2, y - h / 2, w, h, { r: 8, fill: C.card, stroke: C.ink, lw: 4 });
    ctx.save(); K.rr(ctx, x - w / 2, y - h / 2, w, h, 8); ctx.clip(); ctx.fillStyle = '#1F7A4D'; ctx.fillRect(x - w / 2, y - h / 2, w, 26);
    ctx.fillStyle = 'rgba(31,122,77,.12)'; ctx.fillRect(x - w / 2, y - h / 2 + 26, 30, h); ctx.restore();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#B9C9BE';
    for (let i = 1; i < 5; i++) { const yy = y - h / 2 + 26 + i * (h - 26) / 5; ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); }
    for (const fx of [30, 30 + (w - 30) / 2]) { ctx.beginPath(); ctx.moveTo(x - w / 2 + fx, y - h / 2 + 26); ctx.lineTo(x - w / 2 + fx, y + h / 2); ctx.stroke(); }
    K.txt(ctx, 'FUND_ADMIN_FINAL_v7.xls', x, y - h / 2 + 18, { f: 'mono', s: 11, w: 700, c: C.card, a: 'center' });
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink3;
    for (let i = 0; i < 4; i++) { const yy = y - h / 2 + 26 + (i + 0.5) * (h - 26) / 5; ctx.beginPath(); ctx.moveTo(x - w / 2 + 40, yy); ctx.lineTo(x - w / 2 + 40 + 30 + (i * 17) % 34, yy); ctx.moveTo(x + 8, yy); ctx.lineTo(x + 8 + 22 + (i * 23) % 40, yy); ctx.stroke(); }
  }
  // crescent moon (outer circle minus an offset circle), tilted
  function moon(ctx, x, y, r) {
    const d = r * 0.85, a = Math.acos(d / 2 / r);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
    ctx.beginPath(); ctx.arc(0, 0, r, a, Math.PI * 2 - a); ctx.arc(d, 0, r, Math.PI + a, Math.PI - a, true); ctx.closePath();
    ctx.fillStyle = C.goldLite; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // 4.1 What tokenized treasuries are — the same T-bill through an old pipe and a new one
  SC['L4.1'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, oy = 440, ny = 674, pr = 46, ts = 74; S.noteTo = [760, 466];
    const lp = S.pop(0.3);
    if (lp <= 0) return;
    const la = K.clamp(lp);
    // OLD PIPE
    header(ctx, L.old, 600, oy - pr - 30, { alpha: la });
    const crawl = Math.max(0, S.bt - 1.0), ox = 660 + crawl * 30 + Math.sin(t * 2.2) * 2;
    pipe(ctx, 600, 1462, oy, pr, {
      back: 'rgba(170,160,142,.30)', flange: '#A39A8C', step: 230,
      grime: (c) => { c.fillStyle = 'rgba(110,96,74,.22)'; c.fillRect(600, oy - pr, 862, 2 * pr); const r = K.rand(5); for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(620 + r() * 830, oy - pr + r() * 2 * pr, 4 + r() * 9, 0, 7); c.fillStyle = `rgba(166,90,40,${0.25 + r() * 0.3})`; c.fill(); } },
    }, (c) => I.tbill(c, ox, oy, ts, {}));
    // a taped-up leak
    ctx.save(); ctx.translate(1060, oy - pr + 4); ctx.rotate(-0.25); K.box(ctx, -26, -9, 52, 18, { r: 3, fill: '#EDE3CC', stroke: C.ink, lw: 3 }); ctx.restore();
    ctx.save(); ctx.translate(1060, oy - pr + 4); ctx.rotate(0.3); K.box(ctx, -26, -9, 52, 18, { r: 3, fill: '#EDE3CC', stroke: C.ink, lw: 3 }); ctx.restore();
    // ...ending at the fund admin's spreadsheet, updated overnight
    spreadsheet(ctx, 1604, oy - 6, 220, 136);
    const nite = S.at(1.0, 0.5), sw = S.at(1.0, 0.45, E.outBack);
    if (nite > 0) {
      // night swoops in on the whoosh
      const mx = K.lerp(1830, 1736, sw), my = K.lerp(318, oy - 92, sw) - Math.sin(K.clamp(sw) * Math.PI) * 18;
      ctx.save(); ctx.globalAlpha = K.clamp(nite * 2); ctx.translate(mx, my); ctx.rotate((1 - K.clamp(sw)) * 1.2); moon(ctx, 0, 0, 30); ctx.restore();
      ctx.save(); ctx.globalAlpha = S.at(1.3, 0.4); I.zzz(ctx, 1690, oy - 86, 70, t); ctx.restore();
      label(ctx, 'OVERNIGHT', 1604, oy + 98, { s: 20, c: C.ink2, ls: 4, alpha: nite });
    }
    // NEW PIPE: wallet to wallet
    header(ctx, L.new, 600, ny - pr - 30, { alpha: la, c: C.orange });
    const zip = S.at(2.2, 0.36, E.inOutCubic), nx = K.lerp(790, 1660, zip);
    pipe(ctx, 716, 1606, ny, pr, { back: 'rgba(255,255,255,.55)', flange: C.orange, step: 222 }, (c) => { if (zip < 1) I.tbill(c, nx, ny, ts, {}); });
    if (zip > 0 && zip < 1) { ctx.save(); ctx.globalAlpha = 0.8; for (let i = 0; i < 3; i++) K.line(ctx, nx - 70 - i * 26, ny - 18 + i * 18, nx - 150 - i * 40, ny - 18 + i * 18, { lw: 4, c: C.orange }); ctx.restore(); }
    I.wallet(ctx, 650, ny, 116, { label: 'A' });
    I.wallet(ctx, 1676, ny, 116, { label: 'B' });
    if (zip >= 1) I.tbill(ctx, 1678, ny - 62 - bump(S, 2.58, 0.3) * 10, ts, { rot: 0.06 });
    okBadge(ctx, 1752, ny - 92, S.pop(2.6, 0.4), 26);
    if (S.bt > 2.6) label(ctx, 'MINUTES', 1676, ny + 84, { s: 20, c: C.green, ls: 4, alpha: S.at(2.6, 0.3) });
  };

  // 4.2 Who's building it — two kinds of issuers, sitting on the same transfer-agent rails
  SC['L4.2'] = (ctx, S) => {
    const L = S.sc.labels, cols = L.cols; S.noteTo = [1000, 450];
    const cards = [[600, 1174], [1208, 1782]], y0 = 296, y1 = 566;
    cards.forEach(([x0, x1], k) => {
      const p = S.pop([0.3, 0.9][k]); if (p <= 0) return;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy);
      K.box(ctx, x0, y0, x1 - x0, y1 - y0, { r: 20, fill: C.card, stroke: C.ink, lw: 4 });
      label(ctx, cols[k][0], cx, y0 + 46, { s: 23, ls: 4 });
      caption(ctx, [cols[k][1]], cx, y0 + 80, {});
      cols[k][2].forEach((logo, i) => {
        const lx = cx + (i ? 118 : -118), ly = y0 + 166, lp = S.pop([0.3, 0.9][k] + 0.2 + i * 0.12);
        if (lp <= 0) return;
        ctx.save(); ctx.translate(lx, ly); ctx.scale(lp, lp); K.logo(ctx, logo, 0, 0, 50, { lw: 3.5, stroke: C.line2 }); ctx.restore();
        label(ctx, cols[k][3][i], lx, ly + 86, { s: 21, ls: 2, alpha: K.clamp(lp) });
      });
      ctx.restore();
    });
    // the rails underneath both
    const bp = S.pop(1.5);
    if (bp > 0) {
      const x0 = 600, x1 = 1782, b0 = 608, b1 = 776, cx = (x0 + x1) / 2, cy = (b0 + b1) / 2;
      // posts: both kinds of issuer stand on it
      const post = S.at(1.7, 0.4);
      for (const px of [887, 1495]) { ctx.save(); ctx.globalAlpha = post; K.line(ctx, px, y1 + 4, px, b0 - 4, { lw: 5, c: C.ink }); K.line(ctx, px - 14, b0 - 4, px + 14, b0 - 4, { lw: 5, c: C.ink }); ctx.restore(); }
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, bp); ctx.translate(-cx, -cy);
      K.box(ctx, x0, b0, x1 - x0, b1 - b0, { r: 20, fill: C.raise, stroke: C.ink, lw: 4 });
      // rail-track stripe along the top
      ctx.save(); K.rr(ctx, x0, b0, x1 - x0, b1 - b0, 20); ctx.clip();
      for (let x = x0 + 10; x < x1; x += 34) { ctx.fillStyle = '#B08A5A'; ctx.fillRect(x, b0 + 8, 14, 22); }
      ctx.fillStyle = '#8E877B'; ctx.fillRect(x0, b0 + 11, x1 - x0, 5); ctx.fillRect(x0, b0 + 22, x1 - x0, 5);
      ctx.restore();
      K.rr(ctx, x0, b0, x1 - x0, b1 - b0, 20); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
      label(ctx, cols[2][0], x0 + 40, b0 + 82, { a: 'left', s: 23, ls: 4 });
      const [r1, r2] = cols[2][1].split(': ');
      K.txt(ctx, r1.toUpperCase() + ':', x0 + 40, b0 + 122, { f: 'mono', s: 19, w: 700, c: C.orange2, ls: 2 });
      K.txt(ctx, r2 || '', x0 + 40 + K.measure(ctx, r1.toUpperCase() + ': ', { f: 'mono', s: 19, w: 700, ls: 2 }), b0 + 122, { f: 'mono', s: 19, w: 600, c: C.ink2, ls: 0.5 });
      // the register: who owns what, who may hold it
      const rx = 1590, ry = cy + 14;
      I.ledger(ctx, rx, ry, 104, {});
      for (let i = 0; i < 3; i++) {
        const yy = ry - 26 + i * 22, cp = S.lin(2.6 + i * 0.12, 0.25);
        K.line(ctx, rx - 66, yy, rx - 18, yy, { lw: 3, c: C.ink3 });
        K.check(ctx, rx + 40, yy - 2, 22, cp, C.green, 4.5);
      }
      ctx.restore();
    }
  };

  // treadmill with a jogging T-bill
  function treadmill(ctx, x, y, w, t) {
    ctx.save();
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
    K.box(ctx, x - w / 2, y, w, 28, { r: 14, fill: '#4A4339', stroke: C.ink, lw: 4 });
    ctx.save(); K.rr(ctx, x - w / 2 + 14, y + 6, w - 28, 16, 8); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const sx = x - w / 2 + (((k * 26 - t * 150) % 364) + 364) % 364; ctx.beginPath(); ctx.moveTo(sx, y + 6); ctx.lineTo(sx - 8, y + 22); ctx.stroke(); }
    ctx.restore();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * (w / 2 - 14), y + 14, 9, 0, 7); ctx.fillStyle = '#8E877B'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke(); }
    K.line(ctx, x - w / 2 + 20, y + 28, x - w / 2 + 6, y + 50, { lw: 5, c: C.ink }); K.line(ctx, x + w / 2 - 20, y + 28, x + w / 2 - 6, y + 50, { lw: 5, c: C.ink });
    ctx.restore();
  }
  function jogger(ctx, x, y, s, t) {
    const ph = t * 13;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [k, c] of [[0, C.ink2], [Math.PI, C.ink]]) {
      const a = Math.sin(ph + k) * 0.55, hx = x + (k ? 14 : -14), hy = y + s * 0.38, kx = hx + Math.sin(a) * 24, ky = hy + Math.cos(a) * 24, fx = kx + Math.sin(a - 0.6) * 22, fy = ky + 22;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, Math.min(fy, y + s * 0.38 + 46)); ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke();
      K.box(ctx, fx - 4, Math.min(fy, y + s * 0.38 + 46) - 5, 20, 10, { r: 4, fill: C.red, stroke: C.ink, lw: 2.5 });
    }
    const bob = Math.abs(Math.sin(ph)) * 7;
    I.tbill(ctx, x, y - bob, s, {});
    // sweat
    const sw = (t * 1.6) % 1; ctx.beginPath(); ctx.ellipse(x - s * 0.8 - sw * 16, y - s * 0.3 - bob + sw * 26, 5, 8, 0.4, 0, 7); ctx.fillStyle = `rgba(95,168,232,${1 - sw})`; ctx.fill();
    ctx.restore();
  }

  // 4.3 Yield mechanics — T-bills do the work; the token either multiplies or gets pricier
  SC['L4.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [1200, 640];
    const cues = [1.2, 2.0, 2.8], fly = 0.55, arrived = cues.filter((c) => S.bt >= c).length;
    const reb = ['100.00', '100.01', '100.02', '100.03'][arrived], acc = ['1.0000', '1.0001', '1.0002', '1.0003'][arrived];
    const tx = 772, ty = 560;
    // the engine room
    const tp = S.pop(0.3);
    if (tp > 0) {
      ctx.save(); ctx.translate(tx, 640); ctx.scale(tp, tp); ctx.translate(-tx, -640);
      treadmill(ctx, tx, 640, 300, t);
      jogger(ctx, tx - 10, ty - 14, 100, t);
      ctx.restore();
      label(ctx, 'T-BILLS EARN INTEREST DAILY', tx, 734, { s: 17, c: C.ink2, ls: 2, alpha: K.clamp(tp) });
    }
    // flow: T-bill -> arrow -> bracket -> both token designs
    const pa = S.at(0.6, 0.5), ay = 528, ax0 = 862, ax1 = 1036, bx = 1048, yA = 404, yB = 652;
    if (pa > 0) {
      K.arrow(ctx, ax0, ay, K.lerp(ax0, ax1, pa), ay, { lw: 5, c: C.ink3, hs: 16 });
      ctx.save(); ctx.globalAlpha = pa; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.ink3;
      ctx.beginPath(); ctx.moveTo(bx + 26, yA); ctx.lineTo(bx, yA); ctx.lineTo(bx, yB); ctx.lineTo(bx + 26, yB); ctx.stroke(); ctx.restore();
    }
    // interest coins: one per day, delivered to both designs
    const path = (u, yT) => { // T-bill top -> arrow tip -> along the bracket -> into the panel
      const P = [[tx + 10, ty - 80], [ax0 + 20, ay - 30], [bx, ay], [bx, yT], [bx + 40, yT]], L0 = [];
      let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L0.push(d); tot += d; }
      let d = u * tot; for (let i = 0; i < L0.length; i++) { if (d <= L0[i] || i === L0.length - 1) { const k = K.clamp(d / L0[i]); return [K.lerp(P[i][0], P[i + 1][0], k), K.lerp(P[i][1], P[i + 1][1], k)]; } d -= L0[i]; }
    };
    cues.forEach((c) => {
      const u = S.lin(c - fly, fly); if (u <= 0 || u >= 1) return;
      const e = E.inOutSine(u);
      for (const yT of [yA, yB]) { const q = path(e, yT); K.coin(ctx, q[0], q[1], 17, { spin: u * 2 }); }
    });
    // lag clock rides on the arrow
    const lg = S.pop(3.6, 0.4);
    if (lg > 0) {
      ctx.save(); ctx.translate(950, ay - 50); ctx.scale(lg, lg); I.clock(ctx, 0, 0, 62, { h: 9, m: 0 }); ctx.restore();
      label(ctx, L.lag, 950, ay + 40, { s: 18, c: C.ink, ls: 1, alpha: K.clamp(lg) });
    }
    // the two panels
    const panels = [
      { y0: 300, name: L.rebase, ex: L.rebaseEx, at: 0.6 },
      { y0: 548, name: L.accrue, ex: L.accrueEx, at: 0.8 },
    ];
    panels.forEach((pn, k) => {
      const p = S.pop(pn.at); if (p <= 0) return;
      const x0 = 1076, x1 = 1790, y0 = pn.y0, h = 210, cy = y0 + h / 2;
      ctx.save(); ctx.translate((x0 + x1) / 2, cy); ctx.scale(p, p); ctx.translate(-(x0 + x1) / 2, -cy);
      K.box(ctx, x0, y0, x1 - x0, h, { r: 18, fill: C.card, stroke: C.ink, lw: 4 });
      header(ctx, pn.name, x0 + 28, y0 + 44, { c: k ? C.green : C.orange });
      const pulse = 1 + bump(S, cues[Math.max(0, arrived - 1)], 0.3) * 0.06 * (arrived > 0 ? 1 : 0);
      if (k === 0) { // REBASING: the stack grows, price stays put
        const n = 3 + arrived;
        for (let i = 0; i < n; i++) { const pop = i >= 3 ? K.clamp(S.pop(cues[i - 3], 0.35)) : 1; ctx.save(); ctx.translate(x0 + 92, y0 + 160 - i * 15); ctx.scale(pop, pop); ctx.beginPath(); ctx.ellipse(0, 6, 46, 15, 0, 0, 7); ctx.fillStyle = C.orange2; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 46, 15, 0, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.stroke(); ctx.restore(); }
        ctx.save(); ctx.translate(x0 + 176, y0 + 150); ctx.scale(pulse, pulse); K.txt(ctx, reb, 0, 0, { f: 'display', s: 78, w: 900, st: 'condensed', c: C.orange }); ctx.restore();
        K.txt(ctx, 'TOKENS', x0 + 176 + K.measure(ctx, reb, { f: 'display', s: 78, w: 900, st: 'condensed' }) + 26, y0 + 150, { f: 'mono', s: 18, w: 700, c: C.ink2, ls: 2 });
        K.txt(ctx, 'PRICE', x1 - 92, y0 + 100, { f: 'mono', s: 15, w: 700, c: C.ink3, a: 'center', ls: 2 });
        K.chip(ctx, '$1.00', x1 - 92, y0 + 136, { s: 24, fill: C.ink, c: C.card, a: 'center', w: 700, ls: 1 });
      } else { // ACCRUING: same tokens, the price climbs
        I.mascot(ctx, x0 + 92, y0 + 122, 46, { mood: 'smug' });
        ctx.save(); ctx.translate(x0 + 176, y0 + 150); ctx.scale(pulse, pulse); K.txt(ctx, '$' + acc, 0, 0, { f: 'display', s: 78, w: 900, st: 'condensed', c: C.green }); ctx.restore();
        K.txt(ctx, 'PRICE', x0 + 176 + K.measure(ctx, '$' + acc, { f: 'display', s: 78, w: 900, st: 'condensed' }) + 26, y0 + 150, { f: 'mono', s: 18, w: 700, c: C.ink2, ls: 2 });
        K.txt(ctx, 'TOKENS', x1 - 92, y0 + 100, { f: 'mono', s: 15, w: 700, c: C.ink3, a: 'center', ls: 2 });
        K.chip(ctx, '100', x1 - 92, y0 + 136, { s: 24, fill: C.ink, c: C.card, a: 'center', w: 700, ls: 1 });
      }
      K.txt(ctx, pn.ex, x1 - 26, y0 + h - 20, { f: 'mono', s: 17, w: 600, c: C.ink3, a: 'right', ls: 1 });
      ctx.restore();
    });
  };

  // 4.4 Redemption & custody chain — six links; the burn is the last one
  SC['L4.4'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, steps = L.steps, n = steps.length, y = 476, R = 58;
    const xs = steps.map((_, i) => K.lerp(668, 1716, i / (n - 1))), cues = [0.4, 1.2, 2.0, 2.8, 3.6, 4.4];
    S.noteTo = [xs[4], y];
    // connectors (ink, turning orange once the packet has passed)
    for (let i = 0; i < n - 1; i++) {
      const a = xs[i] + R + 6, b = xs[i + 1] - R - 6, u = S.lin(cues[i] + 0.12, cues[i + 1] - cues[i] - 0.2);
      ctx.save(); ctx.globalAlpha = S.at(0.1, 0.4); ctx.setLineDash([3, 10]); K.line(ctx, a, y, b, y, { lw: 4, c: C.ink3 }); ctx.restore();
      if (u > 0) K.line(ctx, a, y, K.lerp(a, b, u), y, { lw: 6, c: C.orange });
    }
    // nodes
    xs.forEach((x, i) => {
      const on = S.bt >= cues[i], pop = on ? 1 + bump(S, cues[i], 0.35) * 0.12 : 1, ap = S.at(0.05 + i * 0.06, 0.35);
      if (ap <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(pop * ap, pop * ap);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = on ? (i === 4 ? '#FFE7D3' : i === 5 ? '#DDF2E6' : '#FFF3E8') : C.paper; ctx.fill();
      ctx.lineWidth = on ? 5 : 3.5; ctx.strokeStyle = on ? (i === 5 ? C.green : C.ink) : C.line2; ctx.stroke();
      ctx.globalAlpha = on ? 1 : 0.3;
      if (i === 0) I.doc(ctx, 0, 0, 60, {});
      else if (i === 1) I.tbill(ctx, 0, 0, 52, {});
      else if (i === 2) { I.ledger(ctx, 0, 2, 58, {}); if (on) K.check(ctx, 18, -2, 24, S.lin(cues[i] + 0.1, 0.25), C.green, 5); }
      else if (i === 3) I.vault(ctx, 0, 0, 74, { open: on ? S.at(cues[i], 0.5) : 0, inside: (c) => I.cash(c, 6, 4, 30, {}) });
      else if (i === 4) {
        const burn = S.at(cues[i] + 0.05, 0.7);
        if (burn < 1) { ctx.save(); ctx.scale(1 - burn * 0.9, 1 - burn * 0.9); K.coin(ctx, 0, 8, 26, {}); ctx.restore(); }
        if (on) I.fire(ctx, 0, 30 - burn * 4, 56 + burn * 8, { t });
        else K.coin(ctx, 0, 8, 26, {});
      } else I.cash(ctx, 0, 0, 62, {});
      ctx.restore();
      // step number + label
      K.txt(ctx, String(i + 1), x - R + 4, y - R + 8, { f: 'display', s: 22, w: 900, c: on ? C.orange : C.ink3, a: 'center', alpha: ap });
      const words = steps[i].split(' '), lines = [];
      let cur = ''; for (const w of words) { const test = cur ? cur + ' ' + w : w; if (cur && K.measure(ctx, test, { f: 'mono', s: 17, w: 700, ls: 1 }) > 184) { lines.push(cur); cur = w; } else cur = test; } if (cur) lines.push(cur);
      lines.forEach((l, j) => K.txt(ctx, l, x, y + R + 38 + j * 24, { f: 'mono', s: 17, w: 700, c: on ? (i === 4 ? C.orange2 : i === 5 ? C.green : C.ink) : C.ink3, a: 'center', ls: 1, alpha: ap }));
    });
    // the packet (the redemption request) travelling down the chain
    const seg = cues.findIndex((c, i) => i < n - 1 && S.bt >= c + 0.12 && S.bt < cues[i + 1]);
    if (seg >= 0) {
      const u = E.inOutCubic(S.lin(cues[seg] + 0.12, cues[seg + 1] - cues[seg] - 0.2)), px = K.lerp(xs[seg] + R + 6, xs[seg + 1] - R - 6, u);
      ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(px, y, 20, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(px, y, 11, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
    }
    // how long all of that takes
    const tp = S.at(4.8, 0.5);
    if (tp > 0) {
      const a = xs[0] - 30, b = xs[n - 1] + 30, ly = 694;
      const m = (a + b) / 2, w = K.measure(ctx, L.time, { f: 'mono', s: 20, w: 700, ls: 1 }) / 2 + 22;
      K.arrow(ctx, m - w, ly, a, ly, { p: tp, lw: 3.5, c: C.ink2, hs: 14 });
      K.arrow(ctx, m + w, ly, b, ly, { p: tp, lw: 3.5, c: C.ink2, hs: 14 });
      ctx.save(); ctx.globalAlpha = tp; K.line(ctx, a, ly - 14, a, ly + 14, { lw: 3.5, c: C.ink2 }); K.line(ctx, b, ly - 14, b, ly + 14, { lw: 3.5, c: C.ink2 }); ctx.restore();
      K.txt(ctx, L.time, m, ly + 7, { f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 1, alpha: tp });
    }
  };
})();
