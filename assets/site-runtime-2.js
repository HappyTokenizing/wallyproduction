/* ============================================================
   WALLY NFT — app script. All state in memory (no storage APIs).
============================================================ */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString('en-US');
const usd = n => '$' + Math.round(n).toLocaleString('en-US');

/* ---------- state ---------- */
const S = {
  connected:true,
  name:'Herd Member', email:'',
  notifs:[],
  quizDone:new Set(), ownsStable:false,
  vaultPositions:{},
  newsletterJoined:false, favs:new Set(), pendingEco:false,
  selCourse:null, openLesson:null,
};

/* ---------- demo data ---------- */
const HOLDINGS = [
  {sym:'USDC',  name:'USD Coin',            qty:'18,420', val:18420, chain:'Ethereum', cat:'Stablecoins',    apy:0,    chg:0,     kind:'stable'},
  {sym:'tUSTB', name:'Tokenized T-Bills',   qty:'12,500', val:12531, chain:'Ethereum', cat:'Treasuries',     apy:5.21, chg:+0.04, kind:'rwa'},
  {sym:'tPCRD', name:'Private Credit Pool', qty:'6,000',  val:6142,  chain:'Base',     cat:'Private credit', apy:9.24, chg:+0.11, kind:'rwa'},
  {sym:'tREIT', name:'Real Estate Income',  qty:'3,210',  val:4873,  chain:'Polygon',  cat:'Real estate',    apy:7.10, chg:-0.06, kind:'rwa'},
  {sym:'tXAU',  name:'Tokenized Gold',      qty:'1.25 oz',val:3022,  chain:'Ethereum', cat:'Commodities',    apy:0,    chg:+0.32, kind:'rwa'},
  {sym:'WALLY', name:'WALLY Governance',    qty:'84,000', val:1596,  chain:'Ethereum', cat:'Governance',     apy:0,    chg:+2.40, kind:'rwa'},
  {sym:'ETH',   name:'Ethereum',            qty:'2.10',   val:5460,  chain:'Ethereum', cat:'Crypto',         apy:0,    chg:+1.85, kind:'crypto'},
  {sym:'BTC',   name:'Bitcoin',             qty:'0.072',  val:4990,  chain:'Bitcoin',  cat:'Crypto',         apy:0,    chg:+0.92, kind:'crypto'},
];
const ALLOC = [
  {label:'Treasuries',     pct:44, color:'var(--orange)'},
  {label:'Private credit', pct:22, color:'var(--violet)'},
  {label:'Real estate',    pct:17, color:'var(--green)'},
  {label:'Commodities',    pct:11, color:'var(--gold)'},
  {label:'Governance',     pct:6,  color:'#6E665C'},
];
const ICONS = {
  bank:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8"/><path d="M3 21h18M3 18h18"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/><path d="M3 12h18"/>',
  home:'<path d="M4 21V9l6-5 6 5v12"/><path d="M16 21h4v-8l-4-3"/><path d="M8 21v-5h4v5"/><path d="M3 21h18"/>',
  pie:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14.5 2.5A9 9 0 0 1 21.5 9.5h-7z"/>',
  zap:'<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  coin:'<ellipse cx="12" cy="6" rx="8" ry="3.2"/><path d="M4 6v6c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V6"/><path d="M4 12v6c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-6"/>',
  vault:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 10.6v1.4l1 1"/>',
  loan:'<path d="M12 3v18M5 8l7-5 7 5"/><path d="M4 21h16M6.5 12h11M8 16.5h8"/>',
  rows:'<rect x="3" y="5" width="18" height="3" rx="1"/><rect x="3" y="11" width="18" height="3" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/>',
  grid:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  x2:'<path d="M6 6l12 12M18 6L6 18"/>',
  gift:'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v7h14v-7M12 9v11"/><path d="M12 9C9 9 7 7.8 7 6a2 2 0 0 1 4-.6C11.4 6.6 12 9 12 9zm0 0c3 0 5-1.2 5-3a2 2 0 0 0-4-.6C12.6 6.6 12 9 12 9z"/>',
  lock:'<rect x="5" y="10" width="14" height="10" rx="2.2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  shield:'<path d="M12 3l8 3v6c0 4.6-3.2 7.6-8 9-4.8-1.4-8-4.4-8-9V6z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  cap:'<path d="M12 4L2 9l10 5 10-5z"/><path d="M6 11.3V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.7"/>',
};
const svg = (n,extra='') => `<svg viewBox="0 0 24 24" ${extra}>${ICONS[n]}</svg>`;

const VAULTS = [
  {id:'tbill', ic:'bank', name:'T-Bill Yield Vault', sub:'Tokenized short-term U.S. Treasuries: the onchain cash position.', apy:4.82, tvl:'$6.2M', risk:['LOW RISK','grn'],  chain:'Ethereum', redeem:'Daily',   gated:false},
  {id:'pcred', ic:'case', name:'Private Credit Vault', sub:'Senior secured lending pools with institutional underwriting.',   apy:9.24, tvl:'$3.1M', risk:['MED RISK','gld'],  chain:'Base',     redeem:'Monthly', gated:true},
  {id:'reit',  ic:'home', name:'Real Estate Income',  sub:'Fractionalized income-producing property, paid out monthly.',      apy:7.10, tvl:'$2.4M', risk:['MED RISK','gld'],  chain:'Polygon',  redeem:'Monthly', gated:false},
  {id:'index', ic:'pie',  name:'RWA Index Vault',     sub:'Diversified basket across treasuries, credit and real estate.',    apy:6.35, tvl:'$1.1M', risk:['LOW RISK','grn'],  chain:'Ethereum', redeem:'Weekly',  gated:false},
];

const COURSES = [
  {id:'c1', tag:'FOUNDATIONS', name:'RWA Fundamentals', desc:'What tokenized assets actually are, and how to read them like a pro.', reward:600, verify:true, lessons:[
    ['What is a Real-World Asset?','Real-World Assets (RWAs) are offchain assets (treasuries, credit, property, commodities) represented as tokens on a blockchain. The token is a claim wrapper: the legal structure decides what you own, the chain decides how it moves.','Tokenization changes the rails, not the asset. A tokenized T-bill still depends on the bill, the custodian, and the legal wrapper; the chain adds settlement speed, programmability, and global reach.',['RWA = offchain value, onchain rails','The legal wrapper defines your claim','Chains add speed and composability, not yield']],
    ['Why tokenize at all?','Traditional markets settle in days, close on weekends, and gate access by geography and minimums. Tokenized assets settle in minutes, trade around the clock, and split into fractions anyone can hold.','For issuers, tokenization shrinks distribution cost. For holders, it unlocks composability: a tokenized treasury can sit as collateral in a lending market the same hour you buy it.',['24/7 settlement vs. T+2','Fractional access lowers minimums','Composability is the killer feature']],
    ['The RWA stack','Issuers originate assets. Custodians hold them. Oracles attest to prices and proof-of-reserve. Marketplaces and DeFi protocols distribute. Each layer carries its own risk to evaluate.','When you assess an RWA token, walk the stack: who issues, who custodies, who verifies, where it trades. A weak link anywhere is a weak product everywhere.',['Issuer → custodian → oracle → venue','Evaluate every layer, not just the APY','Proof-of-reserve is table stakes']],
    ['Risk: read before you ape','RWA risk is layered: credit risk of the underlying, counterparty risk of the issuer, smart-contract risk of the wrapper, liquidity risk of the venue. Yield is payment for some mix of these.','A 9% “safe” yield means something is being paid for. Your job is to know which risk you are selling, not to pretend there is none.',['Yield = priced risk, always','Four layers: credit, counterparty, contract, liquidity','If you can’t name the risk, skip the trade']],
    ['Reading an RWA term sheet','Key fields: underlying asset, legal claim (debt? equity? trust unit?), redemption mechanics, fees, oracle source, and lockups. Ten minutes here beats ten weeks of regret.','Redemption is where tokenization gets real. Daily NAV redemption is a different product from quarterly gated windows, even at identical APY.',['Claim type beats the marketing name','Redemption terms define your liquidity','Fees compound against you']],,
    ['Custody: who actually holds it','Behind every RWA token sits a custodian holding the real asset. Their controls, audits and bankruptcy-remoteness decide whether the token is a claim you can enforce or a promise you merely hope holds.','Self-custody your tokens, but know the underlying still depends on an offchain custodian. Read who they are and how reserves are attested before sizing a position.',['A token is only as safe as its custodian','Look for bankruptcy-remote structures','Proof-of-reserve attestation is non-negotiable']]
  ]},
  {id:'c2', tag:'YIELD', name:'Tokenized Treasuries 101', desc:'The asset class that brought institutions onchain, demystified.', reward:300, lessons:[
    ['Why treasuries went onchain first','T-bills are the world’s reference asset: deep, liquid, government-backed. They were the obvious first export to crypto rails once stablecoin holders wanted yield without leaving the chain.','Tokenized treasuries grew from near zero to a multi-billion-dollar category in under three years: proof that institutions will use public chains when the wrapper is right.',['T-bills are reference collateral','Idle stablecoin cash was the demand','Fastest-growing RWA category']],
    ['How a tokenized T-bill works','A fund buys bills, a transfer agent tracks ownership, and a token mirrors fund shares. NAV accrues daily; the token either rebases or grows in redemption value.','Accumulating tokens (price drifts up) compose better with DeFi than rebasing ones (balance drifts up). Know which design you hold before you LP it.',['The token mirrors fund shares','Rebasing vs. accumulating designs','NAV accrual ≈ daily interest']],
    ['Yield mechanics and fees','Gross yield tracks short-term rates. Net yield is gross minus management, custody and wrapper fees. Onchain transparency makes fee drag visible. Use it.','Compare net-of-fees, same-duration products only. A 20bp fee gap compounds into real money on treasury-sized positions.',['Net APY is the only APY','Fee drag is visible onchain','Match duration when comparing']],
    ['Where they plug into DeFi','Tokenized bills now sit as collateral on lending markets, back stablecoins, and anchor index vaults. The “risk-free leg” of TradFi is becoming the base layer of DeFi.','This is the WALLY treasury thesis in miniature: park reserves in tokenized bills, let the yield fund the mission, keep everything auditable onchain.',['Collateral, backing, indexing','TradFi base layer → DeFi base layer','An auditable treasury builds trust']],,
    ['Risks unique to tokenized treasuries','Even "risk-free" treasuries carry wrapper risk: smart-contract bugs, oracle failure, and depeg of the token versus its NAV. The bill is safe; the token around it is only as safe as its engineering.','Diversify issuers, prefer audited contracts, and watch the token/NAV spread. A persistent discount can signal redemption stress before headlines catch up.',['The bill is safe; the wrapper has risk','Watch the token-vs-NAV spread','Diversify issuers, not just duration']]
  ]},
  {id:'c3', tag:'STRATEGY', name:'DeFi × RWA Strategies', desc:'Allocation frames for mixing stability with onchain upside.', locked:'c1', reward:350, lessons:[
    ['The barbell: bills + upside','A classic onchain allocation: majority in tokenized treasuries for stability, minority in higher-beta RWA credit or governance tokens. Boring core, expressive edge.','The barbell works because the safe leg pays you to wait. Rebalance when the risky leg outgrows its target band, not when the timeline is loud.',['The safe core funds patience','Size the risky sleeve, then leave it alone','Rebalance on bands, not vibes']],
    ['Looping and its limits','Deposit tokenized bills as collateral, borrow stables, buy more bills. Looping amplifies yield and risk together. Liquidation thresholds and depeg scenarios set your real ceiling.','Every loop adds smart-contract and liquidity risk on top of rate risk. Past two or three turns you’re farming basis points while carrying tail risk.',['Loops amplify both directions','Model the depeg before the yield','2–3 turns is usually the sane max']],
    ['Credit vaults: reading the pool','Private credit onchain means underwriting you can actually read: borrower disclosures, coverage ratios, tranche order. Senior tranches eat losses last and yield least.','First-loss capital is your friend. A pool where the manager holds the junior tranche has aligned incentives baked in.',['Seniority = order of pain','Coverage ratio beats headline APY','Manager skin-in-the-game matters']],
    ['Exit liquidity is a strategy','Plan the exit at entry: redemption windows, secondary venues, acceptable haircuts. An illiquidity premium is only a premium if you never need the money early.','WALLY vaults publish redemption mechanics up front. Match vault liquidity to your own horizon and the strategy survives stress.',['Plan exits at entry','Illiquidity premium has a price','Match horizon to redemption terms']],,
    ['Sizing and rebalancing discipline','Strategy is nothing without sizing. Decide your bands up front (say 70% safe, 30% risky) and rebalance when drift breaches them, not when sentiment spikes. Rules beat reflexes.','Write the plan before you deploy: target weights, rebalance triggers, and a maximum drawdown you will tolerate. Then follow it mechanically.',['Set bands before you deploy','Rebalance on drift, not on news','Pre-commit your max drawdown']]
  ]},
  {id:'c4', tag:'GOVERNANCE', name:'Governance & $WALLY', desc:'How the Herd decides, and how points become tokens.', reward:300, lessons:[
    ['How governance decides','Proposals move from forum to temperature check to onchain vote. $WALLY weights the vote; quorum requirements and timelocks protect against capture.','Reading governance forums is alpha. Treasury strategy shifts are announced there weeks before they show up on any dashboard.',['Forum → check → onchain vote','Quorum + timelocks are the safety rails','Forums front-run dashboards']],
    ['Treasury policy in practice','The treasury holds yield-bearing RWAs; the yield funds grants, operations and incentives. Policy rules set the allocation bands the treasury must respect.','Sustainable treasuries spend yield, not principal. WALLY’s design ties the mission budget to real cash flow rather than token emissions.',['Spend yield, protect principal','Allocation bands constrain managers','Cash flow beats emissions']],
    ['Points, TGE, and you','WALLY Points record contribution before the token exists. At TGE a published conversion maps points to $WALLY, with extra weight for early, consistent activity.','Points are reputation made portable. Stack them by learning, voting and depositing: exactly the behaviors the Herd wants more of.',['Points = pre-token reputation','Conversion publishes at TGE','Consistency is weighted']],
    ['Reading a treasury report','A healthy treasury publishes its holdings, yields and spending. Learn to read it: is spending covered by yield? Is principal intact? Are allocations within voted bands? The report is the treasury’s vital signs.','Scan for three things: cash-flow coverage, principal preservation, and band compliance. Anything off there is worth a forum question before your next vote.',['Spending should be covered by yield','Principal intact = healthy treasury','Off-band allocations deserve scrutiny']]
  ]},
];

/* ---------- quizzes (mixed types; 80% to pass) ---------- */
const QUIZZES={
 c1:[
  {type:'mc',q:'An RWA token is best described as…',opts:['the asset itself, living on a blockchain','a claim wrapper whose legal structure defines what you own','a cryptocurrency with no link to anything real','a stablecoin issued by a government'],a:1},
  {type:'tf',q:'Tokenization changes the underlying asset, not just how it moves.',a:false},
  {type:'type',q:'In one word: a tokenized asset pegged 1:1 to a fiat currency is a ______.',a:['stablecoin','stablecoins']},
  {type:'mc',q:'A “9% safe yield” on an RWA most likely means…',opts:['free money, no downside','someone is being paid to take a risk you should identify','the protocol is lying','government-guaranteed returns'],a:1},
  {type:'order',q:'Order the RWA stack from origination to trading:',items:['Issuer','Custodian','Oracle','Marketplace'],a:['Issuer','Custodian','Oracle','Marketplace']},
  {type:'type',q:'Fill in the blank: the ______ terms (daily vs. quarterly windows) define an asset’s real liquidity.',a:['redemption','redemptions']},
 ],
 c2:[
  {type:'mc',q:'Why did treasuries go onchain first?',opts:['they are the riskiest asset','they are the world’s deep, liquid reference asset','they have no regulation','they pay the highest yield'],a:1},
  {type:'tf',q:'Net APY equals gross yield minus management, custody and wrapper fees.',a:true},
  {type:'type',q:'A token whose redemption value drifts upward (not its balance) is called an ______ token.',a:['accumulating','accruing']},
  {type:'mc',q:'When comparing two tokenized treasury products you should match…',opts:['their logos','their duration and compare net-of-fees','only the headline APY','the number of holders'],a:1},
  {type:'tf',q:'Tokenized treasuries can serve as collateral in onchain lending markets.',a:true},
 ],
 c3:[
  {type:'mc',q:'In a barbell allocation, the safe leg’s job is to…',opts:['maximize returns','pay you to wait while the risky sleeve plays out','eliminate all risk','replace the risky sleeve'],a:1},
  {type:'tf',q:'Looping past 2–3 turns mostly adds tail risk for thin extra yield.',a:true},
  {type:'mc',q:'In a credit pool, the senior tranche…',opts:['takes losses first, yields most','takes losses last, yields least','is always risk-free','is the manager’s tranche'],a:1},
  {type:'type',q:'One word: plan your ______ at entry: redemption windows and acceptable haircuts.',a:['exit','exits']},
  {type:'tf',q:'An illiquidity premium is only a premium if you never need the money early.',a:true},
 ],
 c4:[
  {type:'order',q:'Order how an onchain governance proposal typically advances:',items:['Forum post','Temperature check','Onchain vote'],a:['Forum post','Temperature check','Onchain vote']},
  {type:'mc',q:'Sustainable treasuries should spend…',opts:['principal','yield, protecting principal','token emissions only','nothing'],a:1},
  {type:'tf',q:'WALLY Points convert to $WALLY at TGE, weighted toward early, consistent activity.',a:true},
  {type:'type',q:'Quorum and ______ are the two safety rails protecting governance from capture.',a:['timelock','timelocks']},
 ],
};
const QUIZ_PASS=0.8;


/* ---------- toasts ---------- */
function toast(title, desc, pts, green){
  const t = document.createElement('div');
  t.className = 'toast' + (green ? ' green' : '');
  t.innerHTML = `<span class="ti">${!green?'<img src="/assets/embedded/481a325168e6f0693734.png" alt="">':svg('check')}</span>
    <span style="min-width:0"><div class="tt">${title}</div>${desc?`<div class="td">${desc}</div>`:''}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(), 380); }, 4300);
}

function notify(title, desc){ S.notifs.unshift({title, desc, t:Date.now()}); renderNotifs(); }

/* ---------- notifications ---------- */
function renderNotifs(){
  if($('#ndot')) $('#ndot').style.opacity = S.notifs.length ? 1 : 0;
  const list = $('#notifList'); if(!list) return;
  list.innerHTML = S.notifs.length
    ? S.notifs.slice(0,8).map(n=>`<div class="dd-it"><span class="dot2"></span><span style="min-width:0">${n.title}<div class="ts">${n.desc} · ${ago(n.t)}</div></span></div>`).join('')
    : '<div class="dd-it"><span style="color:var(--text3)">All caught up. Go earn something.</span></div>';
}
function toggleNotif(e){ e.stopPropagation(); $('#notifDrop').classList.toggle('open'); }
function clearNotifs(){ S.notifs=[]; renderNotifs(); }
document.addEventListener('click', e=>{ const d=$('#notifDrop'); if(d && d.classList.contains('open') && !e.target.closest('.nwrap')) d.classList.remove('open'); });
const ago = t => { const m=Math.max(1,Math.round((Date.now()-t)/60000)); return m<60? m+'m ago' : Math.round(m/60)+'h ago'; };

/* ---------- landing: nav / reveal / counters ---------- */
function mm(){ $('#mmenu').classList.remove('open'); $('#mmenu').inert=true; const b=$('.nav-burger'); if(b) b.setAttribute('aria-expanded','false'); }
function toggleMenu(){ const open=$('#mmenu').classList.toggle('open'); $('#mmenu').inert=!open; const b=$('.nav-burger'); if(b) b.setAttribute('aria-expanded', open); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('#mmenu').classList.contains('open')) mm(); });
document.addEventListener('click', e=>{ const m=$('#mmenu'); if(m.classList.contains('open') && !m.contains(e.target) && !e.target.closest('.nav-burger')) mm(); });
addEventListener('scroll', ()=> $('#nav').classList.toggle('scrolled', scrollY>24), {passive:true});

const io = new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), {threshold:.15});
$$('.rv').forEach(el=>io.observe(el));

/* ---------- featured-member logo marquee (top of homepage) ---------- */
const LM_PX_PER_SEC = 40; // constant scroll speed (px/sec) on every screen size — tweak to taste
function lmSetDur(){
  // The keyframe travels exactly one group width (-50% of the two-group track).
  // Derive the duration from that pixel distance so a phone (short strip) and a
  // desktop (long strip) scroll at the SAME visual speed instead of the phone crawling.
  const track = document.getElementById('logoMarqTrack');
  const g = track && track.firstElementChild;
  if(!g) return;
  // Floor the measured width at the minimum a filled strip can legitimately be.
  // Before the logo images decode they measure ~0px wide; trusting that tiny width
  // produced a tiny duration = the marquee blasting past at hyperspeed.
  const floorW = window.innerWidth + 140;
  const w = Math.max(g.scrollWidth, floorW);
  track.style.setProperty('--lm-dur', (w / LM_PX_PER_SEC) + 's');
}
function buildLogoMarquee(){
  const track = document.getElementById('logoMarqTrack');
  if(!track) return;
  // A hidden homepage lays out at 0px, so a strip built now would be measured blind.
  // Defer: showPage('home') rebuilds stale strips the moment the page is visible again.
  const home = document.getElementById('page-home');
  if(home && home.hidden){ window.__lmStale = 1; return; }
  const tiles = [...document.querySelectorAll('#page-foundation .logowall .lw-grid .lw-tile')];
  if(!tiles.length){
    const roster = window.__rwafRoster || window.RWAF_MEMBER_DEFAULTS || [];
    roster.forEach(l=>{const tile=document.createElement('span');if(l.word)tile.textContent=l.name;else{const im=document.createElement('img');im.src=l.src;im.alt=l.name;tile.append(im);}tiles.push(tile);});
  }
  if(!tiles.length){ track.innerHTML=''; return; }
  const itemHTML = el => { const im=el.querySelector('img'); return im ? `<span class="lm-item"><img src="${im.getAttribute('src')}" alt=""></span>` : `<span class="lm-item lm-word">${el.textContent.trim()}</span>`; };
  const unit = tiles.map(itemHTML).join('');
  // build one group, then repeat the logo set until it comfortably exceeds the viewport
  track.innerHTML = '<div class="lm-group">'+unit+'</div>';
  const g = track.firstElementChild;
  let guard = 0;
  while(g.scrollWidth < window.innerWidth + 140 && guard < 12){ g.insertAdjacentHTML('beforeend', unit); guard++; }
  // duplicate the (now wide-enough) group so the -50% scroll loops seamlessly
  track.insertAdjacentHTML('beforeend', '<div class="lm-group">'+g.innerHTML+'</div>');
  lmSetDur();
  // re-derive the duration once every image has actually decoded — the width measured
  // above can be far too small while decodes are still in flight
  Promise.all([...g.querySelectorAll('img')].map(im => (im.decode ? im.decode() : Promise.resolve()).catch(()=>{})))
    .then(()=>requestAnimationFrame(lmSetDur));
}
buildLogoMarquee();
(function(){
  const track = document.getElementById('logoMarqTrack');
  if(!track) return;
  // images may still be decoding on first paint; rebuild once loaded
  window.addEventListener('load', buildLogoMarquee, {once:true});
  // Safety net: any late layout change (font swap, slow decode, logos edited in the
  // console) re-derives the duration from the real strip width, so the speed can
  // never stay wrong. Writing --lm-dur doesn't affect layout, so this can't loop.
  if(window.ResizeObserver) new ResizeObserver(lmSetDur).observe(track);
  // Only rebuild when the WIDTH actually changes. On mobile, scrolling shows/hides the
  // address bar, which fires resize with a new height on every scroll — rebuilding then
  // would collapse the strip and make the logos jump/stutter. Height-only changes are ignored.
  let rt, lastW = window.innerWidth;
  window.addEventListener('resize', ()=>{
    if(window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(buildLogoMarquee, 250);
  });
})();

function countUp(el){
  // Re-read data-count every frame: /api/stats may land mid-animation and
  // retarget a card that was already counting up (stat cards above the fold).
  const pre = el.dataset.prefix||'', suf = el.dataset.suffix||'';
  const t0 = performance.now(), dur = 1500;
  el.dataset.counting = '1';
  (function step(t){
    const raw = el.dataset.count, target = parseFloat(raw);
    const dec = el.dataset.int ? 0 : (raw.split('.')[1]||'').length;
    const k = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-k,3), v = target*e;
    el.textContent = pre + (el.dataset.int ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + suf;
    if(k<1) requestAnimationFrame(step); else delete el.dataset.counting;
  })(t0);
}
const cio = new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ countUp(en.target); cio.unobserve(en.target); } }),{threshold:.5});
$$('[data-count]').forEach(el=>cio.observe(el));

/* ---------- live stat cards ----------
   /api/stats scrapes each card's cited source server-side and is edge-cached
   for an hour, so the numbers refresh hourly without any manual edits. The
   values baked into the HTML above are the fallback if a source is down. */
(function(){
  if(!document.getElementById('stats'))return;
  function setVal(id, billions){
    var el=document.getElementById(id); if(!el||billions==null) return;
    var v=(+billions).toFixed(1);
    el.dataset.count=v;
    // count-up still running: it re-reads data-count each frame and lands on v.
    // count-up finished: snap straight to the fresh value.
    if(!el.dataset.counting&&el.textContent!=='$0'&&el.textContent!=='0') el.textContent=(el.dataset.prefix||'')+v;
  }
  function chip(p,label){ if(p==null) return ''; var up=p>=0; return '<span class="'+(up?'up':'dn')+'">'+(up?'▲':'▼')+' '+Math.abs(p).toFixed(1)+'% <em>'+label+'</em></span>'; }
  function asofLive(key){ var el=document.querySelector('[data-stat-asof="'+key+'"]'); if(el) el.textContent='Live · hourly'; }
  fetch('/api/stats').then(function(r){ return r.ok?r.json():null; }).then(function(d){
    if(!d) return;
    if(d.stable&&d.stable.value){ setVal('stStable', d.stable.value/1e9); asofLive('stable'); }
    if(d.rwaMcap&&d.rwaMcap.value){
      setVal('stMcap', d.rwaMcap.value/1e9); asofLive('rwaMcap');
      var c=document.getElementById('stMcapChg');
      if(c&&d.rwaMcap.pct30d!=null) c.innerHTML=chip(d.rwaMcap.pct30d,'30D');
    }
    if(d.rwaTvl&&d.rwaTvl.value){
      setVal('stTvl', d.rwaTvl.value/1e9); asofLive('rwaTvl');
      var c2=document.getElementById('stTvlChg');
      if(c2){ var h=[chip(d.rwaTvl.pct7d,'7D'),chip(d.rwaTvl.pct30d,'30D')].filter(Boolean); if(h.length) c2.innerHTML=h.join('<i></i>'); }
    }
    if(d.herd&&d.herd.value){
      var hv=document.getElementById('herdLive');
      if(hv){ hv.dataset.count=Math.round(d.herd.value); if(!hv.dataset.counting&&hv.textContent!=='0') hv.textContent=Math.round(d.herd.value).toLocaleString('en-US'); }
      var g=document.getElementById('herdGrow');
      if(g&&d.herd.delta30d!=null){ var dd=Math.round(d.herd.delta30d); g.innerHTML='<span class="'+(dd>=0?'up':'dn')+'">'+(dd>=0?'+':'\u2212')+Math.abs(dd).toLocaleString('en-US')+'</span> NEW FOLLOWERS \u00b7 30D'; }
    }
  }).catch(function(){});
})();


/* ---------- newsletter ---------- */
function joinHerd(){
  const inp=$('#newsEmail'), val=(inp.value||'').trim().toLowerCase();
  const row=$('#newsRow');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)){ row.classList.add('err'); inp.focus(); setTimeout(()=>row.classList.remove('err'),500); return; }
  const btn=row.querySelector('button');
  if(btn.disabled) return;
  const orig=btn.innerHTML;
  btn.disabled=true; btn.textContent='Joining…';
  // Invisible beehiiv handoff: /api/subscribe (Vercel fn) holds the keys, the page never sees them.
  fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:val})})
    .then(r=>r.json().then(d=>({ok:r.ok && d && d.success!==false, msg:d && d.message})))
    .catch(()=>({ok:false, msg:'Network hiccup. Please try again.'}))
    .then(({ok,msg})=>{
      if(!ok){
        btn.disabled=false; btn.innerHTML=orig;
        toast('Subscription failed', msg||'Unable to subscribe. Please try again.');
        return;
      }
      S.email = S.email || val;
      row.hidden = true; $('#newsDone').hidden = false;
      if(!S.newsletterJoined){
        S.newsletterJoined = true;
        toast('Welcome to the Herd', 'Check your inbox for your first briefing.', null, true);
      }
    });
}

/* ---------- modals ---------- */
function openModal(id){ $('#'+id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id){
  const m = $('#'+id);
  m.classList.remove('open'); document.body.style.overflow='';
  const vid = m.querySelector('video'); if(vid){ try{ vid.pause(); }catch(e){} }
}
function openVideo(){
  openModal('mVideo');
  const v = $('#wallyVid');
  if(v){ try{ v.currentTime = 0; const p = v.play(); if(p && p.catch) p.catch(()=>{}); }catch(e){} }
}
function closeVideo(){ closeModal('mVideo'); }
$$('.modal-veil').forEach(v=>v.addEventListener('click', e=>{ if(e.target===v) closeModal(v.id); }));
addEventListener('keydown', e=>{ if(e.key==='Escape'){ $$('.modal-veil.open').forEach(v=>closeModal(v.id)); mm(); } });

function showApp(){
  $('#landing').hidden=true; $('#app').hidden=false; scrollTo(0,0);
  renderNotifs(); showView('overview');
  twStart();
  if(S.pendingEco){ S.pendingEco=false; setTimeout(()=>openEcoFrom('app'), 600); }
}
function exitApp(){ $('#app').hidden=true; $('#landing').hidden=false; showPage('home'); twStop(); }

/* ---------- sidebar X feed: single-tweet slider ---------- */
// demo posts — swap for live @RWAFoundation_ API at launch. media:'svgKey' optional.
const TWEETS=[
  {id:'1933312345678901248', t:'2H', body:'Tokenized treasuries just crossed $7.4B. The base layer of onchain finance is quietly settling in. 🐘', media:'tbill', likes:'412', rt:'88'},
  {id:'1932940012345678336', t:'1D', body:'New: RWAs explained in 5 minutes: wallets, stablecoins, vaults, trading and borrowing. Zero jargon, no homework. Read it, then come build with the Herd.', likes:'1.2K', rt:'306'},
  {id:'1932210987654321152', t:'3D', body:'WIP-07 voting opens Friday: treasury allocation bands, decided by the Herd. Your points are your voice.', media:'vote', likes:'540', rt:'121'},
];
const TW_ILLU={
  tbill:'<svg class="tw-illu" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="twg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4EB"/><stop offset="1" stop-color="#FFE4CC"/></linearGradient></defs><rect width="320" height="180" fill="url(#twg1)"/><polyline points="0,140 50,120 100,128 150,92 200,104 250,60 320,40" fill="none" stroke="#FF6200" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="250" cy="60" r="5" fill="#FF6200"/><text x="20" y="36" font-family="ui-monospace,monospace" font-size="13" fill="#D85300" font-weight="700">TVL · $7.4B</text></svg>',
  vote:'<svg class="tw-illu" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="#F4F1EA"/><rect x="40" y="96" width="46" height="54" rx="5" fill="#0E9F6E"/><rect x="104" y="64" width="46" height="86" rx="5" fill="#FF6200"/><rect x="168" y="110" width="46" height="40" rx="5" fill="#B7791F"/><rect x="232" y="84" width="46" height="66" rx="5" fill="#6D5BD0"/><text x="24" y="34" font-family="ui-monospace,monospace" font-size="12" fill="#6B6357" font-weight="700">WIP-07 · GOVERNANCE</text></svg>',
};
const TW={i:0,timer:null,paused:false};
/* Universal, screen-size-independent truncation: cap the tweet body at a fixed
   character count and append a real ellipsis. Keeps every card the same rough
   height across mobile/desktop so the slider never jumps or overflows. Tweets
   with media get a tighter cap since the image eats vertical space. */
const TW_MAX_TEXT=180, TW_MAX_MEDIA=116;
function twTrim(text, max){
  if(!text || text.length<=max) return text||'';
  let s=text.slice(0, max);
  const sp=s.lastIndexOf(' ');
  if(sp>max*0.6) s=s.slice(0, sp);            // prefer a clean word boundary
  return s.replace(/[\s.,;:!?…—–-]+$/,'')+'…'; // trim trailing punctuation, then add …
}
function twRender(dir){
  const vp=document.getElementById('twViewport'); if(!vp) return;
  const t=TWEETS[TW.i], hasMedia=!!t.media;
  vp.innerHTML=`<a class="tw-card" href="https://x.com/RWAFoundation_/status/${t.id}" target="_blank" rel="noopener">
    <div class="tw-head">
      <span class="tw-ava"><img src="/assets/embedded/481a325168e6f0693734.png" alt=""></span>
      <span class="tw-id"><b>RWA Foundation</b><span>@RWAFoundation_</span></span>
      <span class="tw-time">${t.t}</span>
    </div>
    <div class="tw-body ${hasMedia?'':'long'}">${twTrim(t.body, hasMedia?TW_MAX_MEDIA:TW_MAX_TEXT)}</div>
    ${hasMedia?`<div class="tw-media">${TW_ILLU[t.media]||''}</div>`:''}
    <div class="tw-stats"><span><b>${t.rt}</b> Reposts</span><span><b>${t.likes}</b> Likes</span></div>
  </a>`;
  const dots=document.getElementById('twDots');
  if(dots) dots.innerHTML=TWEETS.map((_,k)=>`<i class="${k===TW.i?'on':''}" onclick="twGo(${k})"></i>`).join('');
}
function twNext(){ TW.i=(TW.i+1)%TWEETS.length; twRender(); }
function twNextManual(){ TW.i=(TW.i+1)%TWEETS.length; twRender(); twReset(); }
function twPrev(){ TW.i=(TW.i-1+TWEETS.length)%TWEETS.length; twRender(); twReset(); }
function twGo(k){ TW.i=k; twRender(); twReset(); }
function twReset(){ if(TW.timer) clearInterval(TW.timer); TW.timer=setInterval(()=>{ if(!TW.paused) twNext(); }, 5200); }
function twStart(){ if(!document.getElementById('twViewport')) return; TW.i=0; twRender(); twReset(); }
function twStop(){ if(TW.timer){ clearInterval(TW.timer); TW.timer=null; } }
function twPause(){ TW.paused=true; }
function twResume(){ TW.paused=false; }

/* ---------- router ---------- */
const TITLES={overview:'Overview',learnApp:'Education center'};
const RENDER={overview:renderOverview,learnApp:renderLearn};
function showView(id){
  $$('.view').forEach(v=>v.classList.toggle('active', v.id==='v-'+id));
  $$('.sb-link').forEach(a=>a.classList.toggle('active', a.dataset.view===id));
  $('#tbTitle').textContent = TITLES[id];
  closeSb(); RENDER[id]();
  $('.main').scrollTop=0; scrollTo(0,0);
}
function openSb(){ $('#sidebar').classList.add('open'); $('#sbVeil').classList.add('on'); }
function closeSb(){ $('#sidebar').classList.remove('open'); $('#sbVeil').classList.remove('on'); }

/* ---------- svg helpers ---------- */
function donutSVG(data, size=150, sw=20){
  const r=(size-sw)/2, C=2*Math.PI*r; let off=0;
  const segs=data.map(d=>{
    const len=C*d.pct/100;
    const s=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-dasharray="${(len-2.5).toFixed(1)} ${(C-len+2.5).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"/>`;
    off+=len; return s;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${segs}</svg>`;
}
function areaSVG(pts, id, w=560, h=180){
  const min=Math.min(...pts)*.9975, max=Math.max(...pts)*1.0025;
  const X=i=>(i/(pts.length-1))*w, Y=v=>h-((v-min)/(max-min))*(h-18)-9;
  const line=pts.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  return `<svg class="area" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--orange)" stop-opacity=".32"/><stop offset="1" stop-color="var(--orange)" stop-opacity="0"/></linearGradient></defs>
    <path d="${line}L${w},${h}L0,${h}Z" fill="url(#${id})"/>
    <path d="${line}" fill="none" stroke="var(--orange)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${w-2}" cy="${Y(pts[pts.length-1]).toFixed(1)}" r="4" fill="var(--orange)"/></svg>`;
}
function sparkSVG(seed, up=true, w=92, h=34){
  let v=50, pts=[]; for(let i=0;i<16;i++){ v+=Math.sin(seed*7+i*1.7)*5+(up?i*.9:-i*.7); pts.push(v); }
  const min=Math.min(...pts), max=Math.max(...pts);
  const d=pts.map((p,i)=>`${i?'L':'M'}${(i/15*w).toFixed(1)},${(h-4-((p-min)/(max-min))*(h-8)).toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="${up?'var(--green)':'var(--red)'}" stroke-width="2" stroke-linecap="round" opacity=".85"/></svg>`;
}
const visHoldings = () => HOLDINGS.filter(h=>h.kind!=='crypto'||S.showCrypto);
const totalHoldings = () => HOLDINGS.reduce((a,h)=>a+h.val,0);
const sumStable = () => HOLDINGS.filter(h=>h.kind==='stable').reduce((a,h)=>a+h.val,0);
const sumRWA = () => HOLDINGS.filter(h=>h.kind==='rwa').reduce((a,h)=>a+h.val,0)+Object.values(S.vaultPositions).reduce((a,b)=>a+b,0);
const sumLoans = () => 7800; /* demo */
const stablesInVaults = () => Object.values(S.vaultPositions).reduce((a,b)=>a+b,0);
const collateralValue = () => 11800;
const repaymentCost = () => Math.round(sumLoans()*1.062);
function blendedYield(){
  let yv=0, base=0;
  HOLDINGS.forEach(h=>{ if(h.apy>0){ yv+=h.val*h.apy/100; base+=h.val; } });
  for(const [id,amt] of Object.entries(S.vaultPositions)){ const v=VAULTS.find(x=>x.id===id); yv+=amt*v.apy/100; base+=amt; }
  return base? yv/base*100 : 0;
}
const totalVal = () => visHoldings().reduce((a,h)=>a+h.val,0) + Object.values(S.vaultPositions).reduce((a,b)=>a+b,0);

/* ---------- overview ---------- */
function renderOverview(){
  const quizzesTotal=COURSES.length;
  $('#v-overview').innerHTML = `
  <div class="vw-head"><h2>GM, ${S.name.split(' ')[0]}. Happy Tokenizing!</h2><p>Your home and guide to the world of Real-World Assets.</p></div>
  <div class="kpis">
    <a class="kpi cta" href="https://www.wallynft.xyz/" target="_blank" rel="noopener"><div class="k">The thesis</div><div class="v">Learn more</div><div class="d">WALLY NFT · 2026</div></a>
    <div class="kpi"><div class="k">Quizzes passed</div><div class="v">${S.quizDone.size}<span style="font-size:.55em;color:var(--text3)">/${quizzesTotal}</span></div><div class="d">EDUCATION CENTER</div></div>
    <button class="kpi cta" onclick="showView('learnApp')"><div class="k">Keep learning</div><div class="v">Open the<br>courses</div><div class="d">LEARN <span class="arr">→</span></div></button>
  </div>`;
}

/* ---------- learn ---------- */
function renderLearn(){
  const sel=COURSES.find(c=>c.id===S.selCourse);
  $('#v-learnApp').innerHTML=`
  <div class="vw-head"><h2>Education center</h2><p>Read each track, then pass its quiz to test your knowledge. Quizzes are designed to be tough. No shortcuts.</p></div>
  <div class="courses-grid">
    ${COURSES.map(c=>{
      const total=c.lessons.length, passed=S.quizDone.has(c.id);
      const locked=c.locked && !S.quizDone.has(c.locked);
      return `<div class="course ${locked?'locked':''} ${S.selCourse===c.id?'sel':''}" onclick="${locked?`toast('Course locked','Pass the RWA Fundamentals quiz to unlock this track.')`:`selectCourse('${c.id}')`}">
        ${locked?'<span class="locked-tag tag gld">🔒 LOCKED</span>':passed?'<span class="locked-tag tag grn">PASSED ✓</span>':`<span class="locked-tag tag org">QUIZ</span>`}
        <span class="c-ico">${svg('cap')}</span>
        <h5>${c.name}</h5>
        <p>${c.desc}</p>
        <div class="c-meta"><span>${c.tag}</span><span>·</span><span>${total} LESSONS</span><span>·</span><span>QUIZ</span></div>
        <div class="bar"><i style="width:${passed?100:0}%"></i></div>
      </div>`;
    }).join('')}
  </div>
  ${sel?renderCourse(sel):''}
  <div class="vw-head" style="margin-top:46px"><h2>The Reading Room</h2><p>Long form writing from across the herd: official briefings from the RWA Foundation, community dispatches from WALLY NFT, and sharp takes from Zeus.</p></div>
  <div id="learnArt"></div>`;
  renderLearnArticles();
}
function renderCourse(c){
  const passed=S.quizDone.has(c.id);
  return `<div class="panel" id="lessonPanel">
    <div class="panel-h"><h4>${c.name}</h4><div class="right">${passed?'<span class="tag grn">QUIZ PASSED ✓</span>':'<span class="tag org">PASS THE QUIZ</span>'}</div></div>
    <div class="lesson-list">
      ${c.lessons.map((L,i)=>{
        const key=c.id+'-'+i, open=S.openLesson===key;
        return `<div class="lesson ${open?'isopen':''}">
          <button class="lesson-head" onclick="toggleLesson('${key}')">
            <span class="ln">${String(i+1).padStart(2,'0')}</span>
            <span style="flex:1;min-width:0"><div class="lt">${L[0]}</div></span>
            <span class="lchev ${open?'on':''}">${svg('chev')}</span>
          </button>
          ${open?`<div class="lesson-body"><p>${L[1]}</p><p>${L[2]}</p>
            <div class="kt"><b style="display:block;font-family:var(--mono);font-size:10px;letter-spacing:.16em;margin-bottom:8px;color:var(--orange2)">KEY TAKEAWAYS</b><ul style="margin:0 0 0 16px">${L[3].map(k=>`<li>${k}</li>`).join('')}</ul></div></div>`:''}
        </div>`;
      }).join('')}
    </div>
    <div class="quiz-cta">
      ${c.verify?`<div class="verify-step ${S.ownsStable?'done':''}">
        <span class="vs-ic">${S.ownsStable?svg('check'):svg('coin')}</span>
        <div class="vs-tx"><b>${S.ownsStable?'Wallet verified: stablecoin found ✓':'Step: prove you hold a stablecoin'}</b><span>${S.ownsStable?'You’re cleared to take the Fundamentals quiz.':'RWA Fundamentals asks you to connect a wallet holding any stablecoin (USDC, USDT, DAI…).'}</span></div>
        ${S.ownsStable?'':`<button class="btn btn-ghost btn-sm" onclick="verifyStable()">${S.connected?'Check my wallet':'Connect wallet'}</button>`}
      </div>`:''}
      ${passed
        ? `<div class="quiz-passed"><span>${svg('check')}</span> You passed this quiz. Revisit the lessons anytime.</div>`
        : `<button class="btn btn-orange btn-lg" onclick="startQuiz('${c.id}')" ${c.verify&&!S.ownsStable?'disabled':''}>${c.verify&&!S.ownsStable?'Verify your wallet to unlock the quiz':'Take the quiz'} <span class="arr">→</span></button>`}
    </div>
  </div>`;
}
function selectCourse(id){ S.selCourse = S.selCourse===id ? null : id; S.openLesson=null; renderLearn(); if(S.selCourse) setTimeout(()=>{const p=$('#lessonPanel'); p&&p.scrollIntoView({behavior:'smooth',block:'start'});},60); }
function toggleLesson(key){ S.openLesson = S.openLesson===key ? null : key; renderLearn(); }
function verifyStable(){
  S.ownsStable=true;
  toast('Wallet verified', 'Stablecoin holding confirmed.', null, true);
  renderLearn();
}

/* ---------- quiz engine ---------- */
const Q={cid:null,i:0,answers:[],dragFrom:null};
function startQuiz(cid){
  Q.cid=cid; Q.i=0; Q.answers=[];
  QUIZZES[cid].forEach((qq,idx)=>{ Q.answers[idx]= qq.type==='order' ? shuffle(qq.items.slice()) : null; });
  openModal('mQuiz'); $('#quizFoot').hidden=false; renderQuiz();
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function renderQuiz(){
  const qs=QUIZZES[Q.cid], q=qs[Q.i], c=COURSES.find(x=>x.id===Q.cid);
  $('#quizTitle').textContent=`${c.name} · Quiz`;
  let body='';
  if(q.type==='mc') body=`<div class="q-opts">${q.opts.map((o,k)=>`<button class="q-opt ${Q.answers[Q.i]===k?'sel':''}" onclick="quizPick(${k})">${o}</button>`).join('')}</div>`;
  else if(q.type==='tf') body=`<div class="q-tf"><button class="q-opt ${Q.answers[Q.i]===true?'sel':''}" onclick="quizPick(true)">True</button><button class="q-opt ${Q.answers[Q.i]===false?'sel':''}" onclick="quizPick(false)">False</button></div>`;
  else if(q.type==='type') body=`<input class="q-input" id="qInput" placeholder="Type your answer…" value="${Q.answers[Q.i]?String(Q.answers[Q.i]).replace(/"/g,'&quot;'):''}" oninput="Q.answers[${Q.i}]=this.value" onkeydown="if(event.key==='Enter')quizNext()">`;
  else if(q.type==='order') body=`<div class="q-order" id="qOrder">${Q.answers[Q.i].map((it,k)=>`<div class="q-chip" draggable="true" ondragstart="qDrag(${k})" ondragover="event.preventDefault()" ondrop="qDrop(${k})"><span class="q-grip">⋮⋮</span><span class="q-it">${it}</span><span class="q-move"><button class="q-mv" ${k===0?'disabled':''} onclick="event.stopPropagation();qMove(${k},-1)" aria-label="Move up">▲</button><button class="q-mv" ${k===Q.answers[Q.i].length-1?'disabled':''} onclick="event.stopPropagation();qMove(${k},1)" aria-label="Move down">▼</button></span><span class="q-rank">${k+1}</span></div>`).join('')}</div><div class="q-hint">Drag or use ▲▼ to reorder · top = first</div>`;
  $('#quizBody').innerHTML=`
    <div class="q-prog"><div class="q-dots">${qs.map((_,k)=>`<i class="${k<Q.i?'done':k===Q.i?'on':''}"></i>`).join('')}</div><span class="mono">Q${Q.i+1} / ${qs.length}</span></div>
    <div class="q-type">${({mc:'CHOOSE ONE',tf:'TRUE OR FALSE',type:'TYPE YOUR ANSWER',order:'PUT IN ORDER'})[q.type]}</div>
    <h3 class="q-q">${q.q}</h3>${body}`;
  $('#quizNext').textContent = Q.i===qs.length-1 ? 'Submit quiz' : 'Next';
  $('#quizPrevBtn').style.visibility = Q.i===0 ? 'hidden' : 'visible';
}
function quizPick(v){ Q.answers[Q.i]=v; renderQuiz(); }
function qDrag(k){ Q.dragFrom=k; }
function qDrop(k){ const arr=Q.answers[Q.i]; const [m]=arr.splice(Q.dragFrom,1); arr.splice(k,0,m); renderQuiz(); }
function qMove(k,dir){ const arr=Q.answers[Q.i], j=k+dir; if(j<0||j>=arr.length) return; [arr[k],arr[j]]=[arr[j],arr[k]]; renderQuiz(); }
function quizNext(){
  const qs=QUIZZES[Q.cid], q=qs[Q.i];
  if(q.type==='type' && !($('#qInput').value||'').trim()){ $('#qInput').classList.add('err'); setTimeout(()=>{const e=$('#qInput'); e&&e.classList.remove('err');},500); return; }
  if((q.type==='mc'||q.type==='tf') && Q.answers[Q.i]===null){ toast('Pick an answer','Select an option to continue.'); return; }
  if(Q.i<qs.length-1){ Q.i++; renderQuiz(); } else gradeQuiz();
}
function quizPrev(){ if(Q.i>0){ Q.i--; renderQuiz(); } }
function isCorrect(q,ans){
  if(q.type==='mc'||q.type==='tf') return ans===q.a;
  if(q.type==='type') return q.a.includes(String(ans||'').trim().toLowerCase());
  if(q.type==='order') return JSON.stringify(ans)===JSON.stringify(q.a);
  return false;
}
function gradeQuiz(){
  const qs=QUIZZES[Q.cid];
  const correct=qs.reduce((n,q,i)=>n+(isCorrect(q,Q.answers[i])?1:0),0);
  const pct=correct/qs.length, pass=pct>=QUIZ_PASS, c=COURSES.find(x=>x.id===Q.cid);
  $('#quizBody').innerHTML=`
    <div class="q-result ${pass?'pass':'fail'}">
      <span class="qr-badge">${pass?svg('check'):svg('x2')}</span>
      <h3>${pass?'Passed!':'Not quite.'}</h3>
      <p class="qr-score">${correct} / ${qs.length} correct · ${Math.round(pct*100)}%</p>
      <p class="qr-sub">${pass?`You passed${c.id==='c1'?' and unlocked the Strategies track':''}.`:`You need ${Math.round(QUIZ_PASS*100)}% to pass. Review the lessons and try again. The questions reshuffle.`}</p>
      <div class="qr-grid">${qs.map((q,i)=>`<span class="qr-cell ${isCorrect(q,Q.answers[i])?'ok':'no'}">${i+1}</span>`).join('')}</div>
      <div class="qr-actions">${pass?`<button class="btn btn-orange" onclick="finishQuiz(true)">Continue</button>`:`<button class="btn btn-orange" onclick="startQuiz('${Q.cid}')">Try again</button><button class="btn btn-ghost" onclick="finishQuiz(false)">Back to lessons</button>`}</div>
    </div>`;
  $('#quizFoot').hidden=true;
}
function finishQuiz(pass){
  const cid=Q.cid, c=COURSES.find(x=>x.id===cid);
  closeModal('mQuiz');
  if(pass && !S.quizDone.has(cid)){ S.quizDone.add(cid); toast('Quiz passed', c.name, null, true); }
  renderLearn();
}

const ECO_TYPES={issuer:'Issuers',market:'Marketplaces',defi:'DeFi apps',protocol:'Protocols',service:'Service providers',tradfi:'TradFi'};
const ECO_ASSETS={treasuries:'Treasuries',credit:'Private credit',realestate:'Real estate',commodities:'Commodities',equities:'Equities',funds:'Funds',stablecoins:'Stablecoins'};
const ECO=[
 {id:'wally',name:'WALLY NFT',type:'hub',region:'INTL',assets:[],map:1,links:['real','credefi','raze','mu','jade','land','drvn','bigfoot','investready'],blurb:'The community hub coordinating the RWA economy.'},

 /* ===== ISSUERS ===== */
 {id:'ondo',name:'Ondo Finance',type:'issuer',region:'USA',assets:['treasuries','funds'],map:1,links:['chainlink','pendle','fireblocks','morpho','plume'],blurb:'Tokenized treasuries & yield funds (OUSG, USDY).'},
 {id:'franklin',name:'Franklin Templeton',type:'issuer',region:'USA',assets:['funds','treasuries'],map:1,links:['citi','chainlink'],blurb:'BENJI: a pioneering tokenized money-market fund.'},
 {id:'superstate',name:'Superstate',type:'issuer',region:'USA',assets:['treasuries','funds'],map:1,links:['chainlink','sky'],blurb:'Short-duration treasury & crypto carry funds.'},
 {id:'wisdomtree',name:'WisdomTree',type:'issuer',region:'USA',assets:['funds','treasuries'],map:1,links:['chainlink'],blurb:'WisdomTree Prime: tokenized funds for retail.'},
 {id:'openeden',name:'OpenEden',type:'issuer',region:'INTL',assets:['treasuries'],links:['fireblocks','chainlink'],blurb:'TBILL vault: tokenized T-bills, regulated.'},
 {id:'backed',name:'Backed',type:'issuer',region:'INTL',assets:['equities','funds'],map:1,links:['chainlink','mu','swarm'],blurb:'bTokens: tokenized stocks & ETFs onchain.'},
 {id:'matrixdock',name:'Matrixdock',type:'issuer',region:'INTL',assets:['treasuries','commodities'],links:['chainlink'],blurb:'STBT treasuries and XAUm tokenized gold.'},
 {id:'paxos',name:'Paxos',type:'issuer',region:'USA',assets:['commodities','stablecoins'],links:['fireblocks','anchorage'],blurb:'PAXG gold + regulated stablecoin rails.'},
 {id:'realt',name:'RealT',type:'issuer',region:'USA',assets:['realestate'],links:['provenance'],blurb:'Fractional US rentals, rent paid onchain.'},
 {id:'tangible',name:'Tangible',type:'issuer',region:'INTL',assets:['realestate','commodities'],links:['pendle'],blurb:'Real-asset tokens: property, gold, collectibles.'},
 {id:'dinari',name:'Dinari',type:'issuer',region:'USA',assets:['equities'],member:1,links:['securitize','chainlink'],blurb:'dShares: tokenized US equities for global access. RWA Foundation member.'},
 {id:'redswan',name:'RedSwan CRE',type:'issuer',region:'USA',assets:['realestate'],links:['inveniam'],blurb:'Tokenized commercial real-estate offerings.'},
 {id:'sqft',name:'SQFT',type:'issuer',region:'USA',assets:['realestate'],links:['tzero'],blurb:'Tokenized real-estate equity platform.'},
 {id:'ctrlalt',name:'Ctrl Alt',type:'issuer',region:'INTL',assets:['realestate','funds'],links:['tokeny'],blurb:'Tokenization infrastructure for alternative assets.'},
 {id:'steelwave',name:'SteelWave Digital',type:'issuer',region:'USA',assets:['realestate'],links:['inveniam'],blurb:'Institutional real-estate tokenization.'},
 {id:'diamondlake',name:'DiamondLake',type:'issuer',region:'USA',assets:['realestate'],links:['redswan'],blurb:'Real-asset & property tokenization issuer.'},
 {id:'brickken',name:'Brickken',type:'issuer',region:'INTL',assets:['equities','funds'],member:1,links:['tokeny','polymesh'],blurb:'Token issuance platform for businesses. RWA Foundation member.'},
 {id:'onre',name:'OnRe',type:'issuer',region:'INTL',assets:['funds'],member:1,links:['hamiltonlane'],blurb:'Tokenized reinsurance yield. RWA Foundation member.'},
 {id:'galaxytok',name:'Galaxy',type:'issuer',region:'USA',assets:['equities','funds'],links:['securitize'],blurb:'Digital-asset financial services & tokenization.'},
 {id:'hashnote',name:'Hashnote',type:'issuer',region:'USA',assets:['treasuries','funds'],map:1,links:['chainlink','sky','redstone'],blurb:'USYC: institutional tokenized money market.'},
 {id:'mountain',name:'Mountain Protocol',type:'issuer',region:'INTL',assets:['treasuries','stablecoins'],links:['chainlink'],blurb:'USDM: yield-bearing stablecoin.'},
 {id:'midas',name:'Midas',type:'issuer',region:'INTL',assets:['treasuries','funds'],links:['redstone','morpho'],blurb:'Permissionless tokenized yield instruments.'},
 {id:'libre',name:'Libre',type:'issuer',region:'INTL',assets:['funds','credit'],links:['polymesh'],blurb:'Tokenized hedge-fund & credit access.'},
 {id:'real',name:'Real Finance',type:'issuer',region:'INTL',assets:['treasuries'],member:1,map:1,links:['fireblocks','wally','chainlink'],blurb:'Tokenized treasury products. RWA Foundation member.'},
 {id:'jade',name:'Jade City',type:'issuer',region:'INTL',assets:['commodities'],links:['mu','wally'],blurb:'Tokenized jade & commodity vaults.'},

 /* ===== MARKETPLACES ===== */
 {id:'securitize',name:'Securitize',type:'market',region:'USA',assets:['funds','treasuries','equities'],member:1,map:1,links:['investready','chainalysis','fireblocks','apollo','blackrock','redstone'],blurb:'Issuance, transfer agency & a regulated ATS. RWA Foundation member.'},
 {id:'inx',name:'INX',type:'market',region:'USA',assets:['equities'],links:['chainalysis'],blurb:'Regulated trading venue for digital securities.'},
 {id:'tzero',name:'tZERO',type:'market',region:'USA',assets:['equities'],map:1,links:['anchorage'],blurb:'SEC-regulated ATS for tokenized securities.'},
 {id:'swarm',name:'Swarm Markets',type:'market',region:'INTL',assets:['equities','treasuries'],links:['backed'],blurb:'BaFin-licensed DeFi marketplace.'},
 {id:'rwaio',name:'RWA.io',type:'market',region:'INTL',assets:['funds'],links:['rwaworld'],blurb:'Data, directory & launchpad for the RWA market.'},
 {id:'prometheum',name:'Prometheum',type:'market',region:'USA',assets:['equities'],map:1,links:['dtcc'],blurb:'Special-purpose broker-dealer for digital securities.'},
 {id:'rialto',name:'Rialto Markets',type:'market',region:'USA',assets:['equities','funds'],links:['fairmint'],blurb:'Primary issuance & secondary ATS.'},
 {id:'apexinvest',name:'ApexInvest',type:'market',region:'INTL',assets:['funds'],links:['dtcc'],blurb:'Marketplace connecting issuers and investors.'},
 {id:'fairmint',name:'Fairmint',type:'market',region:'USA',assets:['equities'],links:['rialto'],blurb:'Onchain cap-table & private securities.'},
 {id:'obligate',name:'Obligate',type:'market',region:'INTL',assets:['credit'],links:['polymesh'],blurb:'Onchain bonds & regulated debt issuance.'},
 {id:'land',name:'landinvest.io',type:'market',region:'INTL',assets:['realestate'],map:1,links:['investready','wally'],blurb:'Marketplace for fractional land & property.'},

 /* ===== DEFI ===== */
 {id:'centrifuge',name:'Centrifuge',type:'defi',region:'INTL',assets:['credit','funds'],map:1,links:['morpho','chainlink','sky','untangled'],blurb:'Onchain securitization: real world credit pools.'},
 {id:'maple',name:'Maple Finance',type:'defi',region:'INTL',assets:['credit','treasuries'],member:1,map:1,links:['spark','apollo','redstone'],blurb:'Institutional credit & cash-management pools. RWA Foundation member.'},
 {id:'goldfinch',name:'Goldfinch',type:'defi',region:'USA',assets:['credit'],links:['chainlink'],blurb:'Private-credit lending to real businesses.'},
 {id:'clearpool',name:'Clearpool',type:'defi',region:'INTL',assets:['credit'],links:['redstone'],blurb:'Permissionless institutional credit markets.'},
 {id:'morpho',name:'Morpho',type:'defi',region:'INTL',assets:['credit','treasuries'],map:1,links:['centrifuge','ondo','midas','gauntlet'],blurb:'Lending infrastructure where RWA collateral plugs in.'},
 {id:'pendle',name:'Pendle',type:'defi',region:'INTL',assets:['treasuries','funds'],map:1,links:['ondo','usual','redstone'],blurb:'Trade & fix RWA yields: PT/YT splitting.'},
 {id:'spark',name:'Spark',type:'defi',region:'INTL',assets:['treasuries','credit'],links:['maple','sky'],blurb:'Routes stablecoin liquidity into treasuries & credit.'},
 {id:'gauntlet',name:'Gauntlet',type:'defi',region:'USA',assets:['credit','treasuries'],links:['morpho','aave'],blurb:'Risk curation & vault management for DeFi.'},
 {id:'axis',name:'Axis',type:'defi',region:'INTL',assets:['stablecoins','credit'],links:['chainlink'],blurb:'Stablecoin & DeFi yield infrastructure.'},
 {id:'sky',name:'Sky (Maker)',type:'defi',region:'INTL',assets:['treasuries','stablecoins'],map:1,links:['spark','superstate','centrifuge','hashnote'],blurb:'Stablecoin protocol with large RWA collateral.'},
 {id:'aave',name:'Aave Horizon',type:'defi',region:'INTL',assets:['treasuries','credit'],links:['gauntlet','chainlink'],blurb:'RWA-focused institutional lending markets.'},
 {id:'usual',name:'Usual',type:'defi',region:'INTL',assets:['treasuries','stablecoins'],links:['pendle','hashnote'],blurb:'RWA-backed stablecoin protocol.'},
 {id:'untangled',name:'Untangled',type:'defi',region:'INTL',assets:['credit'],links:['centrifuge'],blurb:'Tokenized trade-finance & credit pools.'},
 {id:'credefi',name:'Credefi',type:'defi',region:'INTL',assets:['credit'],member:1,map:1,links:['chainlink','wally'],blurb:'EU SME credit pools, onchain. RWA Foundation member.'},
 {id:'raze',name:'Raze',type:'defi',region:'INTL',assets:['treasuries','funds'],links:['ondo','wally'],blurb:'RWA index & yield strategies.'},
 {id:'mu',name:'Mu Digital',type:'defi',region:'INTL',assets:['equities','commodities'],member:1,links:['backed','jade','wally'],blurb:'DEX liquidity for RWA pairs. RWA Foundation member.'},

 /* ===== PROTOCOLS / CHAINS ===== */
 {id:'chainlink',name:'Chainlink',type:'protocol',region:'USA',assets:[],map:1,links:['ondo','backed','superstate','credefi','centrifuge','franklin','wisdomtree'],blurb:'Oracles, proof-of-reserve & CCIP: the data layer for RWAs.'},
 {id:'redstone',name:'RedStone',type:'protocol',region:'INTL',assets:[],map:1,links:['morpho','maple','pendle','blackrock','apollo','securitize','hashnote'],blurb:'Modular oracles & price feeds for RWAs, powering tokenized products from BlackRock, Apollo & Securitize.'},
 {id:'pyth',name:'Pyth',type:'protocol',region:'INTL',assets:[],links:['aave'],blurb:'Low-latency market data for tokenized assets.'},
 {id:'canton',name:'Canton Network',type:'protocol',region:'USA',assets:[],map:1,links:['dtcc','goldman','digitalasset'],blurb:'Privacy-enabled chain for institutional assets.'},
 {id:'plume',name:'Plume',type:'protocol',region:'USA',assets:[],member:1,map:1,links:['ondo','nest'],blurb:'A chain purpose-built for RWA issuance & compliance. RWA Foundation member.'},
 {id:'polymesh',name:'Polymesh',type:'protocol',region:'INTL',assets:['equities'],links:['brickken','libre','obligate'],blurb:'Institutional chain for regulated securities.'},
 {id:'provenance',name:'Provenance',type:'protocol',region:'USA',assets:['credit','funds'],links:['figure','realt'],blurb:'Chain powering HELOCs, funds & loan markets.'},
 {id:'mantra',name:'MANTRA',type:'protocol',region:'INTL',assets:[],links:['google'],blurb:'RWA-focused L1 with compliance tooling.'},
 {id:'matterlabs',name:'Matter Labs (zkSync)',type:'protocol',region:'INTL',assets:[],links:['tradable'],blurb:'ZK rollup powering institutional privacy.'},
 {id:'aleo',name:'Aleo',type:'protocol',region:'USA',assets:[],links:['canton'],blurb:'Zero-knowledge L1 for private compliance.'},
 {id:'digitalasset',name:'Digital Asset',type:'protocol',region:'USA',assets:[],links:['canton','goldman'],blurb:'Builders of Canton & Daml smart contracts.'},
 {id:'noble',name:'Noble',type:'protocol',region:'INTL',assets:['stablecoins','treasuries'],links:['ondo'],blurb:'Native asset issuance chain (Cosmos).'},
 {id:'redbelly',name:'Redbelly',type:'protocol',region:'INTL',assets:[],links:['zoniqx'],blurb:'Compliance-native chain for RWAs.'},
 {id:'nest',name:'Nest (Plume)',type:'protocol',region:'USA',assets:['treasuries','credit'],links:['plume'],blurb:'Yield vaults native to the Plume RWA chain.'},

 /* ===== SERVICE PROVIDERS ===== */
 {id:'fireblocks',name:'Fireblocks',type:'service',region:'USA',assets:[],map:1,links:['ondo','paxos','openeden','securitize','real','taurus'],blurb:'Custody & wallet infrastructure for institutions.'},
 {id:'anchorage',name:'Anchorage Digital',type:'service',region:'USA',assets:[],map:1,links:['paxos','tzero'],blurb:'Federally chartered crypto bank & custodian.'},
 {id:'chainalysis',name:'Chainalysis',type:'service',region:'USA',assets:[],links:['securitize','inx'],blurb:'Compliance & onchain intelligence.'},
 {id:'investready',name:'InvestReady',type:'service',region:'USA',assets:[],member:1,map:1,links:['securitize','land','wally'],blurb:'Accredited-investor verification: the AccrediToken. RWA Foundation member.'},
 {id:'tokeny',name:'Tokeny',type:'service',region:'INTL',assets:['equities','funds'],links:['ctrlalt','brickken'],blurb:'ERC-3643 compliant tokenization suite.'},
 {id:'rwaworld',name:'RWA.World',type:'service',region:'USA',assets:[],links:['rwaio'],blurb:'Research, media & data hub for the RWA industry.'},
 {id:'dtcc',name:'DTCC',type:'service',region:'USA',assets:[],map:1,links:['prometheum','canton','apexinvest'],blurb:'Post-trade market infrastructure going onchain.'},
 {id:'broadridge',name:'Broadridge',type:'service',region:'USA',assets:[],links:['falconx'],blurb:'Tokenized repo & collateral infrastructure.'},
 {id:'ownera',name:'Ownera',type:'service',region:'INTL',assets:[],links:['dtcc'],blurb:'FinP2P: interoperability routing for RWAs.'},
 {id:'blockaid',name:'Blockaid',type:'service',region:'USA',assets:[],links:['fireblocks'],blurb:'Onchain security & transaction screening.'},
 {id:'inveniam',name:'Inveniam',type:'service',region:'USA',assets:[],links:['redswan','steelwave'],blurb:'Data & valuation infrastructure for private assets.'},
 {id:'bloomberg',name:'Bloomberg',type:'service',region:'USA',assets:[],links:['inveniam'],blurb:'Market data & pricing for tokenized assets.'},
 {id:'opacity',name:'Opacity',type:'service',region:'USA',assets:[],links:['aleo'],blurb:'Privacy & verifiable-compute infrastructure.'},
 {id:'parc',name:'PARC-3643',type:'service',region:'INTL',assets:[],links:['tokeny'],blurb:'Compliance tooling for permissioned tokens.'},
 {id:'taurus',name:'Taurus',type:'service',region:'INTL',assets:[],links:['fireblocks'],blurb:'Custody & tokenization for banks.'},
 {id:'zoniqx',name:'Zoniqx',type:'service',region:'USA',assets:['equities','funds'],links:['redbelly'],blurb:'Tokenization middleware & standards.'},
 {id:'tradable',name:'Tradable',type:'service',region:'INTL',assets:['credit'],links:['matterlabs'],blurb:'Private-credit tokenization on zkSync.'},
 {id:'google',name:'Google Cloud',type:'service',region:'USA',assets:[],links:['mantra'],blurb:'Cloud & node infrastructure for RWA chains.'},
 {id:'drvn',name:'DRVN Labo',type:'service',region:'INTL',assets:[],member:1,links:['wally','bigfoot'],blurb:'Product & venture studio for RWA builders. RWA Foundation member.'},
 {id:'bigfoot',name:'Bigfoot 404',type:'service',region:'INTL',assets:[],links:['wally','drvn'],blurb:'Smart-contract engineering for RWAs.'},

 /* ===== TRADFI ===== */
 {id:'blackrock',name:'BlackRock',type:'tradfi',region:'USA',assets:['funds','treasuries'],map:1,links:['securitize','redstone'],blurb:'BUIDL: the largest tokenized treasury fund.'},
 {id:'apollo',name:'Apollo Global',type:'tradfi',region:'USA',assets:['credit','funds'],map:1,links:['securitize','maple','redstone'],blurb:'ACRED: tokenized private credit at scale.'},
 {id:'franklintf',name:'Franklin (TradFi)',type:'tradfi',region:'USA',assets:['funds'],links:['franklin'],blurb:'Asset-management parent behind BENJI.'},
 {id:'citi',name:'Citi',type:'tradfi',region:'USA',assets:['treasuries','funds'],map:1,links:['franklin'],blurb:'Citi Token Services: digital cash & trade.'},
 {id:'jpmorgan',name:'J.P. Morgan (Kinexys)',type:'tradfi',region:'USA',assets:['treasuries','funds'],map:1,links:['canton'],blurb:'Onchain deposits & collateral settlement.'},
 {id:'goldman',name:'Goldman Sachs',type:'tradfi',region:'USA',assets:['funds','treasuries'],map:1,links:['canton','digitalasset'],blurb:'GS DAP digital-asset issuance platform.'},
 {id:'hamiltonlane',name:'Hamilton Lane',type:'tradfi',region:'USA',assets:['funds','credit'],map:1,links:['securitize','onre'],blurb:'Tokenized private-markets fund access.'},
 {id:'invesco',name:'Invesco',type:'tradfi',region:'USA',assets:['funds'],links:['securitize'],blurb:'Exploring onchain asset management.'},
 {id:'fidelity',name:'Fidelity Digital Assets',type:'tradfi',region:'USA',assets:['funds','treasuries'],links:['chainlink'],blurb:'Institutional custody & tokenized funds.'},
 {id:'northerntrust',name:'Northern Trust',type:'tradfi',region:'USA',assets:['funds'],links:['ownera'],blurb:'Institutional infrastructure & advocacy.'},
 {id:'ripple',name:'Ripple',type:'tradfi',region:'USA',assets:['stablecoins','treasuries'],links:['openeden'],blurb:'RLUSD stablecoin & institutional payments.'},
 {id:'tassat',name:'Tassat',type:'tradfi',region:'USA',assets:['stablecoins'],links:['broadridge'],blurb:'B2B onchain settlement networks for banks.'},
 {id:'eyparthenon',name:'EY-Parthenon',type:'tradfi',region:'USA',assets:[],links:['securitize'],blurb:'Advisory for institutional tokenization strategy.'},
 {id:'falconx',name:'FalconX',type:'tradfi',region:'USA',assets:['credit'],links:['broadridge'],blurb:'Prime brokerage & tokenized repo trading.'},
 {id:'newton',name:'Newton',type:'tradfi',region:'USA',assets:[],links:['gauntlet'],blurb:'Institutional digital-asset infrastructure.'},
 {id:'tether',name:'Tether',type:'tradfi',region:'INTL',assets:['stablecoins','commodities'],links:['paxos'],blurb:'USDT issuer; XAUT tokenized gold.'},
 {id:'circle',name:'Circle',type:'tradfi',region:'USA',assets:['stablecoins'],map:1,links:['fireblocks','noble'],blurb:'USDC issuer & onchain settlement.'},
 {id:'visa',name:'Visa',type:'tradfi',region:'USA',assets:['stablecoins'],links:['circle'],blurb:'Stablecoin settlement pilots at scale.'},
 {id:'janus',name:'Janus Henderson',type:'tradfi',region:'USA',assets:['funds','treasuries'],links:['anemoy'],blurb:'Manager behind tokenized treasury fund (Anemoy).'},
 {id:'vaneck',name:'VanEck',type:'tradfi',region:'USA',assets:['funds','treasuries'],links:['securitize'],blurb:'Tokenized treasury fund (VBILL).'},
 {id:'kkr',name:'KKR',type:'tradfi',region:'USA',assets:['funds','credit'],links:['securitize'],blurb:'Tokenized private-equity fund access.'},
 {id:'wellington',name:'Wellington',type:'tradfi',region:'USA',assets:['funds'],links:['securitize'],blurb:'Tokenized fund collaborations.'},
 {id:'anemoy',name:'Anemoy',type:'issuer',region:'INTL',assets:['treasuries','funds'],links:['centrifuge','janus'],blurb:'Onchain treasury fund built on Centrifuge.'},
 {id:'figure',name:'Figure',type:'issuer',region:'USA',assets:['credit','realestate'],map:1,links:['provenance'],blurb:'Onchain HELOCs & private credit at scale.'},
 {id:'solana',name:'Solana',type:'protocol',region:'INTL',assets:[],member:1,links:['wally','orca','etherfuse'],blurb:'High-throughput L1 for tokenized assets. RWA Foundation member.'},
 {id:'stellar',name:'Stellar',type:'protocol',region:'USA',assets:[],member:1,links:['wally','circle'],blurb:'Payments-focused L1 for stablecoins & funds. RWA Foundation member.'},
 {id:'avalanche',name:'Avalanche',type:'protocol',region:'USA',assets:[],member:1,links:['wally','kkr'],blurb:'L1 with custom subnets for institutional RWAs. RWA Foundation member.'},
 {id:'prestocks',name:'Prestocks',type:'issuer',region:'INTL',assets:['equities'],member:1,links:['wally','dinari'],blurb:'Tokenized pre-IPO & public equities. RWA Foundation member.'},
 {id:'etherfuse',name:'Etherfuse',type:'issuer',region:'INTL',assets:['treasuries'],member:1,links:['wally','solana'],blurb:'Tokenized government bonds (Stablebonds). RWA Foundation member.'},
 {id:'ixswap',name:'IX Swap',type:'defi',region:'INTL',assets:['equities','funds'],member:1,links:['wally','tzero'],blurb:'AMM & liquidity for tokenized securities. RWA Foundation member.'},
 {id:'orca',name:'Orca',type:'defi',region:'INTL',assets:[],member:1,links:['wally','solana'],blurb:'Onchain DEX & liquidity on Solana. RWA Foundation member.'},
];
/* enrichment: key facts surfaced in the detail card. {flagship, chains[], stat:{label,value}, founded} */
const ECO_META={
 wally:{flagship:'WALLY Points → $WALLY',chains:['Ethereum','Base'],stat:{label:'Community',value:'18.4K+ Herd'},founded:'2024'},
 // issuers
 ondo:{flagship:'OUSG · USDY',chains:['Ethereum','Solana','Mantle'],stat:{label:'Onchain AUM',value:'~$1.4B'},founded:'2021'},
 franklin:{flagship:'BENJI (FOBXX)',chains:['Stellar','Polygon','Base'],stat:{label:'Fund AUM',value:'~$700M'},founded:'1947'},
 superstate:{flagship:'USTB · USCC',chains:['Ethereum','Solana'],stat:{label:'AUM',value:'~$700M'},founded:'2023'},
 wisdomtree:{flagship:'WisdomTree Prime',chains:['Ethereum','Stellar'],stat:{label:'Tokenized funds',value:'13+'},founded:'1985'},
 openeden:{flagship:'TBILL · USDO',chains:['Ethereum','Arbitrum'],stat:{label:'TVL',value:'~$300M'},founded:'2022'},
 backed:{flagship:'bIB01 · bCSPX',chains:['Ethereum','Gnosis','Base'],stat:{label:'Tracked assets',value:'30+ stocks/ETFs'},founded:'2021'},
 matrixdock:{flagship:'STBT · XAUm',chains:['Ethereum'],stat:{label:'Products',value:'T-bills + gold'},founded:'2023'},
 paxos:{flagship:'PAXG · USDP · USDG',chains:['Ethereum','Solana'],stat:{label:'PAXG backing',value:'LBMA gold'},founded:'2012'},
 realt:{flagship:'RealTokens',chains:['Gnosis','Ethereum'],stat:{label:'Properties',value:'970+ homes'},founded:'2019'},
 tangible:{flagship:'Real USD (USDR)',chains:['Polygon'],stat:{label:'Backing',value:'Property + gold'},founded:'2021'},
 dinari:{flagship:'dShares',chains:['Ethereum','Base','Arbitrum'],stat:{label:'Tokenized stocks',value:'100+'},founded:'2021'},
 redswan:{flagship:'CRE tokens',chains:['Ethereum'],stat:{label:'Pipeline',value:'$4B+ CRE'},founded:'2018'},
 sqft:{flagship:'SQFT',chains:['Ethereum'],stat:{label:'Focus',value:'Real-estate equity'},founded:'2021'},
 ctrlalt:{flagship:'Tokenized alts',chains:['Polygon'],stat:{label:'Region',value:'MENA + UK'},founded:'2021'},
 steelwave:{flagship:'SteelWave Digital',chains:['Ethereum'],stat:{label:'Focus',value:'Institutional CRE'},founded:'1981'},
 diamondlake:{flagship:'Property tokens',chains:['Ethereum'],stat:{label:'Focus',value:'Real assets'},founded:'2021'},
 brickken:{flagship:'Token Suite',chains:['Polygon','Ethereum','BNB'],stat:{label:'Issued',value:'$300M+ assets'},founded:'2021'},
 onre:{flagship:'ONyc reinsurance',chains:['Ethereum'],stat:{label:'Yield source',value:'Reinsurance'},founded:'2023'},
 galaxytok:{flagship:'Galaxy tokenization',chains:['Ethereum'],stat:{label:'Parent',value:'Galaxy Digital'},founded:'2018'},
 hashnote:{flagship:'USYC',chains:['Ethereum','Canton'],stat:{label:'TVL',value:'~$1.5B'},founded:'2022'},
 mountain:{flagship:'USDM',chains:['Ethereum','Base','Arbitrum'],stat:{label:'Yield',value:'T-bill backed'},founded:'2023'},
 midas:{flagship:'mTBILL · mBASIS',chains:['Ethereum'],stat:{label:'Model',value:'Permissionless'},founded:'2023'},
 libre:{flagship:'Libre funds',chains:['Polygon','Aptos'],stat:{label:'Partners',value:'BlackRock, Hamilton Lane'},founded:'2023'},
 anemoy:{flagship:'Anemoy LTF',chains:['Centrifuge'],stat:{label:'Backed by',value:'Janus Henderson'},founded:'2023'},
 figure:{flagship:'Figure Markets',chains:['Provenance'],stat:{label:'Originated',value:'$11B+ loans'},founded:'2018'},
 real:{flagship:'Real treasury vaults',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 jade:{flagship:'Jade-backed tokens',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2023'},
 // marketplaces
 securitize:{flagship:'BUIDL · ACRED transfer agent',chains:['Ethereum','Solana','Avalanche','Polygon'],stat:{label:'Tokenized',value:'$4B+ issued'},founded:'2017'},
 inx:{flagship:'INX One',chains:['Ethereum'],stat:{label:'Status',value:'SEC-registered'},founded:'2017'},
 tzero:{flagship:'tZERO ATS',chains:['Ethereum'],stat:{label:'Type',value:'Regulated ATS'},founded:'2018'},
 swarm:{flagship:'Swarm dStocks',chains:['Polygon'],stat:{label:'Regulator',value:'BaFin'},founded:'2017'},
 rwaio:{flagship:'RWA.io platform',chains:['Multi-chain'],stat:{label:'Role',value:'Data + launchpad'},founded:'2023'},
 prometheum:{flagship:'Prometheum ATS',chains:['Ethereum'],stat:{label:'License',value:'SPBD / ATS'},founded:'2017'},
 rialto:{flagship:'Rialto ATS',chains:['Ethereum'],stat:{label:'Type',value:'Primary + ATS'},founded:'2018'},
 apexinvest:{flagship:'ApexInvest',chains:['Multi-chain'],stat:{label:'Role',value:'Issuer ↔ investor'},founded:'2021'},
 fairmint:{flagship:'Open Cap Table',chains:['Ethereum'],stat:{label:'Focus',value:'Onchain equity'},founded:'2019'},
 obligate:{flagship:'Onchain bonds',chains:['Polygon','Base'],stat:{label:'Instrument',value:'eNotes / bonds'},founded:'2022'},
 land:{flagship:'landinvest marketplace',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 // defi
 centrifuge:{flagship:'Centrifuge Pools',chains:['Ethereum','Centrifuge','Base'],stat:{label:'Financed',value:'$600M+ credit'},founded:'2017'},
 maple:{flagship:'Maple · syrupUSDC',chains:['Ethereum','Solana','Base'],stat:{label:'TVL',value:'~$2B'},founded:'2019'},
 goldfinch:{flagship:'Goldfinch Prime',chains:['Ethereum'],stat:{label:'Originated',value:'$100M+'},founded:'2020'},
 clearpool:{flagship:'Clearpool · Ozean',chains:['Ethereum','Base','Arbitrum'],stat:{label:'Originated',value:'$700M+'},founded:'2021'},
 morpho:{flagship:'Morpho Blue',chains:['Ethereum','Base'],stat:{label:'TVL',value:'~$6B'},founded:'2021'},
 pendle:{flagship:'Pendle PT/YT',chains:['Ethereum','Arbitrum','Mantle'],stat:{label:'TVL',value:'~$4B'},founded:'2021'},
 spark:{flagship:'Spark · SparkLend',chains:['Ethereum','Gnosis'],stat:{label:'Deployed to RWA',value:'$2B+'},founded:'2023'},
 gauntlet:{flagship:'Risk curation',chains:['Multi-chain'],stat:{label:'Assets advised',value:'$35B+'},founded:'2018'},
 axis:{flagship:'Axis yield',chains:['Ethereum'],stat:{label:'Focus',value:'Stablecoin yield'},founded:'2023'},
 sky:{flagship:'USDS · sUSDS',chains:['Ethereum','Solana'],stat:{label:'RWA collateral',value:'$2B+'},founded:'2014'},
 aave:{flagship:'Aave Horizon',chains:['Ethereum'],stat:{label:'Protocol TVL',value:'$20B+'},founded:'2017'},
 usual:{flagship:'USD0 · USD0++',chains:['Ethereum','Arbitrum'],stat:{label:'TVL',value:'~$700M'},founded:'2023'},
 untangled:{flagship:'Untangled pools',chains:['Celo','Ethereum'],stat:{label:'Focus',value:'Trade finance'},founded:'2020'},
 credefi:{flagship:'Credefi · CREDI',chains:['Ethereum','Polygon'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2021'},
 raze:{flagship:'Raze index',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 mu:{flagship:'Mu DEX',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 // protocols / chains
 chainlink:{flagship:'Price Feeds · CCIP · PoR',chains:['Multi-chain'],stat:{label:'Secured value',value:'$20T+ enabled'},founded:'2017'},
 redstone:{flagship:'Push · Pull oracles',chains:['Multi-chain (70+)'],stat:{label:'Feeds',value:'1,200+'},founded:'2020'},
 pyth:{flagship:'Pyth price feeds',chains:['Multi-chain (90+)'],stat:{label:'Feeds',value:'500+'},founded:'2021'},
 canton:{flagship:'Canton Network',chains:['Canton'],stat:{label:'Backers',value:'30+ institutions'},founded:'2023'},
 plume:{flagship:'Plume L1',chains:['Plume'],stat:{label:'Ecosystem',value:'180+ projects'},founded:'2024'},
 polymesh:{flagship:'Polymesh',chains:['Polymesh'],stat:{label:'Standard',value:'Security tokens'},founded:'2019'},
 provenance:{flagship:'Provenance Blockchain',chains:['Provenance'],stat:{label:'Onchain value',value:'$15B+'},founded:'2018'},
 mantra:{flagship:'MANTRA Chain (OM)',chains:['MANTRA'],stat:{label:'Focus',value:'Regulated RWAs'},founded:'2020'},
 matterlabs:{flagship:'zkSync Era',chains:['zkSync'],stat:{label:'Tech',value:'ZK rollup'},founded:'2019'},
 aleo:{flagship:'Aleo L1',chains:['Aleo'],stat:{label:'Tech',value:'Zero-knowledge'},founded:'2019'},
 digitalasset:{flagship:'Daml · Canton',chains:['Canton'],stat:{label:'Role',value:'Canton builder'},founded:'2014'},
 noble:{flagship:'Noble (Cosmos)',chains:['Cosmos'],stat:{label:'Role',value:'Native asset issuance'},founded:'2022'},
 redbelly:{flagship:'Redbelly Network',chains:['Redbelly'],stat:{label:'Focus',value:'Compliant RWAs'},founded:'2018'},
 nest:{flagship:'Nest vaults',chains:['Plume'],stat:{label:'Role',value:'Plume-native yield'},founded:'2024'},
 // services
 fireblocks:{flagship:'Fireblocks Network',chains:['Multi-chain'],stat:{label:'Settled',value:'$7T+'},founded:'2018'},
 anchorage:{flagship:'Anchorage Digital Bank',chains:['Multi-chain'],stat:{label:'Charter',value:'OCC national trust'},founded:'2017'},
 chainalysis:{flagship:'KYT · Reactor',chains:['Multi-chain'],stat:{label:'Coverage',value:'25+ chains'},founded:'2014'},
 investready:{flagship:'AccrediToken',chains:['Ethereum'],stat:{label:'Role',value:'Accreditation'},founded:'2015'},
 tokeny:{flagship:'T-REX (ERC-3643)',chains:['Ethereum','Polygon'],stat:{label:'Issued',value:'$28B+ tokenized'},founded:'2017'},
 rwaworld:{flagship:'RWA.World hub',chains:['Multi-chain'],stat:{label:'Role',value:'Media + data'},founded:'2023'},
 dtcc:{flagship:'DTCC Digital',chains:['Multi-chain'],stat:{label:'Settles',value:'$3Q+/yr legacy'},founded:'1973'},
 broadridge:{flagship:'DLR repo platform',chains:['Ethereum (private)'],stat:{label:'Repo volume',value:'$1T+/mo'},founded:'2007'},
 ownera:{flagship:'FinP2P',chains:['Multi-chain'],stat:{label:'Role',value:'Interop routing'},founded:'2020'},
 blockaid:{flagship:'Blockaid security',chains:['Multi-chain'],stat:{label:'Role',value:'Tx screening'},founded:'2022'},
 inveniam:{flagship:'Inveniam data',chains:['Multi-chain'],stat:{label:'Role',value:'Private-asset data'},founded:'2017'},
 bloomberg:{flagship:'BVAL · pricing',chains:['Multi-chain'],stat:{label:'Role',value:'Market data'},founded:'1981'},
 opacity:{flagship:'Opacity zkTLS',chains:['Multi-chain'],stat:{label:'Tech',value:'Verifiable compute'},founded:'2023'},
 parc:{flagship:'PARC-3643 tooling',chains:['Ethereum'],stat:{label:'Standard',value:'ERC-3643'},founded:'2022'},
 taurus:{flagship:'Taurus-CAPITAL',chains:['Multi-chain'],stat:{label:'Clients',value:'Banks'},founded:'2018'},
 zoniqx:{flagship:'TALM / DyCIST',chains:['Multi-chain'],stat:{label:'Role',value:'Middleware'},founded:'2017'},
 tradable:{flagship:'Tradable credit',chains:['zkSync'],stat:{label:'Onchain',value:'$2B+ private credit'},founded:'2023'},
 google:{flagship:'Google Cloud',chains:['Multi-chain'],stat:{label:'Role',value:'Node infra'},founded:'1998'},
 drvn:{flagship:'DRVN studio',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 bigfoot:{flagship:'Bigfoot engineering',chains:['Ethereum'],stat:{label:'Status',value:'RWA Foundation member'},founded:'2024'},
 // tradfi
 blackrock:{flagship:'BUIDL',chains:['Ethereum','Solana','Avalanche','Polygon'],stat:{label:'Fund AUM',value:'$2.5B+'},founded:'1988'},
 apollo:{flagship:'ACRED',chains:['Ethereum','Solana','Aptos'],stat:{label:'Firm AUM',value:'$700B+'},founded:'1990'},
 franklintf:{flagship:'Franklin Resources',chains:['Multi-chain'],stat:{label:'Firm AUM',value:'$1.5T+'},founded:'1947'},
 citi:{flagship:'Citi Token Services',chains:['Ethereum (private)'],stat:{label:'Pilots',value:'Cash + trade'},founded:'1812'},
 jpmorgan:{flagship:'Kinexys (Onyx)',chains:['Ethereum (private)'],stat:{label:'Daily volume',value:'$2B+'},founded:'1799'},
 goldman:{flagship:'GS DAP',chains:['Canton'],stat:{label:'Issued',value:'Bonds onchain'},founded:'1869'},
 hamiltonlane:{flagship:'SCOPE · tokenized funds',chains:['Polygon','Solana'],stat:{label:'Firm AUM',value:'$900B+'},founded:'1991'},
 invesco:{flagship:'Invesco tokenization',chains:['Multi-chain'],stat:{label:'Firm AUM',value:'$1.8T+'},founded:'1935'},
 fidelity:{flagship:'Fidelity Digital Assets',chains:['Ethereum'],stat:{label:'Filing',value:'Tokenized MMF'},founded:'1946'},
 northerntrust:{flagship:'Matrix / Zodia',chains:['Multi-chain'],stat:{label:'AUC',value:'$15T+'},founded:'1889'},
 ripple:{flagship:'RLUSD',chains:['XRPL','Ethereum'],stat:{label:'Stablecoin',value:'Regulated'},founded:'2012'},
 tassat:{flagship:'TassatPay',chains:['Ethereum (private)'],stat:{label:'Role',value:'Bank B2B rails'},founded:'2018'},
 eyparthenon:{flagship:'EY-Parthenon',chains:['Multi-chain'],stat:{label:'Role',value:'Strategy advisory'},founded:'1989'},
 falconx:{flagship:'FalconX prime',chains:['Multi-chain'],stat:{label:'Traded',value:'$1.5T+'},founded:'2018'},
 newton:{flagship:'Newton infra',chains:['Multi-chain'],stat:{label:'Role',value:'Institutional infra'},founded:'2018'},
 tether:{flagship:'USDT · XAUT',chains:['Multi-chain (15+)'],stat:{label:'USDT supply',value:'$140B+'},founded:'2014'},
 circle:{flagship:'USDC · EURC',chains:['Multi-chain (20+)'],stat:{label:'USDC supply',value:'$60B+'},founded:'2013'},
 visa:{flagship:'Visa stablecoin settlement',chains:['Ethereum','Solana'],stat:{label:'Settled',value:'$200M+ USDC'},founded:'1958'},
 janus:{flagship:'Anemoy LTF',chains:['Centrifuge'],stat:{label:'Firm AUM',value:'$350B+'},founded:'1969'},
 vaneck:{flagship:'VBILL',chains:['Ethereum','Solana','Avalanche'],stat:{label:'Firm AUM',value:'$100B+'},founded:'1955'},
 kkr:{flagship:'KKR Health Care fund (tokenized)',chains:['Avalanche'],stat:{label:'Firm AUM',value:'$600B+'},founded:'1976'},
 wellington:{flagship:'Wellington tokenized funds',chains:['Multi-chain'],stat:{label:'Firm AUM',value:'$1.2T+'},founded:'1928'},
};

/* Native-token + supported-stablecoin layer. Owner-set for RWA Foundation
   members; public info for well-known projects. Entries left blank on purpose
   are meant to be filled in via the ecosystem intake form. Merged into
   ECO_META so detail cards can render the Token / Stablecoins rows. */
const ECO_TOKENS={
  // RWA Foundation members
  wally:{token:'$WALLY (at TGE)',stables:['USDC','USDT']},
  real:{token:'None yet',stables:['USDC','USDT']},
  jade:{token:'JADE',stables:['USDC']},
  land:{token:'None yet',stables:['USDC','USDT']},
  credefi:{token:'CREDI',stables:['USDC','USDT']},
  raze:{token:'RAZE',stables:['USDC']},
  mu:{token:'MU',stables:['USDC','USDT']},
  drvn:{token:'None yet',stables:['USDC']},
  bigfoot:{token:'None yet',stables:['USDC']},
  // Established projects — public info
  chainlink:{token:'LINK'},
  ondo:{token:'ONDO',stables:['USDC']},
  pendle:{token:'PENDLE',stables:['USDC']},
  centrifuge:{token:'CFG',stables:['USDC']},
  morpho:{token:'MORPHO',stables:['USDC']},
  maple:{token:'SYRUP',stables:['USDC','USDT']},
  goldfinch:{token:'GFI',stables:['USDC']},
  clearpool:{token:'CPOOL',stables:['USDC','USDT']},
  sky:{token:'SKY',stables:['USDS','DAI']},
  aave:{token:'AAVE',stables:['GHO','USDC']},
  usual:{token:'USUAL',stables:['USD0']},
  spark:{stables:['USDS','DAI']},
  plume:{token:'PLUME'},
  polymesh:{token:'POLYX'},
  mantra:{token:'OM'},
  pyth:{token:'PYTH'},
  provenance:{token:'HASH'},
  canton:{token:'CC'},
  aleo:{token:'ALEO'},
  ripple:{token:'XRP',stables:['RLUSD']},
  noble:{stables:['USDC']},
  // Stablecoin issuers
  circle:{stables:['USDC','EURC']},
  tether:{stables:['USDT']},
  paxos:{stables:['USDP','USDG','PYUSD']},
  mountain:{stables:['USDM']},
  // RWA Foundation-page additions
  solana:{token:'SOL',stables:['USDC','USDT']},
  stellar:{token:'XLM',stables:['USDC']},
  avalanche:{token:'AVAX',stables:['USDC','USDT']},
  etherfuse:{stables:['USDC']},
  ixswap:{token:'IXS',stables:['USDC']},
  orca:{token:'ORCA',stables:['USDC']}
};
Object.entries(ECO_TOKENS).forEach(([k,v])=>{if(ECO_META[k])Object.assign(ECO_META[k],v);else ECO_META[k]=v;});

const E={back:'home'};
function openEcoFrom(src){
  if(src==='app'){ $('#app').hidden=true; $('#landing').hidden=false; }
  E.back=src;
  showPage('eco');
  renderEcoPage();
}
function ecoBack(){
  if(E.back==='app' && S.connected){ showPage('home'); $('#landing').hidden=true; $('#app').hidden=false; }
  else showPage('home');
}
function renderEcoPage(){
  $('#ecoBackLbl').textContent = (E.back==='app'&&S.connected) ? 'Back to dashboard' : 'Back to home';
  renderEcoCtx();
  const mount=$('#ecoMount');
  if(!mount.__ecosystem) mount.innerHTML='<p role="status">Loading the ecosystem directory…</p>';
  import('/assets/ecosystem-directory.js').then(({mountEcosystem})=>mountEcosystem(mount,{
    getMembers:()=>logoAll(),
    isFavorite:(id,legacyIds)=>S.favs.has(id)||(legacyIds||[]).some(old=>S.favs.has(old)),
    onFavorite:(id,legacyIds)=>{
      if(!S.connected){ mount.querySelector('dialog')?.close(); ecoLoginNudge(); return; }
      const oldIds=legacyIds||[];
      const on=S.favs.has(id)||oldIds.some(old=>S.favs.has(old));
      oldIds.forEach(old=>S.favs.delete(old));
      on?S.favs.delete(id):S.favs.add(id);renderEcoCtx();
    }
  })).catch(()=>{mount.innerHTML='<p role="alert">The ecosystem directory could not load. <button class="btn btn-ghost btn-sm" onclick="renderEcoPage()">Try again</button></p>';});
}
function renderEcoCtx(){
  const t=$('#ecoCtx'); if(!t) return;
  t.classList.toggle('guest', !S.connected);
  t.innerHTML = S.connected ? `★ ${S.favs.size} FAVORITED` : '';
  t.style.display = S.connected ? '' : 'none';
}
function ecoLoginNudge(){
  S.pendingEco=true;
  showApp();
}
/* ============================================================
   ECOSYSTEM DIRECTORY 2.0 : nav bar filters, expandable rows,
   simplified sector map below the directory (ed2-)
   ============================================================ */
const ED2={cat:'market', region:'ALL', mem:false, q:'', open:null, step:10, limit:10};
const ED2_ORDER=['issuer','market','defi','protocol','service','tradfi'];
function edEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ed2Letter(name){ return (String(name).replace(/^the\s+/i,'').trim()[0]||'?').toUpperCase(); }
function ed2TypeLabel(t){ return t==='hub' ? 'Hub' : (ECO_TYPES[t]||t).replace(/s$/,'').replace('DeFi app','DeFi'); }
function ed2Match(n){
  if(ED2.cat!=='ALL' && n.type!==ED2.cat) return false;
  if(ED2.region!=='ALL' && n.region!==ED2.region) return false;
  if(ED2.mem && !n.member && n.type!=='hub') return false;
  if(ED2.q){
    const h=(n.name+' '+(n.blurb||'')+' '+(n.assets||[]).join(' ')+' '+ed2TypeLabel(n.type)).toLowerCase();
    if(h.indexOf(ED2.q)<0) return false;
  }
  return true;
}
function renderEco(){
  const M=$('#ecoMount'); if(!M) return;
  M.innerHTML=`
  <div class="ed2-nav" id="ed2Nav"></div>
  <div class="ed2-count" id="ed2Count"></div>
  <div class="ed2-list" id="ed2List"></div>
  <section class="ed2-mapsec">
    <div class="mh">
      <div><h3>The map, at a glance</h3><p class="ms">Every project, grouped by what it does. WALLY NFT sits in the middle of it all. Tap any dot to open its card above.</p></div>
      <span class="ed2-legend"><i></i>RWAF Member</span>
    </div>
    <div class="ed2-hub"><span class="hw">W</span><div><b>WALLY NFT</b><span>The community hub, coordinating across every sector of the RWA economy.</span></div></div>
    <div class="ed2-map" id="ed2Map"></div>
  </section>
  <section class="ed2-statsec">
    <div class="mh">
      <div><h3>The directory in numbers</h3><p class="ms">Live counts, straight from the directory above. Screenshot a card or copy its data.</p></div>
      <span class="ed2-live"><i></i>Live · ${ed2Today()}</span>
    </div>
    <div class="ed2-stats" id="ed2Stats"></div>
  </section>`;
  ed2Nav(); ed2List(); ed2MapPaint(); ed2StatsPaint();
}
function ed2Nav(){
  const N=$('#ed2Nav'); if(!N) return;
  const base=ECO.filter(n=>n.type!=='hub' && (ED2.region==='ALL'||n.region===ED2.region) && (!ED2.mem||n.member));
  const cats=[['ALL','All', base.length]].concat(ED2_ORDER.map(t=>[t, ECO_TYPES[t], base.filter(n=>n.type===t).length]));
  const regionLbl=ED2.region==='ALL'?'All regions':(ED2.region==='USA'?'United States':'International');
  N.innerHTML=`
   <div class="ed2-cats">${cats.map(c=>`<button class="ed2-cat ${ED2.cat===c[0]?'on':''}" onclick="ed2Set('cat','${c[0]}')">${c[1]} <i>${c[2]}</i></button>`).join('')}</div>
   <div class="ed2-tools">
     <div class="ed2-menu" id="ed2RegionMenu">
       <button class="ed2-mbtn" onclick="ed2Menu(event)">${regionLbl} <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
       <div class="ed2-pop">
         ${[['ALL','All regions'],['USA','United States'],['INTL','International']].map(r=>`<button class="${ED2.region===r[0]?'on':''}" onclick="ed2Set('region','${r[0]}')">${r[1]}${ED2.region===r[0]?' \u2713':''}</button>`).join('')}
       </div>
     </div>
     <button class="ed2-mbtn ed2-mem ${ED2.mem?'on':''}" onclick="ed2Set('mem',!ED2.mem)">Members</button>
     <label class="ed2-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="ed2Q" type="search" placeholder="Search the directory" value="${edEsc(ED2.q)}" oninput="ed2Set('q',this.value)"></label>
   </div>`;
}
function ed2Menu(e){
  e.stopPropagation();
  const m=$('#ed2RegionMenu'); if(!m) return;
  m.classList.toggle('open');
}
document.addEventListener('click', ()=>{ const m=$('#ed2RegionMenu'); if(m) m.classList.remove('open'); });
function ed2Set(k,v){
  ED2.limit=ED2.step;
  if(k==='q'){ ED2.q=String(v).trim().toLowerCase(); ed2List(); return; }
  ED2[k]=v;
  ed2Nav(); ed2List();
  const q=$('#ed2Q'); if(q && document.activeElement!==q) q.value=ED2.q;
}
function ed2Facts(n){
  const m=(typeof ECO_META!=='undefined' && ECO_META[n.id])||{};
  const f=[];
  if(m.flagship) f.push(['Flagship', m.flagship]);
  if(m.stat&&m.stat.label) f.push([m.stat.label, m.stat.value]);
  if(m.token) f.push(['Token', '$'+m.token]);
  if(m.stables&&m.stables.length) f.push(['Stables', m.stables.join(', ')]);
  if(m.chains&&m.chains.length) f.push(['Chains', m.chains.join(', ')]);
  if(m.founded) f.push(['Founded', m.founded]);
  if((n.assets||[]).length) f.push(['Assets', n.assets.join(', ')]);
  return f;
}
function ed2Rel(n){
  const rel=new Set(n.links||[]);
  ECO.forEach(o=>{ if((o.links||[]).includes(n.id)) rel.add(o.id); });
  rel.delete(n.id);
  return Array.from(rel).map(id=>ECO.find(x=>x.id===id)).filter(Boolean);
}
function ed2RowHtml(n){
  const open=ED2.open===n.id;
  const fav=(typeof S!=='undefined' && S.favs && S.favs.has(n.id));
  const facts=ed2Facts(n);
  const rel=ed2Rel(n);
  return `<div class="ed2-row ${n.member?'mem':''} ${open?'open':''}" id="ed2r-${n.id}">
   <button class="ed2-head" onclick="ed2Toggle('${n.id}')" aria-expanded="${open?'true':'false'}">
     <span class="ed2-logo">${ed2Letter(n.name)}</span>
     <span class="ed2-main">
       <span class="ed2-name">${edEsc(n.name)}${n.member?'<span class="ed2-badge">Member</span>':''}<span class="ed2-star" data-star="${n.id}" ${fav?'':'hidden'}>\u2605</span></span>
       <span class="ed2-blurb">${edEsc(n.blurb||'')}</span>
     </span>
     <span class="ed2-side"><span class="ed2-tag">${ed2TypeLabel(n.type)}</span><span class="ed2-reg">${n.region==='USA'?'US':'INTL'}</span><svg class="ed2-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </button>
   <div class="ed2-x"><div class="ed2-xin"><div class="ed2-xpad">
     <p>${edEsc(n.blurb||'')}</p>
     ${facts.length?`<div class="ed2-facts">${facts.map(f=>`<div class="ed2-fact"><b>${edEsc(f[0])}</b><span>${edEsc(f[1])}</span></div>`).join('')}</div>`:''}
     ${rel.length?`<div class="ed2-rel"><b>Builds with</b><div class="chips">${rel.map(r=>`<button class="ed2-chip" onclick="ed2Jump('${r.id}')">${edEsc(r.name)}</button>`).join('')}</div></div>`:''}
     <div class="ed2-acts">
       <button class="ed2-act fav ${fav?'on':''}" data-favbtn="${n.id}" onclick="ed2Fav('${n.id}')">${fav?'\u2605 Favorited':'\u2606 Favorite'}</button>
       <button class="ed2-act" onclick="ed2Locate('${n.id}')">Find on the map</button>
     </div>
   </div></div></div>
  </div>`;
}
function ed2List(){
  const L=$('#ed2List'); if(!L) return;
  const hits=ECO.filter(ed2Match).sort((a,b)=>
    (b.type==='hub'?1:0)-(a.type==='hub'?1:0) || (b.member||0)-(a.member||0) || a.name.localeCompare(b.name));
  const show=hits.slice(0,ED2.limit);
  if(ED2.open && !show.some(n=>n.id===ED2.open)) ED2.open=null;
  const more=hits.length-show.length;
  L.innerHTML = hits.length ? show.map(ed2RowHtml).join('')
    + (more>0?`<div class="ed2-morewrap"><button class="btn btn-ghost btn-sm" onclick="ed2More()">Show ${Math.min(ED2.step,more)} more</button></div>`:'')
    : `<div class="ed2-empty"><b>Nothing matches.</b><br>Try another category or clear the search.<br><button class="btn btn-ghost btn-sm" onclick="ed2Reset()">Clear filters</button></div>`;
  ed2CountPaint(hits, show.length);
}
function ed2CountPaint(hits, shown){
  const C=$('#ed2Count'); if(!C) return;
  if(!hits) hits=ECO.filter(ed2Match);
  if(shown==null) shown=Math.min(ED2.limit,hits.length);
  const mem=hits.filter(n=>n.member).length;
  C.innerHTML=`<span>Showing ${shown} of ${hits.length} \u00b7 ${mem} RWA Foundation members in view</span><span class="ed2-size">Show ${[10,25,50,100].map(n=>`<button class="${ED2.step===n?'on':''}" onclick="ed2SizeSet(${n})">${n}</button>`).join('')}</span>`;
}
function ed2Reset(){ ED2.cat='ALL'; ED2.region='ALL'; ED2.mem=false; ED2.q=''; ED2.limit=ED2.step; ed2Nav(); ed2List(); }
function ed2More(){ ED2.limit+=ED2.step; ed2List(); }
function ed2SizeSet(n){ ED2.step=n; ED2.limit=n; ed2List(); }
function ed2Toggle(id){
  const was=ED2.open;
  if(was && was!==id){ const r=$('#ed2r-'+was); if(r){ r.classList.remove('open'); const h=r.querySelector('.ed2-head'); h&&h.setAttribute('aria-expanded','false'); } }
  ED2.open = (was===id) ? null : id;
  const row=$('#ed2r-'+id); if(!row) return;
  row.classList.toggle('open', ED2.open===id);
  const h=row.querySelector('.ed2-head'); h&&h.setAttribute('aria-expanded', ED2.open===id?'true':'false');
}
function ed2Open(id){
  if(ED2.open!==id) ed2Toggle(id);
  const row=$('#ed2r-'+id);
  if(row) setTimeout(()=>row.scrollIntoView({behavior:'smooth',block:'center'}), 60);
}
function ed2Jump(id){
  const n=ECO.find(x=>x.id===id); if(!n) return;
  if(!ed2Match(n)){ ED2.cat='ALL'; ED2.region='ALL'; ED2.mem=false; ED2.q=''; }
  const hits=ECO.filter(ed2Match).sort((a,b)=>
    (b.type==='hub'?1:0)-(a.type==='hub'?1:0) || (b.member||0)-(a.member||0) || a.name.localeCompare(b.name));
  const idx=hits.findIndex(x=>x.id===id);
  if(idx>=ED2.limit) ED2.limit=idx+1;
  ed2Nav(); ed2List();
  ed2Open(id);
}
function ed2Fav(id){
  if(typeof S==='undefined' || !S.connected){ ecoLoginNudge(); return; }
  const on=!S.favs.has(id);
  on ? S.favs.add(id) : S.favs.delete(id);
  const b=document.querySelector(`[data-favbtn="${id}"]`);
  if(b){ b.classList.toggle('on',on); b.innerHTML=on?'\u2605 Favorited':'\u2606 Favorite'; }
  const s=document.querySelector(`[data-star="${id}"]`);
  if(s) s.hidden=!on;
  if(typeof renderEcoCtx==='function') renderEcoCtx();
}
function ed2MapPaint(){
  const M=$('#ed2Map'); if(!M) return;
  M.innerHTML=ED2_ORDER.map(t=>{
    const arr=ECO.filter(n=>n.type===t).sort((a,b)=>(b.member||0)-(a.member||0)||a.name.localeCompare(b.name));
    return `<div class="ed2-cell"><h6>${ECO_TYPES[t]} <i>${arr.length}</i></h6>
      <div class="ed2-dots">${arr.map(n=>`<button class="ed2-dot ${n.member?'mem':''}" title="${edEsc(n.name)}" aria-label="${edEsc(n.name)}" data-dot="${n.id}" onclick="ed2FromMap('${n.id}')"><i>${ed2Letter(n.name)}</i></button>`).join('')}</div>
    </div>`;
  }).join('');
}
function ed2FromMap(id){
  ed2Jump(id);
}
function ed2Locate(id){
  const map=$('#ed2Map'); if(!map) return;
  map.scrollIntoView({behavior:'smooth',block:'center'});
  const d=document.querySelector(`[data-dot="${id}"]`);
  if(d){ d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); }
}
function ed2Today(){ return new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
const ED2_STATS={};
function ed2DefiKind(n){
  const t=((n.name||'')+' '+(n.blurb||'')).toLowerCase();
  if(/lend|credit|loan|borrow|securitization/.test(t)) return 'Lending & credit';
  if(/dex|amm|swap|liquidit|trade/.test(t)) return 'Trading & liquidity';
  if(/stablecoin/.test(t)) return 'Stablecoins';
  if(/yield|vault|index|strateg|risk|curation/.test(t)) return 'Yield & risk';
  return 'Other DeFi';
}
function ed2BarsHtml(rows){
  const max=Math.max.apply(null, rows.map(r=>r[1]).concat([1]));
  return '<div class="ed2-bars">'+rows.map(r=>
    '<div class="ed2-bar"><b>'+edEsc(r[0])+'</b><span class="tr"><i style="width:'+Math.round(r[1]/max*100)+'%"></i></span><em>'+r[1]+'</em></div>'
  ).join('')+'</div>';
}
function ed2StatCard(key,title,sub,body){
  return '<div class="ed2-stat'+(key==='totals'?' wide':'')+'" id="ed2card-'+key+'">'
   +'<div class="ed2-st-top"><div><h4>'+title+'</h4><p class="ed2-st-sub">'+sub+'</p></div>'
   +'<button class="ed2-copy" onclick="ed2Shot(\''+key+'\')"><svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13" rx="2.5"/><path d="M8.5 7l1.4-2.8h4.2L15.5 7"/><circle cx="12" cy="13.2" r="3.4"/></svg>Copy card</button></div>'
   +body
   +'<div class="ed2-st-foot"><b><img class="ed2-fl" src="'+RWAF_AV+'" alt="">RWA Foundation</b><span>Live \u00b7 '+ed2Today()+' \u00b7 RWAF.xyz</span></div></div>';
}
function ed2StatsPaint(){
  const W=$('#ed2Stats'); if(!W) return;
  const nodes=ECO.filter(n=>n.type!=='hub');
  const by=t=>nodes.filter(n=>n.type===t);
  const defi=by('defi'), issuers=by('issuer');
  const totals=[['Projects',nodes.length],['Issuers',issuers.length],['DeFi apps',defi.length],['Protocols',by('protocol').length],['TradFi firms',by('tradfi').length],['RWA Foundation members',nodes.filter(n=>n.member).length]];
  const chainCnt={}; let listed=0;
  defi.forEach(n=>{ const m=(typeof ECO_META!=='undefined'&&ECO_META[n.id])||{}; if(m.chains&&m.chains.length){ listed++; m.chains.forEach(c=>chainCnt[c]=(chainCnt[c]||0)+1); } });
  let chains=Object.entries(chainCnt).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  if(chains.length>7){ const rest=chains.slice(7).reduce((s,r)=>s+r[1],0); chains=chains.slice(0,7); if(rest) chains.push(['Other chains',rest]); }
  const kindCnt={}; defi.forEach(n=>{ const k=ed2DefiKind(n); kindCnt[k]=(kindCnt[k]||0)+1; });
  const kinds=Object.entries(kindCnt).sort((a,b)=>b[1]-a[1]);
  const AST={treasuries:'Treasuries',funds:'Funds',credit:'Private credit',equities:'Equities',stablecoins:'Stablecoins',realestate:'Real estate',commodities:'Commodities'};
  const astCnt={}; issuers.forEach(n=>(n.assets||[]).forEach(a=>{ const k=AST[a]||a; astCnt[k]=(astCnt[k]||0)+1; }));
  const assets=Object.entries(astCnt).sort((a,b)=>b[1]-a[1]);
  ED2_STATS.totals={title:'The RWA economy, counted', rows:totals};
  ED2_STATS.chains={title:'DeFi apps by chain', rows:chains};
  ED2_STATS.kinds={title:'DeFi apps by category', rows:kinds};
  ED2_STATS.assets={title:'Issuers by asset class', rows:assets};
  W.innerHTML =
    ed2StatCard('totals','The RWA economy, counted','Every project in the directory, by what it does.',
      '<div class="ed2-tot">'+totals.map((t,i)=>'<div class="ed2-tile'+(i===0?' hi':'')+'"><b>'+t[1]+'</b><span>'+edEsc(t[0])+'</span></div>').join('')+'</div>')
   + ed2StatCard('chains','DeFi apps by chain', listed+' of '+defi.length+' DeFi apps list where they deploy. Multichain apps count once per chain.', ed2BarsHtml(chains))
   + ed2StatCard('kinds','DeFi apps by category','All '+defi.length+' DeFi apps, grouped by what they do.', ed2BarsHtml(kinds))
   + ed2StatCard('assets','Issuers by asset class','What the '+issuers.length+' issuers tokenize. Issuers can span classes.', ed2BarsHtml(assets));
}
const RWAF_AV='/assets/embedded/ce80671c76bb2413a53f.png';
function ed2Shot(key){
  const el=document.getElementById('ed2card-'+key); const s=ED2_STATS[key];
  if(!el||!s){ return; }
  const W=el.offsetWidth, H=el.offsetHeight;
  const clone=el.cloneNode(true);
  const srcEls=[el].concat(Array.prototype.slice.call(el.querySelectorAll('*')));
  const dstEls=[clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
  for(let i=0;i<srcEls.length;i++){
    const cs=getComputedStyle(srcEls[i]); const st=dstEls[i].style;
    for(let j=0;j<cs.length;j++){ const p=cs[j]; st.setProperty(p, cs.getPropertyValue(p), cs.getPropertyPriority(p)); }
  }
  const cb=clone.querySelector('.ed2-copy'); if(cb) cb.remove();
  clone.style.margin='0'; clone.style.width=W+'px';
  const xhtml=new XMLSerializer().serializeToString(clone);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">'+xhtml+'</div></foreignObject></svg>';
  const img=new Image();
  img.onload=function(){
    const scale=2, c=document.createElement('canvas');
    c.width=W*scale; c.height=H*scale;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#F4F1EA'; ctx.fillRect(0,0,c.width,c.height);
    ctx.scale(scale,scale); ctx.drawImage(img,0,0);
    c.toBlob(function(blob){
      if(!blob){ ed2Copy(key); return; }
      window.ED2_LASTSHOT={w:c.width,h:c.height,bytes:blob.size};
      const finish=function(ok){ toast(ok?'Card copied as image':'Card saved as image', s.title+' \u00b7 ready to share.'); };
      if(navigator.clipboard && window.ClipboardItem){
        navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){finish(true);}).catch(function(){ ed2ShotSave(blob,key); finish(false); });
      } else { ed2ShotSave(blob,key); finish(false); }
    },'image/png');
  };
  img.onerror=function(){ ed2Copy(key); };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function ed2ShotSave(blob,key){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='wally-'+key+'-'+new Date().toISOString().slice(0,10)+'.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
}
function ed2Copy(key){
  const s=ED2_STATS[key]; if(!s) return;
  const txt = s.title+' \u00b7 WALLY NFT Ecosystem Directory \u00b7 '+ed2Today()+'\n'
    + s.rows.map(r=>r[0]+' '+r[1]).join(' \u00b7 ')+'\n'
    + 'Live data \u00b7 RWAF.xyz/#/ecosystem';
  window.ED2_LASTCOPY=txt;
  const done=()=>toast('Copied to clipboard', s.title+' \u00b7 ready to paste.');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done).catch(()=>{ ed2CopyFallback(txt); done(); });
  } else { ed2CopyFallback(txt); done(); }
}
function ed2CopyFallback(txt){
  const t=document.createElement('textarea');
  t.value=txt; t.style.position='fixed'; t.style.opacity='0';
  document.body.appendChild(t); t.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(t);
}

/* ---------- profile ---------- */
/* ---------- RWA chapters (rail + pane, optional guided play) ---------- */
const JR_PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const CH=[
 {nav:'Wallets',t:'Wallets',d:'Custody Everything In One Place',o:'Bank + broker, in your pocket',h:'One app for everything you own.',p:'Money used to live in two places: a bank account for cash, a broker account for investments. A wallet replaces both. It holds your crypto and your RWAs side by side.'},
 {nav:'Money',t:'Stablecoins',d:'Stablecoins Are Currency',o:'Digital dollars, always on',h:'Digital dollars, always on.',p:"A stablecoin is worth $1 and moves anywhere on Earth in seconds. Nights, weekends and holidays included. Most wallet providers offer them built in, so they're usually the first RWA you'll ever hold."},
 {nav:'Vaults',t:'RWA Vaults',d:'Lend to Earn',o:'Your stablecoins, put to work',h:'Your stablecoins, put to work.',p:'Vaults let you easily deposit stablecoins into ready-made strategies backed by different real assets: government bonds, credit, property. The yield arrives onchain, in plain sight, every day.',cta:1},
 {nav:'Trading',t:'Trading & AMM',d:'Cash Out When You Want',o:'Markets that never close',h:'Markets that never close.',p:'Tokenized assets trade around the clock on automated markets. No closing bell, no middleman. When you want out, you can pull your asset faster, typically at any time, though fees always apply.'},
 {nav:'Borrowing',t:'No-Middleman Borrowing',d:'Borrow Against What You Own',o:'Instant credit, no bank',h:'Unlock capital when you need it.',p:'Put up a tokenized asset as collateral and borrow stablecoins against it instantly: lock your position, unlock cash. Rates are set by the market and you can often choose your repayment schedule. No bank approval, no paperwork, no waiting, AND no humans involved.'}];
const JR={i:0,video:false};
function jrRail(){
  const r=$('#jrRail'); if(!r) return;
  r.innerHTML=CH.map((c,k)=>`<button class="jr-item ${k===JR.i?'on':''}" onclick="jrGo(${k})">
    <span class="jr-num">0${k+1}</span>
    <span class="jr-tt"><b>${c.nav}</b><i>${c.o}</i></span>
  </button>`).join('');
}
function jrPane(){
  const c=CH[JR.i];
  $('#jrTag').innerHTML=`<span>CHAPTER 0${JR.i+1}</span>`;
  const b=$('#jrBody');
  b.innerHTML=`<h3 class="jr-title">${c.d||c.t}</h3><p class="jr-strap">${c.h}</p>
    <p>${c.p}</p>${c.cta?`<div class="jp-cta"><button class="btn btn-orange btn-sm" onclick="showApp()">Start your RWA Journey <span class="arr">→</span></button></div>`:''}`;
  b.classList.remove('swap'); void b.offsetWidth; b.classList.add('swap');
  $('#jrCount').textContent=`0${JR.i+1} / 0${CH.length}`;
  const nx=$('#jrNext');
  if(JR.i<CH.length-1){ nx.hidden=false; nx.innerHTML=`Next: ${CH[JR.i+1].nav} <span class="arr">→</span>`; nx.onclick=()=>jrGo(JR.i+1); }
  else { nx.hidden=true; nx.onclick=null; }
}
function jrPaint(){ const el=$('#jrProg'); if(el) el.style.width=((JR.i+1)/CH.length*100)+'%'; }
function jrGo(i){
  JR.i=Math.max(0,Math.min(CH.length-1,i)); JR.video=false;
  jrRail(); jrPane(); jrPaint();
}
function jrVideo(){ JR.video=!JR.video; jrPane(); }
(function(){ if($('#jr')){ jrRail(); jrPane(); jrPaint(); } })();
addEventListener('keydown',e=>{
  const L=$('#landing');
  if(!L||L.hidden||!$('#jr')||$('#jr').closest('main').hidden) return;
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if(e.key==='ArrowRight') jrGo(JR.i+1);
  if(e.key==='ArrowLeft')  jrGo(JR.i-1);
});

/* ---------- page router (home / foundation) ---------- */
function showPage(p, anchor, fromRoute){
  if(!fromRoute){ location.assign(pageURL(p)+(anchor||'')); return; }
  Object.keys(PAGE_ROUTES).forEach(k=>{ const el=$('#page-'+k); if(el) el.hidden = k!==p; });
  if(p==='jobs' && window.renderJobs) renderJobs();
  if(p==='jobs' && window.jbSync) jbSync();
  if(p==='news' && window.renderNewsPage) renderNewsPage();
  if(p==='admin' && window.renderAdmin) renderAdmin();
  if(p==='eco') renderEcoPage();
  if(p!=='jobs' && window.jbPause) jbPause();
  if(p==='home' && window.__lmStale){ window.__lmStale=0; if(window.buildLogoMarquee) buildLogoMarquee(); }
  $('#fdnLink').classList.toggle('on', p==='foundation');
  $('#landing').classList.toggle('eco-mode', p==='eco');
  $('#landing').classList.toggle('meet-mode', p==='meet');
  mm();
  const hv = $('#wallyHeroVid');
  if(hv){
    if(p==='meet'){ if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ try{ const pr=hv.play(); if(pr&&pr.catch) pr.catch(()=>{}); }catch(e){} } }
    else { try{ hv.pause(); }catch(e){} }
  }
  if(anchor) setTimeout(()=>{ const el=$(anchor); el && el.scrollIntoView({behavior:'smooth'}); }, 60);
  else scrollTo(0,0);
  window.__page = p;
  if(['home','foundation','jobs','eco'].includes(p) && window.refreshMembers) refreshMembers();
  document.title = PAGE_TITLES[p] || PAGE_TITLES.home;
  dispatchEvent(new Event('rwaf:pageview'));
}
function nav(anchor){ const pages={'#primer':'learn','#wallynft':'wallynft','#news':'newsletter'}; showPage(pages[anchor]||'home',pages[anchor]?null:anchor); }

/* ---------- page URLs (legacy hash links are migrated in the head) ---------- */
const PAGE_ROUTES = {home:'', foundation:'members', eco:'ecosystem', articles:'research', brandkit:'media-kit', meet:'meet', wallynft:'wally-nft', learn:'learn', newsletter:'newsletter', jobs:'jobs', news:'news', admin:'admin'};
function pageURL(page){const slug=PAGE_ROUTES[page];return slug?'/'+slug+'/':'/';}
const PAGE_TITLES = window.RWAF_PAGE_TITLES;
function routeFromLocation(){
  const p=document.body.dataset.page||'home';
  showPage(p, null, true);
  if(location.hash&&!location.hash.startsWith('#/'))requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
}
function toggleMeetSound(){
  const v=$('#wallyHeroVid'), b=$('#mwSound'), ic=$('#mwSoundIcon');
  if(!v) return;
  v.muted = !v.muted;
  if(!v.muted){ try{ const pr=v.play(); if(pr&&pr.catch) pr.catch(()=>{}); }catch(e){} }
  if(b) b.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Turn sound off');
  if(ic) ic.innerHTML = v.muted
    ? '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 10l4 4M21 10l-4 4"/>'
    : '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>';
}
/* ---------- Media Kit / Brand Kit ---------- */
const WALLY_MARK = "/assets/brand/rwa-elephant-noise.png";
const WALLY_MARK_WHITE = "/assets/brand/rwa-elephant-reversed.png";
const LOGO_WHITE = "/assets/brand/rwa-elephant-white.png";
const WALLY_3D = "/assets/brand/wally-3d.png";
const WALLY_3DA = "/assets/brand/wally-3d-alt.png";
const WALLY_GREY = "/assets/brand/wally-grey.png";
const WALLY_NOISE = "/assets/brand/wally-noise.png"; const WALLY_LOGO = "/assets/brand/rwaf-logo.png"; const WALLY_WP_PDF = "";
function bkLogo(m){
  var L=document.getElementById('bkStageL'), S=document.getElementById('bkStageS'), mk=document.getElementById('bkMark'), sym=document.getElementById('bkSym'), capL=document.getElementById('bkCapL'), capS=document.getElementById('bkCapS'), dl=document.getElementById('bkDlSym');
  if(!L) return;
  var cfg={ grey:{img:WALLY_MARK,dark:false,capL:'Lockup · grey noise · on paper',capS:'Symbol · grey noise',file:'RWA-elephant-noise.png'},
            white:{img:LOGO_WHITE,dark:false,capL:'Lockup · white · black wordmark',capS:'Symbol · white',file:'RWA-elephant-white.png'},
            wtext:{img:WALLY_MARK_WHITE,dark:true,capL:'Lockup · white text · on ink',capS:'Symbol · white outline',file:'RWA-elephant-reversed.png'} };
  var c=cfg[m]||cfg.grey; mk.src=c.img; sym.src=c.img;
  L.classList.toggle('dark',c.dark); L.classList.toggle('light',!c.dark); S.classList.toggle('dark',c.dark); S.classList.toggle('light',!c.dark);
  capL.textContent=c.capL; capS.textContent=c.capS;
  if(dl){ dl.href=c.img; dl.setAttribute('download',c.file); }
  var ids={grey:'segGrey',white:'segWhite',wtext:'segWtext'};
  Object.keys(ids).forEach(function(k){ var b=document.getElementById(ids[k]); if(b) b.classList.toggle('on',k===m); });
}
function dlData(href,name){ var a=document.createElement('a'); a.href=href; a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
const BRAND_PDF = "/assets/brand/rwa-foundation-brand-guidelines.pdf";
function downloadGuidelines(){ dlData(BRAND_PDF,'RWA-Foundation-Brand-Guidelines.pdf'); }
function downloadLogos(){ dlData('/assets/brand/rwa-foundation-logos.zip','RWA-Foundation-Logos.zip'); }
function copyHex(hex){ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(hex).then(function(){toast('Copied', hex+' is on your clipboard.');}).catch(function(){toast('Hex', hex);}); } else { toast('Hex', hex); } }
function bkInit(){ document.querySelectorAll('[data-mark]').forEach(function(el){ el.src = WALLY_MARK; });
  var WMAP={'3d':WALLY_3D,'3da':WALLY_3DA,'grey':WALLY_GREY,'noise':WALLY_NOISE,'logo':WALLY_LOGO};
  document.querySelectorAll('[data-wally]').forEach(function(el){ var u=WMAP[el.getAttribute('data-wally')]; if(u) el.src=u; }); document.querySelectorAll('[data-wp-pdf]').forEach(function(a){ a.href = WALLY_WP_PDF; });
  document.querySelectorAll('[data-wally-dl]').forEach(function(a){ var u=WMAP[a.getAttribute('data-wally-dl')]; if(u) a.href=u; });
  bkLogo('grey'); }
bkInit();


/* ---------- foundation: see-all members ---------- */
/* herd count comes from /api/stats (X API, cached twice daily) — no synthetic ticking */

/* ============================================================
   ARTICLE HUB · "The Reading Room" — public, guest-friendly
   ------------------------------------------------------------
   The entries below mirror the long-form "Articles" feeds of the
   three X accounts. They are representative briefings written in
   each account's voice — the full pieces live on X (links below).
   To wire live data, swap the arrays in ARTICLES; keep the shape
   {cat,tag,title,excerpt,date,read,feat?} and the source `url`.
   cat maps to a tag colour: org / grn / gld / vio.
============================================================ */
const X_ICON = '<svg viewBox="0 0 24 24"><path d="M4 4l7.2 9.3L4.4 20h2.6l5.4-5.4L16.8 20H20l-7.5-9.7L18.9 4h-2.6l-4.8 4.9L7.2 4z"/></svg>';

// Legacy Reading Room entry points now lead to the live research hub.
function openArticlesFrom(){ location.assign('/research/'); }
function articlesBack(){ showPage('home'); }
function artTab(k){ location.assign(k==='foundation'?'/research/':'/research/'+k+'/'); }
function renderArticles(){ location.replace('/research/'); }
function renderLearnArticles(){
  const wrap=document.getElementById('learnArt');
  if(wrap) wrap.innerHTML='<div class="art-tabs"><a class="btn btn-dark" href="/research/">RWA Foundation Research Reports</a><a class="btn" href="/research/#wally">WALLY articles</a><a class="btn" href="/research/#zeus">Zeus’ Corner</a></div>';
}
function artTabLearn(k){ artTab(k); }

/* ---------- boot ---------- */
renderNotifs();
