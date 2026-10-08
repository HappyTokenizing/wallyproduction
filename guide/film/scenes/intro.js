/* intro.js — I1..I4 (AD0 and SKIP0 are drawn by the engine from script data). */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;

  // The WALLY'S RWA TEXTBOOK cover (also used by the outro + end card). Centred at x,y; w = cover width.
  K.cover = (ctx, x, y, w, o = {}) => {
    const h = w * 1.3; ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
    // page block + shadow
    ctx.save(); ctx.shadowColor = 'rgba(40,28,10,.35)'; ctx.shadowBlur = w * 0.08; ctx.shadowOffsetY = w * 0.04;
    K.rr(ctx, -w / 2 + 8, -h / 2 + 6, w, h, 10); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#E8E1D2'; for (let k = 0; k < 5; k++) ctx.fillRect(w / 2 + 1, -h / 2 + 12 + k * 3, 6, h - 22);
    K.rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fillStyle = '#F3EEE3'; ctx.fill();
    const sp = ctx.createLinearGradient(-w / 2, 0, -w / 2 + w * 0.06, 0); sp.addColorStop(0, 'rgba(60,40,10,.22)'); sp.addColorStop(1, 'rgba(60,40,10,0)'); ctx.fillStyle = sp; ctx.fillRect(-w / 2, -h / 2, w * 0.06, h);
    K.rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(32,26,19,.25)'; ctx.stroke();
    const u = w / 460;
    K.txt(ctx, 'AN ONCHAIN EDUCATION SERIES', 0, -h / 2 + 52 * u, { f: 'mono', s: 15 * u, w: 600, c: C.ink2, a: 'center', ls: 4 * u });
    K.txt(ctx, "WALLY'S", 0, -h / 2 + 150 * u, { f: 'mono', s: 64 * u, w: 900, c: C.ink, a: 'center', ls: 1 });
    K.txt(ctx, 'RWA TEXTBOOK', 0, -h / 2 + 222 * u, { f: 'mono', s: K.fitSize(ctx, 'RWA TEXTBOOK', w * 0.86, { f: 'mono', s: 64 * u, w: 900 }), w: 900, c: C.orange, a: 'center' });
    window.WallyRig.draw(ctx, { x: 0, y: h / 2 - 118 * u, s: 0.43 * u, trunk: { bend: Math.sin((o.t || 0) * 1.3) * 0.05 } });
    ctx.fillStyle = 'rgba(32,26,19,.35)'; ctx.fillRect(-w * 0.38, h / 2 - 92 * u, w * 0.76, 1.5);
    K.rwafMark(ctx, -w * 0.31, h / 2 - 64 * u, 38 * u, C.ink);
    K.txt(ctx, 'SPONSORED BY RWA FOUNDATION', w * 0.04, h / 2 - 59 * u, { f: 'mono', s: 14 * u, w: 600, c: C.ink, a: 'center', ls: 1.5 * u });
    K.txt(ctx, '@wallycollection', 0, h / 2 - 26 * u, { f: 'mono', s: 14 * u, w: 600, c: C.ink2, a: 'center', ls: 2 * u });
    ctx.restore();
  };
  const noSign = (ctx, x, y, r, p) => { if (p <= 0) return; const s = K.lerp(1.8, 1, E.outCubic(K.clamp(p))); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = K.clamp(p * 3); ctx.lineWidth = r * 0.16; ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke(); ctx.restore(); };

  SC.I1 = (ctx, S) => {
    K.words(ctx, S.sc.text, 560, 300, { f: 'serif', s: 66, w: 700, maxW: 1240, lh: 80, t: S.since(0.15), per: 0.07 });
    const a = S.pop(1.3);
    if (a > 0) { ctx.save(); ctx.translate(900, 600); ctx.scale(a, a); I.chartUp(ctx, 0, 0, 230, { p: S.at(1.4, 1.0, E.inOutCubic) }); ctx.restore(); K.txt(ctx, 'a chart', 900, 790, { f: 'hand', s: 52, w: 700, c: C.ink2, a: 'center', alpha: S.at(1.7, 0.4) }); }
    K.txt(ctx, '+', 1110, 625, { f: 'display', s: 90, w: 900, c: C.ink3, a: 'center', alpha: S.at(2.2, 0.3) });
    const q = S.pop(2.6);
    if (q > 0) { ctx.save(); ctx.translate(1320, 600); ctx.scale(q, q); ctx.rotate(Math.sin(S.t * 3) * 0.06); K.txt(ctx, '🤞', 0, 0, { f: 'emoji', s: 190, a: 'center', b: 'middle' }); ctx.restore(); K.txt(ctx, 'a promise', 1320, 790, { f: 'hand', s: 52, w: 700, c: C.ink2, a: 'center', alpha: S.at(2.9, 0.4) }); }
    K.note(ctx, S.sc.note, 1500, 470, { p: S.lin(3.6, 1.0), s: 58, rot: -0.07, underline: true });
  };
  SC.I2 = (ctx, S) => {
    K.words(ctx, 'This is a', 560, 360, { f: 'serif', s: 76, w: 700, t: S.since(0.0), per: 0.08 });
    K.words(ctx, 'textbook.', 560, 452, { f: 'serif', s: 76, w: 700, i: true, c: C.orange, t: S.since(0.7), per: 0.08 });
    // cover drops and slams at beat 1.0
    const land = 1.0 * S.b, t = S.t;
    let y = 560, rot = -0.04;
    if (t < land) { const u = K.clamp(t / land); y = K.lerp(-500, 560, E.inCubic(u)); rot = K.lerp(-0.25, -0.04, u); }
    else { const u = t - land; y = 560 - Math.abs(Math.sin(u * 14)) * 22 * Math.exp(-u * 7); }
    K.cover(ctx, 1380, y, 440, { rot, t: S.t });
    // dust puffs
    const d = t - land; if (d > 0 && d < 0.8) { ctx.save(); for (let k = 0; k < 10; k++) { const dir = k % 2 ? 1 : -1, sp = 120 + 90 * K.hash(k); ctx.globalAlpha = 0.45 * (1 - d / 0.8); ctx.fillStyle = '#CFC6B4'; ctx.beginPath(); ctx.arc(1380 + dir * (230 + d * sp), 840 - d * 70 * K.hash(k + 4) - 10, 16 + d * 40, 0, 7); ctx.fill(); } ctx.restore(); }
  };
  SC.I3 = (ctx, S) => {
    K.words(ctx, 'No price calls.', 560, 300, { f: 'serif', s: 70, w: 700, t: S.since(0.0), per: 0.07 });
    K.words(ctx, 'No hopium.', 1180, 300, { f: 'serif', s: 70, w: 700, t: S.since(1.2), per: 0.07, c: C.orange, i: true });
    const a = S.pop(0.3), b = S.pop(1.5);
    if (a > 0) { ctx.save(); ctx.translate(860, 600); ctx.scale(a, a); I.chartUp(ctx, 0, 0, 220, { p: 1 }); ctx.restore(); K.txt(ctx, 'price calls', 860, 790, { f: 'hand', s: 48, w: 700, c: C.ink2, a: 'center', alpha: a }); }
    if (b > 0) { ctx.save(); ctx.translate(1420, 600); ctx.scale(b, b); I.rocket(ctx, 0, 0, 220, {}); ctx.restore(); K.txt(ctx, 'hopium', 1420, 790, { f: 'hand', s: 48, w: 700, c: C.ink2, a: 'center', alpha: b }); }
    noSign(ctx, 860, 600, 150, S.lin(1.0, 0.45)); noSign(ctx, 1420, 600, 150, S.lin(2.2, 0.45));
  };
  SC.I4 = (ctx, S) => {
    const tiles = [['49', 'PAGES'], ['11', 'CHAPTERS'], ['1', 'ELEPHANT']];
    // the tiles and the note are completely gone before the contents arrive (they never share a frame)
    const out = S.at(3.55, 0.45, E.inOutCubic);
    if (out < 1) tiles.forEach(([n, l], k) => {
      const p = S.pop(k * 1.0, 0.5); if (p <= 0) return;
      const x = 720 + k * 400, y = 470 - out * 60;
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(x, y); ctx.scale(p, p);
      K.box(ctx, -170, -150, 340, 300, { r: 26, fill: C.card, stroke: C.ink, lw: 4, shadow: 18 });
      K.txt(ctx, n, 0, 40, { f: 'display', s: 170, w: 900, st: 'expanded', c: C.orange, a: 'center' });
      K.txt(ctx, l, 0, 112, { f: 'mono', s: 26, w: 700, c: C.ink, a: 'center', ls: 6 });
      ctx.restore();
    });
    if (out < 1) { ctx.save(); ctx.globalAlpha = 1 - out; K.note(ctx, "let's read.", 1080, 760 - out * 60, { p: S.lin(2.6, 0.8), s: 92, rot: -0.04, underline: true }); ctx.restore(); }
    // table of contents cascade
    if (S.bt > 4.05) {
      const chs = ['Foundations', 'Tokenized Equities', 'Market Structure', 'Treasuries', 'Yield & Returns', 'Private Credit', 'Real Estate', 'Infrastructure & Compliance Rails', 'Commodities', 'Funds', 'Risk & Red Flags'];
      K.txt(ctx, 'CONTENTS', 560, 300, { f: 'mono', s: 20, w: 700, c: C.orange, ls: 6, alpha: S.at(4.05, 0.3) });
      chs.forEach((c, k) => {
        const a = S.at(4.15 + k * 0.12, 0.35), col = k < 6 ? 0 : 1, row = k < 6 ? k : k - 6;
        const x = 560 + col * 640, y = 370 + row * 66 + (1 - a) * 14;
        K.txt(ctx, String(k + 1).padStart(2, '0'), x, y, { f: 'mono', s: 22, w: 700, c: C.orange, alpha: a });
        K.txt(ctx, c, x + 56, y + 2, { f: 'serif', s: 34, w: 700, c: C.ink, alpha: a });
      });
    }
  };
})();
