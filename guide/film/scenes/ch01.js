/* ch01.js — Foundations. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin note
   and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));

  // 1.1 What is an RWA — four offchain assets, each gets an onchain claim on a string; the claims zip, the assets stay
  SC['L1.1'] = (ctx, S) => {
    const xs = [790, 1060, 1330, 1600], names = S.sc.labels.assets, lineY = 420; S.noteTo = [1300, 300];
    const div = S.at(0.1, 0.5);
    ctx.save(); ctx.globalAlpha = div; ctx.setLineDash([10, 10]); K.line(ctx, 600, lineY, 1790, lineY, { lw: 2.5, c: C.ink3 }); ctx.restore();
    label(ctx, '↑ ONCHAIN', 600, lineY - 18, { a: 'left', c: C.orange, s: 18, alpha: div });
    label(ctx, '↓ OFFCHAIN', 600, lineY + 34, { a: 'left', c: C.ink3, s: 18, alpha: div });
    const zip = S.at(2.8, 0.6), t = S.t;
    xs.forEach((x, k) => {
      const p = S.pop(0.3 + k * 0.25);
      if (p > 0) {
        ctx.save(); ctx.translate(x, 600); ctx.scale(p, p);
        if (k === 0) I.tbill(ctx, 0, 0, 120); else if (k === 1) I.loan(ctx, 0, 0, 130); else if (k === 2) I.building(ctx, 0, -6, 170); else I.goldbar(ctx, 0, 10, 140);
        ctx.restore();
        label(ctx, names[k], x, 728, { alpha: p });
      }
      const c = S.pop(1.6 + k * 0.2);
      if (c > 0) {
        const ox = zip * Math.sin(t * 3.2 + k * 1.7) * 70, oy = zip * Math.cos(t * 2.6 + k) * 28;
        const cx = x + ox, cy = 330 + oy;
        ctx.save(); ctx.setLineDash([4, 7]); K.line(ctx, x, 540, cx, cy + 44, { lw: 2.5, c: C.ink2 }); ctx.restore();
        if (zip > 0) { ctx.save(); ctx.globalAlpha = 0.25 * zip; for (let j = 1; j < 4; j++) { const tt = t - j * 0.035; ctx.beginPath(); ctx.arc(x + zip * Math.sin(tt * 3.2 + k * 1.7) * 70, 330 + zip * Math.cos(tt * 2.6 + k) * 28, 44, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); } ctx.restore(); }
        ctx.save(); ctx.translate(cx, cy); ctx.scale(c, c); K.coin(ctx, 0, 0, 44, {}); ctx.restore();
      }
    });
    label(ctx, 'THE TOKEN MOVES ONCHAIN · THE ASSET STAYS WHERE IT IS', 1195, 790, { s: 17, c: C.ink2, alpha: S.at(3.2, 0.5) });
  };

  // 1.2 Tokenization — a T-bill gets wrapped; an x-ray shows it is still a T-bill
  SC['L1.2'] = (ctx, S) => {
    const cx = 1190, cy = 520, w = 420, h = 260; S.noteTo = [960, 470];
    const p0 = S.pop(0.3);
    const wrap = S.at(1.0, 0.9, E.inOutCubic);
    if (p0 > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(p0, p0); I.tbill(ctx, 0, 0, 240); ctx.restore(); }
    label(ctx, 'ASSET', cx, cy + 190, { alpha: p0 * (1 - wrap) });
    if (wrap > 0) {
      // two wrapper flaps close over the asset
      const fw = (w / 2 + 20) * wrap;
      for (const sx of [-1, 1]) {
        ctx.save(); ctx.beginPath(); const x0 = sx < 0 ? cx - w / 2 - 20 : cx + w / 2 + 20 - fw;
        K.rr(ctx, x0, cy - h / 2 - 20, fw, h + 40, 18); ctx.fillStyle = C.orange; ctx.fill(); ctx.clip();
        for (let i = -3; i < 10; i++) for (let j = -2; j < 6; j++) K.headMark(ctx, cx - w / 2 + i * 70 + (j % 2) * 35, cy - h / 2 + j * 62, 46, 'rgba(255,255,255,.28)');
        ctx.restore();
        ctx.lineWidth = 5; ctx.strokeStyle = C.ink; K.rr(ctx, x0, cy - h / 2 - 20, fw, h + 40, 18); ctx.stroke();
      }
    }
    const tok = S.pop(2.0);
    if (tok > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(tok, tok); K.coin(ctx, 0, 0, 70, { fill: C.card, markC: C.orange }); ctx.restore(); label(ctx, 'WRAPPER', cx, cy + 190, { alpha: tok, c: C.orange }); }
    // x-ray sweep
    const xr = S.lin(3.0, 1.4);
    if (xr > 0 && xr < 1) {
      const bx = cx - w / 2 - 40 + xr * (w + 80);
      ctx.save(); ctx.beginPath(); ctx.rect(bx - 120, cy - h / 2 - 30, 240, h + 60); ctx.clip();
      ctx.fillStyle = '#0D2236'; ctx.fillRect(bx - 120, cy - h / 2 - 30, 240, h + 60);
      ctx.globalAlpha = 0.9; ctx.filter = 'invert(1) hue-rotate(160deg) brightness(1.2)'; I.tbill(ctx, cx, cy, 240); ctx.filter = 'none';
      ctx.restore();
      ctx.fillStyle = 'rgba(80,200,255,.8)'; ctx.fillRect(bx - 2, cy - h / 2 - 40, 4, h + 80);
    }
    if (S.bt > 4.4) label(ctx, 'STILL A T-BILL', cx, cy - 175, { c: C.green, s: 24, alpha: S.at(4.4, 0.4) });
  };

  // 1.3 Onchain — a ledger can be fudged; a block can't
  SC['L1.3'] = (ctx, S) => {
    const lx = 860, ly = 520, bx0 = 1330; S.noteTo = [1360, 400];
    const a = S.pop(0.4);
    if (a > 0) {
      ctx.save(); ctx.translate(lx, ly); ctx.scale(a, a); I.ledger(ctx, 0, 0, 260); ctx.restore();
      const scrub = S.lin(1.0, 0.8);
      K.txt(ctx, 'owner', lx + 98, ly - 52, { f: 'hand', s: 34, w: 700, c: C.ink2, a: 'center', alpha: a });
      K.txt(ctx, scrub < 0.6 ? 'Bob' : 'Not Bob', lx + 98, ly - 6, { f: 'hand', s: 44, w: 700, c: scrub < 0.6 ? C.ink : C.red, a: 'center', alpha: a });
      K.txt(ctx, 'amount', lx - 98, ly - 52, { f: 'hand', s: 34, w: 700, c: C.ink2, a: 'center', alpha: a });
      K.txt(ctx, '100', lx - 98, ly - 6, { f: 'hand', s: 44, w: 700, c: C.ink, a: 'center', alpha: a });
      label(ctx, "ISSUER'S LEDGER", lx, ly + 190, { alpha: a });
    }
    // blocks
    const ent = ['CLAIM', 'OWNER', 'AMOUNT', 'LAST MOVE'];
    for (let k = 0; k < 4; k++) {
      const p = S.pop(2.2 + k * 0.12); if (p <= 0) continue;
      const x = bx0 + k * 132, y = 520;
      if (k) K.line(ctx, x - 132 + 52, y + 10, x - 52, y + 10, { lw: 5, c: C.ink });
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p); I.block(ctx, 0, 0, 110, {}); ctx.restore();
      label(ctx, ent[k], x, y + 96, { s: 15, ls: 1, alpha: p });
    }
    label(ctx, 'ONCHAIN RECORD', bx0 + 198, 720, { alpha: S.at(2.4, 0.4) });
    // the eraser: scrubs the ledger, then flies at the blocks and bounces off
    const e1 = S.lin(1.0, 0.8), e2 = S.lin(2.2, 0.8), bounce = S.lin(3.0, 0.6);
    if (S.bt > 0.9 && bounce < 1) {
      let x, y, r = 0.3;
      if (e2 <= 0) { x = lx + 98 + Math.sin(e1 * 30) * 46; y = ly - 20 + Math.cos(e1 * 21) * 6; }
      else if (bounce <= 0) { const u = E.inOutCubic(e2); x = K.lerp(lx + 98, bx0 + 66, u); y = K.lerp(ly - 34, 450, u) - Math.sin(u * Math.PI) * 120; r = 0.3 + u * 0.5; }
      else { const u = E.outCubic(bounce); x = bx0 + 66 - u * 260; y = 450 - Math.sin(u * Math.PI) * 160 + u * 200; r = 0.8 + u * 5; }
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.globalAlpha = 1 - K.clamp((bounce - 0.7) / 0.3);
      K.box(ctx, -55, -26, 110, 52, { r: 12, fill: '#F48FB1', stroke: C.ink, lw: 4 }); ctx.fillStyle = '#3B5BA9'; ctx.fillRect(-55 + 2, -24, 40, 48); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; K.rr(ctx, -55, -26, 110, 52, 12); ctx.stroke();
      ctx.restore();
    }
    if (S.bt > 3.0) { K.cross(ctx, bx0 + 66, 440, 90, S.lin(3.0, 0.35)); K.txt(ctx, 'NOPE', bx0 + 66, 382, { f: 'display', s: 46, w: 900, c: C.red, a: 'center', alpha: S.at(3.05, 0.2) }); }
    if (S.bt > 3.8) label(ctx, '✓ anyone can check it — no phone call needed', bx0 + 198, 770, { s: 17, c: C.green, ls: 1, alpha: S.at(3.8, 0.4) });
  };

  // 1.4 Custody — who is actually holding this? vault -> weak custody -> lawsuit
  SC['L1.4'] = (ctx, S) => {
    const tx = 760, ty = 540, vx = 1470, vy = 530; S.noteTo = [930, 520];
    const weak = S.at(3.4, 0.5);
    const q = S.pop(0.3);
    if (q > 0 && weak < 1) {
      ctx.save(); ctx.globalAlpha = 1 - weak;
      K.bubble(ctx, 600, 330, 420, 92, 740, 470, {});
      K.txt(ctx, "WHO'S ACTUALLY", 810, 368, { f: 'display', s: 32, w: 900, st: 'semi-condensed', c: C.ink, a: 'center', alpha: q });
      K.txt(ctx, 'HOLDING THIS?', 810, 404, { f: 'display', s: 32, w: 900, st: 'semi-condensed', c: C.orange, a: 'center', alpha: q });
      ctx.restore();
    }
    // token -> lawsuit morph
    const morph = S.at(3.9, 0.45, E.inOutCubic);
    if (morph < 1) { const s = 1 - morph; ctx.save(); ctx.translate(tx, ty + 30); ctx.scale(s * q, s * q); ctx.rotate(morph * 3); K.coin(ctx, 0, 0, 70, {}); ctx.restore(); }
    if (morph > 0) { ctx.save(); ctx.translate(tx, ty + 30); ctx.scale(morph, morph); I.lawsuit(ctx, 0, 0, 190); ctx.restore(); }
    const gv = S.lin(4.0, 0.25);
    if (gv > 0) I.gavel(ctx, tx + 150, ty - 30, 150, { swing: K.lerp(-1.4, -0.35, E.inCubic(gv)) });
    K.arrow(ctx, 880, 560, 1270, 550, { p: S.at(1.3, 0.5), bend: -40, lw: 5 });
    const vp = S.pop(1.0);
    if (vp > 0) {
      ctx.save(); ctx.translate(vx, vy); ctx.scale(vp, vp);
      I.vault(ctx, 0, 0, 330, { open: S.at(1.9, 0.6, E.inOutCubic) * (1 - weak), dashed: weak > 0.5, inside: (c) => { c.globalAlpha = 1 - weak; I.tbill(c, -40, -50, 90); I.goldbar(c, 50, 40, 90); I.loan(c, -50, 60, 80); } });
      ctx.restore();
      label(ctx, weak > 0.5 ? 'WEAK CUSTODY' : 'CUSTODIAN', vx, vy + 220, { c: weak > 0.5 ? C.red : C.ink });
      if (weak > 0.5) { const qp = S.pop(3.6, 0.5); if (qp > 0) { ctx.save(); ctx.translate(vx, vy + 8); ctx.scale(qp, qp); ctx.rotate(Math.sin(S.t * 3) * 0.06); K.txt(ctx, '?', 0, 52, { f: 'display', s: 170, w: 900, c: C.red, a: 'center', alpha: 0.85 }); ctx.restore(); } }
    }
    if (S.bt > 3.4) K.txt(ctx, 'IF THE PLATFORM VANISHES TOMORROW?', 1180, 340, { f: 'display', s: 34, w: 900, st: 'semi-condensed', c: C.red, a: 'center', alpha: weak, ls: 1 });
  };

  // 1.5 Transfer agent — the bouncer between wallets
  SC['L1.5'] = (ctx, S) => {
    const ax = 700, bx = 1690, y = 600, gx = 1190; S.noteTo = [1100, 640];
    const p = S.pop(0.3);
    if (p > 0) {
      I.wallet(ctx, ax, y, 150, { sc: p, label: 'A' }); I.wallet(ctx, bx, y, 150, { sc: p, label: 'B' });
      ctx.save(); ctx.translate(gx, 452); ctx.scale(p, p);
      I.clipboard(ctx, 0, 0, 240, { wide: 1.05, ts: 0.072, items: [['KYC', S.lin(1.4, 0.3)], ['ACCREDITATION', S.lin(1.8, 0.3)], ['JURISDICTION', S.lin(2.2, 0.3)]] });
      ctx.restore();
      K.txt(ctx, 'TRANSFER AGENT', gx, 315, { f: 'mono', s: 22, w: 700, c: C.orange, a: 'center', ls: 4, alpha: p });
    }
    const open = S.at(2.6, 0.4);
    I.rope(ctx, gx, 660, 150, { open, sc: 1 });
    // token 1: A -> rope (waits) -> B
    const go1 = S.at(0.6, 0.6), go2 = S.at(2.8, 0.6, E.inOutCubic);
    if (S.bt > 0.5) { const x = go2 > 0 ? K.lerp(gx - 140, bx - 40, go2) : K.lerp(ax + 40, gx - 140, go1); K.coin(ctx, x, y - 6 - Math.sin(go2 * Math.PI) * 60, 36, {}); }
    // token 2: unknown wallet, rejected
    const r = S.lin(3.6, 0.9);
    if (r > 0) {
      const x = r < 0.45 ? K.lerp(ax + 40, gx - 140, E.outCubic(r / 0.45)) : K.lerp(gx - 140, ax + 120, E.outCubic((r - 0.45) / 0.55));
      K.coin(ctx, x, y + 70, 30, { fill: '#9A9A9A', mark: false, label: '?' });
      if (r > 0.42) K.stamp(ctx, 'NOT ON THE LIST', gx, 760, { p: K.clamp((r - 0.42) / 0.12), s: 34, rot: -0.06 });
    }
  };

  // 1.6 Total value vs TVL — most supply naps in wallets; a few coins actually work
  SC['L1.6'] = (ctx, S) => {
    const gx = 640, gy = 360, cols = 8, rows = 5, step = 62, workers = [5, 13, 21, 22, 30, 38]; S.noteTo = [700, 470];
    const nap = S.at(1.3, 0.6), walk = S.at(2.3, 0.9, E.inOutCubic), t = S.t;
    label(ctx, 'TOTAL VALUE · everything onchain', gx + (cols - 1) * step / 2, gy - 54, { alpha: S.at(0.3, 0.4) });
    for (let k = 0; k < cols * rows; k++) {
      const p = S.pop(0.3 + (k % 13) * 0.025); if (p <= 0) continue;
      const c = k % cols, r = Math.floor(k / cols); let x = gx + c * step, y = gy + r * step;
      const wi = workers.indexOf(k);
      if (wi >= 0 && walk > 0) { x = K.lerp(x, 1470 + (wi % 3) * 90, walk); y = K.lerp(y, 470 + Math.floor(wi / 3) * 100, walk) - Math.sin(walk * Math.PI) * 50; }
      const sleepy = wi < 0 ? nap : 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p); K.coin(ctx, 0, 0, 25, { fill: sleepy > 0.5 ? '#E8A06A' : C.orange }); ctx.restore();
      if (sleepy > 0.5 && (k === 17 || k === 20 || k === 26 || k === 35)) I.zzz(ctx, x + 10, y - 20, 90, t + k); // rows 2+: the Zs never reach the label
    }
    if (nap > 0) label(ctx, '…napping in wallets', gx + 210, gy + rows * step + 20, { c: C.ink2, s: 18, alpha: nap });
    // protocol box with gears
    const bp = S.pop(2.0);
    if (bp > 0) {
      ctx.save(); ctx.translate(1560, 520); ctx.scale(bp, bp);
      K.box(ctx, -190, -150, 380, 300, { r: 22, fill: 'rgba(14,159,110,.08)', stroke: C.green, lw: 4 });
      I.gear(ctx, -120, -100, 70, { a: t * 2, fill: '#9BD3B9' }); I.gear(ctx, -62, -112, 46, { a: -t * 3, fill: '#9BD3B9' });
      ctx.restore();
      label(ctx, 'TVL · deposited & working', 1560, 715, { c: C.green, alpha: bp });
      K.txt(ctx, 'PROTOCOL', 1600, 400, { f: 'mono', s: 18, w: 700, c: C.green, a: 'center', ls: 3, alpha: bp });
    }
    // the hype sticker gets struck
    const st = S.pop(3.8, 0.4);
    if (st > 0) {
      ctx.save(); ctx.translate(gx + 220, gy + 120); ctx.rotate(-0.08); ctx.scale(st, st);
      K.box(ctx, -210, -58, 420, 116, { r: 10, fill: C.neonYellow, stroke: C.ink, lw: 4 });
      const hs = K.fitSize(ctx, '$2B TVL!!!', 360, { f: 'display', s: 66, w: 900, i: true, st: 'expanded' });
      K.txt(ctx, '$2B TVL!!!', 0, hs * 0.34, { f: 'display', s: hs, w: 900, i: true, st: 'expanded', c: C.ink, a: 'center' });
      ctx.restore();
      K.strike(ctx, gx + 20, gy + 140, gx + 420, S.lin(4.4, 0.25), { lw: 10 });
    }
  };

  // 1.7 Issuance vs distribution — a press mints a billion; the pie shows who holds it
  SC['L1.7'] = (ctx, S) => {
    const px = 780, py = 470, t = S.t; S.noteTo = [1360, 470];
    const hits = [0.3, 0.6, 0.9].map((b) => K.clamp(1 - Math.abs(S.bt - b) / 0.18));
    const down = Math.max(...hits);
    const p = S.pop(0.05);
    if (p > 0) { ctx.save(); ctx.translate(px, py); ctx.scale(p, p); I.press(ctx, 0, 0, 260, { down, label: 'MINT' }); ctx.restore(); }
    // coins spill into a pile
    const nPile = Math.floor(K.clamp((S.bt - 0.3) / 0.9) * 14);
    for (let k = 0; k < nPile; k++) K.coin(ctx, px - 120 + (k % 7) * 40 + (Math.floor(k / 7) % 2) * 20, py + 190 - Math.floor(k / 7) * 22, 22, {});
    const cnt = Math.round(1e9 * E.outCubic(S.lin(1.2, 1.0)));
    if (S.bt > 1.1) { label(ctx, 'ISSUED', px, 716, { c: C.ink2 }); K.txt(ctx, cnt.toLocaleString('en-US'), px, 774, { f: 'display', s: 58, w: 900, st: 'condensed', c: C.ink, a: 'center' }); }
    // pie
    const cx = 1470, cy = 510, R = 180, pp = S.at(2.4, 0.9, E.inOutCubic);
    if (pp > 0) {
      label(ctx, 'DISTRIBUTION · who actually holds it', cx, 296, { alpha: pp });
      const a0 = -Math.PI / 2, big = 0.97 * Math.PI * 2 * pp;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + big); ctx.closePath(); ctx.fillStyle = C.orange; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
      if (pp >= 1) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0 + big, a0 + Math.PI * 2); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); ctx.stroke(); }
      const l1 = S.at(3.0, 0.4);
      K.txt(ctx, '97%', cx - 30, cy + 20, { f: 'display', s: 70, w: 900, st: 'condensed', c: C.card, a: 'center', alpha: l1 });
      K.txt(ctx, 'issuer + early backers', cx - 30, cy + 62, { f: 'mono', s: 17, w: 600, c: C.card, a: 'center', alpha: l1 });
      K.arrow(ctx, cx - 14, cy - R + 14, cx - 190, cy - R + 20, { p: l1, head: false, lw: 3, c: C.ink, bend: 30 });
      K.txt(ctx, '3% everyone else', cx - 196, cy - R + 26, { f: 'mono', s: 18, w: 700, c: C.ink, a: 'right', alpha: l1 });
    }
    if (S.sc.kicker) K.wrap(ctx, S.sc.kicker, 760, { f: 'serif', s: 34, w: 700, i: true }).forEach((ln, i, all) => K.txt(ctx, ln, 1470, 770 - (all.length - 1) * 21 + i * 42, { f: 'serif', s: 34, w: 700, i: true, c: C.orange, a: 'center', alpha: S.at(4.6 + i * 0.12, 0.5) }));
  };

  // 1.8 Smart contract wrapper — same gold, different off-switch
  SC['L1.8'] = (ctx, S) => {
    const A = 880, B = 1500, y = 440; S.noteTo = [1380, 420];
    const rowsA = [['HOLD', 'anyone'], ['FREEZE', 'no'], ['UPGRADE', 'no']], rowsB = [['HOLD', 'allowlist'], ['FREEZE', 'yes'], ['UPGRADE', 'yes']];
    const frost = S.at(3.2, 0.6);
    for (const [x, k] of [[A, 0], [B, 1]]) {
      const p = S.pop(0.3 + k * 0.2); if (p <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p); I.goldbar(ctx, 0, 0, 170, { frost: k ? frost : 0 }); ctx.restore();
      if (k && frost > 0) { ctx.save(); ctx.globalAlpha = frost; for (let i = 0; i < 7; i++) { const a = i * 0.9; ctx.strokeStyle = '#8FD3FF'; ctx.lineWidth = 3; const cx = x - 70 + i * 24, cy = y - 20 + (i % 2) * 22; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(cx - Math.cos(a + j) * 12, cy - Math.sin(a + j) * 12); ctx.lineTo(cx + Math.cos(a + j) * 12, cy + Math.sin(a + j) * 12); ctx.stroke(); } } ctx.restore(); }
      // code wrapper frame
      const w = S.at(1.4 + k * 0.6, 0.5);
      if (w > 0) {
        ctx.save(); ctx.globalAlpha = w; ctx.setLineDash([14, 8]); K.box(ctx, x - 190, y - 120, 380, 230, { r: 24, fill: null, stroke: k ? C.orange : C.ink2, lw: 4 }); ctx.restore();
        K.txt(ctx, '{ wrapper ' + (k ? 'B' : 'A') + ' }', x - 170, y - 132, { f: 'mono', s: 18, w: 700, c: k ? C.orange : C.ink2, alpha: w });
        (k ? rowsB : rowsA).forEach(([kk, v], i) => {
          const a = S.at(1.6 + k * 0.6 + i * 0.12, 0.3), yy = y + 160 + i * 44;
          K.txt(ctx, kk, x - 150, yy, { f: 'mono', s: 20, w: 700, c: C.ink, alpha: a, ls: 2 });
          K.box(ctx, x + 40, yy - 24, 130, 32, { r: 16, fill: v === 'no' || v === 'anyone' ? '#E3EFE8' : '#FBE3D6', stroke: null });
          K.txt(ctx, v, x + 105, yy - 1, { f: 'mono', s: 18, w: 700, c: v === 'no' || v === 'anyone' ? C.green : C.orange2, a: 'center', alpha: a });
        });
      }
    }
    label(ctx, 'SAME GOLD', (A + B) / 2, y + 8, { c: C.ink3, alpha: S.at(1.0, 0.4) });
    // the big red STOP button on wrapper B
    const sp = S.pop(2.6);
    if (sp > 0) {
      const pressed = S.bt > 3.0 && S.bt < 3.25 ? 6 : 0;
      ctx.save(); ctx.translate(B + 250, y - 70); ctx.scale(sp, sp);
      ctx.beginPath(); ctx.ellipse(0, 18, 62, 24, 0, 0, 7); ctx.fillStyle = '#5A1212'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 6 + pressed, 56, 22, 0, 0, 7); ctx.fillStyle = '#B81E1E'; ctx.fill();
      ctx.beginPath(); ctx.rect(-56, 6 + pressed - 22, 112, 22); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -16 + pressed, 56, 22, 0, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
      K.txt(ctx, 'STOP', 0, -8 + pressed, { f: 'display', s: 28, w: 900, c: C.card, a: 'center' });
      ctx.restore();
      label(ctx, 'who can stop it?', B + 250, y + 2, { s: 16, c: C.red, alpha: sp });
    }
  };
})();
