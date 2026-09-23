import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../assets/analytics.js', import.meta.url), 'utf8');
function boot({host = 'www.rwaf.xyz', pathname = '/', hash = '', page} = {}) {
  const listeners = {}, scripts = [], context = {
    location: {hostname: host, origin: 'https://' + host, pathname, hash},
    document: {createElement: () => ({dataset: {}}), head: {appendChild: s => scripts.push(s)}},
    addEventListener: (name, fn) => { listeners[name] = fn; }, URL,
  };
  context.window = context;
  if (page) { context.__page = page; context.PAGE_ROUTES = {home: '', news: 'news', meet: 'meet', admin: 'admin'}; }
  vm.runInNewContext(source, context);
  return {context, scripts, navigate: () => listeners['rwaf:pageview'](), views: () => Array.from(context.vaq || []).filter(a => a[0] === 'pageview').map(a => a[1].path)};
}
test('hash navigation counts each page once, excludes admin, and counts returning visits', () => {
  const app = boot({page: 'meet', hash: '#/meet'});
  assert.deepEqual(app.views(), ['/meet']);
  assert.equal(app.scripts[0].dataset.disableAutoTrack, '1');
  app.navigate();
  app.context.__page = 'news'; app.navigate(); app.navigate();
  app.context.__page = 'home'; app.navigate();
  app.context.__page = 'admin'; app.navigate();
  app.context.__page = 'home'; app.navigate();
  assert.deepEqual(app.views(), ['/meet', '/news', '/', '/']);
});
test('Research tabs and report pages receive distinct paths without arbitrary fragments', () => {
  const app = boot({pathname: '/research/', hash: '#wally'});
  app.context.location.hash = '#zeus'; app.navigate();
  app.context.location.hash = '#reports'; app.navigate();
  app.context.location.hash = '#private-input'; app.navigate();
  assert.deepEqual(app.views(), ['/research/wally', '/research/zeus', '/research/']);
  assert.deepEqual(boot({pathname: '/research/rwa-perps-sep-2026/'}).views(), ['/research/rwa-perps-sep-2026/']);
});
test('collector redacts query strings and fragments, and refuses custom data events', () => {
  const app = boot({page: 'news'});
  const filter = app.context.vaq.find(a => a[0] === 'beforeSend')[1];
  assert.equal(filter({type: 'pageview', url: 'https://www.rwaf.xyz/news?email=private@example.com#secret'}).url, 'https://www.rwaf.xyz/news');
  assert.equal(filter({type: 'event', payload: {name: 'form'}}), null);
  assert.deepEqual(boot({page: 'admin'}).views(), []);
});
test('production and staging use their own same-origin collectors; previews and localhost send nothing', () => {
  for (const host of ['rwaf.xyz', 'wallyproduction.vercel.app', 'wallystaging.vercel.app']) {
    const app = boot({host}); assert.equal(app.scripts[0].src, '/_vercel/insights/script.js');
  }
  for (const host of ['localhost', '127.0.0.1', 'wallyproduction-preview.vercel.app']) {
    const app = boot({host}); assert.equal(app.scripts.length, 0); assert.deepEqual(app.views(), []);
  }
});
