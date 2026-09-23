(() => {
  const sources = {
    wally: { name: 'WALLY articles', username: 'WALLY_DAO', bio: 'Stories, ideas and dispatches from WALLY, published on X.' },
    zeus: { name: 'Zeus’ Corner', username: 'ZeusRWA', bio: 'Long reads and perspectives on tokenization and the real-world asset economy.' }
  };
  const states = {}, $ = id => document.getElementById(id);
  let active = 'reports';
  const tabs = [...document.querySelectorAll('[data-tab]')];
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = RwafCopy.text(text); return el; }
  function draw() {
    if (active === 'reports') return;
    const source = sources[active], state = states[active] || { items: [] };
    const username = state.source?.username || source.username;
    $('article-heading').textContent = source.name; $('article-bio').textContent = source.bio;
    $('article-profile').href = `https://x.com/${username}/articles`;
    $('article-profile').textContent = `@${username} · All articles on X ↗`;
    $('article-status').textContent = state.loading ? 'Loading articles from X…' : state.error || (state.updated_at ? `${state.stale ? 'Showing the last saved update · X is temporarily unavailable' : 'From X · checked hourly'} · Updated ${new Date(state.updated_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : '');
    const grid = $('article-grid'); grid.replaceChildren();
    for (const item of state.items) {
      let url; try { url = new URL(item.url); } catch { continue; }
      if (url.protocol !== 'https:' || !['x.com', 'twitter.com', 'www.x.com'].includes(url.hostname)) continue;
      const card = node('a', 'article-card'); card.href = url.href; card.target = '_blank'; card.rel = 'noopener noreferrer';
      if (item.image) {
        try { const u = new URL(item.image); if (u.protocol === 'https:' && u.hostname.endsWith('.twimg.com')) { const img = node('img'); img.src = u.href; img.alt = ''; img.loading = 'lazy'; img.addEventListener('error', () => img.remove()); card.append(img); } } catch {}
      }
      const body = node('div', 'article-card-body'); body.append(node('div', 'article-kicker', `ARTICLE · @${username}`), node('h3', '', item.title));
      if (item.excerpt) body.append(node('p', '', item.excerpt));
      const meta = node('div', 'article-meta'), time = Date.parse(item.published_at);
      if (Number.isFinite(time)) { const t = node('time', '', new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })); t.dateTime = item.published_at; meta.append(t); }
      meta.append(node('span', '', 'Read on X ↗')); body.append(meta); card.append(body); grid.append(card);
    }
    if (!state.loading && !state.items.length) grid.append(node('div', 'article-empty', state.error ? 'The articles could not be loaded. Try again, or visit the account on X.' : state.next ? 'No long-form articles in this batch of posts. Load older articles to keep looking.' : 'No published X articles were found in the available posts.'));
    $('article-more').hidden = !state.next; $('article-more').disabled = !!state.loading;
    $('article-retry').hidden = !state.error || !!state.loading;
  }
  async function load(key, append = false) {
    const state = states[key] ||= { items: [], next: null };
    if (state.loading) return;
    state.loading = true; state.error = null; state.retryAppend = append;
    if (active === key) draw();
    try {
      const q = new URLSearchParams({ source: key }); if (append && state.next) q.set('cursor', state.next);
      const r = await fetch('/api/articles?' + q, { signal: AbortSignal.timeout(30000) });
      const data = await r.json(); if (!r.ok || !Array.isArray(data.items)) throw Error(data.error || 'Articles are temporarily unavailable.');
      const items = append ? state.items.concat(data.items) : data.items;
      state.items = [...new Map(items.map(item => [item.url, item])).values()];
      state.next = data.next_cursor; state.updated_at = data.updated_at; state.stale = data.stale; state.source = data.source; state.loaded = true;
    } catch (e) { state.error = e.name === 'TimeoutError' ? 'X took too long to respond. Please retry.' : e.message; }
    finally { state.loading = false; if (active === key) draw(); }
  }
  function select(key) {
    active = key in sources ? key : 'reports';
    for (const tab of tabs) { const on = tab.dataset.tab === active; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; }
    $('panel-reports').hidden = active !== 'reports'; $('panel-articles').hidden = active === 'reports';
    if (active !== 'reports') { $('panel-articles').setAttribute('aria-labelledby', 'tab-' + active); draw(); if (!states[active]?.loaded) load(active); }
    dispatchEvent(new Event('rwaf:pageview'));
  }
  for (const [i, tab] of tabs.entries()) {
    tab.addEventListener('click', () => { history.replaceState(null, '', '#' + tab.dataset.tab); select(tab.dataset.tab); });
    tab.addEventListener('keydown', e => { let target; if (e.key === 'ArrowRight') target = (i + 1) % tabs.length; if (e.key === 'ArrowLeft') target = (i + tabs.length - 1) % tabs.length; if (e.key === 'Home') target = 0; if (e.key === 'End') target = tabs.length - 1; if (target !== undefined) { e.preventDefault(); tabs[target].focus(); tabs[target].click(); } });
  }
  $('article-more').addEventListener('click', () => load(active, true));
  $('article-retry').addEventListener('click', () => load(active, states[active]?.retryAppend));
  addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(location.hash.slice(1));
})();
