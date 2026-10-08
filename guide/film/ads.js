/* ads.js — the five commercial breaks: a retro TV infomercial series, "BORING FINANCE vs RWAs, ONCHAIN".
   window.ADS.draw(ctx, sc, t, api): sc.ad = { parts, copy } from script/ads.json, sc.cues = [[beat, sfx]];
   t = seconds into the ad; api = { K, C, E, BEAT, W, H, I, rig }. The engine adds the TV framing
   (CRT switch-on or channel static over the first 0.35 s, CRT switch-off over the last 0.6 s).

   One format, five villains (every spot follows its parts, so picture and music switch together):
     boring  : black-and-white "old footage" of a TradFi villain. Animation on twelves, film grain, flicker,
               gate weave, dust and a sepia vignette; captions in an old serif caption box (CAPS = emphasis).
               Wally plays the frustrated customer.
     switch  : the "There's a better way!" starburst (the first colour on screen); colour floods in through a
               wobbly iris from its centre (on the tada cue).
     onchain : the bright cream stage. Wally the spokes-elephant does his gag, bold display type, then
               THE FINE PRINT: a tiny disclaimer that zooms up on the click cue (the fine print is the lesson).
     slate   : the orange end card: kicker, tagline, url. The fine print stays on as the legal line.
   copy.onchain[0] = the product headline ('. ' splits lines), copy.onchain[1..] = claims.
   Pure function of t (frames render in any order), deterministic, static art cached per device scale. */
(function () {
  'use strict';
  const W = 1920, H = 1080, OLD_FPS = 12;
  const CREAM = '#FBF8F1', INK = '#201A13', ORANGE = '#FF6200', ORANGE2 = '#D85300', YELLOW = '#FFE24A', GREEN = '#0E9F6E';
  let K, C, I, RIG, BEAT = 60 / 84;

  // ================================================================== math
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const ramp = (t, a, d) => clamp((t - a) / d);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const eOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const eInOut = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const eIn = (u) => { u = clamp(u); return u * u * u; };
  const back = (u, s = 1.5) => { u = clamp(u); return u <= 0 ? 0 : u >= 1 ? 1 : 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  const env = (t, a, up, hold, down) => Math.min(ramp(t, a, up), 1 - ramp(t, a + up + hold, down));
  const old = (t) => Math.floor(t * OLD_FPS + 1e-6) / OLD_FPS; // the old-footage clock: animation on twelves
  const bump = (t, a, d) => { const u = (t - a) / d; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

  // ================================================================== caches (per device scale; dropped when it changes)
  const caches = {}; let cacheK = 0, KS = 1; // KS = the canvas scale, read once per frame before any local transform
  const devScale = (ctx) => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; };
  function cached(ctx, key, w, h, draw, grey) {
    const k = KS;
    if (Math.abs(k - cacheK) > 1e-3) { for (const id in caches) delete caches[id]; cacheK = k; }
    if (caches[key]) return caches[key];
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); draw(x);
    if (grey) greyify(c, grey === 'alpha');
    caches[key] = c; return c;
  }
  // black-and-white by the 'saturation' blend (works everywhere canvas does, unlike ctx.filter)
  function greyify(c, keepAlpha) {
    const x = c.getContext('2d'); let tmp = null;
    if (keepAlpha) { tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height; tmp.getContext('2d').drawImage(c, 0, 0); }
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'saturation'; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    if (tmp) { x.globalCompositeOperation = 'destination-in'; x.drawImage(tmp, 0, 0); }
    x.restore();
  }
  // desaturate a region of the (opaque) frame: for Wally's coloured books/props inside the old footage
  function desat(ctx, x, y, w, h) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); ctx.restore(); }

  // ================================================================== text helpers
  const st = (o) => ({ f: o.f || 'serif', s: o.s || 40, w: o.w || 400, i: o.i, st: o.st, ls: o.ls });
  const segW = (ctx, g, o) => K.measure(ctx, g.t, st(Object.assign({}, o, g)));
  // one line of mixed styles on a baseline; returns the width
  function rich(ctx, segs, x, y, o = {}) {
    const ws = segs.map((g) => (g.t ? segW(ctx, g, o) : 0)), tot = ws.reduce((a, b) => a + b, 0);
    let cx = o.a === 'center' ? x - tot / 2 : o.a === 'right' ? x - tot : x;
    segs.forEach((g, k) => {
      if (!g.t) return;
      const s = Object.assign({}, o, g, { a: 'left' });
      K.txt(ctx, g.t, cx, y + (g.dy || 0), s);
      if (g.u) { ctx.save(); ctx.globalAlpha *= s.alpha === undefined ? 1 : s.alpha; ctx.fillStyle = s.c || INK; ctx.fillRect(cx + 2, y + s.s * 0.13, ws[k] - 4, Math.max(2.5, s.s * 0.06)); ctx.restore(); }
      cx += ws[k];
    });
    return tot;
  }
  const richW = (ctx, segs, o = {}) => segs.reduce((a, g) => a + (g.t ? segW(ctx, g, o) : 0), 0);
  // CAPS words (YOU, DAYS) become italic + underlined: the old announcer's emphasis
  function emph(str) {
    const out = [], re = /\b([A-Z]{2,})\b/g; let last = 0, m;
    while ((m = re.exec(str))) { if (m.index > last) out.push({ t: str.slice(last, m.index) }); out.push({ t: m[1], i: true, u: true }); last = m.index + m[1].length; }
    if (last < str.length) out.push({ t: str.slice(last) });
    return out;
  }
  // display type with an ink outline and an offset ink shadow
  function outlined(ctx, s, x, y, o) {
    K.font(ctx, o.f || 'display', o.s, o.w || 900, o.i, o.st === undefined ? 'semi-condensed' : o.st); if (o.ls) K.track(ctx, o.ls);
    ctx.textAlign = o.a || 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.shadow) { ctx.fillStyle = o.shadowC || INK; ctx.fillText(s, x + o.shadow, y + o.shadow); if (o.lw) { ctx.lineWidth = o.lw; ctx.strokeStyle = o.shadowC || INK; ctx.strokeText(s, x + o.shadow, y + o.shadow); } }
    if (o.lw) { ctx.lineWidth = o.lw; ctx.strokeStyle = o.stroke || INK; ctx.strokeText(s, x, y); }
    ctx.fillStyle = o.c || CREAM; ctx.fillText(s, x, y);
    if (o.ls) K.track(ctx, 0);
  }
  function popAt(ctx, x, y, k, fn) { if (k <= 0.001) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); fn(); ctx.restore(); }

  // ================================================================== Wally helpers (2D rig only; the glint is never animated)
  function rigPt(p, px, py) { // a point in the rig's head space -> screen (mirrors WallyRig.draw's transform chain)
    const s = p.s || 1, hr = p.headRot || 0, rot = p.rot || 0, sq = p.squash || 0, bob = p.bob || 0;
    let x = px - 250, y = py - 250, c = Math.cos(hr), si = Math.sin(hr);
    const hx = 250 + x * c - y * si, hy = 250 + x * si + y * c - bob;
    x = (hx - 250) * (1 + sq * 0.5); y = (hy - 591) * (1 - sq); c = Math.cos(rot); si = Math.sin(rot);
    const bx = 250 + x * c - y * si, by = 591 + x * si + y * c;
    return { x: (p.x || 0) + (bx - 250) * s * (p.flip ? -1 : 1), y: (p.y || 0) + (by - 591) * s };
  }
  function tipOf(p) { // trunk grip point + pointing direction, on screen
    const g = RIG.trunkGeom(p.trunk || {}), sp = g.spine, tip = sp[sp.length - 1], prev = sp[sp.length - 4];
    const G = rigPt(p, tip.x - Math.cos(tip.ang) * 10, tip.y - Math.sin(tip.ang) * 10);
    return { x: G.x, y: G.y, dir: Math.atan2(tip.y - prev.y, tip.x - prev.x) + (p.headRot || 0) + (p.rot || 0) };
  }
  function aimPointer(p, tx, ty, o = {}) { // point the stick at a screen target (length capped: it's a stick, not a laser)
    const G = tipOf(p), a = Math.atan2(ty - G.y, tx - G.x) - (p.headRot || 0) - (p.rot || 0);
    return { kind: 'pointer', a, len: clamp((Math.hypot(tx - G.x, ty - G.y) - (o.gap || 8)) / (p.s || 1), o.min || 120, o.max || 300), show: o.show };
  }
  function bwWally(ctx, pose, pad = 0) { const p = wally(ctx, pose), s = p.s || 1; desat(ctx, p.x - 280 * s - pad, p.y - 640 * s - pad, 560 * s + pad * 2, 652 * s + pad * 2); return p; }
  function aimMag(p, tx, ty) { const G = tipOf(p); return { kind: 'magnifier', a: Math.atan2(ty - G.y, tx - G.x) - (p.headRot || 0) - (p.rot || 0), len: clamp(Math.hypot(tx - G.x, ty - G.y) / (p.s || 1) - 52, 50, 330) }; }
  function wally(ctx, pose) { const p = Object.assign({}, pose); if (p.skate) p.y -= 52 * p.s; RIG.draw(ctx, p); return p; }
  function addPose(p, d, k = 1) {
    for (const key in d) {
      if (key === 'trunk') { p.trunk = Object.assign({}, p.trunk); for (const q in d.trunk) p.trunk[q] = (p.trunk[q] || (q === 'len' ? 1 : 0)) + d.trunk[q] * k; }
      else if (typeof d[key] === 'number') p[key] = (p[key] || 0) + d[key] * k;
    }
    return p;
  }
  function shadow(ctx, x, y, w, a = 0.13) { ctx.save(); ctx.fillStyle = `rgba(32,26,19,${a})`; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.1, 0, 0, 7); ctx.fill(); ctx.restore(); }

  // ================================================================== timing (from the parts and cues in ads.json)
  function timing(sc) {
    const P = {}; for (const [n, a, b] of sc.ad.parts) P[n] = [a * BEAT, b * BEAT];
    const cues = sc.cues || [];
    const cue = (name, i = 0, dflt = null) => { const c = cues.filter((q) => q[1] === name); return c.length ? c[Math.min(i, c.length - 1)][0] * BEAT : dflt; };
    const A = { id: sc.id, dur: sc.dur, P, cue, copy: sc.ad.copy || {} };
    A.b1 = P.boring ? P.boring[1] : 2; A.sw0 = P.switch ? P.switch[0] : A.b1; A.on0 = P.onchain ? P.onchain[0] : A.sw0 + 0.4;
    A.on1 = P.onchain ? P.onchain[1] : A.dur - 1.5; A.sl0 = P.slate ? P.slate[0] : A.on1;
    A.whoosh = cue('whoosh', 0, A.sw0); A.tada = cue('tada', 0, A.sw0 + 0.2);
    A.irisT0 = A.tada - 0.04; A.irisT1 = A.irisT0 + 0.62;
    A.fineZ = cue('click', 0, A.on1 - 1.0); A.fineT0 = A.fineZ - 0.32;
    A.irisX = W / 2; A.irisY = 470;
    A.burstOut = A.irisT1 - 0.08; A.head = A.burstOut + 0.2; // the copy only arrives once the starburst has gone
    return A;
  }

  // ================================================================== the old-footage look
  let grainTiles = null;
  function grain(ctx, t) {
    if (!grainTiles) {
      grainTiles = [];
      for (let k = 0; k < 4; k++) {
        const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256), d = id.data, r = K.rand(91 + k * 13);
        for (let i = 0; i < d.length; i += 4) {
          const v = r(); let a, g;
          if (v < 0.11) { g = 22; a = 26 + r() * 40; } else if (v > 0.95) { g = 255; a = 20 + r() * 34; } else continue;
          d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = a;
        }
        x.putImageData(id, 0, 0); grainTiles.push(c);
      }
    }
    const fi = Math.floor(t * 24), tile = grainTiles[fi % 4], ox = Math.floor(hash(fi * 3.7) * 256), oy = Math.floor(hash(fi * 5.3) * 256);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -ox, -oy); // unscaled device-pixel pattern: cheap
    ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(ox, oy, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
  function weave(ctx, t) { // the slightly wobbly projector gate
    const fi = Math.floor(t * OLD_FPS), dx = (hash(fi * 3.1) - 0.5) * 5, dy = (hash(fi * 7.3) - 0.5) * 6;
    ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate((hash(fi * 1.9) - 0.5) * 0.004); ctx.scale(1.016, 1.016); ctx.translate(-W / 2, -H / 2);
  }
  function filmLook(ctx, t) {
    const fi = Math.floor(t * 24);
    const vig = cached(ctx, 'vig', W, H, (x) => {
      const g = x.createRadialGradient(W * 0.5, H * 0.46, H * 0.18, W * 0.5, H * 0.5, H * 1.04);
      g.addColorStop(0, '#FAF0DC'); g.addColorStop(0.45, '#EEDFC3'); g.addColorStop(0.78, '#C2AD8A'); g.addColorStop(1, '#5A4630');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(vig, 0, 0, W, H); ctx.restore();
    ctx.fillStyle = `rgba(24,16,8,${0.02 + 0.035 * hash(fi * 1.31)})`; ctx.fillRect(0, 0, W, H); // flicker (gentle: no strobe)
    grain(ctx, t);
    const r = K.rand(1000 + fi); ctx.save();
    for (let i = 0, n = 3 + Math.floor(r() * 5); i < n; i++) { // dust
      const x = r() * W, y = r() * H, rad = 1.2 + r() * 3.4, light = r() < 0.35;
      ctx.fillStyle = light ? 'rgba(255,250,238,.6)' : 'rgba(24,17,10,.6)'; ctx.beginPath(); ctx.ellipse(x, y, rad, rad * (0.5 + r() * 0.9), r() * 3, 0, 7); ctx.fill();
    }
    const rs = K.rand(500 + Math.floor(t * 5)); // a scratch that lives for a few frames
    if (rs() < 0.55) { const x = rs() * W, dark = rs() < 0.5; ctx.strokeStyle = dark ? 'rgba(30,22,12,.28)' : 'rgba(255,250,240,.32)'; ctx.lineWidth = 1 + rs() * 1.4; ctx.beginPath(); ctx.moveTo(x, -10); ctx.bezierCurveTo(x + (rs() - 0.5) * 12, H * 0.3, x + (rs() - 0.5) * 12, H * 0.7, x + (rs() - 0.5) * 16, H + 10); ctx.stroke(); }
    const hs = Math.floor(t * 2.5); if (hash(hs * 9.7) < 0.3) { // a hair in the gate
      const hx = hash(hs * 2.1) < 0.5 ? 90 + hash(hs) * 260 : W - 90 - hash(hs) * 260, hy = hash(hs * 4.4) < 0.5 ? 70 : H - 70;
      ctx.strokeStyle = 'rgba(20,14,8,.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, hy);
      for (let k = 1; k <= 14; k++) ctx.lineTo(hx + k * 7, hy + Math.sin(k * 0.9 + hs) * 16 * (hy < H / 2 ? 1 : -1));
      ctx.stroke();
    }
    ctx.restore();
  }
  // the old serif caption box (lower third); lines = strings, CAPS words get the announcer's emphasis
  function captionBox(ctx, lines, o = {}) {
    if (!lines.length) return;
    const size = o.s || 52, lh = size * 1.3, cx = W / 2, bottom = o.bottom || 1026, font = { f: 'serif', s: size, w: 600, c: '#F3EDE1' };
    const segs = lines.map(emph), bw = Math.max(...segs.map((sg) => richW(ctx, sg, font))) + 132, bh = lines.length * lh + 56;
    const x0 = cx - bw / 2, y0 = bottom - bh;
    ctx.save();
    ctx.fillStyle = 'rgba(12,10,7,.93)'; ctx.fillRect(x0, y0, bw, bh);
    ctx.strokeStyle = '#EDE6D8'; ctx.lineWidth = 3; ctx.strokeRect(x0 + 10, y0 + 10, bw - 20, bh - 20);
    ctx.lineWidth = 1.3; ctx.strokeRect(x0 + 18, y0 + 18, bw - 36, bh - 36);
    ctx.fillStyle = '#EDE6D8';
    for (const [dx, dy] of [[18, 18], [bw - 18, 18], [18, bh - 18], [bw - 18, bh - 18]]) { ctx.save(); ctx.translate(x0 + dx, y0 + dy); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore(); }
    segs.forEach((sg, k) => rich(ctx, sg, cx, y0 + 28 + size * 0.98 + k * lh, Object.assign({ a: 'center' }, font)));
    ctx.restore();
  }
  // the little station ID in the corner of the old footage
  function bug(ctx) {
    ctx.save(); ctx.translate(176, 74);
    ctx.beginPath(); ctx.ellipse(0, 0, 138, 34, 0, 0, 7); ctx.fillStyle = 'rgba(20,16,12,.78)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(240,233,220,.85)'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 128, 26, 0, 0, 7); ctx.lineWidth = 1; ctx.stroke();
    K.txt(ctx, 'BORING FINANCE™', 0, 8, { f: 'serif', s: 23, w: 700, c: '#F0E9DC', a: 'center', ls: 2.5 });
    ctx.restore();
  }

  // ================================================================== the switch: starburst + colour flood
  function starPath(ctx, R, n = 26, k = 0.84) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? R * k : R; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
  function starburst(ctx, A, t) {
    const t0 = A.whoosh, tOut = A.burstOut;
    if (t < t0 || t > tOut + 0.21) return;
    const pin = back((t - t0) / 0.34, 1.7), pout = eIn((t - tOut) / 0.2), k = pin * (1 + 0.6 * pout);
    if (k <= 0.001 || pout >= 1) return;
    ctx.save(); ctx.globalAlpha *= 1 - pout;
    const R = 318, wob = Math.sin((t - t0) * 9) * 0.035 * (1 - ramp(t, t0 + 0.4, 0.4));
    ctx.save(); ctx.translate(A.irisX, A.irisY); ctx.scale(k, k); ctx.rotate(lerp(-0.5, -0.06, pin) + wob + pout * 0.4);
    ctx.save(); ctx.rotate((t - t0) * 0.5); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round'; // speed rays
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + 0.2, r0 = R + 34 + (i % 2) * 18; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + 46), Math.sin(a) * (r0 + 46)); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(10, 12); starPath(ctx, R); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
    starPath(ctx, R); ctx.fillStyle = YELLOW; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.73, 0, 7); ctx.fillStyle = ORANGE; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.66, 0, 7); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([4, 10]); ctx.stroke(); ctx.setLineDash([]);
    const words = String(A.copy.switch || "There's a better way!").split(' '), l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '), l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    const s2 = K.fitSize(ctx, l2, R * 1.3, { f: 'display', s: 112, w: 900, st: 'semi-condensed' }), s1 = Math.min(s2 * 0.62, K.fitSize(ctx, l1, R * 1.2, { f: 'display', s: 74, w: 900, st: 'semi-condensed' }));
    outlined(ctx, l1, 0, -s2 * 0.42, { s: s1, a: 'center', c: CREAM, lw: 9, shadow: 5 });
    outlined(ctx, l2, 0, s2 * 0.55, { s: s2, a: 'center', c: CREAM, lw: 11, shadow: 7 });
    ctx.restore(); ctx.restore();
  }
  function irisR(A, t) { if (t < A.irisT0) return 0; if (t >= A.irisT1) return 9999; const u = (t - A.irisT0) / (A.irisT1 - A.irisT0); return 2250 * (0.55 * eInOut(u) + 0.45 * eOut(u)) + 8; }
  function irisPath(ctx, cx, cy, r, t) {
    ctx.beginPath(); const N = 90;
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, rr = r * (1 + 0.04 * Math.sin(a * 7 + t * 9) + 0.022 * Math.sin(a * 13 - t * 7)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
  }

  // ================================================================== the colour stage
  function rays(ctx, cx, cy, rot, fill, n = 20, R = 2600) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = fill; ctx.beginPath();
    for (let i = 0; i < n; i++) { const a0 = i * 2 * Math.PI / n, a1 = a0 + Math.PI / n; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R); ctx.closePath(); }
    ctx.fill(); ctx.restore();
  }
  function stage(ctx, t, cx = 420, cy = 600) {
    ctx.drawImage(K.paper(W, H), 0, 0, W, H);
    rays(ctx, cx, cy, t * 0.045, 'rgba(255,98,0,.055)');
    const g = ctx.createRadialGradient(cx, cy, 30, cx, cy, 600); g.addColorStop(0, 'rgba(255,206,110,.34)'); g.addColorStop(1, 'rgba(255,206,110,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 600, cy - 600, 1200, 1200);
    ctx.fillStyle = 'rgba(150,120,70,.07)'; ctx.fillRect(0, 994, W, H - 994); ctx.fillStyle = 'rgba(32,26,19,.13)'; ctx.fillRect(0, 992, W, 3);
  }
  const COL_X = 790; // the copy column on the colour stage
  function headline(ctx, str, x, y, size, t0, t, o = {}) {
    if (t < t0) return 0;
    const p = back((t - t0) / 0.42, 1.6), a = ramp(t, t0, 0.1), f = { f: 'display', s: size, w: 900, st: o.st || 'semi-condensed' };
    const sz = o.fit ? K.fitSize(ctx, str, o.fit, f) : size;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const k = lerp(0.8, 1, p); ctx.scale(k, k);
    K.txt(ctx, str, 4, 5, Object.assign({}, f, { s: sz, c: 'rgba(32,26,19,.12)' }));
    K.txt(ctx, str, 0, 0, Object.assign({}, f, { s: sz, c: o.c || INK }));
    ctx.restore(); return sz;
  }
  function claim(ctx, str, x, y, size, t0, t, o = {}) { // Lora bold italic, word by word; the '*' is orange
    if (t < t0) return;
    const f = { f: 'serif', s: size, w: 700, i: true };
    const sz = o.fit ? K.fitSize(ctx, str, o.fit, f) : size;
    const star = /\*$/.test(str), body = star ? str.slice(0, -1) : str;
    K.words(ctx, body, x, y, Object.assign({}, f, { s: sz, c: o.c || INK, t: t - t0, per: 0.055, fd: 0.3, rise: 16, maxW: 2000 }));
    if (star) { const bw = K.measure(ctx, body, Object.assign({}, f, { s: sz })), p = ramp(t, t0 + 0.2, 0.25), pulse = 1 + 0.5 * bump(t, o.pulse || 1e9, 0.5); popAt(ctx, x + bw + sz * 0.22, y - sz * 0.32, p * pulse, () => K.txt(ctx, '*', x + bw + sz * 0.22, y - sz * 0.32 + sz * 0.42, { f: 'display', s: sz * 1.1, w: 900, c: ORANGE, a: 'center' })); }
  }
  const sparkleStar = (ctx, x, y, r, k, c = YELLOW) => { if (k <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); };

  // ================================================================== THE FINE PRINT (the actual lesson)
  function splitFine(s) {
    const m = /^(\*?)\s*(.*?)\s*((?:See|see) (?:page|chapter) [\d–-]+\.?)?\s*$/.exec(s || '') || [];
    return { star: m[1] || '', body: (m[2] || s || '').trim(), ref: m[3] || '' };
  }
  function fineLayout(ctx, A, t) {
    const f = splitFine(A.copy.fine);
    const segs = (s) => [{ t: f.star ? '* ' : '', f: 'display', w: 900, s: s * 1.12, c: ORANGE, dy: s * 0.12 }, { t: f.body + (f.ref ? ' ' : ''), f: 'serif', w: 600, i: true, s, c: INK }, { t: f.ref, f: 'serif', w: 700, s, c: ORANGE2 }];
    let s1 = 36; while (s1 > 22 && richW(ctx, segs(s1)) > 1080) s1 -= 1;
    const z = back((t - A.fineZ) / 0.45, 1.25), s = lerp(15, s1, z);
    const tw = richW(ctx, segs(s)), tab = s * 1.85 * z, padX = 18 * z + 6, boxW = tw + tab + padX * 2, boxH = lerp(s * 1.5, s * 1.9, z);
    const toC = eInOut((t - A.sl0 - 0.05) / 0.5), x0 = lerp(A.fineX || 668, W / 2 - boxW / 2, toC), yC = A.fineY || 954;
    return { f, segs, z, s, tw, tab, padX, boxW, boxH, x0, yC, toC };
  }
  function finePrint(ctx, A, t) {
    if (!A.copy.fine || t < A.fineT0) return;
    const L = fineLayout(ctx, A, t), a = eOut((t - A.fineT0) / 0.22);
    ctx.save(); ctx.globalAlpha *= a;
    if (L.z > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(L.z * 1.5);
      K.box(ctx, L.x0 + 5, L.yC - L.boxH / 2 + 6, L.boxW, L.boxH, { r: L.boxH / 2, fill: 'rgba(32,26,19,.9)', stroke: null });
      K.box(ctx, L.x0, L.yC - L.boxH / 2, L.boxW, L.boxH, { r: L.boxH / 2, fill: '#FFFDF7', stroke: INK, lw: 3.5 });
      const r = L.boxH / 2 - 6, cx = L.x0 + 6 + r;
      ctx.beginPath(); ctx.arc(cx, L.yC, r, 0, 7); ctx.fillStyle = ORANGE; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      I.magnifier(ctx, cx + 1, L.yC + 1, r * 1.35, { ink: INK });
      ctx.restore();
    }
    rich(ctx, L.segs(L.s), L.x0 + L.tab + L.padX, L.yC + L.s * 0.36, { alpha: lerp(0.62, 1, clamp(L.z)) });
    ctx.restore();
  }

  // ================================================================== the slate
  function tagLines(s) { const m = String(s || '').match(/[^.!?]+[.!?]?/g) || [s]; return m.map((x) => x.trim()).filter(Boolean); }
  function slate(ctx, A, t, spot) {
    const u = t - A.sl0; if (u < 0) return;
    const sl = eOut(u / 0.36), y0 = (1 - sl) * (H + 60);
    ctx.save(); ctx.translate(0, y0);
    if (y0 > 1) { ctx.fillStyle = 'rgba(32,26,19,.25)'; ctx.fillRect(0, -14, W, 14); }
    ctx.fillStyle = ORANGE; ctx.fillRect(0, H - 4, W, 64);
    ctx.drawImage(cached(ctx, 'slateBg', W, H, (x) => { x.fillStyle = ORANGE; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, 520, 100, W / 2, 520, 1100); g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(1, 'rgba(150,40,0,.28)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }), 0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); rays(ctx, W / 2, 420, t * 0.05, 'rgba(255,214,90,.15)', 22); ctx.restore();
    const ka = ramp(u, 0.06, 0.22);
    K.txt(ctx, 'REAL-WORLD ASSETS  ·  ONCHAIN', W / 2, 196, { f: 'mono', s: 26, w: 700, c: INK, a: 'center', ls: 10, alpha: ka });
    ctx.save(); ctx.globalAlpha *= ka; ctx.fillStyle = INK; ctx.fillRect(W / 2 - 60, 222, 120, 4); ctx.restore();
    const lines = tagLines(A.copy.slate), n = lines.length;
    let size = 150; for (const ln of lines) size = Math.min(size, K.fitSize(ctx, ln, 1560, { f: 'display', s: 150, w: 900, st: 'semi-condensed' }));
    const lh = size * 1.06, top = n === 1 ? 472 : 432 - (n - 2) * lh * 0.5;
    lines.forEach((ln, i) => {
      const p = back((u - 0.08 - i * 0.1) / 0.4, 1.7); if (p <= 0) return;
      const y = top + i * lh;
      popAt(ctx, W / 2, y - size * 0.35, lerp(0.5, 1, p), () => outlined(ctx, ln, W / 2, y, { s: size, a: 'center', c: i % 2 ? INK : CREAM, stroke: INK, lw: i % 2 ? 0 : 10, shadow: i % 2 ? 0 : 8 }));
    });
    // the series sign-off
    const up = back((u - 0.42) / 0.4, 1.4);
    if (up > 0) {
      const y = top + (n - 1) * lh + 120, s = 30;
      const segs = [{ t: "Wally's RWA Textbook", f: 'serif', w: 700, i: true, s: 34, c: CREAM }, { t: '  ·  ', f: 'mono', w: 700, s, c: 'rgba(251,248,241,.6)' }, { t: 'rwaf.xyz/guide', f: 'mono', w: 700, s, c: YELLOW }];
      const tw = richW(ctx, segs), pw = tw + 150, ph = 76;
      popAt(ctx, W / 2, y, lerp(0.7, 1, up), () => {
        ctx.save(); ctx.globalAlpha *= clamp(up * 2);
        K.box(ctx, W / 2 - pw / 2 + 6, y - ph / 2 + 7, pw, ph, { r: ph / 2, fill: 'rgba(32,26,19,.35)', stroke: null });
        K.box(ctx, W / 2 - pw / 2, y - ph / 2, pw, ph, { r: ph / 2, fill: INK, stroke: null });
        K.coin(ctx, W / 2 - pw / 2 + 46, y - 2, 27, {});
        rich(ctx, segs, W / 2 + 26, y + 11, { a: 'center' });
        ctx.restore();
      });
    }
    // "AS SEEN IN THE TEXTBOOK": the series' only brag
    const sp = back((u - 0.55) / 0.45, 1.8);
    if (sp > 0) {
      ctx.save(); ctx.translate(1660, 214); ctx.rotate(0.16 + Math.sin(t * 2) * 0.03); ctx.scale(sp, sp);
      starPath(ctx, 112, 20, 0.86); ctx.fillStyle = YELLOW; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      K.txt(ctx, 'AS SEEN', 0, -24, { f: 'mono', s: 22, w: 800, c: INK, a: 'center', ls: 1 });
      K.txt(ctx, 'IN THE', 0, 4, { f: 'mono', s: 22, w: 800, c: INK, a: 'center', ls: 1 });
      K.txt(ctx, 'TEXTBOOK', 0, 33, { f: 'mono', s: 25, w: 800, c: ORANGE2, a: 'center', ls: 1 });
      ctx.restore();
    }
    // two coin mascots cheer in the other corner
    const mp = back((u - 0.3) / 0.4, 1.8);
    if (mp > 0) for (let i = 0; i < 2; i++) { const hop = Math.abs(Math.sin((u - 0.3) * 7 + i * 1.6)) * 22; mascot(ctx, 1690 + i * 104, 980 - hop - (i ? 0 : 14), (i ? 36 : 44) * mp, (i ? 0.2 : -0.12) + Math.sin(u * 6 + i) * 0.08, YELLOW); }
    // Wally signs off in the corner: glasses sparkle on the chime, then a toot
    const wa = eOut((u - 0.2) / 0.45);
    if (wa > 0) {
      const tt = u - 0.55, toot = bump(tt, 0, 1.1);
      const pose = { x: lerp(-120, 196, wa), y: 1012, s: 0.5, sparkle: bump(u, 0.35, 0.8) * 1.2, trunk: { bend: 0.7 * toot, lift: 0.75 * toot, curl: 0.6 * toot, len: 1 + 0.1 * toot }, bob: 14 * toot, headRot: 0.04 * toot };
      if (spot.slateWally) spot.slateWally(pose, u);
      shadow(ctx, pose.x, 1014, 100, 0.2); wally(ctx, pose);
    }
    ctx.restore();
  }

  // ================================================================== small props (drawn by ads.js, never in the rig)
  function stopwatch(ctx, x, y, s, u) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = s * 0.07; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    ctx.fillStyle = '#B9B4A8'; ctx.fillRect(-s * 0.09, -s * 0.62, s * 0.18, s * 0.16); ctx.strokeRect(-s * 0.09, -s * 0.62, s * 0.18, s * 0.16);
    ctx.beginPath(); ctx.arc(0, 0, s * 0.48, 0, 7); ctx.fillStyle = CREAM; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, s * 0.4, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2 * 0.25); ctx.closePath(); ctx.fillStyle = 'rgba(255,98,0,.3)'; ctx.fill();
    const a = -Math.PI / 2 + u * Math.PI * 2 * 0.25; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36); ctx.lineWidth = s * 0.07; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.06, 0, 7); ctx.fillStyle = ORANGE; ctx.fill();
    ctx.restore();
  }
  function openSign(ctx, x, y, s, glow) {
    ctx.save(); ctx.translate(x, y);
    K.box(ctx, -s * 0.62, -s * 0.36, s * 1.24, s * 0.72, { r: s * 0.12, fill: INK, stroke: INK, lw: s * 0.05 });
    if (glow > 0) { ctx.shadowColor = 'rgba(255,98,0,.9)'; ctx.shadowBlur = s * 0.25 * glow; }
    K.txt(ctx, 'OPEN', 0, -s * 0.02, { f: 'display', s: s * 0.34, w: 900, st: 'semi-condensed', c: lerp(0, 1, glow) > 0.5 ? '#FFB27A' : '#9A6A4A', a: 'center', ls: 2 });
    K.txt(ctx, '24/7', 0, s * 0.26, { f: 'mono', s: s * 0.2, w: 800, c: YELLOW, a: 'center', ls: 2 });
    ctx.restore();
  }
  function houseSlice(ctx, x, y, s) { // a slice of a house, served on a dinner plate
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.05; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.ellipse(0, s * 0.22, s * 0.62, s * 0.2, 0, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, s * 0.22, s * 0.44, s * 0.13, 0, 0, 7); ctx.lineWidth = s * 0.025; ctx.strokeStyle = 'rgba(32,26,19,.35)'; ctx.stroke();
    ctx.lineWidth = s * 0.05; ctx.strokeStyle = INK;
    // the slice: a wedge of wall with a roof on top (like cake)
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.2); ctx.lineTo(s * 0.3, s * 0.2); ctx.lineTo(s * 0.3, -s * 0.12); ctx.lineTo(-s * 0.3, -s * 0.12); ctx.closePath(); ctx.fillStyle = '#F3E2C7'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 0.1); ctx.lineTo(0, -s * 0.42); ctx.lineTo(s * 0.36, -s * 0.1); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-s * 0.08, -s * 0.04, s * 0.16, s * 0.15); ctx.fillStyle = '#BFD8EE'; ctx.fill(); ctx.lineWidth = s * 0.035; ctx.stroke();
    // a fork, ready
    ctx.save(); ctx.translate(s * 0.62, -s * 0.05); ctx.rotate(0.35); ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.moveTo(0, s * 0.34); ctx.lineTo(0, -s * 0.12); ctx.stroke();
    for (const dx of [-0.07, 0, 0.07]) { ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.1); ctx.lineTo(dx * s, -s * 0.28); ctx.lineWidth = s * 0.03; ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  function iconDisc(ctx, x, y, r, p, fn) { // bullet badge for a claim
    popAt(ctx, x, y, back(p, 1.8), () => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); fn(); });
  }
  function mascot(ctx, x, y, r, rot = 0, fill) { if (r <= 0.5) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); I.mascot(ctx, 0, 0, r, { mood: 'happy', fill }); ctx.restore(); }
  function goldToken(ctx, x, y, r, spin) { K.coin(ctx, x, y, r, { fill: C.gold, rim: C.goldDark, label: 'Au', labelC: '#6B4A12', spin }); }
  function handset(ctx, x, y, a, s, fill = '#2E2A26') { // an old telephone handset centred at x,y along angle a
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineJoin = 'round'; ctx.lineWidth = 5 * s; ctx.strokeStyle = INK; ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(-70 * s, -10 * s); ctx.quadraticCurveTo(0, -30 * s, 70 * s, -10 * s); ctx.lineTo(70 * s, 6 * s); ctx.quadraticCurveTo(0, -12 * s, -70 * s, 6 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 74 * s, 10 * s, 24 * s, 15 * s, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function musicNote(ctx, x, y, s, a, c = '#D9D2C4') {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * s, 8 * s, -0.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(10 * s, -2 * s); ctx.lineTo(10 * s, -42 * s); ctx.quadraticCurveTo(24 * s, -32 * s, 26 * s, -20 * s); ctx.stroke();
    ctx.restore();
  }

  // ================================================================== the B&W sets: shared architecture
  function column(x, cx, top, bot, w, light = '#E6DFD1', dark = '#9B917F') {
    x.fillStyle = light; x.fillRect(cx - w / 2, top + 50, w, bot - top - 80);
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(cx + w * 0.18, top + 50, w * 0.32, bot - top - 80);
    x.strokeStyle = dark; x.lineWidth = 2.5; for (let k = 1; k < 6; k++) { const xx = cx - w / 2 + k * w / 6; x.beginPath(); x.moveTo(xx, top + 58); x.lineTo(xx, bot - 38); x.stroke(); }
    x.fillStyle = light; x.fillRect(cx - w / 2 - 22, top, w + 44, 26); x.fillRect(cx - w / 2 - 10, top + 26, w + 20, 24);
    x.fillRect(cx - w / 2 - 14, bot - 30, w + 28, 14); x.fillRect(cx - w / 2 - 24, bot - 16, w + 48, 16);
    x.lineWidth = 3; x.strokeStyle = dark; x.strokeRect(cx - w / 2 - 22, top, w + 44, 26); x.strokeRect(cx - w / 2 - 10, top + 26, w + 20, 24); x.strokeRect(cx - w / 2, top + 50, w, bot - top - 80);
    x.strokeRect(cx - w / 2 - 14, bot - 30, w + 28, 14); x.strokeRect(cx - w / 2 - 24, bot - 16, w + 48, 16);
    for (const sx of [-1, 1]) { x.beginPath(); x.arc(cx + sx * (w / 2 + 6), top + 30, 12, 0, 7); x.fillStyle = light; x.fill(); x.stroke(); }
  }
  function clockFace(x, cx, cy, r, o = {}) {
    x.beginPath(); x.arc(cx, cy, r + 14, 0, 7); x.fillStyle = o.rim || '#4F473C'; x.fill();
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = o.face || '#F4EFE4'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#2B2620'; x.stroke();
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, l = i % 5 ? 0.06 : 0.14; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92); x.lineTo(cx + Math.cos(a) * r * (0.92 - l), cy + Math.sin(a) * r * (0.92 - l)); x.lineWidth = i % 5 ? 1.5 : 4; x.stroke(); }
    const R = ['XII', 'III', 'VI', 'IX']; R.forEach((n, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; K.txt(x, n, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62 + r * 0.09, { f: 'serif', s: r * 0.22, w: 700, c: '#2B2620', a: 'center' }); });
  }
  function clockHands(ctx, cx, cy, r, hours) {
    const am = (hours % 1) * Math.PI * 2 - Math.PI / 2, ah = (hours % 12) / 12 * Math.PI * 2 - Math.PI / 2;
    ctx.save(); ctx.strokeStyle = '#1E1A15'; ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.075; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ah) * r * 0.5, cy + Math.sin(ah) * r * 0.5); ctx.stroke();
    ctx.lineWidth = r * 0.045; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(am) * r * 0.78, cy + Math.sin(am) * r * 0.78); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.07, 0, 7); ctx.fillStyle = '#1E1A15'; ctx.fill(); ctx.restore();
  }
  function hangSign(ctx, x, y, w, h, a, lines, o = {}) { // a board on two strings, swinging about its hook
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = '#2B2620'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-w * 0.32, o.drop || 60); ctx.moveTo(0, 0); ctx.lineTo(w * 0.32, o.drop || 60); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fillStyle = '#2B2620'; ctx.fill();
    ctx.translate(0, (o.drop || 60) + h / 2);
    K.box(ctx, -w / 2, -h / 2, w, h, { r: 8, fill: o.fill || '#F1ECE2', stroke: '#2B2620', lw: 4 });
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#2B2620'; ctx.strokeRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18);
    lines.forEach((ln, i) => K.txt(ctx, ln.t, 0, ln.y, { f: ln.f || 'display', s: ln.s, w: ln.w || 900, st: ln.st || 'semi-condensed', c: o.ink || '#1E1A15', a: 'center', ls: ln.ls || 2 }));
    ctx.restore();
  }

  // =================================================================================================
  // AD0 — "THE WAIT": the cold open. A bank lobby, a weekend in time-lapse, a trade stuck at PENDING.
  // Colour: Wally skates in with his pointer; three claims with icon badges; he taps the fine print.
  // =================================================================================================
  const LOBBY = { win: [292, 196, 276, 384], clock: [836, 286, 98], cal: [846, 540], cage: [1020, 1572], counterY: 652, floor: 862, bench: 772 };
  function lobbyBg(x) {
    x.fillStyle = '#D6CDBC'; x.fillRect(0, 0, W, H);
    // wallpaper stripes
    x.fillStyle = 'rgba(0,0,0,.035)'; for (let i = 0; i < 40; i++) x.fillRect(i * 52, 150, 22, 520);
    // lintel
    x.fillStyle = '#E9E2D4'; x.fillRect(0, 0, W, 136); x.fillStyle = '#8F8472'; x.fillRect(0, 136, W, 8); x.fillRect(0, 120, W, 3);
    x.fillStyle = '#BDB2A0'; for (let i = 0; i < 70; i++) x.fillRect(i * 28 + 6, 144, 15, 13);
    K.txt(x, 'FIRST BORING BANK & TRUST', W / 2 + 120, 88, { f: 'serif', s: 50, w: 700, c: '#4B4337', a: 'center', ls: 12 });
    // wainscot + floor
    x.fillStyle = '#B7AC98'; x.fillRect(0, 668, W, 194); x.fillStyle = '#8C8170'; x.fillRect(0, 662, W, 8);
    x.strokeStyle = '#8C8170'; x.lineWidth = 3; for (let i = 0; i < 12; i++) x.strokeRect(i * 168 + 20, 700, 128, 128);
    x.fillStyle = '#9A8F7C'; x.fillRect(0, LOBBY.floor, W, H - LOBBY.floor);
    x.strokeStyle = 'rgba(40,30,20,.25)'; x.lineWidth = 2; for (let i = -12; i < 30; i++) { x.beginPath(); x.moveTo(i * 120, LOBBY.floor); x.lineTo(i * 120 - 260, H); x.stroke(); }
    for (const yy of [900, 960, 1040]) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
    // columns
    column(x, 120, 160, LOBBY.floor + 6, 132); column(x, 1800, 160, LOBBY.floor + 6, 132);
    // the clock face (hands are animated)
    const [ccx, ccy, cr] = LOBBY.clock; clockFace(x, ccx, ccy, cr);
    // teller cage
    const [c0, c1] = LOBBY.cage;
    x.fillStyle = '#6F5B45'; x.fillRect(c0, 206, c1 - c0, LOBBY.counterY - 206);
    x.fillStyle = '#2F2922'; x.fillRect(c0 + 34, 300, c1 - c0 - 68, LOBBY.counterY - 300);
    x.fillStyle = '#26211B'; x.fillRect(c0 + 60, 222, c1 - c0 - 120, 60); x.strokeStyle = '#C9B98F'; x.lineWidth = 3; x.strokeRect(c0 + 66, 228, c1 - c0 - 132, 48);
    K.txt(x, 'SETTLEMENTS', (c0 + c1) / 2, 266, { f: 'serif', s: 36, w: 700, c: '#E5D7B0', a: 'center', ls: 9 });
    // counter
    x.fillStyle = '#5E4C39'; x.fillRect(c0 - 24, LOBBY.counterY, c1 - c0 + 48, 24);
    x.fillStyle = '#7C6650'; x.fillRect(c0 - 8, LOBBY.counterY + 24, c1 - c0 + 16, LOBBY.floor - LOBBY.counterY - 24);
    x.strokeStyle = '#4A3B2C'; x.lineWidth = 3; for (let i = 0; i < 3; i++) x.strokeRect(c0 + 22 + i * ((c1 - c0 - 30) / 3), LOBBY.counterY + 52, (c1 - c0 - 30) / 3 - 20, 120);
    // hours plaque
    x.fillStyle = '#E9E0C8'; x.fillRect((c0 + c1) / 2 - 190, 712, 380, 96); x.strokeStyle = '#2B2620'; x.lineWidth = 3; x.strokeRect((c0 + c1) / 2 - 190, 712, 380, 96); x.strokeRect((c0 + c1) / 2 - 182, 720, 364, 80);
    K.txt(x, 'BANKING HOURS', (c0 + c1) / 2, 750, { f: 'serif', s: 24, w: 700, c: '#2B2620', a: 'center', ls: 5 });
    K.txt(x, '9 TO 5 · MON TO FRI', (c0 + c1) / 2, 786, { f: 'serif', s: 26, w: 700, i: true, c: '#2B2620', a: 'center', ls: 1 });
    // the waiting bench
    x.fillStyle = '#6F5B45'; x.strokeStyle = '#2B2620'; x.lineWidth = 4;
    x.fillRect(330, LOBBY.bench, 420, 26); x.strokeRect(330, LOBBY.bench, 420, 26);
    x.fillRect(318, LOBBY.bench - 120, 18, 146); x.strokeRect(318, LOBBY.bench - 120, 18, 146); x.fillRect(744, LOBBY.bench - 120, 18, 146); x.strokeRect(744, LOBBY.bench - 120, 18, 146);
    for (const lx of [350, 714]) { x.fillRect(lx, LOBBY.bench + 26, 18, LOBBY.floor - LOBBY.bench - 26); x.strokeRect(lx, LOBBY.bench + 26, 18, LOBBY.floor - LOBBY.bench - 26); }
    x.fillStyle = '#8A7560'; x.fillRect(336, LOBBY.bench - 100, 408, 22); x.strokeRect(336, LOBBY.bench - 100, 408, 22);
  }
  function lobbySky(ctx, state, tb) {
    const [x, y, w, h] = LOBBY.win, r = w / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.clip();
    const sky = { dusk: ['#9C9488', '#CFC6B6'], day: ['#EDE9E0', '#F7F4EE'], night: ['#26231F', '#3E3A33'], morning: ['#DAD3C6', '#F2EDE3'] }[state];
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (state === 'night') {
      ctx.fillStyle = '#F2EEE4'; const r2 = K.rand(77); for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(x + r2() * w, y + r2() * h * 0.8, 1.5 + r2() * 2, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.arc(x + w * 0.62, y + h * 0.3, 40, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + w * 0.62 + 18, y + h * 0.3 - 10, 36, 0, 7); ctx.fillStyle = sky[0]; ctx.fill();
    } else {
      const sp = { dusk: [0.82, 0.78], day: [0.5, 0.22], morning: [0.22, 0.62] }[state];
      ctx.beginPath(); ctx.arc(x + w * sp[0], y + h * sp[1], 46, 0, 7); ctx.fillStyle = state === 'dusk' ? '#8E8576' : '#FFFFFF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; for (const [cx, cy, s] of [[0.3, 0.55, 1], [0.75, 0.42, 0.8]]) { ctx.beginPath(); ctx.ellipse(x + w * cx, y + h * cy, 54 * s, 20 * s, 0, 0, 7); ctx.ellipse(x + w * cx + 30 * s, y + h * cy - 14 * s, 34 * s, 22 * s, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(80,70,60,.35)'; ctx.fillRect(x, y + h - 70, w, 70); // rooftops
      for (let i = 0; i < 6; i++) ctx.fillRect(x + i * 52 - 10, y + h - 100 - (i % 3) * 22, 36, 60);
    }
    ctx.restore();
    // frame + mullions
    ctx.save(); ctx.strokeStyle = '#4F463A'; ctx.lineWidth = 16; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + r, y + h); ctx.moveTo(x, y + h * 0.55); ctx.lineTo(x + w, y + h * 0.55); ctx.stroke();
    ctx.fillStyle = '#6B6052'; ctx.fillRect(x - 22, y + h, w + 44, 20); ctx.restore();
  }
  function ad0Boring(ctx, A, tb) {
    ctx.drawImage(cached(ctx, 'lobby', W, H, lobbyBg, true), 0, 0, W, H);
    const T = [A.cue('tick', 0, 0.43), A.cue('tick', 1, 0.79), A.cue('tick', 2, 1.14)], day = T.filter((x) => tb >= x).length;
    lobbySky(ctx, ['dusk', 'night', 'day', 'morning'][day], tb);
    // the clock whirls through the weekend
    const HRS = [17, 36, 60, 81]; let hrs = HRS[day];
    if (day > 0 && tb < T[day - 1] + 0.3) hrs = lerp(HRS[day - 1], HRS[day], eInOut((tb - T[day - 1]) / 0.3));
    if (day === 3) hrs = 81 + Math.floor((tb - T[2]) * 2) / 60;
    const [ccx, ccy, cr] = LOBBY.clock; clockHands(ctx, ccx, ccy, cr, hrs);
    const whirl = day > 0 && tb < T[day - 1] + 0.3; if (whirl) { ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(ccx, ccy, cr * 0.78, 0, 7); ctx.fillStyle = '#2B2620'; ctx.fill(); ctx.restore(); }
    // tear-off calendar
    const [kx, ky] = LOBBY.cal, DAYS = ['FRI', 'SAT', 'SUN', 'MON'];
    ctx.save(); ctx.translate(kx, ky);
    K.box(ctx, -82, -88, 164, 176, { r: 6, fill: '#F4EFE4', stroke: '#2B2620', lw: 4 });
    ctx.fillStyle = '#3A332B'; ctx.fillRect(-82, -88, 164, 42); for (const rx of [-40, 40]) { ctx.beginPath(); ctx.arc(rx, -92, 8, 0, 7); ctx.fillStyle = '#8E8576'; ctx.fill(); ctx.stroke(); }
    K.txt(ctx, 'OCTOBER', 0, -58, { f: 'mono', s: 18, w: 700, c: '#EDE6D8', a: 'center', ls: 3 });
    // one size for every day, fitted to the widest name (MON) so nothing spills past the page edges
    const ds = K.fitSize(ctx, 'MON', 128, { f: 'serif', s: 78, w: 700 });
    K.txt(ctx, DAYS[day], 0, 21 + ds * 0.36, { f: 'serif', s: ds, w: 700, c: '#2B2620', a: 'center' });
    if (day > 0 && tb < T[day - 1] + 0.25) { // the old page flies off
      const u = (tb - T[day - 1]) / 0.25; ctx.save(); ctx.translate(30 * u, -46 - 120 * u); ctx.rotate(-0.9 * u); ctx.globalAlpha = 1 - u;
      K.box(ctx, -82, 0, 164, 134, { r: 6, fill: '#FAF7F0', stroke: '#2B2620', lw: 3 }); K.txt(ctx, DAYS[day - 1], 0, 67 + ds * 0.36, { f: 'serif', s: ds, w: 700, c: '#2B2620', a: 'center' }); ctx.restore();
    }
    ctx.restore();
    // CLOSED, in the teller window
    const sad = A.cue('sadtrombone', 0, 3.07), sw = 0.16 * Math.sin(tb * 6.5) * Math.exp(-tb * 1.1) + 0.12 * Math.sin((tb - sad) * 7) * Math.exp(-(tb - sad) * 1.6) * (tb > sad ? 1 : 0);
    hangSign(ctx, 1296, 300, 300, 120, sw, [{ t: 'CLOSED', s: 74, y: 26 }], { drop: 44 });
    // PENDING (even on Monday)
    const stp = A.cue('stamp', 0, 2.57);
    if (tb >= stp) K.stamp(ctx, 'PENDING', 1290, 560, { p: clamp((tb - stp) / 0.17), s: 80, c: '#EFE8DA', rot: -0.1, seed: 4, alpha: 1 });
    // a droopy office plant
    const droop = lerp(0.25, 1, ramp(tb, 0.4, 2.6)) + 0.25 * ramp(tb, sad, 0.4);
    ctx.save(); ctx.translate(948, LOBBY.floor); ctx.lineWidth = 4; ctx.strokeStyle = '#2B2620'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-46, -92); ctx.lineTo(46, -92); ctx.lineTo(34, 0); ctx.lineTo(-34, 0); ctx.closePath(); ctx.fillStyle = '#7A6E5E'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -92); ctx.quadraticCurveTo(6, -170, 10 + 40 * droop, -200 + 70 * droop); ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = lerp(-1.9 + i * 0.6, 1.2 + (i % 2) * 0.5, droop * 0.8), bx = i < 3 ? 2 : 8 + 30 * droop, by = i < 3 ? -130 - i * 20 : -180 + 60 * droop;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(32, 0, 34, 11, 0, 0, 7); ctx.fillStyle = '#A9A08F'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    // the snail mail, crawling along the counter
    const snail = cached(ctx, 'snailMail', 220, 170, (x) => { I.snail(x, 110, 105, 150, {}); I.doc(x, 120, 30, 64, { rot: 0.12, title: 'TRADE', lines: true }); }, 'alpha');
    ctx.drawImage(snail, 1500 - tb * 16, LOBBY.counterY - 140, 220, 170);
    // Wally, waiting on his textbooks: a yawn, then the slump
    const yawn = A.cue('yawn', 0, 1.86), yw = env(tb, yawn, 0.25, 0.4, 0.3), sl = ramp(tb, sad, 0.3);
    const pose = { x: 540, y: LOBBY.bench, s: 0.66, seated: 1, trunk: { bend: 0.04 + 0.03 * Math.sin(tb * 2.2), lift: 0, len: 1.03 }, headRot: -0.03, earL: -0.05, earR: -0.05 };
    addPose(pose, { trunk: { lift: 1.15, curl: 0.55, bend: 0.25 }, headRot: 0.1, squash: -0.05, bob: 12, earL: 0.12, earR: 0.12 }, yw);
    addPose(pose, { trunk: { len: 0.07, bend: -0.04 }, headRot: -0.07, squash: 0.06, bob: -10, earL: -0.14, earR: -0.14 }, sl);
    bwWally(ctx, pose);
    if (yw > 0.3) { ctx.save(); ctx.globalAlpha = Math.min(1, (yw - 0.3) / 0.4); ctx.translate(250, 352); ctx.rotate(-0.12); K.txt(ctx, 'yaaawn', 0, 0, { f: 'serif', s: 40, w: 600, i: true, c: '#1E1A15', a: 'center' }); ctx.restore(); }
    // a spider moves in
    const sp = ramp(tb, T[1] + 0.1, 0.5); if (sp > 0) { const sy = lerp(150, 372, eOut(sp)) + Math.sin(tb * 5) * 7; I.spider(ctx, 392, sy, 86, { len: sy - 150 }); }
  }
  function ad0Colour(ctx, A, t) {
    stage(ctx, t, 420, 600);
    const arrive = A.tada + 0.02, arr = eOut((t - arrive) / 0.8), kick = bump(t, arrive + 0.72, 0.42);
    const rollX = Math.sin(t * 2.1) * 6 * ramp(t, arrive + 1.1, 0.5);
    const pose = { x: lerp(-360, 418, arr) + rollX, y: 992, s: 0.9, skate: { tilt: -0.07 * (1 - arr) - 0.2 * kick }, rot: -0.04 * (1 - arr), bob: 24 * kick, trunk: { bend: 0.2, lift: 0.18 } };
    addPose(pose, { sparkle: 1.15 }, bump(t, A.cue('sparkle', 0, 4.5), 0.9));
    // the claims (on the ding / pop / coin cues)
    const on = A.copy.onchain || [], head = tagLines(on[0] || ''), claims = on.slice(1);
    const tc = [A.cue('ding', 0, 5.0), A.cue('pop', 0, 5.54), A.cue('coin', 0, 6.07)];
    const t0 = A.head;
    headline(ctx, head[0] || '', COL_X, 258, 92, t0, t, { fit: 1000 });
    headline(ctx, head[1] || '', COL_X, 384, 136, t0 + 0.3, t, { c: ORANGE, fit: 1000 });
    for (const [dx, dy, r, d] of [[-24, -118, 26, 0.3], [600, -96, 20, 0.42], [632, 6, 14, 0.5]]) sparkleStar(ctx, COL_X + dx, 384 + dy, r, bump(t, t0 + d, 0.7));
    const rowY = [510, 610, 710];
    claims.slice(0, 3).forEach((c, k) => {
      const at = tc[k]; if (t < at - 0.05) return;
      iconDisc(ctx, COL_X + 44, rowY[k] - 16, 40, (t - at + 0.05) / 0.4, () => {
        if (k === 0) stopwatch(ctx, COL_X + 44, rowY[k] - 12, 52, ramp(t, at, 0.9));
        else if (k === 1) openSign(ctx, COL_X + 44, rowY[k] - 16, 58, ramp(t, at + 0.1, 0.3) * (0.85 + 0.15 * Math.sin(t * 11)));
        else houseSlice(ctx, COL_X + 42, rowY[k] - 14, 50);
      });
      claim(ctx, c, COL_X + 110, rowY[k], 50, at, t, { fit: 900, pulse: k === 0 ? A.fineZ : undefined });
    });
    // the pointer: up on arrival, at each claim, then two taps on the fine print
    const show = back((t - (arrive + 0.75)) / 0.3);
    const targets = [[t0, 1000, 210], [tc[0] - 0.1, COL_X + 44, rowY[0] - 16], [tc[1] - 0.1, COL_X + 44, rowY[1] - 16], [tc[2] - 0.1, COL_X + 44, rowY[2] - 16], [A.fineZ - 0.42, 700, 954]];
    let k = 0; while (k + 1 < targets.length && t >= targets[k + 1][0]) k++;
    const cur = targets[k], prevT = targets[Math.max(0, k - 1)], blend = eInOut((t - cur[0]) / 0.28);
    const tx = lerp(prevT[1], cur[1], k === 0 ? 1 : blend), ty = lerp(prevT[2], cur[2], k === 0 ? 1 : blend);
    const tap = k === targets.length - 1 ? Math.max(bump(t, A.fineZ - 0.2, 0.18), bump(t, A.fineZ, 0.18)) : 0;
    const finePose = k === targets.length - 1 ? eInOut((t - cur[0]) / 0.28) : 0;
    pose.trunk = { bend: lerp(0.62, 0.55, finePose), lift: lerp(0.3, 0.05, finePose) };
    pose.headRot = lerp(-0.03, 0.05, finePose);
    const fx = wallyFoot(pose);
    pose.prop = Object.assign(aimPointer(fx, tx - tap * 10, ty - 16 + tap * 18, { max: 300 }), { show });
    if (t < A.sl0) finePrint(ctx, A, t);
    shadow(ctx, pose.x, 996, 150, 0.12); wally(ctx, pose);
    // Wally's margin note on the fine print: the running joke, established once
    const nt = A.fineZ + 0.26; if (t > nt) K.note(ctx, 'the actual lesson', 1290, 866, { p: ramp(t, nt, 0.38), s: 56, rot: -0.05, c: ORANGE2, underline: true, to: [1160, 924], from: [1270, 880], bend: 40 });
  }
  function wallyFoot(pose) { const p = Object.assign({}, pose); if (p.skate) p.y -= 52 * p.s; return p; }

  // =================================================================================================
  // AD1 — "THE CLOSING BELL": Wally races the bell to the exchange; the gate wins. Colour: he juggles tokens.
  // =================================================================================================
  function exchangeBg(x) {
    const g = x.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#B8B2A6'); g.addColorStop(1, '#E2DCCF'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // pediment + entablature
    x.fillStyle = '#E6DFD1'; x.strokeStyle = '#7F7565'; x.lineWidth = 4; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(250, 214); x.lineTo(960, 40); x.lineTo(1670, 214); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(330, 196); x.lineTo(960, 66); x.lineTo(1590, 196); x.closePath(); x.lineWidth = 2; x.stroke();
    x.fillStyle = '#DCD4C4'; x.fillRect(236, 214, 1448, 92); x.lineWidth = 4; x.strokeRect(236, 214, 1448, 92);
    K.txt(x, 'STOCK EXCHANGE', 960, 280, { f: 'serif', s: 58, w: 700, c: '#4B4337', a: 'center', ls: 18 });
    clockFace(x, 960, 140, 44, { rim: '#6B6152' });
    // columns
    for (const cx of [330, 520, 710, 1210, 1400, 1590]) column(x, cx, 306, 790, 104);
    // the doorway
    x.fillStyle = '#3B342C'; x.fillRect(830, 420, 260, 370); x.strokeStyle = '#7F7565'; x.lineWidth = 6; x.strokeRect(830, 420, 260, 370);
    x.fillStyle = '#DCD4C4'; x.fillRect(812, 396, 296, 26); x.strokeRect(812, 396, 296, 26);
    // steps + street
    for (let i = 0; i < 3; i++) { x.fillStyle = ['#D2CABA', '#C5BCAB', '#B8AE9C'][i]; x.fillRect(-10, 790 + i * 30, W + 20, 30); x.strokeStyle = '#7F7565'; x.lineWidth = 2; x.strokeRect(-10, 790 + i * 30, W + 20, 30); }
    x.fillStyle = '#9B917F'; x.fillRect(0, 880, W, 200);
    // the bell bracket
    x.fillStyle = '#5B5348'; x.fillRect(1730, 330, 120, 16); x.fillRect(1836, 300, 16, 90);
  }
  function bell(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineWidth = 4; ctx.strokeStyle = '#1E1A15'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14 * s, 22 * s); ctx.quadraticCurveTo(-18 * s, 40 * s, -24 * s, 74 * s); ctx.quadraticCurveTo(-38 * s, 80 * s, -40 * s, 92 * s); ctx.lineTo(40 * s, 92 * s); ctx.quadraticCurveTo(38 * s, 80 * s, 24 * s, 74 * s); ctx.quadraticCurveTo(18 * s, 40 * s, 14 * s, 22 * s); ctx.closePath();
    ctx.fillStyle = '#B8AE9A'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 98 * s, 9 * s, 0, 7); ctx.fillStyle = '#4B4337'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function portcullis(ctx, x0, x1, top, bot, down) {
    const gy = lerp(top, bot, down); if (gy <= top + 2) return gy;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, gy - top + 30); ctx.clip();
    ctx.strokeStyle = '#25211C'; ctx.lineWidth = 11; ctx.lineCap = 'butt';
    for (let xx = x0 + 16; xx < x1; xx += 34) { ctx.beginPath(); ctx.moveTo(xx, top - 400); ctx.lineTo(xx, gy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xx - 7, gy); ctx.lineTo(xx, gy + 20); ctx.lineTo(xx + 7, gy); ctx.fillStyle = '#25211C'; ctx.fill(); }
    ctx.lineWidth = 9; for (let yy = gy - 40; yy > top - 400; yy -= 70) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); }
    ctx.restore(); return gy;
  }
  function ad1Boring(ctx, A, tb) {
    ctx.drawImage(cached(ctx, 'exchange', W, H, exchangeBg, true), 0, 0, W, H);
    clockHands(ctx, 960, 140, 44, 16 + Math.min(tb, 1.2) / 600);
    const tBell = A.cue('bell', 0, 0.39), tGate = A.cue('clunk', 0, 0.82), tBonk = A.cue('boing', 0, 1.0);
    const ring = tb >= tBell ? Math.sin((tb - tBell) * 26) * 0.35 * Math.exp(-(tb - tBell) * 1.6) : 0;
    bell(ctx, 1790, 346, 1.15, ring);
    if (tb >= tBell && tb < tBell + 1.3) { ctx.save(); ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const r = 70 + i * 24 + ((tb - tBell) * 80) % 24; ctx.beginPath(); ctx.arc(1790, 420, r, -2.6, -1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(1790, 420, r, -1.25, -0.55); ctx.stroke(); } ctx.restore(); K.txt(ctx, 'DING!', 1640, 300, { f: 'display', s: 54, w: 900, c: '#1E1A15', a: 'center', alpha: env(tb, tBell, 0.05, 0.9, 0.2) }); }
    // the gate drops on the clunk
    const dn = tb < tGate ? 0 : back((tb - tGate) / 0.14, 1.2);
    const gy = portcullis(ctx, 830, 1090, 420, 790, dn);
    if (dn > 0) hangSign(ctx, 960, gy - 300, 290, 104, Math.sin((tb - tGate) * 9) * 0.1 * Math.exp(-(tb - tGate) * 2), [{ t: 'CLOSED', s: 58, y: 22 }], { drop: 40 });
    // Wally rushes in with his share certificate... and meets the gate
    const walkEnd = tBonk, wx = tb < walkEnd ? lerp(-260, 684, clamp((tb - 0.05) / (walkEnd - 0.05))) : lerp(684, 650, eOut((tb - walkEnd) / 0.25));
    const walking = tb < walkEnd, dazed = ramp(tb, walkEnd, 0.12);
    const pose = { x: wx, y: 792, s: 0.62, rot: walking ? 0.07 * Math.sin(tb * 22) + 0.05 : -0.05 * dazed, bob: walking ? Math.abs(Math.sin(tb * 22)) * 16 : 0, trunk: { bend: 0.45, lift: 0.55 } };
    if (!walking) { const sq = Math.exp(-(tb - walkEnd) * 6) * Math.cos((tb - walkEnd) * 30) * 0.12; pose.squash = sq; addPose(pose, { trunk: { bend: -0.4, lift: -0.55, len: 0.06 }, headRot: -0.08, earL: -0.12, earR: -0.12 }, dazed); }
    bwWally(ctx, pose);
    // the certificate: in the trunk, then it flutters to the step
    const tp = tipOf(pose);
    let cx = tp.x + 30, cy = tp.y + 10, cr = tp.dir - 1.4;
    if (!walking) { const u = clamp((tb - walkEnd) / 0.55); cx = lerp(tp.x + 30, 540, u) + Math.sin(u * 9) * 30 * (1 - u); cy = lerp(tp.y - 40, 770, u) - Math.sin(u * Math.PI) * 120; cr = lerp(-0.4, 0.15, u) + Math.sin(u * 12) * 0.3 * (1 - u); }
    I.share(ctx, cx, cy, 92, { rot: cr }); desat(ctx, cx - 90, cy - 90, 180, 180);
    // dizzy stars
    if (!walking) { const hp = rigPt(pose, 250, 30); for (let i = 0; i < 3; i++) { const a = (tb - walkEnd) * 7 + i * 2.09; sparkleStar(ctx, hp.x + Math.cos(a) * 92, hp.y - 18 + Math.sin(a) * 24, 22, 1, '#F4EFE4'); } }
  }
  function ad1Colour(ctx, A, t) {
    stage(ctx, t, 420, 600);
    const on = A.copy.onchain || [], t0 = A.head;
    headline(ctx, on[0] || '', COL_X, 300, 120, t0, t, { fit: 1020 });
    claim(ctx, on[1] || '', COL_X + 4, 392, 54, t0 + 0.34, t, { fit: 1000, pulse: A.fineZ });
    // the hero: the globe, with share tokens in orbit (global reach)
    const gp = back((t - A.cue('pop', 0, 2.86)) / 0.45, 1.6), sp = A.cue('sparkle', 0, 3.14);
    const gx = 1330, gy = 668;
    const orbit = (i, front) => {
      const a = (t - sp) * 1.15 + i * Math.PI / 2, z = Math.sin(a); if ((z > 0) !== front) return;
      const ox = gx + Math.cos(a) * 330, oy = gy + Math.sin(a) * 92 - Math.cos(a) * 40, k = lerp(0.78, 1.08, (z + 1) / 2) * ramp(t, sp + i * 0.08, 0.3);
      if (k > 0) mascot(ctx, ox, oy, 40 * k, Math.sin(t * 5 + i) * 0.15);
    };
    if (gp > 0) {
      popAt(ctx, gx, gy, gp, () => {
        ctx.save(); ctx.strokeStyle = 'rgba(32,26,19,.25)'; ctx.lineWidth = 3; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.ellipse(gx, gy, 330, 100, -0.12, 0, 7); ctx.stroke(); ctx.restore();
        for (let i = 0; i < 4; i++) orbit(i, false);
        I.globe(ctx, gx, gy, 250, { spin: t * 0.18 });
        for (let i = 0; i < 4; i++) orbit(i, true);
      });
    }
    // Wally juggles share tokens the whole time; he glances at the fine print without dropping one
    // (the catch happens across the cut: on the slate he is balancing a token)
    const look = env(t, A.fineZ - 0.2, 0.25, 0.6, 0.3);
    const pose = { x: 418, y: 992, s: 0.9, bob: 4 * Math.abs(Math.sin(t * 5.2)), headRot: 0.07 * look };
    pose.trunk = { bend: 0.08, lift: 1.1 + Math.sin(t * 10.5) * 0.05 };
    pose.prop = { kind: 'juggle', t, h: 300, period: 1.2, dx: 150, show: ramp(t, A.tada, 0.4) };
    addPose(pose, { sparkle: 1.2 }, bump(t, A.fineZ, 0.8));
    if (t < A.sl0) finePrint(ctx, A, t);
    shadow(ctx, 418, 996, 150, 0.12); wally(ctx, pose);
  }

  // =================================================================================================
  // AD2 — "THE NIGHT SHIFT": the fund admin (a snail in an eyeshade) updates the spreadsheet overnight.
  // Colour: Wally sips his coffee while yield drips into a wallet, one coin a day.
  // =================================================================================================
  function officeBg(x) {
    x.fillStyle = '#7E7566'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 40; i++) x.fillRect(i * 56, 0, 26, 730);
    // window with the moon
    x.fillStyle = '#24211D'; x.fillRect(110, 130, 300, 300); x.fillStyle = '#F2EEE4'; x.beginPath(); x.arc(310, 225, 44, 0, 7); x.fill(); x.fillStyle = '#24211D'; x.beginPath(); x.arc(332, 212, 40, 0, 7); x.fill();
    const r = K.rand(5); x.fillStyle = '#E8E2D6'; for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(120 + r() * 280, 140 + r() * 280, 1.5 + r() * 2, 0, 7); x.fill(); }
    x.strokeStyle = '#3E372E'; x.lineWidth = 14; x.strokeRect(110, 130, 300, 300); x.lineWidth = 7; x.beginPath(); x.moveTo(260, 130); x.lineTo(260, 430); x.moveTo(110, 280); x.lineTo(410, 280); x.stroke();
    // the department door
    x.fillStyle = '#5E5548'; x.fillRect(1650, 180, 240, 550); x.fillStyle = '#C9C2B4'; x.fillRect(1678, 214, 184, 220); x.strokeStyle = '#2B2620'; x.lineWidth = 4; x.strokeRect(1678, 214, 184, 220); x.strokeRect(1650, 180, 240, 550);
    K.txt(x, 'FUND', 1770, 290, { f: 'serif', s: 30, w: 700, c: '#2B2620', a: 'center', ls: 6 }); K.txt(x, 'ADMIN', 1770, 330, { f: 'serif', s: 30, w: 700, c: '#2B2620', a: 'center', ls: 6 });
    K.txt(x, 'DEPT.', 1770, 370, { f: 'serif', s: 22, w: 700, i: true, c: '#2B2620', a: 'center', ls: 3 });
    x.beginPath(); x.arc(1680, 480, 9, 0, 7); x.fillStyle = '#B9B4A8'; x.fill(); x.stroke();
    // filing cabinet
    x.fillStyle = '#8E8576'; x.fillRect(1440, 400, 180, 330); x.strokeRect(1440, 400, 180, 330);
    for (let i = 0; i < 4; i++) { x.strokeRect(1454, 414 + i * 78, 152, 66); x.fillStyle = '#2B2620'; x.fillRect(1505, 438 + i * 78, 50, 10); x.fillStyle = '#F2EEE4'; x.fillRect(1507, 422 + i * 78, 46, 13); }
    // desk
    x.fillStyle = '#5A4A38'; x.fillRect(120, 720, 1540, 34); x.strokeRect(120, 720, 1540, 34);
    x.fillStyle = '#4A3C2D'; x.fillRect(150, 754, 330, 330); x.fillRect(1290, 754, 330, 330);
    for (let i = 0; i < 3; i++) { x.strokeRect(170, 772 + i * 96, 290, 80); x.strokeRect(1310, 772 + i * 96, 290, 80); }
    // paper towers at the far end of the desk
    for (let k = 0; k < 3; k++) for (let i = 0; i < 18 - k * 3; i++) { x.fillStyle = i % 2 ? '#E9E3D6' : '#D9D2C2'; x.fillRect(1290 + k * 52 + (i % 3) * 3, 704 - i * 15, 110 - k * 10, 15); x.lineWidth = 1; x.strokeStyle = 'rgba(40,32,24,.35)'; x.strokeRect(1290 + k * 52 + (i % 3) * 3, 704 - i * 15, 110 - k * 10, 15); }
    clockFace(x, 900, 160, 72);
  }
  function snailClerk(ctx, x, y, s, asleep, tb) { // a custom snail in an accountant's eyeshade
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(-130, -44, -92, -50); ctx.lineTo(70, -26); ctx.quadraticCurveTo(110, -10, 96, 0); ctx.closePath(); ctx.fillStyle = '#BDB5A6'; ctx.fill(); ctx.stroke();
    const droop = asleep * 0.9, st = Math.sin(tb * 3) * 0.05 * (1 - asleep);
    for (const [bx, len, a] of [[-104, 66, -1.9 + st + droop], [-88, 58, -1.6 + st + droop * 1.2]]) {
      const ex = bx + Math.cos(a) * len, ey = -46 + Math.sin(a) * len; ctx.beginPath(); ctx.moveTo(bx, -46); ctx.lineTo(ex, ey); ctx.stroke(); ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fillStyle = '#1E1A15'; ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(-150, -50); ctx.quadraticCurveTo(-118, -90, -64, -70); ctx.lineTo(-70, -48); ctx.quadraticCurveTo(-112, -60, -142, -38); ctx.closePath(); ctx.fillStyle = 'rgba(230,224,210,.75)'; ctx.fill(); ctx.stroke(); // the accountant's eyeshade
    ctx.beginPath(); ctx.moveTo(-70, -48); ctx.quadraticCurveTo(-96, -42, -112, -30); ctx.lineWidth = 6; ctx.stroke(); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(-2, -86, 64, 0, 7); ctx.fillStyle = '#9C9282'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 46; i++) { const a = i * 0.36, r = 52 * (1 - i / 50); ctx.lineTo(-2 + Math.cos(a) * r, -86 + Math.sin(a) * r); } ctx.lineWidth = 3.5; ctx.stroke();
    if (asleep < 0.5) { ctx.save(); ctx.translate(-128, -14); ctx.rotate(-0.5); ctx.fillStyle = '#E9E3D6'; ctx.fillRect(-6, -40, 12, 56); ctx.strokeRect(-6, -40, 12, 56); ctx.restore(); }
    ctx.restore();
  }
  function ad2Boring(ctx, A, tb) {
    ctx.drawImage(cached(ctx, 'office', W, H, officeBg, true), 0, 0, W, H);
    const t1 = A.cue('tick', 0, 0.39), t2 = A.cue('tick', 1, 0.75), tz = A.cue('snore', 0, 1.21);
    clockHands(ctx, 900, 160, 72, 2 + 47 / 60 + ((tb >= t1 ? 1 : 0) + (tb >= t2 ? 1 : 0)) / 60);
    // the banker's lamp and its pool of light
    ctx.save(); ctx.fillStyle = 'rgba(255,250,232,.2)'; ctx.beginPath(); ctx.moveTo(250, 586); ctx.lineTo(370, 586); ctx.lineTo(760, 722); ctx.lineTo(120, 722); ctx.closePath(); ctx.fill();
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(250, 720); ctx.lineTo(370, 720); ctx.lineTo(344, 694); ctx.lineTo(276, 694); ctx.closePath(); ctx.fillStyle = '#5B5348'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(310, 694); ctx.lineTo(310, 590); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(214, 600); ctx.quadraticCurveTo(310, 500, 406, 600); ctx.closePath(); ctx.fillStyle = '#6A665E'; ctx.fill(); ctx.stroke(); ctx.restore();
    // the spreadsheet ledger, open on the desk
    ctx.save(); ctx.translate(820, 650); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-470, 66); ctx.lineTo(470, 66); ctx.lineTo(446, -96); ctx.lineTo(-446, -96); ctx.closePath(); ctx.fillStyle = '#3F3327'; ctx.fill();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(sx * 452, 60); ctx.lineTo(sx * 430, -88); ctx.lineTo(0, -82); ctx.closePath(); ctx.fillStyle = '#F2EDE2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2B2620'; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(40,32,24,.38)'; ctx.lineWidth = 1.5; for (let i = 1; i < 8; i++) { const yy = -82 + i * 18; ctx.beginPath(); ctx.moveTo(-436 + i * 2, yy); ctx.lineTo(436 - i * 2, yy); ctx.stroke(); }
    for (let c = -8; c <= 8; c++) { if (!c) continue; ctx.beginPath(); ctx.moveTo(c * 52, -84); ctx.lineTo(c * 54, 58); ctx.stroke(); }
    const r = K.rand(12), cells = []; for (let c = 0; c < 8; c++) for (let w = 0; w < 7; w++) cells.push([c, w]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; } // one number per cell, never two in the same box
    for (const [c, w] of cells.slice(0, 34)) K.txt(ctx, String(Math.floor(r() * 900 + 100)), -420 + c * 52 + 6, -66 + w * 18 + 14, { f: 'hand', s: 19, w: 700, c: '#3A332B' });
    ctx.restore();
    // the fund admin inches along a row of the right page, pencil in hand, then nods off
    const asleep = ramp(tb, tz - 0.25, 0.3), sx = 1140 - Math.min(tb, tz - 0.25) * 40;
    ctx.save(); ctx.strokeStyle = 'rgba(250,246,236,.85)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + 100, 646); ctx.lineTo(1250, 646); ctx.stroke(); ctx.restore();
    snailClerk(ctx, sx, 650, 1.2, asleep, tb);
    if (asleep > 0) { ctx.save(); ctx.globalAlpha = asleep; I.zzz(ctx, sx - 30, 470, 190, tb * 1.4); ctx.restore(); }
  }
  function wallet(ctx, x, y, s, k) { // a friendly wallet with an orange flap
    popAt(ctx, x, y, k, () => { I.wallet(ctx, x, y, s, { fill: '#6B4E3A', flap: ORANGE }); });
  }
  function ad2Colour(ctx, A, t) {
    stage(ctx, t, 420, 600);
    const on = A.copy.onchain || [], t0 = A.head;
    headline(ctx, on[0] || '', COL_X, 300, 120, t0, t, { fit: 1020 });
    claim(ctx, on[1] || '', COL_X + 4, 392, 54, t0 + 0.34, t, { fit: 1000, pulse: A.fineZ });
    // the hero: the T-bill (wrapped as a token) pays into a wallet; the sun crosses once per coin: one a day
    const c1 = A.cue('coin', 0, 2.86), c2 = A.cue('coin', 1, 3.21), days = [c1, c2];
    const tk = back((t - (t0 - 0.05)) / 0.45, 1.6), wk = back((t - (t0 + 0.08)) / 0.45, 1.6), ak = ramp(t, t0 + 0.2, 0.35);
    const tx = 1030, ty = 690, wx = 1590, wy = 712, top = 500;
    const arc = (u) => ({ x: lerp(tx + 70, wx - 30, u), y: lerp(ty - 120, wy - 110, u) - Math.sin(u * Math.PI) * (ty - 120 - top) });
    if (ak > 0) { ctx.save(); ctx.globalAlpha = ak; ctx.setLineDash([12, 14]); ctx.strokeStyle = 'rgba(32,26,19,.35)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const q = arc(i / 40); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
    if (tk > 0) popAt(ctx, tx, ty, tk, () => { K.coin(ctx, tx, ty, 112, { fill: ORANGE, mark: false }); I.tbill(ctx, tx, ty - 6, 92, {}); });
    // the sun rides the arc between the days
    if (ak > 0) {
      let u = (t - c1 + 0.45) / (c2 - c1); u = u - Math.floor(u); const q = arc(clamp(u)), sa = ak * Math.sin(clamp(u) * Math.PI) ** 0.4;
      ctx.save(); ctx.globalAlpha = sa; ctx.translate(q.x, q.y - 70); ctx.rotate(t * 1.5); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fillStyle = YELLOW; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // a coin hops into the wallet each day
    let landed = 0, puff = 0;
    days.forEach((d) => {
      const u = (t - d + 0.3) / 0.55; if (u >= 1) { landed++; puff = Math.max(puff, bump(t, d + 0.25, 0.32)); return; } if (u <= 0) return;
      const q = arc(eInOut(u)); mascot(ctx, q.x, q.y, 36, Math.sin(u * Math.PI) * 0.5);
    });
    if (wk > 0) popAt(ctx, wx, wy, wk * (1 + 0.07 * puff), () => {
      for (let i = 0; i < landed; i++) mascot(ctx, wx - 40 + i * 54, wy - 112 + (i % 2) * 6 - 5 * Math.abs(Math.sin(t * 6 + i)), 33, (i ? 0.18 : -0.18)); // peeking out of the wallet
      I.wallet(ctx, wx, wy, 220, { fill: '#6B4E3A', flap: ORANGE });
    });
    // Wally the barista: sips through it all, raises the mug at the fine print
    const cyc = (t + 0.4) % 2.2, sip = cyc < 1.1 ? Math.sin(cyc / 1.1 * Math.PI) : 0, cheers = ramp(t, A.fineZ - 0.3, 0.3), s2 = sip * (1 - cheers);
    const pose = { x: 418, y: 992, s: 0.9, headRot: 0.03 * s2, bob: 3 * Math.abs(Math.sin(t * Math.PI / BEAT)) };
    window.WallyRig.coffee(pose, sip, cheers, t); // mug in the paw, trunk dips in to sip
    addPose(pose, { sparkle: 1.1 }, bump(t, A.fineZ, 0.8));
    if (t < A.sl0) finePrint(ctx, A, t);
    shadow(ctx, 418, 996, 150, 0.12); wally(ctx, pose);
  }

  // =================================================================================================
  // AD3 — "THE VAULT": a gold bar is heavy and vaults are big. Colour: the token pops out, the bar stays.
  // =================================================================================================
  function vaultBg(x) {
    x.fillStyle = '#8C8373'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(30,24,18,.35)'; x.lineWidth = 3; // bricks
    for (let r = 0; r < 18; r++) { const yy = r * 52; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); for (let c = 0; c < 22; c++) { const xx = c * 110 + (r % 2) * 55; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 52); x.stroke(); } }
    x.fillStyle = '#6E6658'; x.fillRect(0, 880, W, 200); x.fillStyle = '#5B5348'; x.fillRect(0, 876, W, 8);
    // the vault door
    const cx = 1330, cy = 500;
    x.fillStyle = '#6B6457'; x.fillRect(cx - 410, cy - 410, 820, 790); x.strokeStyle = '#1E1A15'; x.lineWidth = 6; x.strokeRect(cx - 410, cy - 410, 820, 790);
    x.fillStyle = '#4F493F'; x.beginPath(); x.arc(cx, cy, 372, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#B8B1A3'; x.beginPath(); x.arc(cx, cy, 340, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.arc(cx, cy, 300, 0, 7); x.lineWidth = 4; x.stroke(); x.beginPath(); x.arc(cx, cy, 160, 0, 7); x.fillStyle = '#A39C8E'; x.fill(); x.stroke();
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; x.beginPath(); x.arc(cx + Math.cos(a) * 320, cy + Math.sin(a) * 320, 10, 0, 7); x.fillStyle = '#5B5348'; x.fill(); x.lineWidth = 3; x.stroke(); }
    for (const yy of [cy - 220, cy + 160]) { x.fillStyle = '#5B5348'; x.fillRect(cx - 430, yy, 70, 90); x.strokeRect(cx - 430, yy, 70, 90); }
    x.fillStyle = '#E5DED0'; x.fillRect(cx - 230, 30, 460, 70); x.lineWidth = 4; x.strokeRect(cx - 230, 30, 460, 70);
    K.txt(x, 'VAULT', cx, 82, { f: 'serif', s: 48, w: 700, c: '#2B2620', a: 'center', ls: 20 });
  }
  function ad3Boring(ctx, A, tb) {
    ctx.drawImage(cached(ctx, 'vault', W, H, vaultBg, true), 0, 0, W, H);
    const cx = 1330, cy = 500, tClunk = A.cue('clunk', 0, 0.39), tStrain = A.cue('strain', 0, 1.0);
    // the wheel spins shut, the bolts shoot home on the clunk
    const spin = tb < tClunk ? (tb - tClunk) * 4 : 0;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin); ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.lineWidth = 26; ctx.strokeStyle = '#1E1A15'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * -130, Math.sin(a) * -130); ctx.lineTo(Math.cos(a) * 130, Math.sin(a) * 130); ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = '#8E8576'; ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 136, Math.sin(a) * 136, 16, 0, 7); ctx.fillStyle = '#5B5348'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1E1A15'; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fillStyle = '#D6CFC0'; ctx.fill(); ctx.stroke(); ctx.restore();
    const bolt = tb < tClunk ? 0 : back((tb - tClunk) / 0.12, 1.2);
    ctx.save(); ctx.fillStyle = '#D6CFC0'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 4;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const r0 = 330, r1 = r0 + 70 * bolt; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillRect(r0 - 50, -16, r1 - r0 + 50, 32); ctx.strokeRect(r0 - 50, -16, r1 - r0 + 50, 32); ctx.restore(); }
    ctx.restore();
    if (tb >= tClunk && tb < tClunk + 0.7) K.txt(ctx, 'CLUNK.', 790, 214, { f: 'display', s: 64, w: 900, c: '#1E1A15', a: 'center', alpha: env(tb, tClunk, 0.03, 0.5, 0.15) });
    // Wally hauls a gold bar the size of a sofa
    const strain = ramp(tb, tStrain - 0.1, 0.2), wob = Math.sin(tb * 34) * (0.025 + 0.03 * strain);
    const pose = { x: 590, y: 900, s: 0.78, squash: 0.08 + 0.04 * strain + wob, rot: -0.03 + 0.03 * Math.sin(tb * 11) * (0.5 + strain), trunk: { bend: 0.3, lift: 0.75, curl: 0.2 }, headRot: -0.05, earL: -0.08, earR: -0.08 };
    const top = rigPt(pose, 250, 26), tilt = 0.06 * Math.sin(tb * 7) + 0.1 * strain * Math.sin(tb * 23);
    ctx.save(); ctx.translate(top.x, top.y - 72); ctx.rotate(tilt); I.goldbar(ctx, 0, 0, 330, { fill: '#C9C1B0', top: '#E2DCCF', side: '#9B9282', serial: '400 OZ' }); ctx.restore();
    bwWally(ctx, pose, 60);
    for (let i = 0; i < 5; i++) { const u = ((tb - 0.2) * (1.1 + strain) + i / 5) % 1; if (u < 0) continue; const side = i % 2 ? 1 : -1, sx = top.x + side * (110 + u * 90), sy = top.y + 60 + u * 80 - Math.sin(u * Math.PI) * 70; ctx.save(); ctx.globalAlpha = (1 - u) * (0.5 + 0.5 * strain); ctx.fillStyle = '#F4EFE4'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy - 22); ctx.quadraticCurveTo(sx + 13, sy, sx, sy + 9); ctx.quadraticCurveTo(sx - 13, sy, sx, sy - 22); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  function ad3Colour(ctx, A, t) {
    stage(ctx, t, 420, 600);
    const on = A.copy.onchain || [], t0 = A.head;
    headline(ctx, on[0] || '', COL_X, 300, 120, t0, t, { fit: 1020 });
    claim(ctx, on[1] || '', COL_X + 4, 392, 50, t0 + 0.34, t, { fit: 1010, pulse: A.fineZ });
    // the hero: the vault (bar inside) stays put; a gold token zips to a wallet
    const vp = back((t - (A.head - 0.1)) / 0.45, 1.6), cpop = A.cue('coin', 0, 2.86), tz = A.cue('zip', 0, 3.18);
    const vx = 1060, vy = 664, wx = 1600, wy = 694;
    if (vp > 0) popAt(ctx, vx, vy, vp, () => {
      I.vault(ctx, vx, vy, 250, { open: 0.75, inside: (c) => { I.goldbar(c, 0, 26, 96, { serial: '' }); I.goldbar(c, -10, -16, 80, { serial: '' }); } });
      K.txt(ctx, 'THE BAR STAYS', vx, vy + 178, { f: 'mono', s: 20, w: 700, c: INK, a: 'center', ls: 3 });
    });
    wallet(ctx, wx, wy, 200, back((t - (A.head + 0.05)) / 0.45, 1.6));
    if (t >= cpop) {
      const u = eInOut((t - tz) / 0.36), pp = back((t - cpop) / 0.35, 1.8);
      const x = lerp(vx + 40, wx - 10, u), y = lerp(vy - 150, wy - 120, u) - Math.sin(u * Math.PI) * 60;
      if (u > 0 && u < 1) { ctx.save(); ctx.strokeStyle = 'rgba(183,121,31,.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 60 - i * 26, y - 22 + i * 14); ctx.lineTo(x - 130 - i * 30, y - 22 + i * 14); ctx.stroke(); } ctx.restore(); }
      popAt(ctx, x, y, pp, () => goldToken(ctx, x, y, 44, u > 0 && u < 1 ? u * 2 : 0));
      if (u >= 1) { K.txt(ctx, 'THE CLAIM MOVES', wx, wy + 150, { f: 'mono', s: 20, w: 700, c: INK, a: 'center', ls: 3, alpha: ramp(t, tz + 0.36, 0.25) }); sparkleStar(ctx, wx + 80, wy - 150, 22, bump(t, tz + 0.34, 0.6)); }
    }
    // Wally flips a gold token on his trunk like it weighs nothing
    const flipP = 0.7, ph = (((t - A.on0) % flipP) + flipP) % flipP / flipP, air = Math.sin(ph * Math.PI), flick = bump(ph, 0.9, 0.2) + bump(ph, -0.1, 0.2);
    const pose = { x: 418, y: 992, s: 0.9, trunk: { bend: 0.42, lift: 0.8 + 0.22 * flick, curl: 0.18, len: 1.22 }, headRot: 0.03 + 0.02 * flick };
    addPose(pose, { sparkle: 1.1 }, bump(t, A.fineZ, 0.8));
    if (t < A.sl0) finePrint(ctx, A, t);
    shadow(ctx, 418, 996, 150, 0.12); wally(ctx, pose);
    const tp = tipOf(pose), show = ramp(t, A.tada + 0.1, 0.3), gx0 = tp.x + 14, gy0 = tp.y - 44;
    if (show > 0) popAt(ctx, gx0, gy0, show, () => goldToken(ctx, gx0 + air * 26, gy0 - air * 250, 38, ph * 3));
  }

  // =================================================================================================
  // AD4 — "PLEASE HOLD": ownership records by fax and phone. Colour: Wally hangs up and checks for himself.
  // =================================================================================================
  function recordsBg(x) {
    x.fillStyle = '#A59C8B'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 26; i++) x.fillRect(0, i * 36, W, 16);
    x.fillStyle = '#E5DED0'; x.fillRect(560, 70, 800, 86); x.strokeStyle = '#2B2620'; x.lineWidth = 4; x.strokeRect(560, 70, 800, 86); x.strokeRect(570, 80, 780, 66);
    K.txt(x, 'OWNERSHIP RECORDS DEPT.', 960, 128, { f: 'serif', s: 40, w: 700, c: '#2B2620', a: 'center', ls: 6 });
    // filing cabinets
    const labels = ['A – F', 'G – M', 'N – S', 'T – Z'];
    for (let c = 0; c < 3; c++) {
      const x0 = 60 + c * 170; x.fillStyle = '#8A8170'; x.fillRect(x0, 300, 150, 580); x.strokeStyle = '#2B2620'; x.lineWidth = 4; x.strokeRect(x0, 300, 150, 580);
      for (let i = 0; i < 4; i++) { x.strokeRect(x0 + 12, 316 + i * 140, 126, 122); x.fillStyle = '#F2EEE4'; x.fillRect(x0 + 45, 336 + i * 140, 60, 22); x.strokeRect(x0 + 45, 336 + i * 140, 60, 22); K.txt(x, labels[(i + c) % 4], x0 + 75, 353 + i * 140, { f: 'mono', s: 13, w: 700, c: '#2B2620', a: 'center' }); x.fillStyle = '#2B2620'; x.fillRect(x0 + 52, 380 + i * 140, 46, 10); }
    }
    x.fillStyle = '#6E6556'; x.fillRect(0, 880, W, 200);
    // desk
    x.fillStyle = '#5A4A38'; x.fillRect(1000, 650, 860, 30); x.fillStyle = '#4A3C2D'; x.fillRect(1030, 680, 260, 200); x.fillRect(1570, 680, 260, 200);
    // a 'take a number' sign
    x.fillStyle = '#E5DED0'; x.fillRect(1480, 230, 300, 150); x.strokeRect(1480, 230, 300, 150);
    K.txt(x, 'NOW SERVING', 1630, 276, { f: 'mono', s: 22, w: 700, c: '#2B2620', a: 'center', ls: 4 });
    K.txt(x, 'Nº 3', 1630, 352, { f: 'serif', s: 66, w: 700, c: '#2B2620', a: 'center' });
  }
  function faxMachine(ctx, x, y, tb, t0) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 5;
    // paper: out of the slot, over the desk edge, piling up in folds on the floor
    const L = Math.max(0, (tb - t0)) * 520;
    ctx.fillStyle = '#F3EEE3';
    const fall = Math.min(L, 210); ctx.fillRect(x - 100, y + 24, 200, fall); ctx.strokeRect(x - 100, y + 24, 200, fall);
    ctx.strokeStyle = 'rgba(40,32,24,.45)'; ctx.lineWidth = 2; for (let yy = y + 44; yy < y + 24 + fall - 10; yy += 18) { ctx.beginPath(); ctx.moveTo(x - 80, yy); ctx.lineTo(x + 40 + (yy % 3) * 12, yy); ctx.stroke(); }
    const pile = Math.max(0, L - 210), folds = Math.min(9, Math.floor(pile / 60));
    ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 3;
    for (let i = 0; i < folds; i++) { const fy = 872 - i * 12, sk = (i % 2 ? 1 : -1) * 12; ctx.beginPath(); ctx.moveTo(x - 104 + sk, fy); ctx.lineTo(x + 104 + sk, fy); ctx.lineTo(x + 100 - sk, fy - 12); ctx.lineTo(x - 108 - sk, fy - 12); ctx.closePath(); ctx.fillStyle = i % 2 ? '#E9E3D6' : '#F3EEE3'; ctx.fill(); ctx.stroke(); }
    // the machine
    ctx.lineWidth = 5; K.box(ctx, x - 150, y - 90, 300, 120, { r: 12, fill: '#B5AE9F', stroke: '#1E1A15', lw: 5 });
    K.box(ctx, x - 130, y - 136, 200, 56, { r: 8, fill: '#9C9586', stroke: '#1E1A15', lw: 4 });
    ctx.fillStyle = '#2B2620'; ctx.fillRect(x - 110, y + 12, 220, 12);
    ctx.fillStyle = '#E6E0D2'; ctx.fillRect(x + 40, y - 70, 90, 40); ctx.strokeRect(x + 40, y - 70, 90, 40);
    K.txt(ctx, (Math.floor(tb * 6) % 2 ? 'SENDING' : 'PG 1/47'), x + 85, y - 44, { f: 'mono', s: 13, w: 700, c: '#1E1A15', a: 'center' });
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - 110 + (i % 3) * 34, y - 52 + Math.floor(i / 3) * 30, 10, 0, 7); ctx.fillStyle = '#E6E0D2'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.restore();
  }
  function ad4Boring(ctx, A, tb) {
    ctx.drawImage(cached(ctx, 'records', W, H, recordsBg, true), 0, 0, W, H);
    const tFax = A.cue('fax', 0, 0.39), tPhone = A.cue('phone', 0, 1.07);
    faxMachine(ctx, 1640, 620, tb, tFax);
    // the phone base on the desk
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(1110, 650); ctx.lineTo(1290, 650); ctx.lineTo(1262, 580); ctx.lineTo(1138, 580); ctx.closePath(); ctx.fillStyle = '#3B3530'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(1200, 612, 30, 0, 7); ctx.fillStyle = '#D6CFC0'; ctx.fill(); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.7 - 1; ctx.beginPath(); ctx.arc(1200 + Math.cos(a) * 20, 612 + Math.sin(a) * 20, 4, 0, 7); ctx.fillStyle = '#3B3530'; ctx.fill(); }
    ctx.restore();
    // Wally on hold: trunk curled up holding the handset to his ear
    const bored = 0.5 + 0.5 * Math.sin(tb * 3), ring = tb >= tPhone ? bump(tb, tPhone, 0.5) : 0;
    const pose = { x: 790, y: 880, s: 0.64, trunk: { bend: 0.75, lift: 1.12, curl: 0.62 }, headRot: 0.07 + 0.02 * bored, earR: -0.06, earL: -0.06, bob: 3 * Math.abs(Math.sin(tb * 5)) };
    addPose(pose, { headRot: -0.1, squash: 0.05, bob: -6 }, ramp(tb, tPhone + 0.3, 0.3));
    bwWally(ctx, pose);
    const tp = tipOf(pose), hx = tp.x + Math.cos(tp.dir) * 14, hy = tp.y + Math.sin(tp.dir) * 14;
    // curly cord
    ctx.save(); ctx.strokeStyle = '#1E1A15'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const u = i / 60, bx = lerp(hx, 1150, u), by = lerp(hy + 30, 640, u) + Math.sin(u * Math.PI) * 140; const cx = bx + Math.cos(u * 60) * 12, cy = by + Math.sin(u * 60) * 12; i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy); }
    ctx.stroke(); ctx.restore();
    handset(ctx, hx, hy, tp.dir + 1.2, 0.9);
    // hold music
    for (let i = 0; i < 3; i++) { const u = ((tb * 0.8) + i / 3) % 1; musicNote(ctx, hx + 50 + u * 150 + Math.sin(u * 6 + i) * 22, hy - 40 - u * 230, 1.5, Math.min(1, Math.sin(u * Math.PI) * 1.6), '#FBF8F1'); }
    if (ring > 0) K.txt(ctx, 'please hold...', hx + 130, hy - 200, { f: 'serif', s: 40, w: 600, i: true, c: '#F3EEE3', a: 'left', alpha: clamp(ring * 3) });
    if (tb > tPhone + 0.5) K.txt(ctx, 'please hold...', hx + 130, hy - 200, { f: 'serif', s: 40, w: 600, i: true, c: '#F3EEE3', a: 'left' });
  }
  function ad4Colour(ctx, A, t) {
    stage(ctx, t, 420, 600);
    const on = A.copy.onchain || [], t0 = A.head, head = tagLines(on[0] || '');
    if (head.length > 1) { headline(ctx, head[0], COL_X, 248, 104, t0, t, { fit: 1020 }); headline(ctx, head[1], COL_X, 352, 104, t0 + 0.18, t, { fit: 1020, c: ORANGE }); }
    else headline(ctx, on[0] || '', COL_X, 248, 92, t0, t, { fit: 1030 });
    claim(ctx, on[1] || '', COL_X + 4, 438, 52, t0 + 0.45, t, { fit: 1000, pulse: A.fineZ });
    // the hero: the onchain record (who owns it, how much, what happened to it last) with a green check
    const rp = back((t - (A.head - 0.05)) / 0.45, 1.6), td = A.cue('ding', 0, 3.14);
    const bx = 1080, by = 640, labels = ['CLAIM', 'OWNER', 'AMOUNT', 'LAST MOVE'];
    labels.forEach((l, i) => {
      const p = back((t - (A.head - 0.05 + i * 0.09)) / 0.4, 1.7); if (p <= 0) return;
      const x = bx + i * 168;
      popAt(ctx, x, by, p, () => { I.block(ctx, x, by, 112, {}); K.txt(ctx, l, x + 8, by + 96, { f: 'mono', s: 17, w: 700, c: INK, a: 'center', ls: 2 }); });
      if (i < 3) { ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = INK; ctx.fillRect(x + 56, by - 4, 56, 8); ctx.restore(); }
    });
    if (rp > 0 && t > td) {
      const p = ramp(t, td, 0.35);
      K.box(ctx, 1170, 790, 330, 60, { r: 30, fill: '#E3F5EC', stroke: GREEN, lw: 3 });
      K.check(ctx, 1208, 820, 34, p, GREEN, 7);
      K.txt(ctx, 'ANYONE CAN CHECK', 1356, 827, { f: 'mono', s: 19, w: 800, c: GREEN, a: 'center', ls: 2, alpha: p });
    }
    // Wally tosses the phone over his shoulder (boing), then inspects the record with his magnifier
    const tToss = A.cue('boing', 0, 2.82), tossed = t >= tToss;
    const pose = { x: 418, y: 992, s: 0.9 };
    if (!tossed) { pose.trunk = { bend: 0.7, lift: 1.1, curl: 0.6 }; pose.headRot = 0.05; }
    else {
      const lk = eInOut((t - tToss - 0.15) / 0.35), dn = eInOut((t - A.fineZ + 0.4) / 0.4);
      pose.trunk = { bend: lerp(0.65, 0.5, dn), lift: lerp(0.6, 0.12, dn), curl: 0.1 };
      pose.headRot = -0.035 * lk + 0.05 * dn;
      const peer = { kind: 'magnifier', a: lerp(1.2, -0.28 + Math.sin(t * 2.2) * 0.1, lk) }, aim = aimMag(pose, 697, 954);
      pose.prop = { kind: 'magnifier', a: lerp(peer.a, aim.a, dn), len: lerp(92, aim.len, dn), show: back((t - tToss - 0.12) / 0.3) };
      addPose(pose, { sparkle: 1.1 }, bump(t, A.fineZ, 0.8));
    }
    if (t < A.sl0) finePrint(ctx, A, t);
    shadow(ctx, 418, 996, 150, 0.12); wally(ctx, pose);
    const tp = tipOf(pose);
    if (!tossed) handset(ctx, tp.x + Math.cos(tp.dir) * 12, tp.y + Math.sin(tp.dir) * 12, tp.dir + 1.2, 1.15, '#3B3530');
    else { const u = (t - tToss) / 0.6; if (u < 1) { const x = lerp(470, -120, u), y = lerp(430, 120, u) - Math.sin(u * Math.PI) * 240; handset(ctx, x, y, u * 9, 1.15, '#3B3530'); } }
  }

  // ================================================================== the spots
  const SPOTS = {
    AD0: { boring: ad0Boring, colour: ad0Colour, slateWally: (p) => { p.skate = { tilt: 0 }; } },
    AD1: { boring: ad1Boring, colour: ad1Colour, slateWally: (p, u) => { p.trunk = { bend: 0.35, lift: 1.0 }; p.prop = { kind: 'coin', t: u }; } },
    AD2: { boring: ad2Boring, colour: ad2Colour, slateWally: (p, u) => { const sip = Math.sin(clamp((u - 0.3) / 1.0) * Math.PI); window.WallyRig.coffee(p, sip, 0, u); } },
    AD3: { boring: ad3Boring, colour: ad3Colour, slateWally: (p, u) => { p.trunk = { bend: 0.35, lift: 1.0 }; p.prop = { kind: 'coin', t: u }; } },
    AD4: { boring: ad4Boring, colour: ad4Colour, slateWally: (p, u) => { p.trunk = { bend: 0.65, lift: 0.6, curl: 0.1 }; p.prop = { kind: 'magnifier', a: -0.3 + Math.sin(u * 2.2) * 0.1 }; } },
  };
  function captions(ctx, A, tb) {
    const lines = A.copy.boring || [], n = lines.length; if (!n) return;
    const t0 = 0.42, span = Math.max(0.5, A.sw0 - 0.25 - t0), shown = [];
    lines.forEach((l, k) => { if (tb >= t0 + k * span / n) shown.push(l); });
    captionBox(ctx, shown, { s: A.id === 'AD0' ? 52 : 54 });
  }
  function oldFootage(ctx, A, spot, t) {
    const tb = old(t);
    ctx.save(); weave(ctx, t);
    spot.boring(ctx, A, tb, t);
    bug(ctx);
    captions(ctx, A, tb);
    ctx.restore();
    filmLook(ctx, t);
  }

  window.ADS = {
    draw(ctx, sc, t, api) {
      K = api.K; C = api.C; I = api.I; RIG = api.rig; BEAT = api.BEAT || BEAT; KS = devScale(ctx);
      const spot = SPOTS[sc.id] || SPOTS.AD1, A = timing(sc);
      ctx.save();
      if (t < A.sl0 + 0.37) {
        const r = irisR(A, t);
        if (r < 9000) oldFootage(ctx, A, spot, t);
        if (r > 0) {
          ctx.save();
          if (r < 9000) { irisPath(ctx, A.irisX, A.irisY, r, t); ctx.clip(); }
          spot.colour(ctx, A, t);
          ctx.restore();
          if (r < 9000) { ctx.save(); irisPath(ctx, A.irisX, A.irisY, r, t); ctx.lineWidth = 22; ctx.strokeStyle = ORANGE; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
        }
        starburst(ctx, A, t);
      }
      if (t >= A.sl0) { slate(ctx, A, t, spot); finePrint(ctx, A, t); }
      ctx.restore();
    },
  };
})();
