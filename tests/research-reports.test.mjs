import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog, importedReports, renderInline, renderReport, renderCatalog, renderCredits, creditNames} from '../scripts/research-reports.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const hash = data => createHash('sha256').update(data).digest('hex');
const audit = JSON.parse(read('docs/research-x-review-2026-10-15.json'));

test('research catalog contains every reviewed report exactly once, including both original editions', () => {
  assert.equal(catalog.reports.length, 17);
  assert.equal(importedReports.length, 15);
  assert.equal(new Set(catalog.reports.map(r => r.id)).size, 17);
  assert.equal(new Set(catalog.reports.map(r => r.slug)).size, 17);
  assert.equal(audit.reportEditions, 17);
  assert.equal(audit.articlesReviewed, audit.reports.length + audit.otherArticles.length);
  const html = read('research/index.html');
  assert.match(html, /6 SERIES · 17 REPORTS/);
  for (const report of catalog.reports) {
    assert.equal(html.split(`href="/research/${report.slug}/"`).length - 1, 1, report.slug);
    assert.ok(catalog.series.some(s => s.id === report.series));
  }
  assert.match(html, /Early September 2026/);
  assert.equal(catalog.reports.find(r => r.slug === 'rwa-perps-sep-2026').asOf, '2026-09-03');
});

test('full report text and all original chart files match the reviewed import', () => {
  let figures = 0;
  for (const report of importedReports) {
    const data = JSON.parse(read(`data/reports/${report.slug}.json`));
    const check = audit.reports.find(row => row.id === report.id).contentCheck;
    const text = data.blocks.filter(b => b.type !== 'figure');
    assert.equal(text.length, check.sourceTextBlocks, report.slug);
    assert.equal(hash(text.map(b => b.text).join('\n')), check.textSha256, report.slug);
    for (const block of text) assert.equal(block.parts.map(part => part.text).join(''), block.text);
    const chartBlocks = data.blocks.filter(b => b.type === 'figure');
    figures += chartBlocks.length;
    assert.equal(chartBlocks.length, report.figureCount);
    for (const block of chartBlocks) for (const image of block.images) {
      const bytes = fs.readFileSync(new URL('..' + image.src, import.meta.url));
      assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8');
      assert.equal(hash(bytes), check.images[image.src]);
      assert.ok(image.width > 0 && image.height > 0);
    }
  }
  assert.equal(figures, 171);
});

test('generated reports preserve rich text, dates, partner credits, figures and publication links', () => {
  for (const report of importedReports) {
    const data = JSON.parse(read(`data/reports/${report.slug}.json`));
    const html = read(`research/${report.slug}/index.html`);
    assert.match(html, new RegExp(report.sourceUrl));
    assert.ok(html.includes(`datetime="${report.publishedAt}"`));
    for (const name of creditNames(report)) assert.ok(html.includes(name));
    assert.equal((html.match(/<figure id="figure-/g) || []).length, report.figureCount);
    for (const block of data.blocks.filter(b => b.type !== 'figure')) assert.ok(html.includes(renderInline(block.parts).replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n')), report.slug);
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
    assert.doesNotMatch(html, /<img[^>]+src="https:\/\/pbs/);
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [,anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor));
  }
});

test('imported text is escaped and only secure links are rendered; consecutive lists remain semantic', () => {
  assert.equal(renderInline([{text:'<script>&', href:'javascript:alert(1)'}]), '&lt;script&gt;&amp;');
  assert.match(renderInline([{text:'A & B', href:'https://example.com/?x="', bold:true}]), /href="https:\/\/example.com\/\?x=&quot;"/);
  const sample = {...importedReports[0], blocks:[
    {type:'list-item',parts:[{text:'One'}]}, {type:'list-item',parts:[{text:'Two'}]},
    {type:'paragraph',parts:[{text:'End'}]},
  ]};
  assert.equal(renderReport('{{CONTENT}}', sample), '<ul>\n<li>One</li>\n<li>Two</li>\n</ul>\n<p>End</p>');
});


test('series credits include every distinct source across their reports and reject an unknown logo', () => {
  const html = renderCatalog();
  for (const series of catalog.series) {
    const card = html.match(new RegExp('<article class="series" id="series-' + series.id + '">([\\s\\S]*?)</article>'))[1];
    const names = [...new Set(catalog.reports.filter(r => r.series === series.id).flatMap(creditNames))];
    for (const name of names) assert.equal(card.split('alt="' + name + '"').length - 1, 1);
  }
  const avalanche = catalog.reports.find(r => r.slug === 'avalanche-rwa-growth-oct-2026');
  assert.deepEqual(avalanche.partners, ['RWA.xyz','Token Terminal','DefiLlama','Avalanche']);
  assert.equal(html.indexOf('id="series-blockchains"'), html.indexOf('id="series-'));
  assert.throws(() => renderCredits(['Unregistered Source']), /Missing research logo credit/);
});

test('partner logo filenames match their actual image formats, including the corrected DefiLlama SVG', () => {
  for (const credit of Object.values(catalog.partners)) {
    const bytes = fs.readFileSync(new URL('..' + credit.src, import.meta.url));
    if (credit.src.endsWith('.svg')) {
      assert.match(bytes.toString(), /<svg\b/);
      assert.doesNotMatch(bytes.toString(), /<script\b|<foreignObject\b|\sonload=/i);
    } else if (credit.src.endsWith('.png')) {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', credit.src);
    } else if (credit.src.endsWith('.jpg')) {
      assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8', credit.src);
    } else assert.fail('Unsupported logo format: ' + credit.src);
  }
  assert.equal(catalog.partners.DefiLlama.src, '/research/assets/defillama.svg');
  assert.doesNotMatch(read('research/index.html'), /defillama\.png/);
});
