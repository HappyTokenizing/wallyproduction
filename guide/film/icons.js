/* icons.js — the film's icon set. One consistent style: warm ink outline (~4.5% of size), flat fills,
   rounded joins. Every icon: I.name(ctx, cx, cy, s, o) — centred at (cx,cy), roughly s px tall. */
(function () {
  const K = window.K, C = K.C;
  const I = (window.I = {});
  const lw = (s) => Math.max(2.5, s * 0.045);
  function begin(ctx, x, y, s, o) { ctx.save(); ctx.translate(x, y); if (o && o.rot) ctx.rotate(o.rot); if (o && o.sc) ctx.scale(o.sc, o.sc); ctx.lineWidth = lw(s); ctx.strokeStyle = (o && o.ink) || C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
  const end = (ctx) => ctx.restore();
  const fs = (ctx, fill) => { if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.stroke(); };
  const rr = K.rr;

  // ---- documents ------------------------------------------------------------------------------
  I.doc = (ctx, x, y, s, o = {}) => { // generic page with folded corner
    begin(ctx, x, y, s, o); const w = s * 0.74, h = s, f = s * 0.18;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2, -h / 2 + f); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); fs(ctx, o.fill || C.card);
    ctx.beginPath(); ctx.moveTo(w / 2 - f, -h / 2); ctx.lineTo(w / 2 - f, -h / 2 + f); ctx.lineTo(w / 2, -h / 2 + f); ctx.stroke();
    if (o.lines !== false) { ctx.lineWidth = lw(s) * 0.7; ctx.strokeStyle = C.ink3; for (let i = 0; i < 4; i++) { const yy = -h * 0.12 + i * h * 0.13; ctx.beginPath(); ctx.moveTo(-w * 0.32, yy); ctx.lineTo(w * (i === 3 ? 0.05 : 0.3), yy); ctx.stroke(); } }
    if (o.title) K.txt(ctx, o.title, 0, -h * 0.26, { f: 'mono', s: s * 0.1, w: 700, c: o.titleC || C.ink, a: 'center', ls: 1 });
    end(ctx);
  };
  I.tbill = (ctx, x, y, s, o = {}) => { // landscape treasury note with seal
    begin(ctx, x, y, s, o); const w = s * 1.5, h = s * 0.82;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.06); fs(ctx, o.fill || '#EAF3E6');
    rr(ctx, -w / 2 + s * 0.07, -h / 2 + s * 0.07, w - s * 0.14, h - s * 0.14, s * 0.04); ctx.lineWidth = lw(s) * 0.5; ctx.strokeStyle = '#5E8A5A'; ctx.stroke();
    ctx.beginPath(); ctx.arc(-w * 0.26, s * 0.04, s * 0.17, 0, 7); ctx.fillStyle = '#CFE3C9'; ctx.fill(); ctx.lineWidth = lw(s) * 0.7; ctx.strokeStyle = C.ink; ctx.stroke();
    K.txt(ctx, '$', -w * 0.26, s * 0.12, { f: 'display', s: s * 0.22, w: 900, c: C.ink, a: 'center' });
    K.txt(ctx, o.label || 'U.S. TREASURY', s * 0.2, -h * 0.16, { f: 'mono', s: s * 0.1, w: 700, c: C.ink, a: 'center', ls: 1 });
    K.txt(ctx, o.sub || 'T-BILL', s * 0.2, h * 0.12, { f: 'display', s: s * 0.2, w: 900, c: '#2F5F2C', a: 'center', st: 'condensed' });
    end(ctx);
  };
  I.loan = (ctx, x, y, s, o = {}) => { // manila folder
    begin(ctx, x, y, s, o); const w = s * 1.1, h = s * 0.82;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + s * 0.1); ctx.lineTo(-w / 2, -h / 2); ctx.lineTo(-w * 0.12, -h / 2); ctx.lineTo(-w * 0.04, -h / 2 + s * 0.1); ctx.closePath(); fs(ctx, '#E9C77E');
    rr(ctx, -w / 2, -h / 2 + s * 0.1, w, h - s * 0.1, s * 0.05); fs(ctx, o.fill || '#F2D592');
    K.txt(ctx, o.label || 'LOAN', 0, s * 0.12, { f: 'mono', s: s * 0.16, w: 700, c: C.ink, a: 'center', ls: 2 });
    ctx.lineWidth = lw(s) * 0.6; ctx.beginPath(); ctx.moveTo(-w * 0.28, s * 0.24); ctx.quadraticCurveTo(-w * 0.1, s * 0.16, 0, s * 0.26); ctx.quadraticCurveTo(w * 0.1, s * 0.33, w * 0.28, s * 0.22); ctx.stroke();
    end(ctx);
  };
  I.share = (ctx, x, y, s, o = {}) => { // share certificate with ribbon
    begin(ctx, x, y, s, o); const w = s * 1.45, h = s * 0.95;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.04); fs(ctx, o.fill || '#FFF8E6');
    rr(ctx, -w / 2 + s * 0.06, -h / 2 + s * 0.06, w - s * 0.12, h - s * 0.12, 3); ctx.lineWidth = lw(s) * 0.45; ctx.strokeStyle = C.goldDark; ctx.setLineDash([s * 0.03, s * 0.02]); ctx.stroke(); ctx.setLineDash([]);
    K.txt(ctx, o.title || 'SHARE CERTIFICATE', 0, -h * 0.22, { f: 'serif', s: s * 0.11, w: 700, c: C.ink, a: 'center' });
    K.txt(ctx, o.label || '1 SHARE', 0, h * 0.04, { f: 'mono', s: s * 0.1, w: 700, c: C.ink2, a: 'center', ls: 1 });
    ctx.beginPath(); ctx.arc(w * 0.3, h * 0.24, s * 0.1, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = lw(s) * 0.6; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.27, h * 0.32); ctx.lineTo(w * 0.24, h * 0.46); ctx.lineTo(w * 0.29, h * 0.42); ctx.lineTo(w * 0.32, h * 0.46); ctx.lineTo(w * 0.33, h * 0.32); ctx.fillStyle = C.red; ctx.fill(); ctx.stroke();
    end(ctx);
  };
  I.lawsuit = (ctx, x, y, s, o = {}) => {
    I.doc(ctx, x, y, s, { fill: '#FFF', lines: true, title: 'LAWSUIT' });
    K.txt(ctx, o.case || 'CASE NO. 404', x, y + s * 0.38, { f: 'mono', s: s * 0.07, w: 600, c: C.red, a: 'center', ls: 1 });
  };
  I.sticky = (ctx, x, y, s, o = {}) => { // sticky note with handwritten text
    begin(ctx, x, y, s, o); ctx.rotate(o.tilt === undefined ? -0.06 : o.tilt);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-s / 2 + 5, -s / 2 + 7, s, s);
    ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s); fs(ctx, o.fill || '#FFE37A');
    if (o.text) K.txt(ctx, o.text, 0, s * 0.08, { f: 'hand', s: s * (o.ts || 0.26), w: 700, c: C.ink, a: 'center' });
    end(ctx);
  };
  I.clipboard = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * (o.wide || 0.78), h = s;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.06); fs(ctx, '#C9A36A');
    rr(ctx, -w / 2 + s * 0.06, -h / 2 + s * 0.1, w - s * 0.12, h - s * 0.16, s * 0.03); fs(ctx, C.card);
    rr(ctx, -s * 0.16, -h / 2 - s * 0.04, s * 0.32, s * 0.12, s * 0.03); fs(ctx, '#8C8C8C');
    (o.items || []).forEach((it, i) => {
      const yy = -h * 0.22 + i * s * 0.2;
      K.txt(ctx, it[0], -w * 0.38, yy + s * 0.03, { f: 'mono', s: s * (o.ts || 0.075), w: 700, c: C.ink, ls: 0.5 });
      if (it[1] > 0) (it[2] === false ? K.cross : K.check)(ctx, w * 0.34, yy, s * 0.12, it[1], it[2] === false ? C.red : C.green, s * 0.03);
    });
    end(ctx);
  };
  // ---- things & places ------------------------------------------------------------------------------
  I.goldbar = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * 1.25, h = s * 0.5, t = s * 0.22;
    ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w / 2 - t, -h / 2 + s * 0.08); ctx.lineTo(-w / 2 + t, -h / 2 + s * 0.08); ctx.closePath(); fs(ctx, o.fill || C.gold);
    ctx.beginPath(); ctx.moveTo(-w / 2 + t, -h / 2 + s * 0.08); ctx.lineTo(-w / 2 + t + s * 0.1, -h / 2 - s * 0.06); ctx.lineTo(w / 2 - t + s * 0.1, -h / 2 - s * 0.06); ctx.lineTo(w / 2 - t, -h / 2 + s * 0.08); ctx.closePath(); fs(ctx, o.top || C.goldLite);
    ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + s * 0.1, h / 2 - s * 0.12); ctx.lineTo(w / 2 - t + s * 0.1, -h / 2 - s * 0.06); ctx.lineTo(w / 2 - t, -h / 2 + s * 0.08); ctx.closePath(); fs(ctx, o.side || C.goldDark);
    if (o.serial) K.txt(ctx, o.serial, 0, h * 0.22, { f: 'mono', s: s * 0.12, w: 700, c: '#6B4A12', a: 'center', ls: 1 });
    if (o.frost) { ctx.globalAlpha = o.frost * 0.8; ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w / 2 - t, -h / 2 + s * 0.08); ctx.lineTo(-w / 2 + t, -h / 2 + s * 0.08); ctx.closePath(); ctx.fillStyle = '#CFEFFF'; ctx.fill(); }
    end(ctx);
  };
  I.building = (ctx, x, y, s, o = {}) => { // office tower, base at y + s/2
    begin(ctx, x, y, s, o); const w = s * 0.56, h = s;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.03); fs(ctx, o.fill || '#CFE0F0');
    ctx.fillStyle = o.win || '#7FA6CC'; ctx.lineWidth = lw(s) * 0.5;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { ctx.beginPath(); ctx.rect(-w * 0.36 + c * w * 0.26, -h * 0.4 + r * h * 0.12, w * 0.18, h * 0.07); ctx.fill(); }
    rr(ctx, -w * 0.12, h * 0.34, w * 0.24, h * 0.16, 2); ctx.fillStyle = C.ink2; ctx.fill();
    ctx.lineWidth = lw(s); rr(ctx, -w / 2, -h / 2, w, h, s * 0.03); ctx.stroke();
    end(ctx);
  };
  I.house = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * 0.9, h = s * 0.55;
    ctx.beginPath(); ctx.rect(-w / 2, -h * 0.1, w, h * 0.92); fs(ctx, o.fill || '#F3E2C7');
    ctx.beginPath(); ctx.moveTo(-w * 0.6, -h * 0.08); ctx.lineTo(0, -s * 0.5); ctx.lineTo(w * 0.6, -h * 0.08); ctx.closePath(); fs(ctx, o.roof || C.red);
    rr(ctx, -w * 0.11, h * 0.25, w * 0.22, h * 0.57, 3); fs(ctx, o.door || '#8A5A33');
    ctx.beginPath(); ctx.arc(w * 0.06, h * 0.55, s * 0.018, 0, 7); ctx.fillStyle = C.gold; ctx.fill();
    ctx.beginPath(); ctx.rect(-w * 0.4, h * 0.08, w * 0.2, h * 0.22); fs(ctx, '#BFD8EE');
    ctx.beginPath(); ctx.rect(w * 0.2, h * 0.08, w * 0.2, h * 0.22); fs(ctx, '#BFD8EE');
    end(ctx);
  };
  I.bank = (ctx, x, y, s, o = {}) => { // classical columns
    begin(ctx, x, y, s, o); const w = s * 1.1, h = s * 0.9;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.22); ctx.lineTo(0, -h / 2); ctx.lineTo(w / 2, -h * 0.22); ctx.closePath(); fs(ctx, o.fill || C.paper);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.rect(-w * 0.38 + i * w * 0.24, -h * 0.16, w * 0.1, h * 0.5); fs(ctx, o.fill || C.paper); }
    ctx.beginPath(); ctx.rect(-w / 2, h * 0.34, w, h * 0.14); fs(ctx, o.fill || C.paper);
    if (o.label) K.txt(ctx, o.label, 0, -h * 0.26, { f: 'mono', s: s * 0.09, w: 700, c: C.ink, a: 'center', ls: 1 });
    end(ctx);
  };
  I.vault = (ctx, x, y, s, o = {}) => { // o.open 0..1 swings the door; o.dashed for weak custody
    begin(ctx, x, y, s, o); const R = s * 0.5;
    rr(ctx, -R * 1.08, -R * 1.08, R * 2.16, R * 2.16, s * 0.08); if (o.dashed) ctx.setLineDash([s * 0.06, s * 0.05]); fs(ctx, o.dashed ? 'rgba(0,0,0,0)' : '#B9B4A8'); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(0, 0, R * 0.92, 0, 7); fs(ctx, o.dashed ? 'rgba(0,0,0,0)' : '#3B3530');
    if (o.inside) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, 7); ctx.clip(); o.inside(ctx); ctx.restore(); }
    const op = o.open || 0;
    if (op < 1 && !o.dashed) {
      ctx.save(); ctx.translate(-R * 0.92, 0); ctx.scale(1 - op * 0.94, 1); ctx.translate(R * 0.92, 0);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, 7); fs(ctx, '#8E877B');
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, 7); ctx.lineWidth = lw(s) * 0.6; ctx.stroke();
      ctx.lineWidth = lw(s) * 0.9; const sp = (o.spin || 0) * 6;
      for (let i = 0; i < 3; i++) { const a = sp + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45); ctx.lineTo(-Math.cos(a) * R * 0.45, -Math.sin(a) * R * 0.45); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, 7); fs(ctx, C.gold);
      ctx.restore();
    }
    end(ctx);
  };
  I.wallet = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * 1.1, h = s * 0.78;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.1); fs(ctx, o.fill || '#5B4636');
    rr(ctx, w * 0.1, -h * 0.18, w * 0.44, h * 0.36, s * 0.08); fs(ctx, o.flap || '#7A5E48');
    ctx.beginPath(); ctx.arc(w * 0.28, 0, s * 0.05, 0, 7); ctx.fillStyle = C.gold; ctx.fill();
    if (o.label) K.txt(ctx, o.label, -w * 0.18, s * 0.06, { f: 'mono', s: s * 0.14, w: 700, c: C.card, a: 'center' });
    end(ctx);
  };
  I.ledger = (ctx, x, y, s, o = {}) => { // old leather ledger, open
    begin(ctx, x, y, s, o); const w = s * 1.5, h = s * 0.95;
    rr(ctx, -w / 2 - s * 0.04, -h / 2 + s * 0.03, w + s * 0.08, h, s * 0.05); fs(ctx, '#7A4B2A');
    rr(ctx, -w / 2, -h / 2, w / 2, h * 0.96, s * 0.03); fs(ctx, '#F7EFD9');
    rr(ctx, 0, -h / 2, w / 2, h * 0.96, s * 0.03); fs(ctx, '#F7EFD9');
    ctx.lineWidth = lw(s) * 0.4; ctx.strokeStyle = '#B9A98A';
    for (let i = 0; i < 6; i++) { const yy = -h * 0.32 + i * h * 0.13; ctx.beginPath(); ctx.moveTo(-w * 0.45, yy); ctx.lineTo(-w * 0.05, yy); ctx.moveTo(w * 0.05, yy); ctx.lineTo(w * 0.45, yy); ctx.stroke(); }
    end(ctx);
  };
  I.block = (ctx, x, y, s, o = {}) => { // one onchain block (cube)
    begin(ctx, x, y, s, o); const w = s * 0.86, d = s * 0.18;
    ctx.beginPath(); ctx.moveTo(-w / 2, -w / 2 + d); ctx.lineTo(-w / 2 + d, -w / 2); ctx.lineTo(w / 2 + d, -w / 2); ctx.lineTo(w / 2, -w / 2 + d); ctx.closePath(); fs(ctx, o.top || '#FFD2B0');
    ctx.beginPath(); ctx.moveTo(w / 2, -w / 2 + d); ctx.lineTo(w / 2 + d, -w / 2); ctx.lineTo(w / 2 + d, w / 2); ctx.lineTo(w / 2, w / 2 + d); ctx.closePath(); fs(ctx, o.side || C.orange2);
    ctx.beginPath(); ctx.rect(-w / 2, -w / 2 + d, w, w); fs(ctx, o.fill || C.orange);
    if (o.label) K.txt(ctx, o.label, 0, d / 2 + s * 0.05, { f: 'mono', s: s * 0.12, w: 700, c: C.card, a: 'center', ls: 1 });
    end(ctx);
  };
  I.gavel = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); ctx.rotate(o.swing || -0.6);
    rr(ctx, -s * 0.05, -s * 0.05, s * 0.6, s * 0.1, s * 0.04); fs(ctx, '#A0683C');
    rr(ctx, -s * 0.3, -s * 0.22, s * 0.3, s * 0.44, s * 0.06); fs(ctx, '#7A4B2A');
    end(ctx);
  };
  I.gear = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); ctx.rotate(o.a || 0); const R = s * 0.5, n = 8;
    ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? R * 0.78 : R; ctx.lineTo(Math.cos(a - 0.12) * r, Math.sin(a - 0.12) * r); ctx.lineTo(Math.cos(a + 0.12) * r, Math.sin(a + 0.12) * r); } ctx.closePath(); fs(ctx, o.fill || '#9C9488');
    ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, 7); fs(ctx, C.bg);
    end(ctx);
  };
  I.key = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o);
    ctx.beginPath(); ctx.arc(-s * 0.28, 0, s * 0.2, 0, 7); fs(ctx, o.fill || C.gold); ctx.beginPath(); ctx.arc(-s * 0.28, 0, s * 0.07, 0, 7); fs(ctx, C.bg);
    ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.05); ctx.lineTo(s * 0.45, -s * 0.05); ctx.lineTo(s * 0.45, s * 0.05); ctx.lineTo(s * 0.36, s * 0.05); ctx.lineTo(s * 0.36, s * 0.16); ctx.lineTo(s * 0.26, s * 0.16); ctx.lineTo(s * 0.26, s * 0.05); ctx.lineTo(-s * 0.08, s * 0.05); ctx.closePath(); fs(ctx, o.fill || C.gold);
    end(ctx);
  };
  I.padlock = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const op = o.open || 0;
    ctx.beginPath(); ctx.arc(0, -s * 0.12 - op * s * 0.14, s * 0.22, Math.PI, 0); ctx.lineTo(s * 0.22, -s * 0.02 - op * s * 0.14); ctx.moveTo(-s * 0.22, -s * 0.12 - op * s * 0.14); ctx.lineTo(-s * 0.22, -s * 0.02); ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#7C7C7C'; ctx.stroke();
    ctx.lineWidth = lw(s); ctx.strokeStyle = C.ink;
    rr(ctx, -s * 0.34, -s * 0.06, s * 0.68, s * 0.5, s * 0.07); fs(ctx, o.fill || C.gold);
    ctx.beginPath(); ctx.arc(0, s * 0.14, s * 0.06, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.fillRect(-s * 0.02, s * 0.14, s * 0.04, s * 0.12);
    end(ctx);
  };
  I.link = (ctx, x, y, s, o = {}) => { // chain link (horizontal)
    begin(ctx, x, y, s, o); ctx.lineWidth = s * 0.14; ctx.strokeStyle = o.c || '#8E877B';
    rr(ctx, -s * 0.5, -s * 0.22, s, s * 0.44, s * 0.22); ctx.stroke();
    ctx.lineWidth = lw(s) * 0.5; ctx.strokeStyle = C.ink; rr(ctx, -s * 0.57, -s * 0.29, s * 1.14, s * 0.58, s * 0.29); ctx.stroke(); rr(ctx, -s * 0.43, -s * 0.15, s * 0.86, s * 0.3, s * 0.15); ctx.stroke();
    end(ctx);
  };
  I.flag = (ctx, x, y, s, o = {}) => { // planted flag, base at (x,y)
    begin(ctx, x, y, s, o); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s); ctx.stroke();
    const wv = o.wave || 0; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.3, -s - s * 0.06 + wv * 6, s * 0.62, -s + s * 0.04); ctx.lineTo(s * 0.62, -s * 0.62); ctx.quadraticCurveTo(s * 0.3, -s * 0.58 + wv * 6, 0, -s * 0.66); ctx.closePath(); fs(ctx, o.fill || C.red);
    end(ctx);
  };
  I.magnifier = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); ctx.beginPath(); ctx.moveTo(s * 0.18, s * 0.18); ctx.lineTo(s * 0.48, s * 0.48); ctx.lineWidth = s * 0.1; ctx.stroke(); ctx.lineWidth = lw(s);
    ctx.beginPath(); ctx.arc(-s * 0.05, -s * 0.05, s * 0.32, 0, 7); ctx.fillStyle = 'rgba(200,230,255,.35)'; ctx.fill(); ctx.lineWidth = s * 0.07; ctx.stroke();
    end(ctx);
  };
  I.calendar = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * 0.9, h = s * 0.86;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.08); fs(ctx, C.card);
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h * 0.28); ctx.fillStyle = o.top || C.red; ctx.fill(); rr(ctx, -w / 2, -h / 2, w, h, s * 0.08); ctx.stroke();
    if (o.label) K.txt(ctx, o.label, 0, -h / 2 + h * 0.2, { f: 'mono', s: s * 0.12, w: 700, c: C.card, a: 'center', ls: 1 });
    if (o.big) K.txt(ctx, o.big, 0, h * 0.3, { f: 'display', s: s * 0.36, w: 900, c: C.ink, a: 'center', st: 'condensed' });
    end(ctx);
  };
  I.clock = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const R = s * 0.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); fs(ctx, o.fill || C.card);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78); ctx.lineTo(Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88); ctx.lineWidth = lw(s) * 0.5; ctx.stroke(); }
    const h = o.h === undefined ? 10 : o.h, m = o.m === undefined ? 10 : o.m;
    ctx.lineWidth = lw(s); const ah = (h / 12) * Math.PI * 2 - Math.PI / 2, am = (m / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ah) * R * 0.45, Math.sin(ah) * R * 0.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(am) * R * 0.7, Math.sin(am) * R * 0.7); ctx.stroke();
    end(ctx);
  };
  I.antenna = (ctx, x, y, s, o = {}) => { // oracle: dish on a pole, base at y+s/2
    begin(ctx, x, y, s, o);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(-s * 0.2, s * 0.5); ctx.moveTo(0, -s * 0.05); ctx.lineTo(s * 0.2, s * 0.5); ctx.stroke();
    ctx.save(); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.34, s * 0.15, 0, 0, Math.PI); ctx.closePath(); fs(ctx, o.fill || C.card); ctx.beginPath(); ctx.moveTo(0, -s * 0.06); ctx.lineTo(0, -s * 0.36); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -s * 0.38, s * 0.04, 0, 7); ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
    const w = o.waves || 0; if (w > 0) { ctx.lineWidth = lw(s) * 0.7; ctx.strokeStyle = C.orange; for (let i = 0; i < 3; i++) { const k = (w + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.5, s * (0.12 + k * 0.4), -1.4, 0.2); ctx.stroke(); } ctx.globalAlpha = 1; }
    end(ctx);
  };
  I.bolt = (ctx, x, y, s, o = {}) => { begin(ctx, x, y, s, o); ctx.beginPath(); const P = [[0.1, -0.5], [-0.25, 0.05], [0, 0.05], [-0.1, 0.5], [0.28, -0.08], [0.02, -0.08], [0.18, -0.5]]; P.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, p[0] * s, p[1] * s)); ctx.closePath(); fs(ctx, o.fill || C.neonYellow); end(ctx); };
  I.snail = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o);
    ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.25); ctx.quadraticCurveTo(-s * 0.6, s * 0.05, -s * 0.42, s * 0.02); ctx.lineTo(s * 0.45, s * 0.12); ctx.quadraticCurveTo(s * 0.55, s * 0.25, s * 0.4, s * 0.28); ctx.closePath(); fs(ctx, '#B9D98F');
    ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.04); ctx.lineTo(-s * 0.62, -s * 0.2); ctx.moveTo(-s * 0.44, s * 0.03); ctx.lineTo(-s * 0.48, -s * 0.22); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.02, -s * 0.1, s * 0.3, 0, 7); fs(ctx, o.shell || '#D99A5B');
    ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.35, r = s * 0.24 * (1 - i / 44); ctx.lineTo(s * 0.02 + Math.cos(a) * r, -s * 0.1 + Math.sin(a) * r); } ctx.lineWidth = lw(s) * 0.6; ctx.stroke();
    end(ctx);
  };
  I.cricket = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const ch = o.chirp || 0;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.4, s * 0.16, 0, 0, 7); fs(ctx, '#5C7A3A');
    ctx.beginPath(); ctx.arc(-s * 0.42, -s * 0.04, s * 0.13, 0, 7); fs(ctx, '#6E8F47');
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.12); ctx.quadraticCurveTo(-s * 0.7, -s * 0.5, -s * 0.3, -s * 0.62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.1, s * 0.05); ctx.lineTo(s * 0.35, -s * 0.28 - ch * s * 0.06); ctx.lineTo(s * 0.55, s * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.12); ctx.lineTo(-s * 0.22, s * 0.3); ctx.moveTo(s * 0.0, s * 0.14); ctx.lineTo(s * 0.04, s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(-s * 0.46, -s * 0.07, s * 0.03, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
    end(ctx);
  };
  I.spider = (ctx, x, y, s, o = {}) => { // hanging from a thread above (x, y - len)
    ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - (o.len || 200)); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
    begin(ctx, x, y, s, o); ctx.lineWidth = lw(s) * 0.8;
    for (let i = 0; i < 4; i++) { const a = -0.5 + i * 0.33; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * s * 0.4, -s * 0.25 + i * s * 0.08, Math.cos(a) * s * 0.55, s * 0.2); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-Math.cos(a) * s * 0.4, -s * 0.25 + i * s * 0.08, -Math.cos(a) * s * 0.55, s * 0.2); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, 7); fs(ctx, '#2B2622');
    end(ctx);
  };
  I.tag = (ctx, x, y, s, o = {}) => { // price tag pointing left
    begin(ctx, x, y, s, o); const w = s * 1.6, h = s * 0.7;
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + h * 0.5, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2 + h * 0.5, h / 2); ctx.closePath(); fs(ctx, o.fill || C.card);
    ctx.beginPath(); ctx.arc(-w / 2 + h * 0.42, 0, s * 0.06, 0, 7); fs(ctx, C.bg);
    if (o.label) K.txt(ctx, o.label, s * 0.12, s * 0.12, { f: 'display', s: s * 0.34, w: 900, c: C.ink, a: 'center', st: 'condensed' });
    end(ctx);
  };
  I.bucket = (ctx, x, y, s, o = {}) => { // o.level 0..1 fill, o.cracked 0..1
    begin(ctx, x, y, s, o); const wt = s * 1.1, wb = s * 0.86, h = s * 0.62;
    const lv = K.clamp(o.level || 0);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-wt / 2, -h / 2); ctx.lineTo(wt / 2, -h / 2); ctx.lineTo(wb / 2, h / 2); ctx.lineTo(-wb / 2, h / 2); ctx.closePath(); ctx.fillStyle = C.card; ctx.fill(); ctx.clip();
    if (lv > 0) { ctx.fillStyle = o.liquid || '#5FA8E8'; ctx.fillRect(-wt / 2, h / 2 - h * lv, wt, h * lv); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-wt / 2, h / 2 - h * lv, wt, 4); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-wt / 2, -h / 2); ctx.lineTo(wt / 2, -h / 2); ctx.lineTo(wb / 2, h / 2); ctx.lineTo(-wb / 2, h / 2); ctx.closePath(); ctx.stroke();
    if (o.cracked) { ctx.strokeStyle = C.red; ctx.lineWidth = lw(s) * 0.9; ctx.beginPath(); const c = K.clamp(o.cracked); ctx.moveTo(-s * 0.05, -h / 2); ctx.lineTo(s * 0.05, -h * 0.2 * c); ctx.lineTo(-s * 0.08, h * 0.1 * c); ctx.lineTo(s * 0.04, h * 0.45 * c); ctx.stroke(); }
    end(ctx);
  };
  I.rock = (ctx, x, y, s, o = {}) => { begin(ctx, x, y, s, o); ctx.beginPath(); const P = [[-0.5, 0.1], [-0.3, -0.35], [0.1, -0.45], [0.48, -0.15], [0.42, 0.3], [-0.1, 0.42]]; P.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, p[0] * s, p[1] * s)); ctx.closePath(); fs(ctx, o.fill || C.red); end(ctx); };
  I.gate = (ctx, x, y, s, o = {}) => { // portcullis; o.down 0..1
    begin(ctx, x, y, s, o); const w = s * 1.2, h = s;
    ctx.beginPath(); ctx.rect(-w / 2 - s * 0.08, -h / 2 - s * 0.1, s * 0.1, h + s * 0.1); fs(ctx, '#8E877B'); ctx.beginPath(); ctx.rect(w / 2 - s * 0.02, -h / 2 - s * 0.1, s * 0.1, h + s * 0.1); fs(ctx, '#8E877B');
    ctx.beginPath(); ctx.rect(-w / 2 - s * 0.08, -h / 2 - s * 0.16, w + s * 0.2, s * 0.1); fs(ctx, '#6E675C');
    const dn = K.clamp(o.down === undefined ? 1 : o.down), gh = h * dn;
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, gh); ctx.clip();
    ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#3E3A35';
    for (let i = 0; i <= 6; i++) { const xx = -w / 2 + i * w / 6; ctx.beginPath(); ctx.moveTo(xx, -h / 2); ctx.lineTo(xx, -h / 2 + gh); ctx.stroke(); }
    for (let j = 1; j <= 4; j++) { const yy = -h / 2 + gh - j * h / 5; ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy); ctx.stroke(); }
    ctx.restore();
    end(ctx);
  };
  I.door = (ctx, x, y, s, o = {}) => { // door in a frame, o.open 0..1, base at y+s/2
    begin(ctx, x, y, s, o); const w = s * 0.56, h = s;
    ctx.beginPath(); ctx.rect(-w / 2 - s * 0.05, -h / 2 - s * 0.05, w + s * 0.1, h + s * 0.05); fs(ctx, '#3A332C');
    const op = K.clamp(o.open || 0);
    ctx.save(); ctx.translate(-w / 2, 0); ctx.scale(1 - op * 0.82, 1); ctx.translate(w / 2, 0);
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); fs(ctx, o.fill || '#B07A4A');
    ctx.lineWidth = lw(s) * 0.5; ctx.beginPath(); ctx.rect(-w * 0.36, -h * 0.4, w * 0.72, h * 0.32); ctx.rect(-w * 0.36, h * 0.0, w * 0.72, h * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.32, h * 0.02, s * 0.03, 0, 7); ctx.fillStyle = C.gold; ctx.fill();
    ctx.restore();
    if (o.label) K.txt(ctx, o.label, 0, -h / 2 - s * 0.13, { f: 'mono', s: s * 0.09, w: 700, c: C.ink, a: 'center', ls: 1 });
    end(ctx);
  };
  I.rope = (ctx, x, y, s, o = {}) => { // velvet rope between two posts, width s*1.4, o.open 0..1
    begin(ctx, x, y, s, o); const w = s * 1.4, op = K.clamp(o.open || 0);
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.rect(sx * w / 2 - s * 0.04, -s * 0.3, s * 0.08, s * 0.62); fs(ctx, C.gold); ctx.beginPath(); ctx.arc(sx * w / 2, -s * 0.32, s * 0.07, 0, 7); fs(ctx, C.gold); ctx.beginPath(); ctx.ellipse(sx * w / 2, s * 0.33, s * 0.14, s * 0.05, 0, 0, 7); fs(ctx, '#8C6A2B'); }
    ctx.lineWidth = s * 0.07; ctx.strokeStyle = '#B3263A';
    ctx.beginPath(); ctx.moveTo(-w / 2, -s * 0.22);
    if (op < 0.5) ctx.quadraticCurveTo(0, s * 0.12 * (1 - op * 2) + s * 0.02, (w / 2) * (1 - op * 2) + (-w / 2) * op * 2 + 0 * op, -s * 0.22 + op * s * 0.4);
    else ctx.quadraticCurveTo(-w / 2 + s * 0.04, -s * 0.0, -w / 2 + s * 0.06, s * 0.2);
    ctx.stroke();
    end(ctx);
  };
  I.globe = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const R = s * 0.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); fs(ctx, '#CFE6F5');
    ctx.save(); ctx.clip(); ctx.fillStyle = '#9BCB8E'; const sp = o.spin || 0;
    for (const [px, py, rx, ry] of [[-0.3, -0.2, 0.28, 0.2], [0.25, 0.1, 0.22, 0.3], [-0.05, 0.35, 0.18, 0.1]]) { ctx.beginPath(); ctx.ellipse(((px + sp + 1.5) % 2 - 1) * R, py * R, rx * R, ry * R, 0.3, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    ctx.lineWidth = lw(s) * 0.4; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.45, R, 0, 0, 7); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.stroke();
    end(ctx);
  };
  I.pin = (ctx, x, y, s, o = {}) => { // map pin, tip at (x,y)
    begin(ctx, x, y, s, o); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s * 0.45, -s * 0.5, -s * 0.38, -s, 0, -s); ctx.bezierCurveTo(s * 0.38, -s, s * 0.45, -s * 0.5, 0, 0); fs(ctx, o.fill || C.orange); ctx.beginPath(); ctx.arc(0, -s * 0.68, s * 0.13, 0, 7); fs(ctx, C.card); end(ctx);
  };
  I.ballot = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); const w = s * 0.9, h = s * 0.7;
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2 + s * 0.1, w, h); fs(ctx, o.fill || '#DCE9F7');
    ctx.beginPath(); ctx.rect(-w * 0.3, -h / 2 + s * 0.06, w * 0.6, s * 0.06); fs(ctx, C.ink);
    K.txt(ctx, 'VOTE', 0, s * 0.2, { f: 'mono', s: s * 0.16, w: 700, c: C.ink, a: 'center', ls: 2 });
    end(ctx);
  };
  I.rocket = (ctx, x, y, s, o = {}) => {
    begin(ctx, x, y, s, o); ctx.rotate(0.7);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.quadraticCurveTo(s * 0.22, -s * 0.2, s * 0.16, s * 0.2); ctx.lineTo(-s * 0.16, s * 0.2); ctx.quadraticCurveTo(-s * 0.22, -s * 0.2, 0, -s * 0.5); fs(ctx, C.card);
    ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.07, 0, 7); fs(ctx, '#7FB6E8');
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.15, s * 0.05); ctx.lineTo(sx * s * 0.3, s * 0.3); ctx.lineTo(sx * s * 0.14, s * 0.22); ctx.closePath(); fs(ctx, C.red); }
    ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.22); ctx.quadraticCurveTo(0, s * 0.6, s * 0.1, s * 0.22); fs(ctx, C.orange);
    end(ctx);
  };
  I.chartUp = (ctx, x, y, s, o = {}) => { // green rocket chart; o.p reveal
    begin(ctx, x, y, s, o); const w = s * 1.3, h = s, p = o.p === undefined ? 1 : o.p;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.stroke();
    const P = [[0, 0.85], [0.18, 0.7], [0.32, 0.78], [0.5, 0.55], [0.64, 0.6], [0.8, 0.25], [0.95, 0.02]];
    ctx.beginPath(); ctx.strokeStyle = o.c || C.green; ctx.lineWidth = lw(s) * 1.5;
    const n = (P.length - 1) * p; for (let i = 0; i <= Math.floor(n); i++) { const q = P[i]; const px = -w / 2 + q[0] * w, py = -h / 2 + q[1] * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    const fr = n - Math.floor(n), a = P[Math.floor(n)], b = P[Math.min(P.length - 1, Math.floor(n) + 1)];
    if (fr > 0) ctx.lineTo(-w / 2 + K.lerp(a[0], b[0], fr) * w, -h / 2 + K.lerp(a[1], b[1], fr) * h);
    ctx.stroke(); end(ctx);
  };
  I.fire = (ctx, x, y, s, o = {}) => { // flickering flame, base at (x,y)
    const t = o.t || 0; begin(ctx, x, y, s, o);
    for (const [k, c] of [[1, C.orange], [0.62, C.neonYellow]]) {
      const f = 1 + Math.sin(t * 23) * 0.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s * 0.4 * k, -s * 0.15 * k, -s * 0.25 * k, -s * 0.6 * k * f, 0, -s * k * f); ctx.bezierCurveTo(s * 0.12 * k, -s * 0.6 * k, s * 0.45 * k, -s * 0.3 * k, 0, 0); ctx.fillStyle = c; ctx.fill(); if (k === 1) ctx.stroke();
    }
    end(ctx);
  };
  I.cash = (ctx, x, y, s, o = {}) => { // banknote
    begin(ctx, x, y, s, o); const w = s * 1.4, h = s * 0.7;
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.05); fs(ctx, o.fill || '#BFE3B4');
    ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, 7); fs(ctx, '#9DD08D');
    K.txt(ctx, o.label || '$', 0, s * 0.1, { f: 'display', s: s * 0.28, w: 900, c: '#2F5F2C', a: 'center' });
    end(ctx);
  };
  I.press = (ctx, x, y, s, o = {}) => { // minting press; o.down 0..1
    begin(ctx, x, y, s, o); const w = s * 1.1, h = s;
    ctx.beginPath(); ctx.rect(-w / 2, h * 0.3, w, h * 0.2); fs(ctx, '#8E877B');
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w * 0.12, h * 0.8); fs(ctx, '#8E877B'); ctx.beginPath(); ctx.rect(w / 2 - w * 0.12, -h / 2, w * 0.12, h * 0.8); fs(ctx, '#8E877B');
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h * 0.14); fs(ctx, '#6E675C');
    const d = K.clamp(o.down || 0); ctx.beginPath(); ctx.rect(-w * 0.12, -h * 0.36, w * 0.24, h * 0.2 + d * h * 0.28); fs(ctx, '#B9B4A8');
    ctx.beginPath(); ctx.rect(-w * 0.26, -h * 0.16 + d * h * 0.28, w * 0.52, h * 0.1); fs(ctx, C.orange);
    if (o.label) K.txt(ctx, o.label, 0, -h / 2 + h * 0.105, { f: 'mono', s: s * 0.08, w: 700, c: C.card, a: 'center', ls: 2 });
    end(ctx);
  };
  I.tank = (ctx, x, y, s, o = {}) => { // vertical tank with level
    begin(ctx, x, y, s, o); const w = s * 0.6, h = s; const lv = K.clamp(o.level === undefined ? 1 : o.level);
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, s * 0.12); ctx.fillStyle = C.card; ctx.fill(); ctx.clip(); ctx.fillStyle = o.liquid || C.greenLite; ctx.fillRect(-w / 2, h / 2 - h * lv, w, h * lv); ctx.restore();
    rr(ctx, -w / 2, -h / 2, w, h, s * 0.12); ctx.stroke();
    if (o.label) K.txt(ctx, o.label, 0, h / 2 + s * 0.16, { f: 'mono', s: s * 0.1, w: 700, c: C.ink, a: 'center', ls: 1 });
    end(ctx);
  };
  I.zzz = (ctx, x, y, s, t) => { // floating Zs
    for (let i = 0; i < 3; i++) { const k = ((t || 0) * 0.5 + i / 3) % 1; K.txt(ctx, 'z', x + k * s * 0.5, y - k * s * 0.9, { f: 'hand', s: s * (0.45 + k * 0.4), w: 700, c: C.ink2, alpha: Math.sin(k * Math.PI) }); }
  };
  I.person = (ctx, x, y, s, o = {}) => { // simple investor figure, feet at y+s/2
    begin(ctx, x, y, s, o);
    ctx.beginPath(); ctx.arc(0, -s * 0.28, s * 0.17, 0, 7); fs(ctx, o.skin || '#F1C9A5');
    rr(ctx, -s * 0.2, -s * 0.1, s * 0.4, s * 0.48, s * 0.12); fs(ctx, o.fill || C.blue);
    end(ctx);
  };
  I.mascot = (ctx, x, y, r, o = {}) => { // token with a face: o.mood happy|smug|worried|sad, o.fill
    K.coin(ctx, x, y, r, { fill: o.fill || C.orange, mark: false, label: o.label });
    if (o.label) return;
    const m = o.mood || 'happy'; ctx.save(); ctx.translate(x, y); ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineCap = 'round';
    for (const sx of [-1, 1]) { ctx.beginPath(); if (m === 'smug') { ctx.moveTo(sx * r * 0.36, -r * 0.12); ctx.lineTo(sx * r * 0.14, -r * 0.12); ctx.stroke(); } else { ctx.ellipse(sx * r * 0.25, -r * 0.14, r * 0.07, r * 0.1, 0, 0, 7); ctx.fill(); } }
    ctx.beginPath();
    if (m === 'happy') ctx.arc(0, r * 0.06, r * 0.28, 0.2, Math.PI - 0.2);
    else if (m === 'smug') { ctx.moveTo(-r * 0.22, r * 0.25); ctx.quadraticCurveTo(r * 0.08, r * 0.38, r * 0.3, r * 0.15); }
    else if (m === 'worried') { ctx.moveTo(-r * 0.24, r * 0.32); ctx.quadraticCurveTo(-r * 0.08, r * 0.2, 0, r * 0.3); ctx.quadraticCurveTo(r * 0.1, r * 0.4, r * 0.24, r * 0.28); }
    else ctx.arc(0, r * 0.45, r * 0.24, Math.PI + 0.4, -0.4);
    ctx.stroke();
    if (m === 'worried') { ctx.beginPath(); ctx.moveTo(r * 0.6, -r * 0.45); ctx.quadraticCurveTo(r * 0.72, -r * 0.2, r * 0.6, -r * 0.12); ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r * 0.6, -r * 0.45); ctx.fillStyle = '#7FC4F5'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  };
})();
