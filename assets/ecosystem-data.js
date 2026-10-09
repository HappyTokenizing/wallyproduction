import {applyEcosystemUpdates} from './ecosystem-updates-model.js';

// One public dataset feeds the directory, profile cards and charts. A failed
// refresh keeps the last confirmed additions and warns instead of hiding them.
export function createDirectoryLoader(fetcher=fetch) {
  let basePromise, latest={records:[],updatedAt:null}, confirmed=false, pending;
  async function json(url) {
    const response=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Directory unavailable');
    return response.json();
  }
  return async function load() {
    if(pending)return pending;
    basePromise ||= json('/data/ecosystem-directory.json').catch(error=>{basePromise=null;throw error;});
    pending=(async()=>{
      let warning='';
      const [base]=await Promise.all([basePromise,(async()=>{
        try{
          const update=await json('/api/ecosystem');
          if(!Array.isArray(update.records))throw Error('Invalid directory updates');
          latest=update;confirmed=true;
        }catch{
          warning=confirmed?'Recent directory updates could not refresh. Showing the last confirmed version.':'Recent directory updates are unavailable. Showing the researched directory snapshot.';
        }
      })()]);
      return {data:applyEcosystemUpdates(base,latest),warning};
    })();
    try{return await pending;}finally{pending=null;}
  };
}
export const loadEcosystemData=createDirectoryLoader();
