/* engine.js — renderAt(T) for the whole film. Pure function of time.
   Kinds: ad, skip, intro, chapter, lesson, outro, herd, end.
   Lesson pages get the textbook chrome (header, title, THE POINT, margin note, page dots) from here;
   SCENES[id](ctx, S) draws only the diagram on the stage. Other kinds' SCENES draw the whole page. */
(function () {
  const K = window.K, C = K.C, E = K.E;
  const TL = window.TL, W = 1920, H = 1080, BEAT = TL.beat;
  const SCENES = (window.SCENES = window.SCENES || {});
  const scenes = TL.scenes;
  const FLIP = 0.75; // page-turn length (s) -- calm, readable turns
  const PAGE_KINDS = { intro: 1, chapter: 1, lesson: 1, outro: 1, herd: 1, end: 1 };
  const STAGE = { x: 560, y: 286, w: 1262, h: 510 }; STAGE.cx = STAGE.x + STAGE.w / 2; STAGE.cy = STAGE.y + STAGE.h / 2;
  const WALLY_HOST = { x: 288, y: 1000, s: 0.9 };
  const NUMWORD = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN'];

  // ------------------------------------------------------------------ scene context
  function ctxFor(sc, t) {
    const S = {
      sc, t, d: sc.dur, b: BEAT, bt: t / BEAT, W, H, stage: STAGE, host: WALLY_HOST,
      at: (b0, db = 0.6, e = E.outCubic) => e(K.clamp((t - b0 * BEAT) / (db * BEAT))),
      lin: (b0, db) => K.clamp((t - b0 * BEAT) / (db * BEAT)),
      pop: (b0, db = 0.55) => K.pop(t, b0 * BEAT, db * BEAT),
      since: (b0) => t - b0 * BEAT,
      cue: (name, i = 0) => { const c = (sc.cues || []).filter((q) => q[1] === name); return c.length ? c[Math.min(i, c.length - 1)][0] : 0; },
      wally: {},
    };
    return S;
  }
  function find(T) {
    let lo = 0, hi = scenes.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (scenes[mid].start <= T) lo = mid; else hi = mid - 1; }
    return lo;
  }

  // ------------------------------------------------------------------ chrome
  function pageOfScene(i) { // book page for the progress dots: current lesson page, or the next lesson's
    for (let k = i; k < scenes.length; k++) if (scenes[k].page) return k === i ? scenes[k].page : scenes[k].page - 0.5;
    return 49;
  }
  function chrome(ctx, sc, i, dark) {
    const ink = dark ? '#F4F1EA' : C.ink, line = dark ? 'rgba(244,241,234,.18)' : C.line2, sub = dark ? 'rgba(244,241,234,.55)' : C.ink3;
    ctx.fillStyle = line; ctx.fillRect(96, 104, W - 192, 2); ctx.fillRect(96, 1004, W - 192, 2);
    // the RWA Foundation mark + book title (the real textbook's running head)
    K.rwafMark(ctx, 122, 76, 46, ink);
    K.txt(ctx, "WALLY'S RWA TEXTBOOK", 160, 82, { f: 'mono', s: 17, w: 600, c: ink, ls: 5 });
    let eb = '';
    if (sc.kind === 'lesson') eb = `${sc.chapterName.toUpperCase()}  ·  ${sc.lesson}`;
    else if (sc.kind === 'chapter') eb = `CHAPTER ${NUMWORD[sc.chapter]}`;
    else if (sc.kind === 'herd') eb = 'THE HERD';
    else if (sc.kind === 'intro') eb = 'AN ONCHAIN EDUCATION SERIES';
    else eb = 'RWA FOUNDATION';
    K.txt(ctx, eb, W - 96, 82, { f: 'mono', s: 17, w: 600, c: C.orange, a: 'right', ls: 4 });
    // footer: page number + 49 progress dots
    const pg = pageOfScene(i);
    const pgTxt = sc.page ? `${sc.page} / 49` : sc.kind === 'end' || sc.kind === 'herd' ? '49 / 49' : '';
    if (pgTxt) K.txt(ctx, pgTxt, STAGE.cx, 1050, { f: 'mono', s: 21, w: 600, c: ink, a: 'center', ls: 2 });
    const x0 = 1380, x1 = W - 96;
    for (let k = 1; k <= 49; k++) {
      const x = x0 + (k - 1) * (x1 - x0) / 48, on = k <= pg;
      ctx.beginPath(); ctx.arc(x, 1043, on ? 3.6 : 2.6, 0, 7); ctx.fillStyle = on ? C.orange : sub; ctx.fill();
    }
    K.txt(ctx, 'CREATED BY RWA FOUNDATION', 560, 1050, { f: 'mono', s: 14, w: 500, c: sub, ls: 4 });
  }

  // ------------------------------------------------------------------ page kinds
  function drawLesson(ctx, sc, t, i) {
    ctx.drawImage(K.paper(W, H), 0, 0);
    const S = ctxFor(sc, t);
    chrome(ctx, sc, i);
    // title block
    const tIn = K.ep(t, 0.05, 0.5);
    K.txt(ctx, sc.lesson, STAGE.x, 156, { f: 'mono', s: 22, w: 700, c: C.orange, ls: 3, alpha: tIn });
    const tw = K.measure(ctx, sc.lesson, { f: 'mono', s: 22, w: 700, ls: 3 });
    const ts = K.fitSize(ctx, sc.title, STAGE.w - tw - 40, { f: 'serif', s: 60, w: 700 });
    K.txt(ctx, sc.title, STAGE.x + tw + 26, 160, { f: 'serif', s: ts, w: 700, c: C.ink, alpha: tIn });
    K.txt(ctx, sc.sub, STAGE.x, 218, { f: 'serif', s: 27, w: 400, i: true, c: C.ink2, alpha: K.ep(t, 0.2, 0.5) });
    // diagram
    const fn = SCENES[sc.id];
    ctx.save();
    if (fn) { try { fn(ctx, S); } catch (e) { console.error(sc.id, e); K.txt(ctx, 'ERR ' + sc.id + ': ' + e.message, STAGE.x, STAGE.cy, { f: 'mono', s: 22, c: C.red }); } }
    else { K.box(ctx, STAGE.x, STAGE.y, STAGE.w, STAGE.h, { fill: 'rgba(0,0,0,.03)', stroke: C.line2, lw: 2, r: 20 }); K.txt(ctx, sc.visual || sc.id, STAGE.x + 30, STAGE.y + 60, { f: 'mono', s: 18, c: C.ink3 }); }
    ctx.restore();
    // THE POINT
    const pAt = (sc.pointAt || 1.2) * BEAT;
    ctx.fillStyle = C.line2; ctx.fillRect(STAGE.x, 818, STAGE.w, 2);
    K.txt(ctx, 'THE POINT', STAGE.x, 856, { f: 'mono', s: 17, w: 700, c: C.orange, ls: 5, alpha: K.ep(t, pAt - 0.15, 0.3) });
    if (t > pAt) K.words(ctx, sc.point, STAGE.x, 912, { f: 'serif', s: 41, w: 700, i: true, maxW: STAGE.w, lh: 52, t: t - pAt, per: 0.065, fd: 0.5, c: C.ink });
    // margin note (Wally's joke)
    if (sc.note) {
      const nAt = (sc.noteAt || 4) * BEAT;
      const tgt = S.noteTo || sc.noteTo || [STAGE.x + 40, STAGE.y + 140];
      K.note(ctx, sc.note, 100, 330, { p: K.clamp((t - nAt) / 0.7), s: 46, maxW: 360, rot: -0.06, to: tgt, from: [300, 360 + (sc.note.length > 26 ? 50 : 0)], bend: -60 });
    }
    return S;
  }
  function drawChapter(ctx, sc, t, i) {
    ctx.drawImage(K.paper(W, H, '#1C150F', 9), 0, 0);
    chrome(ctx, sc, i, true);
    // stage spotlight for Wally (he is grey line art: he needs light on a dark page)
    const sl = K.ep(t, 0.05, 0.6), sg = ctx.createRadialGradient(300, 760, 20, 300, 760, 380);
    sg.addColorStop(0, `rgba(255,214,160,${0.30 * sl})`); sg.addColorStop(0.6, `rgba(255,190,120,${0.10 * sl})`); sg.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 300, 720, 760);
    ctx.fillStyle = `rgba(255,214,160,${0.16 * sl})`; ctx.beginPath(); ctx.ellipse(300, 1006, 230, 26, 0, 0, 7); ctx.fill();
    const n = String(sc.chapter).padStart(2, '0');
    const p1 = K.ep(t, 0.08, 0.5, E.outExpo);
    ctx.save(); ctx.translate(560, 560); ctx.scale(K.lerp(0.86, 1, p1), K.lerp(0.86, 1, p1));
    K.txt(ctx, n, 0, 0, { f: 'display', s: 330, w: 900, st: 'expanded', c: C.orange, alpha: p1 });
    ctx.restore();
    K.txt(ctx, `CHAPTER ${NUMWORD[sc.chapter]}`, 566, 236, { f: 'mono', s: 22, w: 600, c: 'rgba(244,241,234,.7)', ls: 8, alpha: K.ep(t, 0.15, 0.4) });
    const nameS = K.fitSize(ctx, sc.name, 1000, { f: 'serif', s: 92, w: 700 });
    K.txt(ctx, sc.name, 566, 700, { f: 'serif', s: nameS, w: 700, c: '#F4F1EA', alpha: K.ep(t, 0.2, 0.45) });
    K.note(ctx, sc.tagline, 570, 790, { p: K.clamp((t - 0.55) / 0.7), s: 54, rot: -0.02, c: C.orange });
    // lesson list (right column)
    sc.lessons.forEach((l, k) => {
      const a = K.ep(t, 0.3 + k * 0.07, 0.35);
      K.txt(ctx, l[0], 1330, 300 + k * 52 + (1 - a) * 12, { f: 'mono', s: 19, w: 700, c: C.orange, alpha: a, ls: 1 });
      K.txt(ctx, l[1], 1405, 300 + k * 52 + (1 - a) * 12, { f: 'serif', s: 25, w: 400, c: 'rgba(244,241,234,.86)', alpha: a });
    });
  }
  function drawPage(ctx, sc, t, i) { // intro / outro / herd / end
    if (!(SCENES[sc.id] && SCENES[sc.id].fullBleed)) { ctx.drawImage(K.paper(W, H), 0, 0); chrome(ctx, sc, i); }
    const S = ctxFor(sc, t);
    const fn = SCENES[sc.id];
    if (fn) { try { fn(ctx, S); } catch (e) { console.error(sc.id, e); } }
    else K.txt(ctx, sc.text || sc.id, W / 2, H / 2, { f: 'serif', s: 60, w: 700, a: 'center' });
    return S;
  }

  // ------------------------------------------------------------------ commercial breaks ("Boring Finance vs RWAs")
  // The ads themselves live in film/js/ads.js (window.ADS.draw). The engine only frames them like a TV:
  // CRT switch-on (AD0) or a burst of channel static (the others) on the way in, CRT switch-off on the way out.
  const AD_OUT = 0.6, AD_IN = 0.35;
  const ADAPI = { K, C, E, BEAT, W, H, get I() { return window.I; }, get rig() { return window.WallyRig; } };
  function drawAdRaw(ctx, sc, t) {
    if (window.ADS && window.ADS.draw) { try { window.ADS.draw(ctx, sc, t, ADAPI); } catch (e) { console.error(sc.id, e); } }
    else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); K.txt(ctx, sc.id + ' (ads.js missing)', W / 2, H / 2, { f: 'mono', s: 40, c: '#fff', a: 'center' }); }
  }
  let noiseTiles = null;
  function staticTile(t) {
    if (!noiseTiles) {
      noiseTiles = [];
      for (let k = 0; k < 4; k++) {
        const c = document.createElement('canvas'); c.width = 240; c.height = 135; const x = c.getContext('2d'), id = x.createImageData(240, 135), r = K.rand(17 + k);
        for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
        x.putImageData(id, 0, 0); noiseTiles.push(c);
      }
    }
    return noiseTiles[Math.floor(t * 30) % 4];
  }
  function crtCollapse(ctx, img, u) { // u: 0 -> 1 over the switch-off
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const a = K.clamp(u / 0.55), c = K.clamp((u - 0.55) / 0.3);
    if (c < 1) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(Math.max(K.lerp(1, 0, E.inCubic(c)), 0.001), K.lerp(1, 0.004, E.inCubic(a)));
      ctx.drawImage(img, 0, 0, img.width, img.height, -W / 2, -H / 2, W, H);
      if (a > 0.4) { ctx.fillStyle = `rgba(255,255,255,${K.clamp((a - 0.4) / 0.6) * 0.85})`; ctx.fillRect(-W / 2, -H / 2, W, H); }
      ctx.restore();
    }
    const g = K.clamp((u - 0.85) / 0.15); if (g > 0 && g < 1) { ctx.fillStyle = `rgba(255,255,255,${(1 - g) * 0.85})`; ctx.beginPath(); ctx.arc(W / 2, H / 2, 6 * (1 - g) + 1, 0, 7); ctx.fill(); }
  }
  function drawAd(ctx, sc, t) {
    const out = sc.dur - AD_OUT;
    if (t >= out) { // switch-off: collapse the ad's last frame
      const b = buf('adexit'); if (b.key !== sc.id) { b.x.setTransform(FILM.scale, 0, 0, FILM.scale, 0, 0); drawAdRaw(b.x, sc, out - 0.001); b.key = sc.id; }
      crtCollapse(ctx, b.c, (t - out) / AD_OUT); return;
    }
    drawAdRaw(ctx, sc, t);
    if (t < AD_IN) {
      if (sc.id === 'AD0') { // CRT switch-on: a bright line opens into the picture
        const u = E.outCubic(K.clamp(t / AD_IN)), h = Math.max(4, H * u);
        ctx.save(); ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, (H - h) / 2); ctx.fillRect(0, (H + h) / 2, W, (H - h) / 2);
        ctx.fillStyle = `rgba(255,255,255,${(1 - u) * 0.8})`; ctx.fillRect(0, (H - h) / 2, W, h); ctx.restore();
      } else { // channel static fading into the ad
        ctx.save(); ctx.globalAlpha = 1 - E.inCubic(K.clamp(t / AD_IN)); ctx.imageSmoothingEnabled = false; ctx.drawImage(staticTile(t), 0, 0, W, H); ctx.restore();
      }
    }
  }
  function drawSkip(ctx, sc, t) { // after the cold-open commercial: black room, then the textbook page fades up
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const c = K.clamp((t - 0.15) / 0.8);
    if (c > 0) { ctx.save(); ctx.globalAlpha = E.inOutCubic(c); ctx.drawImage(K.paper(W, H), 0, 0); ctx.restore(); }
  }

  // ------------------------------------------------------------------ Wally host (2D only)
  // His sunglasses glint is a reflection, never eyes: he acts with trunk, ears, head, body and props.
  // Each page names a routine in sc.host (assigned in tools/make_timeline.py) so he never repeats in a row:
  //   lessons : teacher | thinker | inspector | barista | reader | juggler | cool
  //   chapters: skate | dance | conductor | sitread        other pages: stand | thinker | reader | dance | teacher
  const ACTIONS = {
    nod: (u) => ({ bob: -Math.sin(u * Math.PI * 2) * 6, squash: Math.sin(u * Math.PI * 2) * 0.015 }),
    hop: (u) => ({ bob: 30 * Math.sin(u * Math.PI), squash: u < 0.2 ? 0.07 * Math.sin(u / 0.2 * Math.PI) : u > 0.85 ? 0.06 * Math.sin((u - 0.85) / 0.15 * Math.PI) : -0.025 }),
    toot: (u) => ({ trunk: { bend: 0.7 * Math.sin(u * Math.PI), lift: 0.75 * Math.sin(u * Math.PI), curl: 0.6 * Math.sin(u * Math.PI), len: 0.1 * Math.sin(u * Math.PI) }, bob: 20 * Math.sin(u * Math.PI), sparkle: Math.sin(u * Math.PI) }),
    point: (u) => ({ trunk: { bend: 0.85 * Math.sin(u * Math.PI), lift: 0.42 * Math.sin(u * Math.PI), curl: 0.1 * Math.sin(u * Math.PI) }, headRot: -0.04 * Math.sin(u * Math.PI) }),
    smirk: (u) => { const e = Math.sin(Math.min(1, u * 3) * Math.PI / 2) * (u > 0.8 ? (1 - u) / 0.2 : 1); return { headRot: 0.07 * e, earR: 0.12 * Math.sin(u * Math.PI * 3) * (1 - u), sparkle: u > 0.1 && u < 0.6 ? Math.sin((u - 0.1) / 0.5 * Math.PI) : 0 }; },
    sparkle: (u) => ({ sparkle: Math.sin(u * Math.PI) * 1.1 }),
  };
  const ADUR = { nod: 0.7, hop: 0.7, toot: 1.1, point: 1.6, smirk: 1.6, sparkle: 0.9 };
  function addPose(p, d) {
    for (const k in d) {
      if (k === 'trunk') { p.trunk = p.trunk || {}; for (const q in d.trunk) p.trunk[q] = (p.trunk[q] || 0) + d.trunk[q]; }
      else p[k] = (p[k] || 0) + d[k];
    }
  }
  const ramp = (t, a, d) => K.clamp((t - a) / d);
  const env = (t, a, up, hold, down) => Math.min(ramp(t, a, up), 1 - ramp(t, a + up + hold, down));
  const mixT = (A, B, u) => ({ bend: K.lerp(A.bend || 0, B.bend || 0, u), lift: K.lerp(A.lift || 0, B.lift || 0, u), curl: K.lerp(A.curl || 0, B.curl || 0, u), len: K.lerp(A.len || 1, B.len || 1, u) });
  function act(p, t, at, name) { const d = ADUR[name] || 1, u = (t - at) / d; if (u >= 0 && u <= 1) addPose(p, ACTIONS[name](u)); }
  function hostTimes(sc) {
    const P = (sc.pointAt !== undefined ? sc.pointAt : sc.hostAt !== undefined ? sc.hostAt : 1.2) * BEAT;
    const N = sc.note && sc.noteAt !== undefined ? sc.noteAt * BEAT : -1;
    return { P, N };
  }
  const ROUTINES = {
    stand(p) { return p; },
    teacher(p, sc, t) { // the stick rests like a cane, swings up to THE POINT, taps twice, holds, then rests again
      const { P, N } = hostTimes(sc), back = P + 2.6;
      const up = K.ep(t, P, 0.45, E.outBack) * (1 - K.ep(t, back, 0.6, E.inOutCubic));
      const tap = t > P + 0.45 && t < P + 1.35 ? Math.sin((t - P - 0.45) / 0.45 * Math.PI * 2) * 0.05 : 0;
      p.trunk = mixT({ bend: 0.22, lift: 0.1 }, { bend: 0.64, lift: 0.28 }, up);
      p.prop = { kind: 'pointer', a: K.lerp(1.4, 0.3, up) + tap, len: K.lerp(214, 205, up) };
      p.headRot = -0.03 * up; if (N >= 0) act(p, t, N, 'smirk');
      return p;
    },
    thinker(p, sc, t, T) { // sits on the textbooks, trunk to chin, thinks... then the lightbulb
      const { P, N } = hostTimes(sc), relax = E.inOutCubic(ramp(t, P, 0.55));
      p.seated = 1;
      p.trunk = mixT({ bend: 0.35 + Math.sin(T * 0.9) * 0.03, lift: 1.15, curl: 0.9 }, { bend: 0.2, lift: 0.25, curl: 0.1 }, relax);
      p.headRot = (0.08 + Math.sin(T * 0.8) * 0.02) * (1 - relax);
      const bulb = K.pop(t, P, 0.5) * (1 - ramp(t, P + 2.8, 0.4));
      p.think = { dots: ramp(t, 0.35, 0.5) * (1 - ramp(t, P - 0.12, 0.12)), bulb, t: T };
      act(p, t, P, 'hop'); act(p, t, P + 0.1, 'sparkle'); if (N >= 0 && N < P - 0.5) act(p, t, N, 'smirk');
      return p;
    },
    inspector(p, sc, t, T) { // reads the fine print with a magnifier, then lowers it and nods
      const { P, N } = hostTimes(sc), down = E.inOutCubic(ramp(t, P, 0.7));
      p.trunk = mixT({ bend: 0.65, lift: 0.55, curl: 0.1 }, { bend: 0.25, lift: 0.12, curl: 0.05 }, down);
      let a = K.lerp(-0.25 + Math.sin(T * 1.1) * 0.12, 1.25, down);
      if (N >= 0 && t > N && t < N + 0.6) a += Math.sin((t - N) * 38) * 0.07 * (1 - (t - N) / 0.6);
      p.prop = { kind: 'magnifier', a };
      p.headRot = -0.035 * (1 - down); if (N >= 0) act(p, t, N, 'sparkle'); act(p, t, P + 0.7, 'nod');
      return p;
    },
    barista(p, sc, t, T) { // holds the mug in his paw and sips through his trunk; toasts THE POINT
      const { P, N } = hostTimes(sc), cyc = (t + 0.9) % 3.6, sip = cyc < 1.4 ? Math.sin(cyc / 1.4 * Math.PI) : 0;
      const cheers = env(t, P, 0.4, 1.0, 0.5);
      window.WallyRig.coffee(p, sip, cheers, T); // the paw holds the mug, the trunk dips in to drink
      p.headRot = 0.03 * sip * (1 - cheers); if (N >= 0) act(p, t, N, 'smirk'); act(p, t, P + 1.5, 'nod');
      return p;
    },
    reader(p, sc, t) { // sits reading the textbook; peeks over it for the joke; lowers it for THE POINT
      const { P, N } = hostTimes(sc), down = E.inOutCubic(ramp(t, P, 0.6)), peek = N >= 0 && N < P ? env(t, N, 0.3, 1.0, 0.35) : 0;
      const lo = Math.max(down, peek * 0.6);
      p.seated = 1;
      p.trunk = mixT({ bend: 0.05, lift: 0.75, len: 0.9 }, { bend: 0.05, lift: 0.3, len: 0.9 }, lo);
      p.prop = { kind: 'cover', dy: K.lerp(-28, 40, lo) };
      if (N >= 0) act(p, t, N, 'smirk'); act(p, t, P + 0.6, 'nod');
      return p;
    },
    juggler(p, sc, t, T) { // juggles three Wally tokens, then catches one and balances it
      const { P, N } = hostTimes(sc), caught = t >= P, set = E.inOutCubic(ramp(t, P, 0.4));
      if (!caught) { p.trunk = { bend: 0.1, lift: 1.1 + Math.sin(T * Math.PI * 2 / 0.65) * 0.05 }; p.prop = { kind: 'juggle', t: T, h: 150, period: 1.3, dx: 70, show: ramp(t, 0.3, 0.5) }; }
      else { p.trunk = mixT({ bend: 0.1, lift: 1.1 }, { bend: 0.35, lift: 1.0 }, set); p.prop = { kind: 'coin', t: T }; act(p, t, P, 'sparkle'); }
      if (N >= 0) act(p, t, N, 'smirk');
      return p;
    },
    cool(p, sc, t, T) { // head-bobs to the beat; lens sparkle for the joke; a toot for THE POINT
      const { P, N } = hostTimes(sc), ph = Math.abs(Math.sin(Math.PI * T / BEAT));
      p.bob = (p.bob || 0) + 5 * ph; p.earL = (p.earL || 0) + 0.06 * ph; p.earR = (p.earR || 0) + 0.06 * ph;
      p.headRot = (p.headRot || 0) + 0.025 * Math.sin(Math.PI * T / BEAT);
      if (N >= 0) act(p, t, N, 'sparkle'); act(p, t, P, 'toot');
      return p;
    },
    // ---- chapter cards (dark page, under a spotlight)
    skate(p, sc, t) {
      const arrive = E.outCubic(ramp(t, 0, 1.3)), kick = ramp(t, 1.35, 0.6);
      p.x = K.lerp(-260, 300, arrive); p.rot = -0.05 * (1 - arrive);
      p.skate = { tilt: kick > 0 && kick < 1 ? -0.22 * Math.sin(kick * Math.PI) : 0 };
      if (kick > 0 && kick < 1) p.bob = (p.bob || 0) + 26 * Math.sin(kick * Math.PI);
      p.trunk = { bend: -0.25 * (1 - arrive) + 0.15, lift: 0.35 * (1 - arrive) };
      act(p, t, 1.45, 'sparkle');
      return p;
    },
    dance(p, sc, t, T) {
      const ph = Math.abs(Math.sin(Math.PI * T / BEAT)), sw = Math.sin(Math.PI * T / BEAT);
      p.bob = (p.bob || 0) + 12 * ph; p.squash = (p.squash || 0) + 0.025 * (1 - ph);
      p.headRot = 0.07 * sw; p.earL = 0.18 * ph; p.earR = 0.18 * ph;
      p.trunk = { bend: 0.35 * sw, wiggle: 0.3 * Math.sin(T * 7) };
      return p;
    },
    conductor(p, sc, t, T) {
      const w = Math.sin(Math.PI * 2 * T / (2 * BEAT));
      p.trunk = { bend: 0.5, lift: 0.85 + 0.08 * w };
      p.prop = { kind: 'pointer', a: -0.75 + 0.45 * w, len: 190 };
      p.headRot = 0.03 * w;
      return p;
    },
    sitread(p, sc, t) {
      const down = E.inOutCubic(ramp(t, 1.1, 0.6));
      p.seated = 1; p.trunk = mixT({ bend: 0.05, lift: 0.75, len: 0.9 }, { bend: 0.05, lift: 0.3, len: 0.9 }, down);
      p.prop = { kind: 'cover', dy: K.lerp(-28, 40, down) }; act(p, t, 1.4, 'sparkle');
      return p;
    },
  };
  function hostName(sc) { return sc.host || (sc.kind === 'chapter' ? 'dance' : 'stand'); }
  function drawHost(ctx, sc, t, T, S) {
    if (!PAGE_KINDS[sc.kind] && sc.kind !== 'skip') return;
    if (S && S.wally && S.wally.hide) return;
    if (SCENES[sc.id] && SCENES[sc.id].noHost) return;
    const pose = Object.assign({ bob: Math.sin(T * 2.2) * 2.4, trunk: { bend: Math.sin(T * 1.3) * 0.07 } }, WALLY_HOST, (S && S.wally && S.wally.at) || {});
    const ef = (T % 3.7) / 3.7; if (ef < 0.08) { pose.earL = Math.sin(ef / 0.08 * Math.PI) * 0.06; pose.earR = Math.sin(ef / 0.08 * Math.PI) * 0.03; }
    if (sc.kind === 'chapter') { pose.x = 300; pose.y = 1004; pose.s = 0.95; }
    const fn = ROUTINES[hostName(sc)] || ROUTINES.stand;
    fn(pose, sc, t, T);
    (sc.cues || []).forEach((c) => { if (c[1] === 'toot') act(pose, t, c[0] * BEAT, 'toot'); });
    if (S && S.wally && S.wally.pose) addPose(pose, S.wally.pose);
    if (pose.skate) pose.y -= 52 * pose.s; // the board's wheels stand on the floor line
    if (sc.kind === 'skip') { const a = K.ep(t, 0.55, 0.4); if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; window.WallyRig.draw(ctx, pose); ctx.restore(); return; }
    window.WallyRig.draw(ctx, pose);
  }

  // ------------------------------------------------------------------ transitions
  const bufs = {};
  function buf(name) { if (!bufs[name] || bufs[name].c.width !== FILM.canvas.width || bufs[name].c.height !== FILM.canvas.height) { const c = document.createElement('canvas'); c.width = FILM.canvas.width; c.height = FILM.canvas.height; bufs[name] = { c, x: c.getContext('2d'), key: null }; } return bufs[name]; }
  function renderSceneInto(b, i, t) { // full page (no host) into an offscreen buffer
    const k = FILM.scale; b.x.setTransform(k, 0, 0, k, 0, 0); drawScene(b.x, i, t);
  }
  function pageFlip(ctx, imgA, p) {
    const e = E.inOutCubic(p), fx = K.lerp(W, -260, e), flap = Math.max(0, Math.min(W - fx, 230)) * Math.sin(Math.PI * Math.min(1, e * 1.05));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, fx), H); ctx.clip(); ctx.drawImage(imgA, 0, 0, imgA.width, imgA.height, 0, 0, W, H);
    const sg = ctx.createLinearGradient(fx - 140, 0, fx, 0); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(40,28,10,.22)'); ctx.fillStyle = sg; ctx.fillRect(fx - 140, 0, 140, H);
    ctx.restore();
    if (flap > 1) {
      const fg = ctx.createLinearGradient(fx, 0, fx + flap, 0); fg.addColorStop(0, '#E9E2D2'); fg.addColorStop(0.55, '#FBF8F1'); fg.addColorStop(1, '#D9D0BD');
      ctx.fillStyle = fg; ctx.fillRect(fx, 0, flap, H);
      const shg = ctx.createLinearGradient(fx + flap, 0, fx + flap + 90, 0); shg.addColorStop(0, 'rgba(30,20,8,.28)'); shg.addColorStop(1, 'rgba(30,20,8,0)'); ctx.fillStyle = shg; ctx.fillRect(fx + flap, 0, 90, H);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(fx + flap - 1.5, 0, 1.5, H);
    }
  }
  function glitchIn(ctx, img, p) { // slice-shift + RGB split on the first frames of an ad
    const n = 14; for (let k = 0; k < n; k++) { const y = k * H / n, h = H / n, dx = (K.hash(k * 9.1 + Math.floor(p * 9)) - 0.5) * 260 * (1 - p); ctx.drawImage(img, 0, y * img.height / H, img.width, h * img.height / H, dx, y, W, h); }
  }

  // ------------------------------------------------------------------ main
  function drawScene(ctx, i, t) {
    const sc = scenes[i];
    let S = null;
    if (sc.kind === 'lesson') S = drawLesson(ctx, sc, t, i);
    else if (sc.kind === 'chapter') drawChapter(ctx, sc, t, i);
    else if (sc.kind === 'ad') drawAd(ctx, sc, t);
    else if (sc.kind === 'skip') drawSkip(ctx, sc, t);
    else S = drawPage(ctx, sc, t, i);
    return S;
  }
  function shakeFor(sc, t) {
    const amp = { slam: 6, thud: 3, boom: 2, stamp: 2.5, gavel: 3, crack: 2, snap: 3, clamp: 2 }; // gentle: the film is calm now
    let x = 0, y = 0;
    for (const c of sc.cues || []) if (amp[c[1]]) { const s = K.shake(t, c[0] * BEAT, amp[c[1]], 0.32, c[0]); x += s.x; y += s.y; }
    return { x, y };
  }
  const FILM = (window.FILM = {
    duration: TL.duration, fps: TL.fps, ready: false, scale: 1, canvas: null,
    sceneAt: (T) => scenes[find(T)],
    missing: () => scenes.filter((s) => (s.kind === 'lesson' || PAGE_KINDS[s.kind] && s.kind !== 'chapter') && !SCENES[s.id]).map((s) => s.id),
    init(canvas) { FILM.canvas = canvas; FILM.ctx = canvas.getContext('2d'); FILM.scale = canvas.width / W; K.paper(W, H); K.paper(W, H, '#1C150F', 9); }, // pre-warm both paper textures
    renderAt(T) {
      T = K.clamp(T, 0, TL.duration - 1e-4);
      const ctx = FILM.ctx, k = FILM.scale; ctx.setTransform(k, 0, 0, k, 0, 0);
      const i = find(T), sc = scenes[i], t = T - sc.start, prev = scenes[i - 1];
      const sh = shakeFor(sc, t);
      ctx.save(); ctx.translate(sh.x, sh.y);
      let S = null;
      const flipIn = prev && PAGE_KINDS[sc.kind] && PAGE_KINDS[prev.kind] && t < FLIP && !(SCENES[sc.id] && SCENES[sc.id].noFlip);
      if (flipIn) {
        S = drawScene(ctx, i, t);
        const b = buf('flip'); if (b.key !== 'end' + (i - 1)) { renderSceneInto(b, i - 1, prev.dur - 0.001); b.key = 'end' + (i - 1); }
        ctx.setTransform(k, 0, 0, k, sh.x * k, sh.y * k); pageFlip(ctx, b.c, t / FLIP);
      } else S = drawScene(ctx, i, t);
      ctx.restore();
      ctx.setTransform(k, 0, 0, k, 0, 0);
      drawHost(ctx, sc, t, T, S);
      if (S && S.fadeBlack > 0) { ctx.fillStyle = `rgba(0,0,0,${S.fadeBlack})`; ctx.fillRect(0, 0, W, H); }
      if (sc.kind === 'chapter' && prev && prev.kind === 'ad' && t < 0.6) { ctx.fillStyle = `rgba(0,0,0,${1 - E.inOutCubic(t / 0.6)})`; ctx.fillRect(0, 0, W, H); }
    },
  });
})();
