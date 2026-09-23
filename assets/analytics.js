/* Vercel Web Analytics for static pages and the site's hash-based router. */
(() => {
  const hosts = ['rwaf.xyz', 'www.rwaf.xyz', 'wallyproduction.vercel.app', 'wallystaging.vercel.app'];
  if (!hosts.includes(location.hostname) || window.RwafAnalytics) return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  let lastPath;

  function currentPath() {
    if (typeof PAGE_ROUTES !== 'undefined' && window.__page) {
      if (window.__page === 'admin') return null;
      const slug = PAGE_ROUTES[window.__page];
      return slug === undefined ? null : slug ? '/' + slug : '/';
    }
    const path = location.pathname;
    if (/^\/admin(?:\/|$)/.test(path)) return null;
    if (/^\/research\/?$/.test(path)) {
      const tab = location.hash.slice(1);
      return ['wally', 'zeus'].includes(tab) ? '/research/' + tab : '/research/';
    }
    return path;
  }

  window.va('beforeSend', event => {
    // Only anonymous page views; no form values, query strings or arbitrary hashes.
    if (event.type !== 'pageview') return null;
    const url = new URL(event.url, location.origin);
    url.search = '';
    url.hash = '';
    return {...event, url: url.href};
  });

  function pageview() {
    const path = currentPath();
    if (!path) { lastPath = null; return; }
    if (path === lastPath) return;
    lastPath = path;
    window.va('pageview', {path, route: path});
  }
  window.RwafAnalytics = {pageview};
  addEventListener('rwaf:pageview', pageview);
  pageview();

  const script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  // Manual pageviews avoid duplicate counts and distinguish #/news from #/meet.
  script.dataset.disableAutoTrack = '1';
  document.head.appendChild(script);
})();
