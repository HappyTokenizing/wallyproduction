/* ch07.js — Real Estate. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
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
  // brand mark in a white chip, never cropped: round marks fill the chip, square marks sit inset inside it
  const ROUND = { figure: 1, centrifuge: 1, centrifuge2: 1, maple: 1 };
  const logoChip = (ctx, name, x, y, r) => {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line2; ctx.stroke();
    const im = K.img('logos/' + name); if (im) { const s = r * (ROUND[name] ? 1.72 : 1.28); ctx.drawImage(im, x - s / 2, y - s / 2, s, s); }
    ctx.restore();
  };
  // the SPV / trust: a sturdy box with a hinged lid (lid 0 = shut, 1 = open), centred at (x, y)
  const spvBox = (ctx, x, y, w, h, lid, txt) => {
    const lh = h * K.lerp(0.17, 0.62, lid), top = y - h / 2; // open: the lid stands up behind the box
    K.box(ctx, x - w / 2 + 8 * lid, top - lh, w - 16 * lid, lh, { r: 6, fill: '#D9B46A', stroke: C.ink, lw: 4 });
    if (lid > 0.02) { ctx.fillStyle = '#5A4632'; K.rr(ctx, x - w / 2 + 6, top - 12 * lid, w - 12, 12 * lid + 4, 4); ctx.fill(); }
    K.box(ctx, x - w / 2, y - h / 2, w, h, { r: 8, fill: '#E9C77E', stroke: C.ink, lw: 4 });
    ctx.fillStyle = 'rgba(122,75,42,.18)'; ctx.fillRect(x - w / 2 + 4, y - h / 2 + 4, w - 8, 8);
    if (txt) { K.box(ctx, x - w * 0.4, y - h * 0.2, w * 0.8, h * 0.4, { r: 6, fill: C.card, stroke: C.ink, lw: 3 }); label(ctx, txt, x, y + h * 0.075, { s: Math.round(h * 0.135), ls: 2 }); }
  };

  // 7.1 — the building stays put; its deed goes into an SPV / trust; the box issues the tokens
  SC['L7.1'] = (ctx, S) => {
    const L = S.sc.labels, bx = 700, by = 518, sx = 1150, sy = 600, bw = 300, bh = 184, wx = 1640, wy = 624, t = S.t;
    S.noteTo = [wx - 20, wy - 80];
    const p0 = S.pop(0.3), pB = S.pop(0.42), pW = S.pop(0.55);
    // building, staying exactly where it is
    at(ctx, p0, bx, by, (c) => I.building(c, 0, 0, 330, {}));
    label(ctx, 'THE BUILDING · STAYS PUT', bx, 732, { s: 16, ls: 2, c: C.ink2, alpha: p0 });
    // the SPV box: lid open, shuts on the thud
    const lid = 1 - S.at(1.82, 0.18, E.inCubic), th = S.since(2.0), sq = th > 0 ? Math.exp(-th * 9) * Math.sin(th * 30) * 0.03 : 0;
    // deed: pops out beside the building, zips over, drops in
    const dz = S.at(1.2, 0.5, E.inOutCubic), dd = S.at(1.7, 0.16, E.inCubic), dp = S.pop(0.3);
    const drawDeed = () => {
      if (dp <= 0 || dd >= 1) return;
      const q = qpt(bx + 160, by - 70, sx, sy - bh / 2 - 96, -150, dz);
      const x = q.x, y = K.lerp(q.y, sy - 10, dd), sc = dp * K.lerp(1, 0.82, dz);
      ctx.save(); ctx.translate(x, y); ctx.rotate(K.lerp(0.16, 0, dz) + Math.sin(dz * Math.PI) * 0.25); ctx.scale(sc, sc); I.doc(ctx, 0, 0, 126, { title: L.deed }); ctx.restore();
    };
    if (pB > 0) {
      ctx.save(); ctx.translate(sx, sy); ctx.scale(pB * (1 + sq), pB * (1 - sq)); ctx.translate(-sx, -sy);
      spvBox(ctx, sx, sy, bw, bh, lid, null); // lid behind
      ctx.restore();
    }
    drawDeed();
    if (pB > 0) {
      ctx.save(); ctx.translate(sx, sy); ctx.scale(pB * (1 + sq), pB * (1 - sq)); ctx.translate(-sx, -sy);
      K.box(ctx, sx - bw / 2, sy - bh / 2, bw, bh, { r: 8, fill: '#E9C77E', stroke: C.ink, lw: 4 });
      K.box(ctx, sx - bw * 0.4, sy - bh * 0.2, bw * 0.8, bh * 0.4, { r: 6, fill: C.card, stroke: C.ink, lw: 3 });
      label(ctx, L.spv, sx, sy + bh * 0.075, { s: 25, ls: 2 });
      if (th > 0) { ctx.beginPath(); ctx.arc(sx + bw / 2 - 30, sy + bh / 2 - 26, 15 * K.clamp(th * 6), 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke(); }
      ctx.restore();
    }
    // tokens: one per coin cue, out of the box and into the wallet
    const coins = [2.6, 2.8, 3.0];
    coins.forEach((b, k) => {
      const e = S.pop(b, 0.3), u = S.at(b, 0.45, E.inOutCubic); if (e <= 0) return;
      const q = qpt(sx + bw / 2 - 10, sy - 30, wx - 52 + k * 52, wy - 84 - (k === 1 ? 12 : 0), -120, u);
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(e, e); K.coin(ctx, 0, 0, 36, {}); ctx.restore();
    });
    at(ctx, pW, wx, wy, (c) => I.wallet(c, 0, 0, 200, {}));
    label(ctx, 'TOKENS · YOUR WALLET', wx, 732, { s: 16, ls: 2, c: C.ink2, alpha: pW });
    K.txt(ctx, 'holds the deed', sx, 734, { f: 'hand', s: 32, w: 700, c: C.ink2, a: 'center', alpha: S.at(2.05, 0.4) });
    // what the token is a claim on
    const r1 = S.at(3.45, 0.45), r2 = S.at(3.75, 0.5);
    K.arrow(ctx, wx - 122, wy + 8, sx + bw / 2 + 18, sy + 8, { p: r1, lw: 4.5, c: C.green, hs: 16 });
    if (r1 > 0.9) K.check(ctx, (wx - 122 + sx + bw / 2 + 18) / 2, sy - 24, 42, S.lin(3.75, 0.3), C.green);
    K.arrow(ctx, wx - 36, wy - 132, bx + 76, by - 182, { p: r2, lw: 4, c: C.red, dash: [11, 9], bend: 110, hs: 15 });
    if (r2 > 0.6) { const m = qpt(wx - 36, wy - 132, bx + 76, by - 182, 110, 0.5); K.cross(ctx, m.x, m.y, 48, S.lin(4.0, 0.3)); }
    const cl = S.at(4.1, 0.5);
    label(ctx, L.claim.toUpperCase(), 1190, 786, { s: 19, ls: 2, c: C.ink, alpha: cl });
  };

  // 7.2 — four builders, four answers: the cards are dealt face-down (same asset class), then flip
  const cardBack = (ctx, x, y, w, h) => {
    K.box(ctx, x, y, w, h, { r: 18, fill: C.orange, stroke: null, shadow: 14 });
    ctx.save(); K.rr(ctx, x, y, w, h, 18); ctx.clip();
    for (let i = -1; i < 6; i++) for (let j = -1; j < 9; j++) K.headMark(ctx, x + i * 62 + (j % 2) * 31, y + j * 58, 40, 'rgba(255,255,255,.2)');
    ctx.restore();
    K.box(ctx, x + 12, y + 12, w - 24, h - 24, { r: 12, fill: null, stroke: 'rgba(255,255,255,.75)', lw: 3 });
    K.box(ctx, x, y, w, h, { r: 18, fill: null, stroke: C.ink, lw: 4 });
    I.house(ctx, x + w / 2, y + h / 2 - 6, 118, { fill: C.card, roof: C.card, door: C.orange2 });
  };
  // wrap, then shrink the width while the line count holds, so no line is left with a lonely word
  const bwrap = (ctx, s, maxW, o) => { const n = K.wrap(ctx, s, maxW, o).length; let w = maxW; while (n > 1 && w > maxW * 0.55 && K.wrap(ctx, s, w - 8, o).length === n) w -= 8; return K.wrap(ctx, s, w, o); };
  const cardFront = (ctx, x, y, w, h, d, hl) => {
    const [logo, name, desc] = d, segs = desc.split(' · ');
    K.box(ctx, x, y, w, h, { r: 18, fill: C.card, stroke: C.ink, lw: 4, shadow: 14 });
    logoChip(ctx, logo, x + w / 2, y + 78, 54);
    K.txt(ctx, name, x + w / 2, y + 178, { f: 'serif', s: 34, w: 700, c: C.ink, a: 'center' });
    ctx.fillStyle = C.line2; ctx.fillRect(x + 26, y + 200, w - 52, 2);
    const hf = { f: 'serif', s: 26, w: 700 }, lines = bwrap(ctx, segs[0], w - 26, hf);
    let yy = y + 244;
    lines.forEach((ln) => { const lw = K.measure(ctx, ln, hf); if (hl > 0) K.marker(ctx, x + w / 2 - lw / 2 - 5, yy - 24, lw + 10, 32, hl); K.txt(ctx, ln, x + w / 2, yy, Object.assign({ c: C.ink, a: 'center' }, hf)); yy += 32; });
    yy += 20;
    const bf = { f: 'mono', s: 17, w: 600 };
    segs.slice(1).forEach((sg) => { bwrap(ctx, sg, w - 30, bf).forEach((ln) => { K.txt(ctx, ln, x + w / 2, yy, Object.assign({ c: C.ink2, a: 'center' }, bf)); yy += 24; }); yy += 12; });
  };
  SC['L7.2'] = (ctx, S) => {
    const cards = S.sc.labels.cards, w = 286, h = 432, gap = 20, x0 = 1191 - (4 * w + 3 * gap) / 2, y = 324;
    S.noteTo = [x0 + 140, 520];
    cards.forEach((d, i) => {
      const x = x0 + i * (w + gap), cx = x + w / 2, cy = y + h / 2;
      const deal = back(S, 0.0 + i * 0.06, 0.4); if (deal <= 0) return;
      const b = [0.3, 0.8, 1.3, 1.8][i], f = S.at(b - 0.2, 0.45, E.inOutCubic), ang = f * Math.PI, sxx = Math.abs(Math.cos(ang));
      ctx.save(); ctx.translate(cx, cy + (1 - deal) * 40); ctx.scale(Math.max(0.02, sxx) * K.clamp(deal, 0, 1.2), 1 + 0.05 * Math.sin(ang)); ctx.translate(-cx, -cy);
      if (f < 0.5) cardBack(ctx, x, y, w, h); else cardFront(ctx, x, y, w, h, d, S.at(2.5 + i * 0.15, 0.4));
      ctx.restore();
    });
  };

  // 7.3 — property → SPV/LLC → 1,000 units → 1,000 tokens; rent in, costs out, the rest to holders; the key gag
  const splitNum = (s) => { const w = s.split(' '); if (/\d/.test(w[0])) return [w.slice(1).join(' '), w[0]]; if (/\d/.test(w[w.length - 1])) return [w.slice(0, -1).join(' '), w[w.length - 1]]; return [s, '']; };
  const flowIcon = (ctx, i) => {
    if (i === 0) I.house(ctx, 0, 4, 112, {});
    else if (i === 1) { I.doc(ctx, 18, -30, 64, { lines: false }); spvBox(ctx, 0, 14, 124, 80, 0, null); K.box(ctx, -40, 0, 80, 30, { r: 5, fill: C.card, stroke: C.ink, lw: 2.5 }); label(ctx, 'LLC', 0, 22, { s: 15, ls: 2 }); }
    else if (i === 2) { for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.rect(-53 + q * 18, -44 + r * 18, 14, 14); ctx.fillStyle = (r * 6 + q) % 7 === 3 ? C.orange : C.card; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = C.ink; ctx.stroke(); } }
    else { K.coin(ctx, -36, 12, 30, {}); K.coin(ctx, 36, 12, 30, {}); K.coin(ctx, 0, -6, 34, {}); }
  };
  SC['L7.3'] = (ctx, S) => {
    const L = S.sc.labels, fy = 350, nx = [690, 990, 1290, 1595], pops = [0.3, 0.9, 1.5, 2.1], t = S.t;
    S.noteTo = [1400, 640];
    // the flow
    L.flow.forEach((s, i) => {
      const p = S.pop(pops[i]);
      if (i) K.arrow(ctx, nx[i - 1] + 90, fy, nx[i] - 90, fy, { p: S.at(pops[i] - 0.3, 0.3), lw: 4.5 });
      if (p <= 0) return;
      at(ctx, p, nx[i], fy, (c) => flowIcon(c, i));
      const [word, num] = splitNum(s);
      label(ctx, word, nx[i], fy + 84, { s: 17, alpha: p });
      if (num) K.txt(ctx, num, nx[i], fy + 124, { f: 'display', s: 38, w: 900, st: 'condensed', c: i ? C.orange : C.ink, a: 'center', alpha: p });
      else K.txt(ctx, 'holds the deed', nx[i], fy + 120, { f: 'hand', s: 30, w: 700, c: C.ink2, a: 'center', alpha: p });
    });
    // the per-token math, counted up
    const mp = S.at(2.7, 0.35);
    if (mp > 0) {
      const [lhs, rhs] = L.math.split(' = '), sp = rhs.indexOf(' '), num = rhs.slice(0, sp), rest = rhs.slice(sp + 1).toUpperCase();
      const target = parseInt(num.replace(/[^\d]/g, ''), 10) || 0, cnt = Math.round(target * E.outCubic(S.lin(2.8, 0.6)));
      const shown = num.replace(/\d[\d,]*/, cnt.toLocaleString('en-US'));
      const f1 = { f: 'display', s: 40, w: 900, st: 'condensed' }, f2 = { f: 'display', s: 58, w: 900, st: 'condensed' }, f3 = { f: 'mono', s: 19, w: 700, ls: 2 };
      const a = lhs + ' = ', wA = K.measure(ctx, a, f1), wB = K.measure(ctx, num, f2), wC = K.measure(ctx, rest, f3), x0 = 1190 - (wA + wB + 16 + wC) / 2, y = 538;
      K.txt(ctx, a, x0, y, Object.assign({ c: C.ink, alpha: mp }, f1));
      K.txt(ctx, shown, x0 + wA, y + 3, Object.assign({ c: C.orange, alpha: mp }, f2));
      K.txt(ctx, rest, x0 + wA + wB + 16, y - 2, Object.assign({ c: C.ink2, alpha: mp }, f3));
    }
    // rent in → costs out → the remainder to holders
    const rp = S.pop(3.6), py = 666;
    if (rp > 0) { at(ctx, rp, 650, py, (c) => I.cash(c, 0, 0, 64, {})); label(ctx, L.rent, 650, py - 44, { s: 18, alpha: rp }); }
    const pp = S.at(3.66, 0.35);
    if (pp > 0) {
      K.box(ctx, 702, py - 13, 300 * pp, 26, { r: 13, fill: C.raise, stroke: C.ink, lw: 3 });
      ctx.save(); K.rr(ctx, 702, py - 13, 300 * pp, 26, 13); ctx.clip();
      for (let i = 0; i < 9; i++) { const xx = 702 + ((t * 230 + i * 36) % 330) - 15; ctx.beginPath(); ctx.arc(xx, py, 6, 0, 7); ctx.fillStyle = C.green; ctx.fill(); }
      ctx.restore();
    }
    L.costs.forEach((s, i) => {
      const d = back(S, 3.9 + i * 0.12, 0.4); if (d <= 0) return;
      const tx = [762, 936][i % 2], ty = [718, 762][i >> 1], sx = 740 + i * 76;
      fade(ctx, K.clamp(d * 2), (c) => K.chip(c, '− ' + s, K.lerp(sx, tx, d), K.lerp(py + 10, ty, d), { s: 15, ls: 1, fill: '#FBE3E1', c: C.red, stroke: C.red, lw: 2, a: 'center' }));
    });
    const op = S.pop(4.4);
    if (op > 0) {
      K.arrow(ctx, 1010, py, 1062, py, { p: S.at(4.3, 0.2), lw: 4 });
      at(ctx, op, 1105, py, (c) => { K.coin(c, -16, 8, 20, {}); K.coin(c, 16, 8, 20, {}); K.coin(c, 0, -10, 22, {}); });
      const [o1, o2] = L.out.split(', ');
      label(ctx, o1.toUpperCase(), 1105, py - 44, { s: 16, ls: 2, alpha: op });
      if (o2) label(ctx, o2.toUpperCase(), 1105, py + 56, { s: 14, ls: 1, c: C.ink2, alpha: op });
    }
    // the gag: a token tried as a front-door key
    const dX = 1404, dY = 696, dS = 188, hx = dX + dS * 0.56 * 0.32, hy = dY + dS * 0.02;
    const dp = S.pop(4.1);
    at(ctx, dp, dX, dY + dS / 2, (c) => I.door(c, 0, -dS / 2, dS, {})); // grows up from its sill
    const kp = S.at(4.2, 0.38, E.inOutCubic), buzz = S.since(5.0), fall = S.at(5.1, 0.45, E.inCubic);
    if (kp > 0) {
      const jig = S.bt > 4.6 && S.bt < 5.0 ? Math.sin(t * 46) * 0.38 : 0;
      const x = K.lerp(1276, hx, kp) + (S.bt > 4.6 && S.bt < 5.0 ? Math.sin(t * 61) * 4 : 0), y = K.lerp(616, hy, kp) + fall * 80;
      ctx.save(); ctx.translate(x, y); ctx.rotate(jig + fall * 2.2); ctx.globalAlpha *= 1 - K.clamp((fall - 0.7) / 0.3);
      ctx.fillStyle = C.goldDark; ctx.fillRect(-4, -2, 34, 8); K.coin(ctx, 0, 0, 24, {}); ctx.restore();
    }
    if (buzz > 0) {
      const fl = K.clamp(1 - buzz / 0.35);
      if (fl > 0) { ctx.save(); ctx.globalAlpha *= fl; ctx.strokeStyle = C.red; ctx.lineWidth = 5; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(hx, hy, 34 + i * 16 + (1 - fl) * 30, 0, 7); ctx.stroke(); } ctx.restore(); }
      K.cross(ctx, hx, hy, 72, S.lin(5.0, 0.25));
      K.txt(ctx, 'NO', 1278, 724, { f: 'display', s: 64, w: 900, c: C.red, a: 'center', alpha: S.at(5.0, 0.2) });
    }
    L.no.forEach((s, i) => {
      const a = S.at(5.15 + i * 0.14, 0.3); if (a <= 0) return;
      K.cross(ctx, 1528, 646 + i * 50, 26, a, C.red, 5);
      label(ctx, s.toUpperCase(), 1550, 653 + i * 50, { a: 'left', s: 17, ls: 1, alpha: a });
    });
  };

  // 7.4 — the old exit takes months; the token transfer takes minutes; then three ways out
  const page = (ctx, x, y, r, mon, a) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.globalAlpha *= a;
    K.box(ctx, -24, -21, 48, 42, { r: 4, fill: C.card, stroke: C.ink, lw: 2.5 });
    ctx.fillStyle = C.red; ctx.fillRect(-22.5, -19.5, 45, 11);
    K.txt(ctx, mon, 0, 15, { f: 'mono', s: 12, w: 700, c: C.ink, a: 'center' });
    ctx.restore();
  };
  SC['L7.4'] = (ctx, S) => {
    const L = S.sc.labels, y1 = 404, y2 = 594, t = S.t, MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];
    S.noteTo = [960, y2 - 12];
    const p0 = S.pop(0.1, 0.45);
    // lane 1: the old exit — months of calendar pages past lawyers and a broker
    const fl = S.lin(0.3, 2.6), mi = Math.min(MON.length - 1, Math.floor(fl * MON.length));
    const wp = S.at(0.15, 1.4, E.inOutSine);
    if (wp > 0) { ctx.save(); ctx.setLineDash([9, 9]); ctx.beginPath(); for (let i = 0; i <= 60 * wp; i++) { const u = i / 60, x = K.lerp(744, 1338, u), y = y1 + 58 + Math.sin(u * Math.PI * 7) * 13; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.lineWidth = 3; ctx.strokeStyle = C.ink3; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
    at(ctx, p0, 680, y1, (c) => I.calendar(c, 0, 0, 122, { label: 'MONTH', big: MON[mi] }));
    [[868, '#3A332C'], [966, '#3A332C'], [1080, C.violet]].forEach(([x, f], k) => at(ctx, S.pop(0.2 + k * 0.12), x, y1 + 6, (c) => { I.person(c, 0, 0, 118, { fill: f }); if (k < 2) K.box(c, 22, 18, 30, 24, { r: 4, fill: '#7A4B2A', stroke: C.ink, lw: 2.5 }); }));
    at(ctx, S.pop(0.56), 1205, y1, (c) => { I.doc(c, 0, 0, 104, {}); K.txt(c, 'v7', 20, 46, { f: 'hand', s: 34, w: 700, c: C.red, a: 'center' }); c.strokeStyle = C.red; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, -6); c.lineTo(20, -10); c.stroke(); });
    for (let k = 0; k < 9; k++) {
      const u = S.lin(0.3 + k * 0.27, 1.5); if (u <= 0 || u >= 1) continue;
      page(ctx, K.lerp(700, 1470, u), y1 - 36 - Math.sin(u * Math.PI) * 46 + (k % 2) * 14, (u * 3 + k) * 0.9, MON[k], 1 - K.clamp((u - 0.8) / 0.2));
    }
    K.txt(ctx, 'MONTHS', 1352, y1 + 18, { f: 'display', s: 52, w: 900, st: 'condensed', c: C.red, alpha: S.at(1.6, 0.4) });
    label(ctx, L.old.toUpperCase(), 1010, y1 + 100, { s: 16, ls: 2, c: C.ink2, alpha: S.at(0.6, 0.4) });
    // lane 2: the token transfer
    const p2 = S.pop(0.8), z = S.at(1.2, 0.32, E.inOutCubic);
    at(ctx, p2, 690, y2, (c) => I.wallet(c, 0, 0, 112, {}));
    at(ctx, p2, 1205, y2, (c) => I.wallet(c, 0, 0, 112, {}));
    fade(ctx, p2, (c) => { c.setLineDash([10, 9]); K.line(c, 766, y2, 1128, y2, { lw: 3, c: C.ink3 }); c.setLineDash([]); });
    if (p2 > 0) {
      const x = K.lerp(745, 1150, z), hop = Math.sin(z * Math.PI) * 46;
      if (z > 0 && z < 1) for (let i = 1; i < 5; i++) K.line(ctx, x - 30 - i * 22, y2 - hop - 12 + (i % 2) * 18, x - 30 - i * 22 - 26, y2 - hop - 12 + (i % 2) * 18, { lw: 4, c: C.orange });
      at(ctx, p2, x, y2 - 30 - hop, (c) => K.coin(c, 0, 0, 30, {}));
    }
    at(ctx, S.pop(1.45), 1300, y2 - 4, (c) => I.clock(c, 0, 0, 76, { h: 12, m: 3 }));
    K.txt(ctx, 'MINUTES', 1352, y2 + 16, { f: 'display', s: 52, w: 900, st: 'condensed', c: C.green, alpha: S.at(1.5, 0.4) });
    label(ctx, L.new.toUpperCase(), 1010, y2 + 82, { s: 16, ls: 2, c: C.green, alpha: S.at(1.4, 0.4) });
    // the buyer pool: thin today, filling out
    const bp = S.pop(1.9), lvl = 0.2 + 0.14 * S.at(2.6, 2.4, E.inOutSine);
    at(ctx, bp, 1700, 488, (c) => I.tank(c, 0, 0, 196, { level: lvl, liquid: '#7FB6E8' }));
    if (bp > 0) { const ar = S.at(3.2, 0.4); K.arrow(ctx, 1774, 560, 1774, 500 - 18 * ar, { p: ar, lw: 4, c: C.green, hs: 14 }); }
    const [t1, t2] = L.thin.split(': ');
    label(ctx, (t2 ? t1 : 'BUYER POOL').toUpperCase(), 1700, 624, { s: 17, ls: 2, alpha: bp });
    K.txt(ctx, t2 || t1, 1700, 658, { f: 'hand', s: 30, w: 700, c: C.ink2, a: 'center', alpha: bp });
    // three ways out
    const bf = { f: 'mono', s: 20, w: 700, ls: 2 }, ws = L.opts.map((o) => K.measure(ctx, o + '  ▸', bf) + 52);
    let x = 1060 - (ws.reduce((a, b) => a + b, 0) + 24 * (ws.length - 1)) / 2;
    L.opts.forEach((o, i) => {
      const p = S.pop([2.2, 2.6, 3.0][i]), w = ws[i];
      if (p > 0) at(ctx, p, x + w / 2, 752, (c) => { K.box(c, -w / 2, -26, w, 52, { r: 26, fill: i === 0 ? C.orange : C.card, stroke: C.ink, lw: 3.5, shadow: 10 }); K.txt(c, o + '  ▸', 0, 7, Object.assign({ c: i === 0 ? C.card : C.ink, a: 'center' }, bf)); });
      x += w + 24;
    });
  };
})();
