import fs from 'node:fs';

export const catalog = JSON.parse(fs.readFileSync(new URL('../data/research-reports.json', import.meta.url), 'utf8'));
export const importedReports = catalog.reports.filter(report => !report.existing);
export const reportPages = importedReports.map(report => ({
  id: 'report-' + report.slug,
  path: '/research/' + report.slug + '/',
  title: `${report.shortTitle} — ${report.edition} · RWA Foundation`,
  description: report.description,
}));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const date = value => new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(value));
export const creditNames = report => [...new Set(report.partners || [])];
export function renderCredits(names) {
  return '<div class="credit-group">' + [...new Set(names)].map(name => {
    const credit = catalog.partners[name];
    if (!credit) throw new Error('Missing research logo credit: ' + name);
    if (!credit.src.startsWith('/') || credit.src.startsWith('//')) throw new Error('Research logos must be local');
    return `<a class="credit ${credit.variant} ${credit.background}" href="${escape(credit.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(name)}"><img src="${escape(credit.src)}" alt="${escape(name)}">${credit.variant === 'symbol' ? `<span aria-hidden="true">${escape(name)}</span>` : ''}</a>`;
  }).join('') + '</div>';
}
const creditList = report => creditNames(report).join(', ');

export function renderCatalog() {
  const newest = series => catalog.reports.filter(r => r.series === series.id).map(r => r.publishedAt).sort().at(-1) || '';
  return [...catalog.series].sort((a,b) => newest(b).localeCompare(newest(a))).map(series => {
    const index = catalog.series.findIndex(s => s.id === series.id);
    const editions = catalog.reports.filter(report => report.series === series.id).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const credits = [...new Set(editions.flatMap(creditNames))];
    const creditLabel = editions.some(r => r.creditLabel) ? 'DATA & REPORTING SOURCES' : (credits.length > 1 ? 'DATA PARTNERS' : 'DATA PARTNER');
    return `<article class="series" id="series-${series.id}"><div class="series-in">
      <div class="series-top"><div><div class="kicker">SERIES ${String(index + 1).padStart(2, '0')} · ${escape(series.kicker)}</div><h2>${escape(series.name)}</h2><p class="desc">${escape(series.description)}</p></div>
      <div class="partner"><span class="k">${creditLabel}</span>${renderCredits(credits)}</div></div>
      <div class="editions">${editions.map((report, i) => `<a class="ed" href="/research/${report.slug}/"><span class="date">${escape(report.edition)}</span><span class="name">${escape(report.shortTitle)}<small>${report.existing ? '' : `${report.figureCount} figures · `}${escape(report.asOf ? 'Data as of ' + date(report.asOf) : 'Published ' + date(report.publishedAt))}</small></span>${i === 0 ? '<span class="tag">LATEST</span>' : '<span></span>'}<span class="arr" aria-hidden="true">→</span></a>`).join('\n')}</div>
    </div></article>`;
  }).join('\n');
}

export function renderInline(parts) {
  return parts.map(part => {
    let text = escape(part.text);
    if (part.bold) text = `<strong>${text}</strong>`;
    if (part.italic) text = `<em>${text}</em>`;
    if (part.href && /^https:\/\//.test(part.href)) text = `<a href="${escape(part.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    return text;
  }).join('');
}

export function renderReport(template, report) {
  let heading = 0, list = '', section = '';
  const toc = [], output = [];
  const closeList = () => { if (list) output.push(`</${list}>`); list = ''; };
  for (const block of report.blocks) {
    if (block.type === 'list-item' || block.type === 'ordered-item') {
      const tag = block.type === 'ordered-item' ? 'ol' : 'ul';
      if (list !== tag) { closeList(); output.push(`<${tag}>`); list = tag; }
      output.push(`<li>${renderInline(block.parts)}</li>`);
      continue;
    }
    closeList();
    if (block.type === 'heading') {
      const id = `section-${++heading}`;
      section = block.text;
      toc.push(`<a href="#${id}"><span>${String(heading).padStart(2, '0')}</span>${escape(block.text)}</a>`);
      output.push(`<h2 id="${id}"><span class="section-number">${String(heading).padStart(2, '0')}</span>${renderInline(block.parts)}</h2>`);
    } else if (block.type === 'subheading') {
      section = block.text;
      output.push(`<h3>${renderInline(block.parts)}</h3>`);
    } else if (block.type === 'figure') {
      output.push(`<figure id="figure-${block.number}">${block.images.map(image => `<a href="${escape(image.src)}" target="_blank" rel="noopener" aria-label="Open figure ${block.number} at full size"><img src="${escape(image.src)}" alt="${escape(block.caption || `${report.shortTitle}: ${section || 'source data'}, figure ${block.number}. Analysis is provided in the surrounding text.`)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></a>`).join('')}<figcaption><span>FIGURE ${String(block.number).padStart(2, '0')} · ${escape(block.credit || creditList(report))}${block.caption ? ' — ' + escape(block.caption) : ''}</span><a href="${escape(block.images[0].src)}" download>Download chart ↓</a></figcaption></figure>`);
    } else {
      output.push(`<p>${renderInline(block.parts)}</p>`);
    }
  }
  closeList();
  const related = catalog.reports.filter(item => item.series === report.series && item.id !== report.id).slice(0, 3);
  const fields = {
    TITLE: escape(report.shortTitle), EDITION: escape(report.edition),
    DESCRIPTION: escape(report.description), PARTNER: renderCredits(creditNames(report)),
    PARTNER_NAME: escape(creditList(report)), BYLINE: creditNames(report).length > 1 ? 'Data & reporting sources' : 'RWA Foundation ×', BAND_CREDIT: creditNames(report).length > 1 ? 'RWA FOUNDATION' : escape(creditList(report)), SOURCE: escape(report.sourceUrl),
    PUBLISHED: date(report.publishedAt), PUBLISHED_ISO: report.publishedAt,
    DATA_DATE: report.asOf ? `<span>DATA AS OF</span><strong>${date(report.asOf)}</strong>` : '<span>DATA WINDOW</span><strong>See the original report below</strong>',
    WINDOW: escape(report.window), FIGURES: report.figureCount,
    CONTENT: output.join('\n'),
    CONTENTS: toc.length ? `<details class="contents"><summary>In this report <span>${toc.length} sections</span></summary><nav aria-label="Report contents">${toc.join('\n')}</nav></details>` : '',
    RELATED: related.length ? `<section class="related"><div class="eyebrow">MORE IN THIS SERIES</div>${related.map(item => `<a href="/research/${item.slug}/"><strong>${escape(item.shortTitle)}</strong><span>${escape(item.edition)} →</span></a>`).join('')}</section>` : '',
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => { if (!(key in fields)) throw new Error('Unknown report template field ' + key); return fields[key]; });
}
