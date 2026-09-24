// Shared, deterministic posting-date and featured-order rules (also exercised by tests).
(function(root){
  const DAY=86400000, WINDOWS=[7,30,60,90];
  function postedTime(job){
    // Imported jobs must have an employer publication date; never substitute checkedAt.
    const value=job.postedAt || (!job.imported && job.ts);
    const time=typeof value==='number'?value:Date.parse(value);
    return Number.isFinite(time)&&time>0?time:0;
  }
  function withinDays(job,days,now=Date.now()){
    const time=postedTime(job);
    return !!time && time<=now && now-time<=days*DAY;
  }
  function newest(a,b){
    return postedTime(b)-postedTime(a) || Number(!!b.member)-Number(!!a.member) || String(a.id).localeCompare(String(b.id));
  }
  function company(job){return String(job.memberName||job.company||job.sourceId||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
  function featured(jobs,now=Date.now()){
    const remaining=jobs.filter(j=>j.member&&withinDays(j,30,now)).slice().sort(newest), result=[];
    while(remaining.length){
      const n=result.length, last=n?company(result[n-1]):null;
      const blocked=n>1&&company(result[n-2])===last;
      const index=remaining.findIndex(j=>!blocked||company(j)!==last);
      if(index<0)break; // Excess roles remain available in the main list.
      result.push(remaining.splice(index,1)[0]);
    }
    // A single-company carousel stays static; repeating it would violate the frequency cap.
    if(new Set(result.map(company)).size<2)return result.slice(0,1);
    // Keep the cap at the carousel wraparound as well as inside the sequence.
    while(result.length>2){
      const n=result.length,first=company(result[0]),last=company(result[n-1]);
      if(last===first&&(company(result[1])===first||company(result[n-2])===first))result.pop();
      else break;
    }
    return result;
  }
  root.RWAFJobRecency={DAY,WINDOWS,postedTime,withinDays,newest,company,featured};
})(globalThis);
