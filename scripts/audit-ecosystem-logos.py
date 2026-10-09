#!/usr/bin/env python3
"""Audit every directory logo against its official public website.

Discovery is not rebrand verification: candidate assets stay in an external cache,
never become defaults automatically. Network mode checks public pages only, with
blocked/historical domain protection at every redirect. Existing assets untouched.
"""
import argparse, concurrent.futures, hashlib, io, ipaddress, json, pathlib, re, threading, urllib.error, urllib.parse, urllib.request
from collections import Counter
from html.parser import HTMLParser
from PIL import Image
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATE = '2026-10-09'
CACHE = pathlib.Path('/private/tmp/rwaf-logo-audit-20261009')
MAX_BYTES = 4 * 1024 * 1024


def host(url):
    return (urllib.parse.urlparse(url).hostname or '').lower().rstrip('.')


def blocked(url, hosts):
    h = host(url)
    if urllib.parse.urlparse(url).scheme not in ('http', 'https') or not h or h == 'localhost':
        return True
    try:
        if not ipaddress.ip_address(h).is_global:
            return True
    except ValueError:
        pass
    return any(h == x or h.endswith('.' + x) for x in hosts)


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    http_error_308 = urllib.request.HTTPRedirectHandler.http_error_301
    def __init__(self, banned):
        self.banned = banned
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if blocked(newurl, self.banned):
            raise ValueError('Redirect to excluded host')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url, banned, limit=MAX_BYTES):
    if blocked(url, banned):
        raise ValueError('Excluded host or unsafe URL')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; RWAFDirectoryLogoAudit/1.0)', 'Accept': 'text/html,image/*;q=0.9,*/*;q=0.8'})
    with urllib.request.build_opener(SafeRedirect(banned)).open(req, timeout=12) as res:
        data = res.read(limit + 1)
        if len(data) > limit:
            raise ValueError('Response exceeds size limit')
        return data, res.geturl(), res.headers.get('Content-Type', ''), res.status


def describe(data):
    result = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    if b'<svg' in data[:2000].lower():
        try:
            root = ET.fromstring(data)
            if not root.tag.endswith('svg'):
                raise ValueError('Not an SVG root')
            unsafe = any(el.tag.split('}')[-1].lower() in ('script', 'foreignobject') or any(k.lower().startswith('on') or (k.split('}')[-1] in ('href','src') and not v.startswith('#') and not v.startswith('data:image/')) for k,v in el.attrib.items()) for el in root.iter())
            if unsafe:
                raise ValueError('SVG has active or external content')
            dims = root.get('viewBox', '').replace(',', ' ').split()
            w = float(re.sub('[^0-9.]','', root.get('width','0')) or 0)
            h = float(re.sub('[^0-9.]','', root.get('height','0')) or 0)
            if len(dims) == 4:
                w, h = float(dims[2]), float(dims[3])
            result.update(format='SVG', width=w, height=h, valid=True, scalable=True)
        except Exception as e:
            result.update(valid=False, issue=str(e))
    else:
        try:
            im = Image.open(io.BytesIO(data)); im.load()
            result.update(format=im.format, width=im.width, height=im.height, valid=True, scalable=False)
            if im.format == 'ICO':
                sizes = im.ico.sizes(); size=max(sizes,key=lambda s:s[0]*s[1]); result.update(width=size[0],height=size[1])
            if max(im.size) < 64:
                result['qualityFlag'] = 'Low resolution (less than 64 pixels)'
        except Exception as e:
            result.update(valid=False, issue=str(e)[:120])
    if result.get('width') and result.get('height'):
        result['aspectRatio'] = round(result['width']/result['height'], 3)
    return result


class Page(HTMLParser):
    def __init__(self, base):
        super().__init__(); self.base = base; self.assets=[]; self.title=''; self.in_title=False; self.text=[]
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); url = None; score = 0; reason = ''
        if tag == 'title': self.in_title=True
        if tag == 'link' and 'icon' in a.get('rel','').lower():
            url=a.get('href'); score=80; reason=a.get('rel')
            if 'apple-touch' in reason: score=95
            if url and '.svg' in url: score+=12
            sizes=re.findall(r'(\d+)x(\d+)',a.get('sizes',''))
            if sizes: score+=min(15,int(sizes[0][0])/32)
            if 'mask-icon' in reason: score=25
        if tag == 'img':
            evidence=' '.join((a.get(k) or '') for k in ('src','alt','class','id'))
            if re.search(r'logo|wordmark|brandmark|logotype', evidence, re.I):
                url=a.get('src') or a.get('data-src'); score=55; reason='logo image: '+a.get('alt','')
                if any(w in evidence.lower() for w in ('footer','partner','client','sponsor')): score=15
                if any(w in evidence.lower() for w in ('header','navbar','nav-logo')):score+=20
        if url and not url.startswith('data:'):
            self.assets.append({'url':urllib.parse.urljoin(self.base,url),'reason':reason,'score':score})
    def handle_endtag(self,tag):
        if tag == 'title':self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title+=data
        if len(self.text)<200:self.text.append(data)


def run_profile(profile, network, banned):
    pid=profile['id']; logo=profile.get('logo') or {}; src=logo.get('src'); record={'id':pid,'name':profile['name'],'directoryStatus':profile.get('directoryStatus'),'checkedOn':DATE,'currentLogo':logo,'status':'manual-review','candidates':[]}
    if src and src.startswith('/ecosystem/'):
        path=ROOT/src.lstrip('/'); record['local']={'exists':path.is_file()}
        if path.is_file():record['local'].update(describe(path.read_bytes()))
    else:record['local']={'exists':False,'issue':'No local logo'}
    if profile.get('directoryStatus') == 'historical' or profile.get('blockedWebsiteHosts'):
        record.update(status='historical',reason='Archived or excluded-domain record: existing logo preserved; no former website requested.')
        return record
    site=profile.get('website')
    if not site:
        record.update(status='missing' if not src else 'manual-review',reason='No verified official website recorded; no guessed domain requested.')
        return record
    if blocked(site,banned):
        record.update(status='manual-review',reason='Official website matches an excluded host; not requested.');return record
    if not network:
        record['reason']='Local audit only; official site not requested.';return record
    cache=CACHE/pid; cache.mkdir(parents=True,exist_ok=True)
    try:
        data,final,typ,status=fetch(site,banned)
        if 'html' not in typ:
            raise ValueError('Official URL did not return HTML')
        html=data.decode('utf-8','replace'); page=Page(final);page.feed(html)
        (cache/'page.html').write_text(html)
        record['site']={'requested':site,'resolved':final,'httpStatus':status,'title':page.title.strip()[:200]}
        page_text=' '.join(page.text)
        if re.search(r'This domain (is for sale|has expired)|domain name.*for sale|Buy this domain|website (is )?for sale',page_text,re.I):
            record.update(status='manual-review',reason='Possible parked domain; candidates not downloaded.');return record
        seen=set(); candidates=[]
        for candidate in sorted(page.assets,key=lambda a:-a['score']):
            if candidate['url'] in seen or blocked(candidate['url'],banned):continue
            seen.add(candidate['url']); candidates.append(candidate)
        # Also verify the exact previously sourced asset if the official page still references it.
        old_url=logo.get('sourceUrl')
        if old_url:
            matched=[c for c in candidates if c['url']==old_url]
            if matched:candidates=matched+[c for c in candidates if c['url']!=old_url]
        for i,candidate in enumerate(candidates[:2]):
            try:
                blob,resolved,typ,code=fetch(candidate['url'],banned)
                info=describe(blob)
                item={**candidate,'sourcePage':final,'resolvedUrl':resolved,'contentType':typ,**info}
                if info.get('valid'):
                    ext={'SVG':'svg','PNG':'png','JPEG':'jpg','ICO':'ico','WEBP':'webp','AVIF':'avif','GIF':'gif'}.get(info.get('format'),'img')
                    dest=cache/f'candidate-{i}.{ext}';dest.write_bytes(blob);item['cachePath']=str(dest)
                    item['matchesExistingBytes']=info['sha256']==record['local'].get('sha256')
                record['candidates'].append(item)
            except Exception as e:record['candidates'].append({**candidate,'error':str(e)[:200]})
        if any(c.get('matchesExistingBytes') for c in record['candidates']):
            record.update(status='verified-current',reason='Existing asset byte-for-byte matches a logo/icon referenced by the current official website.')
        elif any(c.get('valid') for c in record['candidates']):
            record.update(status='manual-review',reason='Official website logo candidates found; identity, framing and whether branding changed require review before replacement.')
        else:
            record.update(status='missing' if not src else 'manual-review',reason='Official website reachable but no validated logo/icon candidate could be downloaded.')
    except Exception as e:
        record.update(status='inaccessible',reason=str(e)[:200])
    return record


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--network',action='store_true');parser.add_argument('--workers',type=int,default=24);parser.add_argument('--resume',action='store_true');parser.add_argument('--retry-parser-errors',action='store_true');args=parser.parse_args()
    profiles=json.loads((ROOT/'data/ecosystem-directory.json').read_text())['profiles']
    banned={h.lower().removeprefix('www.') for p in profiles for h in p.get('blockedWebsiteHosts',[])}
    CACHE.mkdir(parents=True,exist_ok=True); lines=CACHE/'audit-progress.ndjson';results=[]
    existing={}
    if args.resume and lines.exists():
        for line in lines.read_text().splitlines():
            r=json.loads(line);existing[r['id']]=r
    if args.retry_parser_errors:
        existing={k:v for k,v in existing.items() if 'sequence item' not in v.get('reason','') and 'HTTP Error 308' not in v.get('reason','')}
    pending=[p for p in profiles if p['id'] not in existing];results=list(existing.values())
    with lines.open('a' if args.resume else 'w') as log, concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        tasks={pool.submit(run_profile,p,args.network,banned):p['id'] for p in pending}
        for future in concurrent.futures.as_completed(tasks):
            r=future.result();results.append(r);log.write(json.dumps(r)+'\n');log.flush()
            if len(results)%50==0:print(f'Audited {len(results)}/{len(profiles)}',flush=True)
    lookup={r['id']:r for r in results};results=[lookup[p['id']] for p in profiles]
    report={'checkedOn':DATE,'totalProfiles':len(profiles),'method':'Every local asset checked. Current official websites requested where safe; historical and blocked domains never fetched. Candidate discovery is not proof of newer branding; only manually accepted candidates may update defaults.','counts':dict(Counter(r['status'] for r in results)),'profiles':results}
    out=ROOT/'data/research/logo-audit-20261009.json';out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['counts']),flush=True)

if __name__=='__main__':main()
