/* ch05.js — Yield & Returns. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const bump = (S, b, d = 0.3) => { const u = (S.bt - b) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
  const back = (S, b, d) => (S.bt <= b ? 0 : S.at(b, d, E.outBack));
  // jaw with teeth along its bottom edge (x centre, yBottom = tip of the teeth)
  function jaw(ctx, x, yb, w, h, o = {}) {
    const n = 5, tw = w / n, th = 14;
    ctx.beginPath(); ctx.moveTo(x - w / 2, yb - h); ctx.lineTo(x + w / 2, yb - h); ctx.lineTo(x + w / 2, yb - th);
    for (let i = n; i > 0; i--) { ctx.lineTo(x - w / 2 + (i - 0.5) * tw, yb); ctx.lineTo(x - w / 2 + (i - 1) * tw, yb - th); }
    ctx.closePath(); ctx.fillStyle = o.fill || C.card; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    if (o.eyes) for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * w * 0.2, yb - h * 0.55, 6.5, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.beginPath(); ctx.moveTo(x + s * w * 0.32, yb - h * 0.8); ctx.lineTo(x + s * w * 0.08, yb - h * 0.7); ctx.lineWidth = 3.5; ctx.stroke(); }
  }

  // 5.1 Advertised vs realized — the billboard number walks to your wallet through five jaws
  SC['L5.1'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [740, 420];
    const base = 612, k = 10, x0 = 872, xw = 1648;
    const vals = [18, 15.0, 13.4, 12.1, 10.6, 6.1], gates = [992, 1124, 1256, 1388, 1520], cues = [1.2, 1.6, 2.0, 2.4, 2.8];
    // billboard with chasing bulbs
    const bp = S.pop(0.05, 0.45), lit = S.bt >= 0.3;
    if (bp > 0) {
      ctx.save(); ctx.translate(730, 420); ctx.scale(bp, bp);
      for (const px of [-70, 70]) K.box(ctx, px - 8, 80, 16, base - 420 - 80 + 4, { r: 3, fill: '#8E877B', stroke: C.ink, lw: 3.5 });
      K.box(ctx, -136, -104, 272, 190, { r: 14, fill: '#2A1E12', stroke: C.ink, lw: 5 });
      const nb = 22;
      for (let i = 0; i < nb; i++) {
        const u = i / nb, per = 2 * (272 + 190), d = u * per; let bx, by;
        if (d < 272) { bx = -136 + d; by = -104; } else if (d < 272 + 190) { bx = 136; by = -104 + (d - 272); } else if (d < 544 + 190) { bx = 136 - (d - 462); by = 86; } else { bx = -136; by = 86 - (d - 734); }
        const on = lit && ((i + Math.floor(t * 8)) % 3 !== 0);
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fillStyle = on ? C.neonYellow : '#6B5B3E'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      }
      K.txt(ctx, 'APY', 0, -44, { f: 'mono', s: 24, w: 700, c: lit ? C.neonYellow : '#8B7B5E', a: 'center', ls: 6 });
      ctx.save(); const fl = lit ? 1 + bump(S, 0.3, 0.3) * 0.12 : 1; ctx.scale(fl, fl);
      if (lit) { ctx.shadowColor = C.orange; ctx.shadowBlur = 18; }
      K.txt(ctx, L.ad + '!', 0, 50, { f: 'display', s: 96, w: 900, st: 'condensed', c: lit ? C.orange : '#8B6B4E', a: 'center' });
      ctx.restore();
      ctx.restore();
    }
    // the yield bar: flows from the billboard toward the wallet, a jaw bites at each gate
    const keys = [[0.5, x0], [1.2, gates[0]], [1.6, gates[1]], [2.0, gates[2]], [2.4, gates[3]], [2.8, gates[4]], [3.2, xw]];
    let front = x0; for (let i = 1; i < keys.length; i++) { if (S.bt >= keys[i - 1][0]) front = K.lerp(keys[i - 1][1], keys[i][1], K.clamp((S.bt - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]))); }
    if (S.bt > 0.5) {
      // one polygon: flat tops, and after every gate a row of tooth notches where the jaw bit
      const edges = [x0].concat(gates, [xw]), zw = 56, nt = 4;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, base - vals[0] * k);
      let endX = x0;
      for (let i = 0; i < 6; i++) {
        const a = edges[i], b = Math.min(edges[i + 1], front); if (b <= a) break;
        const h = vals[i] * k;
        if (i === 0) ctx.lineTo(b, base - h);
        else {
          ctx.lineTo(a, base - h);
          for (let j = 0; j < nt; j++) { const xa = a + (j + 0.5) * zw / nt, xb = a + (j + 1) * zw / nt; if (xa > b) break; ctx.lineTo(xa, base - h + 11); ctx.lineTo(Math.min(xb, b), base - h); }
          ctx.lineTo(Math.max(b, a), base - h);
        }
        endX = b;
      }
      ctx.lineTo(endX, base); ctx.closePath();
      ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      K.txt(ctx, L.ad, x0 + 58, base - 18, { f: 'display', s: 40, w: 900, st: 'condensed', c: C.card, a: 'center', alpha: S.at(0.7, 0.3) });
    }
    // jaws + labels + flying crumbs
    gates.forEach((g0, i) => {
      const gx = g0 + 28, c = cues[i], ap = S.pop(0.8 + i * 0.08, 0.4); if (ap <= 0) return;
      const hp = vals[i] * k, h = vals[i + 1] * k, rest = base - hp - 26, down = base - h;
      const dn = S.bt < c ? 0 : S.bt < c + 0.1 ? E.inCubic(K.clamp((S.bt - c) / 0.1)) : 1 - E.outCubic(K.clamp((S.bt - c - 0.1) / 0.35));
      const yb = K.lerp(rest, down + 4, dn);
      ctx.save(); ctx.globalAlpha = K.clamp(ap);
      K.line(ctx, gx, 300, gx, yb - 44, { lw: 4, c: C.ink3 });
      jaw(ctx, gx, yb, 74, 46, { fill: '#F7EEE4', eyes: true });
      ctx.restore();
      const lp = S.at(c, 0.3);
      if (lp > 0) {
        const words = L.cuts[i].split(' '), lines = words.length > 1 && K.measure(ctx, L.cuts[i], { f: 'mono', s: 18, w: 700 }) > 118 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [L.cuts[i]];
        lines.forEach((l, j) => K.txt(ctx, l, gx, base + 36 + j * 23, { f: 'mono', s: 18, w: 700, c: C.ink, a: 'center', ls: 0.5, alpha: lp }));
        K.txt(ctx, '−' + (vals[i] - vals[i + 1]).toFixed(1), gx, base + 36 + lines.length * 23 + 4, { f: 'mono', s: 17, w: 700, c: C.red, a: 'center', alpha: lp });
      }
      const cr = S.lin(c + 0.05, 0.6);
      if (cr > 0 && cr < 1) {
        const r = K.rand(i + 3);
        for (let j = 0; j < 5; j++) { const vx = (r() - 0.3) * 160, vy = -120 - r() * 120, tt = cr * 0.7; ctx.save(); ctx.globalAlpha = 1 - cr; ctx.translate(gx + 10 + vx * tt, base - hp + 10 + vy * tt + 500 * tt * tt); ctx.rotate(cr * 6 + j); ctx.fillStyle = C.orange; ctx.fillRect(-7, -6, 14, 12); ctx.restore(); }
      }
    });
    // the wallet receives what's left
    const wp = S.pop(0.6, 0.4);
    if (wp > 0) { ctx.save(); ctx.translate(1718, base - 34); ctx.scale(wp, wp); I.wallet(ctx, 0, 0, 118, {}); ctx.restore(); }
    const got = S.pop(3.2, 0.45);
    if (got > 0) {
      label(ctx, 'REALIZED', 1718, base - 186, { s: 18, c: C.ink2, ls: 4, alpha: K.clamp(got) });
      ctx.save(); ctx.translate(1718, base - 116); ctx.scale(got, got); K.txt(ctx, L.real, 0, 0, { f: 'display', s: 76, w: 900, st: 'condensed', c: C.green, a: 'center' }); ctx.restore();
      K.txt(ctx, L.illus, 1790, 776, { f: 'mono', s: 15, w: 600, c: C.ink3, a: 'right', ls: 1, alpha: S.at(3.4, 0.4) });
    }
  };

  // chain link drawn as a rounded ring at angle a
  function chainLine(ctx, x1, y1, x2, y2, n) {
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1), step = L / n;
    for (let i = 0; i < n; i++) {
      const cx = x1 + Math.cos(a) * step * (i + 0.5), cy = y1 + Math.sin(a) * step * (i + 0.5);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.lineWidth = 9; ctx.strokeStyle = C.ink; K.rr(ctx, -step * 0.62, i % 2 ? -7 : -11, step * 1.24, i % 2 ? 14 : 22, 9); ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#A8A196'; K.rr(ctx, -step * 0.62, i % 2 ? -7 : -11, step * 1.24, i % 2 ? 14 : 22, 9); ctx.stroke();
      ctx.restore();
    }
  }

  // 5.2 Lockups & redemption windows — one door is chained; the other only opens on its dates
  SC['L5.2'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [1600, 480];
    const [lName, lRest] = L.lock.split(' · '), [wName, wRest] = L.win.split(' · ');
    // LOCKUP: chained door, padlock snaps shut
    const dx = 800, dy = 488, dp = S.pop(0.05, 0.45);
    if (dp > 0) {
      const sh = K.shake(S.t, 0.3 * S.b, 6, 0.3, 2);
      ctx.save(); ctx.translate(dx + sh.x, dy); ctx.scale(dp, dp);
      I.door(ctx, 0, 0, 260, { open: 0 });
      chainLine(ctx, -84, -118, 84, 118, 9); chainLine(ctx, 84, -118, -84, 118, 9);
      const lk = S.at(0.3, 0.12, E.inCubic);
      I.padlock(ctx, 0, 6, 104, { open: 1 - lk });
      ctx.restore();
      label(ctx, lName, dx, dy + 190, { s: 24, ls: 5, alpha: K.clamp(dp) });
      label(ctx, lRest, dx, dy + 222, { s: 18, w: 600, ls: 1, c: C.red, alpha: K.clamp(dp) });
    }
    // REDEMPTION WINDOW: a hatch with a calendar
    const hx = 1338, hy = 470, hp = S.pop(0.6, 0.45);
    if (hp > 0) {
      ctx.save(); ctx.translate(hx, hy); ctx.scale(hp, hp);
      K.box(ctx, -150, -150, 300, 300, { r: 10, fill: '#E9E1D2', stroke: C.ink, lw: 4 });
      // brick hint
      ctx.save(); K.rr(ctx, -150, -150, 300, 300, 10); ctx.clip(); ctx.strokeStyle = 'rgba(32,26,19,.10)'; ctx.lineWidth = 2;
      for (let r = 0; r < 10; r++) { const yy = -150 + r * 32; ctx.beginPath(); ctx.moveTo(-150, yy); ctx.lineTo(150, yy); ctx.stroke(); for (let c = 0; c < 6; c++) { const xx = -150 + c * 60 + (r % 2) * 30; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 32); ctx.stroke(); } }
      ctx.restore();
      K.box(ctx, -100, -116, 200, 34, { r: 6, fill: C.ink, stroke: C.ink, lw: 3 });
      K.txt(ctx, 'REDEMPTIONS', 0, -93, { f: 'mono', s: 15, w: 700, c: C.card, a: 'center', ls: 3 });
      // the hatch
      const op = S.at(3.0, 0.4, E.outBack);
      K.box(ctx, -96, -66, 192, 140, { r: 6, fill: '#3A332C', stroke: C.ink, lw: 4 });
      if (op > 0) { ctx.save(); ctx.globalAlpha = K.clamp(op); I.cash(ctx, 0, 6, 70, {}); ctx.restore(); }
      for (const s of [-1, 1]) {
        const w = 96 * (1 - 0.85 * K.clamp(op));
        ctx.save(); ctx.translate(s * 96, 0); ctx.scale(-s, 1);
        K.box(ctx, 0, -66, w, 140, { r: 4, fill: '#B07A4A', stroke: C.ink, lw: 4 });
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(32,26,19,.45)'; for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(0, -66 + j * 35); ctx.lineTo(w, -66 + j * 35); ctx.stroke(); }
        ctx.restore();
      }
      // request slot
      K.box(ctx, -60, 96, 120, 14, { r: 4, fill: C.ink, stroke: null });
      ctx.restore();
      label(ctx, wName, hx, dy + 190, { s: 24, ls: 5, alpha: K.clamp(hp) });
      label(ctx, wRest, hx, dy + 222, { s: 18, w: 600, ls: 1, c: C.ink2, alpha: K.clamp(hp) });
    }
    // the request slip goes in today
    const sp = S.pop(1.2, 0.4);
    if (sp > 0) {
      const ins = S.at(1.55, 0.4, E.inOutCubic), slotY = hy + 103;
      ctx.save(); ctx.beginPath(); ctx.rect(hx - 200, 250, 400, slotY - 250); ctx.clip();
      ctx.save(); ctx.translate(hx, slotY - 70 + ins * 110); ctx.rotate(-0.05 * (1 - ins)); ctx.scale(sp, sp);
      K.box(ctx, -52, -40, 104, 78, { r: 5, fill: C.card, stroke: C.ink, lw: 3.5 });
      K.txt(ctx, 'EXIT', 0, -12, { f: 'mono', s: 15, w: 700, c: C.ink, a: 'center', ls: 2 });
      K.txt(ctx, 'REQUEST', 0, 6, { f: 'mono', s: 15, w: 700, c: C.ink, a: 'center', ls: 2 });
      K.txt(ctx, 'today', 0, 28, { f: 'hand', s: 22, w: 700, c: C.orange2, a: 'center' });
      ctx.restore(); ctx.restore();
    }
    // calendar flips weeks ahead
    const cp = S.pop(0.8, 0.45);
    if (cp > 0) {
      const dates = [['JAN', '2'], ['JAN', '16'], ['JAN', '30'], ['FEB', '13'], ['FEB', '27'], ['MAR', '13'], ['MAR', '27'], ['MAR', '31']];
      const fl = S.lin(2.4, 0.6), idx = Math.min(dates.length - 1, Math.floor(fl * dates.length)), sub = (fl * dates.length) % 1;
      const [m, d] = dates[S.bt < 2.4 ? 0 : idx];
      const cx = 1660, cy = 430;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(cp, cp);
      I.calendar(ctx, 0, 0, 150, { label: m, big: d, top: idx === dates.length - 1 ? C.green : C.red });
      // the page being torn off
      if (S.bt >= 2.4 && fl < 1) { ctx.save(); ctx.globalAlpha = 1 - sub; ctx.translate(0, -sub * 60); ctx.rotate(-sub * 0.6); K.box(ctx, -60, -26, 120, 92, { r: 6, fill: C.card, stroke: C.ink, lw: 3 }); ctx.restore(); }
      ctx.restore();
      const done = S.bt >= 3.0;
      label(ctx, done ? 'next window' : 'today', cx, cy + 108, { s: 17, c: done ? C.green : C.ink2, ls: 2, alpha: K.clamp(cp) });
    }
    // how often windows open
    const fp = S.at(3.6, 0.4);
    if (fp > 0) {
      const y1 = dy + 262;
      K.txt(ctx, '● ' + L.fast, 1110, y1, { f: 'mono', s: 17, w: 600, c: C.green, alpha: fp });
      K.txt(ctx, '● ' + L.slow, 1110, y1 + 26, { f: 'mono', s: 17, w: 600, c: C.orange2, alpha: fp });
    }
  };

  // 5.3 Waterfall & tranching — cash fills senior first; losses hit junior first
  SC['L5.3'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [1455, 640];
    const B = [{ x: 975, y: 444 }, { x: 1215, y: 556 }, { x: 1455, y: 668 }], bs = 150, bh = bs * 0.62, wt = bs * 1.1;
    const fillAt = [[0.5, 1.4], [1.45, 2.0], [2.05, 2.6]], dings = [1.4, 2.0, 2.6];
    const cash = '#7DC48E';
    // the pool
    const pp = S.pop(0.15, 0.45);
    const drain = S.at(0.4, 2.8, E.inOutSine);
    if (pp > 0) {
      ctx.save(); ctx.translate(762, 338); ctx.scale(pp, pp);
      K.box(ctx, -112, -36, 224, 74, { r: 12, fill: C.card, stroke: C.ink, lw: 4.5 });
      ctx.save(); K.rr(ctx, -112, -36, 224, 74, 12); ctx.clip(); ctx.fillStyle = cash; const lv = 60 * (1 - drain * 0.7); ctx.fillRect(-112, 38 - lv, 224, lv); ctx.restore();
      K.rr(ctx, -112, -36, 224, 74, 12); ctx.lineWidth = 4.5; ctx.strokeStyle = C.ink; ctx.stroke();
      K.txt(ctx, L.pool, 0, 8, { f: 'mono', s: 19, w: 700, c: C.ink, a: 'center', ls: 3 });
      ctx.restore();
    }
    // streams (tank -> senior, overflow -> mezz, overflow -> junior), taper off once the pool is spent
    const stop = 1 - S.at(2.9, 0.5);
    const stream = (x1, y1, x2, y2, start) => {
      const on = S.at(start, 0.25) * stop; if (on <= 0) return;
      ctx.save(); ctx.lineCap = 'round';
      const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20 * S.at(start, 0.25), cx = x1 + 40, cy = y1; pts.push([(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2]); }
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineWidth = 18 * on + 4; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.lineWidth = 18 * on; ctx.strokeStyle = cash; ctx.stroke();
      // a few $ riding the stream
      for (let j = 0; j < 2; j++) { const u = ((t * 1.3 + j * 0.5) % 1) * S.at(start, 0.25); const q = pts[Math.min(20, Math.round(u * 20))]; K.txt(ctx, '$', q[0], q[1] + 7, { f: 'display', s: 20, w: 900, c: '#1F5F33', a: 'center', alpha: on }); }
      ctx.restore();
    };
    stream(874, 360, B[0].x - 20, B[0].y - bh / 2 + 8, 0.4);
    stream(B[0].x + wt / 2 - 6, B[0].y - bh / 2, B[1].x - 30, B[1].y - bh / 2 + 8, 1.4);
    stream(B[1].x + wt / 2 - 6, B[1].y - bh / 2, B[2].x - 30, B[2].y - bh / 2 + 8, 2.0);
    // losses: a pile of red rocks; rumble, then two of them smash upward
    const rp = S.pop(3.0, 0.45), rum = S.bt > 3.3 && S.bt < 3.9 ? Math.sin(t * 60) * 3 : 0;
    const hit1 = S.at(3.75, 0.15, E.inCubic), hit2 = S.at(4.25, 0.15, E.inCubic);
    const crack = [0, S.at(4.4, 0.2), S.at(3.9, 0.2)];
    // buckets
    B.forEach((b, i) => {
      const p = S.pop(0.2 + i * 0.1, 0.45); if (p <= 0) return;
      const fill = S.at(fillAt[i][0], fillAt[i][1] - fillAt[i][0], E.inOutSine);
      const leak = i === 2 ? S.at(3.95, 0.8) * 0.62 : i === 1 ? S.at(4.45, 0.8) * 0.4 : 0;
      ctx.save(); ctx.translate(b.x + (i ? rum * 0.3 : 0), b.y); ctx.scale(p, p);
      I.bucket(ctx, 0, 0, bs, { level: fill * 0.92 - leak, liquid: cash, cracked: crack[i] });
      ctx.restore();
      if (crack[i] > 0) { const d = (t * 1.4 + i) % 1; ctx.beginPath(); ctx.ellipse(b.x + 4, b.y + bh / 2 + 10 + d * 40, 5, 8, 0, 0, 7); ctx.fillStyle = `rgba(125,196,142,${(1 - d) * K.clamp(leak * 3)})`; ctx.fill(); }
      // tranche name (left of the bucket; junior's goes right) + rate on the ding
      const right = i === 2, lx = right ? b.x + wt / 2 + 22 : b.x - wt / 2 - 18, a = right ? 'left' : 'right';
      K.txt(ctx, L.tr[i][0], lx, b.y - 2, { f: 'mono', s: 22, w: 700, c: C.ink, a, ls: 3, alpha: K.clamp(p) });
      const rpop = S.pop(dings[i], 0.4);
      if (rpop > 0) { ctx.save(); ctx.translate(lx + (right ? 36 : -36), b.y + 46); ctx.scale(rpop, rpop); K.txt(ctx, L.tr[i][1], 0, 0, { f: 'display', s: 50, w: 900, st: 'condensed', c: C.orange, a: 'center' }); ctx.restore(); }
    });
    if (rp > 0) {
      const rocks = [[1285, 772, 46, 0.2], [1341, 778, 40, 1.4], [1395, 770, 48, 2.6], [1241, 778, 34, 0.9], [1313, 742, 38, 2.0], [1369, 738, 34, 0.4]];
      ctx.save(); ctx.beginPath(); ctx.rect(560, 280, 1262, 520); ctx.clip();
      rocks.forEach(([x, y, s, r], j) => { ctx.save(); ctx.translate(x + (j % 2 ? rum : -rum), y + (1 - K.clamp(rp)) * 60); I.rock(ctx, 0, 0, s, { rot: r }); ctx.restore(); });
      ctx.restore();
      label(ctx, '▲ ' + L.loss, 1196, 788, { s: 20, c: C.red, ls: 3, a: 'right', alpha: K.clamp(rp) });
      // the two that fly up
      if (S.bt >= 3.75) { const x = K.lerp(1395, B[2].x + 8, hit1), y = K.lerp(744, B[2].y + bh / 2 + 6, hit1); I.rock(ctx, x, y, 40, { rot: 0.8 + hit1 }); }
      if (S.bt >= 4.25) { const x = K.lerp(1313, B[1].x + 8, hit2), y = K.lerp(720, B[1].y + bh / 2 + 6, hit2); I.rock(ctx, x, y, 44, { rot: 2.1 - hit2 }); }
    }
    // senior: untouched
    const sk = S.pop(4.9, 0.4);
    if (sk > 0) { ctx.save(); ctx.translate(B[0].x + wt / 2 + 32, B[0].y - 16); ctx.scale(sk, sk); ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fillStyle = C.green; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke(); K.check(ctx, 1, 2, 28, 1, C.card, 5); ctx.restore(); K.txt(ctx, 'untouched', B[0].x + wt / 2 + 62, B[0].y - 7, { f: 'hand', s: 30, w: 700, c: C.green, alpha: K.clamp(sk) }); }
  };

  // 5.4 Fee structures — the gross bar gets bitten seven times; nobody will say what's left
  SC['L5.4'] = (ctx, S) => {
    const L = S.sc.labels, t = S.t; S.noteTo = [960, 520];
    const bx = 760, bw = 168, top = 352, base = 764, H = base - top;
    const slices = [72, 56, 44, 34, 38, 28, 30], cues = [1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4];
    const eaten = cues.reduce((acc, c, i) => acc + (S.bt >= c ? slices[i] : 0), 0);
    const [g1, g2] = [L.gross.replace(/\s*[\d.]+%$/, ''), (L.gross.match(/[\d.]+%$/) || [''])[0]];
    const bp = S.pop(0.3, 0.45);
    if (bp > 0) {
      ctx.save(); ctx.translate(bx, base); ctx.scale(1, K.clamp(bp)); ctx.translate(-bx, -base);
      // ghost of the advertised bar
      ctx.save(); ctx.setLineDash([10, 8]); K.box(ctx, bx - bw / 2, top, bw, H, { r: 6, fill: 'rgba(255,98,0,.06)', stroke: C.ink3, lw: 3 }); ctx.restore();
      // what's left
      const h = H - eaten;
      K.box(ctx, bx - bw / 2, base - h, bw, h, { r: 6, fill: C.orange, stroke: C.ink, lw: 4.5 });
      // bite marks on the current top
      if (eaten > 0) { ctx.save(); for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(bx - bw / 2 + 21 + j * 42, base - h - 4, 15, 0, Math.PI); ctx.fillStyle = C.bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke(); } ctx.restore(); }
      ctx.restore();
      label(ctx, g1, bx, top - 52, { s: 18, ls: 2, alpha: K.clamp(bp) });
      K.txt(ctx, g2, bx, top - 12, { f: 'display', s: 40, w: 900, st: 'condensed', c: eaten > 0 ? C.ink3 : C.orange, a: 'center', alpha: K.clamp(bp) });
    }
    // the chomping teeth at the top of the bar
    cues.forEach((c, i) => {
      const u = S.lin(c - 0.08, 0.3); if (u <= 0 || u >= 1) return;
      const prev = H - cues.slice(0, i).reduce((a, _, j) => a + slices[j], 0), y = base - prev, cl = Math.sin(u * Math.PI);
      ctx.save(); ctx.globalAlpha = Math.min(1, Math.sin(u * Math.PI) * 2);
      jaw(ctx, bx, y - 20 + cl * (slices[i] + 10), bw + 30, 40, { fill: C.card });
      ctx.restore();
    });
    // each bite becomes a line on the receipt
    const lx = 892, ly0 = 360, lh = 52;
    L.fees.forEach((f, i) => {
      const c = cues[i], u = S.at(c, 0.35, E.inOutCubic); if (S.bt < c) return;
      const prev = H - cues.slice(0, i).reduce((a, _, j) => a + slices[j], 0);
      const sx = bx, sy = base - prev + slices[i] / 2, ex = lx, ey = ly0 + i * lh;
      if (u < 1) { const x = K.lerp(sx, ex + 20, u), y = K.lerp(sy, ey, u) - Math.sin(u * Math.PI) * 60; ctx.save(); ctx.translate(x, y); ctx.rotate(u * 2.2); ctx.fillStyle = C.orange; ctx.fillRect(-26, -slices[i] / 4, 52, slices[i] / 2); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.strokeRect(-26, -slices[i] / 4, 52, slices[i] / 2); ctx.restore(); }
      else { const p = back(S, c + 0.35, 0.35); ctx.save(); ctx.translate(ex, ey); ctx.scale(Math.max(0.01, p), Math.max(0.01, p)); K.chip(ctx, '− ' + f, 0, 0, { s: 18, fill: '#FBE3D6', c: C.orange2, stroke: C.orange, lw: 2.5, w: 700, ls: 1 }); ctx.restore(); }
    });
    // NET: ?
    const np = S.pop(3.8, 0.45);
    if (np > 0) {
      const h = H - eaten;
      ctx.save(); ctx.translate(bx, base - h / 2); ctx.scale(np, np);
      K.txt(ctx, L.net, 0, 14, { f: 'display', s: 42, w: 900, st: 'condensed', c: C.card, a: 'center' });
      ctx.restore();
    }
    // the line, then the stamp
    if (S.bt > 4.2) K.words(ctx, L.q1, 1262, 450, { f: 'serif', s: 36, w: 400, i: true, maxW: 400, lh: 46, t: S.since(4.2), per: 0.05, c: C.ink2 });
    const sp = S.lin(5.2, 0.28);
    if (sp > 0) K.stamp(ctx, L.q2, 1508, 616, { p: sp, s: 44, rot: -0.06, c: C.red });
  };
})();
