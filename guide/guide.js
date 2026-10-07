/* guide.js — the /guide page: live film player, textbook reader, the herd, nav. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const BOOK = window.BOOK, TL = window.TL;
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ================================================================== film player
  const player = $('#player'), canvas = $('#film'), range = $('#c-range'), fill = $('#c-fill');
  const DUR = TL.duration, I2 = TL.scenes.find((s) => s.id === 'I2'), POSTER_T = I2 ? +(I2.start + I2.dur * 0.85).toFixed(2) : 0; // poster: "This is a textbook."
  const P = { T: POSTER_T, playing: false, started: false, ready: false, quality: 1, last: 0, costs: [], idleTimer: 0 };
  const audio = new Audio(); audio.preload = 'auto'; audio.src = 'assets/score.m4a';
  let audioOk = true; audio.addEventListener('error', () => { audioOk = false; });
  $('#dur-label').textContent = fmt(DUR); $('#dur-label2').textContent = fmt(DUR); $('#c-dur').textContent = fmt(DUR);
  if (store.get('guide_muted') === '1') { audio.muted = true; player.classList.add('muted'); }

  function size() {
    let w = player.offsetWidth, h = player.offsetHeight; // layout size: unaffected by the rotated theater transform
    if (!w || !h) return; if (w / h > 16 / 9) w = h * 16 / 9; else h = w * 9 / 16;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * P.quality;
    const cw = Math.max(320, Math.min(2560, Math.round(w * dpr))), ch = Math.round(cw * 9 / 16);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; if (P.ready) { FILM.init(canvas); draw(); } }
  }
  function draw() {
    FILM.renderAt(P.T);
    range.value = Math.round(P.T / DUR * 1000); fill.style.width = (P.T / DUR * 100) + '%';
    $('#c-cur').textContent = fmt(P.T);
    updateNow();
  }
  let lastScene = null;
  function updateNow() {
    const sc = FILM.sceneAt(P.T); if (sc === lastScene) return; lastScene = sc;
    const n = $('#now');
    if (sc.kind === 'lesson') n.innerHTML = `<span>Now on page ${sc.page} · ${esc(sc.title)}</span> &nbsp;<a href="#read-${sc.lesson.replace('.', '-')}" data-read="${sc.lesson}">read this page →</a>`;
    else if (sc.kind === 'chapter') n.innerHTML = `<span>Chapter ${sc.chapter} · ${esc(sc.name)}</span>`;
    else if (sc.kind === 'ad') n.innerHTML = `<span>Commercial break: Boring Finance vs RWAs. Read the fine print.</span>`;
    else n.innerHTML = P.started ? `<span>Wally's RWA Textbook · the film</span>` : '';
    const ch = sc.chapter || 0; $$('.chap').forEach((b) => b.classList.toggle('on', +b.dataset.ch === ch));
  }
  function loop(now) {
    if (!P.playing) return;
    const dt = Math.min(0.1, (now - P.last) / 1000); P.last = now;
    // quality governor: canvas raster cost shows up as long frames, so watch the frame interval itself
    P.costs.push(dt * 1000); if (P.costs.length >= 40) { const m = P.costs.sort((a, b) => a - b)[20]; P.costs = []; if (m > 24 && P.quality > 0.5) { P.quality *= 0.8; size(); } }
    if (audioOk && !audio.paused && audio.readyState >= 3 && Math.abs(audio.currentTime - P.T) < 0.4) P.T = audio.currentTime; else P.T += dt;
    if (P.T >= DUR - 0.02) { P.T = DUR - 0.02; pause(); P.T = 0; }
    draw(); requestAnimationFrame(loop);
  }
  function play() {
    if (!P.ready) { P.wantPlay = true; if (audioOk) audio.play().then(() => { if (!P.playing) audio.pause(); }).catch(() => {}); return; } // unlock audio inside the gesture
    if (!P.started && P.T === POSTER_T) P.T = 0; // the poster is a frame from 0:11; the film itself starts at 0:00
    P.started = true; P.playing = true; player.classList.add('started', 'playing');
    if (audioOk) { try { audio.currentTime = P.T; } catch (e) {} audio.play().catch(() => {}); }
    P.last = performance.now(); requestAnimationFrame(loop); poke();
  }
  function pause() { P.playing = false; player.classList.remove('playing', 'idle'); audio.pause(); draw(); }
  function toggle() { P.playing ? pause() : play(); }
  function seek(t, andPlay) { P.T = Math.max(0, Math.min(DUR - 0.05, t)); if (audioOk) { try { audio.currentTime = P.T; } catch (e) {} } if (andPlay) { if (!P.playing) play(); } else draw(); }
  window.GuidePlayer = { seek, play, pause };
  function poke() { player.classList.remove('idle'); clearTimeout(P.idleTimer); P.idleTimer = setTimeout(() => { if (P.playing) player.classList.add('idle'); }, 2400); }
  audio.addEventListener('playing', () => { if (Math.abs(audio.currentTime - P.T) > 0.15) { try { audio.currentTime = P.T; } catch (e) {} } });
  $('#big-play').onclick = () => { play(); };
  $('#c-play').onclick = toggle;
  $('#c-mute').onclick = () => { audio.muted = !audio.muted; player.classList.toggle('muted', audio.muted); store.set('guide_muted', audio.muted ? '1' : '0'); };
  range.addEventListener('input', () => { seek(range.value / 1000 * DUR); });
  canvas.addEventListener('click', () => { if (P.started) toggle(); });
  player.addEventListener('mousemove', poke); player.addEventListener('touchstart', poke, { passive: true });
  player.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') { seek(P.T + 5, P.playing); } else if (e.key === 'ArrowLeft') { seek(P.T - 5, P.playing); }
    else if (e.key === 'm') $('#c-mute').click(); else if (e.key === 'f') $('#c-full').click();
    else if (e.key === 'Escape' && player.classList.contains('theater')) theater(false);
  });
  // full screen: real fullscreen (+ landscape lock where allowed); otherwise a fixed "theater" overlay which,
  // on a portrait phone, turns the film sideways so it fills the screen (iPhone has no element fullscreen)
  function theater(on) {
    player.classList.toggle('theater', on); document.body.style.overflow = on ? 'hidden' : '';
    fitTheater(); size();
  }
  function fitTheater() {
    const rot = player.classList.contains('theater') && innerHeight > innerWidth;
    player.classList.toggle('rot', rot);
    player.style.width = rot ? innerHeight + 'px' : ''; player.style.height = rot ? innerWidth + 'px' : ''; player.style.left = rot ? innerWidth + 'px' : '';
  }
  addEventListener('resize', () => { if (player.classList.contains('theater')) { fitTheater(); size(); } });
  $('#c-full').onclick = () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (player.classList.contains('theater')) { theater(false); return; }
    if (player.requestFullscreen) player.requestFullscreen().then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => theater(true));
    else theater(true);
  };
  document.addEventListener('fullscreenchange', () => { player.classList.toggle('full', !!document.fullscreenElement); setTimeout(size, 60); });
  new ResizeObserver(size).observe(player);
  // chapter ticks + chips
  const chStarts = TL.scenes.filter((s) => s.kind === 'chapter').map((s) => ({ n: s.chapter, name: s.name, t: s.start }));
  $('#c-ticks').innerHTML = chStarts.map((c) => `<i style="left:${(c.t / DUR * 100).toFixed(2)}%"></i>`).join('');
  $('#chapters').innerHTML = chStarts.map((c) => `<button class="chap" role="listitem" data-ch="${c.n}" data-t="${c.t}"><b>${String(c.n).padStart(2, '0')}</b>${esc(c.name)}</button>`).join('');
  $('#chapters').addEventListener('click', (e) => { const b = e.target.closest('.chap'); if (!b) return; seek(+b.dataset.t + 0.01, true); });
  document.addEventListener('click', (e) => {
    // play() first, synchronously inside the click: iOS only unlocks audio within the gesture itself
    const a = e.target.closest('[data-act="play-film"]'); if (a) { e.preventDefault(); play(); $('#watch').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  // boot: fonts + raster assets, then the poster frame
  (async () => {
    const faces = ['400 40px Lora', 'italic 700 40px Lora', '700 40px Lora', 'italic 400 40px Lora', '600 40px "Geist Mono"', '900 40px "Geist Mono"', '900 40px Archivo', 'italic 900 40px Archivo', '700 40px Caveat'];
    await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null)));
    await K.loadAssets();
    FILM.init(canvas); P.ready = true; player.classList.add('ready'); size(); draw();
    if (P.wantPlay) play();
  })();
  // pause the film when it scrolls fully out of view (saves battery, avoids surprise audio)
  new IntersectionObserver((es) => { es.forEach((en) => { if (!en.isIntersecting && P.playing && !document.fullscreenElement && !player.classList.contains('theater')) pause(); }); }, { threshold: 0 }).observe(player);

  // ================================================================== reader
  const pagesEl = $('#pages'), tocEl = $('#toc');
  const lessons = BOOK.chapters.flatMap((c) => c.lessons.map((l) => Object.assign({ ch: c }, l)));
  let view = 'pages', curCh = 1, query = '';
  tocEl.innerHTML = BOOK.chapters.map((c) => `<button class="toc-ch" data-ch="${c.n}"><b>${String(c.n).padStart(2, '0')}</b><span>${esc(c.name)}</span></button>`).join('');
  const wallyMini = '<svg class="w" viewBox="0 0 500 600" aria-hidden="true">' + (window.WallyRig ? WallyRig.svg().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') : '') + '</svg>';
  function hl(s) { if (!query) return esc(s); const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'); return esc(s).replace(re, '<mark>$1</mark>'); }
  function pageHTML(l) {
    const c = l.ch;
    let h = `<article class="page" id="read-${l.id.replace('.', '-')}" data-id="${l.id}">`;
    h += `<div class="pg-head">${wallyMini}<span>WALLY'S RWA TEXTBOOK</span><span class="eb">${esc(c.name.toUpperCase())} · ${l.id}</span></div>`;
    if (l.note) h += `<div class="margin-note">${esc(l.note)}</div>`;
    h += `<h4>${hl(l.title)}</h4><p class="sub">${hl(l.sub)}</p><div class="body">${l.body.map((p) => `<p>${hl(p)}</p>`).join('')}</div>`;
    if (l.sections) h += `<div class="secs">${l.sections.map((s) => `<div><h5>${esc(s.h)}</h5><p>${hl(s.t)}</p></div>`).join('')}</div>`;
    if (l.flow) h += `<div class="flow">${l.flow.map(esc).join(' <i>►</i> ')}</div>`;
    if (l.builders) h += `<div class="builders">${l.builders.map((b) => `<figure><img src="assets/logos/${b.logo}.png" alt="" loading="lazy" width="56" height="56">${esc(b.name)}</figure>`).join('')}</div>`;
    if (l.groups) h += `<div class="groups">${l.groups.map((g) => `<div><h5>${esc(g.label)}</h5>${g.items.map((b) => `<figure><img src="assets/logos/${b.logo}.png" alt="" loading="lazy" width="34" height="34">${esc(b.name)}</figure>`).join('')}</div>`).join('')}</div>`;
    if (l.note2) h += `<p class="note2">${esc(l.note2)}</p>`;
    h += `<div class="point"><span>THE POINT</span><p>${hl(l.point)}</p></div>`;
    h += `<div class="pg-foot"><span>CREATED BY RWA FOUNDATION</span><span class="num">${l.page} / 49</span>${l.t !== undefined ? `<button class="watch-btn" data-watch="${l.t}">▶ WATCH · ${fmt(l.t)}</button>` : '<span></span>'}</div>`;
    return h + '</article>';
  }
  function render() {
    $$('.toc-ch').forEach((b) => b.classList.toggle('on', +b.dataset.ch === curCh && view === 'pages' && !query));
    if (view === 'points') {
      const list = lessons.filter(match);
      pagesEl.innerHTML = list.length ? `<div class="points">${list.map((l) => `<div class="pt"><div class="k">${l.id}<span>p. ${l.page}</span></div><h6>${hl(l.title)}</h6><p>${hl(l.point)}</p><button class="go" data-goto="${l.id}">READ THE PAGE →</button></div>`).join('')}</div>` : `<p class="empty">Nothing in the book matches “${esc(query)}”.</p>`;
      return;
    }
    if (query) {
      const list = lessons.filter(match);
      pagesEl.innerHTML = `<div class="chapter-head"><h3>${list.length} page${list.length === 1 ? '' : 's'} mention “${esc(query)}”</h3></div>` + (list.length ? list.map(pageHTML).join('') : `<p class="empty">Nothing in the book matches “${esc(query)}”. Try “custody”, “tranche” or “oracle”.</p>`);
      return;
    }
    const c = BOOK.chapters[curCh - 1];
    pagesEl.innerHTML = `<div class="chapter-head"><span class="cn">${String(c.n).padStart(2, '0')}</span><h3>${esc(c.name)}</h3><span class="tag">${esc(c.tagline || '')}</span></div>` + lessons.filter((l) => l.ch === c).map(pageHTML).join('');
  }
  function match(l) { if (!query) return true; const q = query.toLowerCase(); return [l.title, l.sub, l.point, ...(l.body || []), ...((l.sections || []).map((s) => s.t))].join(' ').toLowerCase().includes(q); }
  function openLesson(id, smooth = true) {
    const l = lessons.find((x) => x.id === id); if (!l) return;
    view = 'pages'; query = ''; $('#q').value = ''; setSeg(); curCh = l.ch.n; render();
    const el = document.getElementById('read-' + id.replace('.', '-'));
    if (el) { el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
  window.GuideReader = { openLesson };
  function setSeg() { $$('.seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view))); }
  tocEl.addEventListener('click', (e) => { const b = e.target.closest('.toc-ch'); if (!b) return; view = 'pages'; query = ''; $('#q').value = ''; setSeg(); curCh = +b.dataset.ch; render(); $('#read').scrollIntoView({ behavior: 'smooth' }); });
  $$('.seg button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; setSeg(); render(); }));
  let qt = 0; $('#q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { query = e.target.value.trim(); render(); }, 120); });
  document.addEventListener('click', (e) => {
    const w = e.target.closest('[data-watch]'); if (w) { e.preventDefault(); $('#watch').scrollIntoView({ behavior: 'smooth', block: 'center' }); seek(+w.dataset.watch + 0.02, true); return; }
    const g = e.target.closest('[data-goto]'); if (g) { e.preventDefault(); openLesson(g.dataset.goto); return; }
    const r = e.target.closest('[data-read]'); if (r) { e.preventDefault(); pause(); openLesson(r.dataset.read); history.replaceState(null, '', '#read-' + r.dataset.read.replace('.', '-')); }
  });
  render();
  // deep links: #read-5-3 opens that page
  function route() { const m = location.hash.match(/^#read-(\d+)-(\d+)$/); if (m) setTimeout(() => openLesson(m[1] + '.' + m[2], false), 50); }
  window.addEventListener('hashchange', route); route();

  // hero cover art: the line-art Wally from the book's cover
  const bcw = $('#bc-wally'); if (bcw && window.WallyRig) bcw.innerHTML = WallyRig.svg();
  // hero host: 2D Wally with his teaching pointer, tapping the textbook (animates only while visible)
  const hw = $('#hero-wally');
  if (hw && window.WallyRig && getComputedStyle(hw.parentNode).display !== 'none') {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), hx = hw.getContext('2d'); hw.width = 330 * dpr; hw.height = 400 * dpr;
    let on = true, raf = 0;
    const frame = (now) => {
      const T = now / 1000, tap = Math.max(0, Math.sin(T * 1.6)) ** 6;
      hx.setTransform(dpr, 0, 0, dpr, 0, 0); hx.clearRect(0, 0, 330, 400);
      WallyRig.draw(hx, { x: 150, y: 392, s: 0.62, bob: Math.sin(T * 2.2) * 2.5, headRot: -0.03, trunk: { bend: 0.6, lift: 0.3 + tap * 0.06 }, prop: { kind: 'pointer', a: -0.42 - tap * 0.08, len: 205 }, sparkle: Math.max(0, Math.sin(T * 0.7)) ** 30 });
      if (on) raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver((es) => es.forEach((e) => { on = e.isIntersecting; if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } })).observe(hw);
  }

  // ================================================================== herd
  $('#herd-grid').innerHTML = BOOK.herd.accounts.map((a) => `<a class="bull" href="https://x.com/${a.handle}" target="_blank" rel="noopener"><img src="assets/herd/${a.handle.toLowerCase()}.png" alt="" loading="lazy" width="86" height="86"><b>${esc(a.name)}</b><span>@${esc(a.handle)}</span></a>`).join('');

  // ================================================================== nav scroll spy
  const links = $$('.nav-links a');
  const spy = new IntersectionObserver((es) => { es.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.dataset.spy === en.target.id)); }); }, { rootMargin: '-45% 0px -50% 0px' });
  ['watch', 'play', 'read', 'herd'].forEach((id) => spy.observe(document.getElementById(id)));

  // ================================================================== the game
  if (window.TokensPlease) window.TokensPlease.mount(document.getElementById('tp'), { book: BOOK, onRead: (id) => openLesson(id) });
})();
