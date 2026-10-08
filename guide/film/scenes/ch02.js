/* ch02.js — Tokenized Equities. Lesson diagrams only: the engine draws the page, title, THE POINT, the margin
   note and Wally. Stage = S.stage {x:560,y:286,w:1262,h:510,cx,cy}. Times are in BEATS via S.at/S.pop/S.lin. */
(function () {
  const K = window.K, C = K.C, E = K.E, I = window.I, SC = window.SCENES;
  const label = (ctx, s, x, y, o = {}) => K.txt(ctx, s, x, y, Object.assign({ f: 'mono', s: 20, w: 700, c: C.ink, a: 'center', ls: 3 }, o));
  const XRAY = '#E2F0F6';
  // 0 -> 1 -> 0 bump centred on beat b (d beats wide)
  const bump = (S, b, d = 0.3) => { const u = (S.bt - b) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
  // split "a · b · c" into lines that fit maxW (joins fragments with ' · ')
  const fragLines = (ctx, str, maxW, o) => {
    const parts = String(str).split(' · '), out = []; let cur = '';
    for (const p of parts) { const test = cur ? cur + ' · ' + p : p; if (cur && K.measure(ctx, test, o) > maxW) { out.push(cur); cur = p; } else cur = test; }
    if (cur) out.push(cur);
    return out.flatMap((l) => (K.measure(ctx, l, o) > maxW ? wrapLines(ctx, l, maxW, o) : [l])); // one fragment wider than maxW breaks between words
  };
  const wrapLines = (ctx, str, maxW, o) => {
    if (K.measure(ctx, str, o) <= maxW) return [str];
    const w = String(str).split(' '); let best = null, bs = 1e9;
    for (let i = 1; i < w.length; i++) {
      const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(K.measure(ctx, a, o), K.measure(ctx, b, o));
      const sc = m - (/[.:]$/.test(a) ? 60 : 0); if (m <= maxW + 40 && sc < bs) { bs = sc; best = [a, b]; }
    }
    return best || K.wrap(ctx, str, maxW, o);
  };
  const caption = (ctx, ls, x, y, o = {}) => ls.forEach((l, i) => K.txt(ctx, l, x, y + i * (o.lh || 26), Object.assign({ f: 'mono', s: 18, w: 600, c: C.ink2, a: 'center', ls: 0.5 }, o)));
  // white disc badge with a check or a cross
  function verdict(ctx, x, y, p, ok, r = 36) {
    if (p <= 0) return; const c = ok ? C.green : C.red;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.lineWidth = 4.5; ctx.strokeStyle = c; ctx.stroke();
    (ok ? K.check : K.cross)(ctx, ok ? 2 : 0, ok ? 2 : 0, r * 1.35, 1, c, r * 0.24);
    ctx.restore();
  }
  // small share certificate (cream, gold dashed border, red seal in the corner)
  function cert(ctx, x, y, w, h, o = {}) {
    K.box(ctx, x - w / 2, y - h / 2, w, h, { r: 6, fill: '#FFF8E6', stroke: C.ink, lw: o.lw || 4 });
    ctx.save(); ctx.setLineDash([6, 5]); K.rr(ctx, x - w / 2 + h * 0.08, y - h / 2 + h * 0.08, w - h * 0.16, h - h * 0.16, 4); ctx.lineWidth = Math.max(1.5, h * 0.022); ctx.strokeStyle = C.goldDark; ctx.stroke(); ctx.restore();
    if (o.name) K.txt(ctx, o.name, x, y - h * 0.16, { f: 'mono', s: o.ns || 13, w: 700, c: C.ink2, a: 'center', ls: 1 });
    if (o.big) K.txt(ctx, o.big, x - w * 0.04, y + h * 0.25, { f: 'display', s: o.bs || 34, w: 900, st: 'condensed', c: C.ink, a: 'center' });
    ctx.beginPath(); ctx.arc(x + w / 2 - h * 0.13, y + h / 2 - h * 0.13, h * 0.1, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = Math.max(2, h * 0.025); ctx.strokeStyle = C.ink; ctx.stroke();
  }
  // a big token (lighter outline than K.coin at this size)
  function bigCoin(ctx, x, y, R, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 7; ctx.strokeStyle = C.ink;
    ctx.beginPath(); ctx.ellipse(0, R * 0.08, R, R, 0, 0, 7); ctx.fillStyle = K.shade(C.orange, -0.22); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, R * 0.08, R, R, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(32,26,19,.28)'; ctx.stroke();
    if (o.label) K.txt(ctx, o.label, 0, R * 0.17, { f: 'display', s: R * 0.46, w: 900, st: 'condensed', c: C.card, a: 'center' });
    ctx.restore();
  }
  // a token with its face cut away: orange rim + x-ray window showing what's inside
  function glassCoin(ctx, x, y, R, inner, ticker) {
    bigCoin(ctx, x, y, R);
    const wr = R * 0.76;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, wr, 0, 7); ctx.fillStyle = XRAY; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(80,170,210,.18)'; ctx.lineWidth = 2; for (let gx = -R; gx <= R; gx += 22) { ctx.beginPath(); ctx.moveTo(x + gx, y - R); ctx.lineTo(x + gx, y + R); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - R, y + gx); ctx.lineTo(x + R, y + gx); ctx.stroke(); }
    inner(ctx);
    ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(x, y, wr * 0.86, -2.75, -1.75); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, wr, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    if (ticker) K.chip(ctx, ticker, x, y - R * 0.88, { s: 17, fill: C.ink, c: C.card, a: 'center', ls: 2, w: 700 });
  }

  // 2.1 Tokenized equity — two identical $MCORP tokens; the x-ray finds a share in one and a sticky note in the other
  SC['L2.1'] = (ctx, S) => {
    const L = S.sc.labels, R = 132, cy = 502, xs = [891, 1491]; S.noteTo = [1491, 496];
    const [shareBig, shareName] = String(L.share).split(' · ');
    const b0 = 1.2, b1 = 2.85, bx = K.lerp(640, 1752, E.inOutSine(S.lin(b0, b1 - b0))), scanning = S.bt >= b0;
    const inner = [
      (c) => cert(c, xs[0], cy + 4, 164, 106, { name: shareName || '', big: shareBig }),
      (c) => I.sticky(c, xs[1], cy + 4, 120, { text: L.promise, ts: 0.24, tilt: -0.08 }),
    ];
    // "=" between them: same ticker... until it isn't
    const eq = S.at(0.9, 0.4), neq = S.lin(2.9, 0.25);
    K.txt(ctx, 'SAME TICKER', 1191, cy - 72, { f: 'mono', s: 17, w: 700, c: C.ink3, a: 'center', ls: 3, alpha: eq * (1 - neq) });
    K.txt(ctx, '=', 1191, cy + 40, { f: 'display', s: 120, w: 900, c: neq > 0 ? C.red : C.ink3, a: 'center', alpha: eq });
    if (neq > 0) {
      K.line(ctx, 1191 + 24, cy - 44, K.lerp(1191 + 24, 1191 - 24, neq), K.lerp(cy - 44, cy + 40, neq), { lw: 9, c: C.red });
      K.txt(ctx, 'DIFFERENT INSIDE', 1191, cy + 88, { f: 'mono', s: 17, w: 700, c: C.red, a: 'center', ls: 2, alpha: S.at(2.95, 0.3) });
    }
    xs.forEach((x, k) => {
      const p = S.pop(0.3 + k * 0.2); if (p <= 0) return;
      ctx.save(); ctx.translate(x, cy); ctx.scale(p, p); ctx.translate(-x, -cy);
      ctx.save(); if (scanning) { ctx.beginPath(); ctx.rect(bx, 0, 1920, 1080); ctx.clip(); } bigCoin(ctx, x, cy, R, { label: L.ticker }); ctx.restore();
      if (scanning && bx > x - R - 14) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, bx, 1080); ctx.clip(); glassCoin(ctx, x, cy, R, inner[k], L.ticker); ctx.restore(); }
      ctx.restore();
    });
    // the scanner beam
    if (scanning && S.bt < b1 + 0.6) {
      ctx.save(); ctx.globalAlpha = 1 - S.at(b1, 0.5);
      const g = ctx.createLinearGradient(bx - 170, 0, bx, 0); g.addColorStop(0, 'rgba(70,190,255,0)'); g.addColorStop(1, 'rgba(70,190,255,.30)');
      ctx.fillStyle = g; ctx.fillRect(bx - 170, 348, 170, 322);
      ctx.fillStyle = 'rgba(40,175,245,.95)'; ctx.fillRect(bx - 2.5, 340, 5, 336);
      K.box(ctx, bx - 52, 306, 104, 34, { r: 8, fill: '#0D2236', stroke: C.ink, lw: 3 });
      K.txt(ctx, 'X-RAY', bx, 330, { f: 'mono', s: 17, w: 700, c: '#8FE3FF', a: 'center', ls: 3 });
      ctx.restore();
    }
    // verdicts
    verdict(ctx, xs[0] + R * 0.76, cy - R * 0.76, S.pop(2.4, 0.4), true);
    verdict(ctx, xs[1] + R * 0.76, cy - R * 0.76, S.pop(2.9, 0.4), false);
    const va = S.at(2.4, 0.35), vb = S.at(2.9, 0.35);
    label(ctx, L.a, xs[0], cy + R + 62, { s: 24, c: C.green, alpha: va });
    label(ctx, L.aSub || 'real share · held by a custodian', xs[0], cy + R + 96, { s: 18, w: 600, ls: 1, c: C.ink2, alpha: va });
    label(ctx, L.b, xs[1], cy + R + 62, { s: 24, c: C.red, alpha: vb });
    label(ctx, L.bSub || 'no share · just a promise', xs[1], cy + R + 96, { s: 18, w: 600, ls: 1, c: C.ink2, alpha: vb });
  };

  // tumbleweed (deterministic scribble ball)
  function tumbleweed(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
    const rnd = K.rand(42);
    for (let i = 0; i < 18; i++) {
      const a0 = rnd() * 6.3, len = 1.2 + rnd() * 2.2, rr = r * (0.35 + rnd() * 0.6), ox = (rnd() - 0.5) * r * 0.5, oy = (rnd() - 0.5) * r * 0.5;
      ctx.beginPath(); ctx.arc(ox, oy, rr, a0, a0 + len); ctx.lineWidth = i % 3 ? 3 : 4; ctx.strokeStyle = i % 3 ? '#A57E45' : '#6E5230'; ctx.stroke();
    }
    ctx.restore();
  }

  // 2.2 Three types — native / custodial / synthetic, each token wired to what's really behind it
  SC['L2.2'] = (ctx, S) => {
    const L = S.sc.labels, xs = [790, 1191, 1592], coinY = 396, objY = 584, t = S.t; S.noteTo = [1592, 590];
    const starts = [0.3, 1.3, 2.3], caps = [L.native, L.custodial, L.synthetic];
    // SHAREHOLDER frame lands on NATIVE (drawn first, behind)
    const fb = S.pop(4.4, 0.45);
    if (fb > 0) {
      ctx.save(); ctx.translate(xs[0], 530); ctx.scale(K.lerp(1.06, 1, K.clamp(fb)), K.lerp(1.06, 1, K.clamp(fb))); ctx.globalAlpha = K.clamp(fb);
      K.box(ctx, -178, -238, 356, 476, { r: 24, fill: 'rgba(14,159,110,.07)', stroke: C.green, lw: 4.5 });
      ctx.restore();
    }
    xs.forEach((x, k) => {
      const b = starts[k], p = S.pop(b); if (p <= 0) return;
      const ha = S.at(b, 0.3);
      label(ctx, L.cols[k], x, 334, { s: 24, ls: 5, alpha: ha });
      ctx.save(); ctx.translate(x, coinY); ctx.scale(p, p); K.coin(ctx, 0, 0, 42, {}); ctx.restore();
      // wire
      const wp = S.at(b + 0.15, 0.4), y0 = coinY + 50, y1 = objY - (k === 0 ? 82 : k === 1 ? 84 : 84);
      if (wp > 0) {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = k === 2 ? C.ink3 : C.ink;
        ctx.setLineDash(k === 0 ? [] : k === 1 ? [14, 10] : [2, 11]);
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, K.lerp(y0, y1, wp)); ctx.stroke(); ctx.restore();
      }
      const op = S.pop(b + 0.35);
      if (op > 0) {
        ctx.save(); ctx.translate(x, objY); ctx.scale(op, op); ctx.translate(-x, -objY);
        if (k === 0) { // the company's own share register, with YOU in it
          const w = 240, h = 156, x0 = x - w / 2, y0r = objY - h / 2;
          K.box(ctx, x0, y0r, w, h, { r: 12, fill: C.card, stroke: C.ink, lw: 4.5 });
          ctx.save(); K.rr(ctx, x0, y0r, w, h, 12); ctx.clip(); ctx.fillStyle = C.ink; ctx.fillRect(x0, y0r, w, 36); ctx.restore();
          K.txt(ctx, 'SHARE REGISTER', x, y0r + 24, { f: 'mono', s: 15, w: 700, c: C.card, a: 'center', ls: 2 });
          const youP = S.at(b + 0.6, 0.35);
          for (let i = 0; i < 4; i++) {
            const yy = y0r + 58 + i * 27;
            if (i === 1) { K.marker(ctx, x0 + 12, yy - 19, 150, 27, youP, 'rgba(255,98,0,.25)'); K.txt(ctx, 'YOU', x0 + 22, yy + 2, { f: 'mono', s: 20, w: 700, c: C.orange2, ls: 3 }); K.txt(ctx, '10', x0 + w - 22, yy + 2, { f: 'mono', s: 18, w: 700, c: C.orange2, a: 'right' }); }
            else { K.line(ctx, x0 + 22, yy - 5, x0 + 22 + [96, 0, 120, 84][i], yy - 5, { lw: 5, c: C.line2 }); K.line(ctx, x0 + w - 56, yy - 5, x0 + w - 22, yy - 5, { lw: 5, c: C.line2 }); }
          }
        } else if (k === 1) { // a regulated custodian holding the real share
          I.bank(ctx, x, objY - 6, 164, {});
          cert(ctx, x, objY + 14, 86, 56, { lw: 3.5 });
        } else { // nothing behind it: an empty slot where a share would be
          ctx.save(); ctx.setLineDash([12, 9]); K.box(ctx, x - 104, objY - 78, 208, 156, { r: 12, fill: 'rgba(32,26,19,.025)', stroke: C.ink3, lw: 4 }); ctx.restore();
          K.txt(ctx, 'no share', x, objY - 34, { f: 'mono', s: 17, w: 700, c: C.ink3, a: 'center', ls: 3 });
        }
        ctx.restore();
      }
      const ca = S.at(b + 0.45, 0.4);
      if (ca > 0) caption(ctx, wrapLines(ctx, caps[k], 330, { f: 'mono', s: 18, w: 600, ls: 0.5 }), x, 712, { alpha: ca });
    });
    // the oracle beams a price at the synthetic token
    const orP = S.pop(2.55);
    if (orP > 0) {
      ctx.save(); ctx.translate(1468, 416); ctx.scale(orP, orP); I.antenna(ctx, 0, 0, 96, { waves: (t * 0.9) % 1 }); ctx.restore();
      K.txt(ctx, 'ORACLE', 1440, 494, { f: 'mono', s: 17, w: 700, c: C.ink3, a: 'center', ls: 3, alpha: orP });
    }
    // tumbleweed rolls into the empty slot
    const tw = S.lin(3.2, 0.9);
    if (tw > 0) {
      const u = E.outCubic(tw), x = K.lerp(1860, 1640, u), gy = 652, r = 30, hop = Math.abs(Math.sin(tw * Math.PI * 3)) * 30 * (1 - tw);
      ctx.save(); ctx.globalAlpha = 0.16 * (1 - hop / 40); ctx.beginPath(); ctx.ellipse(x, gy, 24, 5, 0, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = K.clamp(tw * 6); tumbleweed(ctx, x, gy - r - hop, r, -(1860 - x) / r); ctx.restore();
    }
    // the SHAREHOLDER badge
    if (fb > 0) { ctx.save(); ctx.translate(xs[0], 768); ctx.scale(fb, fb); K.chip(ctx, '✓ SHAREHOLDER', 0, 0, { s: 22, fill: C.green, c: C.card, a: 'center', w: 700, ls: 3 }); ctx.restore(); }
  };

  // passport: kind 0 = US + accredited star, 1 = US, 2 = non-US
  function star(ctx, x, y, r, fill) {
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.18); ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function passport(ctx, x, y, s, kind, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const w = s * 0.74, h = s;
    ctx.fillStyle = 'rgba(32,26,19,.14)'; K.rr(ctx, -w / 2 + 4, -h / 2 + 5, w, h, s * 0.08); ctx.fill();
    K.box(ctx, -w / 2, -h / 2, w, h, { r: s * 0.08, fill: kind === 2 ? '#8A2638' : '#24427A', stroke: C.ink, lw: Math.max(2.5, s * 0.055) });
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-w / 2 + s * 0.08, -h / 2 + 3, s * 0.05, h - 6);
    const gc = C.goldLite;
    ctx.lineWidth = Math.max(1.5, s * 0.035); ctx.strokeStyle = gc;
    ctx.beginPath(); ctx.arc(0, -h * 0.1, s * 0.17, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -h * 0.1, s * 0.075, s * 0.17, 0, 0, 7); ctx.moveTo(-s * 0.17, -h * 0.1); ctx.lineTo(s * 0.17, -h * 0.1); ctx.stroke();
    K.txt(ctx, kind === 2 ? 'NON-US' : 'US', 0, h * 0.34, { f: 'display', s: s * (kind === 2 ? 0.17 : 0.22), w: 900, st: 'condensed', c: gc, a: 'center', ls: 1 });
    if (kind === 0) star(ctx, w * 0.4, -h * 0.42, s * 0.24, C.gold);
    ctx.restore();
  }

  // 2.3 The wrapper decides who can buy — one share, three rulebooks, passports sorted at the door
  SC['L2.3'] = (ctx, S) => {
    const L = S.sc.labels, xs = [830, 1191, 1552], dy = 506, ds = 236, py = 312; S.noteTo = [1191, 610];
    const rule = { f: 'mono', s: 18, w: 600, ls: 0.5 };
    xs.forEach((x, k) => {
      const p = S.pop([0.3, 0.8, 1.3][k]); if (p <= 0) return;
      ctx.save(); ctx.translate(x, dy); ctx.scale(p, p); ctx.translate(-x, -dy);
      I.door(ctx, x, dy, ds, { open: 0 });
      K.coin(ctx, x, dy - 58, 27, {});
      // rule plaque above the door
      K.box(ctx, x - 92, py, 184, 52, { r: 10, fill: C.card, stroke: C.ink, lw: 4 });
      K.txt(ctx, L.doors[k][0], x, py + 40, { f: 'display', s: 36, w: 900, st: 'semi-condensed', c: C.ink, a: 'center', ls: 1 });
      ctx.restore();
      caption(ctx, fragLines(ctx, L.doors[k][1], 330, rule), x, 694, { alpha: S.at([0.3, 0.8, 1.3][k] + 0.2, 0.4) });
    });
    // passports: a mixed pile of buyers, sorted into the door each one is allowed through
    const P = [ // [kind, door, wave, dx, dy, rot]
      [0, 0, 0, -34, 0, -0.14], [1, 1, 0, -32, 2, -0.1], [0, 0, 0, 32, 6, 0.1], [1, 1, 0, 34, 6, 0.12],
      [2, 2, 1, -34, 2, -0.12], [2, 2, 1, 32, 6, 0.1],
    ];
    const pileP = S.pop(1.8, 0.45);
    P.forEach(([kind, door, wave, ox, oy, rot], i) => {
      const sx = 1191 + (i - 2.5) * 30, sy = 764 + (i % 2) * 4, srot = (i - 2.5) * 0.12;
      const fl = S.at(2.4 + wave * 0.4 + (i % 2) * 0.07 + (wave ? 0 : Math.floor(i / 2) * 0.03), 0.55, E.inOutCubic);
      const ex = xs[door] + ox, ey = 604 + oy;
      let x, y, r, s;
      if (fl <= 0) { if (pileP <= 0) return; x = sx; y = sy; r = srot; s = 60 * pileP; }
      else { const cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 170; x = (1 - fl) * (1 - fl) * sx + 2 * (1 - fl) * fl * cx + fl * fl * ex; y = (1 - fl) * (1 - fl) * sy + 2 * (1 - fl) * fl * cy + fl * fl * ey; r = K.lerp(srot, rot, fl) + Math.sin(fl * Math.PI) * 0.9 * (door === 0 ? -1 : 1); s = K.lerp(60, 78, fl); }
      if (s > 0) passport(ctx, x, y, s, kind, r);
    });
  };

  // a hanging "closed" sign
  function hangSign(ctx, x, y, txt, sw) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, 26); ctx.moveTo(0, 0); ctx.lineTo(30, 26); ctx.stroke();
    K.box(ctx, -46, 24, 92, 34, { r: 6, fill: C.card, stroke: C.ink, lw: 3 });
    K.txt(ctx, txt, 0, 47, { f: 'mono', s: 15, w: 700, c: C.red, a: 'center', ls: 2 });
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
    ctx.restore();
  }

  // 2.4 Voting vs corporate actions — the vote passes through; the merger happens behind a closed door
  SC['L2.4'] = (ctx, S) => {
    const L = S.sc.labels, bx = 825, by = 590, dx = 1668, dyy = 566; S.noteTo = [1420, 600];
    // LEFT: a token drops its ballot in the box
    const bp = S.pop(0.1);
    if (bp > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(bp, bp); I.ballot(ctx, 0, 0, 220, {}); ctx.restore(); }
    const tokP = S.pop(0.4), drop = S.at(0.55, 0.45, E.inOutCubic);
    if (tokP > 0) {
      const ty = K.lerp(368, 420, drop) - bump(S, 1.0, 0.4) * 10;
      // ballot slip: hangs under the token, then slides into the slot (clipped at the slot)
      const sy = ty + 74 + drop * 74;
      ctx.save(); ctx.beginPath(); ctx.rect(bx - 120, 250, 240, 533 - 250); ctx.clip();
      ctx.save(); ctx.translate(bx, sy); ctx.rotate(-0.04 * (1 - drop)); ctx.scale(tokP, tokP);
      K.box(ctx, -34, -40, 68, 80, { r: 5, fill: C.card, stroke: C.ink, lw: 4 });
      K.check(ctx, 0, -6, 40, 1, C.ink, 6);
      ctx.restore(); ctx.restore();
      ctx.save(); ctx.translate(bx, ty); ctx.scale(tokP, tokP); I.mascot(ctx, 0, 0, 50, { mood: 'happy' }); ctx.restore();
    }
    verdict(ctx, bx + 104, by - 52, S.pop(1.0, 0.4), true, 34);
    const va = S.at(1.0, 0.35);
    label(ctx, L.vote.replace(/^VOTE\s*✓\s*/i, '').toUpperCase(), bx, 742, { s: 24, c: C.green, ls: 4, alpha: va });
    // divider
    ctx.save(); ctx.globalAlpha = S.at(1.3, 0.4); ctx.setLineDash([8, 10]); K.line(ctx, 1070, 318, 1070, 770, { lw: 2.5, c: C.line2 }); ctx.restore();
    // RIGHT: corporate actions; the merger slams in, holders knock on a closed door
    const ca = S.at(1.4, 0.4);
    const acts = L.actions, chipS = 18; let cx0 = 0; const ws = acts.map((a) => K.measure(ctx, a, { f: 'mono', s: chipS, w: 700, ls: 1 }) + chipS * 1.5);
    const tot = ws.reduce((a, b) => a + b, 0) + 14 * (acts.length - 1); cx0 = 1438 - tot / 2;
    const boom = S.pop(2.0, 0.35);
    label(ctx, 'CORPORATE ACTIONS', 1438, 312, { s: 16, c: C.ink3, ls: 4, alpha: ca });
    acts.forEach((a, i) => {
      const hot = a === 'merger' && boom > 0, x = cx0 + ws[i] / 2;
      ctx.save(); ctx.globalAlpha = ca * (boom > 0 && !hot ? 0.55 : 1);
      K.chip(ctx, a, x, 346, { s: chipS, a: 'center', fill: hot ? C.red : C.card, c: hot ? C.card : C.ink2, stroke: hot ? C.ink : C.line2, lw: 3, w: 700, ls: 1 });
      ctx.restore();
      cx0 += ws[i] + 14;
    });
    // door (closed, stays closed)
    const knockShake = (bump(S, 2.8, 0.18) + bump(S, 3.2, 0.18)) * 3;
    const dp = S.pop(1.5);
    if (dp > 0) {
      ctx.save(); ctx.translate(dx + knockShake, dyy); ctx.scale(dp, dp);
      I.door(ctx, 0, 0, 230, { open: 0 });
      K.box(ctx, -50, -60, 100, 30, { r: 5, fill: C.card, stroke: C.ink, lw: 3 });
      K.txt(ctx, 'ELECTIONS', 0, -39, { f: 'mono', s: 13, w: 700, c: C.ink, a: 'center', ls: 1 });
      hangSign(ctx, 34, 4, 'CLOSED', Math.sin(S.t * 3.1) * 0.06 + knockShake * 0.02);
      ctx.restore();
    }
    // MERGER banner slams in above the door
    if (boom > 0) {
      const sl = K.lerp(1.7, 1, E.outExpo(K.clamp(S.since(2.0) / 0.2)));
      ctx.save(); ctx.translate(dx - 6, 418); ctx.rotate(-0.05); ctx.scale(sl, sl); ctx.globalAlpha = K.clamp(S.since(2.0) / 0.08);
      K.box(ctx, -128, -32, 256, 64, { r: 8, fill: C.red, stroke: C.ink, lw: 4.5 });
      K.txt(ctx, 'MERGER', 0, 18, { f: 'display', s: 50, w: 900, st: 'semi-condensed', c: C.card, a: 'center', ls: 3 });
      ctx.restore();
    }
    // three token holders outside, knocking
    const hx = [1300, 1418, 1536], fills = [C.blue, C.teal, C.violet];
    hx.forEach((x, i) => {
      const p = S.pop(1.7 + i * 0.12); if (p <= 0) return;
      const kx = i === 2 ? (bump(S, 2.8, 0.22) + bump(S, 3.2, 0.22)) * 26 : 0, hop = i === 1 ? bump(S, 3.0, 0.3) * 8 : 0;
      ctx.save(); ctx.translate(x + kx, 640 - hop); ctx.scale(p, p);
      I.person(ctx, 0, 0, 120, { fill: fills[i] });
      K.coin(ctx, 26, 30, 17, {});
      ctx.restore();
      const q = S.pop([2.85, 3.0, 3.25][i], 0.4);
      if (q > 0) {
        ctx.save(); ctx.translate(x + kx - 4, 540); ctx.scale(q, q);
        K.bubble(ctx, -28, -34, 56, 56, -6, 30, { lw: 3.5 });
        K.txt(ctx, '?', 0, 12, { f: 'display', s: 40, w: 900, c: C.orange, a: 'center' });
        ctx.restore();
      }
    });
    // knock marks on the door edge
    for (const kb of [2.8, 3.2]) {
      const k = K.clamp(bump(S, kb + 0.02, 0.4) * 2); if (k <= 0) continue;
      ctx.save(); ctx.globalAlpha = k; ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
      for (const a of [-2.5, -2.05, -1.6]) { ctx.beginPath(); ctx.moveTo(1590 + Math.cos(a) * 14, 566 + Math.sin(a) * 14); ctx.lineTo(1590 + Math.cos(a) * 34, 566 + Math.sin(a) * 34); ctx.stroke(); }
      ctx.restore();
    }
    label(ctx, 'token holders', 1418, 744, { s: 18, w: 600, ls: 1, c: C.ink2, alpha: S.at(1.9, 0.4) });
  };
})();
