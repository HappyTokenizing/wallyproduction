import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

export function sourceURL(value) {
  try {
  if (typeof value !== 'string' || value.length > 2000) throw Error('Enter a full HTTPS URL.');
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !u.hostname.includes('.') || isIP(u.hostname.replace(/[\[\]]/g, '')) || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(u.hostname)) throw Error('Use a public HTTPS website URL.');
  u.hash = '';
  return u.href;
  } catch {throw Object.assign(Error('Enter a public HTTPS website URL without credentials or a custom port.'),{status:400});}
}
export function canonicalURL(value) {
  try {
    const u = new URL(value); u.hash = ''; u.hostname = u.hostname.replace(/^www\./, '');
    for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|mc_)/i.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.href.replace(/\/$/, '');
  } catch { return ''; }
}
export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a,b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0,2,168].includes(b)) || (a === 198 && [18,19,51].includes(b)) || (a === 203 && b === 0));
  }
  // Permit global unicast only; deny transition, documentation and mapped addresses.
  return isIP(address) === 6 && /^[23]/i.test(address) && !/^(?:2001:|2002:|3fff:)/i.test(address);
}
export async function fetchSource(value, {resolve = lookup, request = https.get} = {}) {
  let url = sourceURL(value);
  for (let redirect = 0; redirect < 4; redirect++) {
    const u = new URL(url), addresses = await resolve(u.hostname, {all:true});
    if (!addresses.length || addresses.some(x => !publicAddress(x.address))) throw Error('This address is not a public website.');
    // Pin the vetted DNS result to the TLS request, including every redirect.
    const response = await new Promise((resolveResponse, reject) => {
      const selected = addresses[0];
      const req = request(u, {headers:{'User-Agent':'RWAF-Link-Review/1.0',Accept:'text/html','Accept-Encoding':'identity'}, lookup:(_host, options, cb) => options.all ? cb(null,[selected]) : cb(null,selected.address,selected.family)}, res => {
        if ([301,302,303,307,308].includes(res.statusCode)) {res.resume();resolveResponse({redirect:res.headers.location});return;}
        if (res.statusCode !== 200 || !/text\/html|application\/xhtml\+xml/i.test(res.headers['content-type'] || '')) {res.resume();reject(Error('The source could not be read. Enter the details below.'));return;}
        let size = 0; const chunks = [];
        res.on('data', chunk => {size += chunk.length;if(size > 1500000) req.destroy(Error('The source is too large to read automatically.'));else chunks.push(chunk);});
        res.on('end', () => resolveResponse({html:Buffer.concat(chunks).toString('utf8')}));res.on('error',reject);
      });
      const timeout = setTimeout(() => req.destroy(Error('The source took too long to respond.')), 8000);
      req.on('close',()=>clearTimeout(timeout));req.on('error',reject);
    });
    if (response.html !== undefined) return {html:response.html,url};
    if(!response.redirect)throw Error('The source redirect is missing a destination.');
    url = sourceURL(new URL(response.redirect, url).href);
  }
  throw Error('The source has too many redirects.');
}
const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”'};
export const plain = value => (typeof value === 'string' ? value : '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(m,k)=>{if(k[0]!=='#')return entities[k.toLowerCase()]??m;const n=parseInt(k.slice(k[1]?.toLowerCase()==='x'?2:1),k[1]?.toLowerCase()==='x'?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):' ';}).replace(/\s+/g,' ').trim();
export function extractSource(html, url, requested = 'auto') {
  const meta = {};
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(x=>[x[1].toLowerCase(),x[2]??x[3]??x[4]]));
    if (attrs.property || attrs.name) meta[(attrs.property || attrs.name).toLowerCase()] = plain(attrs.content);
  }
  const nodes = [];
  function walk(x,depth=0) {if(depth>12||nodes.length>500)return;if(Array.isArray(x)){x.forEach(v=>walk(v,depth+1));return;}if(x&&typeof x==='object'){nodes.push(x);if(x['@graph'])walk(x['@graph'],depth+1);if(x.mainEntity)walk(x.mainEntity,depth+1);}}
  for (const block of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {try{walk(JSON.parse(block[1]));}catch{}}
  const typed = type => nodes.find(x => [x['@type']].flat().some(t=>type.test(String(t))));
  const job = typed(/^JobPosting$/i), article = typed(/^(NewsArticle|Article|BlogPosting|ReportageNewsArticle)$/i), org = typed(/^(Organization|Corporation)$/i);
  const kind = requested === 'auto' ? job ? 'jobs' : article || meta['og:type']==='article' ? 'news' : 'ecosystem' : requested;
  const title = meta['og:title'] || plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const description = meta.description || meta['og:description'] || '';
  const warnings = [];
  let fields;
  if (kind === 'jobs') {
    const address = [job?.jobLocation].flat().filter(Boolean)[0]?.address;
    const location = [address?.addressLocality,address?.addressRegion,typeof address?.addressCountry==='object'?address.addressCountry.name:address?.addressCountry].filter(Boolean).join(', ');
    const type = {FULL_TIME:'Full time',PART_TIME:'Part time',CONTRACTOR:'Contract',INTERN:'Internship'}[[job?.employmentType].flat()[0]] || '';
    fields = {company:plain(job?.hiringOrganization?.name),role:plain(job?.title || title),description:plain(job?.description || description).slice(0,900),location,work:job?.jobLocationType==='TELECOMMUTE'?'Remote':'',type,comp:'',apply_to:url,tags:[]};
    if (fields.work==='Remote'&&!fields.location) fields.location=plain([job?.applicantLocationRequirements].flat()[0]?.name);
    if (job?.validThrough && Date.parse(job.validThrough)<Date.now()) warnings.push('The source says this job has expired. Confirm it is still open before publishing.');
    if (!job) warnings.push('No structured job listing found. Check the role details against the source.');
  } else if (kind === 'news') {
    const date = article?.datePublished || meta['article:published_time'];
    fields = {headline:plain(article?.headline || title).slice(0,300),summary:plain(article?.description || description).slice(0,1000),source:plain(article?.publisher?.name || meta['og:site_name'] || new URL(url).hostname).slice(0,120),published_at:date&&Number.isFinite(Date.parse(date))&&Date.parse(date)<=Date.now()+86400000?new Date(date).toISOString().slice(0,10):'',url};
    if (!fields.published_at) warnings.push('The source publication date is unknown. Add it if available; otherwise it will be marked unconfirmed.');
  } else {
    fields = {name:plain(org?.name || meta['og:site_name'] || title).slice(0,120),description:plain(org?.description || description).slice(0,1000),website:url,region:plain(org?.address?.addressCountry?.name || org?.address?.addressCountry),category:''};
  }
  if (/^(just a moment|access denied|sign in|log in|attention required|security check)/i.test(title)) {warnings.push('The source appears to be blocked. Enter and review the details manually.');if(kind==='news')fields.headline='';if(kind==='jobs')fields.role='';if(kind==='ecosystem')fields.name='';}
  return {kind,fields,warnings};
}
const words = text => new Set(plain(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[\p{L}\p{N}]+/gu)?.filter(x=>x.length>2&&!['the','and','for','with','from','that','into','its','has','are','this'].includes(x)) || []);
export function newsMatches(candidate, items) {
  const a = words(candidate.headline), results=[];
  const normalized = value => plain(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  for (const item of items) {
    if (canonicalURL(candidate.url)===canonicalURL(item.url)) {results.push({item,match:'exact',reason:'This URL is already in the news feed.'});continue;}
    const b=words(item.headline), overlap=[...a].filter(x=>b.has(x)).length, score=overlap/Math.max(a.size,b.size,1);
    const dates=[candidate.published_at,item.published_at].map(Date.parse);
    if(dates.every(Number.isFinite)&&Math.abs(dates[0]-dates[1])>14*86400000)continue;
    if(a.size>=4 && score>=0.5 && overlap>=4)results.push({item,match:normalized(candidate.headline)===normalized(item.headline)?'exact':'possible',reason:normalized(candidate.headline)===normalized(item.headline)?'The same headline is already live.':'This may cover the same announcement. Check before adding another article.',score});
  }
  return results.sort((a,b)=>(b.match==='exact')-(a.match==='exact')||(b.score||0)-(a.score||0)).slice(0,5);
}
