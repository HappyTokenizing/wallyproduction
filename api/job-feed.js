import { readFileSync } from 'node:fs';
import { collectJobs } from '../lib/job-feed.js';
const snapshot = JSON.parse(readFileSync(new URL('../data/jobs-snapshot.json', import.meta.url)));
let cached, expires=0, pending;
export default async function handler(req,res) {
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!cached || Date.now()>expires) {
    pending ||= collectJobs({snapshot}).then(data=>{cached=data;expires=Date.now()+30*60*1000;return data;}).finally(()=>{pending=null;});
    await pending;
  }
  res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=60');
  return res.status(200).json(cached);
}
