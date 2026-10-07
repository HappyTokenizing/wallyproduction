/* WALLY vector rig — shared by the film (canvas) and the /guide site (canvas + SVG).
   Geometry is in the 500 x 600 space of the canonical standing line art (WALLY_GREY):
   flat grey fill, thick dark-teal ink, no eyes (the sunglasses glint IS the face).
   Every part is drawn back-to-front: ears -> body -> arms -> head -> trunk -> tusks.
   pose: { x, y, s, rot, bob, squash, earL, earR, headRot, trunk:{bend,curl,lift,wiggle,len},
           armL, armR, sparkle, flip,
           seated: 0|1        sits on a stack of three textbooks (legs fold, feet dangle in front)
           skate: {tilt}      stands on a skateboard (pose.y is then the board's ground line)
           prop: {kind, a, len, show, t, open, text}  held at the trunk tip; kind = pointer | magnifier |
                              mug | book | coin | juggle | sign   (pose.pointer = shorthand for kind pointer)
           think: {dots, bulb, t}  thought bubble above the right ear: "…" while thinking, then a lightbulb }
   (all optional; angles in radians). The sunglasses glint is a reflection, never eyes: it never animates. */
(function (root) {
  const INK = '#072421', FILL = '#D8D8D8', BELLY = '#A3A3A3', WHITE = '#FFFFFF';
  const SW = 11.5; // ink width in rig units
  const P = {
    earL: 'M150,40 L95,18 C70,8 45,8 28,30 C12,50 6,85 14,110 L60,218 C68,238 85,250 105,246 C120,243 135,226 148,212',
    earLFill: 'M150,40 L95,18 C70,8 45,8 28,30 C12,50 6,85 14,110 L60,218 C68,238 85,250 105,246 C120,243 135,226 148,212 L175,120 Z',
    body: 'M128,405 L127,445 L121,560 C120,580 128,591 146,591 L218,591 C228,591 232,585 232,575 L232,489 C232,483 236,480 242,480 L258,480 C264,480 268,483 268,489 L268,575 C268,585 272,591 282,591 L354,591 C372,591 380,580 379,560 L373,445 L372,405',
    bodyFill: 'M128,230 L128,405 L127,445 L121,560 C120,580 128,591 146,591 L218,591 C228,591 232,585 232,575 L232,489 C232,483 236,480 242,480 L258,480 C264,480 268,483 268,489 L268,575 C268,585 272,591 282,591 L354,591 C372,591 380,580 379,560 L373,445 L372,405 L372,230 Z',
    belly: 'M157,404 C190,445 310,445 343,404 C325,447 292,463 250,463 C208,463 175,447 157,404 Z',
    toes: ['M139,590 C139,551 172,551 172,590', 'M178,590 C178,551 211,551 211,590', 'M289,590 C289,551 322,551 322,590', 'M328,590 C328,551 361,551 361,590'],
    armL: 'M148,212 L52,310 C36,326 33,352 47,372 L92,424 C101,433 110,438 126,439',
    armLFill: 'M150,206 L52,310 C36,326 33,352 47,372 L92,424 C101,433 110,438 128,440 L128,405 L122,322 L165,250 Z',
    armLInner: 'M122,322 C118,345 118,375 128,405',
    head: 'M164,250 C150,222 124,160 121,110 C119,62 160,30 210,29 L290,29 C340,30 381,62 379,110 C376,160 350,222 336,250',
    headFill: 'M164,250 C150,222 124,160 121,110 C119,62 160,30 210,29 L290,29 C340,30 381,62 379,110 C376,160 350,222 336,250 L300,256 L292,330 L208,330 L200,256 Z',
    jawL: 'M164,250 L199,256', jawR: 'M336,250 L301,256',
    band: 'M124,103 L376,103 L376,117 L124,117 Z',
    lensL: 'M137,110 L244,110 L244,133 C244,158 220,174 190,174 C160,174 137,158 137,133 Z',
    lensR: 'M256,110 L363,110 L363,133 C363,158 339,174 309,174 C279,174 256,158 256,133 Z',
    bridge: 'M242,110 L258,110 L258,122 L242,122 Z',
    glintL: 'M166.9,158.4 C166.1,157.9 165.0,157.3 164.6,157.1 C163.4,156.4 160.0,153.7 160.0,153.4 C160.0,153.3 162.3,149.8 165.0,145.6 L170.0,138.1 L172.2,136.1 C173.3,134.9 174.4,134.0 174.6,134.0 C174.7,134.0 175.1,133.8 175.5,133.5 C176.6,132.7 179.0,132.0 181.4,131.7 L183.7,131.4 L186.6,131.8 C188.3,132.1 190.3,132.5 191.1,132.7 C191.9,132.9 193.4,133.1 194.3,133.1 L195.9,133.1 L196.8,132.5 C198.2,131.7 199.1,130.5 203.8,123.5 C206.3,119.8 208.4,116.7 208.6,116.5 L209.0,116.2 L214.8,116.1 C217.9,116.1 220.7,116.1 220.9,116.2 C221.4,116.4 221.3,117.1 220.8,117.8 C220.5,118.1 217.4,122.7 213.9,128.0 C205.7,140.3 204.6,141.4 199.4,143.3 L197.9,143.8 L194.9,143.9 L192.0,144.1 L189.7,143.5 C188.4,143.3 186.5,142.8 185.3,142.6 L183.3,142.2 L181.9,142.6 L180.5,143.1 L179.3,144.3 C178.6,145.0 178.0,145.7 178.0,145.8 C178.0,146.0 169.9,158.1 169.3,158.8 C168.8,159.4 168.6,159.4 166.9,158.4 Z',
    glintR: 'M285.7,158.5 C283.0,157.1 278.7,153.9 278.8,153.4 C278.8,153.1 279.1,152.6 285.1,143.7 C290.2,136.0 291.8,134.4 295.9,132.7 L297.4,132.0 L299.8,131.7 L302.2,131.4 L304.5,131.7 C305.8,131.9 307.6,132.2 308.5,132.4 C309.4,132.6 310.8,132.9 311.6,133.0 L313.1,133.2 L314.3,133.0 L315.4,132.7 L316.5,131.9 C317.0,131.4 318.8,129.0 320.4,126.6 L323.3,122.3 L329.3,122.2 L335.3,122.1 L335.7,122.4 L336.1,122.7 L335.9,123.1 C335.7,123.3 333.5,126.6 330.9,130.5 C328.3,134.4 325.8,138.1 325.3,138.6 C323.2,140.9 320.0,142.8 316.9,143.6 L315.4,144.0 L312.9,144.0 L310.4,144.0 L308.3,143.5 C307.1,143.3 305.1,142.9 303.9,142.6 L301.7,142.2 L300.6,142.6 C298.5,143.4 297.9,144.2 292.8,151.7 C290.1,155.8 287.7,159.2 287.5,159.2 C287.3,159.2 286.4,158.9 285.7,158.5 Z',
    tuskL: 'M164,251 L198,256 L198,348 C198,357 191,359 186,352 C171,331 164,298 164,251 Z',
    tuskR: 'M336,251 L302,256 L302,348 C302,357 309,359 314,352 C329,331 336,298 336,251 Z',
    wrinkles: ['M234,196 L266,196', 'M224,237 L276,237', 'M234,279 L266,279'],
  };
  // seated: everything below the hip line (y 470) folds to 62% height, so the legs dangle in front of the books
  const SEAT_Y = 470, SEAT_K = 0.62;
  const seatY = (y) => (y <= SEAT_Y ? y : SEAT_Y + (y - SEAT_Y) * SEAT_K);
  const seatPath = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${x},${+seatY(+y).toFixed(1)}`);
  const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${(500 - +x)},${y}`);
  P.earR = mirror(P.earL); P.earRFill = mirror(P.earLFill);
  P.armR = mirror(P.armL); P.armRFill = mirror(P.armLFill); P.armRInner = mirror(P.armLInner);
  P.bodyS = seatPath(P.body); P.bodyFillS = seatPath(P.bodyFill); P.toesS = P.toes.map(seatPath);

  // ---- parametric trunk: a spine from the brow (250,200) down to the tip (rest length 177).
  // The upper third is part of the face and stays put; the lower trunk bends from a hinge (u0).
  // bend: -1..1 (+ = tip swings to screen-right), curl: 0..1 (tip hooks further the same way),
  // lift: 0..1.2 (folds the lower trunk up about the hinge; 1 ~ horizontal, 1.2+ ~ up over the face),
  // wiggle: small S-wave (talking), len: length multiplier for the lower trunk.
  function trunkGeom(t) {
    t = t || {};
    const bend = t.bend || 0, curl = t.curl || 0, lift = t.lift || 0, wig = t.wiggle || 0, len = t.len || 1;
    const dir = bend < 0 ? -1 : 1;
    const N = 30, L0 = 177, u0 = 0.3;
    const pts = [];
    let x = 250, y = 200, ang = Math.PI / 2;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push({ x, y, ang, u });
      const seg = L0 / N * (u >= u0 ? len : 1);
      let k = 0;
      if (u >= u0) {
        const w = (u - u0) / (1 - u0);
        k = (-bend * 1.15 * (0.35 + w) - dir * curl * 3.2 * w * w) / L0 * 2.2;
        k += wig * 0.9 * Math.sin(w * Math.PI * 2) / L0 * 2.2;
        if (w < 0.4) k -= dir * lift * 1.25 / (0.4 * (1 - u0) * L0); // fold, spread over the first 40% below the hinge
      } else {
        k = wig * 0.15 * Math.sin(u * 9) / L0;
      }
      ang += k * seg;
      x += Math.cos(ang) * seg; y += Math.sin(ang) * seg;
    }
    // flex = how far from rest; the moving part slims a little so a raised trunk doesn't read as a flap
    const flex = Math.min(1, Math.abs(bend) * 0.6 + curl * 0.7 + lift * 0.8);
    const hw0 = (u) => { if (u < 0.82) return 57 - (57 - 29) * Math.pow(u / 0.82, 1.35); return 29 + (34.5 - 29) * ((u - 0.82) / 0.18); };
    const hw = (u) => { const w = Math.max(0, (u - u0 + 0.06) / (1 - u0)); const sm = Math.min(1, w * w * (3 - 2 * Math.min(1, w))); return hw0(u) * (1 - 0.42 * flex * sm); };
    const a = [], b = [];
    for (const p of pts) {
      const nx = -Math.sin(p.ang), ny = Math.cos(p.ang);
      const w = hw(p.u);
      a.push({ x: p.x + nx * w, y: p.y + ny * w });
      b.push({ x: p.x - nx * w, y: p.y - ny * w });
    }
    // inside of a tight fold the offset curve can run backwards and loop: collapse those points
    for (const side of [a, b]) {
      for (let i = 1; i < side.length; i++) {
        const tx = Math.cos(pts[i].ang), ty = Math.sin(pts[i].ang);
        const dx = side[i].x - side[i - 1].x, dy = side[i].y - side[i - 1].y;
        if (dx * tx + dy * ty < 0.4) { side[i] = { x: side[i - 1].x + tx * 0.4, y: side[i - 1].y + ty * 0.4 }; }
      }
    }
    return { spine: pts, a, b };
  }
  function polyPath(ctx, pts) { ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); }

  const cache = {};
  function P2(key) { if (!cache[key]) cache[key] = typeof Path2D !== 'undefined' ? new Path2D(P[key]) : null; return cache[key]; }

  function strokeInk(ctx, path, w) { ctx.lineWidth = w || SW; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(path); }
  function fillP(ctx, path, c) { ctx.fillStyle = c; ctx.fill(path); }

  function withPivot(ctx, px, py, rot, sx, sy, fn) {
    ctx.save(); ctx.translate(px, py); if (rot) ctx.rotate(rot); if (sx !== undefined) ctx.scale(sx, sy === undefined ? sx : sy); ctx.translate(-px, -py); fn(); ctx.restore();
  }

  // draw Wally into ctx; pose.x/y = screen position of the FEET CENTER, pose.s = scale (1 => 600 px tall)
  function draw(ctx, pose) {
    pose = pose || {};
    const s = pose.s || 1;
    ctx.save();
    ctx.translate(pose.x || 0, pose.y || 0);
    ctx.scale(s * (pose.flip ? -1 : 1), s);
    ctx.translate(-250, -591);
    const sq = pose.squash || 0; // + = squash down, - = stretch
    withPivot(ctx, 250, 591, pose.rot || 0, 1 + sq * 0.5, 1 - sq, () => {
      ctx.translate(0, -(pose.bob || 0));
      const headRot = pose.headRot || 0;
      // ears (behind everything), pivot near where they meet the head
      withPivot(ctx, 250, 250, headRot, undefined, undefined, () => {
        withPivot(ctx, 150, 120, -(pose.earL || 0), undefined, undefined, () => { fillP(ctx, P2('earLFill'), FILL); strokeInk(ctx, P2('earL')); });
        withPivot(ctx, 350, 120, (pose.earR || 0), undefined, undefined, () => { fillP(ctx, P2('earRFill'), FILL); strokeInk(ctx, P2('earR')); });
      });
      // body + belly + toes (seated: books first, then the folded body in front of them)
      const seated = !!pose.seated, sfx = seated ? 'S' : '';
      if (seated) drawBooks(ctx);
      if (pose.skate) drawSkateboard(ctx, pose.skate);
      fillP(ctx, P2('bodyFill' + sfx), FILL);
      fillP(ctx, P2('belly'), BELLY);
      strokeInk(ctx, P2('body' + sfx));
      const toes = seated ? P.toesS : P.toes;
      for (let i = 0; i < 4; i++) {
        const k = 'toe' + sfx + i; if (!cache[k]) cache[k] = new Path2D(toes[i] + ' Z');
        fillP(ctx, cache[k], WHITE);
        if (!cache[k + 's']) cache[k + 's'] = new Path2D(toes[i]);
        strokeInk(ctx, cache[k + 's']);
      }
      // arms (hands on hips); armL/armR = small rotation about the shoulder for gestures
      withPivot(ctx, 148, 212, pose.armL || 0, undefined, undefined, () => { fillP(ctx, P2('armLFill'), FILL); strokeInk(ctx, P2('armL')); strokeInk(ctx, P2('armLInner')); });
      withPivot(ctx, 352, 212, -(pose.armR || 0), undefined, undefined, () => { fillP(ctx, P2('armRFill'), FILL); strokeInk(ctx, P2('armR')); strokeInk(ctx, P2('armRInner')); });
      // head group
      withPivot(ctx, 250, 250, headRot, undefined, undefined, () => {
        fillP(ctx, P2('headFill'), FILL);
        strokeInk(ctx, P2('head'));
        fillP(ctx, P2('tuskL'), WHITE); strokeInk(ctx, P2('tuskL'));
        fillP(ctx, P2('tuskR'), WHITE); strokeInk(ctx, P2('tuskR'));
        strokeInk(ctx, P2('jawL')); strokeInk(ctx, P2('jawR'));
        // sunglasses
        ctx.fillStyle = INK; ctx.fill(P2('band')); ctx.fill(P2('lensL')); ctx.fill(P2('lensR')); ctx.fill(P2('bridge'));
        // the glint is a static reflection on the lenses: it is NOT a pair of eyes, so it never blinks or emotes
        ctx.fillStyle = WHITE; ctx.fill(P2('glintL')); ctx.fill(P2('glintR'));
        if (pose.sparkle) drawSparkle(ctx, 352, 112, pose.sparkle);
        const tg = trunkGeom(pose.trunk);
        const prop = pose.prop || (pose.pointer ? Object.assign({ kind: 'pointer' }, pose.pointer) : null);
        if (prop && prop.kind !== 'juggle' && prop.kind !== 'cover') drawProp(ctx, tg, prop);
        drawTrunk(ctx, pose.trunk, tg); // last: a raised trunk passes in front of tusks and glasses
        if (prop && prop.kind === 'cover') drawProp(ctx, tg, prop); // held up in front of the face
        if (prop && prop.kind === 'juggle') drawJuggle(ctx, tg, prop);
        if (prop && prop.kind === 'coin') drawCoinOnTip(ctx, tg, prop);
        if (pose.think) drawThink(ctx, pose.think);
      });
    });
    ctx.restore();
  }

  // a teacher's pointer stick gripped by the trunk tip. p = {a: angle (rad, 0 = right), len, show 0..1}
  function pointerPts(g, p) {
    const sp = g.spine, tip = sp[sp.length - 1], prev = sp[sp.length - 4];
    const a = p.a === undefined ? Math.atan2(tip.y - prev.y, tip.x - prev.x) - 0.35 : p.a;
    const len = (p.len || 300) * (p.show === undefined ? 1 : p.show);
    const gx = tip.x - Math.cos(tip.ang) * 10, gy = tip.y - Math.sin(tip.ang) * 10;
    return { x0: gx - Math.cos(a) * 46, y0: gy - Math.sin(a) * 46, x1: gx + Math.cos(a) * len, y1: gy + Math.sin(a) * len, a };
  }
  function drawPointer(ctx, g, p) {
    if (p.show !== undefined && p.show <= 0.01) return;
    const q = pointerPts(g, p), nx = -Math.sin(q.a), ny = Math.cos(q.a);
    ctx.save(); ctx.lineJoin = 'round';
    // tapered wooden rod
    ctx.beginPath(); ctx.moveTo(q.x0 + nx * 8, q.y0 + ny * 8); ctx.lineTo(q.x1 + nx * 4, q.y1 + ny * 4); ctx.lineTo(q.x1 - nx * 4, q.y1 - ny * 4); ctx.lineTo(q.x0 - nx * 8, q.y0 - ny * 8); ctx.closePath();
    ctx.fillStyle = '#C98C4E'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // rubber tip
    const tx = q.x1 + Math.cos(q.a) * 4, ty = q.y1 + Math.sin(q.a) * 4;
    ctx.beginPath(); ctx.arc(tx, ty, 9, 0, Math.PI * 2); ctx.fillStyle = '#E8582F'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  // grip point just inside the trunk tip, and the direction the tip points
  function grip(g) {
    const sp = g.spine, tip = sp[sp.length - 1], prev = sp[sp.length - 4];
    return { x: tip.x - Math.cos(tip.ang) * 10, y: tip.y - Math.sin(tip.ang) * 10, dir: Math.atan2(tip.y - prev.y, tip.x - prev.x), tip };
  }
  function inkLine(ctx, w) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
  function drawProp(ctx, g, p) {
    const show = p.show === undefined ? 1 : p.show; if (show <= 0.01) return;
    if (p.kind === 'pointer') return drawPointer(ctx, g, p);
    const G = grip(g), a = p.a === undefined ? G.dir : p.a, ca = Math.cos(a), sa = Math.sin(a);
    ctx.save(); ctx.translate(G.x, G.y);
    if (show < 1) ctx.scale(show, show);
    if (p.kind === 'magnifier') {
      const L = p.len || 92, R = 52, cx = ca * (L + R), cy = sa * (L + R), nx = -sa, ny = ca;
      ctx.beginPath(); ctx.moveTo(-ca * 34 + nx * 9, -sa * 34 + ny * 9); ctx.lineTo(ca * L + nx * 7, sa * L + ny * 7); ctx.lineTo(ca * L - nx * 7, sa * L - ny * 7); ctx.lineTo(-ca * 34 - nx * 9, -sa * 34 - ny * 9); ctx.closePath();
      ctx.fillStyle = '#7A4B2A'; ctx.fill(); inkLine(ctx, 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = 'rgba(205,232,255,.55)'; ctx.fill();
      inkLine(ctx, 13); ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#C9A15A'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.66, -2.6, -1.6); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
    } else if (p.kind === 'mug') {
      // the trunk tip hooks the handle; the mug hangs to the side of the tip
      ctx.rotate(a - Math.PI / 2 * 0); const t = p.t || 0;
      const mx = 46, my = 4, w = 78, h = 84;
      ctx.beginPath(); ctx.arc(mx - w / 2 - 6, my, 20, Math.PI * 0.5, Math.PI * 1.5); inkLine(ctx, 9); ctx.stroke(); // handle
      ctx.beginPath(); ctx.moveTo(mx - w / 2, my - h / 2); ctx.lineTo(mx + w / 2, my - h / 2); ctx.lineTo(mx + w / 2 - 5, my + h / 2 - 8);
      ctx.quadraticCurveTo(mx + w / 2 - 6, my + h / 2, mx + w / 2 - 14, my + h / 2); ctx.lineTo(mx - w / 2 + 14, my + h / 2);
      ctx.quadraticCurveTo(mx - w / 2 + 6, my + h / 2, mx - w / 2 + 5, my + h / 2 - 8); ctx.closePath();
      ctx.fillStyle = '#F7F2E6'; ctx.fill(); inkLine(ctx, 8); ctx.stroke();
      ctx.fillStyle = '#FF6200'; ctx.fillRect(mx - w / 2 + 3, my - 6, w - 6, 16);
      ctx.beginPath(); ctx.ellipse(mx, my - h / 2, w / 2 - 4, 7, 0, 0, Math.PI * 2); ctx.fillStyle = '#5A3A22'; ctx.fill();
      if (p.steam !== false) for (let i = 0; i < 3; i++) { // steam
        const ph = (t * 0.55 + i / 3) % 1, x0 = mx - 18 + i * 18, al = Math.sin(ph * Math.PI) * 0.8;
        ctx.beginPath(); for (let k = 0; k <= 10; k++) { const yy = my - h / 2 - 12 - k * 7 - ph * 30, xx = x0 + Math.sin(k * 0.9 + t * 3 + i) * 6; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.lineWidth = 5; ctx.strokeStyle = `rgba(160,150,135,${al})`; ctx.stroke();
      }
    } else if (p.kind === 'book') {
      // the textbook, held open by its spine at the trunk tip
      ctx.rotate(a); const op = p.open === undefined ? 1 : p.open, w = 92, h = 118, sp = 0.18 + 0.82 * op;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(side * w * sp, -h / 2 - 10 * op); ctx.lineTo(side * w * sp, h / 2 - 10 * op); ctx.lineTo(0, h / 2); ctx.closePath();
        ctx.fillStyle = '#FF6200'; ctx.fill(); inkLine(ctx, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -h / 2 + 7); ctx.lineTo(side * (w * sp - 8), -h / 2 - 10 * op + 7); ctx.lineTo(side * (w * sp - 8), h / 2 - 10 * op - 7); ctx.lineTo(0, h / 2 - 7); ctx.closePath();
        ctx.fillStyle = '#FBF8F1'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(32,26,19,.35)';
        if (op > 0.5) for (let k = 0; k < 5; k++) { const yy = -h / 2 + 24 + k * 17; ctx.beginPath(); ctx.moveTo(side * 12, yy); ctx.lineTo(side * (w * sp - 20), yy - 10 * op * (side * 0 + 1) * 0.6); ctx.stroke(); }
      }
    } else if (p.kind === 'cover') {
      const w = 170, h = 214; ctx.rotate((p.tilt || 0)); ctx.translate(0, p.dy === undefined ? -28 : p.dy);
      ctx.fillStyle = '#E8E1D2'; ctx.fillRect(-w / 2 + 8, -h / 2 + 6, w, h); // page block peeking out
      ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#FF6200'; ctx.fill(); inkLine(ctx, 8); ctx.stroke();
      ctx.fillStyle = 'rgba(32,26,19,.18)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 6, 14, h - 12); // spine shade
      ctx.fillStyle = '#FBF8F1'; ctx.font = '900 30px "Geist Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText("WALLY'S", 6, -h / 2 + 56); ctx.font = '900 21px "Geist Mono", ui-monospace, monospace'; ctx.fillText('RWA TEXTBOOK', 6, -h / 2 + 88);
      ctx.fillStyle = INK; ctx.fillRect(-w / 2 + 34, -h / 2 + 116, w - 56, 4);
      coinGlyph(ctx, 6, h / 2 - 50, 26, 0);
    } else if (p.kind === 'sign') {
      const L = p.len || 130, nx = -sa, ny = ca;
      ctx.beginPath(); ctx.moveTo(-ca * 30 + nx * 7, -sa * 30 + ny * 7); ctx.lineTo(ca * L + nx * 6, sa * L + ny * 6); ctx.lineTo(ca * L - nx * 6, sa * L - ny * 6); ctx.lineTo(-ca * 30 - nx * 7, -sa * 30 - ny * 7); ctx.closePath();
      ctx.fillStyle = '#C98C4E'; ctx.fill(); inkLine(ctx, 5); ctx.stroke();
      ctx.save(); ctx.translate(ca * (L + 46), sa * (L + 46)); ctx.rotate(p.tilt || 0);
      const tw = p.w || 190, th = 92; ctx.beginPath(); ctx.rect(-tw / 2, -th / 2, tw, th); ctx.fillStyle = '#FBF8F1'; ctx.fill(); inkLine(ctx, 8); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = `900 ${p.fs || 40}px "Geist Mono", ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text || '?', 0, 3);
      ctx.restore();
    }
    ctx.restore();
  }
  function coinGlyph(ctx, x, y, r, spin) {
    const k = Math.max(0.12, Math.abs(Math.cos(spin || 0)));
    ctx.save(); ctx.translate(x, y); ctx.scale(k, 1);
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r, r, 0, 0, Math.PI * 2); ctx.fillStyle = '#C24A00'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#FF6200'; ctx.fill(); inkLine(ctx, 6); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(32,26,19,.35)'; ctx.stroke();
    // tiny sunglasses: the coin is a Wally token
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-r * 0.27, -r * 0.05, r * 0.24, r * 0.17, 0, 0, Math.PI * 2); ctx.ellipse(r * 0.27, -r * 0.05, r * 0.24, r * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-r * 0.08, -r * 0.12, r * 0.16, r * 0.07);
    ctx.restore();
  }
  function drawCoinOnTip(ctx, g, p) {
    const G = grip(g), show = p.show === undefined ? 1 : p.show; if (show <= 0.01) return;
    const up = G.dir + Math.PI; // the tip points away from the trunk; balance the coin just beyond it
    coinGlyph(ctx, G.tip.x + Math.cos(G.dir) * 30, G.tip.y + Math.sin(G.dir) * 30 - 6, 38 * show, (p.t || 0) * 9);
  }
  function drawJuggle(ctx, g, p) {
    const G = grip(g), t = p.t || 0, per = p.period || 1.5, n = p.n || 3, show = p.show === undefined ? 1 : p.show; if (show <= 0.01) return;
    for (let i = 0; i < n; i++) {
      const ph = ((t / per + i / n) % 1 + 1) % 1, side = i % 2 ? 1 : -1;
      const x = G.tip.x + (p.dx === undefined ? 70 : p.dx) + side * 42 * Math.sin(ph * Math.PI * 2) + (ph - 0.5) * side * 90;
      const y = G.tip.y - 30 - Math.sin(ph * Math.PI) * (p.h || 250) * show;
      coinGlyph(ctx, x, y, 30, t * 7 + i);
    }
  }
  function drawThink(ctx, th) {
    const dots = th.dots || 0, bulb = th.bulb || 0, t = th.t || 0; if (dots <= 0.01 && bulb <= 0.01) return;
    const cx = 460, cy = 10, R = 62;
    ctx.save();
    const a = Math.max(dots, bulb > 0 ? 1 : 0);
    ctx.globalAlpha *= Math.min(1, a);
    for (const [x, y, r] of [[372, 86, 11], [404, 58, 17]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = WHITE; ctx.fill(); inkLine(ctx, 6); ctx.stroke(); }
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) { const an = i / 9 * Math.PI * 2, r = R + Math.sin(i * 2.7) * 6; const px = cx + Math.cos(an) * r * 1.12, py = cy + Math.sin(an) * r * 0.86; i ? ctx.quadraticCurveTo(cx + Math.cos(an - 0.35) * (r + 18) * 1.12, cy + Math.sin(an - 0.35) * (r + 18) * 0.86, px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = WHITE; ctx.fill(); inkLine(ctx, 7); ctx.stroke();
    if (bulb > 0.01) {
      ctx.save(); ctx.translate(cx, cy + 2); ctx.scale(bulb, bulb);
      ctx.strokeStyle = '#E7B43C'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const an = -Math.PI / 2 + (i - 3) * 0.42; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 40, -6 + Math.sin(an) * 40); ctx.lineTo(Math.cos(an) * 52, -6 + Math.sin(an) * 52); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, -10, 26, Math.PI * 0.82, Math.PI * 2.18); ctx.lineTo(10, 18); ctx.lineTo(-10, 18); ctx.closePath(); ctx.fillStyle = '#FFE24A'; ctx.fill(); inkLine(ctx, 5); ctx.stroke();
      ctx.fillStyle = '#A3A3A3'; ctx.fillRect(-11, 18, 22, 12); ctx.strokeRect(-11, 18, 22, 12);
      ctx.restore();
    } else {
      for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * 6 - i * 0.9)) * 8; ctx.beginPath(); ctx.arc(cx - 26 + i * 26, cy + 4 - b, 8, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
    }
    ctx.restore();
  }
  function drawBooks(ctx) {
    // three textbooks, spines facing out: the seat
    const books = [[22, 549, 456, 42, '#1F8A8A'], [44, 507, 418, 42, '#F3EEE3'], [62, 462, 382, 45, '#FF6200']];
    for (const [x, y, w, h, c] of books) {
      ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + w - 8, y); ctx.quadraticCurveTo(x + w, y, x + w, y + 8); ctx.lineTo(x + w, y + h - 8); ctx.quadraticCurveTo(x + w, y + h, x + w - 8, y + h);
      ctx.lineTo(x + 8, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - 8); ctx.lineTo(x, y + 8); ctx.quadraticCurveTo(x, y, x + 8, y); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); inkLine(ctx, 8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x + w - 40, y + 7, 28, h - 14); // page block
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(32,26,19,.35)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + w - 38, y + 7 + k * (h - 14) / 4); ctx.lineTo(x + w - 14, y + 7 + k * (h - 14) / 4); ctx.stroke(); }
      ctx.fillStyle = c === '#F3EEE3' ? '#FF6200' : 'rgba(255,255,255,.85)'; ctx.fillRect(x + 30, y + h / 2 - 5, 70, 10);
    }
    ctx.fillStyle = 'rgba(32,26,19,.22)'; ctx.beginPath(); ctx.ellipse(250, 470, 140, 10, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawSkateboard(ctx, sk) {
    ctx.save(); ctx.translate(250, 600); ctx.rotate(sk.tilt || 0);
    for (const wx of [-95, 95]) { ctx.beginPath(); ctx.arc(wx, 34, 17, 0, Math.PI * 2); ctx.fillStyle = '#FFE24A'; ctx.fill(); inkLine(ctx, 6); ctx.stroke(); ctx.fillStyle = '#8E877B'; ctx.fillRect(wx - 22, 14, 44, 8); }
    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.quadraticCurveTo(-176, -16, -150, -10); ctx.lineTo(150, -10); ctx.quadraticCurveTo(176, -16, 160, 0); ctx.quadraticCurveTo(150, 14, 130, 14); ctx.lineTo(-130, 14); ctx.quadraticCurveTo(-150, 14, -160, 0); ctx.closePath();
    ctx.fillStyle = '#FF6200'; ctx.fill(); inkLine(ctx, 7); ctx.stroke();
    ctx.restore();
  }
  function drawTrunk(ctx, t, pre) {
    const g = pre || trunkGeom(t);
    // fill
    ctx.beginPath();
    polyPath(ctx, g.a.concat(g.b.slice().reverse()));
    ctx.closePath(); ctx.fillStyle = FILL; ctx.fill();
    // outline: two side lines + tip edge (open at the root: it melts into the face)
    ctx.beginPath();
    polyPath(ctx, g.a.slice(1));
    const tipA = g.a[g.a.length - 1], tipB = g.b[g.b.length - 1];
    ctx.lineTo(tipB.x, tipB.y);
    for (let i = g.b.length - 1; i >= 1; i--) ctx.lineTo(g.b[i].x, g.b[i].y);
    ctx.lineWidth = SW; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    // wrinkles ride the spine (first one sits on the brow just above the root)
    const sp = g.spine;
    // wrinkles: brow line is fixed; the other two sit across the trunk, sized to its local width
    ctx.beginPath(); ctx.moveTo(234, 196); ctx.lineTo(266, 196); ctx.stroke();
    for (const [u, ratio] of [[0.209, 0.494], [0.446, 0.358]]) {
      const f = u * (sp.length - 1), i = Math.floor(f), r = f - i;
      const pa = sp[i], pb = sp[Math.min(i + 1, sp.length - 1)];
      const px = pa.x + (pb.x - pa.x) * r, py = pa.y + (pb.y - pa.y) * r, ang = pa.ang + (pb.ang - pa.ang) * r;
      const A = g.a[i], B = g.b[i], hwl = Math.hypot(A.x - B.x, A.y - B.y) / 2;
      const nx = -Math.sin(ang), ny = Math.cos(ang), hl = hwl * ratio;
      ctx.beginPath(); ctx.moveTo(px - nx * hl, py - ny * hl); ctx.lineTo(px + nx * hl, py + ny * hl); ctx.stroke();
    }
  }

  function drawSparkle(ctx, x, y, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 7 : 26; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }

  // static SVG markup (rest pose) for the site / for overlay checks
  function svg(opts) {
    opts = opts || {};
    const g = trunkGeom(opts.trunk || {});
    const pts = (arr) => arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
    const trunkFill = `M${pts(g.a)} L${pts(g.b.slice().reverse())} Z`;
    const trunkLine = `M${pts(g.a.slice(1))} L${pts(g.b.slice(1).reverse())}`;
    const sp = g.spine;
    const wr = 'M234,196 L266,196 ' + [[0.209, 0.494], [0.446, 0.358]].map(([u, ratio]) => {
      const f = u * (sp.length - 1), i = Math.floor(f), r = f - i, pa = sp[i], pb = sp[Math.min(i + 1, sp.length - 1)];
      const px = pa.x + (pb.x - pa.x) * r, py = pa.y + (pb.y - pa.y) * r, ang = pa.ang + (pb.ang - pa.ang) * r;
      const A = g.a[i], B = g.b[i], hl = Math.hypot(A.x - B.x, A.y - B.y) / 2 * ratio, nx = -Math.sin(ang), ny = Math.cos(ang);
      return `M${(px - nx * hl).toFixed(1)},${(py - ny * hl).toFixed(1)} L${(px + nx * hl).toFixed(1)},${(py + ny * hl).toFixed(1)}`;
    }).join(' ');
    let stick = '';
    if (opts.pointer) {
      const q = pointerPts(g, opts.pointer), nx = -Math.sin(q.a), ny = Math.cos(q.a), f = (v) => v.toFixed(1);
      stick = `<g class="w-pointer"><path d="M${f(q.x0 + nx * 8)},${f(q.y0 + ny * 8)} L${f(q.x1 + nx * 4)},${f(q.y1 + ny * 4)} L${f(q.x1 - nx * 4)},${f(q.y1 - ny * 4)} L${f(q.x0 - nx * 8)},${f(q.y0 - ny * 8)} Z" fill="#C98C4E" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
        `<circle cx="${f(q.x1 + Math.cos(q.a) * 4)}" cy="${f(q.y1 + Math.sin(q.a) * 4)}" r="9" fill="#E8582F" stroke="${INK}" stroke-width="5"/></g>`;
    }
    const ink = `fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600"${opts.cls ? ` class="${opts.cls}"` : ''}>` +
      `<g class="w-earL"><path d="${P.earLFill}" fill="${FILL}"/><path d="${P.earL}" ${ink}/></g>` +
      `<g class="w-earR"><path d="${P.earRFill}" fill="${FILL}"/><path d="${P.earR}" ${ink}/></g>` +
      `<g class="w-body"><path d="${P.bodyFill}" fill="${FILL}"/><path d="${P.belly}" fill="${BELLY}"/><path d="${P.body}" ${ink}/>` +
      P.toes.map((d) => `<path d="${d} Z" fill="${WHITE}"/><path d="${d}" ${ink}/>`).join('') + `</g>` +
      `<g class="w-armL"><path d="${P.armLFill}" fill="${FILL}"/><path d="${P.armL}" ${ink}/><path d="${P.armLInner}" ${ink}/></g>` +
      `<g class="w-armR"><path d="${P.armRFill}" fill="${FILL}"/><path d="${P.armR}" ${ink}/><path d="${P.armRInner}" ${ink}/></g>` +
      `<g class="w-head"><path d="${P.headFill}" fill="${FILL}"/><path d="${P.head}" ${ink}/>` +
      `<path d="${P.tuskL}" fill="${WHITE}" ${ink.replace('fill="none" ', '')}/><path d="${P.tuskR}" fill="${WHITE}" ${ink.replace('fill="none" ', '')}/>` +
      `<path d="${P.jawL} ${P.jawR}" ${ink}/>` +
      `<path d="${P.band} ${P.lensL} ${P.lensR} ${P.bridge}" fill="${INK}"/>` +
      `<g class="w-glint"><path class="w-glintL" d="${P.glintL}" fill="${WHITE}"/><path class="w-glintR" d="${P.glintR}" fill="${WHITE}"/></g>` +
      stick + `<g class="w-trunk2"><path d="${trunkFill}" fill="${FILL}"/><path d="${trunkLine}" ${ink}/><path d="${wr}" ${ink}/></g>` +
      `</g></svg>`;
  }

  const api = { draw, svg, trunkGeom, coinGlyph, P, INK, FILL, BELLY, WHITE, W: 500, H: 600, SEAT_Y, SEAT_K };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WallyRig = api;
})(typeof window !== 'undefined' ? window : globalThis);
