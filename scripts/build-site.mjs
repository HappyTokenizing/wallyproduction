import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {pages,origin,aliases} from './site-pages.mjs';
import {catalog, importedReports, reportPages, renderCatalog, renderReport} from './research-reports.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,text)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),typeof text==='string'&&p.endsWith('.html')?text.replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n'):text);};
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function externalize(html){
 return html.replace(/data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)/g,(_,type,data)=>{
  const bytes=Buffer.from(data,'base64'),hash=createHash('sha256').update(bytes).digest('hex').slice(0,20);
  const extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'}[type];
  const name=`assets/embedded/${hash}.${extension}`;write(name,bytes);return '/'+name;
 });
}
function metadata(html,page){
 html=html.replace(/<meta charset="[^"]*">/g,'').replace(/<title>[^<]*<\/title>/g,'').replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,'').replace(/<link\b[^>]*rel="(?:canonical|icon|apple-touch-icon)"[^>]*>/g,'');
 const canonical=origin+page.path;
 const tags=`<title>${escape(page.title)}</title>\n<meta name="description" content="${escape(page.description)}">\n<link rel="canonical" href="${canonical}">\n<link rel="icon" type="image/png" sizes="128x128" href="/favicon.png">\n<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="RWA Foundation">\n<meta property="og:title" content="${escape(page.title)}">\n<meta property="og:description" content="${escape(page.description)}">\n<meta property="og:url" content="${canonical}">\n<meta property="og:image" content="${origin}/guide/assets/og.jpg">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${escape(page.title)}">\n<meta name="twitter:description" content="${escape(page.description)}">${page.noindex?'\n<meta name="robots" content="noindex,nofollow">':''}`;
 return html.replace(/<head[^>]*>/,m=>m+'\n<meta charset="utf-8">\n'+tags);
}
const menuLinks=[['/news/','News'],['/jobs/','Jobs'],['/ecosystem/','Ecosystem'],['/research/','Research'],['/learn/','RWAs explained'],['/guide/',"Wally's RWA Textbook"],['/meet/','Meet WALLY'],['/wally-nft/','WALLY NFT'],['/newsletter/','Newsletter'],['/media-kit/','Media kit'],['/members/','Our Members']].map(([href,label])=>`<a href="${href}">${escape(label)}</a>`).join('');
function siteChrome(html){
 html=html.replace(/(<div class="site-menu" id="site-menu" hidden>)[\s\S]*?(<\/div>)/,(_,open,close)=>open+menuLinks+close);
 html=html.replace(/(<div class="menu-group" aria-label="RWA Foundation">)[\s\S]*?(<\/div>)/,(_,open,close)=>open+'<span class="menu-h">RWA Foundation</span>'+menuLinks+close);

 html=html.replaceAll('https://rwaf.xyz/','https://www.rwaf.xyz/');
 for(const [from,to] of Object.entries({'/#/foundation':'/members/','/#/news':'/news/','/#/jobs':'/jobs/','/#/ecosystem':'/ecosystem/'}))html=html.replaceAll(from,to);
 html=html.replace(/<a href="\/">Home<\/a>/g,'');
 html=html.replace(/ aria-label="RWA Foundation home"/g,'');
 html=html.replace(/(<a class="nav-brand"[^>]*)(>)/g,'$1 aria-label="RWA Foundation home"$2');
 html=html.replace(/(<a class="nav-brand"[^>]*>)(<img[^>]*>)/g,'$1<img class="brand-mark" src="/assets/brand/rwaf-logo.png" alt="" width="58" height="44">');
 if(!html.includes('href="/assets/site-chrome.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/site-chrome.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap">\n</head>');
 if(!html.includes('src="/assets/legacy-routes.js"'))html=html.replace(/<head[^>]*>/,m=>m+'\n<script src="/assets/legacy-routes.js"></script>');
 return html;
}
let template=externalize(read('templates/site.html'));
const mainMatches=[...template.matchAll(/<main id="page-([\w-]+)"[^>]*>[\s\S]*?<\/main>/g)];
const mains=new Map(mainMatches.map(m=>[m[1],m[0]]));
if(mains.size!==13)throw Error(`Expected 13 page templates; found ${mains.size}`);
const members=[...mains.get('foundation').matchAll(/<div class="lw-tile(?: word)?">([\s\S]*?)<\/div>/g)].map((m,i)=>{
 const image=m[1].match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/);
 return image?{id:'d'+i,name:decode(image[2]),src:image[1]}:{id:'d'+i,name:decode(m[1].replace(/<[^>]+>/g,'').trim()),word:1};
});
if(members.length<18)throw Error('Member defaults were lost during page extraction');
write('assets/member-defaults.js','// Generated from the member roster in templates/site.html.\nwindow.RWAF_MEMBER_DEFAULTS='+JSON.stringify(members)+';\n');
write('assets/page-catalog.js','// Generated from scripts/site-pages.mjs.\nwindow.RWAF_PAGE_TITLES='+JSON.stringify(Object.fromEntries(pages.map(p=>[p.id,p.title])))+';\n');
// Share styles and scripts across page requests rather than duplicate them in every response.
let css=0,js=0;
template=template.replace(/<style>([\s\S]*?)<\/style>/g,(_,content)=>{const f=`assets/site-layout-${++css}.css`;write(f,content.trim()+'\n');return `<link rel="stylesheet" href="/${f}">`;});
template=template.replace(/<script>([\s\S]*?)<\/script>/g,(_,content)=>{const f=`assets/site-runtime-${++js}.js`;write(f,content.trim()+'\n');return `<script src="/${f}"></script>`;});
for(const page of pages.filter(p=>mains.has(p.id))){
 let html=template.replace(/<main id="page-([\w-]+)"[^>]*>[\s\S]*?<\/main>/g,(text,id)=>id===page.id?text.replace(/^<main\b[^>]*>/,tag=>tag.replace(/\shidden\b/,'')):'');
 html=html.replace('<body>',`<body data-page="${page.id}">`);
 html=metadata(html,page);
 // Set display modes before first paint (the JS boot uses the same flags).
 if(page.id==='eco'||page.id==='meet')html=html.replace('id="landing"',`id="landing" class="${page.id==='eco'?'eco':'meet'}-mode"`);
 write(page.path==='/'?'index.html':page.path.slice(1)+'index.html',html);
}
// Research and the generated textbook retain their engines; this layer supplies site-wide navigation and metadata.
for(const page of pages.filter(p=>['research','perpsReport','marketReport','guide'].includes(p.id))){
 const file=page.path.slice(1)+'index.html';
 let source=page.id==='research'?externalize(read('templates/research.html')).replace('{{REPORT_COUNT}}',`${catalog.series.length} SERIES · ${catalog.reports.length} REPORTS`).replace('{{REPORT_CATALOG}}',renderCatalog()):read(file);
 let html=siteChrome(source);
 html=metadata(html,page);write(file,html);
}
for(const [index, report] of importedReports.entries()){
 const data=JSON.parse(read(`data/reports/${report.slug}.json`));
 const html=renderReport(read('templates/research-report.html'),data);
 write(`research/${report.slug}/index.html`,metadata(siteChrome(html),reportPages[index]));
}
const research=read('research/index.html');
for(const page of pages.filter(p=>['wallyArticles','zeusArticles'].includes(p.id))){
 const tab=page.id==='wallyArticles'?'wally':'zeus';
 let html=metadata(research,page).replace('id="panel-reports" role=', 'id="panel-reports" hidden role=').replace('aria-labelledby="tab-wally" hidden','aria-labelledby="tab-'+tab+'"');
 html=html.replace('DATA THE HERD<br>CAN <span class="o">TRUST.</span>',tab==='wally'?'WALLY ARTICLES':'ZEUS’ CORNER');
 html=html.replace('<b>Research Reports from RWA Foundation</b> — recurring, data-driven views of the tokenization market, using credited data sources, with every edition kept in the archive.',escape(page.description));
 write(page.path.slice(1)+'index.html',html);
}
write('fast-submit/index.html',metadata(read('templates/fast-submit.html'),pages.find(p=>p.id==='fastSubmit')));
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.filter(p=>!p.noindex).map(p=>`  <url><loc>${origin+p.path}</loc></url>`).join('\n')+'\n</urlset>\n');
write('robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /templates/\nDisallow: /scripts/\nDisallow: /tests/\nDisallow: /vendor/\nDisallow: /data/research/\n\nSitemap: '+origin+'/sitemap.xml\n');
const config=JSON.parse(read('vercel.json'));
config.buildCommand='npm run build';config.outputDirectory='.';delete config.trailingSlash;
config.redirects=pages.filter(p=>p.path!=='/').map(p=>({source:p.path.slice(0,-1),destination:p.path,permanent:true})).concat(Object.entries(aliases).flatMap(([source,destination])=>[source.slice(0,-1),source].map(source=>({source,destination,permanent:true}))));
config.headers=[{source:'/fast-submit/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'Referrer-Policy',value:'no-referrer'}]},{source:'/assets/brand/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'}]},{source:'/assets/brand/rwa-foundation-logos.zip',headers:[{key:'Content-Disposition',value:'attachment; filename="RWA-Foundation-Logos.zip"'}]},{source:'/assets/brand/rwa-foundation-brand-guidelines.pdf',headers:[{key:'Content-Disposition',value:'attachment; filename="RWA-Foundation-Brand-Guidelines.pdf"'}]}];
write('vercel.json',JSON.stringify(config,null,2)+'\n');
console.log(`Built ${pages.length} pages with shared assets, canonical metadata, sitemap and robots.txt.`);
