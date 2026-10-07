/* ch06.js — Private Credit. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  // run fn(ctx) translated to (x, y) and scaled by p; skipped while p <= 0
  const at = (ctx, p, x, y, fn) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p); fn(ctx); ctx.restore(); };
  const fade = (ctx, a, fn) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, a); fn(ctx); ctx.restore(); };
  // eased overshoot from beat b0; exactly 0 before b0 (E.outBack(0) is ~2e-16, which would pass a `> 0` guard)
  const back = (S, b0, db) => (S.bt < b0 ? 0 : S.at(b0, db, E.outBack));
  // a small scale "nod" from beat b0 (ties a checklist tick to the thing it checks)
  const nod = (S, b0, amt = 0.1, d = 0.45) => { const u = S.lin(b0, d); return u > 0 && u < 1 ? 1 + amt * Math.sin(u * Math.PI) : 1; };

  // the borrowing business: a little shop front, centred at (x, y), ~s tall
  const shop = (ctx, x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(2.5, s * 0.03);
    const w = s * 1.1, top = -s / 2, body = top + s * 0.34, bot = s / 2;
    ctx.beginPath(); ctx.rect(-w / 2, body, w, bot - body); ctx.fillStyle = '#F3E2C7'; ctx.fill(); ctx.stroke();
    K.rr(ctx, -w * 0.36, top, w * 0.72, s * 0.17, s * 0.03); ctx.fillStyle = C.card; ctx.fill(); ctx.stroke();
    K.txt(ctx, 'BUSINESS', 0, top + s * 0.118, { f: 'mono', s: s * 0.085, w: 700, c: C.ink, a: 'center', ls: 1 });
    const ay = top + s * 0.21, ah = s * 0.1, n = 6, aw = w * 1.08, sw = aw / n; // striped awning, scalloped edge
    for (let i = 0; i < n; i++) {
      const x0 = -aw / 2 + i * sw;
      ctx.beginPath(); ctx.moveTo(x0, ay); ctx.lineTo(x0 + sw, ay); ctx.lineTo(x0 + sw, ay + ah); ctx.arc(x0 + sw / 2, ay + ah, sw / 2, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = i % 2 ? C.card : C.orange; ctx.fill(); ctx.stroke();
    }
    K.rr(ctx, -w * 0.42, body + s * 0.2, w * 0.44, s * 0.24, 4); ctx.fillStyle = '#BFD8EE'; ctx.fill(); ctx.stroke();
    K.rr(ctx, w * 0.12, body + s * 0.14, w * 0.28, bot - body - s * 0.14, 4); ctx.fillStyle = '#8A5A33'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.35, body + s * 0.36, s * 0.022, 0, 7); ctx.fillStyle = C.gold; ctx.fill();
    ctx.restore();
  };
  // checklist row: box + green tick (p) + label, row centre y
  const tickRow = (ctx, s, x, y, p, a) => fade(ctx, a, (c) => {
    K.box(c, x, y - 17, 34, 34, { r: 7, fill: C.card, stroke: C.ink, lw: 3 });
    K.check(c, x + 17, y + 1, 34, p, C.green, 6);
    label(c, s.toUpperCase(), x + 52, y + 7, { a: 'left', s: 19, ls: 2 });
  });

  // 6.1 — lender → loan → borrower. The loan gets wrapped in a token; the checklist confirms nothing else moved
  SC['L6.1'] = (ctx, S) => {
    const L = S.sc.labels, y = 436, xL = 712, xN = 1100, xB = 1478; S.noteTo = [xN - 70, y - 30];
    const pL = S.pop(0.3), pN = S.pop(0.8), pB = S.pop(1.3), tk = (i) => 3.0 + i * 0.3;
    // lender (the underwriter nods on the last tick)
    at(ctx, pL * nod(S, tk(3)), xL, y, (c) => I.bank(c, 0, 0, 186, {}));
    label(ctx, L.lender, xL, y + 148, { alpha: pL });
    K.arrow(ctx, xL + 112, y, xN - 134, y, { p: S.at(0.55, 0.35), lw: 5 });
    K.arrow(ctx, xN + 134, y, xB - 122, y, { p: S.at(1.05, 0.35), lw: 5 });
    // the loan — wrapped in a token on the zip, still a loan inside
    const wr = back(S, 2.2, 0.5), w1 = K.clamp(wr);
    at(ctx, pN * nod(S, tk(2)), xN, y, (c) => {
      if (wr > 0) { c.save(); c.scale(wr, wr); K.coin(c, 0, 0, 104, { mark: false }); c.restore(); }
      I.loan(c, 0, 4 * w1, K.lerp(160, 116, w1), {});
    });
    label(ctx, L.loan, xN, y + 148, { alpha: pN });
    fade(ctx, w1, (c) => K.chip(c, 'NOW IN A TOKEN', xN, y - 138, { s: 17, fill: C.orange, c: C.card }));
    // borrower + its repayment calendar
    at(ctx, pB * nod(S, tk(0)), xB, y, (c) => shop(c, 0, 0, 190));
    label(ctx, L.borrower, xB, y + 148, { alpha: pB });
    at(ctx, S.pop(1.55) * nod(S, tk(1), 0.16), xB + 168, y - 50, (c) => I.calendar(c, 0, 0, 96, { label: 'REPAY', big: '30' }));
    // the checklist (2 x 2), ticked on the cue beats
    const cols = [650, 1240], rows = [672, 738];
    L.same.forEach((s, i) => tickRow(ctx, s, cols[i % 2], rows[i >> 1], S.lin(tk(i), 0.25), S.at(2.6 + i * 0.06, 0.35)));
  };

  // 6.2 — origination → pool platforms → you. The spotlight lands on whoever underwrote the loans
  const card = (ctx, x, cy, d, p, hl) => { // d = [TITLE, description, [logos], [names]]
    if (p <= 0) return; const w = 350, h = 316, y = cy - h / 2;
    ctx.save(); ctx.translate(x, cy); ctx.scale(p, p); ctx.translate(-x, -cy);
    K.box(ctx, x - w / 2, y, w, h, { r: 20, fill: C.card, stroke: null, shadow: 16 });
    ctx.save(); K.rr(ctx, x - w / 2, y, w, h, 20); ctx.clip(); ctx.fillStyle = C.raise; ctx.fillRect(x - w / 2, y, w, 58); ctx.restore();
    K.line(ctx, x - w / 2, y + 58, x + w / 2, y + 58, { lw: 3 });
    K.box(ctx, x - w / 2, y, w, h, { r: 20, fill: null, stroke: C.ink, lw: 4 });
    label(ctx, d[0], x, y + 38, { s: 21, ls: 3 });
    const n = d[2].length;
    d[2].forEach((lg, i) => { const lx = x + (i - (n - 1) / 2) * 144; K.logo(ctx, lg, lx, y + 126, 46); K.txt(ctx, d[3][i], lx, y + 206, { f: 'serif', s: 25, w: 700, c: C.ink, a: 'center' }); });
    const fo = { f: 'serif', s: 22, i: true }, lines = K.wrap(ctx, d[1], w - 56, fo), key = d[1].split(',')[0];
    lines.forEach((ln, i) => {
      const ly = y + 252 + i * 28, lw = K.measure(ctx, ln, fo);
      if (i === 0 && hl > 0 && ln.indexOf(key) === 0) K.marker(ctx, x - lw / 2 - 6, ly - 21, K.measure(ctx, key, fo) + 12, 29, hl, 'rgba(255,214,90,.75)');
      K.txt(ctx, ln, x, ly, Object.assign({ c: C.ink2, a: 'center' }, fo));
    });
    ctx.restore();
  };
  const spotlight = (ctx, x, y0, y1, a) => {
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(255,214,90,.62)'); g.addColorStop(1, 'rgba(255,214,90,.14)');
    ctx.beginPath(); ctx.moveTo(x - 30, y0 + 22); ctx.lineTo(x + 30, y0 + 22); ctx.lineTo(x + 186, y1); ctx.lineTo(x - 186, y1); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y1, 186, 22, 0, 0, 7); ctx.fillStyle = 'rgba(255,214,90,.32)'; ctx.fill();
    // the lamp
    ctx.translate(x, y0); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-26, -8); ctx.lineTo(26, -8); ctx.lineTo(36, 24); ctx.lineTo(-36, 24); ctx.closePath(); ctx.fillStyle = C.ink2; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 24, 30, 6, 0, 0, 7); ctx.fillStyle = '#FFE9A0'; ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  SC['L6.2'] = (ctx, S) => {
    const L = S.sc.labels, cy = 556, xO = 755, xP = 1185, xY = 1636; S.noteTo = [xO + 40, 440];
    const pO = S.pop(0.3), pP = S.pop(1.0), pY = S.pop(1.4), sp = S.at(2.6, 0.3);
    if (sp > 0) spotlight(ctx, xO, 300, 738, sp * (0.94 + 0.06 * Math.sin(S.t * 11)));
    card(ctx, xO, cy, L.orig, pO, S.at(2.85, 0.45));
    card(ctx, xP, cy, L.pool, pP, 0);
    const a1 = S.at(1.0, 0.3), a2 = S.at(1.4, 0.3);
    K.arrow(ctx, xO + 181, cy, xP - 183, cy, { p: a1, lw: 5 });
    K.arrow(ctx, xP + 181, cy, xY - 92, cy, { p: a2, lw: 5 });
    at(ctx, pY, xY, cy + 16, (c) => { I.person(c, 0, 0, 214, { fill: C.blue }); K.coin(c, 68, 36, 30, {}); });
    label(ctx, 'YOU', xY, cy + 140, { s: 22, alpha: pY });
    // the answer: the underwriter sits at the start of the chain
    at(ctx, S.pop(3.3, 0.45), xO + 118, cy - 168, (c) => { c.rotate(0.08); K.chip(c, 'UNDERWRITER', 0, 0, { s: 17, fill: C.orange, c: C.card, stroke: C.ink, lw: 3, a: 'center' }); });
    // you ask; the spotlight answers
    at(ctx, S.pop(2.6, 0.5), xY - 20, 362, (c) => {
      K.bubble(c, -160, -50, 320, 92, 22, 92, {});
      K.txt(c, 'WHO UNDERWROTE', 0, -8, { f: 'display', s: 30, w: 900, st: 'semi-condensed', c: C.ink, a: 'center' });
      K.txt(c, 'THIS LOAN?', 0, 26, { f: 'display', s: 30, w: 900, st: 'semi-condensed', c: C.orange, a: 'center' });
    });
  };

  // 6.3 — pool rates; Pool D glows at 24%; lenders walk up, peek, and pass
  const bar = (ctx, x, y, w, h, fill) => { const r = Math.min(8, h / 2); ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke(); };
  const walker = (ctx, x, g, r, ph, mood, lean) => { // a little lender coin on legs; g = ground y
    const sw = Math.sin(ph) * r * 0.32, hop = Math.abs(Math.sin(ph)) * r * 0.14;
    ctx.save(); ctx.lineWidth = Math.max(3, r * 0.15); ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, g - r * 0.6); ctx.lineTo(x - r * 0.3 + sw, g); ctx.moveTo(x + r * 0.3, g - r * 0.6); ctx.lineTo(x + r * 0.3 - sw, g); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(x, g - r * 1.45 - hop); ctx.rotate(lean || 0); I.mascot(ctx, 0, 0, r, { mood }); ctx.restore();
  };
  const nope = (ctx, x, y, p) => at(ctx, p, x, y, (c) => { K.bubble(c, -48, -36, 96, 50, 6, 30, { r: 16, lw: 3 }); K.txt(c, 'nope', 0, 1, { f: 'hand', s: 34, w: 700, c: C.red, a: 'center' }); });
  const twinkle = (ctx, x, y, r, a) => { if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.25, y + r * 0.25); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25); ctx.closePath(); ctx.fill(); ctx.restore(); };
  SC['L6.3'] = (ctx, S) => {
    const L = S.sc.labels, base = 716, k = 13.2, bw = 104, xs = [700, 840, 980, 1165], pops = [0.3, 0.6, 0.9, 1.3], t = S.t;
    S.noteTo = [1340, 590];
    const top = (r) => base - r * k, ys = top(11), yd = top(24);
    fade(ctx, S.at(0.15, 0.4), (c) => K.line(c, 612, base, 1808, base, { lw: 4, c: C.ink }));
    // the rest of the sector tops out here …
    const gp = S.at(3.2, 0.5);
    fade(ctx, gp, (c) => { c.setLineDash([9, 8]); K.line(c, xs[2] + bw / 2 + 6, ys, xs[3] + bw / 2 + 40, ys, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
    L.pools.forEach(([name, r], i) => {
      const hot = i === 3, g = back(S, pops[i], hot ? 0.6 : 0.45); if (g <= 0) return;
      const x = xs[i], h = r * k * g, a = K.clamp(g * 1.5);
      if (hot) { ctx.save(); ctx.shadowColor = 'rgba(255,98,0,.75)'; ctx.shadowBlur = 34 + 12 * Math.sin(t * 8); bar(ctx, x - bw / 2, base - h, bw, h, C.orange); ctx.restore(); }
      bar(ctx, x - bw / 2, base - h, bw, h, hot ? C.orange : '#E4DACA');
      K.txt(ctx, r + '%', x, base - h - 16, { f: 'display', s: hot ? 78 : 40, w: 900, st: 'condensed', c: hot ? C.orange : C.ink, a: 'center', alpha: a });
      label(ctx, name, x, base + 34, { s: 17, alpha: a, c: hot ? C.orange2 : C.ink });
      if (hot && g >= 1) [[-82, -86, 0], [78, -70, 1.7], [92, 4, 3.1], [-74, 6, 4.4]].forEach(([dx, dy, ph]) => twinkle(ctx, x + dx, base - h + dy, 12 + 6 * Math.sin(t * 6 + ph), 0.85));
    });
    // … and Pool D sits way above it: the gap
    if (gp > 0) {
      const bx = xs[3] + bw / 2 + 22, my = (yd + ys) / 2;
      ctx.save(); ctx.globalAlpha *= gp; ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx, yd); ctx.lineTo(bx + 16, yd); ctx.lineTo(bx + 16, ys); ctx.lineTo(bx, ys); ctx.moveTo(bx + 16, my); ctx.lineTo(bx + 30, my); ctx.stroke(); ctx.restore();
      const [g1, g2] = L.gap.split(' = ');
      label(ctx, g1.toUpperCase() + ' =', bx + 44, my - 26, { a: 'left', s: 22, c: C.orange, alpha: gp });
      K.wrap(ctx, g2, 470, { f: 'serif', s: 27, i: true }).forEach((ln, i) => K.txt(ctx, ln, bx + 44, my + 12 + i * 33, { f: 'serif', s: 27, i: true, c: C.ink, alpha: S.at(3.35 + i * 0.1, 0.4) }));
    }
    // the lenders: walk up, peek, nope, walk off
    [[1600, 1274, 1478], [1708, 1386, 1590], [1800, 1498, 1702]].forEach(([s0, a0, r0], j) => {
      const app = S.at(1.45 + j * 0.08, 0.3); if (app <= 0) return;
      const u1 = S.lin(1.5, 0.8), u2 = S.lin(3.0, 0.6);
      const walking = (u1 > 0 && u1 < 1) || (u2 > 0 && u2 < 1);
      const x = u2 > 0 ? K.lerp(a0, r0, E.inOutSine(u2)) : K.lerp(s0, a0, E.inOutSine(u1));
      const peek = S.bt > 2.3 && u2 <= 0, mood = u2 > 0 ? 'smug' : peek ? 'worried' : 'happy';
      fade(ctx, app, (c) => walker(c, x, base, 29, walking ? t * 15 + j * 2 : 0, mood, peek ? -0.22 * S.at(2.3, 0.2) : 0));
      if (j < 2) nope(ctx, x + 6, base - 112, S.pop(j ? 2.8 : 2.4, 0.4));
    });
    // the fee stack: what actually reaches you
    const rp = S.at(3.6, 0.4);
    if (rp > 0) {
      const [lhs, rhs] = L.math.split(' = '), parts = lhs.split(' − '), rx = 624, ry = 300, rw = 296, rh = 176;
      const rows = [parts[0].toUpperCase()].concat(parts.slice(1).map((s) => '− ' + s.toUpperCase()));
      fade(ctx, rp, (c) => {
        c.save(); c.shadowColor = 'rgba(32,26,19,.16)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + rw, ry); c.lineTo(rx + rw, ry + rh);
        for (let i = 0; i < 12; i++) c.lineTo(rx + rw - (i + 0.5) * rw / 12, ry + rh + (i % 2 ? 0 : 8));
        c.lineTo(rx, ry + rh); c.closePath(); c.fillStyle = C.card; c.fill(); c.restore();
        c.lineWidth = 3; c.strokeStyle = C.ink; c.lineJoin = 'round'; c.stroke();
      });
      rows.forEach((s, i) => label(ctx, s, rx + 24, ry + 36 + i * 27, { a: 'left', s: 18, ls: 2, c: i ? C.red : C.ink, alpha: S.at(3.7 + i * 0.12, 0.3) }));
      const fa = S.at(4.25, 0.35);
      fade(ctx, fa, (c) => { c.fillStyle = C.ink; c.fillRect(rx + 24, ry + 131, rw - 48, 3); });
      label(ctx, '= ' + rhs.toUpperCase(), rx + 24, ry + 160, { a: 'left', s: 18, ls: 2, c: C.orange2, alpha: fa });
    }
  };

  // 6.4 — the sign promises weekly; everyone runs for the exit at once; the reserve drains; the gate slams
  SC['L6.4'] = (ctx, S) => {
    const L = S.sc.labels, dx = 1275, fl = 724, dw = 200, dh = 280, tx = 1580, t = S.t; S.noteTo = [dx + 150, 352];
    const p0 = S.pop(0.3), doorL = dx - dw / 2, doorT = fl - dh;
    fade(ctx, S.at(0.1, 0.4), (c) => K.line(c, 600, fl, 1806, fl, { lw: 3, c: C.ink3 }));
    // the cash reserve, piped to the exit
    const drain = S.at(2.2, 0.9, E.inOutCubic), lvl = K.lerp(0.86, 0.07, drain), ts = 262, tcy = fl - ts / 2;
    at(ctx, p0, tx, tcy, (c) => {
      c.beginPath(); c.rect(-ts * 0.3 - 112, ts / 2 - 52, 116, 26); c.fillStyle = '#B9B4A8'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = C.ink; c.stroke();
      I.tank(c, 0, 0, ts, { level: lvl, liquid: C.greenLite });
      if (drain > 0 && drain < 1) for (let i = 0; i < 4; i++) { const u = (t * 1.6 + i / 4) % 1; c.beginPath(); c.arc(Math.sin(i * 2.1 + t * 3) * 30, ts / 2 - 14 - u * (ts * lvl - 18), 5, 0, 7); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); }
    });
    if (drain > 0) fade(ctx, drain, (c) => { c.setLineDash([8, 7]); K.line(c, tx - ts * 0.38, fl - ts * 0.86, tx + ts * 0.38, fl - ts * 0.86, { lw: 3, c: C.ink2 }); c.setLineDash([]); });
    label(ctx, L.tank, tx, fl + 38, { s: 18, alpha: p0 });
    // the exit
    at(ctx, p0, dx, fl - dh / 2, (c) => {
      K.box(c, -dw / 2 - 18, -dh / 2 - 18, dw + 36, dh + 18, { r: 6, fill: '#B9B4A8', stroke: C.ink, lw: 4 });
      K.box(c, -dw / 2, -dh / 2, dw, dh, { r: 3, fill: '#2A1E12', stroke: C.ink, lw: 3 });
    });
    // the crowd: 18 coins in three rows; the first three out get paid, the rest meet the gate
    const R = 31, rows = [730, 752, 774], xs0 = [640, 612, 664], items = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
      const k = row * 6 + i, x0 = xs0[row] + i * 78, g0 = rows[row];
      const pk = S.pop(0.25 + ((i * 2 + row) % 5) * 0.05, 0.45); if (pk <= 0) continue;
      const st = 1.2 + ((5 - i) % 3) * 0.03 + row * 0.02;
      let x = x0, g = g0, sc = pk, al = 1, run = 0, mood = S.bt > 1.15 ? 'worried' : 'happy';
      if (i === 5) { // first in line: out through the door before the gate drops
        const a = [1.85, 2.25, 2.65][row], u = S.lin(st, a - st), v = S.lin(a, 0.32);
        x = K.lerp(x0, dx, E.inOutCubic(u)); g = K.lerp(g0, fl - 8, E.inOutCubic(u)); run = u > 0 && u < 1 ? 1 : 0;
        if (v > 0) { sc = pk * K.lerp(1, 0.45, v); al = 1 - v; g -= v * 30; mood = 'happy'; }
        if (v >= 1) continue;
      } else { // everyone else ends up pressed against the gate
        const m = 4 - i, xT = doorL - 38 - m * 66 + [0, -30, 8][row], a = 2.92 + m * 0.13 + row * 0.06, u = S.lin(st, a - st);
        x = K.lerp(x0, xT, E.inOutSine(u)); run = u > 0 && u < 1 ? 1 : 0;
        const hit = S.since(a); if (hit > 0) x -= Math.sin(Math.min(hit * 14, Math.PI)) * 12 * Math.exp(-hit * 3);
        if (S.bt > 3.05) mood = 'sad';
      }
      items.push({ x, g, sc, al, run, mood, k });
    }
    items.sort((a, b) => a.g - b.g).forEach(({ x, g, sc, al, run, mood, k }) => {
      const hop = run ? Math.abs(Math.sin(t * 13 + k)) * 12 : Math.abs(Math.sin(t * 2.4 + k)) * 2;
      fade(ctx, al, (c) => {
        c.beginPath(); c.ellipse(x, g - 2, R * 0.9 * sc, 6 * sc, 0, 0, 7); c.fillStyle = 'rgba(32,26,19,.14)'; c.fill();
        if (run) for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - R - 10 - i * 16, g - 8 - i * 3, (7 + i * 4) * sc, 0, 7); c.fillStyle = `rgba(200,188,166,${0.42 - i * 0.12})`; c.fill(); }
        at(c, sc, x, g - R - 6 - hop, (cc) => I.mascot(cc, 0, 0, R, { mood }));
      });
    });
    // the gate drops just before the beat and lands ON the slam
    const drop = E.inCubic(S.lin(2.78, 0.22)), sl = S.since(3.0), bounce = sl > 0 ? Math.exp(-sl * 9) * Math.abs(Math.sin(sl * 26)) * 16 : 0;
    if (drop > 0) {
      const gy = doorT + dh * drop - bounce;
      ctx.save(); ctx.beginPath(); ctx.rect(doorL, doorT, dw, dh); ctx.clip(); ctx.lineCap = 'round';
      for (let i = 0; i <= 6; i++) { const xx = doorL + 16 + i * (dw - 32) / 6; ctx.strokeStyle = C.ink; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(xx, doorT - 10); ctx.lineTo(xx, gy - 6); ctx.stroke(); ctx.strokeStyle = '#6E675C'; ctx.lineWidth = 7; ctx.stroke(); ctx.beginPath(); ctx.moveTo(xx - 7, gy - 10); ctx.lineTo(xx, gy + 6); ctx.lineTo(xx + 7, gy - 10); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); }
      for (let m = 0; m < 4; m++) { const yy = gy - 34 - m * 66; if (yy < doorT) break; ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(doorL, yy); ctx.lineTo(doorL + dw, yy); ctx.stroke(); ctx.strokeStyle = '#6E675C'; ctx.lineWidth = 6; ctx.stroke(); }
      ctx.restore();
    }
    K.stamp(ctx, L.gate, dx, fl - 150, { p: S.lin(3.08, 0.22), s: 58, rot: -0.12, seed: 4 });
    // the promise, hanging over the door — later with a footnote
    const sp = S.pop(0.45);
    if (sp > 0) {
      const sw = K.measure(ctx, L.sign, { f: 'mono', s: 26, w: 700, ls: 3 }) + 64, sy = 322;
      ctx.save(); ctx.translate(dx, sy); ctx.scale(sp, sp); ctx.rotate(Math.sin(t * 2.2) * 0.012);
      K.line(ctx, -sw * 0.32, -30, -sw * 0.32, 0, { lw: 3, c: C.ink2 }); K.line(ctx, sw * 0.32, -30, sw * 0.32, 0, { lw: 3, c: C.ink2 });
      K.box(ctx, -sw / 2, 0, sw, 66, { r: 10, fill: C.card, stroke: C.ink, lw: 4, shadow: 10 });
      label(ctx, L.sign, 0, 43, { s: 26, ls: 3, c: C.green });
      ctx.restore();
      const ap = S.pop(3.4, 0.4);
      if (ap > 0) at(ctx, ap, dx + sw / 2 + 4, sy + 30, (c) => K.txt(c, '*', 0, 34, { f: 'hand', s: 88, w: 700, c: C.red, a: 'center' }));
    }
  };
})();
