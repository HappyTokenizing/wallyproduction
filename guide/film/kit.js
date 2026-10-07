/* kit.js — drawing toolkit shared by every scene of the film (and the live player on /guide).
   Everything is plain canvas 2D in a 1920x1080 logical space. Pure functions of time: no state
   carries between frames, so any frame can be rendered in any order. */
(function () {
  const K = (window.K = {});
  window.SCENES = window.SCENES || {};

  // ---------------------------------------------------------------- palette (site + textbook)
  K.C = {
    bg: '#F4F1EA', paper: '#FAF8F3', card: '#FFFFFF', raise: '#EFEAE0',
    line: '#E2DACB', line2: '#D7CFBE',
    ink: '#201A13', ink2: '#5C5447', ink3: '#98907F',
    orange: '#FF6200', orange2: '#D85300', orangeSoft: 'rgba(255,98,0,.12)',
    green: '#0E9F6E', greenLite: '#34C77B', red: '#D64545', redSoft: 'rgba(214,69,69,.12)',
    gold: '#E7B43C', goldDark: '#B7791F', goldLite: '#F6D77B',
    blue: '#3D7BE0', violet: '#6D5BD0', teal: '#1F8A8A',
    wally: '#072421', grey: '#D8D8D8',
    night: '#140E08', night2: '#2A1E12',
    neonPink: '#FF2E9A', neonCyan: '#25E8FF', neonLime: '#C8FF1E', neonViolet: '#8A5CFF', neonYellow: '#FFE24A',
  };
  const C = K.C;

  // ---------------------------------------------------------------- math & easing
  K.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.prog = (t, a, b) => K.clamp((t - a) / (b - a));
  K.smooth = (t) => t * t * (3 - 2 * t);
  const E = (K.E = {
    lin: (t) => t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inCubic: (t) => t * t * t,
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)),
    outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  });
  // eased progress of t through [a, a+d]
  K.ep = (t, a, d, e = E.outCubic) => e(K.clamp((t - a) / d));
  // pop-in scale: 0 before `a`, overshoots to ~1.08 then settles to 1
  K.pop = (t, a, d = 0.42) => (t < a ? 0 : E.outBack(K.clamp((t - a) / d), 1.45)); // soft overshoot
  // decaying shake offset (deterministic)
  K.shake = (t, a, amp = 10, d = 0.35, seed = 1) => {
    const u = (t - a) / d; if (u < 0 || u > 1) return { x: 0, y: 0 };
    const k = amp * Math.pow(1 - u, 2);
    return { x: Math.sin(t * 97 + seed) * k, y: Math.cos(t * 83 + seed * 2) * k };
  };
  K.rand = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  K.hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  // ---------------------------------------------------------------- fonts & text
  const FAM = { serif: 'Lora', mono: '"Geist Mono"', display: 'Archivo', hand: 'Caveat', emoji: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"' };
  K.FAM = FAM;
  // f: serif|mono|display|hand, w weight, s size(px), i italic, st stretch keyword (Archivo)
  K.font = (ctx, f = 'serif', s = 40, w = 400, i = false, st) => {
    ctx.font = `${i ? 'italic ' : ''}${w} ${s}px ${FAM[f] || f}`;
    if ('fontStretch' in ctx) ctx.fontStretch = st || 'normal';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };
  K.track = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; };
  K.txt = (ctx, s, x, y, o = {}) => {
    K.font(ctx, o.f || 'serif', o.s || 40, o.w || 400, o.i, o.st);
    if (o.ls) K.track(ctx, o.ls);
    ctx.fillStyle = o.c || C.ink; ctx.textAlign = o.a || 'left'; ctx.textBaseline = o.b || 'alphabetic';
    if (o.alpha !== undefined) { ctx.save(); ctx.globalAlpha *= o.alpha; ctx.fillText(s, x, y); ctx.restore(); } else ctx.fillText(s, x, y);
    if (o.ls) K.track(ctx, 0);
  };
  K.measure = (ctx, s, o = {}) => { K.font(ctx, o.f || 'serif', o.s || 40, o.w || 400, o.i, o.st); if (o.ls) K.track(ctx, o.ls); const w = ctx.measureText(s).width; if (o.ls) K.track(ctx, 0); return w; };
  K.wrap = (ctx, s, maxW, o = {}) => {
    K.font(ctx, o.f || 'serif', o.s || 40, o.w || 400, o.i, o.st);
    const words = String(s).split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur);
    return lines;
  };
  // word-by-word reveal (rise + fade). `t` = seconds since the reveal started. Returns block height.
  K.words = (ctx, s, x, y, o = {}) => {
    const size = o.s || 44, lh = o.lh || size * 1.22, maxW = o.maxW || 1200, per = o.per === undefined ? 0.045 : o.per;
    const lines = K.wrap(ctx, s, maxW, o);
    let k = 0;
    K.font(ctx, o.f || 'serif', size, o.w || 400, o.i, o.st);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    lines.forEach((line, li) => {
      const lw = ctx.measureText(line).width;
      let cx = o.a === 'center' ? x - lw / 2 : o.a === 'right' ? x - lw : x;
      const ws = line.split(' ');
      for (const w of ws) {
        const p = o.t === undefined ? 1 : E.outCubic(K.clamp((o.t - k * per) / (o.fd || 0.4)));
        const ww = ctx.measureText(w + ' ').width;
        if (p > 0) {
          ctx.save(); ctx.globalAlpha *= p; ctx.fillStyle = (o.hl && o.hl.includes(k)) ? (o.hc || C.orange) : (o.c || C.ink);
          ctx.fillText(w, cx, y + li * lh + (1 - p) * (o.rise === undefined ? size * 0.35 : o.rise)); ctx.restore();
        }
        cx += ww; k++;
      }
    });
    return lines.length * lh;
  };
  // fit a single line inside maxW by shrinking the size
  K.fitSize = (ctx, s, maxW, o) => { let size = o.s; while (size > 8 && K.measure(ctx, s, Object.assign({}, o, { s: size })) > maxW) size -= 1; return size; };

  // ---------------------------------------------------------------- shapes
  K.rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  K.box = (ctx, x, y, w, h, o = {}) => {
    K.rr(ctx, x, y, w, h, o.r === undefined ? 14 : o.r);
    if (o.shadow) { ctx.save(); ctx.shadowColor = 'rgba(32,26,19,.18)'; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow * 0.35; ctx.fillStyle = o.fill || C.card; ctx.fill(); ctx.restore(); }
    else if (o.fill !== null) { ctx.fillStyle = o.fill || C.card; ctx.fill(); }
    if (o.stroke !== null) { ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.stroke || C.ink; ctx.stroke(); }
  };
  // chip / pill label
  K.chip = (ctx, s, x, y, o = {}) => {
    const size = o.s || 22, padX = o.padX || size * 0.75, h = o.h || size * 1.9;
    const w = K.measure(ctx, s, { f: o.f || 'mono', s: size, w: o.w || 600, ls: o.ls === undefined ? 2 : o.ls }) + padX * 2;
    const x0 = o.a === 'center' ? x - w / 2 : o.a === 'right' ? x - w : x;
    K.box(ctx, x0, y - h / 2, w, h, { r: h / 2, fill: o.fill || C.ink, stroke: o.stroke === undefined ? null : o.stroke, lw: o.lw || 3 });
    K.txt(ctx, s, x0 + w / 2, y + size * 0.36, { f: o.f || 'mono', s: size, w: o.w || 600, c: o.c || C.bg, a: 'center', ls: o.ls === undefined ? 2 : o.ls });
    return w;
  };
  K.line = (ctx, x1, y1, x2, y2, o = {}) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.c || C.ink; ctx.lineCap = 'round'; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); ctx.setLineDash([]); };
  // animated arrow from (x1,y1) to (x2,y2); p = draw progress; bend = perpendicular curve amount
  K.arrow = (ctx, x1, y1, x2, y2, o = {}) => {
    const p = o.p === undefined ? 1 : o.p; if (p <= 0) return;
    const bend = o.bend || 0, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / L * bend, cy = my + dx / L * bend;
    const pt = (u) => ({ x: (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, y: (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2 });
    ctx.save(); ctx.lineWidth = o.lw || 5; ctx.strokeStyle = o.c || C.ink; ctx.fillStyle = o.c || C.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); const N = 28; for (let i = 0; i <= N * p; i++) { const q = pt(i / N); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } const e = pt(p); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.setLineDash([]);
    if (o.head !== false && p > 0.15) {
      const a = pt(Math.max(0, p - 0.04)), ang = Math.atan2(e.y - a.y, e.x - a.x), hs = o.hs || 18;
      ctx.beginPath(); ctx.moveTo(e.x + Math.cos(ang) * 3, e.y + Math.sin(ang) * 3);
      ctx.lineTo(e.x - Math.cos(ang - 0.5) * hs, e.y - Math.sin(ang - 0.5) * hs); ctx.lineTo(e.x - Math.cos(ang + 0.5) * hs, e.y - Math.sin(ang + 0.5) * hs); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  // a packet travelling along a straight segment
  K.along = (x1, y1, x2, y2, u) => ({ x: K.lerp(x1, x2, u), y: K.lerp(y1, y2, u) });

  // check / cross with stroke reveal
  K.check = (ctx, x, y, s, p = 1, c = C.green, lw) => {
    if (p <= 0) return; ctx.save(); ctx.lineWidth = lw || s * 0.22; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = [[-0.42, 0.02], [-0.12, 0.32], [0.45, -0.34]]; const L1 = 0.42, L2 = 0.87, tot = L1 + L2; const d = p * tot;
    ctx.beginPath(); ctx.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
    if (d <= L1) { const u = d / L1; ctx.lineTo(x + K.lerp(pts[0][0], pts[1][0], u) * s, y + K.lerp(pts[0][1], pts[1][1], u) * s); }
    else { ctx.lineTo(x + pts[1][0] * s, y + pts[1][1] * s); const u = (d - L1) / L2; ctx.lineTo(x + K.lerp(pts[1][0], pts[2][0], u) * s, y + K.lerp(pts[1][1], pts[2][1], u) * s); }
    ctx.stroke(); ctx.restore();
  };
  K.cross = (ctx, x, y, s, p = 1, c = C.red, lw) => {
    if (p <= 0) return; ctx.save(); ctx.lineWidth = lw || s * 0.22; ctx.strokeStyle = c; ctx.lineCap = 'round';
    const a = K.clamp(p * 2), b = K.clamp(p * 2 - 1), h = s * 0.38;
    ctx.beginPath(); ctx.moveTo(x - h, y - h); ctx.lineTo(x - h + 2 * h * a, y - h + 2 * h * a); ctx.stroke();
    if (b > 0) { ctx.beginPath(); ctx.moveTo(x + h, y - h); ctx.lineTo(x + h - 2 * h * b, y - h + 2 * h * b); ctx.stroke(); }
    ctx.restore();
  };
  // rubber stamp: rotated outlined text that slams in (p from 0..1 over ~0.25s)
  K.stamp = (ctx, s, x, y, o = {}) => {
    const p = o.p === undefined ? 1 : o.p; if (p <= 0) return;
    const sc = p < 1 ? K.lerp(1.45, 1, E.outCubic(p)) : 1, al = K.clamp(p * 2.5);
    const size = o.s || 56, c = o.c || C.red;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot === undefined ? -0.12 : o.rot); ctx.scale(sc, sc); ctx.globalAlpha *= al * (o.alpha || 0.92);
    const w = K.measure(ctx, s, { f: o.f || 'display', s: size, w: 900, st: 'semi-condensed', ls: 3 }) + size * 0.9, h = size * 1.45;
    K.rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.lineWidth = size * 0.1; ctx.strokeStyle = c; ctx.stroke();
    K.rr(ctx, -w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, 6); ctx.lineWidth = size * 0.035; ctx.stroke();
    K.txt(ctx, s, 0, size * 0.36, { f: o.f || 'display', s: size, w: 900, st: 'semi-condensed', c, a: 'center', ls: 3 });
    // ink speckle knock-out
    ctx.globalCompositeOperation = 'destination-out';
    const r = K.rand(o.seed || 7); for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * w, (r() - 0.5) * h, r() * size * 0.05 + 1, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  // handwritten margin note (Caveat), revealed left->right like a pen; optional curvy arrow to a target
  K.note = (ctx, s, x, y, o = {}) => {
    const p = o.p === undefined ? 1 : o.p; if (p <= 0) return;
    const size = o.s || 46, c = o.c || C.orange, rot = o.rot === undefined ? -0.05 : o.rot;
    const lines = o.maxW ? K.wrap(ctx, s, o.maxW, { f: 'hand', s: size, w: 700 }) : [s];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    let w = 0; for (const l of lines) w = Math.max(w, K.measure(ctx, l, { f: 'hand', s: size, w: 700 }));
    ctx.save(); ctx.beginPath(); ctx.rect(-20, -size * 1.2, (w + 40) * K.clamp(p * 1.15), lines.length * size * 1.05 + size * 1.4); ctx.clip();
    lines.forEach((l, i) => K.txt(ctx, l, 0, i * size * 1.02, { f: 'hand', s: size, w: 700, c }));
    if (o.underline) { const uy = (lines.length - 1) * size * 1.02 + size * 0.22; ctx.beginPath(); ctx.moveTo(0, uy); for (let k = 0; k <= 20; k++) ctx.lineTo(k / 20 * w, uy + Math.sin(k * 1.7) * 2.2); ctx.lineWidth = 3.2; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.stroke(); }
    ctx.restore();
    ctx.restore();
    if (o.to && p > 0.6) {
      const q = K.clamp((p - 0.6) / 0.4);
      const fx = o.from ? o.from[0] : x + w * 0.5, fy = o.from ? o.from[1] : y + size * 0.4;
      let tx = o.to[0], ty = o.to[1]; const L = Math.hypot(tx - fx, ty - fy), maxL = o.maxL || 230;
      if (L > maxL) { tx = fx + (tx - fx) / L * maxL; ty = fy + (ty - fy) / L * maxL; }
      K.arrow(ctx, fx, fy, tx, ty, { p: q, c, lw: 3.5, bend: o.bend === undefined ? 40 : o.bend * Math.min(1, maxL / Math.max(L, 1)) * 1.4, hs: 14 });
    }
  };
  // speech bubble
  K.bubble = (ctx, x, y, w, h, tx, ty, o = {}) => {
    ctx.save(); K.rr(ctx, x, y, w, h, o.r || 22); ctx.fillStyle = o.fill || C.card; ctx.fill();
    ctx.beginPath(); const bx = K.clamp(tx, x + 30, x + w - 30); const by = ty > y + h ? y + h - 2 : y + 2;
    ctx.moveTo(bx - 16, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + 16, by); ctx.closePath(); ctx.fill();
    ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.stroke || C.ink; ctx.lineJoin = 'round';
    K.rr(ctx, x, y, w, h, o.r || 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 16, by); ctx.lineTo(tx, ty); ctx.lineTo(bx + 16, by); ctx.stroke();
    ctx.fillStyle = o.fill || C.card; ctx.fillRect(bx - 14, by - (ty > y ? 4 : -1), 28, 5);
    ctx.restore();
  };
  // a wobbly hand-drawn underline / circle-around
  K.scribble = (ctx, x, y, w, p = 1, o = {}) => {
    if (p <= 0) return; ctx.save(); ctx.beginPath(); const N = 30;
    for (let i = 0; i <= N * p; i++) { const u = i / N; const px = x + u * w, py = y + Math.sin(u * 9 + (o.seed || 1)) * (o.amp || 3); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.lineWidth = o.lw || 5; ctx.strokeStyle = o.c || C.orange; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  };
  K.circleAround = (ctx, x, y, rx, ry, p = 1, o = {}) => {
    if (p <= 0) return; ctx.save(); ctx.beginPath(); const N = 48;
    for (let i = 0; i <= N * p * 1.08; i++) { const u = i / N; const a = -2.2 + u * Math.PI * 2.1; const wob = 1 + Math.sin(u * 11 + 2) * 0.03; ctx.lineTo(x + Math.cos(a) * rx * wob, y + Math.sin(a) * ry * wob); }
    ctx.lineWidth = o.lw || 5; ctx.strokeStyle = o.c || C.red; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  };
  // strike-through that sweeps across
  K.strike = (ctx, x1, y, x2, p, o = {}) => { if (p <= 0) return; K.line(ctx, x1, y, K.lerp(x1, x2, K.clamp(p)), y + (o.tilt || -6) * p, { lw: o.lw || 7, c: o.c || C.red }); };
  // highlighter swipe behind text
  K.marker = (ctx, x, y, w, h, p, c = 'rgba(255,98,0,.22)') => { if (p <= 0) return; ctx.save(); ctx.fillStyle = c; ctx.beginPath(); const ww = w * K.clamp(p); ctx.moveTo(x, y + 4); ctx.lineTo(x + ww, y); ctx.lineTo(x + ww - 4, y + h); ctx.lineTo(x + 3, y + h - 3); ctx.closePath(); ctx.fill(); ctx.restore(); };

  // ---------------------------------------------------------------- tokens
  // coin: r radius. o.fill (face), o.label (ticker text), o.mark (draw Wally head), o.spin 0..1 (squash), o.ghost (dashed)
  K.coin = (ctx, x, y, r, o = {}) => {
    ctx.save(); ctx.translate(x, y);
    const sq = o.spin ? Math.abs(Math.cos(o.spin * Math.PI)) * 0.92 + 0.08 : 1;
    ctx.scale(sq, 1);
    if (o.rot) ctx.rotate(o.rot);
    const face = o.fill || C.orange, rim = o.rim || shade(face, -0.22);
    // edge thickness
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r, r, 0, 0, Math.PI * 2); ctx.fillStyle = rim; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = face; ctx.fill();
    ctx.lineWidth = Math.max(2.5, r * 0.09); ctx.strokeStyle = o.stroke || C.ink;
    if (o.ghost) ctx.setLineDash([r * 0.22, r * 0.16]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r, r, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2); ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.strokeStyle = 'rgba(32,26,19,.35)'; ctx.stroke();
    if (o.label) K.txt(ctx, o.label, 0, r * 0.18, { f: 'display', s: r * (o.label.length > 3 ? 0.48 : 0.6), w: 900, st: 'condensed', c: o.labelC || C.card, a: 'center' });
    else if (o.mark !== false) K.headMark(ctx, 0, -r * 0.02, r * 1.08, o.markC || C.card);
    ctx.restore();
  };
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  K.shade = shade;
  // Wally's head mark (traced from the site's WALLY_LOGO) centred at x,y, width w
  let HEAD = null;
  K.headMark = (ctx, x, y, w, c) => {
    if (!window.WALLY_HEAD) return;
    if (!HEAD) HEAD = new Path2D(window.WALLY_HEAD.ink);
    const s = w / window.WALLY_HEAD.w * 0.62;
    ctx.save(); ctx.translate(x - window.WALLY_HEAD.w * s / 2, y - window.WALLY_HEAD.h * s / 2); ctx.scale(s, s); ctx.fillStyle = c || C.ink; ctx.fill(HEAD); ctx.restore();
  };

  // ---------------------------------------------------------------- raster assets (logos, herd avatars)
  K.ASSET_BASE = K.ASSET_BASE || '../assets/';
  K.IMG = {};
  K.loadAssets = () => {
    const A = window.FILM_ASSETS || { logos: [], herd: [] }, jobs = [];
    for (const [dir, list] of [['logos', A.logos], ['herd', A.herd], ['wally', A.wally || []]]) for (const n of list) {
      const im = new Image(); im.src = K.ASSET_BASE + dir + '/' + n + '.png'; K.IMG[dir + '/' + n] = im;
      jobs.push(im.decode().catch(() => console.warn('asset failed', n)));
    }
    return Promise.all(jobs);
  };
  K.img = (key) => { const im = K.IMG[key]; return im && im.complete && im.naturalWidth ? im : null; };
  // logo in a white circle chip (or raw), centred
  K.logo = (ctx, name, x, y, r, o = {}) => {
    const im = K.img('logos/' + name); ctx.save();
    if (o.chip !== false) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.stroke || C.line2; ctx.stroke(); }
    if (im) { const k = o.chip === false ? 1 : 0.86; ctx.beginPath(); ctx.arc(x, y, r * k, 0, 7); ctx.clip(); ctx.drawImage(im, x - r * k, y - r * k, r * 2 * k, r * 2 * k); }
    ctx.restore();
  };
  K.avatar = (ctx, handle, x, y, r) => {
    const im = K.img('herd/' + handle.toLowerCase()); ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.clip();
    if (im) ctx.drawImage(im, x - r, y - r, r * 2, r * 2); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = C.line2; ctx.stroke();
  };

  // ---------------------------------------------------------------- paper texture (cached)
  const paperCache = {};
  K.paper = (w, h, base = C.bg, seed = 3) => {
    const key = w + 'x' + h + base + seed; if (paperCache[key]) return paperCache[key];
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const id = x.getImageData(0, 0, w, h), d = id.data, r = K.rand(seed);
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
    x.putImageData(id, 0, 0);
    // soft fibres
    x.globalAlpha = 0.035; x.strokeStyle = '#8a7b62'; x.lineWidth = 1;
    for (let i = 0; i < 260; i++) { const px = r() * w, py = r() * h, a = r() * Math.PI, l = 8 + r() * 26; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    x.globalAlpha = 1;
    // vignette
    const g = x.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,70,40,.10)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    paperCache[key] = cv; return cv;
  };
})();
