/* outro.js — O1 that's the book, O2 the herd, O3 the herd keeps moving, O4 end card. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;

  SC.O1 = (ctx, S) => {
    K.words(ctx, S.sc.text, 560, 360, { f: 'serif', s: 92, w: 700, t: S.since(0.1), per: 0.09 });
    K.words(ctx, S.sc.kicker, 560, 450, { f: 'serif', s: 40, w: 400, i: true, c: C.ink2, maxW: 760, lh: 52, t: S.since(0.9), per: 0.04 });
    const p = S.pop(0.25);
    if (p > 0) { ctx.save(); ctx.translate(1520, 560); ctx.scale(p, p); K.cover(ctx, 0, 0, 380, { rot: 0.05, t: S.t }); ctx.restore(); }
    K.stamp(ctx, '49 / 49 · READ', 1520, 600, { p: S.lin(0.6, 0.25), s: 50, c: C.green, rot: -0.14 });
    // confetti burst from the stamp
    const c = S.since(0.6);
    if (c > 0 && c < 2.5) { const r = K.rand(11); for (let k = 0; k < 46; k++) { const a = r() * Math.PI * 2, v = 300 + r() * 520, x = 1520 + Math.cos(a) * v * c, y = 600 + Math.sin(a) * v * c + 520 * c * c; ctx.save(); ctx.translate(x, y); ctx.rotate(c * 8 + k); ctx.globalAlpha = K.clamp(2 - c); ctx.fillStyle = [C.orange, C.gold, C.green, C.blue, C.red][k % 5]; ctx.fillRect(-7, -4, 14, 8); ctx.restore(); } }
  };
  SC.O2 = (ctx, S) => {
    const H = S.sc.herd || window.TL.herd;
    K.txt(ctx, H.title, 560, 196, { f: 'serif', s: 74, w: 700, alpha: S.at(0, 0.4) });
    K.txt(ctx, H.sub, 560, 252, { f: 'serif', s: 31, w: 400, i: true, c: C.ink2, alpha: S.at(0.25, 0.4) });
    H.accounts.forEach((a, k) => {
      const col = k % 6, row = Math.floor(k / 6), x = 660 + col * 222, y = 430 + row * 250;
      const p = S.pop(0.6 + k * 0.3); if (p <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p); K.avatar(ctx, a.handle, 0, 0, 74); ctx.restore();
      K.txt(ctx, a.name, x, y + 116, { f: 'serif', s: 27, w: 700, a: 'center', alpha: p });
      K.txt(ctx, '@' + a.handle, x, y + 146, { f: 'mono', s: 16, w: 500, c: C.ink2, a: 'center', alpha: p });
    });
  };
  SC.O3 = (ctx, S) => {
    K.words(ctx, S.sc.text, 560, 400, { f: 'serif', s: 80, w: 700, t: S.since(0.1), per: 0.08 });
    K.words(ctx, S.sc.kicker, 560, 500, { f: 'serif', s: 80, w: 700, i: true, c: C.orange, t: S.since(1.2), per: 0.08 });
    // a little herd marches across the stage
    const t = S.t;
    for (let k = 0; k < 6; k++) {
      const x = 520 + ((t * 150 + k * 210) % 1400), step = Math.abs(Math.sin(t * 9 + k * 1.3));
      if (x > 1830) continue;
      ctx.globalAlpha = K.clamp((x - 520) / 80) * K.clamp((1830 - x) / 80);
      window.WallyRig.draw(ctx, { x, y: 790 - step * 8, s: 0.2, rot: Math.sin(t * 9 + k * 1.3) * 0.05, trunk: { bend: Math.sin(t * 4 + k) * 0.3 }, earL: step * 0.08, earR: step * 0.08 });
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = C.line2; ctx.fillRect(500, 792, 1330, 3);
  };
  SC.O4 = (ctx, S) => {
    const fadeOut = K.clamp((S.t - (S.d - 1.0)) / 0.9);
    const p = S.at(0.0, 0.6, E.outExpo);
    K.txt(ctx, "WALLY'S", 1190, 360, { f: 'mono', s: 132, w: 900, c: C.ink, a: 'center', alpha: p });
    K.txt(ctx, 'RWA TEXTBOOK', 1190, 500, { f: 'mono', s: 132, w: 900, c: C.orange, a: 'center', alpha: p });
    K.words(ctx, 'Read it. Watch it. Play Tokens, Please.', 1190, 610, { f: 'serif', s: 46, w: 400, i: true, c: C.ink2, a: 'center', t: S.since(1.0), per: 0.06 });
    const u = S.pop(2.2);
    if (u > 0) { ctx.save(); ctx.translate(1190, 720); ctx.scale(u, u); K.chip(ctx, 'rwaf.xyz/guide', 0, 0, { s: 40, fill: C.orange, c: '#FFFFFF', a: 'center', ls: 1, padX: 40, h: 86, w: 700 }); ctx.restore(); }
    K.txt(ctx, 'CREATED BY RWA FOUNDATION  ·  @wallycollection  ·  @RWAFOUNDATION_', 1190, 850, { f: 'mono', s: 20, w: 600, c: C.ink2, a: 'center', ls: 3, alpha: S.at(3.0, 0.5) });
    S.wally.pose = { sparkle: S.bt > 1 && S.bt < 2.4 ? Math.sin((S.bt - 1) / 1.4 * Math.PI) : 0 };
    S.fadeBlack = fadeOut;
  };
})();
