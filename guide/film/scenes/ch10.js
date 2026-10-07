/* ch10.js — Funds. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const aside = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 17, w: 600, c: C.ink2, a: 'center', ls: 1 }, o));
  const grow = (ctx, x, y, k, fn) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); };
  const fade = (ctx, a, fn) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); };
  const GLASS = 'rgba(143,211,255,', STEEL2 = '#8E877B';

  // a short chain drawn as alternating links between two points
  function chain(ctx, x1, y1, x2, y2, p = 1) {
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(L / 22), a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = '#6E675C';
    for (let i = 0; i < n * p; i++) {
      const u = (i + 0.5) / n; ctx.save(); ctx.translate(K.lerp(x1, x2, u), K.lerp(y1, y2, u)); ctx.rotate(a);
      if (i % 2) { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.lineWidth = 7; ctx.stroke(); }
      else { K.rr(ctx, -15, -8, 30, 16, 8); ctx.lineWidth = 5; ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  }
  // revolving door, front view, centred at x,y; spin in radians; mid() draws what passes between back & front wings
  function revDoor(ctx, x, y, w, h, spin, mid) {
    const R = w / 2, top = y - h / 2, bot = y + h / 2;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(x, bot, R + 26, 18, 0, 0, 7); ctx.fillStyle = '#E2DACB'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = GLASS + '.16)'; ctx.fillRect(x - R, top, w, h);
    const wings = [0, 1, 2, 3].map((k) => { const a = spin + k * Math.PI / 2; return { sx: Math.sin(a), z: Math.cos(a) }; }).sort((p, q) => p.z - q.z);
    const wing = (g) => {
      const ex = x + R * 0.96 * g.sx; if (Math.abs(ex - x) < 1) return;
      ctx.beginPath(); ctx.rect(Math.min(x, ex), top + 10, Math.abs(ex - x), h - 20);
      ctx.fillStyle = GLASS + (g.z > 0 ? '.55)' : '.28)'); ctx.fill(); ctx.lineWidth = g.z > 0 ? 4 : 3; ctx.strokeStyle = g.z > 0 ? C.ink : C.ink2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, top + 10); ctx.lineTo(ex, bot - 10); ctx.lineWidth = g.z > 0 ? 7 : 5; ctx.stroke();
    };
    wings.filter((g) => g.z <= 0).forEach(wing);
    if (mid) mid();
    ctx.fillStyle = C.ink2; ctx.fillRect(x - 5, top + 4, 10, h - 8);
    wings.filter((g) => g.z > 0).forEach(wing);
    for (const sx of [-1, 1]) K.box(ctx, x + sx * R - 9, top - 4, 18, h + 8, { r: 6, fill: STEEL2, stroke: C.ink, lw: 4 });
    K.box(ctx, x - R - 22, top - 48, w + 44, 50, { r: 12, fill: '#6E675C', stroke: C.ink, lw: 4 });
    ctx.restore();
  }
  // tear-off calendar: the current page flips up and away to reveal the next
  function flipCal(ctx, x, y, s, pages, k) { // k: continuous page index (e.g. 1.4 = flipping from page 1 to 2)
    const i = Math.min(pages.length - 1, Math.floor(k)), f = k - Math.floor(k);
    I.calendar(ctx, x, y, s, { big: pages[Math.min(pages.length - 1, i + (f > 0 && i < pages.length - 1 ? 1 : 0))] });
    if (f > 0 && i < pages.length - 1) {
      const u = E.inCubic(f);
      ctx.save(); ctx.translate(x, y - s * 0.43); ctx.rotate(-u * 0.5); ctx.scale(1, 1 - u); ctx.globalAlpha = 1 - u * 0.6; I.calendar(ctx, 0, s * 0.43, s, { big: pages[i] }); ctx.restore();
    }
  }

  // rubber stamp (like K.stamp) but the ink speckles are paper-coloured, so nothing punches through the page
  function stamp(ctx, s, x, y, o = {}) {
    const p = o.p === undefined ? 1 : o.p; if (p <= 0) return;
    const sc = p < 1 ? K.lerp(o.from || 2.2, 1, E.outCubic(p)) : 1, al = K.clamp(p * 3), size = o.s || 56, c = o.c || C.red;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot === undefined ? -0.12 : o.rot); ctx.scale(sc, sc); ctx.globalAlpha *= al * 0.94;
    const w = K.measure(ctx, s, { f: 'display', s: size, w: 900, st: 'semi-condensed', ls: 3 }) + size * 0.9, h = size * 1.45;
    K.rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.lineWidth = size * 0.1; ctx.strokeStyle = c; ctx.stroke();
    K.rr(ctx, -w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, 6); ctx.lineWidth = size * 0.035; ctx.stroke();
    K.txt(ctx, s, 0, size * 0.36, { f: 'display', s: size, w: 900, st: 'semi-condensed', c, a: 'center', ls: 3 });
    const r = K.rand(o.seed || 7); ctx.fillStyle = C.bg;
    for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * w, (r() - 0.5) * h, r() * size * 0.045 + 0.8, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // wrap a mono label: break after a comma if there is one, otherwise by width (letter-spacing included)
  function wrap2(ctx, s, maxW, o) {
    if (s.includes(', ')) { const i = s.indexOf(', '); return [s.slice(0, i + 1), s.slice(i + 2)]; }
    const words = s.split(' '), out = []; let cur = '';
    for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (cur && K.measure(ctx, tst, o) > maxW) { out.push(cur); cur = w; } else cur = tst; }
    if (cur) out.push(cur); return out;
  }

  // 10.1 Same fund, same three roles. The register entry becomes a token and rides the fast rail; paper takes the snail.
  SC['L10.1'] = (ctx, S) => {
    const L = S.sc.labels, fx = 722, fy = 400;
    S.noteTo = [720, 420];
    grow(ctx, fx, fy, S.pop(0.0, 0.45), () => I.bank(ctx, 0, 0, 216, { label: 'FUND' }));
    // the three roles stay exactly where they were
    const rowY = (k) => 560 + k * 58;
    let taEnd = 1000;
    L.roles.forEach(([r, d], k) => {
      const p = S.pop(0.3 + k * 0.4, 0.45); if (p <= 0) return;
      ctx.save(); ctx.translate(600, rowY(k)); ctx.scale(p, p);
      const w = K.chip(ctx, r, 0, 0, { a: 'left', s: 17, w: 700, fill: C.ink, c: C.bg, ls: 2 });
      aside(ctx, d, w + 14, 6, { a: 'left', s: 16 });
      if (k === 2) taEnd = 600 + w + 14 + K.measure(ctx, d, { f: 'mono', s: 16, w: 600, ls: 1 });
      ctx.restore();
    });
    // two routes to the investor's wallet
    const x0 = 1085, x1 = 1640, oy = 384, ny = 500, wx = 1735, wy = 444;
    const rp = S.at(1.2, 0.6, E.inOutCubic);
    if (rp > 0) {
      K.line(ctx, x0, oy, K.lerp(x0, x1, rp), oy, { lw: 4, c: C.ink3, dash: [12, 10] });
      if (rp > 0.98) K.arrow(ctx, x1, oy, wx - 64, wy - 24, { lw: 4, c: C.ink3, dash: [12, 10], bend: -14, hs: 14 });
      ctx.save(); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, ny); ctx.lineTo(K.lerp(x0, x1, rp), ny); if (rp > 0.98) ctx.quadraticCurveTo(x1 + 50, ny, wx - 64, wy + 22);
      ctx.lineWidth = 12; ctx.strokeStyle = C.orange; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke(); ctx.restore();
      [1225, 1380, 1535].forEach((bx, i) => grow(ctx, bx, oy, S.pop(1.35 + i * 0.1, 0.4), () => {
        K.box(ctx, -28, -28, 56, 56, { r: 10, fill: '#D8D2C6', stroke: C.ink, lw: 4 });
        for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(j * 12, 0, 4, 0, 7); ctx.fillStyle = C.ink2; ctx.fill(); }
      }));
      label(ctx, L.old.toUpperCase(), x0, oy + 52, { a: 'left', s: 17, ls: 2, c: C.ink3, alpha: S.at(1.5, 0.4) });
    }
    // the paper share crawls along on a snail
    if (S.bt > 1.4) {
      const sx = x0 + 40 + Math.max(0, S.since(1.4)) * 12;
      ctx.save(); ctx.globalAlpha = S.at(1.4, 0.3); I.snail(ctx, sx, oy - 26, 62); I.doc(ctx, sx + 2, oy - 62, 38, { rot: -0.15 }); ctx.restore();
    }
    grow(ctx, wx, wy, S.pop(1.3, 0.45), () => I.wallet(ctx, 0, 0, 116));
    // the register entry, written onchain: pops out of the transfer agent's register, then zips down the fast rail
    const tp = S.pop(1.45, 0.45), tl = S.at(1.55, 0.4, E.inOutCubic), zp = S.at(2.0, 0.42, E.inCubic);
    const ax = taEnd + 34, ay = rowY(2);
    if (tp > 0) {
      K.arrow(ctx, ax, ay - 22, x0 + 8, ny + 26, { p: S.at(1.6, 0.45), lw: 3, c: C.orange, dash: [5, 7], bend: 30, hs: 11 });
      let x = K.lerp(ax, x0 + 10, tl), y = K.lerp(ay, ny, tl) - Math.sin(tl * Math.PI) * 40;
      if (zp > 0) { x = K.lerp(x0 + 10, wx - 24, zp); y = K.lerp(ny, wy - 30, zp * zp); }
      if (zp > 0 && zp < 1) for (let j = 1; j <= 4; j++) K.line(ctx, x - 26 - j * 34, y - 14 + j * 7, x - 46 - j * 46, y - 14 + j * 7, { lw: 4, c: C.orange });
      grow(ctx, x, y, tp, () => K.coin(ctx, 0, 0, 30, {}));
    }
    aside(ctx, '↳ ' + L.tok, 600, rowY(2) + 50, { a: 'left', c: C.orange, s: 16, alpha: S.at(1.5, 0.4) });
    grow(ctx, 1362, ny + 50, S.pop(2.42, 0.45), () => label(ctx, L.new.toUpperCase(), 0, 0, { c: C.orange, s: 24, ls: 4 }));
    stamp(ctx, 'LEGAL WRAPPER + REGULATOR: UNCHANGED', 1418, 700, { p: S.lin(2.62, 0.18), from: 1.5, s: 23, c: C.green, rot: -0.035, seed: 4 });
  };

  // 10.2 Who does what: three columns of builders; the platforms column keeps the record
  SC['L10.2'] = (ctx, S) => {
    const L = S.sc.labels, xs = [792, 1192, 1592], hi = S.at(3.0, 0.45);
    S.noteTo = [800, 345];
    if (hi > 0) fade(ctx, hi, () => K.box(ctx, xs[2] - 194, 302, 388, 400, { r: 22, fill: 'rgba(255,98,0,.07)', stroke: C.orange, lw: 4 }));
    L.cols.forEach(([head, sub, logos, names], c) => {
      const t0 = 0.3 + c * 0.8, a = S.at(t0 - 0.05, 0.35), dim = c < 2 ? 1 - hi * 0.45 : 1;
      fade(ctx, dim, () => {
        label(ctx, head, xs[c], 344, { s: 22, c: c === 2 && hi > 0.4 ? C.orange : C.ink, alpha: a });
        const lines = wrap2(ctx, sub, 300, { f: 'mono', s: 16, w: 600, ls: 1 });
        lines.forEach((ln, i) => aside(ctx, ln, xs[c], 374 + i * 22, { s: 16, alpha: a }));
        if (c === 2 && hi > 0) { const w = K.measure(ctx, lines[lines.length - 1], { f: 'mono', s: 16, w: 600, ls: 1 }); K.marker(ctx, xs[c] - w / 2 - 6, 374 + (lines.length - 1) * 22 - 17, w + 12, 24, S.at(3.1, 0.4)); aside(ctx, lines[lines.length - 1], xs[c], 374 + (lines.length - 1) * 22, { s: 16, c: C.ink }); }
        logos.forEach((lg, i) => {
          const p = S.pop(t0 + i * 0.2, 0.45); if (p <= 0) return;
          const y = 476 + i * 82;
          grow(ctx, xs[c] - 128, y, p, () => K.logo(ctx, lg, 0, 0, 34, { stroke: C.ink, lw: 3 }));
          label(ctx, names[i].toUpperCase(), xs[c] - 80, y + 7, { a: 'left', s: 17, ls: 1, alpha: K.clamp(p) });
        });
      });
    });
    const lp = S.pop(3.25, 0.45);
    grow(ctx, xs[2] - 150, 742, lp, () => I.ledger(ctx, 0, 0, 44));
    label(ctx, 'WHO OWNS EACH SHARE ✓', xs[2] - 100, 749, { a: 'left', s: 17, ls: 2, c: C.orange, alpha: K.clamp(lp) });
  };

  // 10.3 Yield pours in from the assets; selling runs on the market's clock, redeeming on the fund's calendar
  SC['L10.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t;
    S.noteTo = [1494, 652];
    // ---- where the yield comes from
    const src = [[690, 'T-BILLS'], [880, 'LOANS'], [1070, 'PROPERTY']];
    const fx0 = 620, fx1 = 1140, fy = 560, fh = 72;
    src.forEach(([x, noun], k) => {
      const p = S.pop(0.3 + k * 0.3, 0.45); if (p <= 0) return;
      grow(ctx, x, 370, p, () => { if (k === 0) I.tbill(ctx, 0, 0, 62); else if (k === 1) I.loan(ctx, 0, 0, 70); else I.house(ctx, 0, 0, 78); });
      label(ctx, noun, x, 440, { s: 18, ls: 2, alpha: K.clamp(p) });
      aside(ctx, L.src[k].split(' ').slice(1).join(' '), x, 464, { s: 16, alpha: K.clamp(p) });
      // the income drips down into the fund
      const since = S.since(0.5 + k * 0.3);
      if (since > 0) for (let j = 0; j < 3; j++) {
        const u = (since * 1.25 + j / 3) % 1; ctx.save(); ctx.globalAlpha = Math.min(1, since * 3) * Math.sin(u * Math.PI);
        K.coin(ctx, x, K.lerp(482, fy + 6, u), 11, { mark: false }); ctx.restore();
      }
    });
    const fp = S.at(0.3, 0.4), lvl = 0.15 + 0.55 * S.at(0.6, 2.2, E.inOutCubic);
    fade(ctx, fp, () => {
      ctx.save(); K.rr(ctx, fx0, fy, fx1 - fx0, fh, 14); ctx.fillStyle = C.card; ctx.fill(); ctx.clip();
      ctx.fillStyle = C.orange; ctx.fillRect(fx0, fy + fh * (1 - lvl), fx1 - fx0, fh * lvl); ctx.restore();
      K.box(ctx, fx0, fy, fx1 - fx0, fh, { r: 14, fill: null, stroke: C.ink, lw: 5 });
      K.chip(ctx, 'THE FUND', (fx0 + fx1) / 2, fy + fh / 2, { s: 18, w: 700, fill: C.ink, c: C.bg, a: 'center', ls: 3 });
    });
    // the token: a claim on the income, never a source of it
    const cp = S.pop(1.3, 0.45);
    K.arrow(ctx, 662, fy + fh + 6, 662, 690, { p: S.at(1.2, 0.3), lw: 4, hs: 12, dash: [6, 7] });
    grow(ctx, 662, 722, cp, () => K.coin(ctx, 0, 0, 30, {}));
    const cl = L.claim.split(', ');
    aside(ctx, cl[0] + ',', 708, 717, { a: 'left', s: 17, c: C.ink, alpha: S.at(1.4, 0.4) });
    aside(ctx, cl[1], 708, 743, { a: 'left', s: 17, c: C.orange, alpha: S.at(1.5, 0.4) });
    // ---- divider
    fade(ctx, S.at(1.6, 0.4), () => K.line(ctx, 1192, 312, 1192, 780, { lw: 2.5, c: C.line2, dash: [10, 10] }));
    // ---- two ways out, same row shape: token -> whose clock -> cash
    const [s1, s2] = L.sell.split(' · '), [r1, r2] = L.redeem.split(' · ');
    const head = (h1, h2, y, al) => {
      label(ctx, h1, 1236, y, { a: 'left', s: 24, alpha: al });
      aside(ctx, '· ' + h2, 1236 + K.measure(ctx, h1, { f: 'mono', s: 24, w: 700, ls: 3 }) + 10, y, { a: 'left', s: 18, alpha: al });
    };
    const A = 1278, M = 1494, B = 1734, sy = 428, ry = 652;
    // SELL — the market's clock: instant
    head(s1, s2, 340, S.at(1.7, 0.4));
    grow(ctx, A, sy, S.pop(1.75, 0.45), () => K.coin(ctx, 0, 0, 30, {}));
    const whirl = S.since(2.0) > 0 ? Math.min(S.since(2.0), 0.45) * 40 : 0;
    grow(ctx, M, sy, S.pop(1.85, 0.45), () => I.clock(ctx, 0, 0, 92, { h: 10 + whirl / 12, m: 10 + whirl * 5 }));
    K.arrow(ctx, A + 40, sy, M - 60, sy, { p: S.at(2.0, 0.12, E.lin), lw: 5, c: C.orange, hs: 15 });
    K.arrow(ctx, M + 60, sy, B - 52, sy, { p: S.at(2.1, 0.12, E.lin), lw: 5, c: C.orange, hs: 15 });
    grow(ctx, B, sy, S.pop(2.22, 0.45), () => I.cash(ctx, 0, 0, 72));
    grow(ctx, M, sy + 82, S.pop(2.3, 0.45), () => label(ctx, 'INSTANT ✓', 0, 0, { c: C.green, s: 20 }));
    // REDEEM — the fund's calendar: you wait for the window
    head(r1, r2, 566, S.at(2.2, 0.4));
    grow(ctx, A, ry, S.pop(2.25, 0.45), () => K.coin(ctx, 0, 0, 30, {}));
    if (S.bt > 2.4) I.zzz(ctx, A + 26, ry - 26, 40, t);
    const cpage = S.lin(2.6, 0.3) + S.lin(3.0, 0.3);
    grow(ctx, M, ry, S.pop(2.3, 0.45), () => flipCal(ctx, 0, 0, 100, ['JAN', 'FEB', 'MAR'], cpage));
    K.arrow(ctx, A + 40, ry, M - 60, ry, { p: S.at(2.4, 0.5), lw: 4, hs: 13 });
    K.arrow(ctx, M + 60, ry, B - 52, ry, { p: S.at(3.3, 0.4), lw: 4, hs: 13 });
    grow(ctx, B, ry, S.pop(3.6, 0.45), () => I.cash(ctx, 0, 0, 72));
    aside(ctx, 'daily for some · quarterly for others', M, ry + 90, { s: 17, alpha: S.at(3.6, 0.4) });
  };

  // 10.4 Open-end: a revolving door, shares in and out at NAV. Closed-end: chained shut until maturity — sell to a buyer, never back.
  SC['L10.4'] = (ctx, S) => {
    const L = S.sc.labels;
    S.noteTo = [1590, 650];
    // ---- OPEN-END
    const oa = S.at(0.3, 0.4);
    label(ctx, L.open, 600, 330, { a: 'left', s: 26, c: C.green, alpha: oa });
    aside(ctx, L.openSub, 600, 361, { a: 'left', s: 16, alpha: oa });
    const dx = 880, dy = 560, dw = 236, dh = 230, sec = Math.max(0, S.since(1.0));
    const spin = sec * 2.6 + 1.6 * (1 - Math.exp(-sec * 5));
    grow(ctx, dx, dy + dh / 2, S.pop(0.3, 0.5), () => revDoor(ctx, 0, -dh / 2, dw, dh, spin, () => {
      if (sec <= 0) return;
      for (let k = 0; k < 4; k++) {
        const u1 = (sec * 0.42 + k / 4) % 1, u2 = (sec * 0.42 + k / 4 + 0.125) % 1, a1 = Math.min(1, sec * 3) * Math.sin(u1 * Math.PI), a2 = Math.min(1, sec * 3) * Math.sin(u2 * Math.PI);
        ctx.save(); ctx.globalAlpha = a1; K.coin(ctx, K.lerp(-215, 215, u1), -34, 20, {}); ctx.restore();
        ctx.save(); ctx.globalAlpha = a2; K.coin(ctx, K.lerp(215, -215, u2), -96, 20, {}); ctx.restore();
      }
    }));
    label(ctx, 'AT NAV', dx, dy - dh / 2 - 15, { s: 18, c: C.card, ls: 4, alpha: S.at(0.5, 0.3) });
    // a rotation arrow sweeping round the floor: it revolves
    const ra = S.at(1.0, 0.5);
    if (ra > 0) { ctx.save(); ctx.globalAlpha = ra; ctx.beginPath(); ctx.ellipse(dx, dy + dh / 2 + 4, dw / 2 + 40, 30, 0, 0.35, Math.PI - 0.35); ctx.lineWidth = 5; ctx.strokeStyle = C.green; ctx.lineCap = 'round'; ctx.stroke();
      const ea = 0.35, ex = dx + Math.cos(ea) * (dw / 2 + 40), ey = dy + dh / 2 + 4 + Math.sin(ea) * 30; ctx.beginPath(); ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 16, ey + 12); ctx.lineTo(ex - 14, ey + 18); ctx.closePath(); ctx.fillStyle = C.green; ctx.fill(); ctx.restore(); }
    // ---- CLOSED-END
    const ca = S.at(0.6, 0.4), qx = 1395, qy = 565;
    label(ctx, L.closed, 1236, 330, { a: 'left', s: 26, c: C.red, alpha: ca });
    aside(ctx, L.closedSub, 1236, 361, { a: 'left', s: 16, alpha: ca });
    grow(ctx, qx, qy, S.pop(0.6, 0.5), () => I.door(ctx, 0, 0, 250, {}));
    const lk = S.at(1.7, 0.3, E.inCubic);
    if (lk > 0) { chain(ctx, qx - 70, qy - 95, qx + 70, qy + 70, lk); chain(ctx, qx + 70, qy - 95, qx - 70, qy + 70, lk); }
    const pl = S.lin(2.0, 0.25);
    if (pl > 0) { const s = K.lerp(1.8, 1, E.outCubic(pl)); grow(ctx, qx, qy - 8, s, () => I.padlock(ctx, 0, 0, 84, {})); }
    // the only scheduled way out: a maturity date
    const mp = S.pop(2.4, 0.45);
    if (mp > 0) {
      const sw = Math.sin(Math.max(0, S.since(2.4)) * 7) * 0.12 * Math.exp(-Math.max(0, S.since(2.4)) * 2);
      grow(ctx, qx + 92, qy - 132, mp, () => {
        ctx.rotate(0.1 + sw);
        K.line(ctx, 0, 0, 34, 30, { lw: 2.5, c: C.ink2 });
        ctx.translate(34, 30);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26, -4); ctx.lineTo(130, -4); ctx.lineTo(130, 66); ctx.lineTo(26, 66); ctx.lineTo(0, 62); ctx.closePath();
        ctx.fillStyle = '#F6E7C8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(14, 31, 5, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
        K.txt(ctx, 'MATURES', 78, 22, { f: 'mono', s: 14, w: 700, c: C.ink2, a: 'center', ls: 2 });
        K.txt(ctx, '2031', 78, 56, { f: 'display', s: 34, w: 900, st: 'condensed', c: C.ink, a: 'center' });
      });
    }
    // the token: tradable to another buyer, not redeemable back through the door
    const tp = S.pop(3.0, 0.45), tx = 1585, ty = 640;
    grow(ctx, tx, ty, tp, () => K.coin(ctx, 0, 0, 32, {}));
    grow(ctx, 1752, 628, S.pop(3.1, 0.45), () => I.person(ctx, 0, 0, 96, { fill: C.teal }));
    K.arrow(ctx, tx + 40, ty - 10, 1712, ty - 12, { p: S.at(3.3, 0.3), lw: 5, c: C.green, hs: 15 });
    K.check(ctx, 1662, ty - 48, 30, S.at(3.5, 0.25), C.green, 6);
    K.arrow(ctx, tx - 30, ty + 22, qx + 92, ty + 22, { p: S.at(3.6, 0.3), lw: 5, c: C.red, dash: [10, 9], hs: 15, bend: -16 });
    K.cross(ctx, 1514, ty + 66, 30, S.at(3.8, 0.25), C.red, 6);
    const tk = L.tok.split(' · ');
    const la = S.at(4.0, 0.4), w1 = K.measure(ctx, tk[0] + ' · ', { f: 'mono', s: 19, w: 700, ls: 2 }), w2 = K.measure(ctx, tk[1], { f: 'mono', s: 19, w: 700, ls: 2 });
    label(ctx, tk[0] + ' ·', 1520 - (w1 + w2) / 2, 768, { a: 'left', s: 19, ls: 2, c: C.green, alpha: la });
    label(ctx, tk[1], 1520 - (w1 + w2) / 2 + w1, 768, { a: 'left', s: 19, ls: 2, c: C.red, alpha: la });
  };
})();
