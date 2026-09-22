/* Shared editorial spelling for static copy and asynchronously rendered feeds.
   Operates on display text only: URLs, IDs, source records and user input stay intact. */
(() => {
  const text = value => String(value ?? '').replace(/\bon[-\u2010-\u2015\u2212\u00ad]chain\b/gi, match => match === match.toUpperCase() ? 'ONCHAIN' : match[0] === 'O' ? 'Onchain' : 'onchain');
  const newsSection = value => /^onchain\s*&\s*protocol$/i.test(text(value).trim()) ? 'Protocol' : text(value);
  globalThis.RwafCopy = { text, newsSection };
  if (typeof document === 'undefined' || !document.createTreeWalker) return;
  const ignored = 'script,style,code,pre,textarea,input,[contenteditable]:not([contenteditable="false"])';
  const attrs = ['alt', 'title', 'aria-label', 'placeholder'];
  function normalize(node) {
    if (node.nodeType === 3) {
      if (!node.parentElement?.closest(ignored)) { const next = text(node.nodeValue); if (next !== node.nodeValue) node.nodeValue = next; }
      return;
    }
    if (node.nodeType !== 1 || node.closest(ignored)) return;
    for (const attr of attrs) if (node.hasAttribute(attr)) { const old = node.getAttribute(attr), next = text(old); if (old !== next) node.setAttribute(attr, next); }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let child; while ((child = walker.nextNode())) {
      if (child.nodeType === 3) normalize(child);
      else if (!child.closest(ignored)) for (const attr of attrs) if (child.hasAttribute(attr)) { const old = child.getAttribute(attr), next = text(old); if (old !== next) child.setAttribute(attr, next); }
    }
  }
  function start() {
    normalize(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') record.addedNodes.forEach(normalize);
        else normalize(record.target);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attrs });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
