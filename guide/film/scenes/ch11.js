/* ch11.js — Risk & Red Flags. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin
   note and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const aside = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 17, w: 600, c: C.ink2, a: 'center', ls: 1 }, o));
  const grow = (ctx, x, y, k, fn) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); };
  const fade = (ctx, a, fn) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); };
  // fit a mono string on one line, or split it into two lines of roughly equal width (no orphans)
  const balance = (ctx, s, maxW, o) => {
    if (K.measure(ctx, s, o) <= maxW) return [s];
    const w = s.split(' '); let best = null, bw = 1e9;
    for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(K.measure(ctx, a, o), K.measure(ctx, b, o)); if (m < bw) { bw = m; best = [a, b]; } }
    return best;
  };
  // thought bubble: pill + two trailing puffs towards (tx, ty)
  function thought(ctx, x, y, w, h, tx, ty) {
    ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.fillStyle = C.card;
    for (const [k, r] of [[0.72, 9], [0.42, 6]]) { ctx.beginPath(); ctx.arc(K.lerp(x, tx, k), K.lerp(y - h / 2, ty, k), r, 0, 7); ctx.fill(); ctx.stroke(); }
    K.rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // 11.1 A big number counts up; the magnifier finds the footnote; a SELF-REPORTED flag goes in; three possible truths
  SC['L11.1'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, cx = 1190, base = 482, ns = 140;
    S.noteTo = [900, 556];
    const nf = { f: 'display', s: ns, w: 900, st: 'condensed' }, fullW = K.measure(ctx, L.num, nf), x0 = cx - fullW / 2;
    const c = S.at(0.3, 0.95, E.outCubic), n = Math.round(500000000 * c);
    const num = '$' + n.toLocaleString('en-US');
    const sh = K.shake(t, 2.0 * S.b, 6, 0.3, 3);
    if (S.bt > 0.25) K.txt(ctx, num, x0 + sh.x, base + sh.y, { f: 'display', s: ns, w: 900, st: 'condensed', c: C.ink });
    // the asterisk + footnote, then the magnifier makes it readable
    const fa = S.at(1.2, 0.3), zoom = S.at(1.4, 0.45, E.outBack);
    K.txt(ctx, '*', x0 + fullW + 4, base - ns * 0.5, { f: 'display', s: 64, w: 900, c: C.orange, alpha: fa });
    const fs = K.lerp(15, 28, K.clamp(zoom)), fy = base + 30 + zoom * 70;
    const foot = '*' + L.src;
    K.txt(ctx, foot, cx, fy, { f: 'mono', s: fs, w: 700, c: zoom > 0.5 ? C.ink : C.ink3, a: 'center', ls: 1, alpha: fa });
    if (zoom > 0) {
      const fw = K.measure(ctx, foot, { f: 'mono', s: 28, w: 700, ls: 1 }), wx = K.measure(ctx, 'issuer', { f: 'mono', s: 28, w: 700, ls: 1 });
      const lx = cx + fw / 2 - wx / 2 + 1, ly = fy - 9, mz = 194;
      fade(ctx, K.clamp(zoom * 2), () => I.magnifier(ctx, lx + 10 + (1 - zoom) * 120, ly + 10, mz, {}));
    }
    // SELF-REPORTED flag planted on the number
    const fl = S.at(1.75, 0.25, E.inCubic), px = x0 + 54, wave = Math.sin(t * 7) * 0.5 + 0.5;
    if (fl > 0) {
      const dy = (1 - fl) * -110, top = 296 + dy, bot = base - ns * 0.68 + 10 + dy;
      ctx.save(); ctx.globalAlpha = K.clamp(fl * 3); ctx.beginPath(); ctx.rect(560, 280, 1300, 300); ctx.clip();
      K.line(ctx, px, bot, px, top, { lw: 6, c: C.ink });
      const fw = 262, fh = 50;
      ctx.beginPath(); ctx.moveTo(px, top); ctx.quadraticCurveTo(px + fw * 0.5, top - 8 + wave * 10, px + fw, top + 2);
      ctx.lineTo(px + fw, top + fh + 2); ctx.quadraticCurveTo(px + fw * 0.5, top + fh - 6 + wave * 10, px, top + fh); ctx.closePath();
      ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      K.txt(ctx, L.flag, px + fw / 2, top + fh / 2 + 9 + wave * 2, { f: 'mono', s: 21, w: 700, c: C.card, a: 'center', ls: 2 });
      ctx.beginPath(); ctx.arc(px, top - 4, 7, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    // what could the number actually be?
    const bx = [790, 1190, 1590];
    L.maybe.forEach((m, k) => {
      const p = S.pop(2.6 + k * 0.3, 0.45); if (p <= 0) return;
      grow(ctx, bx[k], 738, p, () => {
        thought(ctx, 0, 0, 330, 74, (cx - bx[k]) * 0.16, -82);
        K.txt(ctx, m, 0, 10, { f: 'serif', s: 30, w: 700, i: true, c: C.ink, a: 'center' });
      });
    });
  };

  // 11.2 Three cards, three different checks — and a round number with no report behind it is none of them
  SC['L11.2'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, xs = [792, 1191, 1590], top = 298, cw = 380, ch = 336;
    S.noteTo = [1190, 420];
    L.cards.forEach(([title, desc, gap, cap], k) => {
      const t0 = 0.4 + k * 1.2, p = S.pop(t0, 0.5); if (p <= 0) return;
      const x = xs[k];
      grow(ctx, x, top + ch / 2, p, () => {
        ctx.translate(0, -ch / 2);
        K.box(ctx, -cw / 2, 0, cw, ch, { r: 18, fill: C.card, stroke: C.ink, lw: 4 });
        // icon
        if (k === 0) {
          I.calendar(ctx, -38, 64, 86, { label: 'MONTHS', big: '12' });
          I.doc(ctx, 42, 68, 88, {});
          ctx.save(); ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 18; i++) { const u = i / 18; ctx.lineTo(20 + u * 42, 100 + Math.sin(u * 15) * 5 - u * 4); } ctx.stroke(); ctx.restore();
          ctx.beginPath(); ctx.arc(66, 104, 12, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
        } else if (k === 1) {
          ctx.save(); ctx.rotate(-0.06);
          K.box(ctx, -52, 14, 104, 112, { r: 6, fill: C.card, stroke: C.ink, lw: 4 });
          K.box(ctx, -42, 24, 84, 70, { r: 3, fill: '#2C4A5A', stroke: null });
          for (let i = 0; i < 3; i++) K.coin(ctx, -16 + i * 16, 74 - i * 9, 11, { mark: false });
          K.txt(ctx, '31 MAR', 0, 116, { f: 'hand', s: 22, w: 700, c: C.ink, a: 'center' });
          ctx.restore();
          const fl = K.clamp(1 - Math.abs(S.since(t0 + 0.15)) / 0.12);
          if (fl > 0) { ctx.save(); K.rr(ctx, -cw / 2 + 3, 3, cw - 6, ch - 6, 16); ctx.clip(); ctx.globalAlpha = fl; ctx.fillStyle = '#FFFBEA'; ctx.beginPath(); ctx.arc(0, 70, 120, 0, 7); ctx.fill(); ctx.restore(); }
        } else {
          K.box(ctx, -62, 18, 124, 92, { r: 10, fill: '#22303A', stroke: C.ink, lw: 4 });
          K.box(ctx, -14, 110, 28, 14, { r: 2, fill: C.ink2, stroke: null });
          const live = 0.5 + 0.5 * Math.sin(t * 9);
          ctx.beginPath(); ctx.arc(-44, 34, 6, 0, 7); ctx.fillStyle = `rgba(255,70,70,${0.4 + 0.6 * live})`; ctx.fill();
          K.txt(ctx, 'LIVE', -32, 39, { f: 'mono', s: 12, w: 700, c: '#FFFFFF' });
          const hgt = 44 + Math.sin(t * 2.3) * 3;
          ctx.fillStyle = C.gold; ctx.fillRect(-30, 100 - hgt, 22, hgt); ctx.fillStyle = C.orange; ctx.fillRect(8, 100 - hgt, 22, hgt);
          K.txt(ctx, '=', 0, 86, { f: 'display', s: 22, w: 900, c: '#FFFFFF', a: 'center' });
        }
        label(ctx, title, 0, 166, { s: title.length > 12 ? 19 : 22, ls: 2 });
        const dl = balance(ctx, desc, cw - 36, { f: 'mono', s: 17, w: 600, ls: 0 });
        dl.forEach((ln, i) => aside(ctx, ln, 0, 198 + i * 23, { s: 17, ls: 0, c: C.ink }));
        const gl = balance(ctx, '⚠ ' + gap, cw - 36, { f: 'mono', s: 17, w: 600, ls: 0 });
        gl.forEach((ln, i) => aside(ctx, ln, 0, 268 + i * 23, { s: 17, ls: 0, c: C.red }));
      });
      K.txt(ctx, cap, x, top + ch + 46, { f: 'hand', s: 40, w: 700, c: C.orange, a: 'center', alpha: S.at(t0 + 0.5, 0.4) });
    });
    // the round number with no report: none of the above
    const bz = S.pop(4.6, 0.4), sh = K.shake(t, 4.6 * S.b, 7, 0.35, 5);
    if (bz > 0) {
      grow(ctx, 760 + sh.x, 748 + sh.y, bz, () => {
        ctx.rotate(-0.06);
        K.box(ctx, -104, -32, 208, 64, { r: 8, fill: C.neonYellow, stroke: C.ink, lw: 4 });
        K.txt(ctx, '$500M', 0, 15, { f: 'display', s: 40, w: 900, i: true, st: 'expanded', c: C.ink, a: 'center' });
      });
      const rest = L.round.replace(/^a round \$500M\s*/, '');
      label(ctx, rest, 892, 758, { a: 'left', s: 19, ls: 1.5, c: C.red, alpha: S.at(4.7, 0.3) });
    }
  };

  // 11.3 The control panel, the one admin key, and the brakes: a multisig guard and a timelock
  SC['L11.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, px0 = 820, px1 = 1716, py0 = 366, py1 = 710, bx = [968, 1268, 1568], by = 492, mx = (px0 + px1) / 2;
    S.noteTo = [668, 430];
    grow(ctx, (px0 + px1) / 2, (py0 + py1) / 2, S.pop(0.05, 0.45), () => {
      ctx.translate(-(px0 + px1) / 2, -(py0 + py1) / 2);
      K.box(ctx, px0, py0, px1 - px0, py1 - py0, { r: 24, fill: '#D3CCBF', stroke: C.ink, lw: 5 });
      for (const [x, y] of [[px0 + 20, py0 + 20], [px1 - 20, py0 + 20], [px0 + 20, py1 - 20], [px1 - 20, py1 - 20]]) { ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = '#8E877B'; ctx.fill(); }
      K.txt(ctx, 'TOKEN CONTRACT · ADMIN', px0 + 42, py1 - 20, { f: 'mono', s: 14, w: 700, c: C.ink3, ls: 3 });
    });
    const cols = [C.green, C.blue, C.violet];
    L.btns.forEach(([name, cap], k) => {
      const t0 = 0.3 + k * 0.5, p = S.pop(t0, 0.45); if (p <= 0) return;
      const x = bx[k], press = K.clamp(1 - Math.abs(S.since(t0 + 0.35)) / 0.12) * 6;
      grow(ctx, x, by, p, () => {
        ctx.lineWidth = 4; ctx.strokeStyle = C.ink;
        ctx.beginPath(); ctx.ellipse(0, 26, 74, 26, 0, 0, 7); ctx.fillStyle = '#5A544B'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 10 + press, 62, 22, 0, 0, Math.PI); ctx.lineTo(-62, -12 + press); ctx.ellipse(0, -12 + press, 62, 22, 0, Math.PI, 0, true); ctx.closePath();
        ctx.fillStyle = K.shade(cols[k], -0.3); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -12 + press, 62, 22, 0, 0, 7); ctx.fillStyle = cols[k]; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-18, -18 + press, 20, 6, -0.2, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
      });
      label(ctx, name, x, by - 58, { s: 24, ls: 3, alpha: K.clamp(p) });
      const lines = cap.includes(' — ') ? cap.split(' — ') : cap.includes(', ') ? [cap.split(', ')[0] + ',', cap.split(', ')[1]] : balance(ctx, cap, 270, { f: 'mono', s: 17, w: 600, ls: 0 });
      lines.forEach((ln, i) => aside(ctx, ln, x, by + 124 + i * 23, { s: 17, ls: 0, c: C.ink, alpha: S.at(t0 + 0.2, 0.4) }));
    });
    // the one admin key, hanging on a hook, with its tag
    const kp = S.pop(1.7, 0.45), hx = 668, hy = 348;
    if (kp > 0) {
      const ks = S.since(2.2), sw = (ks > 0 ? Math.sin(ks * 11) * 0.45 * Math.exp(-ks * 1.6) : 0) + Math.sin(t * 1.7) * 0.03;
      const tipX = hx - Math.sin(sw) * 150, tipY = hy + Math.cos(sw) * 150;
      fade(ctx, K.clamp(kp), () => {
        K.line(ctx, tipX, tipY, hx, 540, { lw: 2.5, c: C.ink2 });
        K.box(ctx, hx - 18, hy - 14, 36, 20, { r: 4, fill: '#8E877B', stroke: C.ink, lw: 3 });
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(sw);
        ctx.beginPath(); ctx.arc(0, 18, 16, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = '#8E877B'; ctx.stroke();
        I.key(ctx, 0, 92, 120, { rot: Math.PI / 2 });
        ctx.restore();
      });
      const [k1, k2] = L.key.split(' (');
      grow(ctx, hx, 584, kp, () => {
        ctx.rotate(0.05);
        K.box(ctx, -98, -42, 196, 84, { r: 10, fill: C.card, stroke: C.ink, lw: 4 });
        ctx.beginPath(); ctx.arc(0, -28, 5, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
        K.txt(ctx, k1, 0, 2, { f: 'mono', s: 19, w: 700, c: C.ink, a: 'center' });
        K.txt(ctx, '(' + k2, 0, 28, { f: 'mono', s: 17, w: 700, c: C.red, a: 'center' });
      });
    }
    // brake 1: MULTISIG 3 of 5 — a hinged guard slams down over all three buttons
    const g = S.at(3.35, 0.25, E.inCubic), gx0 = px0 + 26, gx1 = px1 - 26, gy0 = 402, gy1 = 562;
    if (g > 0) {
      const gh = (gy1 - gy0) * g;
      ctx.save();
      K.rr(ctx, gx0, gy0, gx1 - gx0, gh, 18); ctx.fillStyle = 'rgba(143,211,255,.32)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.globalAlpha = 0.55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx0 + 22, gy0 + gh * 0.86); ctx.lineTo(gx0 + 58, gy0 + gh * 0.3); ctx.moveTo(gx0 + 46, gy0 + gh * 0.86); ctx.lineTo(gx0 + 70, gy0 + gh * 0.48); ctx.stroke();
      ctx.restore();
      const w = 336, ty = gy0 - 30, pl = S.pop(3.56, 0.4);
      grow(ctx, mx, ty, pl, () => {
        for (const sx of [-120, 120]) K.line(ctx, sx, 10, sx, gy0 - ty + 6, { lw: 6, c: C.ink });
        K.box(ctx, -w / 2, -24, w, 48, { r: 10, fill: C.orange, stroke: C.ink, lw: 4 });
        K.txt(ctx, L.brakes[0], -40, 8, { f: 'mono', s: 20, w: 700, c: C.card, a: 'center', ls: 2 });
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(84 + i * 15, 0, 5.5, 0, 7); ctx.fillStyle = i < 3 ? C.card : 'rgba(255,255,255,.35)'; ctx.fill(); }
      });
    }
    // brake 2: TIMELOCK 48h — a clock lock clamps the guard shut
    const tl = S.lin(3.78, 0.22);
    if (tl > 0) {
      const s = K.lerp(1.7, 1, E.outCubic(tl));
      grow(ctx, mx, gy1 + 4, s, () => {
        K.box(ctx, -150, -27, 300, 54, { r: 12, fill: C.ink, stroke: C.ink, lw: 4 });
        I.clock(ctx, -112, 0, 38, { h: 2, m: 0 });
        K.txt(ctx, L.brakes[1], 16, 8, { f: 'mono', s: 20, w: 700, c: C.card, a: 'center', ls: 2 });
      });
    }
  };

  // 11.4 The trust chain: every link is someone. The custodian link cracks and snaps; the token stays onchain, its value drains out
  SC['L11.4'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t, cy = 500, xs = [784, 962, 1140, 1318, 1496], yx = 606, tx = 642, ax = 1716;
    S.noteTo = [640, 418];
    const crack = S.at(3.0, 0.3), snap = S.at(3.4, 0.55, E.outCubic), sh = K.shake(t, 3.0 * S.b, 5, 0.3, 2);
    // after the snap the two halves of the chain sag from their anchors (your token, the asset)
    const piv = { L: [tx + 30, cy], R: [ax - 50, cy] }, rot = { L: 0.06 * snap, R: -0.07 * snap };
    const inSeg = (side, fn) => {
      ctx.save();
      if (snap > 0 && piv[side]) { ctx.translate(piv[side][0], piv[side][1]); ctx.rotate(rot[side]); ctx.translate(-piv[side][0], -piv[side][1]); }
      fn(); ctx.restore();
    };
    const STEEL = '#B9B4A8', HURT = '#E3A79C';
    const ring = (x, y, p, c) => grow(ctx, x, y, p, () => {
      ctx.beginPath(); ctx.ellipse(0, 0, 76, 40, 0, 0, 7); ctx.lineWidth = 24; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.lineWidth = 14; ctx.strokeStyle = c; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -5, 68, 30, 0, Math.PI * 1.15, Math.PI * 1.6); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
    });
    const conn = (x, p) => grow(ctx, x, cy, p, () => { ctx.beginPath(); ctx.ellipse(0, 0, 13, 32, 0, 0, 7); ctx.lineWidth = 18; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#8E877B'; ctx.stroke(); });
    // THE ASSET anchors the far end
    const ap = S.pop(2.1, 0.45);
    if (ap > 0) K.line(ctx, ax - 92, cy, ax - 44, cy, { lw: 10, c: C.ink });
    grow(ctx, ax, cy - 4, ap, () => I.building(ctx, 0, 0, 160));
    label(ctx, L.asset, ax, cy + 104, { s: 18, alpha: S.at(2.15, 0.3) });
    // the links
    const pops = xs.map((_, k) => S.pop(0.3 + k * 0.4, 0.45));
    inSeg('L', () => conn(xs[0] - 90, pops[0]));
    for (let k = 0; k < 4; k++) inSeg(k < 1 ? 'L' : 'R', () => conn((xs[k] + xs[k + 1]) / 2, pops[k + 1]));
    inSeg('R', () => conn(xs[4] + 92, ap));
    const rp = (side, x, y) => { // where a point of a sagging segment ends up (labels stay upright)
      if (snap <= 0 || !piv[side]) return [x, y];
      const [px, py] = piv[side], a = rot[side], dx = x - px, dy = y - py;
      return [px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a)];
    };
    xs.forEach((x, k) => {
      if (k === 1 && snap > 0) return;
      const side = k < 1 ? 'L' : k > 1 ? 'R' : 'N';
      inSeg(side, () => ring(x + (k === 1 ? sh.x : 0), cy + (k === 1 ? sh.y : 0), pops[k], k === 1 && crack > 0 ? HURT : STEEL));
      const [lx, ly] = rp(side, x, cy + 92);
      label(ctx, L.links[k], lx, ly, { s: 16, ls: 1.5, c: k === 1 && crack > 0 ? C.red : C.ink, alpha: K.clamp(pops[k]) });
    });
    // crack lines on the custodian link
    if (crack > 0 && snap <= 0) {
      ctx.save(); ctx.translate(xs[1] + sh.x, cy + sh.y); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(12, -50); ctx.lineTo(2, -50 + 22 * crack); ctx.lineTo(14, -50 + 36 * crack); ctx.moveTo(-8, 50); ctx.lineTo(4, 50 - 22 * crack); ctx.lineTo(-8, 50 - 36 * crack); ctx.stroke(); ctx.restore();
    }
    // after the snap: the custodian link as two halves, flying apart
    if (snap > 0) {
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(xs[1] + sd * (6 + snap * 24), cy + snap * 26); ctx.rotate(sd * snap * 0.45);
        ctx.beginPath(); ctx.ellipse(0, 0, 76, 40, 0, sd < 0 ? Math.PI * 0.62 : -Math.PI * 0.38, sd < 0 ? Math.PI * 1.38 : Math.PI * 0.38);
        ctx.lineCap = 'butt'; ctx.lineWidth = 24; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = HURT; ctx.stroke();
        ctx.restore();
      }
      label(ctx, L.links[1], xs[1], cy + 112, { s: 16, ls: 1.5, c: C.red });
      if (snap < 1) { ctx.save(); ctx.globalAlpha = 1 - snap; ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3, r0 = 34 + snap * 40, r1 = 54 + snap * 84; ctx.beginPath(); ctx.moveTo(xs[1] + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6); ctx.lineTo(xs[1] + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6); ctx.stroke(); } ctx.restore(); }
    }
    // why it broke
    const words = L.break.split(' '), b1 = words[0], b2 = words.slice(1).join(' ');
    fade(ctx, S.at(3.05, 0.35), () => {
      const w1 = K.measure(ctx, b1 + ' ', { f: 'mono', s: 19, w: 700, ls: 2 }), w2 = K.measure(ctx, b2, { f: 'mono', s: 19, w: 600, ls: 1 }), x0 = xs[1] + 60 - (w1 + w2) / 2;
      label(ctx, b1, x0, 412, { a: 'left', s: 19, ls: 2, c: C.red });
      aside(ctx, b2, x0 + w1, 412, { a: 'left', s: 19, c: C.red });
    });
    // YOU, holding the token at the near end. It stays onchain; the value drains out of it.
    const yp = S.pop(0.05, 0.45), drain = S.at(3.6, 1.0, E.inOutCubic), lv = 1 - drain * 0.94;
    grow(ctx, yx, cy + 8, yp, () => I.person(ctx, 0, 0, 140, { fill: C.teal }));
    label(ctx, L.you, yx - 8, cy + 104, { s: 18, c: C.ink, alpha: S.at(0.1, 0.3) });
    grow(ctx, tx, cy + 14, yp, () => {
      K.coin(ctx, 0, 0, 40, { fill: '#C9C2B6', markC: '#EDE8DF' });
      ctx.save(); ctx.beginPath(); ctx.rect(-50, 46 - 92 * lv, 100, 100); ctx.clip(); K.coin(ctx, 0, 0, 40, {}); ctx.restore();
      if (drain > 0 && drain < 1) for (let i = 0; i < 3; i++) { const u = (S.since(3.6) * 1.8 + i / 3) % 1; ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI); ctx.beginPath(); ctx.arc(6 + i * 9, 44 + u * 46, 5 - u * 2, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.restore(); }
    });
    // the chip that never changes
    grow(ctx, tx, 418, S.pop(2.5, 0.45), () => K.chip(ctx, 'ONCHAIN ✓', 0, 0, { s: 18, w: 700, fill: C.green, c: C.card, a: 'center', ls: 2 }));
    // the verdict
    const [s1, s2] = L.still.split(' · '), va = S.at(4.4, 0.4), o1 = { f: 'mono', s: 23, w: 700, ls: 2 };
    const w1 = K.measure(ctx, s1 + '  ·  ', o1), w2 = K.measure(ctx, s2, o1), vx = 1190 - (w1 + w2) / 2;
    label(ctx, s1 + '  ·', vx, 722, { a: 'left', s: 23, ls: 2, c: C.green, alpha: va });
    label(ctx, s2, vx + w1, 722, { a: 'left', s: 23, ls: 2, c: C.red, alpha: va });
  };
})();
