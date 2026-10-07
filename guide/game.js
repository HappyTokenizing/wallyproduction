/* Tokens, Please — the Onchain Customs game. Cases: window.CASES (data/cases.js). Rules: the textbook (window.BOOK).
   Mount: TokensPlease.mount(rootEl, { book, onRead(lessonId) }). Progress is a per-viewer convenience in localStorage. */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'tokens_please_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const COLORS = { tbill: ['#3E9E6B', '#2C7A51'], gold: ['#E7B43C', '#B98A1E'], realestate: ['#D8704A', '#A94F2E'], equity: ['#7C66D8', '#5B47B0'], credit: ['#2B9FA0', '#1D7677'], fund: ['#3D7BE0', '#2A5DB3'] };
  const NUMW = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN'];
  const RANKS = [
    [0.95, 'Chief Wally of Customs', 'Nothing gets past you. Not even Dave.'],
    [0.8, 'Fine Print Officer', 'Issuers are starting to dread your booth.'],
    [0.6, 'Due Diligence Enjoyer', 'Solid. A couple of tokens still got past you.'],
    [0.4, 'Junior Inspector', "You've read the cover. Now read the book."],
    [0, 'Exit Liquidity', 'You let everything in. The issuers send their thanks.'],
  ];
  const ROASTS_IN = ["You just let that in. The Herd's wallet has questions.", 'Congratulations, you are now exit liquidity.', "I'll be in my office. Writing a memo about you.", 'That token is in the wallet now. It brought friends.'];
  const ROASTS_OUT = ['That was a perfectly good token. Boring is not a red flag.', 'You turned away the one honest applicant today.', 'Paranoia is not due diligence. Read the paperwork.'];

  // ------------------------------------------------------------------ art
  function mascotSVG(kind, mood) {
    const [face, rim] = COLORS[kind] || ['#FF6200', '#C44A00'];
    const ink = '#201A13';
    let eyes = '', mouth = '', extra = '';
    if (mood === 'smug') { eyes = `<path d="M70 92 h20 M110 92 h20" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="M66 82 q12 -6 24 -2 M110 80 q12 -4 24 2" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`; mouth = `<path d="M78 124 q24 16 46 -6" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
    else if (mood === 'happy') { eyes = `<path d="M70 96 q10 -14 20 0 M110 96 q10 -14 20 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`; mouth = `<path d="M72 118 q28 30 56 0 z" fill="${ink}"/>`; }
    else if (mood === 'worried' || mood === 'sad') { eyes = `<ellipse cx="80" cy="94" rx="7" ry="10" fill="${ink}"/><ellipse cx="120" cy="94" rx="7" ry="10" fill="${ink}"/><path d="M66 80 l20 6 M134 80 l-20 6" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`; mouth = mood === 'sad' ? `<path d="M76 132 q24 -20 48 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>` : `<path d="M74 128 q8 -8 16 0 t16 0 t16 0" stroke="${ink}" stroke-width="6" fill="none" stroke-linecap="round"/>`; extra = `<path d="M150 64 q10 18 0 26 q-10 -8 0 -26 z" fill="#7FC4F5" stroke="${ink}" stroke-width="3"/>`; }
    else { eyes = `<ellipse cx="80" cy="94" rx="7" ry="10" fill="${ink}"/><ellipse cx="120" cy="94" rx="7" ry="10" fill="${ink}"/>`; mouth = `<path d="M80 122 q20 14 40 0" stroke="${ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
    const hats = {
      equity: `<path d="M66 40 h68 v-36 h-68 z" fill="${ink}"/><rect x="52" y="38" width="96" height="10" rx="5" fill="${ink}"/><rect x="66" y="26" width="68" height="8" fill="#D64545"/>`,
      realestate: `<path d="M52 52 q48 -62 96 0 z" fill="#F2C230" stroke="${ink}" stroke-width="5"/><rect x="44" y="48" width="112" height="10" rx="5" fill="#F2C230" stroke="${ink}" stroke-width="5"/><path d="M100 4 v22" stroke="${ink}" stroke-width="5"/>`,
      gold: `<path d="M58 50 l8 -36 l20 20 l14 -26 l14 26 l20 -20 l8 36 z" fill="#FFD84D" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>`,
      tbill: `<path d="M56 48 q44 -40 88 0 z" fill="#2E4A3A" stroke="${ink}" stroke-width="5"/><rect x="40" y="44" width="120" height="9" rx="4.5" fill="#2E4A3A" stroke="${ink}" stroke-width="4"/>`,
      credit: '',
      fund: '',
    };
    const below = { credit: `<path d="M78 178 l22 10 l22 -10 l-6 22 l-16 -8 l-16 8 z" fill="#D64545" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`, fund: `<circle cx="120" cy="94" r="17" fill="none" stroke="${ink}" stroke-width="4"/><path d="M137 98 q14 30 6 60" stroke="${ink}" stroke-width="2.5" fill="none"/>` };
    return `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M78 186 v26 h-14 M122 186 v26 h14" stroke="${ink}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 112 q-22 12 -10 34 M164 112 q22 12 10 34" stroke="${ink}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="112" rx="72" ry="76" fill="${rim}" stroke="${ink}" stroke-width="7"/>
      <circle cx="100" cy="104" r="70" fill="${face}" stroke="${ink}" stroke-width="7"/>
      <circle cx="100" cy="104" r="54" fill="none" stroke="rgba(32,26,19,.25)" stroke-width="4"/>
      ${eyes}${mouth}${extra}${below[kind] || ''}${hats[kind] || ''}</svg>`;
  }
  // Wally on duty: no hat. A customs badge on his chest and a pointer stick held in his trunk, aimed at the paperwork.
  function wallySVG(o = {}) {
    const dir = o.dir === 'right' ? 1 : -1; // where the stick points (the passport sits to his left on the desk)
    let s = window.WallyRig ? window.WallyRig.svg({ cls: 'wsvg', trunk: { bend: 0.5 * dir, lift: 0.18 }, pointer: { a: dir > 0 ? -0.32 : Math.PI + 0.32, len: 290 } }) : '';
    const bx = dir > 0 ? 182 : 318, by = 416;
    const badge = `<g class="badge" transform="translate(${bx} ${by})"><path d="M0,-40 L32,-28 Q34,14 0,40 Q-34,14 -32,-28 Z" fill="#E7B43C" stroke="#072421" stroke-width="7" stroke-linejoin="round"/>` +
      `<path d="M0,-17 L5.6,-5.2 L18.5,-4.3 L8.6,4.3 L11.6,17 L0,10.2 L-11.6,17 L-8.6,4.3 L-18.5,-4.3 L-5.6,-5.2 Z" fill="#FFF6D6" stroke="#072421" stroke-width="3.5" stroke-linejoin="round"/></g>`;
    return s.replace('</svg>', badge + '</svg>');
  }
  const CREST = `<svg class="crest" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="#201A13"/><circle cx="22" cy="22" r="15" fill="none" stroke="#FF6200" stroke-width="2.5"/><path d="M14 23 l5 5 l11 -12" stroke="#F7F2E6" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ------------------------------------------------------------------ sound (synthesised, no files)
  const Snd = {
    ctx: null, on: true,
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
    tone(f1, f2, d, type, peak, delay = 0) { if (!this.on || !this.ctx) return; const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d); this.env(g, t, 0.005, d, peak); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.05); },
    noise(d, peak, freq, q = 1, delay = 0) { if (!this.on || !this.ctx) return; const c = this.ctx, t = c.currentTime + delay, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0); let s = 7; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; x[i] = (s / 2147483647) * 2 - 1; } const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; this.env(g, t, 0.003, d, peak); src.connect(f).connect(g).connect(c.destination); src.start(t); },
    stamp() { this.tone(140, 45, 0.22, 'sine', 0.6); this.noise(0.12, 0.35, 900, 0.7); },
    pop() { this.tone(520, 880, 0.08, 'sine', 0.18); },
    flag() { this.noise(0.05, 0.25, 2600, 2); this.tone(1200, 900, 0.05, 'triangle', 0.08); },
    buzz() { this.tone(160, 120, 0.28, 'square', 0.07); this.tone(166, 124, 0.28, 'square', 0.05); },
    ding() { this.tone(1320, 1320, 0.5, 'sine', 0.12); this.tone(1980, 1980, 0.4, 'sine', 0.06, 0.05); },
    paper() { this.noise(0.22, 0.12, 1800, 0.6); },
    toot() { this.tone(330, 470, 0.28, 'sawtooth', 0.05); this.tone(470, 440, 0.3, 'sawtooth', 0.04, 0.22); },
  };

  // ------------------------------------------------------------------ game
  const TP = (window.TokensPlease = {});
  TP.mount = (root, opts) => {
    const BOOK = opts.book, DATA = window.CASES;
    const lessonsById = {}; BOOK.chapters.forEach((c) => c.lessons.forEach((l) => { lessonsById[l.id] = Object.assign({ chName: c.name }, l); }));
    const st = load(); st.results = st.results || {}; if (st.muted) Snd.on = false;
    const G = { screen: 'title', shift: st.lastShift || 1, idx: 0, flagged: null, verdict: null, ruleOpen: false, score: 0, streak: 0, runResults: {} };
    G.score = Object.values(st.results).reduce((a, r) => a + (r.pts || 0), 0);
    const shiftOf = (n) => DATA.shifts[n - 1];
    const curCase = () => shiftOf(G.shift).cases[G.idx];
    const chapter = (n) => BOOK.chapters[n - 1];

    function bar() {
      const sh = shiftOf(G.shift);
      return `<div class="tp-bar"><span class="sign"><i></i>ONCHAIN CUSTOMS</span>` +
        (G.screen === 'case' ? `<span class="stat">SHIFT <b>${String(G.shift).padStart(2, '0')}</b></span><span class="stat">CASE <b>${G.idx + 1}/${sh.cases.length}</b></span>` : `<span class="stat">SHIFT DATE <b>${esc(DATA.shiftDate)}</b></span>`) +
        `<span class="stat">SCORE <b>${G.score.toLocaleString('en-US')}</b></span>` + (G.streak >= 2 ? `<span class="stat hot">STREAK <b>×${G.streak}</b></span>` : '') +
        `<span class="sp"></span><button class="tp-ico" data-a="rules" aria-label="Open the rulebook">📖 RULEBOOK</button><button class="tp-ico" data-a="mute" aria-label="${Snd.on ? 'Mute' : 'Unmute'} game sounds">${Snd.on ? '🔊' : '🔇'}</button></div>`;
    }
    function shiftsRow() {
      return `<div class="tp-shifts" aria-label="Choose a shift">` + DATA.shifts.map((s) => {
        const done = s.cases.every((c) => st.results[c.id]); return `<button data-a="pick" data-n="${s.n}" class="${done ? 'done' : ''} ${s.n === G.shift ? 'cur' : ''}" title="Shift ${s.n}: ${esc(chapter(s.n).name)}">${done ? '✓ ' : ''}${String(s.n).padStart(2, '0')}</button>`;
      }).join('') + '</div>';
    }
    function titleScreen() {
      const q = ['tbill', 'gold', 'realestate', 'equity', 'credit'].map((k, i) => `<span style="left:${4 + i * 13}%;animation-delay:-${i * 0.6}s">${mascotSVG(k, i % 2 ? 'smug' : 'calm')}</span>`).join('');
      const answered = Object.keys(st.results).length, total = DATA.shifts.reduce((a, s) => a + s.cases.length, 0);
      return `<div class="tp-title"><div>
        <div class="eyebrow">A GAME ABOUT READING THE PAPERWORK</div>
        <h3>WELCOME TO<span>THE BOOTH.</span></h3>
        <p>Eleven shifts, one per chapter. ${total} tokens in the queue. Every rule you need is in the textbook, and Wally will hand you the page.</p>
        <ol class="tp-steps"><li><b>01</b>Listen to the pitch. It is always amazing.</li><li><b>02</b>Check the paperwork against the rulebook. Click the line that's off.</li><li><b>03</b>Stamp it: ADMIT if it's clean, DENY with the red flag marked.</li></ol>
        <button class="tp-go" data-a="start">${answered ? 'Continue: shift ' + G.shift : 'Start shift 1'} →</button>
        ${shiftsRow()}</div>
        <div class="tp-scene" aria-hidden="true"><div class="booth-sign">WALLET BORDER · ALL TOKENS STOP HERE</div><div class="queue">${q}</div><div class="boss">${wallySVG({ dir: 'left' })}</div><div class="floor"></div></div></div>`;
    }
    function shiftScreen() {
      const sh = shiftOf(G.shift), c = chapter(G.shift);
      const pages = c.lessons.map((l) => l.page), pr = `${pages[0]}–${pages[pages.length - 1]}`;
      return `<div class="tp-memo"><div class="wally">${wallySVG({ dir: 'right' })}</div><div>
        <div class="eyebrow">SHIFT ${NUMW[G.shift]} · RULEBOOK PAGES ${pr}</div>
        <h3>SHIFT ${String(G.shift).padStart(2, '0')}</h3><h4>${esc(c.name)}</h4>
        <div class="paper memo-paper"><div class="hd"><span>MEMO FROM: WALLY</span><span>${sh.cases.length} TOKENS IN QUEUE</span></div>
          <p>${esc(sh.memo)}</p><ol>${c.lessons.map((l) => `<li><b>${l.id}</b>${esc(l.title)}</li>`).join('')}</ol></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><button class="tp-go" data-a="open">Open the booth →</button><button class="tp-ghost" data-a="rules">📖 Read the rulebook first</button><button class="tp-ghost" data-a="home">All shifts</button></div>
      </div></div>`;
    }
    function caseScreen() {
      const cs = curCase(), v = G.verdict;
      const mood = v ? (v.admitted ? 'happy' : v.kind === 'quiz' ? (v.ok ? 'happy' : 'sad') : 'worried') : cs.mood === 'calm' ? 'calm' : 'smug';
      const mclass = v ? (v.kind === 'quiz' ? 'bob' : v.admitted ? 'leave-in' : 'leave-out') : (G.fresh ? 'enter' : 'bob');
      let doc;
      if (cs.type === 'quiz') {
        doc = `<div class="paper doc quiz ${G.fresh ? 'enter' : ''}">${docHead(cs)}<div class="q">${esc(cs.q)}</div><div class="opts">` + cs.options.map((o, i) => {
          let cls = ''; if (v) { if (i === cs.correct) cls = 'right'; else if (i === v.pick) cls = 'wrong'; }
          return `<button class="opt ${cls}" data-a="opt" data-i="${i}" ${v ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`;
        }).join('') + `</div>${v ? `<div class="stamp ${v.ok ? 'ok' : 'no'}">${v.ok ? 'CORRECT' : 'NOPE'}</div>` : ''}</div>`;
      } else {
        doc = `<div class="paper doc ${G.fresh ? 'enter' : ''} ${G.shake ? 'shake' : ''}">${docHead(cs)}<div class="nm">${esc(cs.name)}</div><div class="fields">` + cs.fields.map((f, i) => {
          let cls = G.flagged === i ? 'on' : ''; if (v && f[2]) cls += ' truth'; if (v && !f[2] && G.flagged !== i) cls += ' miss';
          return `<button class="field ${cls}" data-a="flag" data-i="${i}" ${v ? 'disabled' : ''} aria-pressed="${G.flagged === i}"><span class="k">${esc(f[0])}</span><span class="v">${esc(f[1])}</span><span class="f">${G.flagged === i ? '⚑ FLAGGED' : '⚑ FLAG'}</span></button>`;
        }).join('') + `</div>${v ? `<div class="stamp ${v.scls}">${v.stamp}</div>` : ''}</div>`;
      }
      const sup = v ? verdictBubble(cs, v) : `<div class="say"><span class="who">WALLY · SUPERVISOR</span>${cs.type === 'quiz' ? 'Quick one. Pick the answer the book would give.' : G.flagged === null ? 'Check every line against the rulebook. Spot something off? Click it to flag it.' : 'Flagged. If that line breaks the rules, DENY it. If you changed your mind, click it again.'}</div>`;
      const act = v ? `<span class="hint">${v.ok ? '+' + v.pts + ' points' + (G.streak >= 2 ? ` · streak ×${G.streak}` : '') : v.partial ? '+' + v.pts + ' points · right call, wrong line' : 'No points. The rulebook page is linked above.'}</span><button class="stampbtn next" data-a="next">${G.idx + 1 < shiftOf(G.shift).cases.length ? 'NEXT TOKEN →' : 'END SHIFT →'}</button>`
        : cs.type === 'quiz' ? `<span class="hint">Click an answer.</span>`
        : `<span class="hint">${G.flagged === null ? 'Flag the red flag, then DENY. Clean paperwork? ADMIT.' : 'Line flagged.'} <span class="kbd-hint">Keys: <kbd>1</kbd>–<kbd>5</kbd> flag · <kbd>A</kbd> admit · <kbd>D</kbd> deny</span></span><button class="stampbtn admit" data-a="admit">✓ ADMIT</button><button class="stampbtn deny" data-a="deny" aria-disabled="${G.flagged === null}">✗ DENY</button>`;
      return `<div class="tp-desk">
        <div class="booth"><div class="window"><div class="mascot ${mclass}">${mascotSVG(cs.kind, mood)}</div><div class="bars"></div></div>
          <div class="nameplate">$${esc(cs.ticker)}<small>${esc(cs.name)}</small></div>
          <div class="say hype"><span class="who">$${esc(cs.ticker)} SAYS</span>“${esc(cs.pitch)}”</div></div>
        ${doc}
        <div class="sup"><div class="wally ${v ? (v.ok ? 'nod' : 'no') : ''}">${wallySVG({ dir: 'left' })}</div>${sup}</div>
      </div><div class="tp-act">${act}</div>`;
    }
    function docHead(cs) {
      return `<div class="hd">${CREST}<div class="ttl">TOKEN PASSPORT<small>ONCHAIN CUSTOMS · FORM ${cs.type === 'quiz' ? 'Q' : 'T'}-${esc(cs.id.toUpperCase())}</small></div><div class="no">$${esc(cs.ticker)}<b>${esc(DATA.shiftDate)}</b></div></div>`;
    }
    function verdictBubble(cs, v) {
      const L = lessonsById[cs.cite];
      const cite = L ? `<div class="cite"><span>THE RULEBOOK · ${esc(L.chName.toUpperCase())} · ${L.id} · PAGE ${L.page}</span>“${esc(L.point)}”<br><a href="#read-${L.id.replace('.', '-')}" data-a="read" data-id="${L.id}">READ PAGE ${L.page} →</a></div>` : '';
      return `<div class="say"><span class="who">WALLY · SUPERVISOR</span><div class="verdict-h ${v.cls}">${esc(v.head)}</div><div class="why">${v.roast ? esc(v.roast) + ' ' : ''}${esc(cs.why)}</div>${cite}</div>`;
    }
    function reportScreen() {
      const sh = shiftOf(G.shift), c = chapter(G.shift);
      const res = sh.cases.map((cs) => [cs, G.runResults[cs.id] || st.results[cs.id]]);
      const okN = res.filter(([, r]) => r && r.ok).length, pts = res.reduce((a, [, r]) => a + ((r && r.pts) || 0), 0);
      const last = G.shift === DATA.shifts.length;
      return `<div class="tp-report"><div>
        <div class="eyebrow">END OF SHIFT ${String(G.shift).padStart(2, '0')} · ${esc(c.name.toUpperCase())}</div>
        <h3>${okN === sh.cases.length ? 'Flawless shift.' : okN >= sh.cases.length - 1 ? 'Good shift.' : 'Rough shift.'}</h3>
        <div class="big"><div><b>${okN}/${sh.cases.length}</b>CORRECT</div><div><b>+${pts}</b>POINTS</div><div><b>${G.score.toLocaleString('en-US')}</b>TOTAL</div></div>
        <ul class="cases">${res.map(([cs, r]) => `<li><i class="${r ? (r.ok ? 'y' : r.partial ? 'm' : 'n') : 'n'}">${r ? (r.ok ? '✓' : r.partial ? '½' : '✗') : '–'}</i><span><b>$${esc(cs.ticker)}</b>: ${esc(cs.answer === 'admit' ? 'clean, should be admitted' : cs.type === 'quiz' ? 'quiz' : 'red flag: ' + cs.fields.filter((f) => f[2]).map((f) => f[0].toLowerCase()).join(' / '))}</span></li>`).join('')}</ul>
        <div class="btns">${last ? `<button class="tp-go" data-a="final">See your rank →</button>` : `<button class="tp-go" data-a="nextshift">Shift ${G.shift + 1}: ${esc(chapter(G.shift + 1).name)} →</button>`}<button class="tp-ghost" data-a="replay">Replay shift</button><button class="tp-ghost" data-a="readch" data-id="${c.lessons[0].id}">Read chapter ${G.shift}</button></div>
      </div><div class="paper points-paper"><h5>WHAT THE RULEBOOK SAYS · CHAPTER ${G.shift}</h5>${c.lessons.map((l) => `<p><b>${l.id}</b>${esc(l.point)}</p>`).join('')}</div></div>`;
    }
    function finalScreen() {
      const all = DATA.shifts.flatMap((s) => s.cases), done = all.filter((c) => st.results[c.id]), ok = done.filter((c) => st.results[c.id].ok).length;
      const acc = done.length ? ok / done.length : 0, rank = RANKS.find((r) => acc >= r[0]);
      const text = `I scored ${G.score.toLocaleString('en-US')} on Tokens, Please and ranked "${rank[1]}" at Onchain Customs (${ok}/${all.length} tokens judged right). Learn the fine print with Wally's RWA Textbook:`;
      const share = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent('https://rwaf.xyz/guide/');
      return `<div class="tp-memo"><div class="wally">${wallySVG({ dir: 'right' })}</div><div>
        <div class="eyebrow">ALL ELEVEN SHIFTS · YOUR RANK</div>
        <div class="rank">${esc(rank[1])}</div><h4>${esc(rank[2])}</h4>
        <div class="tp-report"><div class="big" style="grid-column:1/-1"><div><b>${G.score.toLocaleString('en-US')}</b>SCORE</div><div><b>${Math.round(acc * 100)}%</b>ACCURACY</div><div><b>${ok}/${all.length}</b>TOKENS</div></div></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="tp-go" href="${share}" target="_blank" rel="noopener">Share your rank on X</a><button class="tp-ghost" data-a="reset">Play again from shift 1</button><button class="tp-ghost" data-a="home">All shifts</button></div>
      </div></div>`;
    }
    function rulebook() {
      const c = chapter(G.shift), hit = G.screen === 'case' && G.verdict ? curCase().cite : null;
      return `<div class="tp-rule" data-a="closerules"><div class="sheet" role="dialog" aria-label="Rulebook, chapter ${c.n}"><div class="top"><span>📖 RULEBOOK · CHAPTER ${c.n} · ${esc(c.name.toUpperCase())}</span><button class="x" data-a="closerules">CLOSE ✕</button></div>` +
        c.lessons.map((l) => `<details ${l.id === hit ? 'open class="hit"' : ''}><summary><b>${l.id}</b><span>${esc(l.title)}<span class="pt">${esc(l.point)}</span></span></summary><div class="bd">${l.body.map((p) => `<p>${esc(p)}</p>`).join('')}${(l.sections || []).map((s) => `<p><b>${esc(s.h)}.</b> ${esc(s.t)}</p>`).join('')}</div><button class="open" data-a="read" data-id="${l.id}">OPEN PAGE ${l.page} IN THE BOOK →</button></details>`).join('') + '</div></div>';
    }
    function render() {
      let body = '';
      if (G.screen === 'title') body = titleScreen(); else if (G.screen === 'shift') body = shiftScreen(); else if (G.screen === 'case') body = caseScreen(); else if (G.screen === 'report') body = reportScreen(); else body = finalScreen();
      root.innerHTML = bar() + `<div class="tp-main">${body}</div>` + (G.ruleOpen ? rulebook() : '');
      G.fresh = false; G.shake = false;
    }
    function persist() { st.lastShift = G.shift; save(st); }
    function startShift(n) { G.shift = n; G.idx = 0; G.flagged = null; G.verdict = null; G.runResults = {}; G.screen = 'shift'; persist(); render(); scrollTop(); }
    function scrollTop() { const r = root.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * 0.5) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    function decide(kind, extra) {
      const cs = curCase(); if (G.verdict) return;
      let v;
      if (cs.type === 'quiz') { const ok = extra === cs.correct; v = { kind: 'quiz', ok, pick: extra, head: ok ? 'Correct.' : 'Not quite.', cls: ok ? 'ok' : 'no' }; }
      else if (kind === 'admit') {
        const ok = cs.answer === 'admit';
        v = { kind, ok, admitted: true, head: ok ? 'Admitted. Good call.' : 'You admitted a red flag.', cls: ok ? 'ok' : 'no', scls: 'ok', stamp: 'ADMITTED', roast: ok ? '' : ROASTS_IN[Math.floor(Math.random() * ROASTS_IN.length)] };
      } else {
        const right = cs.answer === 'deny', hitFlag = right && cs.fields[G.flagged] && cs.fields[G.flagged][2];
        if (!right) v = { kind, ok: false, head: 'You denied a clean token.', cls: 'no', scls: 'no', stamp: 'DENIED', roast: ROASTS_OUT[Math.floor(Math.random() * ROASTS_OUT.length)] };
        else if (hitFlag) v = { kind, ok: true, head: 'Denied. Red flag found.', cls: 'ok', scls: 'no', stamp: 'DENIED' };
        else v = { kind, ok: false, partial: true, head: 'Right call, wrong reason.', cls: 'meh', scls: 'no', stamp: 'DENIED', roast: 'The problem was the ' + cs.fields.filter((f) => f[2]).map((f) => f[0].toLowerCase()).join(' / ') + ' line.' };
      }
      if (v.ok) { G.streak += 1; v.pts = (cs.type === 'quiz' ? 100 : cs.answer === 'deny' ? 150 : 100) + Math.max(0, G.streak - 1) * 10; }
      else { G.streak = 0; v.pts = v.partial ? 50 : 0; }
      const prev = st.results[cs.id]; if (prev) G.score -= prev.pts || 0;
      G.score += v.pts; st.results[cs.id] = { ok: v.ok, partial: !!v.partial, pts: v.pts }; G.runResults[cs.id] = st.results[cs.id]; persist();
      G.verdict = v; Snd.init();
      if (cs.type === 'quiz') { v.ok ? Snd.ding() : Snd.buzz(); }
      else { Snd.stamp(); setTimeout(() => { v.ok ? Snd.ding() : Snd.buzz(); }, 260); G.shake = true; }
      render();
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return;
      const a = b.dataset.a; Snd.init();
      if (a === 'closerules') { if (e.target === b || b.classList.contains('x')) { G.ruleOpen = false; render(); } return; }
      if (a === 'rules') { G.ruleOpen = true; Snd.paper(); render(); return; }
      if (a === 'mute') { Snd.on = !Snd.on; st.muted = !Snd.on; persist(); render(); return; }
      if (a === 'start') { startShift(G.shift); Snd.paper(); return; }
      if (a === 'pick') { startShift(+b.dataset.n); Snd.paper(); return; }
      if (a === 'open') { G.screen = 'case'; G.idx = 0; G.flagged = null; G.verdict = null; G.fresh = true; Snd.pop(); render(); return; }
      if (a === 'home') { G.screen = 'title'; render(); return; }
      if (a === 'flag') { const i = +b.dataset.i; G.flagged = G.flagged === i ? null : i; Snd.flag(); render(); return; }
      if (a === 'admit') { decide('admit'); return; }
      if (a === 'deny') { if (G.flagged === null) { Snd.buzz(); b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 220 }); const h = root.querySelector('.tp-act .hint'); if (h) h.textContent = 'Flag the line that breaks the rules first: click it on the passport.'; return; } decide('deny'); return; }
      if (a === 'opt') { decide('quiz', +b.dataset.i); return; }
      if (a === 'next') { const sh = shiftOf(G.shift); if (G.idx + 1 < sh.cases.length) { G.idx += 1; G.flagged = null; G.verdict = null; G.fresh = true; Snd.pop(); render(); } else { G.screen = 'report'; Snd.toot(); render(); scrollTop(); } return; }
      if (a === 'nextshift') { startShift(G.shift + 1); return; }
      if (a === 'replay') { startShift(G.shift); return; }
      if (a === 'final') { G.screen = 'final'; Snd.toot(); render(); scrollTop(); return; }
      if (a === 'reset') { st.results = {}; G.score = 0; G.streak = 0; persist(); startShift(1); return; }
      if (a === 'read' || a === 'readch') { e.preventDefault(); G.ruleOpen = false; render(); if (opts.onRead) opts.onRead(b.dataset.id); return; }
    });
    root.addEventListener('keydown', (e) => {
      if (G.screen !== 'case' || e.metaKey || e.ctrlKey || e.altKey) return;
      const cs = curCase(), k = e.key.toLowerCase();
      if (!G.verdict && cs.type !== 'quiz' && /^[1-9]$/.test(k) && +k <= cs.fields.length) { G.flagged = G.flagged === +k - 1 ? null : +k - 1; Snd.flag(); render(); focusRoot(); }
      else if (!G.verdict && cs.type === 'quiz' && /^[1-4a-d]$/.test(k)) { const i = /[a-d]/.test(k) ? k.charCodeAt(0) - 97 : +k - 1; if (i < cs.options.length) { decide('quiz', i); focusRoot(); } }
      else if (!G.verdict && k === 'a' && cs.type !== 'quiz') { decide('admit'); focusRoot(); }
      else if (!G.verdict && k === 'd' && cs.type !== 'quiz') { root.querySelector('[data-a="deny"]').click(); focusRoot(); }
      else if (G.verdict && (k === 'enter' || k === 'n')) { e.preventDefault(); root.querySelector('[data-a="next"]').click(); focusRoot(); }
    });
    function focusRoot() { if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1'); root.focus({ preventScroll: true }); }
    render();
  };
})();
