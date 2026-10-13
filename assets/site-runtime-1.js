(function(){
    "use strict";
    var NW_URL="https://qrmbiestcjbedavsorrj.supabase.co";
    var NW_KEY="sb_publishable_CVXI0w69QnHwJSJYtbiJdg_dtXg6ot_"; /* publishable key — read-only */
    var NW={archiveQ:"",nextCursor:null,total:0,moreBusy:false,archive:null,items:[],hidden:[],cat:"All",q:"",loadedAt:0,err:null};
    var NW_MEMBERS=[];
    // The logo manager supplies the roster. Feed hints can identify a member,
    // but cannot grant membership to an organization absent from the logo wall.
    function nwWords(value){return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];}
    function nwKey(value){return nwWords(value).join("");}
    function nwMentions(words,key){
      for(var i=0;i<words.length;i++){
        var joined="";
        for(var j=i;j<words.length&&joined.length<key.length;j++){
          joined+=words[j];
          if(joined===key)return true;
        }
      }
      return false;
    }
    function nwMatchMembers(item){
      var headline=nwWords(item.t), summary=nwWords(item.b);
      var hints=item.memberHints.map(nwKey);
      return NW_MEMBERS.filter(function(member){
        return hints.indexOf(member.key)>=0||nwMentions(headline,member.key)||nwMentions(summary,member.key);
      }).map(function(member){return member.name;}).join(", ")||null;
    }
    window.nwSyncMembers=function(logos){
      var seen=new Set();
      NW_MEMBERS=logos.map(function(logo){return {name:logo.name,key:nwKey(logo.name)};}).filter(function(member){
        if(!member.key||seen.has(member.key))return false;
        seen.add(member.key);return true;
      });
      NW.items.forEach(function(item){item.m=nwMatchMembers(item);});
      if(NW.loadedAt)nwDraw();
    };
    var NW_TTL=10*60*1000;
    function nq(s){return document.querySelector(s)}
    function nesc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
    function nfmt(v){var d=new Date(v);if(isNaN(d))return String(v).slice(0,10);return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]+" "+d.getDate()+", "+d.getFullYear()}
    function nwFetch(){
      NW.archiveQ=NW.q;
      /* /api/news proxies rwanews.today (the key stays server-side) and is
         persisted by scheduled collection and paginated from permanent storage. The console's deleted
         ids come from the uncached ?hidden=1 variant, so a deletion vanishes
         for every visitor immediately instead of waiting out the cache. */
      var feed=fetch("/api/news"+(NW.archiveQ?"?q="+encodeURIComponent(NW.archiveQ):"")).then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); });
      var hid=fetch("/api/news?hidden=1")
        .then(function(r){ return r.ok?r.json():{ids:[]}; })
        .then(function(d){ return d.ids||[]; })
        .catch(function(){ return []; });
      return Promise.all([feed,hid]).then(function(res){
        NW.hidden=res[1];
        NW.nextCursor=res[0].nextCursor||null; NW.total=res[0].total||0; NW.archive=res[0].archive||null;
        NW.items=(res[0].items||[]).filter(function(x){return x.headline&&x.url}).map(nwItem);
        NW.items.forEach(function(item){item.m=nwMatchMembers(item);});
        NW.loadedAt=Date.now(); NW.err=null;
      }).catch(function(e){ NW.err=e.message||"network error"; });
    }
    function nwItem(x){
      var item={id:x.id||x.url,t:RwafCopy.text(x.headline),u:x.url,s:(x.source&&(x.source.name||x.source.domain))||"",d:x.published_at?nfmt(x.published_at):"",c:RwafCopy.newsSection(x.section||"News"),memberHints:Array.isArray(x.members)?x.members.filter(function(m){return typeof m==="string";}):[],m:null,b:RwafCopy.text(x.summary||"")};
      item.m=nwMatchMembers(item);return item;
    }
    window.nwLoadOlder=async function(){
      if(!NW.nextCursor||NW.moreBusy)return; NW.moreBusy=true;nwDraw();
      try{var r=await fetch('/api/news?cursor='+encodeURIComponent(NW.nextCursor)+(NW.archiveQ?'&q='+encodeURIComponent(NW.archiveQ):''));if(!r.ok)throw Error();var d=await r.json();
        var seen=new Set(NW.items.map(function(x){return x.id;}));
        (d.items||[]).forEach(function(x){if(!seen.has(x.id)){NW.items.push(nwItem(x));seen.add(x.id);}});
        NW.nextCursor=d.nextCursor||null;NW.total=d.total||NW.total;NW.moreError=false;
      }catch(e){NW.moreError=true;}finally{NW.moreBusy=false;nwDraw();}
    };
    function nwLive(){
      return NW.items.filter(function(x){ return NW.hidden.indexOf(x.id)<0; });
    }
    function nwCats(){
      var counts={};
      nwLive().forEach(function(x){counts[x.c]=(counts[x.c]||0)+1});
      var top=Object.keys(counts).filter(function(c){return c!=="All"&&c!=="RWAF Members";}).sort(function(a,b){return counts[b]-counts[a]}).slice(0,7);
      return ["All","RWAF Members"].concat(top);
    }
    function nwVisible(){
      var q=NW.q.toLowerCase();
      return nwLive().filter(function(x){
        if(NW.cat==="RWAF Members"&&!x.m)return false;
        if(NW.cat!=="All"&&NW.cat!=="RWAF Members"&&x.c!==NW.cat)return false;
        if(q&&(x.t+" "+x.s+" "+(x.m||"")+" "+x.b).toLowerCase().indexOf(q)<0)return false;
        return true;
      });
    }
    function nwDraw(){
      var chips=nq("#nwChips"), list=nq("#nwList"), st=nq("#nwStatus");
      if(!chips||!list)return;
      if(NW.err){
        st.innerHTML="feed unavailable";
        list.innerHTML='<div class="nw-err"><b>Couldn\'t reach the news engine</b> ('+nesc(NW.err)+'). <button class="btn btn-ghost btn-sm" onclick="nwReload()">Try again</button></div>';
        chips.innerHTML=""; return;
      }
      if(!NW.loadedAt){ st.textContent="connecting…"; list.innerHTML='<div class="nw-empty">Loading the feed…</div>'; chips.innerHTML=""; return; }
      st.innerHTML='<span class="dot">●</span> '+nwLive().length+' loaded'+(NW.total?' of '+NW.total+' archived stories':'')+(NW.archive&&NW.archive.warning?' · '+nesc(NW.archive.warning):'');
      chips.innerHTML=nwCats().map(function(c,i){
        var member=c==="RWAF Members", count=nwLive().filter(function(x){return !!x.m;}).length;
        return '<button type="button" class="nw-chip'+(member?' members':'')+(c===NW.cat?" on":"")+'" aria-pressed="'+(c===NW.cat)+'" data-news-category="'+i+'">'+nesc(c)+(member?'<span class="nw-chip-count">'+count+'</span>':'')+'</button>';
      }).join("");
      chips.onclick=function(event){
        var button=event.target.closest('[data-news-category]');
        if(button)window.nwSetCat(nwCats()[Number(button.dataset.newsCategory)]);
      };
      var vis=nwVisible();
      list.innerHTML=vis.length?vis.map(function(x){
        return '<a class="nw-card'+(x.m?' member':'')+'" href="'+nesc(x.u)+'" target="_blank" rel="noopener">'+
          (x.m?'<div class="nw-member-line"><span class="nw-member-badge"><span aria-hidden="true">✦</span> RWAF Member</span><span class="nw-member-names">'+nesc(x.m)+'</span></div>':"")+
          '<div class="nw-meta"><span>'+nesc(x.s)+'</span><span>·</span><span>'+nesc(x.d)+'</span>'+
          '<span class="nw-tag">'+nesc(x.c)+'</span></div>'+
          '<h3>'+nesc(x.t)+'</h3>'+
          (x.b?'<p class="nw-blurb">'+nesc(x.b)+'</p>':"")+
        '</a>';
      }).join(""):'<div class="nw-empty">'+(NW.cat==="RWAF Members"?'No RWAF member stories match the current feed and search.':'No loaded stories match. Load older stories to continue browsing the archive.')+'</div>';
      if(NW.nextCursor)list.innerHTML+='<div class="nw-archive-more"><button class="btn btn-ghost" onclick="nwLoadOlder()" '+(NW.moreBusy?'disabled':'')+'>'+(NW.moreBusy?'Loading…':NW.moreError?'Retry loading older stories':'Load older stories')+'</button></div>';
    }
    window.nwSetCat=function(c){NW.cat=c;nwDraw()};
    window.nwSetQ=function(v){NW.q=v||"";nwDraw()};
    window.nwReload=function(){NW.err=null;NW.loadedAt=0;nwDraw();nwFetch().then(nwDraw)};
    window.renderNewsPage=function(){
      // Recheck the roster when returning to news, including edits from other sessions.
      if(window.nwRefreshMembers)window.nwRefreshMembers();
      nwDraw();
      if(Date.now()-NW.loadedAt>NW_TTL){ nwFetch().then(nwDraw); }
    };
    /* console hook: fresh items + hidden ids for the admin News tab */
    window.nwAdminLoad=function(){ return nwFetch().then(function(){ if(NW.err) throw new Error(NW.err); nwDraw(); return {items:NW.items, hidden:NW.hidden}; }); };
  })();
